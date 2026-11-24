import { DECK } from '../scene/constants.js';
import type { Layout } from '../scene/layout.js';
import type { Palette } from '../scene/palette.js';
import { night } from '../scene/timeline.js';
import { n, type Fragment } from './fragment.js';
import type { KeyframeSheet } from './keyframes.js';
import { circle } from './shapes.js';
import { TRAIN_LENGTH, trainNoseAt } from './train.js';

/** The signal stands this far from the right edge. */
export const SIGNAL_OFFSET = 70;

/** 1 while lamp `which` is lit: only while the train is near, the two lamps taking turns 2.4 times a second. */
export function lampOn(t: number, layout: Layout, which: 0 | 1): number {
  const sx = layout.width - SIGNAL_OFFSET, nose = trainNoseAt(t, layout);
  const near = nose !== null && nose > sx - 140 && nose - TRAIN_LENGTH < sx + 30;
  return near && Math.floor(t * 2.4) % 2 === which ? 1 : 0;
}

/** Railway crossing signal at the right end of the track. */
export function crossing(layout: Layout, p: Palette, kf: KeyframeSheet): Fragment {
  const sx = layout.width - SIGNAL_OFFSET, top = DECK - 27, ly = DECK - 17.5;
  const fade = kf.sample(night, (v) => `opacity:${v}`);
  const lamps = ([0, 1] as const)
    .map((w) => {
      const k = kf.sample((t) => lampOn(t, layout, w), (v) => `opacity:${v}`, { step: 0.0125, tol: 0 });
      const x = sx + (w === 0 ? -4.5 : 4.5);
      return circle(x, ly, 2.3, ` fill="${p.pole}"`) + circle(x, ly, 1.5, ` fill="${p.cityEdge}"`) + circle(x, ly, 1.5, ` class="${k}" fill="${p.signal}"`);
    })
    .join('');
  const bar = `<rect x="-5" y="-.8" width="10" height="1.6"/>`;
  return {
    body:
      `<g class="${fade}"><g fill="${p.pole}">` +
      `<rect x="${n(sx - 0.75)}" y="${top}" width="1.5" height="27"/>` +
      `<g transform="translate(${sx} ${top})"><g transform="rotate(40.11)">${bar}</g><g transform="rotate(-40.11)">${bar}</g></g>` +
      `<rect x="${sx - 6}" y="${DECK - 20.5}" width="12" height="1.5"/></g>${lamps}</g>`,
  };
}
