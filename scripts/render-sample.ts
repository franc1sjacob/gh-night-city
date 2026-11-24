// Renders the reference sample to out/ so the SVG can be compared with the mock (preview/compare.html).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { calendarFromSample } from '../src/data/calendar.js';
import { buildLayout } from '../src/scene/layout.js';
import { renderSvg } from '../src/svg/render.js';

const sample = calendarFromSample(JSON.parse(readFileSync('docs/reference/sample-calendar.json', 'utf8')));
const layout = buildLayout(sample);
const signText = process.argv[2] ?? 'coding 24/7';
mkdirSync('out', { recursive: true });
for (const theme of ['dark', 'light'] as const) {
  const svg = renderSvg(layout, theme, { signText });
  writeFileSync(`out/sample-${theme}.svg`, svg);
  console.log(`out/sample-${theme}.svg ${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB`);
}
// The mock with the sample inlined, and the comparison page, so `npx http-server out` (or any static server) can show both.
const sampleRaw = readFileSync('docs/reference/sample-calendar.json', 'utf8').trim();
writeFileSync('out/mock.html', readFileSync('docs/reference/mock.html', 'utf8').replace('__DATA__', sampleRaw));
writeFileSync('out/compare.html', readFileSync('preview/compare.html', 'utf8'));
