import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { calendarFromSample } from '../src/data/calendar.js';
import { buildLayout } from '../src/scene/layout.js';
import { PALETTES } from '../src/scene/palette.js';
import { CYCLE, RIDER_SCALE, TRAIN_DURATION, TRAIN_SCALE, TRAIN_START } from '../src/scene/constants.js';
import { KeyframeSheet } from '../src/svg/keyframes.js';
import { train, trainNoseAt } from '../src/svg/train.js';
import { crossing, lampOn, SIGNAL_OFFSET } from '../src/svg/crossing.js';

const layout = buildLayout(calendarFromSample(JSON.parse(readFileSync(new URL('./fixtures/sample-calendar.json', import.meta.url), 'utf8'))));

describe('train', () => {
  it('uses the medium train with the normal rider', () => {
    expect(TRAIN_SCALE).toBe(1.4);
    expect(RIDER_SCALE).toBe(1);
  });

  it('train enters and leaves within the loop', () => {
    expect(trainNoseAt(TRAIN_START - 0.1, layout)).toBeNull();
    const mid = trainNoseAt(TRAIN_START + 7.5, layout);
    expect(mid).not.toBeNull();
    expect(mid!).toBeGreaterThan(0);
    expect(mid!).toBeLessThan(layout.width + 400);
    expect(trainNoseAt(TRAIN_START + TRAIN_DURATION + 0.1, layout)).toBeNull();
  });

  it('rider has no text nodes', () => {
    const f = train(layout, PALETTES.dark, new KeyframeSheet());
    expect(f.body).not.toMatch(/<text/);
    expect(f.body).toContain('class="rider"');
  });
});

describe('crossing', () => {
  it('crossing lamps only blink while the train is near', () => {
    const sx = layout.width - SIGNAL_OFFSET;
    let litWhileNear = 0;
    for (let t = 0; t < CYCLE; t += 0.05) {
      const nose = trainNoseAt(t, layout);
      const near = nose !== null && nose > sx - 140 && nose - 284.4 < sx + 30;
      for (const lamp of [0, 1] as const) {
        if (!near) expect(lampOn(t, layout, lamp)).toBe(0);
        else litWhileNear += lampOn(t, layout, lamp);
      }
    }
    expect(litWhileNear).toBeGreaterThan(10);
  });

  it('lamps alternate', () => {
    for (let t = 0; t < CYCLE; t += 0.05) expect(lampOn(t, layout, 0) + lampOn(t, layout, 1)).toBeLessThanOrEqual(1);
  });

  it('renders without text', () => {
    expect(crossing(layout, PALETTES.dark, new KeyframeSheet()).body).not.toMatch(/<text/);
  });
});
