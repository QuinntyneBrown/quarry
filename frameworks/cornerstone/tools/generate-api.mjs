import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, relative, resolve } from 'node:path';
import ts from 'typescript';
import { format, resolveConfig } from 'prettier';

const root = resolve(import.meta.dirname, '..');
const libraryRoot = resolve(root, 'src/cornerstone');
const symbols = [];
const visited = new Set();
const componentSources = [];
const categories = JSON.parse(
  readFileSync(resolve(root, 'tools/component-categories.json'), 'utf8'),
);

function exported(node) {
  return Boolean(node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword));
}

function modulePath(file, specifier) {
  const base = resolve(dirname(file), specifier);
  for (const candidate of [`${base}.ts`, resolve(base, 'index.ts')]) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`Cannot resolve ${specifier} from ${relative(root, file)}.`);
}

function documentation(node, sourceFile) {
  const comments = ts.getJSDocCommentsAndTags(node);
  const text = comments
    .flatMap((comment) => (comment.comment ? [String(comment.comment)] : []))
    .join(' ')
    .replaceAll(/\s+/g, ' ')
    .trim();
  if (text) return text;
  const name = node.name && ts.isIdentifier(node.name) ? node.name.text : '';
  return name ? `${humanize(name)} public API.` : `${basename(sourceFile.fileName)} public API.`;
}

function humanize(value) {
  return value
    .replace(/Component$/, '')
    .replace(/Directive$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll('-', ' ')
    .replace(/^./, (letter) => letter.toUpperCase());
}

function categoryFor(name) {
  if (!categories[name])
    throw new Error(`Assign a catalog category to ${name} in tools/component-categories.json.`);
  return categories[name];
}

function literalText(node, sourceFile) {
  return node ? node.getText(sourceFile) : undefined;
}

function initializerCall(node) {
  if (!node.initializer || !ts.isCallExpression(node.initializer)) return undefined;
  const expression = node.initializer.expression;
  if (ts.isIdentifier(expression)) return { call: expression.text, expression: node.initializer };
  if (
    ts.isPropertyAccessExpression(expression) &&
    ts.isIdentifier(expression.expression) &&
    ['input', 'model'].includes(expression.expression.text) &&
    expression.name.text === 'required'
  ) {
    return { call: `${expression.expression.text}.required`, expression: node.initializer };
  }
  return undefined;
}

function inferType(call, sourceFile) {
  const declared = call.typeArguments?.[0];
  if (declared) return declared.getText(sourceFile);
  const value = call.arguments[0];
  if (!value) return 'unknown';
  if (ts.isStringLiteralLike(value)) return 'string';
  if (ts.isNumericLiteral(value)) return 'number';
  if (value.kind === ts.SyntaxKind.TrueKeyword || value.kind === ts.SyntaxKind.FalseKeyword)
    return 'boolean';
  if (ts.isArrayLiteralExpression(value)) return 'readonly unknown[]';
  if (ts.isObjectLiteralExpression(value)) return 'Record<string, unknown>';
  return 'unknown';
}

function aliasFrom(call) {
  for (const argument of call.arguments) {
    if (!ts.isObjectLiteralExpression(argument)) continue;
    const alias = argument.properties.find(
      (property) =>
        ts.isPropertyAssignment(property) &&
        ts.isIdentifier(property.name) &&
        property.name.text === 'alias',
    );
    if (alias && ts.isPropertyAssignment(alias) && ts.isStringLiteralLike(alias.initializer)) {
      return alias.initializer.text;
    }
  }
  return undefined;
}

function componentMetadata(node, sourceFile) {
  for (const modifier of node.modifiers ?? []) {
    if (!ts.isDecorator(modifier) || !ts.isCallExpression(modifier.expression)) continue;
    const decorator = modifier.expression;
    if (!ts.isIdentifier(decorator.expression) || decorator.expression.text !== 'Component')
      continue;
    const metadata = decorator.arguments[0];
    if (!metadata || !ts.isObjectLiteralExpression(metadata)) return {};
    const values = {};
    for (const property of metadata.properties) {
      if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) continue;
      if (
        ['selector', 'templateUrl', 'styleUrl'].includes(property.name.text) &&
        ts.isStringLiteralLike(property.initializer)
      ) {
        values[property.name.text] = property.initializer.text;
      }
    }
    return values;
  }
  return undefined;
}

