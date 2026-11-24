# gh-night-city Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A GitHub Action that renders a user's contribution calendar as the lofi night city animated SVG (dark and light), then put it on Francis's profile.

**Architecture:** Three layers. `data` fetches the calendar. `scene` turns it into a pure, deterministic description of what is where and when (layout, palette, timeline), ported from the mock's constants and formulas. `svg` renders that description to a self-contained SVG string using CSS `@keyframes` on a single 23.1 s loop; each element module returns a fragment, and `renderSvg` stitches them in back-to-front order. The action and the local preview command are thin wrappers around `renderSvg`.

**Tech Stack:** TypeScript (strict, ESM), Node 22 locally, action runtime `node24`, vitest, esbuild (bundle to `dist/index.js`), `@actions/core`, `opentype.js`, `@fontsource/jetbrains-mono` (WOFF, OFL), `fast-xml-parser` (tests only).

**Spec:** `docs/superpowers/specs/2026-11-24-night-city-design.md`. Visual reference: `docs/reference/mock.html` (replace `__DATA__` with `docs/reference/sample-calendar.json`). Where the spec says "the mock wins", port the mock's numbers exactly.

## Global Constraints

- Output is two files, `night-city-dark.svg` and `night-city-light.svg`, self-contained: no `<script>`, no `<text>`, no `<image>`, no `href`/`xlink:href` to anything outside the file, no `@import`, no `url(http`.
- Flat fills only: no `<linearGradient>`, `<radialGradient>`, blur, drop-shadow or glow.
- Deterministic: same calendar + same options produce byte-identical output. Use the mock's `rand(s) = frac(sin(s * 127.1) * 43758.5453)`; never `Math.random()` or the clock.
- Size: under 500 KB per variant on `docs/reference/sample-calendar.json` (test-enforced); hard ceiling 1 MB.
- Loop: 23.1 s = evening 2.5 + dusk 1.8 + lights-on 4 + night 13 + dawn 1.8. Train takes 15 s, starting 1.2 s into lights-on.
- Sizes: train scale 1.8, rider scale 1.0. Square 12, pitch 14, radius 2.5, `LEFT` 10, `SKY` 84, `DECK` 108, `GTOP` 118, width `20 + W*14 - 2`, height `GTOP + 96 + 10`.
- Palettes: exactly the mock's `PAL.dark` / `PAL.light` (the `green` and `code` entries are not used).
- `sign-text`: default `coding 24/7`, max 40 characters, rendered in JetBrains Mono Bold as paths, followed by `  ·  ` and repeated so the scroll loops seamlessly.
- Prose (README, comments, commits): no em-dashes.
- Action inputs: `github-token` (default `${{ github.token }}`), `username` (default repo owner), `output-dir` (default `dist`), `sign-text` (default `coding 24/7`).
- No npm publishing; the preview command runs from a clone.

## Review Focus

1. **A calendar of 54 weeks, or a partial first/last week:** everything placed from the real `W`; nothing drawn past the right edge; missing days simply absent. (Task 2 test `layout handles 54 weeks and partial weeks`.)
2. **A brand new account with zero contributions:** renders a valid SVG, no `NaN`/`Infinity`/`undefined` anywhere in the output. (Task 2 test `layout handles an empty calendar`, Task 3 test `no NaN in output for empty calendar`.)
3. **`sign-text` with an emoji, CJK, more than 40 characters, or empty:** emoji/CJK/over-length fail with a message naming the problem; empty falls back to the default. (Task 5 tests.)
4. **A bad token or a username that doesn't exist:** the action fails with GitHub's error message and writes no files, rather than drawing an empty city. (Task 1 and Task 7 tests.)
5. **GitHub's image proxy stripping something:** output contains none of the forbidden constructs above. (Task 3 test `svg is self-contained`, re-run over the full render in Task 7.)

---

## File Structure

