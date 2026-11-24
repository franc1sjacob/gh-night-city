import { n } from './fragment.js';

/** Canvas-style arc (angles in radians, clockwise on screen) as an SVG path. `close` adds a chord back to the start. */
export function arc(cx: number, cy: number, r: number, a0: number, a1: number, close = false): string {
  const p = (a: number) => `${n(cx + r * Math.cos(a))} ${n(cy + r * Math.sin(a))}`;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${p(a0)}A${n(r)} ${n(r)} 0 ${large} 1 ${p(a1)}${close ? 'Z' : ''}`;
}

export const rect = (x: number, y: number, w: number, h: number, r = 0, extra = '') =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${r ? ` rx="${n(r)}"` : ''}${extra}/>`;

export const circle = (cx: number, cy: number, r: number, extra = '') => `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"${extra}/>`;

export const ellipse = (cx: number, cy: number, rx: number, ry: number, extra = '') =>
  `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}"${extra}/>`;

/** A single eighth note, about 3 units tall, its head at (0,0). Drawn as shapes so no font is needed. */
export const NOTE = 'M-.9 0a.9 .65 -20 1 0 1.8 0a.9 .65 -20 1 0 -1.8 0ZM.75 -.1V-3.2h.32V-.1ZM1.07 -3.2q1.1 .5 1 1.6q-.4 -.9 -1 -.9Z';
/** Two beamed eighth notes. */
export const NOTES = 'M-.9 0a.9 .65 -20 1 0 1.8 0a.9 .65 -20 1 0 -1.8 0ZM1.6 -.4a.9 .65 -20 1 0 1.8 0a.9 .65 -20 1 0 -1.8 0ZM.75 -.1V-3.2h.32V-.1ZM3.25 -.5V-3.6h.32V-.5ZM.75 -3.2L3.57 -3.6V-3L.75 -2.6Z';
