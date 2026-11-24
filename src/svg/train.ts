import { CYCLE, DECK, RIDER_SCALE, TRAIN_DURATION, TRAIN_SCALE, TRAIN_START } from '../scene/constants.js';
import type { Layout } from '../scene/layout.js';
import type { Palette } from '../scene/palette.js';
import { at, type KeyframeSheet } from './keyframes.js';
import { n, type Fragment } from './fragment.js';
import { arc, circle, ellipse, NOTE, NOTES, rect } from './shapes.js';

const CAR = 38, GAP = 2, LEN = 4 * CAR + 3 * GAP, TOP = -12.5;
export const TRAIN_LENGTH = LEN * TRAIN_SCALE;

const startX = () => -TRAIN_LENGTH - 20;
const endX = (layout: Layout) => -TRAIN_LENGTH - 20 + layout.width + TRAIN_LENGTH + 40;

/** x of the train's nose at loop time t, or null while it is off screen (the mock's formula). */
export function trainNoseAt(t: number, layout: Layout): number | null {
  const tp = (t - TRAIN_START) / TRAIN_DURATION;
  if (tp <= 0 || tp >= 1) return null;
  return startX() + tp * (endX(layout) - startX()) + TRAIN_LENGTH;
}

// Periods for the rider's small loops, chosen to divide the 23.1 s loop.
const NOD = CYCLE / 7, STEAM = CYCLE / 12, MUSIC = CYCLE / 8;

function rider(p: Palette, kf: KeyframeSheet): string {
  const nod = kf.sample((t) => Math.sin((t / NOD) * Math.PI * 2) * 0.25, (v) => `transform:translateY(${v}px)`, { duration: NOD, step: 0.05, tol: 0.01 });
  const dot = kf.sample((t) => 0.7 + 0.3 * Math.sin((t / NOD) * Math.PI * 2), (v) => `opacity:${v}`, { duration: NOD, step: 0.05 });
  const steam = kf.add([[0, 'transform:translateY(0)'], [100, 'transform:translateY(-3px)']], STEAM);
  const steamFade = kf.sample((t) => Math.sin((t / STEAM) * Math.PI) * 0.7, (v) => `opacity:${v}`, { duration: STEAM, step: 0.05 });
  const music = kf.add([[0, 'transform:translate(0,0)'], [100, 'transform:translate(-7px,-6px)']], MUSIC);
  const musicFade = kf.sample((t) => Math.sin((t / MUSIC) * Math.PI) * 0.9, (v) => `opacity:${v}`, { duration: MUSIC, step: 0.05 });
  const hy = -10.1;
  const steamCurl = (k: number) => `<path d="M${n(-7.6 + k * 0.9)} -3Q${n(-8.3 + k * 0.9)} -3.8 ${n(-7.5 + k * 0.9)} -4.6"/>`;
  return (
    `<g class="rider" transform="scale(${RIDER_SCALE})">` +
    // coffee mug and steam
    `<g fill="${p.stripe}">${rect(-8.4, -2.6, 2.2, 2.6, 0.4)}</g>` +
    `<path d="${arc(-6.1, -1.4, 0.7, -Math.PI / 2, Math.PI / 2)}" fill="none" stroke="${p.stripe}" stroke-width=".4"/>` +
    `<g fill="none" stroke="${p.steam}" stroke-width=".35">` +
    `<g class="${steam}"><g class="${steamFade}">${steamCurl(0)}</g></g>` +
    `<g class="${steam}" style="animation-delay:${n(-STEAM / 2)}s"><g class="${steamFade}" style="animation-delay:${n(-STEAM / 2)}s">${steamCurl(1)}</g></g></g>` +
    // crossed legs and shoes
    ellipse(0, -1.1, 4.6, 1.4, ` fill="${p.pants}"`) +
    `<g fill="${p.hair}">${ellipse(-4.2, -0.8, 1, 0.7)}${ellipse(4.2, -0.8, 1, 0.7)}</g>` +
    // forearms behind the t-shirt, then the shirt as one flat shape
    `<g fill="${p.skin}">${rect(-3.5, -5.6, 1.2, 3.7, 0.5)}${rect(2.3, -5.6, 1.2, 3.7, 0.5)}</g>` +
    `<path d="M-2.4 -7.9L2.4 -7.9L3.7 -7.2L3.7 -5.3L2.7 -5.3L2.7 -1L-2.7 -1L-2.7 -5.3L-3.7 -5.3L-3.7 -7.2Z" fill="${p.shirt}"/>` +
    // laptop: the back of the lid with a softly pulsing dot
    `<g fill="${p.board}">${rect(-3.1, -5.4, 6.2, 4, 0.4)}${rect(-3.5, -1.7, 7, 0.6, 0.3)}</g>` +
    circle(0, -3.4, 0.45, ` class="${dot}" fill="${p.screen}"`) +
    // head, nodding
    `<g class="${nod}">` +
    circle(0, hy, 3, ` fill="${p.skin}"`) +
    `<path d="${arc(0, hy + 1.4, 2.2, 0, Math.PI, true)}" fill="${p.screen}" opacity=".18"/>` +
    `<g fill="${p.hair}"><path d="${arc(0, hy, 3.2, Math.PI, Math.PI * 2, true)}"/>` +
    [[-2.1, 0.95], [-0.8, 1.05], [0.6, 0.95], [1.9, 0.9]].map(([fx, fr]) => circle(fx, hy - 0.25, fr)).join('') +
    circle(0.6, hy - 3.1, 0.8) +
    `</g>` +
    `<path d="${arc(-1.15, hy + 0.9, 0.5, 0.25, Math.PI - 0.25)}${arc(1.15, hy + 0.9, 0.5, 0.25, Math.PI - 0.25)}M-.35 ${n(hy + 2)}H.35" fill="none" stroke="${p.hair}" stroke-width=".35" stroke-linecap="round"/>` +
    `<path d="${arc(0, hy - 0.3, 3.6, Math.PI * 1.05, Math.PI * 1.95)}" fill="none" stroke="${p.stripe}" stroke-width=".75"/>` +
    `<g fill="${p.stripe}">${rect(-4.2, hy - 0.6, 1.4, 2.7, 0.6)}${rect(2.8, hy - 0.6, 1.4, 2.7, 0.6)}</g>` +
    `</g>` +
    // music drifting up behind them
    `<g fill="${p.note}">` +
    `<g class="${music}"><g class="${musicFade}"><path transform="translate(-4 -13)" d="${NOTES}"/></g></g>` +
    `<g class="${music}" style="animation-delay:${n(-MUSIC / 2)}s"><g class="${musicFade}" style="animation-delay:${n(-MUSIC / 2)}s"><path transform="translate(-4 -13)" d="${NOTE}"/></g></g>` +
    `</g></g>`
  );
}

