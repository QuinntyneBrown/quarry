import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';
import ts from 'typescript';

const root = resolve(import.meta.dirname, '..');
const libraryRoot = resolve(root, 'src/cornerstone');
const categories = JSON.parse(
  readFileSync(resolve(root, 'tools/component-categories.json'), 'utf8'),
);
const sourceRoots = [
  resolve(root, 'src/cornerstone'),
  resolve(root, 'src/docs-app'),
  resolve(root, 'src/dev-app'),
  resolve(root, 'src/e2e-app'),
];
const files = [];

function visit(directory) {
  for (const name of readdirSync(directory)) {
    const path = resolve(directory, name);
    if (statSync(path).isDirectory() && !['generated', 'public'].includes(name)) visit(path);
    else if (name.endsWith('.ts') && !name.endsWith('.d.ts') && !name.endsWith('.config.ts'))
      files.push(path);
  }
}

for (const sourceRoot of sourceRoots) {
  if (existsSync(sourceRoot)) visit(sourceRoot);
}

function kebabCase(value) {
  return value
    .replace(/_/g, '-')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function decorators(node) {
  return ts.canHaveDecorators(node) ? (ts.getDecorators(node) ?? []) : [];
}

function componentMetadata(node) {
  const decorator = decorators(node).find(
    (candidate) =>
      ts.isCallExpression(candidate.expression) &&
      ts.isIdentifier(candidate.expression.expression) &&
      candidate.expression.expression.text === 'Component',
  );
  if (!decorator || !ts.isCallExpression(decorator.expression)) return undefined;
  const metadata = decorator.expression.arguments[0];
  return metadata && ts.isObjectLiteralExpression(metadata) ? metadata : undefined;
}

function property(metadata, name) {
  return metadata.properties.find(
    (candidate) => ts.isPropertyAssignment(candidate) && candidate.name.getText() === name,
  );
}

function declarationName(node) {
  if (
    ts.isClassDeclaration(node) ||
    ts.isInterfaceDeclaration(node) ||
    ts.isTypeAliasDeclaration(node) ||
    ts.isEnumDeclaration(node) ||
    ts.isFunctionDeclaration(node)
  )
    return node.name?.text;
  return undefined;
}

function declarationKind(node, name) {
  if (ts.isClassDeclaration(node)) {
    if (componentMetadata(node)) return 'component';
    for (const suffix of ['Directive', 'Service', 'Pipe', 'Guard', 'Interceptor']) {
      if (name.endsWith(suffix)) return suffix.toLowerCase();
    }
    return 'class';
  }
  if (ts.isInterfaceDeclaration(node)) return 'interface';
  if (ts.isTypeAliasDeclaration(node)) return 'type';
  if (ts.isEnumDeclaration(node)) return 'enum';
  if (ts.isFunctionDeclaration(node)) return 'function';
  if (ts.isVariableDeclaration(node)) {
    return node.initializer?.getText().includes('InjectionToken') ? 'token' : 'constant';
  }
  throw new Error(`Unsupported declaration ${name}`);
}

function expectedFileName(node, name) {
  const kind = declarationKind(node, name);
  const roleSuffix = kind[0].toUpperCase() + kind.slice(1);
  const stem = ['component', 'directive', 'service', 'pipe', 'guard', 'interceptor'].includes(kind)
    ? name.slice(0, -roleSuffix.length)
    : name;
  return `${kebabCase(stem)}.${kind}.ts`;
}

const failures = [];
let declarationsChecked = 0;
let componentsChecked = 0;
const libraryComponents = [];
const declarationsByFile = new Map();

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const declarations = [];
  for (const statement of sourceFile.statements) {
    const name = declarationName(statement);
    if (name) declarations.push({ node: statement, name });
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name))
          declarations.push({ node: declaration, name: declaration.name.text });
        else failures.push(`${relative(root, file)} has a destructured top-level variable.`);
      }
    }
  }
  declarationsByFile.set(file, declarations);

  declarationsChecked += declarations.length;
  if (declarations.length > 1) {
    failures.push(
      `${relative(root, file)} declares ${declarations.length} top-level types (${declarations.map(({ name }) => name).join(', ')}).`,
    );
  }
  if (declarations.length === 1 && !file.endsWith('.spec.ts')) {
    const declaration = declarations[0];
    const expected = expectedFileName(declaration.node, declaration.name);
    if (basename(file) !== expected) {
      failures.push(`${relative(root, file)} must be named ${expected} for ${declaration.name}.`);
    }
  }

  for (const declaration of declarations) {
    if (!ts.isClassDeclaration(declaration.node)) continue;
    const metadata = componentMetadata(declaration.node);
    if (!metadata) continue;
    componentsChecked += 1;
    if (file.startsWith(`${libraryRoot}\\`) || file.startsWith(`${libraryRoot}/`)) {
      libraryComponents.push(file);
      const componentStem = basename(file, '.component.ts');
      if (basename(dirname(file)) !== componentStem) {
        failures.push(
          `${relative(root, file)} must be contained in a matching ${componentStem} folder.`,
        );
      }
      const selector = property(metadata, 'selector');
      if (
        selector &&
        (!ts.isPropertyAssignment(selector) ||
          !ts.isStringLiteralLike(selector.initializer) ||
          (!selector.initializer.text.startsWith('cs-') &&
            !selector.initializer.text.startsWith('[cs')))
      ) {
        failures.push(`${relative(root, file)} must keep its cs-prefixed selector.`);
      }
    }
    for (const forbidden of ['template', 'styles']) {
      if (property(metadata, forbidden))
        failures.push(`${relative(root, file)} uses forbidden inline ${forbidden}.`);
    }
    const templateUrl = property(metadata, 'templateUrl');
    const styleUrl = property(metadata, 'styleUrl');
    if (
      !templateUrl ||
      !ts.isPropertyAssignment(templateUrl) ||
      !ts.isStringLiteralLike(templateUrl.initializer)
    ) {
      failures.push(`${relative(root, file)} must declare a static templateUrl.`);
    } else if (!existsSync(resolve(dirname(file), templateUrl.initializer.text))) {
      failures.push(
        `${relative(root, file)} references missing template ${templateUrl.initializer.text}.`,
      );
    }
    if (
      !styleUrl ||
      !ts.isPropertyAssignment(styleUrl) ||
      !ts.isStringLiteralLike(styleUrl.initializer)
    ) {
      failures.push(`${relative(root, file)} must declare a static styleUrl.`);
    } else if (!existsSync(resolve(dirname(file), styleUrl.initializer.text))) {
      failures.push(
        `${relative(root, file)} references missing stylesheet ${styleUrl.initializer.text}.`,
      );
    }
  }
}

