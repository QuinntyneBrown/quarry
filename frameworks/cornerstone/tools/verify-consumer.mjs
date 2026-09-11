import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { compileString, NodePackageImporter } from 'sass';

const root = resolve(import.meta.dirname, '..');
const parent = resolve(root, 'dist/consumers');
mkdirSync(parent, { recursive: true });
const consumer = mkdtempSync(resolve(parent, 'packed-'));
const npm = (args, cwd = consumer) =>
  execFileSync('npm', args, {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
const registryVersion = process.argv[2] === '--registry-version' ? process.argv[3] : undefined;
if (registryVersion) assert.match(registryVersion, /^\d+\.\d+\.\d+$/);
const archives = registryVersion
  ? [
      `@quinntyne/cornerstone@${registryVersion}`,
      `@quinntyne/cornerstone-design-system@${registryVersion}`,
    ]
  : process.argv[2] === '--archives'
    ? process.argv.slice(3)
    : ['cornerstone', 'design-system-tokens'].map((directory) => {
        const [result] = JSON.parse(
          npm(['pack', '--json', `./dist/${directory}`, '--pack-destination', consumer], root),
        );
        return resolve(consumer, result.filename);
      });
assert.equal(archives.length, 2, 'Verify exactly the two release packages');
writeFileSync(
  resolve(consumer, 'package.json'),
  '{"name":"cornerstone-packed-consumer","private":true,"type":"module"}\n',
);
npm([
  'install',
  ...archives,
  '--ignore-scripts',
  '--legacy-peer-deps',
  '--no-audit',
  '--no-fund',
  '--package-lock=false',
  '--registry=https://registry.npmjs.org',
]);
writeFileSync(
  resolve(consumer, 'consumer.component.ts'),
  `
import { Component } from '@angular/core';
import { BadgeComponent, CardComponent, CsButtonDirective, CsCardHeaderComponent, CsProgressComponent, CountdownComponent, ReviewDialogComponent, TeamBoardComponent, RaffleStageComponent } from '@quinntyne/cornerstone';
import type { BoardGroup, BoardMember, BoardProject, MemberMove, ProjectAssignment, NewTeamRequest, TeamBoardText, RaffleResult, RaffleStageText } from '@quinntyne/cornerstone';
@Component({
  selector: 'consumer-app',
  imports: [BadgeComponent, CardComponent, CsButtonDirective, CsCardHeaderComponent, CsProgressComponent, CountdownComponent, ReviewDialogComponent, TeamBoardComponent, RaffleStageComponent],
  templateUrl: './consumer.component.html',
  styleUrl: './consumer.component.scss',
})
export class ConsumerComponent {
  readonly groups: BoardGroup[] = [{id: 'team', name: 'Team', projectId: ''}];
  readonly members: BoardMember[] = [{id: 'person', name: 'Ada', label: 'Developer', groupId: 'team'}];
  readonly projects: BoardProject[] = [];
  readonly result: RaffleResult = {id: 'draw', label: 'Ada', candidates: [], start: 0, reveal: 2000};
  readonly boardText: Partial<TeamBoardText> = {};
  readonly raffleText: Partial<RaffleStageText> = {};
  move(event: MemberMove): void {}
  assign(event: ProjectAssignment): void {}
  create(event: NewTeamRequest): void {}
}
`,
);
writeFileSync(
  resolve(consumer, 'consumer.component.html'),
  '<cs-card><header csCardHeader>Review</header><cs-badge tone="success">Ready</cs-badge><button csButton>Continue</button></cs-card><cs-progress-bar [value]="50" /><cs-countdown [now]="1000" [target]="2000" /><cs-review-dialog title="Review"><p>Review content</p></cs-review-dialog><cs-team-board [groups]="groups" [members]="members" [projects]="projects" [text]="boardText" (moved)="move($event)" (assigned)="assign($event)" (newTeamRequested)="create($event)" /><cs-raffle-stage [result]="result" [now]="1000" [text]="raffleText" />',
);
writeFileSync(resolve(consumer, 'consumer.component.scss'), ':host { display: block; }');
writeFileSync(
  resolve(consumer, 'tsconfig.json'),
  JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'preserve',
        moduleResolution: 'bundler',
        strict: true,
        experimentalDecorators: true,
        skipLibCheck: true,
        outDir: './compiled',
        types: [],
      },
      angularCompilerOptions: { strictTemplates: true },
      files: ['consumer.component.ts'],
    },
    null,
    2,
  ),
);
execFileSync(
  process.execPath,
  [
    resolve(root, 'node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js'),
    '-p',
    resolve(consumer, 'tsconfig.json'),
  ],
  { stdio: 'inherit' },
);

writeFileSync(
  resolve(consumer, 'verify-ssr.mjs'),
  `import '@angular/compiler';
import assert from 'node:assert/strict';
import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';
import { ConsumerComponent } from './compiled/consumer.component.js';
const html = await renderApplication(
  (context) => bootstrapApplication(ConsumerComponent, { providers: [provideZonelessChangeDetection(), provideServerRendering()] }, context),
  { document: '<html><body><consumer-app></consumer-app></body></html>', url: 'http://localhost/', allowedHosts: ['localhost'] },
);
for (const selector of ['cs-countdown', 'cs-review-dialog', 'cs-team-board', 'cs-raffle-stage']) assert.ok(html.includes(selector));
assert.ok(html.includes('Drawing a name'));
assert.ok(!html.includes('NaN'));
console.log('Packed components rendered on the server without browser effects.');
`,
);
execFileSync(process.execPath, [resolve(consumer, 'verify-ssr.mjs')], { stdio: 'inherit' });

const importer = new NodePackageImporter(consumer);
for (const name of ['theme', 'tokens', 'compat']) {
  for (const suffix of ['', '.scss']) {
    const css = compileString(`@use "pkg:@quinntyne/cornerstone/styles/${name}${suffix}";`, {
      importers: [importer],
    }).css;
    assert.match(css, /--cs-paper:/, `Missing tokens in ${name}${suffix}`);
  }
}
const tokens = compileString('@use "pkg:@quinntyne/cornerstone-design-system/tokens.scss";', {
  importers: [importer],
}).css;
assert.match(tokens, /--cs-paper:/);
const packedTokenCss = readFileSync(
  resolve(consumer, 'node_modules/@quinntyne/cornerstone-design-system/tokens.css'),
  'utf8',
);
assert.equal(tokens, packedTokenCss);
console.log('Packed Angular consumer and all public stylesheet entry points verified.');
