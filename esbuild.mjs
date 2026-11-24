// Bundles the action into dist/index.js (plus the font it draws the billboard with), so it runs without an install step.
import { build } from 'esbuild';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const FONT = 'jetbrains-mono-latin-700-normal.woff';

mkdirSync('dist', { recursive: true });
const result = await build({
  metafile: true,
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

// The license of every package that ends up in the bundle (and the font), since the bundle strips their headers.
const packages = new Set(['@fontsource/jetbrains-mono']);
for (const input of Object.keys(result.metafile.inputs)) {
  const m = input.match(/node_modules\/((?:@[^/]+\/)?[^/]+)\//g);
  if (m) packages.add(m.at(-1).slice('node_modules/'.length, -1));
}
const sections = [...packages].sort().map((pkg) => {
  const dir = join('node_modules', pkg);
  const file = readdirSync(dir).find((f) => /^licen[cs]e/i.test(f));
  const { version, license } = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  const text = file && existsSync(join(dir, file)) ? readFileSync(join(dir, file), 'utf8').trim() : `License: ${license}`;
  return `== ${pkg} ${version} (${license})\n\n${text}\n`;
});
writeFileSync('dist/THIRD_PARTY_LICENSES.txt', `Third-party software bundled in dist/index.js and dist/${FONT}.\n\n${sections.join('\n')}`);
console.log(`built dist/index.js (${packages.size} third-party packages, licenses in dist/THIRD_PARTY_LICENSES.txt)`);
