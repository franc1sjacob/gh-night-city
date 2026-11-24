import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { XMLValidator } from 'fast-xml-parser';
import { calendarFromSample, type Calendar } from '../src/data/calendar.js';
import { buildLayout } from '../src/scene/layout.js';
import { renderSvg } from '../src/svg/render.js';
import { KeyframeSheet, at } from '../src/svg/keyframes.js';
import { assertFinite, assertFlat, assertSelfContained } from './svgChecks.js';

const sample = calendarFromSample(JSON.parse(readFileSync(new URL('./fixtures/sample-calendar.json', import.meta.url), 'utf8')));
const layout = buildLayout(sample);
const opts = { signText: 'coding 24/7' };
const dark = renderSvg(layout, 'dark', opts);
const light = renderSvg(layout, 'light', opts);

describe('KeyframeSheet', () => {
  it('reuses a name for identical stops', () => {
    const kf = new KeyframeSheet();
    const a = kf.add([[0, 'opacity:0'], [100, 'opacity:1']]);
    const b = kf.add([[0, 'opacity:0'], [100, 'opacity:1']]);
    const c = kf.add([[0, 'opacity:1'], [100, 'opacity:0']]);
    expect(a).toBe(b);
    expect(c).not.toBe(a);
    expect(kf.css()).toContain(`@keyframes ${a}`);
  });

  it('converts loop seconds to percent', () => {
    expect(at(0)).toBe(0);
    expect(at(23.1)).toBe(100);
    expect(at(2.5)).toBe(10.823);
  });
});

describe('renderSvg', () => {
  it('svg is self-contained', () => assertSelfContained(dark));
  it('svg is flat', () => assertFlat(dark));
  it('parses as XML', () => {
    expect(XMLValidator.validate(dark)).toBe(true);
    expect(XMLValidator.validate(light)).toBe(true);
  });
  it('has the right viewBox', () => expect(dark).toContain('viewBox="0 0 760 224"'));
  it('renders one lit square per active day', () => {
    expect(dark.match(/class="sq[ "]/g)?.length).toBe(layout.squares.length);
  });
  it('is deterministic', () => expect(renderSvg(layout, 'dark', opts)).toBe(dark));
  it('no NaN in output for empty calendar', () => {
    const empty: Calendar = { total: 0, weeks: sample.weeks.map((w) => ({ ...w, counts: w.counts.map(() => 0), levels: w.levels.map(() => 0 as const) })) };
    assertFinite(renderSvg(buildLayout(empty), 'dark', opts));
  });
  it('dark and light differ only in colors', () => {
    const strip = (s: string) => s.replace(/#[0-9a-f]{6}/gi, '#');
    expect(strip(dark)).toBe(strip(light));
    expect(dark).not.toBe(light);
  });
  it('stays under 500 KB', () => {
    expect(Buffer.byteLength(dark)).toBeLessThan(500_000);
    expect(Buffer.byteLength(light)).toBeLessThan(500_000);
  });
});

import { riseClass } from '../src/svg/skyline.js';
describe('evening state', () => {
  it('nothing on a building shows above the track before it rises', () => {
    const kf = new KeyframeSheet();
    for (const week of [0, layout.boardAt]) {
      const name = riseClass(layout, kf, week, week === layout.boardAt ? 0.02 : 0);
      const first = kf.css().match(new RegExp(`@keyframes ${name}\\{0%\\{transform:translateY\\(([\\d.]+)px\\)`))![1];
      // the billboard sits 17 px above its roof, roof boxes 3 px: the whole stack must start below the deck
      expect(Number(first)).toBeGreaterThanOrEqual(layout.buildings[week].h + 18);
    }
  });
});
