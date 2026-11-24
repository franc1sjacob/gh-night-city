// Time functions of the loop, ported from the mock. T is seconds into the loop, 0 <= T < CYCLE.
import { PHASES, T_DAWN, T_DUSK, T_NIGHT, T_ON } from './constants.js';
import { rand } from './random.js';

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** 0 = evening (just the squares), 1 = full night city. */
export function night(T: number): number {
  if (T < T_DUSK) return 0;
  if (T < T_ON) return ease((T - T_DUSK) / PHASES.dusk);
  if (T < T_DAWN) return 1;
  return 1 - ease(clamp((T - T_DAWN) / PHASES.dawn));
}

/** How far building `week` has risen out from behind the track, 0..1. */
export function rise(T: number, week: number, weeks: number): number {
  return ease(clamp(night(T) * 1.6 - (week / weeks) * 0.6));
}

/** Window lights of building `week`, 0..1 (before the mock's 0.85 alpha). */
export function lightsOn(T: number, week: number, weeks: number): number {
  return T >= T_ON ? clamp((T - T_ON - (week / weeks) * (PHASES.on - 0.8)) / 0.5) * night(T) : 0;
}

/** Brightness of the square at (week, row): 1 = its real color, 0 = the unlit color. */
export function squareOn(T: number, week: number, row: number, weeks: number): number {
  if (night(T) <= 0) return 1;
  if (T < T_ON) return 1 - night(T);
  if (T >= T_DAWN) return 1;
  const jitter = Math.round(rand(week * 7 + row) * 0.35 * 20) / 20; // quantized to 0.05 s so squares share keyframes
  const on = clamp((T - T_ON - (week / weeks) * (PHASES.on - 0.8) - jitter) / 0.3);
  if (T >= T_NIGHT && rand(week * 7 + row + Math.floor(T * 1.4) * 1000) > 0.993) return 0.35; // the odd flicker
  return on;
}

/**
 * squareOn split in two so most of it is shared: every square fades out together at dusk
 * (squaresDusk, on a parent group), then each lights back up on its own (squareWave).
 * squaresDusk(T) * squareWave(T, ...) equals squareOn(T, ...).
 */
export function squaresDusk(T: number): number {
  return T < T_ON ? 1 - night(T) : 1;
}

export function squareWave(T: number, week: number, row: number, weeks: number): number {
  return T < T_ON ? 1 : squareOn(T, week, row, weeks);
}
