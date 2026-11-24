import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import { DEFAULT_SIGN, SIGN_MAX } from '../scene/constants.js';

export const FONT_FILE = 'jetbrains-mono-latin-700-normal.woff';

let font: opentype.Font | undefined;

/** JetBrains Mono Bold: next to the bundled action if present, otherwise from @fontsource. */
function loadFont(): opentype.Font {
  if (font) return font;
  const bundled = fileURLToPath(new URL(`./${FONT_FILE}`, import.meta.url));
  const path = existsSync(bundled) ? bundled : createRequire(import.meta.url).resolve(`@fontsource/jetbrains-mono/files/${FONT_FILE}`);
  const buf = readFileSync(path);
  font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  return font;
}

/** Validates the billboard text. Empty means the default; too long or undrawable fails with a clear message. */
export function normalizeSignText(input: string | undefined): string {
  const text = (input ?? '').trim();
  if (!text) return DEFAULT_SIGN;
  const chars = [...text];
  if (chars.length > SIGN_MAX) throw new Error(`sign-text is ${chars.length} characters; the limit is ${SIGN_MAX}`);
  const f = loadFont();
  for (const ch of chars) if (ch !== ' ' && f.charToGlyphIndex(ch) === 0) throw new Error(`sign-text contains "${ch}", which JetBrains Mono can't draw`);
  return text;
}

/** The text as one SVG path, baseline at y = 0, starting at x = 0. */
export function textToPath(text: string, sizePx: number): { d: string; width: number } {
  const f = loadFont();
  return { d: f.getPath(text, 0, 0, sizePx).toPathData(2), width: f.getAdvanceWidth(text, sizePx) };
}
