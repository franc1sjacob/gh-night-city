# gh-night-city: design

Date: 2026-11-24
Status: approved by Francis on 2026-11-24 (calls accepted; train size and rider size set by him)

## Intent

Francis wants an original animation of his GitHub contribution graph for his profile README, to replace the third-party space shooter GIF (which itself replaced the snake). He wants to build it himself and open source it so other people can use it too, the same way he uses `gh-space-shooter` today.

The concept, arrived at through a series of mocks: **a lofi night city.** Your contribution squares sit at the bottom like the city's street lights. At dusk a skyline rises behind them, the lights go out and come back on week by week, and a late train carries a lofi character with headphones and a laptop slowly across the scene while a billboard on a rooftop scrolls `coding 24/7`. At dawn it all sinks back to just your squares.

The reference implementation of the look and the timing is `docs/reference/mock.html`, a canvas prototype. To view it, replace `__DATA__` with the contents of `docs/reference/sample-calendar.json` and open it in a browser. The buttons at the top (train size, rider position and size, green squares, light mode, pause) exist only for exploring; the final defaults are listed below. **When this document and the mock disagree on a detail of the look, the mock wins.** When they disagree on behavior or scope, this document wins.

## Goals

1. A GitHub Action that renders a user's contribution calendar as an animated night city SVG, in a dark and a light version.
2. It drops into a profile README the same way `gh-space-shooter` and Francis's stat cards do: a scheduled workflow regenerates the files, and the README shows them with a `<picture>` element that switches on `prefers-color-scheme`.
3. The billboard text is customizable through an action input. Default: `coding 24/7`.
4. It looks like the mock: flat fills, Claude-like warm palette, calm pace.
5. Francis's own profile switches from the space shooter to this.

## Non-goals (for now)

- Other customization beyond the billboard text (colors, train size, toggling elements). The code should keep these as named constants in one place so they can become inputs later, but they are not inputs in v1.
- Green squares as a choice. Clay is the only square palette in v1 (the green palette in the mock is for comparison only).
- GitHub UI chrome: no month or weekday labels, no legend, no title, no border. This was tried and rejected; it should not look like the GitHub graph 1:1.
- Sound, interactivity, or JavaScript inside the SVG.
- Publishing to the GitHub Marketplace. Nice later, not part of this work.

## Anti-goals (would be a failure even if it works)

- **Looking AI-generated:** no gradients, no glow, no bloom, no soft shadows. Francis specifically rejected the purple gradient sky and glowing squares. Everything is flat fills.
- **Looking like the GitHub contribution graph 1:1.**
- **Busy or fast:** the vibe is peaceful. The train is slow, nothing jitters.
- **Over-detailed or under-detailed train:** Francis went back and forth; the mock's current train is the agreed middle.
- **A heavy README:** the SVG must not noticeably slow the profile page. Target under 500 KB per variant; hard ceiling 1 MB.
- **A broken image on GitHub:** if the SVG relies on anything GitHub strips or blocks in README images (scripts, external fonts, external resources), it has failed.

## Constraints