/** The late train with the rider on its second car, crossing once per loop. */
export function train(layout: Layout, p: Palette, kf: KeyframeSheet): Fragment {
  const s = at(TRAIN_START), e = at(TRAIN_START + TRAIN_DURATION);
  const x0 = n(startX()), x1 = n(endX(layout));
  const move = kf.add([
    [0, `transform:translateX(${x0}px)`],
    [s, `transform:translateX(${x0}px)`],
    [e, `transform:translateX(${x1}px)`],
    [Math.round((e + 0.001) * 1000) / 1000, `transform:translateX(${x0}px)`],
    [100, `transform:translateX(${x0}px)`],
  ]);
  let cars = '';
  for (let c = 0; c < 4; c++) {
    const cx = c * (CAR + GAP), front = c === 3;
    if (c < 3) cars += rect(cx + CAR, TOP + 4, GAP, 4, 0, ` fill="${p.trainRoof}"`);
    cars += rect(cx + 3, TOP - 1, CAR - (front ? 9 : 6), 1.5, 0, ` fill="${p.trainRoof}"`);
    cars += front
      ? `<path d="M${cx + 2} ${TOP}H${cx + CAR - 6}Q${cx + CAR} ${TOP} ${cx + CAR} ${TOP + 6}V${TOP + 8.5}Q${cx + CAR} ${TOP + 10} ${cx + CAR - 1.5} ${TOP + 10}H${cx + 2}Q${cx} ${TOP + 10} ${cx} ${TOP + 8}V${TOP + 2}Q${cx} ${TOP} ${cx + 2} ${TOP}Z" fill="${p.train}"/>`
      : rect(cx, TOP, CAR, 10, 2, ` fill="${p.train}"`);
    let wins = '';
    for (let k = 0; k < (front ? 4 : 5); k++) wins += `M${n(cx + 3 + k * 6.6)} ${TOP + 2.5}h4v3h-4z`;
    if (front) wins += `M${cx + CAR - 8} ${TOP + 2.5}L${cx + CAR - 4} ${TOP + 2.5}L${cx + CAR - 2} ${TOP + 5.5}L${cx + CAR - 8} ${TOP + 5.5}Z`;
    cars += `<path d="${wins}" fill="${p.win}"/>`;
    if (front) cars += rect(cx + CAR - 2, TOP + 6.5, 1.5, 1.5, 0, ` fill="${p.head}"`);
    cars += rect(cx + 1, TOP + 7, CAR - (front ? 3 : 2), 1, 0, ` fill="${p.stripe}"`);
    cars += `<g fill="${p.pole}">${[6, 11, CAR - 11, CAR - 6].map((wx) => circle(cx + wx, -2, 1.4)).join('')}</g>`;
    if (c === 1) cars += `<g transform="translate(${cx + 18} ${TOP - 1})">${rider(p, kf)}</g>`;
  }
  return { body: `<g class="${move}"><g transform="translate(0 ${DECK}) scale(${TRAIN_SCALE})">${cars}</g></g>` };
}
