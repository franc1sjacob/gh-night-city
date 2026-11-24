import { CYCLE, DECK, PITCH, T_ON } from '../scene/constants.js';
import { colX, type Layout } from '../scene/layout.js';
import type { Palette } from '../scene/palette.js';
import { rand } from '../scene/random.js';
import { lightsOn } from '../scene/timeline.js';
import { n, type Fragment } from './fragment.js';
import type { KeyframeSheet } from './keyframes.js';
import { textToPath } from './font.js';
import { riseClass } from './skyline.js';

const SIZE = 7, PANEL = 48, SPEED = 10;
export const SEPARATOR = '  ·  ';

/** How the strip scrolls: one strip width per period, a whole number of periods per loop, enough copies to fill the panel. */
export function scrollPlan(text: string) {
  const stripWidth = textToPath(text + SEPARATOR, SIZE).width;
  const loops = Math.max(1, Math.round((CYCLE * SPEED) / stripWidth));
  return { stripWidth, period: CYCLE / loops, copies: Math.ceil(PANEL / stripWidth) + 1 };
}

/** Rooftop billboard whose text scrolls in JetBrains Mono, lit with its building, with the odd neon flicker. */
export function billboard(layout: Layout, p: Palette, kf: KeyframeSheet, signText: string): Fragment {
  const i = layout.boardAt, b = layout.buildings[i];
  const top = DECK - b.h, by = top - 17, bx = colX(i) - 1, x = colX(i) + PITCH / 2 - 26;
  const { stripWidth, period, copies } = scrollPlan(signText);
  const { d } = textToPath(signText + SEPARATOR, SIZE);
  const scroll = kf.add([[0, 'transform:translateX(0)'], [100, `transform:translateX(${n(-stripWidth)}px)`]], Math.round(period * 1e6) / 1e6);
  const glow = kf.sample(
    (t) => lightsOn(t, i, layout.weeks) * (t >= T_ON && rand(Math.floor(t * 3) + 77) > 0.96 ? 0.35 : 1),
    (v) => `opacity:${v}`,
  );
  const strip = Array.from({ length: copies }, (_, k) => `<path transform="translate(${n(k * stripWidth)} 0)" d="${d}"/>`).join('');
  return {
    defs: `<clipPath id="sign"><rect x="${n(x + 2)}" y="${n(by + 1.5)}" width="${PANEL}" height="9"/></clipPath>`,
    body:
      `<g clip-path="url(#above-track)"><g class="${riseClass(layout, kf, i)}">` +
      `<g fill="${p.cityEdge}"><rect x="${bx + 2}" y="${n(by + 11)}" width="2" height="6"/><rect x="${bx + PITCH - 4}" y="${n(by + 11)}" width="2" height="6"/>` +
      `<rect x="${bx + 1}" y="${n(by + 14)}" width="${PITCH - 2}" height="1.2"/><rect x="${n(x)}" y="${n(by)}" width="52" height="12"/></g>` +
      `<rect x="${n(x + 1.5)}" y="${n(by + 1.5)}" width="49" height="9" fill="${p.board}"/>` +
      `<g clip-path="url(#sign)"><g class="${glow}" fill="${p.stripe}"><g transform="translate(${n(x + 2)} ${n(by + 8.3)})"><g class="${scroll}">${strip}</g></g></g></g>` +
      `</g></g>`,
  };
}