- **Output is a self-contained animated SVG.** GitHub serves README images through its image proxy and renders SVGs as images, so scripts and external resources don't run or load. Animation must be CSS keyframes and/or SMIL inside the file.
- **No external fonts.** The billboard text uses JetBrains Mono Bold. It must be converted to SVG paths at build time (for example with `opentype.js` and the OFL-licensed font file, with its license included in the repo), not referenced as a font.
- **Deterministic output.** Same input data and same text produce byte-identical SVG. Anything that looks random in the mock (window lighting, flicker timing, star positions, rain) is driven by a seeded pseudo-random function, as the mock already does with `rand()`, not `Math.random()`.
- **Two files per run:** a dark and a light variant.
- **Data source:** GitHub GraphQL `user.contributionsCollection.contributionCalendar`, using each day's `contributionLevel` (NONE, FIRST_QUARTILE, ...) to pick the square shade, exactly as the mock does. The weekly totals drive building heights.
- **Stack:** TypeScript, a JavaScript GitHub Action on the current Node runtime GitHub Actions supports, bundled into `dist/` so it runs without an install step.
- **License:** MIT (Francis's choice to open source; MIT is my call, see "Calls I made").

## What it looks like

The canvas is one row of the city plus the grid. Proportions, in the mock's units (the SVG can use the same coordinate system via `viewBox`):

- Squares: 12 × 12, pitch 14, corner radius 2.5, only **active days** are drawn (empty days are blank). 53 weeks wide, 7 rows tall.
- Sky area of 84 above an elevated track; the grid starts just below the track.
- Overall roughly 762 × 222.

### Palette (flat, Claude-like)

| Role | Dark | Light |
|---|---|---|
| Background | `#1f1e1d`, darkening to `#181715` at night | `#faf9f5`, to `#f0eee6` at night |
| Squares, levels 1 to 4 | `#4a2f24` `#7a3f2a` `#b4563a` `#d97757` | `#f2d5c6` `#e8a88e` `#d97757` `#b4532f` |
| Unlit square (lights off) | `#2b2926` | `#e8e6dc` |
| Buildings / top edge | `#2b2926` / `#353230` | `#e3e0d5` / `#d6d2c4` |
| Building windows | `#d4a27f` | `#d97757` |
| Moon (crescent) | `#f2cf73` | `#e0a93b` |
| Accent (stripe, headphones, sign text, mug) | `#d97757` | `#d97757` |

The full set, including the train, rider, poles and crossing, is in `PAL` in the mock.

### The loop (about 23.1 seconds, repeating)

| Phase | Length | What happens |
|---|---|---|
| Evening | 2.5 s | Only the squares, on the plain background with faint stars, clouds and the moon. |
| Dusk | 1.8 s | The skyline rises from behind the track, left to right; the track and power lines fade in; the sky darkens slightly; every square dims to the unlit color. |
| Lights on | 4 s | Squares light back up to their real level, one week at a time from left to right, with a little per-square jitter; building windows light up with them. |
| Night | 13 s | Everything lit. The train crosses (it enters during "lights on" and takes 15 s). Rain, the crossing signal, the billboard, crows, cat and rider animations run. |
| Dawn | 1.8 s | The skyline, track and poles sink and fade; back to evening. |

### Elements (all in the mock; behavior described so it can be rebuilt in SVG)

1. **Squares:** described above. A rare brief flicker on a few squares at night.
2. **Skyline:** one building per week, height from that week's total (square root scaled), some with a small roof box, lit window dots (2 × 2) in a grid whose lit fraction grows with the week's total. A few windows occasionally flicker.
3. **Elevated track:** a thin deck with rail ticks between the skyline and the squares. Visible only with the skyline.
4. **Train:** four cars at 1.8× the mock's base size (the mock's "Train: large"), warm gray with a roof line, clay stripe, row of lit windows, small wheels, short couplings, sloped windshield and a tiny headlight on the front car. Crosses left to right in 15 s, once per loop.
5. **Rider:** sits cross-legged on the roof of the second car, facing the viewer, at 1.0× rider scale (the mock's "Rider: normal"; with the 1.8× train the rider ends up about 1.8× the mock's base units on screen). Round chibi head with no neck, short smooth hair with a soft fringe and one cowlick, closed relaxed eyes, small mouth, no blush, no glasses. Clay headphones (band and two cups). Cream t-shirt with square shoulders and short straight sleeves, forearms down to a **black** laptop whose lid faces us with a softly pulsing dot. Crossed legs with shoes. A clay coffee mug beside them with steam. Head nods slowly; two music notes drift up. This took many iterations; match the mock's `drawRider()` closely.
6. **Billboard:** on a mid-skyline rooftop, dark panel with a light frame and two legs. Text scrolls continuously right to left in JetBrains Mono Bold, clay, with an occasional neon flicker. Text = the `sign-text` input followed by `  ·  ` as a separator, repeated so it loops seamlessly.
7. **Railway crossing:** a signal post with an X sign near the right end of the track. Its two lamps alternate red only while the train is near.
8. **Power lines:** four poles in front of the skyline with two sagging wires each span, and three small crows that bob their heads.
9. **Cat:** sits on a rooftop, tail swishing slowly.
10. **Sky:** crescent moon (cut cleanly, no ring artifact), twinkling stars, three slow flat clouds, light diagonal drizzle at night.
11. **Film grain:** subtle. In SVG this can be a static `feTurbulence` noise layer at low opacity, or dropped if it costs too much size or looks wrong. Builder's call.