function classMembers(node, sourceFile) {
  const members = [];
  for (const member of node.members) {
    if (
      (ts.isPropertyDeclaration(member) || ts.isGetAccessorDeclaration(member)) &&
      member.name &&
      ts.isIdentifier(member.name)
    ) {
      if (member.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ProtectedKeyword))
        continue;
      const initialized = ts.isPropertyDeclaration(member) ? initializerCall(member) : undefined;
      if (
        initialized &&
        ['input', 'input.required', 'model', 'model.required', 'output'].includes(initialized.call)
      ) {
        const role =
          initialized.call === 'input.required'
            ? 'input'
            : initialized.call.replace('.required', '');
        const required = initialized.call.endsWith('.required');
        members.push({
          name: member.name.text,
          bindingName: aliasFrom(initialized.expression) ?? member.name.text,
          role,
          type: inferType(initialized.expression, sourceFile),
          required,
          defaultValue:
            required || initialized.call === 'output'
              ? undefined
              : literalText(initialized.expression.arguments[0], sourceFile),
          description: documentation(member, sourceFile),
        });
      } else if (ts.isGetAccessorDeclaration(member)) {
        members.push({
          name: member.name.text,
          role: 'property',
          type: member.type?.getText(sourceFile) ?? 'unknown',
          description: documentation(member, sourceFile),
        });
      }
      continue;
    }
    if (
      ts.isMethodDeclaration(member) &&
      member.name &&
      ts.isIdentifier(member.name) &&
      !member.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ProtectedKeyword)
    ) {
      const parameters = member.parameters.map((parameter) => ({
        name: parameter.name.getText(sourceFile),
        type: parameter.type?.getText(sourceFile) ?? 'unknown',
        optional: Boolean(parameter.questionToken || parameter.initializer),
      }));
      members.push({
        name: member.name.text,
        role: 'method',
        type: member.type?.getText(sourceFile) ?? 'void',
        parameters,
        description: documentation(member, sourceFile),
      });
    }
  }
  return members;
}

function readCompanion(file, configured, fallbackExtension) {
  const target = configured
    ? resolve(dirname(file), configured)
    : resolve(dirname(file), `${basename(file, '.component.ts')}.component.${fallbackExtension}`);
  return existsSync(target) ? readFileSync(target, 'utf8') : '';
}

function visit(file) {
  if (visited.has(file)) return;
  visited.add(file);
  const source = readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const sourcePath = relative(root, file).replaceAll('\\', '/');

  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement)) {
      if (statement.moduleSpecifier && ts.isStringLiteralLike(statement.moduleSpecifier)) {
        const target = modulePath(file, statement.moduleSpecifier.text);
        if (!statement.exportClause) visit(target);
        if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
          for (const element of statement.exportClause.elements) {
            const localName = element.propertyName?.text ?? element.name.text;
            if (localName !== element.name.text) {
              symbols.push({
                kind: 'alias',
                name: element.name.text,
                sourcePath,
                description: `${humanize(element.name.text)} alias.`,
              });
            }
          }
        }
      }
      continue;
    }

    if (!exported(statement)) continue;
    if (
      ts.isClassDeclaration(statement) ||
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement) ||
      ts.isEnumDeclaration(statement) ||
      ts.isFunctionDeclaration(statement)
    ) {
      if (!statement.name) continue;
      const kind = ts.isTypeAliasDeclaration(statement)
        ? 'type'
        : ts.SyntaxKind[statement.kind].replace('Declaration', '').toLowerCase();
      const entry = {
        kind,
        name: statement.name.text,
        sourcePath,
        category: categoryFor(statement.name.text),
        description: documentation(statement, sourceFile),
      };
      if (ts.isTypeAliasDeclaration(statement))
        entry.declaration = statement.type.getText(sourceFile);
      if (ts.isInterfaceDeclaration(statement)) {
        entry.members = statement.members
          .filter((member) => member.name)
          .map((member) => ({
            name: member.name.getText(sourceFile),
            role: 'property',
            type: member.type?.getText(sourceFile) ?? 'unknown',
            required: !member.questionToken,
            description: documentation(member, sourceFile),
          }));
      }
      if (ts.isClassDeclaration(statement)) {
        entry.members = classMembers(statement, sourceFile);
        const component = componentMetadata(statement, sourceFile);
        if (component) {
          entry.component = true;
          entry.selector = component.selector ?? '';
          entry.slug = (component.selector ?? statement.name.text)
            .replace(/^cs-/, '')
            .replace(/Component$/, '')
            .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
            .toLowerCase();
          entry.label = humanize(statement.name.text);
          const bundle = {
            ts: source,
            html: readCompanion(file, component.templateUrl, 'html'),
            scss: readCompanion(file, component.styleUrl, 'scss'),
          };
          entry.tokens = [...new Set(bundle.scss.match(/--cs-[a-z0-9-]+/g) ?? [])].sort();
          componentSources.push([entry.slug, bundle]);
        }
      }
      symbols.push(entry);
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue;
        symbols.push({
          kind: 'const',
          name: declaration.name.text,
          sourcePath,
          category: categoryFor(declaration.name.text),
          description: documentation(statement, sourceFile),
          declaration: declaration.type?.getText(sourceFile) ?? 'unknown',
        });
      }
    }
  }
}