```
action.yml                     action metadata (inputs, runs: node24, main: dist/index.js)
package.json, tsconfig.json, vitest.config.ts, esbuild.mjs, LICENSE (MIT), README.md
src/
  data/calendar.ts             types + fetchCalendar()
  scene/random.ts              rand(), seeded helpers
  scene/constants.ts           sizes, scales, timing (the "settings in one place" from the spec)
  scene/palette.ts             PALETTES.dark / PALETTES.light
  scene/layout.ts              buildLayout(): squares, buildings, picks (cat, board), poles, crows, stars, clouds, drops
  svg/keyframes.ts             KeyframeSheet: dedupe + name keyframes, seconds -> percent helpers
  svg/fragment.ts              Fragment type and joinFragments()
  svg/sky.ts                   background, night overlay, stars, crescent moon, clouds
  svg/skyline.ts               buildings, windows, track
  svg/squares.ts               contribution squares
  svg/train.ts                 train + rider (port of drawRider)
  svg/crossing.ts              crossing signal
  svg/billboard.ts             billboard + scrolling text
  svg/font.ts                  textToPath() with JetBrains Mono Bold
  svg/street.ts                power lines, crows, cat, rain, grain
  svg/render.ts                renderSvg(layout, theme, options)
  cli/preview.ts               local preview command
  action/main.ts               action entry
tests/ (one test file per src module, plus fixtures/)
preview/compare.html           side-by-side mock vs SVG with a time scrubber (dev tool)
.github/workflows/ci.yml       test + build check
examples/profile-workflow.yml  the recommended workflow from the README
```

---

### Task 1: Scaffold and calendar fetch

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore` (`node_modules`, `out/`), `LICENSE` (MIT, Francis Taino, 2026), `src/data/calendar.ts`, `tests/calendar.test.ts`, `tests/fixtures/sample-calendar.json` (copy of `docs/reference/sample-calendar.json`), `tests/fixtures/graphql-response.json` (a GraphQL response shaped like GitHub's, 2 weeks)

**Interfaces:**
- Produces:
  - `type Level = 0 | 1 | 2 | 3 | 4`
  - `interface Week { firstDay: string; weekday: number; counts: number[]; levels: Level[] }` (`weekday` is the weekday of the week's first day; arrays may be shorter than 7)
  - `interface Calendar { total: number; weeks: Week[] }`
  - `fetchCalendar(username: string, token: string, fetchImpl?: typeof fetch): Promise<Calendar>`
  - `calendarFromSample(json: {total:number; weeks:{d:string; wd:number; c:number[]; l:number[]}[]}): Calendar` (adapter for the reference sample, used by tests and preview)

- [ ] **Step 1:** `npm init`, add deps (`@actions/core`, `opentype.js`, `@fontsource/jetbrains-mono`) and dev deps (`typescript`, `vitest`, `esbuild`, `@types/node`, `@types/opentype.js`, `fast-xml-parser`). `"type": "module"`, scripts `test`, `build`, `preview`, `typecheck`.
- [ ] **Step 2: Write failing tests** in `tests/calendar.test.ts`:
  - `maps GitHub levels to 0-4`: with a stubbed `fetchImpl` returning `graphql-response.json`, `FIRST_QUARTILE` maps to 1 and `FOURTH_QUARTILE` to 4, `total` and `firstDay` carried over.
  - `sends the token and username`: the stub sees `Authorization: bearer <token>` and the username in the variables.
  - `throws GitHub's message on GraphQL errors`: stub returns `{errors:[{message:"Could not resolve to a User with the login of 'nope'."}]}`; rejects with that text.
  - `throws on HTTP 401`: rejects with a message containing `401`.
  - `calendarFromSample round-trips the reference sample`: 53 weeks, total 1844.
- [ ] **Step 3:** Run `npx vitest run tests/calendar.test.ts`; expect failures (module missing).
- [ ] **Step 4:** Implement `src/data/calendar.ts` (POST to `https://api.github.com/graphql`, query `contributionCalendar { totalContributions weeks { firstDay contributionDays { contributionCount contributionLevel weekday } } }`).
- [ ] **Step 5:** Tests pass; `npx tsc --noEmit` clean.
- [ ] **Step 6:** Commit `feat: scaffold project and fetch contribution calendar`.

### Task 2: Scene model (constants, palette, layout)

**Files:**
- Create: `src/scene/random.ts`, `src/scene/constants.ts`, `src/scene/palette.ts`, `src/scene/layout.ts`, `tests/layout.test.ts`

