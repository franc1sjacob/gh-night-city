import { CS, RADIUS } from '../scene/constants.js';
import type { Layout } from '../scene/layout.js';
import type { Palette } from '../scene/palette.js';
import { squareWave, squaresDusk } from '../scene/timeline.js';
import type { Fragment } from './fragment.js';
import type { KeyframeSheet } from './keyframes.js';

/** Active days only: an unlit square underneath, and the real color on top fading out at dusk and back in week by week. */
export function squares(layout: Layout, p: Palette, kf: KeyframeSheet): Fragment {
  const r = `width="${CS}" height="${CS}" rx="${RADIUS}"`;
  const dim = layout.squares.map((s) => `<rect x="${s.x}" y="${s.y}" ${r}/>`).join('');
  const lit = layout.squares
    .map((s) => {
      const k = kf.sample((t) => squareWave(t, s.week, s.row, layout.weeks), (v) => `opacity:${v}`, { tol: 0.01 });
      return `<rect class="sq ${k}" x="${s.x}" y="${s.y}" ${r} fill="${p.cells[s.level]}"/>`;
    })
    .join('');
  const dusk = kf.sample(squaresDusk, (v) => `opacity:${v}`);
  return { body: `<g fill="${p.dimCell}">${dim}</g><g class="${dusk}">${lit}</g>` };
}
