// Local preview from a clone: GITHUB_TOKEN=... npm run preview -- --user <name> --out <dir> [--sign-text <text>]
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { run } from '../action/run.js';

const { values } = parseArgs({ options: { user: { type: 'string' }, out: { type: 'string', default: 'out' }, 'sign-text': { type: 'string', default: '' } } });
if (!values.user) {
  console.error('Usage: GITHUB_TOKEN=... npm run preview -- --user <name> [--out <dir>] [--sign-text <text>]');
  process.exit(2);
}
const inputs: Record<string, string> = { 'github-token': process.env.GITHUB_TOKEN ?? '', username: values.user, 'output-dir': values.out!, 'sign-text': values['sign-text']! };
await run({
  getInput: (name) => inputs[name] ?? '',
  setFailed: (msg) => { console.error(msg); process.exitCode = 1; },
  info: (msg) => console.log(msg),
  repoOwner: '',
  writeFile: async (path, data) => { await mkdir(dirname(path), { recursive: true }); await writeFile(path, data); },
});
