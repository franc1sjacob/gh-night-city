import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

describe('bundle', () => {
  it('ships the license of every bundled package', () => {
    execFileSync('node', ['esbuild.mjs'], { stdio: 'pipe' });
    const licenses = readFileSync('dist/THIRD_PARTY_LICENSES.txt', 'utf8');
    for (const pkg of ['opentype.js', '@actions/core', 'undici', '@fontsource/jetbrains-mono']) expect(licenses).toContain(`== ${pkg}`);
    expect(licenses).toMatch(/Permission is hereby granted/);
    expect(licenses).toMatch(/SIL OPEN FONT LICENSE/i);
  }, 30_000);
});
