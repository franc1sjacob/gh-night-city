export interface Fragment {
  defs?: string;
  body: string;
}

export function joinFragments(parts: Fragment[]): { defs: string; body: string } {
  return { defs: parts.map((p) => p.defs ?? '').join(''), body: parts.map((p) => p.body).join('') };
}

/** Compact number formatting for SVG attributes. */
export const n = (v: number) => String(Math.round(v * 100) / 100);
