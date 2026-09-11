import { copyFileSync, existsSync, watch } from 'node:fs';
import { resolve } from 'node:path';
import { ngPackagr } from 'ng-packagr';

const root = resolve(import.meta.dirname, '..');
const watching = process.argv.includes('--watch');
const source = resolve(root, 'design-system/styles/_token-values.scss');
const target = resolve(root, 'dist/cornerstone/styles/_token-values.scss');
const packager = ngPackagr()
  .forProject(resolve(root, 'src/cornerstone/ng-package.json'))
  .withTsConfig(resolve(root, `src/cornerstone/tsconfig.lib${watching ? '' : '.prod'}.json`));

function packageTokens() {
  copyFileSync(source, target);
  console.log('Packaged authoritative tokens with @quinntyne/cornerstone.');
}

if (watching) {
  const tokenWatcher = watch(source, () => {
    if (existsSync(target)) packageTokens();
  });
  const subscription = packager.watch().subscribe({
    next: packageTokens,
    error: (error) => {
      console.error(error);
      tokenWatcher.close();
      process.exitCode = 1;
    },
  });
  process.on('SIGINT', () => {
    tokenWatcher.close();
    subscription.unsubscribe();
  });
} else {
  await packager.build();
  packageTokens();
}
