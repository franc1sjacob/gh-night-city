import { CYCLE, DECK, PITCH } from '../scene/constants.js';
import { colX, type Layout } from '../scene/layout.js';
import type { Palette } from '../scene/palette.js';
import { night, rise } from '../scene/timeline.js';
import { n, type Fragment } from './fragment.js';
import type { KeyframeSheet } from './keyframes.js';
import { circle, ellipse } from './shapes.js';

const WIRES = [30, 35];
const SWAY = CYCLE / 5;

/** Four poles in front of the city, two sagging wires per span, three crows bobbing their heads. */
export function powerLines(layout: Layout, p: Palette, kf: KeyframeSheet): Fragment {
  const P = layout.poles, W = layout.width;
  const spans: [number, number][] = [[-40, P[0]], ...P.slice(1).map((x, j) => [P[j], x] as [number, number]), [P[P.length - 1], W + 40]];
  const fade = kf.sample(night, (v) => `opacity:${v}`);
  const wires = spans.flatMap(([x0, x1]) => WIRES.map((y) => `M${n(x0)} ${y}Q${n((x0 + x1) / 2)} ${n(y + (x1 - x0) * 0.12)} ${n(x1)} ${y}`)).join('');
  const poles = P.map(
    (px) => `<g class="pole"><rect x="${px - 1}" y="${WIRES[0] - 6}" width="2" height="${DECK - WIRES[0] + 6}"/><rect x="${px - 7}" y="${WIRES[0] - 1}" width="14" height="1.6"/><rect x="${px - 5}" y="${WIRES[1] - 1}" width="10" height="1.4"/></g>`,
  ).join('');
  const bob = kf.sample((t) => Math.sin((t / SWAY) * Math.PI * 2) * 0.3, (v) => `transform:translateY(${v}px)`, { duration: SWAY, step: 0.05, tol: 0.02 });
  const crows = layout.crows
    .map((c) => {
      const [x0, x1] = spans[c.span + 1];
      const d = (x1 - x0) * 0.06, cx = x0 + (x1 - x0) * c.at, cy = WIRES[0] + 4 * d * c.at * (1 - c.at) - 0.4;
      const delay = -(((c.at * 9) / (Math.PI * 2)) * SWAY) % SWAY;
      return (
        `<g class="crow">` +
        ellipse(cx, cy - 2.2, 2.2, 1.7, ` transform="rotate(-11.46 ${n(cx)} ${n(cy - 2.2)})"`) +
        `<path d="M${n(cx - 1.8)} ${n(cy - 2)}L${n(cx - 4)} ${n(cy - 1)}L${n(cx - 1.5)} ${n(cy - 1.2)}Z"/>` +
        `<g class="${bob}" style="animation-delay:${n(delay)}s">${circle(cx + 1.8, cy - 3.8, 1.2)}<path d="M${n(cx + 2.8)} ${n(cy - 3.9)}L${n(cx + 4.2)} ${n(cy - 3.6)}L${n(cx + 2.8)} ${n(cy - 3.3)}Z"/></g>` +
        `</g>`
      );
    })
    .join('');
  return { body: `<g class="${fade}"><path d="${wires}" fill="none" stroke="${p.pole}" stroke-width=".8"/><g fill="${p.pole}">${poles}${crows}</g></g>` };
}

/** A small cat on a rooftop, appearing once its building has risen, swishing its tail. */
export function cat(layout: Layout, p: Palette, kf: KeyframeSheet): Fragment {
  const i = layout.catAt, b = layout.buildings[i];
  const x = colX(i) - 1 + PITCH / 2 + 1, y = DECK - b.h - (b.roof ? 3 : 0);
  const show = kf.sample((t) => (rise(t, i, layout.weeks) > 0.98 ? 1 : 0), (v) => `opacity:${v}`, { tol: 0 });
  const swish = kf.sample((t) => Math.sin((t / SWAY) * Math.PI * 2) * 12, (v) => `transform:rotate(${v}deg)`, { duration: SWAY, step: 0.05, tol: 0.5, digits: 1 });
  return {
    body:
      `<g class="cat"><g class="${show}" fill="${p.sil}">` +
      ellipse(x, y - 3.5, 3.2, 3.8) + circle(x + 0.5, y - 8.5, 2.4) +
      `<path d="M${n(x - 1.6)} ${n(y - 10)}L${n(x - 1.2)} ${n(y - 12.6)}L${n(x + 0.2)} ${n(y - 10.6)}ZM${n(x + 1)} ${n(y - 10.6)}L${n(x + 2.6)} ${n(y - 12.6)}L${n(x + 2.8)} ${n(y - 9.8)}Z"/>` +
      `<path class="${swish}" style="transform-origin:${n(x - 2.5)}px ${n(y - 1)}px" d="M${n(x - 2.5)} ${n(y - 1)}Q${n(x - 7)} ${n(y - 1)} ${n(x - 7)} ${n(y - 6)}" fill="none" stroke="${p.sil}" stroke-width="1.4" stroke-linecap="round"/>` +
      `</g></g>`,
  };
}

/** Light diagonal drizzle at night. Each drop's fall time is rounded so a whole number of falls fit in the loop. */
export function rain(layout: Layout, p: Palette, kf: KeyframeSheet): Fragment {
  const { width: W, height: H } = layout;
  const fade = kf.sample((t) => 0.28 * night(t), (v) => `opacity:${v}`);
  const drift = -(H + 20) * 0.25;
  const drops = layout.drops
    .map((d) => {
      const period = CYCLE / Math.max(1, Math.round(CYCLE * d.speed * 0.55));
      const k = kf.add([[0, 'transform:translate(0,0)'], [100, `transform:translate(${n(drift)}px,${H + 20}px)`]], Math.round(period * 1e4) / 1e4);
      const x = d.x * (W + 40);
      return `<path class="${k}" style="animation-delay:${n(-d.offset * period)}s" d="M${n(x)} -10l-1.5 6"/>`;
    })
    .join('');
  return { body: `<g class="${fade}"><g fill="none" stroke="${p.rain}" stroke-width=".8">${drops}</g></g>` };
}

/** Very light, static film grain in the theme's grain color. */
export function grain(layout: Layout, p: Palette, _kf: KeyframeSheet): Fragment {
  return {
    defs:
      `<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="1" seed="7" stitchTiles="stitch"/>` +
      `<feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1.6 -0.8" result="dots"/><feFlood flood-color="${p.grain}"/><feComposite in2="dots" operator="in"/></filter>`,
    body: `<rect width="${layout.width}" height="${layout.height}" filter="url(#grain)" opacity=".05"/>`,
  };
}