**Interfaces:**
- Consumes: `Calendar`, `Level` (Task 1)
- Produces:
  - `rand(seed: number): number`
  - `constants.ts`: `CS, PITCH, LEFT, SKY, DECK, GTOP, GH, TRAIN_SCALE = 1.8, RIDER_SCALE = 1, PHASES = { day: 2.5, dusk: 1.8, on: 4, night: 13, dawn: 1.8 }, CYCLE = 23.1, TRAIN_DURATION = 15, TRAIN_START = 2.5 + 1.8 + 1.2, SIGN_MAX = 40, DEFAULT_SIGN = 'coding 24/7'`
  - `type Theme = 'dark' | 'light'`; `PALETTES: Record<Theme, Palette>` where `Palette` has the mock's keys (`cells` is `[string,string,string,string,string]`)
  - `interface Layout { width: number; height: number; weeks: number; squares: {x:number;y:number;level:Level;week:number;row:number}[]; buildings: {x:number;h:number;roof:boolean;windows:{x:number;y:number}[]}[]; catAt:number; boardAt:number; poles:number[]; crows:{span:number;at:number}[]; stars:{x:number;y:number;phase:number}[]; clouds:{y:number;w:number;speed:number;offset:number}[]; drops:{x:number;offset:number;speed:number}[]; total:number }`
  - `buildLayout(cal: Calendar): Layout`

Port each formula from the mock (`city`, `catAt`, `boardAt`, `stars`, `clouds`, `drops`), with these changes the spec requires: only windows with `on === true` are kept; `maxSum` of 0 is treated as 1; `boardAt` searches weeks `round(W*0.45)` to `round(W*0.72)` instead of 24 to 38; `poles` are the mock's `[70, 300, 530, 745]` scaled by `width / 760`.

- [ ] **Step 1: Write failing tests** in `tests/layout.test.ts`:
  - `reference sample matches the mock`: `width === 760`, `height === 224`, `squares.length` equals the count of non-zero levels in the sample, `buildings.length === 53`, `catAt === 41`, `boardAt === 24`.
  - `layout handles 54 weeks and partial weeks`: synthetic 54-week calendar whose first week has 3 days and last has 2; every square has `x + 12 <= width`, the poles' last entry is `< width`, `boardAt` lies inside the search range.
  - `layout handles an empty calendar`: all counts zero; `squares.length === 0`, every number in the layout is finite.
  - `layout is deterministic`: `buildLayout(c)` deep-equals a second call.
- [ ] **Step 2:** Run; expect failures.
- [ ] **Step 3:** Implement the four modules.
- [ ] **Step 4:** Tests pass.
- [ ] **Step 5:** Commit `feat: deterministic scene layout ported from the mock`.

### Task 3: SVG core: sky, skyline, track, squares, and the comparison tool

**Files:**
- Create: `src/svg/fragment.ts`, `src/svg/keyframes.ts`, `src/svg/sky.ts`, `src/svg/skyline.ts`, `src/svg/squares.ts`, `src/svg/render.ts`, `tests/render.test.ts`, `tests/svgChecks.ts` (shared assertions), `preview/compare.html`, `scripts/render-sample.ts`

**Interfaces:**
- Consumes: `Layout`, `PALETTES`, constants (Task 2)
- Produces:
  - `interface Fragment { defs?: string; body: string }`
  - `class KeyframeSheet { add(stops: [percent:number, decls:string][]): string /* returns a short class-safe name, identical stops reuse the same name */; css(): string }`
  - `at(seconds: number): number` (seconds in the loop to a percent rounded to 3 decimals)
  - Element renderers, all `(layout: Layout, p: Palette, kf: KeyframeSheet) => Fragment`: `sky`, `skyline`, `squares`
  - `interface RenderOptions { signText: string }`
  - `renderSvg(layout: Layout, theme: Theme, options: RenderOptions): string` (later tasks add their fragments to the list here, in back-to-front order: sky, skyline, billboard, power lines + crows, cat, crossing, train, squares, rain, grain)
  - `tests/svgChecks.ts`: `assertSelfContained(svg: string)`, `assertFlat(svg: string)`, `assertFinite(svg: string)`

