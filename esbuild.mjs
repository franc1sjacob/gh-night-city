// Bundles the action into dist/index.js (plus the font it draws the billboard with), so it runs without an install step.
import { build } from 'esbuild';
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const FONT = 'jetbrains-mono-latin-700-normal.woff';

mkdirSync('dist', { recursive: true });
await build({
  entryPoints: ['src/action/main.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  legalComments: 'none',
  banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
});
copyFileSync(require.resolve(`@fontsource/jetbrains-mono/files/${FONT}`), `dist/${FONT}`);
console.log('built dist/index.js');