These are **rejected** iterations and should not appear: music notes coming from a building (they now come only from the rider), the coder-in-a-window and rooftop coder variants (still in the mock's code as `coderMode`, set to "none"), the half moon, train passengers in windows, the bridge with arches below the grid, and the silver laptop.

## The Action

Inputs:

| Input | Default | Notes |
|---|---|---|
| `github-token` | `${{ github.token }}` | Needs read access to the user's public contribution data. A PAT is needed only if the user wants private contributions counted, same as other tools. |
| `username` | the repository owner | Whose calendar to draw. |
| `output-dir` | `dist` | Where the two SVGs are written. |
| `sign-text` | `coding 24/7` | Billboard text. Plain text; the action should cap its length (suggested 40 characters) and fail with a clear message beyond that. |

Outputs: `night-city-dark.svg` and `night-city-light.svg` in `output-dir`.

The action only generates files. Committing them is the workflow's job. The README documents a recommended workflow that publishes them to a separate branch (named `night-city` in the docs and in Francis's profile; it must never be `cards`, which his stat cards force-push to) as a single force-pushed commit, the same pattern Francis's `cool-readme.yml` uses for his stat cards, so the profile repo's history doesn't fill up with daily image commits.

A local preview command, run from a clone of the repo (for example `npm run preview -- --user <name> --out <dir> [--sign-text ...]`, token from `GITHUB_TOKEN`), uses the same renderer. **It is not published to npm** (my call: publishing would be another public release Francis hasn't asked for). The README must not advertise `npx gh-night-city`.

## The repo

- `~/dev/gh-night-city`, public on GitHub under Francis's account, `main` branch.
- README for strangers: a preview GIF or the SVG itself, quick start workflow, inputs table, how to use `<picture>` for light and dark, credit line.
- `docs/reference/` keeps the mock and the sample data the design came from.

## Rollout to Francis's profile

After the action works end to end, in `franc1sjacob/franc1sjacob`:
1. Replace `.github/workflows/space-shooter.yml` with a night city workflow.
2. Swap the `assets/space-shooter.gif` image in `README.md` for a `<picture>` with the dark and light SVGs.
3. Remove the old GIF.

Francis's workflow passes his existing `CARDS_TOKEN` secret as `github-token` so private contributions are counted (only counts are drawn, never repo names), matching his stat cards. Note that private contributions only appear in the calendar if that token can see them or the account's "include private contributions on my profile" setting is on; the builder should verify the totals match the cards.

This touches another repo and its public README, so each step gets Francis's go-ahead before it's pushed.

## Edge cases the builder settles (my calls, from the review)

- **53 or 54 weeks:** pole positions, the billboard's building search range and every other placement are computed from the actual number of weeks, not hard-coded to 53.
- **No contributions:** an empty calendar still renders (evening squares absent, minimum-height skyline); no divide-by-zero.
- **Unsupported characters in `sign-text`:** fail with a clear message naming the character, rather than drawing a blank box.
- **Music notes** become paths too (no serif font dependency).
- **Randomness that loops:** flickers and twinkles use patterns that repeat cleanly within the loop, since an SVG animation must cycle.
- **Light theme details** (such as the rider's shirt color) follow the mock's `PAL.light`.

## Left to the builder

- How the canvas animation becomes SVG: CSS keyframes versus SMIL, one shared keyframe set with per-element `animation-delay` versus generated keyframes, how to keep the file small. The visual result must match the mock and stay within the size budget.
- Module layout, test framework, bundler.
- Exact handling of the final partial week (the mock draws only the days that exist).
- Whether film grain survives (see element 11).

## Calls I made (Francis, please check these)

- **License: MIT.** Common for actions like this.
- **Billboard text cap of 40 characters.** Longer text still works technically but scrolls for a long time.
- **Output to a separate branch** in the recommended workflow, matching how your stat cards already work, instead of committing the file to `main` daily like the space shooter does.
- **No Marketplace publishing yet.**
- **Final look:** large train (1.8×) and normal rider (1.0×), chosen by Francis; otherwise the mock's defaults: clay squares, black laptop, JetBrains Mono on the billboard.
