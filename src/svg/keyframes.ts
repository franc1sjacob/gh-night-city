import { CYCLE } from '../scene/constants.js';

/** Seconds into the loop to a keyframe percent, 3 decimals. */
export const at = (seconds: number) => Math.round((seconds / CYCLE) * 100 * 1000) / 1000;

type Stop = [percent: number, decls: string];

/**
 * Collects @keyframes. Identical stops (and duration) share one name; each name also gets a
 * class rule that runs it linearly and forever, so elements just add the class.
 */
export class KeyframeSheet {
  private byKey = new Map<string, string>();
  private rules: string[] = [];

  add(stops: Stop[], duration = CYCLE): string {
    const body = stops.map(([p, d]) => `${p}%{${d}}`).join('');
    const key = `${duration}|${body}`;
    const hit = this.byKey.get(key);
    if (hit) return hit;
    const name = `k${this.byKey.size.toString(36)}`;
    this.byKey.set(key, name);
    this.rules.push(`@keyframes ${name}{${body}}.${name}{animation:${name} ${duration}s linear infinite}`);
    return name;
  }

  /** Samples f over [0, duration), simplifies, and adds the resulting keyframes. */
  sample(f: (t: number) => number, decl: (v: number) => string, opts: { duration?: number; step?: number; tol?: number; digits?: number } = {}): string {
    const { duration = CYCLE, step = 0.025, tol = 0.006, digits = 2 } = opts;
    const stops = sampleStops(f, duration, step, tol, digits);
    return this.add(stops.map(([p, v]) => [p, decl(v)]), duration);
  }

  css(): string {
    return this.rules.join('');
  }
}

/** Samples f and drops points a straight line between neighbors already explains (Ramer-Douglas-Peucker). */
export function sampleStops(f: (t: number) => number, duration: number, step: number, tol: number, digits = 3): [number, number][] {
  const q = 10 ** digits;
  const count = Math.round(duration / step);
  const pts: [number, number][] = [];
  for (let k = 0; k <= count; k++) {
    const t = Math.min(duration, k * step);
    pts.push([t, Math.round(f(k === count ? 0 : t) * q) / q]); // last stop equals the first so the loop is seamless
  }
  const keep = new Array(pts.length).fill(false);
  keep[0] = keep[pts.length - 1] = true;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    let worst = -1, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const [t0, v0] = pts[a], [t1, v1] = pts[b], [t, v] = pts[i];
      const d = Math.abs(v - (v0 + ((v1 - v0) * (t - t0)) / (t1 - t0)));
      if (d > worst) { worst = d; idx = i; }
    }
    if (worst > tol) { keep[idx] = true; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]).map(([t, v]) => [Math.round((t / duration) * 100 * 1000) / 1000, v]);
}
