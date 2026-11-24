import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { calendarFromSample } from '../src/data/calendar.js';
import { buildLayout } from '../src/scene/layout.js';
import { PALETTES } from '../src/scene/palette.js';
import { at, KeyframeSheet } from '../src/svg/keyframes.js';
import { cat, grain, powerLines, rain } from '../src/svg/street.js';
import { renderSvg } from '../src/svg/render.js';
import { T_DUSK } from '../src/scene/constants.js';

const layout = buildLayout(calendarFromSample(JSON.parse(readFileSync(new URL('./fixtures/sample-calendar.json', import.meta.url), 'utf8'))));
const p = PALETTES.dark;

/** Value of `prop` in keyframes `name` at percent `pct`, from the stop at or before it. */
function valueAt(css: string, name: string, pct: number): string {
  const body = css.match(new RegExp(`@keyframes ${name}\\{(.*?)\\}\\.${name}\\{`))![1];
  const stops = [...body.matchAll(/([\d.]+)%\{([^}]*)\}/g)].map((m) => [Number(m[1]), m[2]] as const);
  return stops.filter(([s]) => s <= pct).at(-1)![1];
}

describe('street', () => {
  it('three crows', () => {
    expect(powerLines(layout, p, new KeyframeSheet()).body.match(/class="crow/g)).toHaveLength(3);
  });
  it('one pole per layout.poles entry', () => {
    expect(powerLines(layout, p, new KeyframeSheet()).body.match(/class="pole"/g)).toHaveLength(layout.poles.length);
  });
  it('rain only shows at night', () => {
    const kf = new KeyframeSheet();
    const body = rain(layout, p, kf).body;
    const name = body.match(/<g class="(k\w+)"/)![1];
    expect(valueAt(kf.css(), name, 0)).toBe('opacity:0');
    expect(valueAt(kf.css(), name, at(T_DUSK - 0.1))).toBe('opacity:0');
    expect(valueAt(kf.css(), name, at(12))).toBe('opacity:0.28');
  });
  it('cat and grain render', () => {
    expect(cat(layout, p, new KeyframeSheet()).body).toContain('class="cat"');
    expect(grain(layout, p, new KeyframeSheet()).defs ?? '').toContain('feTurbulence');
  });
  it('full render stays under 500 KB with everything in it', () => {
    const svg = renderSvg(layout, 'dark', { signText: 'coding 24/7' });
    expect(svg).toContain('class="crow');
    expect(Buffer.byteLength(svg)).toBeLessThan(500_000);
  });
});
