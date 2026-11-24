import type { Calendar, Level } from '../data/calendar.js';
import { BOTTOM, GH, GTOP, LEFT, PITCH, SKY } from './constants.js';
import { rand } from './random.js';

export interface Square { x: number; y: number; level: Level; week: number; row: number }
export interface Building { x: number; h: number; roof: boolean; windows: { x: number; y: number }[] }

export interface Layout {
  width: number;
  height: number;
  weeks: number;
  total: number;
  squares: Square[];
  buildings: Building[];
  /** Week index of the building the cat sits on. */
  catAt: number;
  /** Week index of the building carrying the billboard. */
  boardAt: number;
  poles: number[];
  crows: { span: number; at: number }[];
  stars: { x: number; y: number; phase: number }[];
  clouds: { y: number; w: number; speed: number; offset: number }[];
  drops: { x: number; offset: number; speed: number }[];
}

/** Mock width for 53 weeks; pole positions were designed against it. */
const MOCK_WIDTH = 760;

export const colX = (i: number) => LEFT + i * PITCH;

export function buildLayout(cal: Calendar): Layout {
  const W = cal.weeks.length;
  const width = LEFT * 2 + W * PITCH - 2;
  const height = GTOP + GH + BOTTOM;
  const sums = cal.weeks.map((w) => w.counts.reduce((a, b) => a + b, 0));
  const maxSum = Math.max(1, ...sums);

  const squares: Square[] = [];
  cal.weeks.forEach((w, i) =>
    w.levels.forEach((level, k) => {
      const row = w.weekday + k;
      if (level > 0) squares.push({ x: colX(i), y: GTOP + row * PITCH, level, week: i, row });
    }),
  );

  const buildings: Building[] = sums.map((s, i) => {
    const f = Math.sqrt(s / maxSum);
    const h = 10 + f * (SKY - 22);
    const windows: { x: number; y: number }[] = [];
    for (let y = 5; y < h - 3; y += 5)
      for (let x = 3; x < PITCH - 3; x += 5) if (rand(i * 91 + x * 7 + y) < 0.12 + 0.5 * f) windows.push({ x, y });
    return { x: colX(i) - 1, h, roof: rand(i + 3) < 0.3, windows };
  });

  const order = [...sums.keys()].sort((a, b) => sums[b] - sums[a] || a - b);
  const tallest = order[0] ?? 0;
  const catAt = order.find((i) => Math.abs(i - tallest) > 4) ?? tallest;

  const lo = Math.round(W * 0.45), hi = Math.min(W, Math.round(W * 0.72));
  // Busiest week in the middle stretch, never the cat's building (the billboard would cover the cat).
  let boardAt = lo === catAt && lo + 1 < hi ? lo + 1 : lo;
  for (let i = lo; i < hi; i++) if (i !== catAt && sums[i] > sums[boardAt]) boardAt = i;

  const k = width / MOCK_WIDTH;
  return {
    width,
    height,
    weeks: W,
    total: cal.total,
    squares,
    buildings,
    catAt,
    boardAt,
    poles: [70, 300, 530, 745].map((p) => Math.round(p * k)),
    crows: [{ span: 0, at: 0.55 }, { span: 2, at: 0.35 }, { span: 2, at: 0.42 }],
    stars: Array.from({ length: 55 }, (_, n) => ({ x: rand(n) * width, y: 3 + rand(n + 300) * (SKY - 16), phase: rand(n + 600) * 6 })),
    clouds: [
      { y: 18, w: 90, speed: 6, offset: 0 },
      { y: 34, w: 60, speed: 9, offset: 350 },
      { y: 12, w: 70, speed: 4, offset: 620 },
    ],
    drops: Array.from({ length: 70 }, (_, n) => ({ x: rand(n + 40), offset: rand(n + 80), speed: 0.8 + rand(n + 120) * 0.5 })),
  };
}

