import { join } from 'node:path';
import { fetchCalendar } from '../data/calendar.js';
import { buildLayout } from '../scene/layout.js';
import { normalizeSignText } from '../svg/font.js';
import { renderSvg } from '../svg/render.js';

export interface RunEnv {
  getInput(name: string): string;
  setFailed(msg: string): void;
  info(msg: string): void;
  repoOwner: string;
  fetchImpl?: typeof fetch;
  writeFile(path: string, data: string): Promise<void>;
}

/** Fetches the calendar, renders both themes and writes them. Any failure is reported and nothing is written. */
export async function run(env: RunEnv): Promise<void> {
  try {
    const token = env.getInput('github-token').trim();
    if (!token) throw new Error('github-token is empty; pass ${{ github.token }} or a personal access token');
    const username = env.getInput('username').trim() || env.repoOwner;
    if (!username) throw new Error('username is empty and the repository owner is unknown');
    const outDir = env.getInput('output-dir').trim() || 'dist';
    const signText = normalizeSignText(env.getInput('sign-text'));

    const calendar = await fetchCalendar(username, token, env.fetchImpl);
    const layout = buildLayout(calendar);
    const files = (['dark', 'light'] as const).map((theme) => ({ path: join(outDir, `night-city-${theme}.svg`), svg: renderSvg(layout, theme, { signText }) }));
    for (const f of files) {
      await env.writeFile(f.path, f.svg);
      env.info(`Wrote ${f.path} (${(Buffer.byteLength(f.svg) / 1024).toFixed(1)} KB)`);
    }
    env.info(`${calendar.total} contributions for ${username}`);
  } catch (err) {
    env.setFailed(err instanceof Error ? err.message : String(err));
  }
}