const componentByDirectory = new Map();
for (const component of libraryComponents) {
  const directory = dirname(component);
  const existing = componentByDirectory.get(directory);
  if (existing) {
    failures.push(
      `${relative(root, directory)} contains multiple components: ${basename(existing)} and ${basename(component)}.`,
    );
  } else {
    componentByDirectory.set(directory, component);
  }
}

const libraryFiles = files.filter(
  (file) => file.startsWith(`${libraryRoot}\\`) || file.startsWith(`${libraryRoot}/`),
);

for (const [directory, component] of componentByDirectory) {
  if (basename(directory).startsWith('cs-')) {
    failures.push(`${relative(root, directory)} must not use a cs- component-folder prefix.`);
  }
  for (const file of libraryFiles.filter((candidate) => dirname(candidate) === directory)) {
    if (basename(file).startsWith('cs-')) {
      failures.push(`${relative(root, file)} must not use a cs- component-file prefix.`);
    }
    for (const declaration of declarationsByFile.get(file) ?? []) {
      if (
        /^Cs[A-Z]/.test(declaration.name) ||
        /^cs[A-Z]/.test(declaration.name) ||
        /^CS_[A-Z0-9_]+$/.test(declaration.name)
      ) {
        failures.push(
          `${relative(root, file)} must not use the component-owned ${declaration.name} prefix.`,
        );
      }
    }
  }
  const componentStem = basename(component, '.component.ts');
  if (componentStem.startsWith('cs-')) {
    failures.push(`${relative(root, component)} must not use a cs- component-file prefix.`);
  }
}

const libraryFileSet = new Set(libraryFiles);
const importersByFile = new Map(libraryFiles.map((file) => [file, []]));
for (const importer of libraryFiles) {
  const source = readFileSync(importer, 'utf8');
  for (const match of source.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
    const base = resolve(dirname(importer), match[1]);
    const imported = [base, `${base}.ts`, resolve(base, 'index.ts')].find((candidate) =>
      libraryFileSet.has(candidate),
    );
    if (imported) importersByFile.get(imported).push(importer);
  }
}

const componentDescriptors = libraryComponents.map((file) => ({
  category: categories[declarationsByFile.get(file)?.[0]?.name],
  directory: dirname(file),
  featureDirectory: dirname(dirname(file)),
  file,
  stem: basename(file, '.component.ts'),
}));
const componentPrefixExceptions = new Set(['cs-icon-button.directive.ts']);
const supportingPattern =
  /\.(directive|service|pipe|guard|interceptor|interface|type|enum|class|function|token|constant)\.ts$/;
const colocatableSupportingRoles = new Set([
  'class',
  'constant',
  'enum',
  'function',
  'interface',
  'token',
  'type',
]);

for (const file of libraryFiles) {
  if (file.endsWith('.component.ts') || file.endsWith('.spec.ts')) continue;
  const match = basename(file).match(supportingPattern);
  if (!match) continue;
  const containingComponent = componentByDirectory.get(dirname(file));
  const featureDirectory = containingComponent ? dirname(dirname(file)) : dirname(file);
  const stem = basename(file).slice(0, -match[0].length);
  const namedOwner = componentDescriptors
    .filter(
      (component) =>
        component.category === basename(featureDirectory) &&
        (stem === `cs-${component.stem}` || stem.startsWith(`cs-${component.stem}-`)),
    )
    .sort((left, right) => right.stem.length - left.stem.length)[0];
  if (
    !containingComponent &&
    namedOwner &&
    namedOwner.directory !== dirname(file) &&
    !componentPrefixExceptions.has(basename(file))
  ) {
    failures.push(
      `${relative(root, file)} is specific to ${namedOwner.stem} and must be in ${relative(root, namedOwner.directory)}.`,
    );
  }

  if (containingComponent || !colocatableSupportingRoles.has(match[1])) continue;
  const meaningfulImporters = (importersByFile.get(file) ?? []).filter(
    (importer) => dirname(importer) !== libraryRoot && !importer.endsWith('.spec.ts'),
  );
  if (meaningfulImporters.length === 0) continue;
  const importerComponents = meaningfulImporters.map((importer) =>
    componentByDirectory.get(dirname(importer)),
  );
  if (importerComponents.every(Boolean) && new Set(importerComponents).size === 1) {
    const owner = importerComponents[0];
    failures.push(
      `${relative(root, file)} is consumed only by ${basename(owner, '.component.ts')} and must be in ${relative(root, dirname(owner))}.`,
    );
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(failure);
  process.exitCode = 1;
} else {
  console.log(
    `File organization verified: ${declarationsChecked} declarations in individual files; ${componentsChecked} components use external HTML and SCSS; ${libraryComponents.length} library components use dedicated folders.`,
  );
}
