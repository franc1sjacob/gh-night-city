import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { calendarFromSample } from '../src/data/calendar.js';
import { buildLayout } from '../src/scene/layout.js';
import { PALETTES } from '../src/scene/palette.js';
import { CYCLE } from '../src/scene/constants.js';
import { KeyframeSheet } from '../src/svg/keyframes.js';
import { billboard, scrollPlan } from '../src/svg/billboard.js';
import { normalizeSignText, textToPath } from '../src/svg/font.js';

const layout = buildLayout(calendarFromSample(JSON.parse(readFileSync(new URL('./fixtures/sample-calendar.json', import.meta.url), 'utf8'))));

describe('normalizeSignText', () => {
  it('default text when empty', () => {
    expect(normalizeSignText('  ')).toBe('coding 24/7');
    expect(normalizeSignText(undefined)).toBe('coding 24/7');
  });
  it('rejects over-long text', () => {
    expect(() => normalizeSignText('x'.repeat(41))).toThrow(/41.*40/);
    expect(normalizeSignText('x'.repeat(40))).toHaveLength(40);
  });
  it('rejects characters the font lacks', () => {
    expect(() => normalizeSignText('ship it 🚀')).toThrow('🚀');
  });
  it('accepts punctuation', () => {
    expect(normalizeSignText('npm run dev && ship')).toBe('npm run dev && ship');
  });
});

describe('billboard', () => {
  it('billboard renders text as a path', () => {
    const f = billboard(layout, PALETTES.dark, new KeyframeSheet(), 'coding 24/7');
    expect(f.body).toContain('<path');
    expect(f.body).not.toMatch(/<text/);
  });

  it('scroll is seamless', () => {
    for (const text of ['coding 24/7', 'hi', 'x'.repeat(40)]) {
      const { stripWidth, period, copies } = scrollPlan(text);
      const loopsPerCycle = CYCLE / period;
      expect(Math.abs(loopsPerCycle - Math.round(loopsPerCycle))).toBeLessThan(1e-9);
      expect(stripWidth * (copies - 1)).toBeGreaterThanOrEqual(48);
      expect(stripWidth / period).toBeGreaterThan(7);
      expect(stripWidth / period).toBeLessThan(14);
    }
  });

  it('textToPath measures like the mock', () => {
    expect(textToPath('coding 24/7  ·  ', 7).width).toBeCloseTo(67.2, 1);
  });
});