Animation approach: one `<style>` block; every animated element gets `animation: <name> 23.1s linear infinite`; per-element timing is expressed in that element's keyframe stops (no `animation-delay`, so all elements stay in phase). Squares and windows that share timing share a keyframe name; the wave quantizes each square's lights-on moment to 0.05 s to keep the keyframe count small. Easing from the mock's `ease()` is approximated with 3 to 5 intermediate stops.

- [ ] **Step 1: Write failing tests** in `tests/render.test.ts` using the sample calendar:
  - `svg is self-contained` (`assertSelfContained`), `svg is flat` (`assertFlat`), `parses as XML` (`XMLValidator.validate(svg) === true`), `has the right viewBox` (`viewBox="0 0 760 224"`).
  - `renders one rect per active day` (count of elements with `class` containing `sq` equals `layout.squares.length`).
  - `is deterministic` (two renders are `===`).
  - `no NaN in output for empty calendar` (`assertFinite`).
  - `dark and light differ only in colors` (strip every `#xxxxxx` and compare).
  - `stays under 500 KB` (`Buffer.byteLength(svg) < 500_000`).
- [ ] **Step 2:** Run; expect failures.
- [ ] **Step 3:** Implement `fragment.ts`, `keyframes.ts`, `sky.ts` (crescent as a `<mask>` with a full disc minus an offset disc, no stroke), `skyline.ts` (buildings rise with `transform: translateY` inside a `clipPath` ending at `DECK`), `squares.ts`, `render.ts`.
- [ ] **Step 4:** Tests pass.
- [ ] **Step 5:** Build the comparison tool: `scripts/render-sample.ts` writes `out/sample-dark.svg` and `out/sample-light.svg`; `preview/compare.html` shows the mock (canvas, sample data inlined) and the SVG (inlined so `document.getAnimations()` can seek it) one above the other, with a time slider that sets the mock's time and every SVG animation's `currentTime`, and a theme switch.
- [ ] **Step 6: Visual check.** Open `preview/compare.html` in Chrome; compare at t = 1, 3.5, 6, 12 and 22 s in both themes. Expected: skyline heights, square colors and the dusk/lights-on timing visibly match the mock. Fix and repeat until they do.
- [ ] **Step 7:** Commit `feat: render sky, skyline and squares as animated svg`.

### Task 4: Train, rider and crossing

**Files:**
- Create: `src/svg/train.ts`, `src/svg/crossing.ts`, `tests/train.test.ts`
- Modify: `src/svg/render.ts` (add both fragments)

**Interfaces:**
- Consumes: Task 3 types, `TRAIN_SCALE`, `RIDER_SCALE`, `TRAIN_DURATION`, `TRAIN_START`
- Produces: `train(layout, p, kf): Fragment`, `crossing(layout, p, kf): Fragment`, and `trainNoseAt(seconds: number, layout: Layout): number | null` (x of the nose, null when off screen; shared by the crossing so the lamps blink exactly while the train is near: nose > signalX - 140 and tail < signalX + 30)

The train and rider are drawn once as a group in the mock's local units (ports of the mock's train loop and `drawRider()`, front-facing version, black laptop) and moved with one `translateX` keyframe; the group's `transform` applies `TRAIN_SCALE`, and the rider's own group applies `RIDER_SCALE`. Rider sub-animations: head nod (translateY ±0.25 units, 3.14 s period rounded to divide 23.1 s), laptop dot pulse, steam, two music notes (as paths, not text).

- [ ] **Step 1: Write failing tests:** `train enters and leaves within the loop` (`trainNoseAt(TRAIN_START - 0.1) === null`, a number at `TRAIN_START + 7.5`, null after `TRAIN_START + 15.1`); `crossing lamps only blink while the train is near` (the lamp keyframes are fully the unlit color outside the near window); `rider has no text nodes`; render tests from Task 3 still pass.
- [ ] **Step 2:** Run; expect failures.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Tests pass; under 500 KB.
- [ ] **Step 5: Visual check** in `preview/compare.html` at t = 9, 13, 17 s, zoomed on the rider and the crossing, both themes. Expected: matches the mock's large train and normal rider.
- [ ] **Step 6:** Commit `feat: add the late train, its rider and the crossing`.

### Task 5: Billboard with JetBrains Mono paths

