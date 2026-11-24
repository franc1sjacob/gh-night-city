import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { calendarFromSample, type Calendar, type Level } from '../src/data/calendar.js';
import { buildLayout } from '../src/scene/layout.js';

const sampleJson = JSON.parse(readFileSync(new URL('./fixtures/sample-calendar.json', import.meta.url), 'utf8'));
const sample = calendarFromSample(sampleJson);

function synthetic(weeks: number, firstLen = 7, lastLen = 7, count = (i: number, d: number) => (i * 7 + d) % 5): Calendar {
  return {
    total: 0,
    weeks: Array.from({ length: weeks }, (_, i) => {
      const len = i === 0 ? firstLen : i === weeks - 1 ? lastLen : 7;
      const start = i === 0 ? 7 - firstLen : 0;
      const counts = Array.from({ length: len }, (_, d) => count(i, d));
      return { firstDay: '2026-01-01', weekday: start, counts, levels: counts.map((c) => Math.min(4, c) as Level) };
    }),
  };
}

function allNumbers(v: unknown, out: number[] = []): number[] {
  if (typeof v === 'number') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => allNumbers(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => allNumbers(x, out));
  return out;
}

describe('buildLayout', () => {
  it('reference sample matches the mock', () => {
    const l = buildLayout(sample);
    expect(l.width).toBe(760);
    expect(l.height).toBe(224);
    const active = sampleJson.weeks.flatMap((w: { l: number[] }) => w.l).filter((x: number) => x > 0).length;
    expect(l.squares).toHaveLength(active);
    expect(l.buildings).toHaveLength(53);
    expect(l.catAt).toBe(41);
    expect(l.boardAt).toBe(24);
    expect(l.squares[0]).toMatchObject({ x: 10, y: 118 + 14 });
  });

  it('layout handles 54 weeks and partial weeks', () => {
    const l = buildLayout(synthetic(54, 3, 2));
    expect(l.weeks).toBe(54);
    for (const s of l.squares) expect(s.x + 12).toBeLessThanOrEqual(l.width);
    expect(l.squares.filter((s) => s.week === 0).every((s) => s.row >= 4)).toBe(true);
    expect(l.poles[l.poles.length - 1]).toBeLessThan(l.width);
    expect(l.boardAt).toBeGreaterThanOrEqual(Math.round(54 * 0.45));
    expect(l.boardAt).toBeLessThan(Math.round(54 * 0.72));
  });

  it('layout handles an empty calendar', () => {
    const l = buildLayout(synthetic(53, 7, 7, () => 0));
    expect(l.squares).toHaveLength(0);
    expect(allNumbers(l).every(Number.isFinite)).toBe(true);
  });

  it('layout is deterministic', () => {
    expect(buildLayout(sample)).toEqual(buildLayout(sample));
  });
});

import { squareOn, squareWave, squaresDusk } from '../src/scene/timeline.js';
describe('square timing split', () => {
  it('dusk times wave equals squareOn everywhere except the instant at T_ON', () => {
    for (let t = 0; t < 23.1; t += 0.05) {
      if (Math.abs(t - 6.1) < 0.06) continue;
      for (const [w, r] of [[0, 0], [20, 3], [52, 6]]) expect(squaresDusk(t) * squareWave(t, w, r, 53)).toBeCloseTo(squareOn(t, w, r, 53), 6);
    }
  });
});

describe('placement', () => {
  it('billboard never lands on the cat building', () => {
    // tallest week outside the billboard range, the cat's (second tallest) week exactly at the start of the range
    const cal = synthetic(53, 7, 7, (i) => (i === 10 ? 100 : i === 24 ? 90 : 1));
    const l = buildLayout(cal);
    expect(l.catAt).toBe(24);
    expect(l.boardAt).not.toBe(l.catAt);
  });
});
