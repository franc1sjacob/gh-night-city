import { DECK, PITCH, T_NIGHT } from '../scene/constants.js';
import type { Layout } from '../scene/layout.js';
import type { Palette } from '../scene/palette.js';
import { rand } from '../scene/random.js';
import { lightsOn, night, rise } from '../scene/timeline.js';
import { n, type Fragment } from './fragment.js';
import type { KeyframeSheet } from './keyframes.js';

/**
 * Keyframe class that raises building `week` out from behind the track; shared with anything sitting on it.
 * Until the rise passes `hideUntil`, the building is pushed 25 px further down so roof boxes and the billboard
 * (which stick out above the roof) stay hidden, like the mock, which doesn't draw them at all then.
 */
export function riseClass(layout: Layout, kf: KeyframeSheet, week: number, hideUntil = 0): string {
  const h = layout.buildings[week].h;
  return kf.sample(
    (t) => {
      const r = rise(t, week, layout.weeks);
      return r <= hideUntil ? h + 25 : h * (1 - r);
    },
    (v) => `transform:translateY(${v}px)`,
    { tol: 0.4, digits: 1 },
  );
}

/** Buildings with lit windows rising behind the track, and the track itself. */
export function skyline(layout: Layout, p: Palette, kf: KeyframeSheet): Fragment {
  const W = layout.weeks;
  const buildings = layout.buildings
    .map((b, i) => {
      const top = DECK - b.h;
      const lights = kf.sample((t) => lightsOn(t, i, W) * 0.85, (v) => `opacity:${v}`);
      const steady: string[] = [], flicker: string[] = [];
      b.windows.forEach((w, j) => {
        const x = b.x + w.x, y = top + w.y;
        if (rand(i * 13 + j * 3 + 7) > 0.97) {
          const k = kf.sample(
            (t) => lightsOn(t, i, W) * 0.85 * (t >= T_NIGHT && rand(i * 13 + j * 3 + Math.floor(t * 1.2)) > 0.9 ? 0.2 : 1),
            (v) => `opacity:${v}`,
          );
          flicker.push(`<rect class="${k}" x="${x}" y="${n(y)}" width="2" height="2"/>`);
        } else steady.push(`M${x} ${n(y)}h2v2h-2z`);
      });
      return (
        `<g class="${riseClass(layout, kf, i)}">` +
        `<rect x="${b.x}" y="${n(top)}" width="${PITCH}" height="${n(b.h + 1)}" fill="${p.city}"/>` +
        `<rect x="${b.x}" y="${n(top)}" width="${PITCH}" height="1" fill="${p.cityEdge}"/>` +
        (b.roof ? `<rect x="${b.x + 4}" y="${n(top - 3)}" width="${PITCH - 8}" height="3" fill="${p.cityEdge}"/>` : '') +
        `<g fill="${p.win}">` +
        (steady.length ? `<path class="${lights}" d="${steady.join('')}"/>` : '') +
        flicker.join('') +
        `</g></g>`
      );
    })
    .join('');

  const trackK = kf.sample(night, (v) => `opacity:${v}`);
  let ties = '';
  for (let x = 0; x < layout.width; x += 6) ties += `M${x} ${DECK}h3v1.5h-3z`;
  return {
    defs: `<clipPath id="above-track"><rect width="${layout.width}" height="${DECK}"/></clipPath>`,
    body:
      `<g clip-path="url(#above-track)">${buildings}</g>` +
      `<g class="${trackK}"><rect y="${DECK}" width="${layout.width}" height="4" fill="${p.bridge}"/>` +
      `<rect y="${DECK - 1.5}" width="${layout.width}" height="1.5" fill="${p.ground}"/><path d="${ties}" fill="${p.ground}"/></g>`,
  };
}