**Files:**
- Create: `src/svg/font.ts`, `src/svg/billboard.ts`, `tests/billboard.test.ts`, `THIRD_PARTY_NOTICES.md` (JetBrains Mono, OFL-1.1, with the license text from the fontsource package)
- Modify: `src/svg/render.ts`

**Interfaces:**
- Produces:
  - `normalizeSignText(input: string | undefined): string` (trims; empty or undefined returns `DEFAULT_SIGN`; over `SIGN_MAX` throws `sign-text is N characters; the limit is 40`; any character without a glyph in JetBrains Mono throws `sign-text contains "X", which JetBrains Mono can't draw`)
  - `textToPath(text: string, sizePx: number): { d: string; width: number }` (loads `@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff` once via `opentype.js`)
  - `billboard(layout, p, kf, signText: string): Fragment`

The text strip is `signText + '  ·  '`, drawn twice side by side inside a `clipPath` the size of the panel, translated left by exactly one strip width over a whole number of loops so it is seamless; speed close to the mock's 10 px/s, adjusted so `CYCLE` is a multiple of the strip's period. Neon flicker: 3 short dips per loop at fixed times.

- [ ] **Step 1: Write failing tests:** `default text when empty` (`normalizeSignText('  ') === 'coding 24/7'`); `rejects over-long text` (41 chars throws with `41` and `40` in the message); `rejects characters the font lacks` (`'ship it 🚀'` throws naming `🚀`); `accepts punctuation` (`'npm run dev && ship'` ok); `billboard renders text as a path` (fragment contains `<path` and no `<text`); `scroll is seamless` (the translate keyframes start at 0 and end at a whole multiple of the strip width).
- [ ] **Step 2:** Run; expect failures.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Tests pass.
- [ ] **Step 5: Visual check** at t = 12 s against the mock's billboard.
- [ ] **Step 6:** Commit `feat: scrolling billboard with customizable text`.

### Task 6: Street life: power lines, crows, cat, rain, grain

**Files:**
- Create: `src/svg/street.ts`, `tests/street.test.ts`
- Modify: `src/svg/render.ts`

**Interfaces:**
- Produces: `powerLines(layout, p, kf)`, `cat(layout, p, kf)`, `rain(layout, p, kf)`, `grain(layout, p, kf)`, all `=> Fragment`

Rain: the mock's 70 drops as short lines, each a looping `translate` whose period divides 23.1 s, opacity tied to the night keyframes. Grain: one `<filter>` with `feTurbulence` (seeded, `baseFrequency` ~0.9) + `feColorMatrix`, applied to a full-size rect at the mock's ~4% opacity. If it reads as noise blotches or costs more than 20 KB, drop it and note that in the commit message.

- [ ] **Step 1: Write failing tests:** `three crows`, `one pole per layout.poles entry`, `rain only shows at night` (its opacity keyframes are 0 during evening), `all render tests still pass and output stays under 500 KB`.
- [ ] **Step 2:** Run; expect failures.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Tests pass.
- [ ] **Step 5: Visual check** of the whole scene at t = 1, 5, 12, 20, 22.5 s in both themes against the mock; also open `out/sample-dark.svg` directly as an `<img>` in a plain HTML page to confirm it animates without being inlined (that is how GitHub shows it).
- [ ] **Step 6:** Commit `feat: power lines, crows, cat, rain and grain`.

### Task 7: Action, preview command, bundle, CI

**Files:**
- Create: `src/action/main.ts`, `src/cli/preview.ts`, `esbuild.mjs`, `action.yml`, `.github/workflows/ci.yml`, `tests/action.test.ts`, `dist/index.js` (committed build output)

**Interfaces:**
- Consumes: `fetchCalendar`, `buildLayout`, `renderSvg`, `normalizeSignText`
- Produces: `run(env: { getInput(name: string): string; setFailed(msg: string): void; info(msg: string): void; repoOwner: string; fetchImpl?: typeof fetch; writeFile(path: string, data: string): Promise<void> }): Promise<void>` (the injectable core used by `main.ts` and tests)

`action.yml`: name `gh-night-city`, description `Your contribution graph as a lofi night city`, branding (icon `moon`, color `orange`), the four inputs from Global Constraints, `runs.using: node24`, `runs.main: dist/index.js`. `npm run preview -- --user <name> --out <dir> [--sign-text <text>]` reads `GITHUB_TOKEN` from the environment and writes both files. CI runs `npm ci`, `npm test`, `npm run typecheck`, `npm run build`, then fails if `git diff --exit-code dist/` shows the committed bundle is stale.

