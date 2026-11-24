import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import * as core from '@actions/core';
import { run } from './run.js';

await run({
  getInput: (name) => core.getInput(name),
  setFailed: (msg) => core.setFailed(msg),
  info: (msg) => core.info(msg),
  repoOwner: process.env.GITHUB_REPOSITORY_OWNER ?? '',
  writeFile: async (path, data) => {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
  },
});
