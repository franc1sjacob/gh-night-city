import { expect } from 'vitest';

/** Nothing GitHub's image proxy would strip or block, and nothing loaded from outside the file. */
export function assertSelfContained(svg: string) {
  expect(svg).not.toMatch(/<script/i);
  expect(svg).not.toMatch(/<text[\s>]/i);
  expect(svg).not.toMatch(/<image[\s>]/i);
  expect(svg).not.toMatch(/<foreignObject/i);
  expect(svg).not.toMatch(/href="(?!#)/i);
  expect(svg).not.toMatch(/@import/i);
  expect(svg).not.toMatch(/url\((?!#)/i);
}

/** Flat fills only: no gradients, blur, shadows or glow. */
export function assertFlat(svg: string) {
  expect(svg).not.toMatch(/Gradient/);
  expect(svg).not.toMatch(/feGaussianBlur|feDropShadow|drop-shadow|blur\(/);
}

export function assertFinite(svg: string) {
  expect(svg).not.toMatch(/NaN|Infinity|undefined/);
}
