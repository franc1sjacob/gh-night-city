import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { run, type RunEnv } from '../src/action/run.js';
import { assertFinite, assertFlat, assertSelfContained } from './svgChecks.js';

const sample = JSON.parse(readFileSync(new URL('./fixtures/sample-calendar.json', import.meta.url), 'utf8'));

/** A GitHub GraphQL response built from the reference sample. */
const gqlFromSample = {
  data: { user: { contributionsCollection: { contributionCalendar: {
    totalContributions: sample.total,
    weeks: sample.weeks.map((w: { d: string; wd: number; c: number[]; l: number[] }) => ({
      firstDay: w.d,
      contributionDays: w.c.map((c, k) => ({ contributionCount: c, contributionLevel: ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'][w.l[k]], weekday: w.wd + k })),
    })),
  } } } },
};

function env(inputs: Record<string, string>, body: unknown = gqlFromSample) {
  const writes: { path: string; data: string }[] = [];
  const failures: string[] = [];
  const queried: string[] = [];
  const e: RunEnv = {
    getInput: (name) => inputs[name] ?? '',
    setFailed: (msg) => failures.push(msg),
    info: () => {},
    repoOwner: 'owner-from-repo',
    fetchImpl: (async (_url: string, init: RequestInit) => {
      queried.push(JSON.parse(String(init.body)).variables.login);
      return new Response(JSON.stringify(body), { status: 200 });
    }) as unknown as typeof fetch,
    writeFile: async (path, data) => { writes.push({ path, data }); },
  };
  return { e, writes, failures, queried };
}

describe('run', () => {
  it('writes both files to output-dir', async () => {
    const t = env({ 'github-token': 'tok', username: 'someone', 'output-dir': 'out/city' });
    await run(t.e);
    expect(t.failures).toEqual([]);
    expect(t.writes.map((w) => w.path)).toEqual(['out/city/night-city-dark.svg', 'out/city/night-city-light.svg']);
    for (const w of t.writes) { assertSelfContained(w.data); assertFlat(w.data); assertFinite(w.data); }
  });

  it('uses the repo owner when username is empty', async () => {
    const t = env({ 'github-token': 'tok' });
    await run(t.e);
    expect(t.queried).toEqual(['owner-from-repo']);
    expect(t.writes[0].path).toBe('dist/night-city-dark.svg');
  });

  it('passes sign-text through', async () => {
    const a = env({ 'github-token': 'tok', 'sign-text': 'npm run dev' }); await run(a.e);
    const b = env({ 'github-token': 'tok' }); await run(b.e);
    expect(a.writes[0].data).not.toBe(b.writes[0].data);
  });

  it('fails and writes nothing on a GraphQL error', async () => {
    const msg = "Could not resolve to a User with the login of 'nope'.";
    const t = env({ 'github-token': 'tok', username: 'nope' }, { errors: [{ message: msg }] });
    await run(t.e);
    expect(t.failures[0]).toContain(msg);
    expect(t.writes).toHaveLength(0);
  });

  it('fails and writes nothing on bad sign-text', async () => {
    const t = env({ 'github-token': 'tok', 'sign-text': 'x'.repeat(41) });
    await run(t.e);
    expect(t.failures[0]).toMatch(/41.*40/);
    expect(t.writes).toHaveLength(0);
  });

  it('fails clearly without a token', async () => {
    const t = env({});
    await run(t.e);
    expect(t.failures[0]).toMatch(/github-token/);
    expect(t.writes).toHaveLength(0);
  });
});