- [ ] **Step 1: Write failing tests** in `tests/action.test.ts`: `writes both files to output-dir` (stub fetch with the sample; two `writeFile` calls with the right names); `uses the repo owner when username is empty`; `passes sign-text through`; `fails and writes nothing on a GraphQL error` (`setFailed` called with GitHub's message, zero `writeFile` calls); `fails and writes nothing on bad sign-text`; full-render checks (`assertSelfContained`, `assertFlat`, `assertFinite`) on both written files.
- [ ] **Step 2:** Run; expect failures.
- [ ] **Step 3:** Implement `run`, `main.ts`, `preview.ts`, `esbuild.mjs` (bundle `src/action/main.ts` to `dist/index.js`, platform node, format esm with a `createRequire` banner, the WOFF file copied next to it and resolved relative to the bundle), `action.yml`, `ci.yml`.
- [ ] **Step 4:** Tests pass; `npm run build` produces `dist/index.js`.
- [ ] **Step 5: End-to-end locally:** `GITHUB_TOKEN=$(gh auth token) npm run preview -- --user franc1sjacob --out out` writes two files; open them in Chrome as `<img>`; total in the file matches the live profile.
- [ ] **Step 6:** Commit `feat: github action and local preview`.

### Task 8: README, example workflow, publish the repo

**Files:**
- Create: `README.md`, `examples/profile-workflow.yml`, `assets/preview-dark.svg`, `assets/preview-light.svg` (rendered from the sample, shown at the top of the README with `<picture>`)

README sections: what it is (one line plus the preview), quick start (copy `examples/profile-workflow.yml`), inputs table, using `<picture>` for dark and light, private contributions (pass a PAT as `github-token`), local preview from a clone, credits (JetBrains Mono, OFL). No `npx gh-night-city`. No em-dashes.

`examples/profile-workflow.yml`: daily cron plus `workflow_dispatch`, `permissions: contents: write`, runs `franc1sjacob/gh-night-city@v1` into `${{ runner.temp }}/night-city`, then publishes the two SVGs to an orphan `night-city` branch as one force-pushed commit, skipping the push when nothing changed (the pattern of Francis's `cool-readme.yml`).

- [ ] **Step 1:** Write the README, example workflow, preview assets.
- [ ] **Step 2:** Check: every input in `action.yml` appears in the README table with the same default; the example workflow passes `actionlint` (`npx actionlint` or the binary) if available.
- [ ] **Step 3:** Commit `docs: readme and example workflow`.
- [ ] **Step 4: Publish (approved by Francis: public repo on his account):** `gh repo create franc1sjacob/gh-night-city --public --source . --push --description "Your contribution graph as a lofi night city"`; tag `v1.0.0` and a moving `v1` tag; push tags. CI goes green on GitHub.

### Task 9: Switch Francis's profile (each step needs his go-ahead before pushing)

**Files (in `~/dev/franc1sjacob`, on a branch `night-city`):**
- Create: `.github/workflows/night-city.yml` (from the example; `github-token: ${{ secrets.CARDS_TOKEN }}`; branch `night-city`, never `cards`)
- Modify: `README.md` (replace the `assets/space-shooter.gif` `<img>` with a `<picture>` pointing at `https://raw.githubusercontent.com/franc1sjacob/franc1sjacob/night-city/night-city-dark.svg` and `-light.svg`, alt text `Contribution graph as a lofi night city`)
- Delete: `.github/workflows/space-shooter.yml`, `assets/space-shooter.gif`

- [ ] **Step 1:** Make the changes on a branch; show Francis the diff.
- [ ] **Step 2 (with his go-ahead):** push the branch, open a PR, merge it, run the workflow with `gh workflow run night-city.yml`.
- [ ] **Step 3:** Verify: the workflow succeeds, the `night-city` branch holds two SVGs, the `cards` branch is untouched, the profile page shows the animation in both themes, and the skyline total matches the stat cards (if it doesn't, the token can't see private contributions; report it rather than guessing).
