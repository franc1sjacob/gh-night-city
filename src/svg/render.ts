import type { Layout } from '../scene/layout.js';
import { PALETTES, type Theme } from '../scene/palette.js';
import { joinFragments, type Fragment } from './fragment.js';
import { KeyframeSheet } from './keyframes.js';
import { sky } from './sky.js';
import { skyline } from './skyline.js';
import { squares } from './squares.js';
import { crossing } from './crossing.js';
import { train } from './train.js';
import { billboard } from './billboard.js';
import { cat, grain, powerLines, rain } from './street.js';

export interface RenderOptions {
  signText: string;
}

/** The whole scene, back to front, as one self-contained animated SVG. */
export function renderSvg(layout: Layout, theme: Theme, options: RenderOptions): string {
  const p = PALETTES[theme];
  const kf = new KeyframeSheet();
  const parts: Fragment[] = [
    sky(layout, p, kf),
    skyline(layout, p, kf),
    cat(layout, p, kf),
    billboard(layout, p, kf, options.signText),
    powerLines(layout, p, kf),
    squares(layout, p, kf),
    crossing(layout, p, kf),
    train(layout, p, kf),
    rain(layout, p, kf),
    grain(layout, p, kf),
  ];
  const { defs, body } = joinFragments(parts);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.width} ${layout.height}" width="${layout.width}" height="${layout.height}" role="img">` +
    `<title>Contribution graph as a lofi night city</title>` +
    `<style>${kf.css()}</style><defs>${defs}</defs>${body}</svg>`
  );
}
