import { CYCLE } from '../scene/constants.js';
import type { Layout } from '../scene/layout.js';
import type { Palette } from '../scene/palette.js';
import { night } from '../scene/timeline.js';
import { n, type Fragment } from './fragment.js';
import type { KeyframeSheet } from './keyframes.js';

const TWINKLE = CYCLE / 6; // close to the mock's 2π/1.6 s, and divides the loop

/** Background, night tint, stars, crescent moon and clouds. */
export function sky(layout: Layout, p: Palette, kf: KeyframeSheet): Fragment {
  const { width: W, height: H } = layout;
  const nightK = kf.sample(night, (v) => `opacity:${v}`);
  const starsK = kf.sample((t) => 0.15 + 0.5 * night(t), (v) => `opacity:${v}`);
  const twinkleK = kf.sample((t) => 0.5 + 0.5 * Math.sin((t / TWINKLE) * Math.PI * 2), (v) => `opacity:${v}`, { duration: TWINKLE, step: 0.05 });
  const moonK = kf.sample((t) => 0.4 + 0.6 * night(t), (v) => `opacity:${v}`);

  const stars = layout.stars
    .map((s) => {
      const delay = -((s.phase / (Math.PI * 2)) * TWINKLE) % TWINKLE;
      return `<rect class="${twinkleK}" style="animation-delay:${n(delay)}s" x="${n(s.x)}" y="${n(s.y)}" width="1" height="1"/>`;
    })
    .join('');

  const clouds = layout.clouds
    .map((c) => {
      const span = W + c.w * 2, dur = Math.round((span / c.speed) * 100) / 100;
      const k = kf.add([[0, `transform:translateX(${n(-c.w)}px)`], [100, `transform:translateX(${n(W + c.w)}px)`]], dur);
      const delay = -(c.offset / c.speed);
      return `<g class="${k}" style="animation-delay:${n(delay)}s"><rect x="0" y="${c.y}" width="${c.w}" height="7" rx="3.5"/><rect x="${n(c.w * 0.2)}" y="${c.y - 4}" width="${n(c.w * 0.45)}" height="8" rx="4"/></g>`;
    })
    .join('');

  const mx = W - 40, my = 22;
  return {
    defs: `<mask id="moon"><g transform="translate(${mx} ${my}) rotate(-20.05)"><circle r="9" fill="#fff"/><circle cx="-4.5" cy="-1" r="8.6" fill="#000"/></g></mask>`,
    body:
      `<rect width="${W}" height="${H}" fill="${p.bg}"/>` +
      `<rect class="${nightK}" width="${W}" height="${H}" fill="${p.night}"/>` +
      `<g class="${starsK}" fill="${p.star}">${stars}</g>` +
      `<circle class="${moonK}" cx="${mx}" cy="${my}" r="9" fill="${p.moon}" mask="url(#moon)"/>` +
      `<g fill="${p.cloud}">${clouds}</g>`,
  };
}