visit(resolve(root, 'src/cornerstone/public-api.ts'));

const unique = [...new Map(symbols.map((entry) => [entry.name, entry])).values()].sort((a, b) =>
  a.name.localeCompare(b.name),
);
const components = unique.filter(
  (entry) => entry.component && !entry.sourcePath.includes('/testing/'),
);
for (const component of components) {
  const directory = dirname(component.sourcePath);
  const referencedTypes = new Set(
    (component.members ?? [])
      .flatMap((member) => [
        member.type,
        ...(member.parameters ?? []).map((parameter) => parameter.type),
      ])
      .flatMap((type) => type.match(/[A-Za-z_$][\w$]*/g) ?? []),
  );
  component.relatedSymbols = unique
    .filter(
      (entry) =>
        entry.name !== component.name &&
        (dirname(entry.sourcePath) === directory || referencedTypes.has(entry.name)),
    )
    .map((entry) => entry.name);
  for (const member of component.members ?? []) {
    const typeEntry = unique.find((entry) => entry.name === member.type);
    member.structured = unique.some(
      (entry) => entry.kind === 'interface' && new RegExp(`\\b${entry.name}\\b`).test(member.type),
    );
    member.options = typeEntry?.declaration
      ? [...typeEntry.declaration.matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1])
      : [];
  }
}
const catalog = {
  symbolCount: unique.length,
  components: components.map(({ name, label, slug, selector, category, description }) => ({
    name,
    label,
    slug,
    selector,
    category,
    description,
  })),
};

const markdown = `# Public API surface\n\nGenerated by \`npm run api:generate\`.\n\n${unique
  .map((entry) => `- \`${entry.name}\` (${entry.kind}) — \`${entry.sourcePath}\``)
  .join('\n')}\n`;
const manifest = { symbols: unique, components };
const json = `${JSON.stringify(manifest, null, 2)}\n`;
const registry = `/* Generated by tools/generate-api.mjs. Do not edit. */\nimport { Type } from '@angular/core';\n\nexport const componentRegistry: Readonly<Record<string, () => Promise<Type<unknown>>>> = {\n${components
  .map(
    (component) =>
      `  ${JSON.stringify(component.slug)}: () => import('@quinntyne/cornerstone').then((library) => library.${component.name} as Type<unknown>),`,
  )
  .join('\n')}\n};\n`;
const targets = [
  [resolve(root, 'docs/api-surface.md'), markdown],
  [resolve(root, 'src/docs-app/generated/catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`],
  [resolve(root, 'src/docs-app/generated/component-registry.constant.ts'), registry],
  [resolve(root, 'src/docs-app/public/generated/api.json'), json],
  [resolve(root, 'src/e2e-app/generated/component-registry.constant.ts'), registry],
  [resolve(root, 'src/e2e-app/generated/components.json'), JSON.stringify(components)],
  ...components.map((component) => [
    resolve(root, `src/docs-app/public/generated/components/${component.slug}.json`),
    `${JSON.stringify(
      {
        ...component,
        relatedEntries: unique.filter((entry) => component.relatedSymbols.includes(entry.name)),
      },
      null,
      2,
    )}\n`,
  ]),
  ...componentSources.map(([slug, source]) => [
    resolve(root, `src/docs-app/public/generated/sources/${slug}.json`),
    `${JSON.stringify(source)}\n`,
  ]),
];

const check = process.argv.includes('--check');
let changed = false;
const formatOptions = await resolveConfig(resolve(root, '.prettierrc'));
for (const [target, rawContent] of targets) {
  const content = await format(rawContent, { ...formatOptions, filepath: target });
  if (check) {
    if (!existsSync(target) || readFileSync(target, 'utf8') !== content) {
      console.error(`Generated API output is stale: ${relative(root, target)}`);
      changed = true;
    }
  } else {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
}
if (components.length !== 148) {
  console.error(`Expected 148 public components, found ${components.length}.`);
  changed = true;
}
if (changed) process.exitCode = 1;
else
  console.log(
    `${unique.length} public symbols and ${components.length} components ${check ? 'verified' : 'documented'}.`,
  );
