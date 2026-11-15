# Simulations: motion and polish spec (MIN-4606, parent MIN-4603)

Author: Pix Elidis (Design). For Ren on MIN-4608 (`/simulation`) and MIN-4609 (`/doctor/simulate`), for Cron on MIN-4607 (data), for the CTO on MIN-4610 (dependencies, data contract), for Anna on MIN-4604 (words). Spec only: no app code in this change.

Goal: supports direction 5 and 4. The motion is how a doctor, a hospital buyer or a judge sees the matching narrow (5) and the modelled outcome in euros (4) in one viewing.

Founder, 2026-11-15, verbatim: "I want the https://healthapp-8ui.pages.dev/doctor/simulate and the https://staging.healthapp-8ui.pages.dev/simulation to visualise them in a better way with animations and motion that communicates better the outcome and make it look serious. Also at the model simulation we need to connect the drop with real money". Newer line (relayed on MIN-4603): "We need to simulate that match by match the model is being better and better so its growing and getting better matches so decrease more and more the loss of the money".

Checked against: `src/features/simulate/{Simulate.tsx,DotCanvas.tsx,simulate.css,copy.ts}`, `src/features/matches/{Simulation.tsx,simData.ts,matches.css,copy.ts}`, `data/synthetic/simulation.json`, `docs/brand/tokens.css`, `docs/brand/brand-guidelines.md` (contrast on glass), `docs/design/ios-glass-handoff.md`. Not verified: any value below in a running build (nothing is built yet); the 390 px positions are computed from the current CSS and token sizes and must be measured by Ren (tolerance ±8 px) and by me by eye on staging.

## 0. Rules that hold for every frame of both screens

1. **The six fixed labels never move, fade, or hide.** `pageLabel`, `machineLabel` (or `machineFallback`), `matchingLabel`, `contactLabel` on `/doctor/simulate`; `simLabel` and `panelLabel` on the matches screens. They are static text at full opacity from the first painted frame. No entry animation, no transform, no opacity change on any of them or on their containers. Where a step table says "fades in", it never applies to an ancestor of a label.
2. **The assumption line and the permanent label are always on screen with series 2 or 3.** The assumption line (`COPY.simAssumption(pct)`) is static text at full opacity from frame 0. It is never inside an element that animates opacity.
3. **Axes of series 2 and 3 start at zero in every frame.** No rescale, no crop, no zoom into the drop. The y axis is `niceAxis(max of the series)` from 0, drawn at t = 0 and never redrawn. "Numbers large, not a cropped axis" (CEO seat, MIN-4506).
4. **Only brand and glass tokens.** No new colour, no red, no green verdict colour, no gradient, no shadow beyond `--shadow-soft`, no bounce or overshoot easing, no confetti, no loop for decoration (the one existing loop, the machine's "running" pulse, explains a state and stops with it).
5. **Motion is driven by one clock per screen.** `/simulation`: one clock `t` (ms since start) from `performance.now()`; lines, cells, counters and the euro figure all read it, so they can never disagree. `/doctor/simulate`: one timeline of phase timers as today. Time based, not frame-count based: a hidden tab that comes back shows the state for the current `t`.
6. **Reduced motion** (`prefers-reduced-motion: reduce`): the finished state at once, nothing animates, nothing loops, no auto-scroll. Each section below states what that frame looks like.
7. **No numbers or words typed in components.** Values come from `simulation.json` and `run-5000.json`; words from Anna's files. Placeholders in this spec are marked `(placeholder)`.

## 1. Motion tokens (named once)

Add one block to `src/styles/tokens.css` under `/* Motion (MIN-4606) */`. `--dur-fast`, `--dur-step`, `--dur-reveal` and `--ease-out` already exist in `docs/brand/tokens.css` (and the `reduce` rule at line 115 sets the three durations to `.01s`).

| Token | Value | Status | Used for |
|---|---|---|---|
| `--dur-fast` | 200 ms | exists | state colour changes, log line enter |
| `--dur-step` | 400 ms | exists | a block entering, a step row lighting up |
| `--dur-reveal` | 800 ms | exists | landing of the outcome (baselines, card edge) |
| `--dur-land` | 160 ms | new | one match cell landing |
| `--dur-fade` | 600 ms | new | the narrowing fade of dots, the fraction bar |
| `--ease-out` | `cubic-bezier(.22,1,.36,1)` | exists | everything that arrives |
| `--ease-inout` | `cubic-bezier(.4,0,.2,1)` | new | anything that changes value in place (dot fade, bar width) |
| linear | `linear` | CSS keyword | the `/simulation` clock-driven values only |

Under `reduce`, add `--dur-land: .01s; --dur-fade: .01s` to the existing rule.

JS constants (one file per screen: `src/features/matches/simData.ts` and a new `src/features/simulate/motion.ts`):

```
/simulation:  SIM_ENTRY_MS = 600      SIM_STEP_MS = 2600     SIM_GROW_MS = 400      SIM_MATCH_WINDOW = [400, 2100]
              SIM_LANDING_MS = 800    SIM_DURATION_MS = SIM_ENTRY_MS + 11 * SIM_STEP_MS + SIM_LANDING_MS = 30000   (11 = steps - 1)
/doctor/simulate:  SM_REVEAL_MS = 1400 (as today)   SM_SETTLE_MS = 400   SM_STAGE_MS = 1500   SM_RING_MS = 300   SM_RING_STAGGER_MAX = 120
```

New type token (type size only, no colour): `--text-outcome: 700 40px/1.1 var(--font)`, `700 48px/1.08` from 900 px up. Used once, for the euro figure.

Tolerances Ren tests against, unless a row says otherwise: start time ±50 ms; duration ±50 ms; easing exact (computed `transition-timing-function`, or the same cubic-bezier evaluated in JS); a clock-driven value equals the data value at each step boundary exactly (display precision); total play time ±300 ms.

---

# A. `/simulation` (MIN-4608)

## A1. What the screen has to make felt

Match by match, the model gets better: matches land one at a time as the network grows, the match counter ticks, the two rates fall by exactly what the data says, and a euro figure for the cost drop climbs with them, then holds. The viewer understands the cause (the network grows, so more records find a match) before the effect (the rates fall, the euro figure rises), because the matches land first in every interval and the numbers follow in the same instant.

Honesty constraints on the motion (they decide the design, not taste):
- The euro figure shows the **modelled yearly figure at that network size**, not money collected. The words are Anna's and the CEO seat's (MIN-4604, MIN-4605); this spec keeps them off "saved to date". Open question to Anna: the figure's kicker must say "model" or "assumption" in the same sentence as the figure or beside it.
- **No acceleration is faked with easing.** Every interval has the same duration and the same linear value path; the shape of the curve (slow start, steep middle between 200 and 300 records, flatter end) is the data's. If the founder wants "faster and faster" to be literal, that is a model decision for Cron and the CEO seat (a quality term in the formula), not a motion trick. See A8 `quality`.

## A2. Layout

DOM order (also the reading order): sticky label, header (h1, caption), **hero card**, three chart cards, footer (sources, dropped line), replay.

The hero is one glass card (`--glass-card`, `1px solid --glass-edge`, `--radius-card`, `--shadow-soft`). Inside it: the **match field** (left) and the **euro outcome** (right on desktop, below on narrow).

### Desktop (1440 x 900; container 1120)

```
 y 0   [ label bar: sticky, info bg, white 16/24, 48 high ]                                  (static)
 y 72  h1 "What matching could change"  32/35                       [ Synthetic records in the network ]
 y 115 caption 16/24, max 62ch, 2 lines                             [            400  (20/28)         ]
 y 179 +--------------- hero card (1088 wide, ~310 high, pad 24/20) ---------------------------------+
       | MATCH FIELD (7 of 12 cols, 628 wide)        | EURO OUTCOME (5 of 12 cols, 444 wide)         |
       | stat row: 134 (24/29 600)  + label 16/24     | kicker 16/24 600 ink-soft          (placeholder)|
       | 48 cols x 9 rows of 10 px cells, gap 2       | EUR 12.1 billion   48/52 700 ink    (placeholder)|
       |   (400 cells, 108 high)                      | a year  20/28 600 ink               (placeholder)|
       | [quality bar 6 high, optional, A8]           | second smaller line 16/24 ink-soft  (placeholder)|
       |                                              | hairline                                         |
       |                                              | formula 16/24 ink-soft                           |
       |                                              | source 16/24 teal-600 link                       |
       |                                              | assumption 16/24 ink (static, full opacity)      |
 y 505 chart 1 | chart 2 | chart 3 (3 equal cols, gap 16); 2 and 3 end with the assumption line
 foot  sources, dropped line (muted); Play again
```
At 1440 x 900 the label, the hero (figure at y about 235 to 287) and the three end values are in the first viewport; the footer is below it.

### 390 px (portrait; the budget is the conservative visible area 390 x 664, a phone with browser bars; 390 x 780 has 116 px more)

Computed from the current CSS (label wraps to two lines; caption is 5 lines at 358 px):

| Element | y (top to bottom) | Size / token |
|---|---|---|
| Sticky label bar | 0 to 72 | white 16/24 on `--color-info`, 2 lines, static |
| h1 | 96 to 125 | `--text-h2` 24/29 (use the h2 size for the h1 at 480 px and below so it stays one line) |
| Caption | 133 to 253 | 16/24, 5 lines, full text, no truncation |
| Hero card top | 269 | padding 16 |
| Two stats side by side (records in the network, matches so far) | 285 to 349 | label 14/18 `--text-label` ink-soft over number 20/28 (network) and 24/29 (matches) |
| Match field | 361 to 541 | 27 cols x 15 rows of 10 px cells, gap 2 (326 wide, 180 high) |
| Kicker (placeholder) | 557 to 581 | 16/24 600 ink-soft |
| **Euro figure** | **581 to 625** | `--text-outcome` 40/44 700 ink; "EUR 12.1 billion" fits 326 px on one line; if Anna's string is longer, the figure stays one line and the unit line wraps |
| Unit line "a year" (placeholder) | 625 to 653 | `--text-lead` 20/28 600 ink |
| Second smaller line, formula, source, assumption | 661 to about 870 | 16/24, below the 664 line; reached by scrolling |
| Chart cards | below the hero, one column | as today |

In the outcome frame at 390 the permanent label (sticky, y 0 to 72) and the euro figure (y 581 to 625) are in the same 390 x 664 viewport and readable without scrolling. The figure's bottom is at 625, 39 px of slack. If the caption wraps to 6 lines on a device with a larger text size, the figure falls below 664 but stays inside 780; the label is sticky and always in view. Ren verifies with the longest Anna string at 390 and reports the measured figure top.

The clock ("Synthetic records in the network") leaves the header at 899 px and below and sits in the first stat of the hero card.

## A3. Step table, playing

`t` is ms from the first frame (page load or Play again). 11 intervals; interval `i` (i = 1 to 11) starts at `T_i = 600 + (i - 1) * 2600`. Series index `k` goes 0 to 11; interval `i` moves from index `i - 1` to index `i`. `g` is the interval's local value progress: `g = clamp((tau - 400) / 1700, 0, 1)` where `tau` is ms into the interval, **linear**.

| # | Step | What moves | The one thing the viewer understands after it | Start | Duration | Easing | Delay / stagger | End state |
|---|---|---|---|---|---|---|---|---|
| 1 | Entry | The match field cells, the three plot areas (axes, gridlines, tick labels) and the hero's euro figure and counters appear. **Labels, headings, assumption lines, formula, source never animate.** | What is measured, and that the axes start at zero | 0 | 400 each | `--ease-out`, opacity 0 to 1 and `translateY(8px)` to 0 | stagger 60 ms in this order: field, chart 1, chart 2, chart 3 | Step index 0 shown: 33 cells (all unmatched), series values at index 0, euro 0, matches 0. Ends at 580 ms (tolerance ±50) |
| 2 | Network grows | The cells for records `n(i-1)` to `n(i)` (33 or 34 per interval) fade in as unmatched. The network figure (`sim-x`) changes. | The network is getting bigger | `T_i` | 160 each over a 400 ms window | `--ease-out`, opacity 0 to 1 | spread evenly across the window | `n(i)` cells visible. `sim-x` text swaps at `T_i` with no animation (tabular numerals, no layout shift) |
| 3 | Matches land | `Delta = M(i) - M(i-1)` unmatched cells turn matched, one at a time, in reading order (first unmatched cell after the matched block). Matched cell = `--color-link` fill; it scales .6 to 1. The matches counter ticks +1 per landing, no animation on the digit. | Each match is one record finding another; they arrive one at a time | `T_i + 400 + (j + 0.5) * 1700 / Delta` for the j-th landing (j = 0 to Delta - 1) | `--dur-land` 160 | `--ease-out` (background-color and transform) | even spread across the 1,700 ms window; `Delta = 0` lands nothing | `M(i)` matched cells. The field is a schematic of counts: a cell is not a record |
| 4 | Lines and numbers follow | The tip of each line, the large value of each chart (`sim-value`), and the euro figure interpolate from index `i - 1` to `i` with `g`. Euro: `euro(i-1) + (euro(i) - euro(i-1)) * g`. | As matches land, the two rates fall and the euro figure rises by what the data says | `T_i + 400` | 1,700 | linear (clock-driven, no CSS transition) | none | Values equal the data at index `i` at `T_i + 2100`. Display precision fixed per series (`decimalsOf`) and for the euro figure (the precision of the final value), tabular numerals, width reserved for the final string so nothing jumps |
| 5 | Read pause | Nothing moves. | Time to read the number | `T_i + 2100` | 500 (to `T_i + 2600`) | none | none | Same as the end of step 4 |

Counters never go down: the euro figure shows `max(previous, current)`. The data's one small dip (index 9 to 10, series 3 goes 10.32 to 10.33) therefore holds the euro figure for that interval; the chart tip still draws the true value. See A8.

Steps 2 to 5 repeat 11 times. Interval 11 ends at `600 + 11 * 2600 = 29,200`.

| # | Step | What moves | What the viewer understands | Start | Duration | Easing | Delay | End state |
|---|---|---|---|---|---|---|---|---|
| 6 | Landing: the drop at true size | On chart 2 and chart 3 a 1 px baseline at the starting value is drawn across the plot from the y axis (`scaleX` 0 to 1, origin left). A delta label (end minus start, from the data, with a true minus sign; placeholder) fades in at the right end of the baseline, 16/24 ink. | How far each rate actually fell, on the zero-based axis | 29,200 | 800 (`--dur-reveal`) | `--ease-inout` for the baseline, `--ease-out` for the label | label delay 400 | Baseline `--color-border-strong` solid (the model line stays dashed `6 4`), label visible |
| 7 | Landing: outcome edge | The hero card border changes `--glass-edge` to `--color-link` (1 px). The euro figure does not change size or colour. | This is the result | 29,200 | 800 (`--dur-reveal`) | `--ease-inout` | none | Teal ring around the hero card (UI element: 5.08:1 on card glass) |
| 8 | Hold | Nothing moves. `data-state="done"` at 30,000, Play again enabled. | The outcome stays | 30,000 | indefinite | none | none | The outcome frame (A4) |

Total play time to `data-state="done"`: 30,000 ms (600 entry + 11 x 2,600 + 800 landing), within the story's 28 to 32 s. Tolerance ±300 ms. This keeps the CTO's 30 s from MIN-4505.

Play again: instant reset to `t = 0` in one frame (no reverse animation), then step 1. Disabled until done, as today.

## A4. The outcome frame (what is on screen from 30,000 on)

| Element | Where | Size, weight, token | Colour (contrast on card glass, darkest ground) |
|---|---|---|---|
| Permanent label `simLabel` | Sticky bar, top | white 16/24 600 | white on `--color-info` 12.30 |
| Euro figure | Hero card, right column (desktop) / below the field (390) | `--text-outcome` 700, 48/52 desktop, 40/44 at 480 and below; tabular numerals | ink 15.58 |
| Unit line | Under the figure | `--text-lead` 20/28 600 | ink 15.58 |
| Second smaller line | Under the unit | 16/24 400 | ink-soft 6.48 |
| Formula line | After a hairline (`--color-border`) | 16/24 400, from the data's `formula` | ink-soft 6.48 |
| Source line | After the formula | 16/24 400, link, underline offset 3 | teal-600 5.08 (never on chrome glass: 3.78) |
| Assumption line `simAssumption` | Last line of the hero; also the last line of the series 2 and series 3 cards | 16/24 400, static | ink 15.58 |
| Three end values | Top of each chart card | `.sim-value` 32/40 600 (existing) | series colours as today (existing tokens) |
| Match counter | Hero left | 24/29 600 | ink 15.58 |
| Delta labels | On the two baselines | 16/24 400 | ink 15.58 |

**Size of the euro figure against the three end values:** 48 px against 32 px on desktop (1.5x), 40 px against 32 px at 390 (1.25x); weight 700 against 600. It is the largest thing on the screen and the only 700.

At 390 the order top to bottom is: label, h1, caption, hero (stats, field, figure, unit, second line, formula, source, assumption), chart 1, chart 2 (+ assumption), chart 3 (+ assumption), footer, Play again. All lines wrap; none truncate.

Why the assumption line repeats three times: it travels with every figure it qualifies, so it is on screen whenever series 2 or 3 or the euro figure is, at every scroll position, at every width. The footer copy is removed (the sentence moves out of the footer; keep `data-testid="sim-assumption"` on the hero copy and add `sim-assumption-2` and `sim-assumption-3` on the card copies).

## A5. Colour pairs added by this spec (WCAG 2.x, computed)

| Pair | Ratio | Needs | Result |
|---|---|---|---|
| ink on card glass (darkest ground `#FCF5F4`) | 15.58 | 4.5 | pass |
| ink-soft on card glass | 6.48 | 4.5 | pass |
| teal-600 on card glass | 5.08 | 4.5 | pass |
| teal-600 hero ring on card glass | 5.08 | 3 (UI) | pass |
| matched cell (teal-600) on unmatched cell (`--field-border` at 40% on white) | 3.32 (3.15 on the darkest card pixel) | 3 (graphic) | pass |
| unmatched cell on card glass | 1.53 | decorative, state also carried by the counter text | n/a |
| baseline `--color-border-strong` on card glass | 4.07 | 3 (UI) | pass |

Unmatched cell colour: `color-mix(in srgb, var(--field-border) 40%, transparent)`. No new palette entry.

## A6. Reduced motion

`data-state="done"` from the first render. Frame: all 400 cells present, `M(11)` matched; all three lines drawn to the end with tip dots; values and euro figure at their final numbers; baselines and delta labels drawn; hero ring teal-600; no Play again (as today). No entry, no counter, no transitions (tokens are .01 s; the JS clock is not started).

## A7. States

| State | What is on screen |
|---|---|
| Playing | Steps 1 to 7. `data-state="playing"`. Play again disabled |
| Done | The outcome frame, held. Play again enabled |
| Reduced motion | A6 |
| Data error (`parseSimulation` fails) | Label bar stays. One glass card below with the existing sentence, `role="alert"`, ink 16/24. No hero, no charts |
| Euro block missing or invalid | The hero shows the field and counters only (field spans the card); no euro figure, no zero, no placeholder; the three charts and assumption lines play as today. Never a euro figure that the file does not carry |
| Series 2 or 3 dropped (no source) | As today: `simDropped` line. The euro figure also hides (it needs series 3) |
| Counter dip in the data | A3 note: the euro figure holds |

## A8. Data fields needed (Cron, MIN-4607; additive, the dashboard (MIN-4600) reads the same file)

All arrays have one value per `x.values` step (12).

| Field | Type | Needed for | Notes |
|---|---|---|---|
| `matches.count[]` | integer array, non-decreasing | step 3: how many cells land per interval, the counter | Exact counts from running the matcher on each cohort sample. If absent, Ren derives `round(rate * n / 100)` from series 1 and `x`; ask Cron for the exact ones |
| `euro.values[]` | number array of euros per year, non-decreasing | step 4: the figure at every step | `(baseline - series3[k]) / 100 * total`, the same formula as the drop. A dip is allowed to remain in the data; Ren holds the display |
| `euro.total` | number (euros) | the formula line | Chosen by the CEO seat on MIN-4605 |
| `euro.total_year`, `euro.source{name,url}` | number, object | the source line | Same shape as series `sources` |
| `euro.formula` | string | the formula line | Same style as series formulas |
| `quality.values[]` (optional) | number array 0 to 1 | a "better matches" bar under the field | **Cut first** (see A9). Only if Cron can compute it from the matching logic (for example the share of matches that sit in an exact-set group), with a one-line definition in `quality.definition`. If it is not in the file by 11:00, the bar is not built. Do not invent it |

If the CEO seat wants the money to fall faster than the match rate does, that is a change of formula in `simulate.py` (a quality term), shown in `euro.formula`. The motion then follows the data with no change in this spec.

## A9. Words I need from Anna (MIN-4604), as `(placeholder)` above

1. Euro kicker (above the figure), carrying "model" or "assumption" with the figure. Placeholder: "Modelled cost of wrong or missed diagnoses".
2. Figure string. Placeholder: "EUR 12.1 billion". Unit line. Placeholder: "a year".
3. Second smaller line. Placeholder: "of health spending, at this network size".
4. Formula line template. Placeholder: "Drop in points x total health spending".
5. Source line prefix. Placeholder: "Total health spending:" then name and year from the data.
6. Matches counter label. Placeholder: "records with a match".
7. Quality bar label, only if A8 `quality` is built.
Longest string must fit 390 without truncation: the figure stays on one line at 40/44; every other line wraps.

## A10. React Bits

**Zero.** Considered and rejected, so the CTO has nothing to check on MIN-4610 for this screen:
- `@react-bits/CountUp`: runs its own spring and duration, so the figure would drift from the dots and the lines. The figure must read the shared clock (step 4).
- `@react-bits/Counter` (rolling digits): an odometer is decoration here.
- `@react-bits/AnimatedContent`, `@react-bits/FadeContent`: a 400 ms opacity and 8 px transform is eight lines of CSS; they add a scroll observer and a dependency for it.
- Spotlight, glow, particle and dot-grid components: not serious; they animate without explaining.

## A11. Left out, and why

- A slider, scrubber, pause, or "skip to the end": no new interaction (scope). Reduced motion already gives the finished state.
- Scatter placement of matched cells: reading order is honest and cleaner, and a cell is not a record.
- Any annotation of series 1 beyond its tip and value: the field already shows it.
- Per-cell shadow, blur or glow; sound; a dark mode; a tooltip on hover.

## A12. Addendum: the field at 5,000 records (MIN-4680, parent MIN-4679)

Founder, 2026-11-15, verbatim: "can we increase the https://healthapp-8ui.pages.dev/simulation to 5000?" Goal: supports direction 5 (the field is what shows the network growing; at 5,000 it must still be read in one look). Synthetic data throughout; the label, the assumption lines and the clock (12 steps, `SIM_STEP_MS` 2600, 30 s) do not change. This addendum **supersedes** A2's field rows (48 x 9 and 27 x 15 cells), A3 steps 2 and 3 where they say "one cell per record, one landing at a time" and A6's "400 cells". Everything else in A stands. Not verified: nothing is built; heights below are computed from the current CSS and `DotCanvas.tsx`, Ren measures (tolerance ±8 px).

**Decision: `/simulation` has its own canvas field in `src/features/matches/` (`DotField.tsx`, `field.ts`), following the `DotCanvas` look and pattern and importing nothing from `src/features/simulate/`; it differs from `DotCanvas` in three ways.** A DOM grid of 5,000 `<i>` is rejected (5,000 nodes, 417+ style writes per step on a phone).

| | `DotCanvas.tsx` today | `/simulation` field |
|---|---|---|
| Dot pitch | 8 px (5 px under 520) | **5 px from 481 px up; 3 px at 480 and below** (5 px at 390 would be 385 px tall and push the euro figure to y 730, outside the 664 budget) |
| Dot radius | 0.36 x pitch | unmatched 0.36 x pitch; **matched 0.46 x pitch** (a slightly larger teal dot, so matched reads at 2 px pitch) |
| Padding, rings, numbers, group colours | PAD 12, rings, group hues | **none**: PAD 0, no rings, no numbers, two colours only |

Colours (no new token; Ren resolves both once per mount from the tokens, as `DotCanvas` does for `--ink`): unmatched = `--field-border` at 40% on the card (as A5), matched = `--color-link` (teal-600). Pair ratios as A5 (3.32 graphic). At 3 px pitch the dots anti-alias, so the matched or unmatched state is also carried by the counter text and the aria text below; the colour is never the only carrier.

### Size

`cols = floor(W / pitch)`, `rows = ceil(5000 / cols)`, `height = rows x pitch`, W = the field column's width.

| Viewport | W | Pitch | Cols x rows | Field height | Dot diameter (unmatched / matched) |
|---|---|---|---|---|---|
| 390 | 326 | 3 | 108 x 47 | **141 px** | 2.2 / 2.8 px |
| 768 (one column) | about 704 | 5 | 140 x 36 | 180 px | 3.6 / 4.6 px |
| 1280 (7/12 column) | about 593 | 5 | 118 x 43 | **215 px** | 3.6 / 4.6 px |
| 1440 (7/12 column) | about 628 | 5 | 125 x 40 | 200 px | 3.6 / 4.6 px |

Hero card at 1280 and 1440 stays about 310 high (the right column is still the taller one). **At 390 the field sits at y 361 to 502 (was 361 to 541)**: kicker 518 to 542, euro figure **542 to 586** (was 581 to 625), unit line 586 to 614. The figure is inside the 390 x 664 viewport with 50 px of slack, so A2's rule still holds. The last row is partial (5,000 is not a multiple of cols); dots fill in reading order, left to right.

### Steps 2 and 3 at hundreds per window

All of it is derived from the one clock `t` (A3 rules unchanged). `n(i)` and `M(i)` are the data's (`x.values`, `matches.count[]`). Per interval, `tau` = ms into it.

| # | What changes | Rule |
|---|---|---|
| 2 | Network grows | The new dots `n(i-1)` to `n(i)` (about 417) appear as **one sweep in reading order**, not per-dot fades: visible count = `n(i-1) + round((n(i) - n(i-1)) x easeOut(clamp(tau / 400)))`, `--ease-out`, `tau` 0 to 400. Full opacity, no per-dot alpha (same as the `DotCanvas` reveal). The `sim-x` figure swaps at `T_i` as before |
| 3 | Matches land | Matched count `m(t) = M(i-1) + floor(DeltaM x g)`, `g` = A3's linear progress over `tau` 400 to 2100 (the same `g` that drives the line tips, the counter and the euro figure, so they cannot disagree). The matched dots are the **first `m` dots in reading order** (a teal block that grows across the rows, so it reads as the share of the network). At `DeltaM` of hundreds the landings are 4 to 8 ms apart, below one frame, so they are drawn as a **moving front**: the dots that landed in the last `--dur-land` (160 ms) draw at radius `lerp(.6, 1)` and `easeOut`; every earlier matched dot is at full size. That is about 9 to 40 dots per frame for `DeltaM` 100 to 450, drawn individually. Design for `DeltaM` up to 1,000 per interval; `DeltaM = 0` lands nothing |
| 4, 5 | Unchanged | Values interpolate with `g`; read pause 500 ms |

`data-testid="sim-field"` stays on the field's wrapper. It carries `data-visible` and `data-matched`, written **only at step edges** (`T_i + 2100`, and at done), so tests read counts without a per-frame write. The old cell-count assertion (400 `<i>`) becomes `data-visible = n` and `data-matched = M`.

### Cost (no long task over 50 ms at 390)

Per-frame budget: script under 8 ms p95 at 4x CPU throttle. The pattern that meets it (Ren's or the CTO's call, any pattern that passes the gate is fine): draw all 5,000 dots **once per width** into two off-screen layers (unmatched, matched), in chunks of about 1,000 dots per frame at entry so no chunk is a long task; then each frame only `drawImage`s the visible region (full rows plus one partial row) and the matched region from the layers, plus the 9 to 40 front dots as arcs. No `Path2D` rebuilt per frame. Resize redraws the layers in chunks, then once. If Ren measures the `DotCanvas`-style bucketed fills (about 42 fills a frame) under the budget at 390, `DotField.tsx` may use that pattern instead (re-implemented in `matches/`, not imported). **Gate:** at 390, 4x CPU throttle, zero `longtask` entries over a full play and the p95 above; a screenshot per state saved as evidence.

### Axis ticks (charts 1 to 3)

The x values are the data's `x.values` (12 of them, 417, 833, 1250 ... 5000), shown as written with thousands separators, rounded to a whole number only if the file carries a fraction (ask Cron for whole numbers). **A tick mark at all 12 positions; a label only at the 3rd, 6th, 9th and 12th** (1,250, 2,500, 3,750, 5,000), at every width: four 11 px labels of about 30 px fit a 326 px plot, twelve do not. The rule is "every third value, ending on the last"; Ren types no value. The first value (417) is in the hero's "records in the network" figure at `t = 0`.

### Reduced motion, and the text for a screen reader

- **Reduced-motion frame (replaces A6's "400 cells"):** `data-state="done"` from the first render; one draw of all 5,000 dots with `M(11)` matched in reading order; no `requestAnimationFrame` loop, no layer-build chunks visible (draw once after the layers are ready). Everything else as A6.
- **Text for the field:** the canvas is `role="img"` with `aria-label` built from the data: total records, matches so far at the current step (updated at step edges only, not per frame, and once at done), and the word "synthetic". Wrapper keeps `aria-hidden` off; the visible caption below is the longer description. Words are Anna's (placeholders): label `(placeholder)` "Match field: {matched} of {visible} synthetic records have a match", caption `(placeholder)` below.
- **Caption rule, updated.** Old rule: "a cell is not a record". New: **a dot counts as one record, but where a dot sits and which dots turn teal are not records' identities.** Placeholder caption (Anna to reword, keep both halves): "One dot per synthetic record in the network. Dots turn teal, in reading order, as the number of matches grows. A dot's position is not a person." It sits under the field in `--text-doctor-body`, ink-soft (6.48), static from frame 0, never inside an element that animates opacity.

### Tokens and constants

**No token change.** Layout constants live in one file (`src/features/matches/field.ts`, or beside `simData.ts`): `FIELD_PITCH = { narrow: 3, wide: 5 }`, `FIELD_NARROW_MAX = 480`, `DOT_R = { off: 0.36, on: 0.46 }`, `TICK_EVERY = 3`. Words only from Anna's `copy.ts` entries.

### Left out

Per-dot fade, per-dot landing scale for the whole matched block, group hues and rings (that is `/doctor/simulate`), scatter placement, hover or tap on a dot, any zoom.

## A13. Addendum: the timeline diagram (MIN-4700, parent MIN-4696)

**SUPERSEDED by A14 (MIN-4722, 2026-11-15).** The founder rejected the three stacked lanes. Everything in A13 about lanes, lane heights, lane keys, per-lane axes and the lane states is void; build from A14. What survives from A13: the card chrome (section 3), the kind colours and tokens, the pilot band and the first-paid marker geometry, the values table, the contrast pairs (section 7), and the text alternative. The lane renderer is deleted, not kept behind a toggle (CTO, MIN-4720).

Founder, 2026-11-15, verbatim: "this diagrams dont seems so optimistic. It was supposed. ... maybe to have one diagram with all the numbers inside showing how having onboard patients and growing our model and getting everyday more and more correct diagnoses how the money saved and our income grow". Goal: supports direction 5 and 4 (the one picture that shows patients, matches, diagnoses and money growing together). Everything on it is synthetic or a plan, and the card says so.

**Inputs that fix the shape (not reopened here):** the CTO's decision on MIN-4699 (comment 8b038e47): add under the hero, static, inline SVG, no library, one shared month axis 1 to 24, stacked lanes, every y axis from zero, no second y axis, no indexed, log or cropped axis; the data block `timeline` (24 values per measure, running totals, index `i` is the end of plan month `i + 1`). Anna's strings (MIN-4697, part 1, placeholders until she signs). The CEO seat's conditions (`docs/simulation-copy.md` section 6.4). Which optional measures show is the CEO seat's call on MIN-4698; this section says what changes for each.

**Not verified:** nothing is built. The mock `docs/design/min-4700/timeline-mock.html` carries **placeholder values** (anchors from the CTO's scratch run and Product's preview, linearly interpolated between them; not the generator's output) and was measured in headless Chrome at 390 and 1280, not on a device, not under touch, not on staging. Pixel numbers below are from that mock; Ren measures the build (tolerance ±8 px). No dark theme exists in the app (`prefers-color-scheme` appears nowhere in `src/`); the dark view is a mapping proposal, section 12 below. Mobbin was searched once (stacked analytics charts): the references put a stat strip above one chart and a legend below it; this spec labels at the line instead, because the founder asked for "all the numbers inside" and the hard limits ask that a measure is told apart without a legend hunt. Figma: no file touched in this run (see the hand-back).

### 1. The form, with sizes (decision 1)

**One card, three stacked lanes, one month scale.** "One diagram" is one frame whose lanes share the x position of every month. Each lane has its own y axis from 0 in its own unit; measures with the same unit share a lane (CTO). Lane order is fixed, top to bottom:

| Lane | Measures | Axis | Plot height at 1280 / 390 | Needed? |
|---|---|---|---|---|
| 1 People | Patients in the network (plan), Records with a match (computed) | `niceAxis(max of both)`, from 0 | 200 / 150 px | required |
| 2 Euros | Our income (plan), Modelled drop in cost (model) | one euro axis, `niceAxis(max of both)`, from 0 | 200 / 150 px | income required; the drop line is optional |
| 3 Diagnoses | Fewer wrong or missed diagnoses (model) | `niceAxis(max)`, from 0 | 130 / 110 px | optional (the lane disappears with its measure) |

`niceAxis` is the one already in `simData.ts`; no new axis function. The x scale for every lane: `x(m) = L + (m - 1) * (W - L - R) / 23`, `m` = 1 to 24, `W` = the plot's measured width in CSS px.

| | 1280 (card 1120 wide) | 390 (card 358 wide) |
|---|---|---|
| Card padding | 16 / 24 (as the hero) | 12 / 16 (as `.sim-chart`) |
| Plot SVG width `W` | 818 (lane grid: plot column, 12 gap, 240 key column) | 324 (single column) |
| Insets `L`, `R`, `T` | 44, 12, 14 | 40, 12, 14 |
| Month step | 33.1 px | 11.9 px |
| Bottom inset `B` | 6 (lanes above the last); 44 on the last lane (month labels and "Plan month") | 24 on every lane (month labels); 44 on the last |
| Card height, three lanes (measured on the mock) | about 1,265 | about 1,880 |

**The plot SVG is built at its measured width (1 unit = 1 CSS px), not scaled from a fixed viewBox**, so 11 px text stays 11 px (the existing 320 x 190 viewBox would print 24 px ticks at 768). Re-measure on resize (`ResizeObserver`, one redraw, no animation). `aria-hidden="true"`, `focusable="false"`.

**Drawn in each plot, bottom to top:** the free-pilot band; vertical hairlines at months 3, 6, ... 24 (`.grid`); horizontal gridlines (`.grid`) and the zero line (`.axis`); the "first paid" line; the month tick marks (24, 4 px); the lines (3 px); the end markers at month 24. Month labels at 3, 6, ... 24 (every third, ending on the last; no value typed in the component). At 1280 only the last lane carries the labels; at 390 **every lane carries them**, because the key rows sit between the lanes and the shared scale would otherwise be far from lane 1. The scale is the same either way.

**The pilot band and the first paid month (if the CEO seat keeps them; CTO fixed both).**
- Band: month cells 3 to 8, from `x(2.5)` to `x(8.5)`, full plot height, fill `--color-surface-quiet`, in every lane. Label "Free pilot: no patients counted" (Anna) in lane 1 only, an HTML overlay in the band's top-left (`position:absolute`, left `x(2.5)`, top `T`, width the band's width), `600 11px/1.3` (12 px from 900 px up), `--color-text`, wrapping (at 390 the band is 71 px wide and the label takes three lines, about 51 px: inside the empty space above the zero lines).
- Marker: a vertical line at `x(9)`, 1.5 px, `--color-border-strong`, in every lane, the first month with a count. Label "First paid cases" (Anna) as SVG text at `x(9) + 6`, `T + 12`, lane 1 only, `600 11px` (12 from 900), `--color-text`. Rule: this label's box must not overlap a line or a marker (measure; at the placeholder values it clears by more than 50 px at both widths). If the data ever put a line under it, the label moves to the line's right end.
- Lines are drawn for all 24 months from the data, so the zeros before month 9 lie on the zero line. The band label says those months have no patients counted; nothing is hidden or invented.

### 2. Direct labels and end values (decision 2)

No legend. Each measure is named, valued and typed **at its line end** (1280) or **in a key row above its lane** (390). The same element in the DOM serves both; CSS grid areas move it (`.tl-keys` is the right column at 900 px and up, a block above the plot below it).

**Three kinds, each told apart by line pattern, end marker, colour and a text tag (never colour alone):**

| Kind | Which measures | Line | End marker (10 px) | Colour, light | Tag (Anna, placeholder) |
|---|---|---|---|---|---|
| Computed on synthetic records | Records with a match | solid | circle | `--color-link` (teal-600) | Computed on synthetic records |
| Model | Fewer wrong or missed diagnoses; Modelled drop in cost | dashed `6 4` (the existing `.line.model`) | diamond (square rotated 45 degrees) | `--color-flag-text` (coral-900) | Model |
| Plan | Patients in the network; Our income | dash-dot `12 4 2 4` | square | `--color-info` (teal-night) | Plan |

Line width 3 px (the three small charts use 2.5: these are the hero lines of the page), `stroke-linejoin: round`, butt caps (round caps blur a dash pattern). End marker: fill the kind colour, 2 px stroke `--color-surface` (as `.tip`). The same kind has the same look in every lane.

**Key content, in this order:** a 36 x 14 glyph (the line pattern for 24 px plus the end marker), the measure name (`--text-label`, `--color-text`), the end value, the kind tag (`--text-label`, `--color-muted`).

| | 1280 (right column, 240 px) | 390 (row above the lane's plot) |
|---|---|---|
| Layout | block, `position:absolute`, `top` set from the tip's y | row grid `36px 1fr auto`, min height 44 px, gap 8 px |
| Order | glyph and name; the value; the tag | glyph, name over tag; the value at the right |
| Value type | `600 32px/40px` (the existing `.sim-value`) | `--text-h2` (600 24px/1.2) |
| Value colour | `--color-text` | `--color-text` |

**Placement rule at 1280 (Ren measures, types no pixel):** `top = tip y - 40`, then sort the lane's keys by tip y, and each next key starts at least (previous key's measured height + 8) px below the previous one's top; clamp to the lane. At the placeholder values: lane 1 tips at 77 and 157 px, keys at 37 to 113 and 121 to 197; lane 2 tips at 50 and 152 px. A lane's plot must be tall enough for its keys (lane 1 and 2: 200 px holds two; do not shorten them). The name may wrap to two lines (the longest, "Fewer wrong or missed diagnoses", does at 240 px); the placement uses the measured height.

**End values** are the data's month-24 values, one formatter for the page (the CTO's unit test mirrors the Python arithmetic): counts with thousands separators (4,109; 1,693); euros as `€164k` (rounded to whole thousands) with the exact whole-euro value in the values table below; diagnoses with the data's own decimals. The value is the figure the founder asked to see: large, running total, at the end of the line.

### 3. Where it sits, and the three small charts (decision 3)

- **Directly under the hero, above `.sim-grid`.** Order at 390, top to bottom: label, h1, caption, hero, **timeline card**, chart 1, chart 2, chart 3, footer, Play again. At 1280 the card is full width (1120).
- **The three small charts stay, unchanged and not folded.** Reason: CEO condition 4 (MIN-4605) ties the euro figure to chart 3 with its own zero-based axis on screen; a disclosure would hide the proof exactly where a phone reader needs it. Folding them is not needed for length either: the card is the main chart and the small ones follow. Removing or hiding them needs the CEO seat.
- **Card chrome:** `.tl` = the `.sim-chart` look (`--glass-card`, 1 px `--glass-edge`, `--radius-card`, `--shadow-soft`); no new surface. Title `--text-lead` (600 20px/1.4), `--color-text`; caption and the hero tie sentence `--text-doctor-body`, `--color-muted`; lane titles `--text-label` at 16 px, `--color-text`; lane units `--text-label`, `--color-muted`. A 1 px `--color-border` rule separates lanes.
- **Assumption lines travel with what they qualify**, static ink text at full opacity, `--text-doctor-body`, `--color-text`, under their lane: lane 1 the ramp assumption (Anna); lane 2 the income plan marker, and the learning-curve line (`COPY.simAssumption`, unchanged) when the drop line shows; lane 3 the learning-curve line. The permanent label `simLabel` is the page's sticky bar and stays on screen with the card at every scroll position; this card changes nothing about it. A short foot line (pilot months, doctor-seat fees are income) closes the card in `--color-muted`. If the page is too long at 390, cut in this order: lane 3, then the drop line; never an assumption line.

### 4. Motion (decision 4)

- **Default: none.** The card is painted finished from first paint; it does not run on the 30-second clock (CTO); `SIM_*` and the 30,000 ms tests do not change. It takes no `.sim-enter` and shifts none of the existing `--i` stagger indexes.
- **Optional draw-in, if time allows (cut first):** the lines group (`.tl-lines`: lines and end markers) reveals left to right once, `clip-path: inset(0 100% 0 0)` to `inset(0)`, 600 ms, `--ease-out`, started when the card first scrolls into view (`IntersectionObserver`, once). CSS only, no per-frame JS. Labels, key values, tags, bands, gridlines and axes never animate and are never inside the clipped group (rule 0.1 and 0.2 apply: the values are readable from frame 0). `clip-path` is used because a stroke-dash reveal would break the dash patterns that carry the kinds.
- **`prefers-reduced-motion: reduce`:** no draw-in, nothing animates; the finished state at once (the existing global rule `animation:none!important` already covers it; the media query keeps the keyframes from being added at all).

### 5. States (decision 5)

| State | What is on screen |
|---|---|
| Normal | Card with the required lanes and every approved optional measure |
| `timeline` missing, not an object, `x` not 1 to 24, or any required measure (patients, income, matches) not 24 finite non-negative numbers | **The card is not rendered.** No placeholder, no error text, no empty frame. The hero, the three charts and the footer are as today (they simply follow the hero). The page is never broken by this block |
| An optional measure (`diagnoses`, `drop_eur`) absent or invalid | Only that line is left out. Lane 3 disappears with its only measure and the month labels and "Plan month" move to the last lane left. Lane 2 keeps income alone and its axis is `niceAxis(max income)` from 0 |
| Lane 2's two measures state different bases (one a running total, one a yearly rate, from their `unit` strings) | The drop line is left out (a second axis or a rescale is banned, and two bases on one axis would mislead). Income stays |
| CEO seat drops a measure on MIN-4698 | Same as "absent": no code change beyond the data, the lane logic above handles every combination (`hide` in the mock) |
| CEO seat drops the pilot band or the month 9 marker | The band and the label go; the marker line and its label go; nothing else moves (they sit in the plot's own layers) |
| Reduced motion | Section 4 |
| Width between 481 and 899 | The 390 layout (key rows above the plot); the plot is as wide as the column; same rules |

What changes if a measure is dropped, in one line each: **diagnoses** lane 3 and its note go; **drop** lane 2 holds income alone and the learning-curve line leaves lane 2; **income** (public-page question) the card keeps lanes 1 and 3, lane 2 goes (a lane with no measures is absent, same rule as lane 3; the CTO's contract then marks `income_eur` optional, because today a missing income would mean no card); **patients** lane 1 holds the matches line alone and its note changes to Anna's matches-only line; **the band and the marker** as the table.

### 6. The text alternative (decision 6)

- `<section aria-labelledby="{title id}" aria-describedby="{desc id}">`. The description is Anna's `aria-label` text, filled from the data, in a visually hidden `<p id>` (not an `aria-label` on a graphic, so a screen reader reads it as text, and the numbers equal the file).
- Everything visible is real text: title, caption, lane titles, units, key names, values, tags, assumption lines. The three plot SVGs are `aria-hidden`. The band and marker labels are visible text next to them.
- **A small values table under the card**, in a `<details>` (summary "Show the values", Anna, min height 44 px, `--color-link`): rows = the measures that show, columns = Measure, Month 12, Month 24 (the ends of plan years 1 and 2), whole numbers, whole euros (`€164,352`), the data's decimals for diagnoses. 3 columns fit 324 px at 14 px with 4 px cell padding. It is the exact-number alternative for the rounded `€164k`.

### 7. The hard limits as checks Ren can measure

| Limit (CEO seat, section 6.4, and MIN-4696) | Check |
|---|---|
| Every axis starts at zero | In every lane the value of the bottom tick is 0 and `y(0)` equals the plot's bottom; the top tick is `niceAxis(max)` of that lane's visible measures. No lane's top tick is below its max. A unit test on the builder with a fixture, and a DOM check on the page |
| No log, no crop, no rescale, no second y axis, no indexed axis | One y axis per lane (one set of tick labels at the plot's left). The y of a point is a linear function of the value only: `y(v) = T + plotH * (1 - v / top)` for every point of every line in the lane (unit test: all 24 points of every line, compared with the data) |
| Every plotted number equals the JSON | The 24 y positions invert to the data values within 0.5 px; the key values and the table cells equal the formatted data (the one formatter) |
| The label and the assumption line stay visible with the diagram | `data-testid="sim-label"` is in the viewport (sticky) with the card at 390 and 1280; each lane's note is a sibling of its plot, never inside an element that animates opacity or `clip-path` |
| Three kinds look different and say what they are | Each key shows a glyph, a tag and a name; computed, model, plan have three different `stroke-dasharray` values (`none`, `6 4`, `12 4 2 4`) and three different end-marker shapes; the tag text is present for every measure |
| Free pilot (months 3 to 8) and month 9 marked | The band spans `x(2.5)` to `x(8.5)`; the marker line sits at `x(9)`; both present with their labels in lane 1 (or both absent when the CEO seat drops them) |
| Told apart without colour alone | Converting the card to grey scale leaves the three line patterns, the three marker shapes and the tags. The names are next to the lines |
| Contrast on the page's tokens | Pairs below, computed. Text at least 4.5, lines, markers and axes at least 3 |
| Readable at 390 and 1280, no overflow | `document.documentElement.scrollWidth` equals the viewport width at 390 and 1280; no SVG text box outside its SVG; band label box inside the band; key boxes at least 44 px high at 390 and not overlapping at 1280; measured sizes pasted on MIN-4702 |
| Missing block means no card | With `timeline` removed from the fixture the card's test id is absent and the hero and three charts render as before |

**Colour pairs (WCAG 2.x, computed 2026-11-15; ground = the card glass over the page, darkest pixel `#FCF5F4`, then white):**

| Pair | Ratio | Needs | Result |
|---|---|---|---|
| teal-600 line on card | 5.08 to 5.47 | 3 (graphic) | pass |
| coral-900 line on card | 6.25 to 6.73 | 3 | pass |
| teal-night line on card | 11.43 to 12.30 | 3 | pass |
| the same three on the pilot band (`--color-surface-quiet`) | 4.85, 5.96, 10.90 | 3 | pass |
| ink, ink-soft text on card | 15.58, 6.48 | 4.5 | pass |
| ink-soft on the band | 6.18 | 4.5 | pass |
| zero line, ticks, "first paid" line (`--color-border-strong`) on card | 4.07 | 3 | pass |
| `--color-border-strong` on the band | 3.88 | 3 | pass |
| hairline gridlines (`--color-border`) | decorative | n/a | the values are in text |

### 8. Tokens and constants

**No new colour in the light theme.** Every colour is a role token above. No new type token: the end value reuses `.sim-value` (32/40) and `--text-h2`; chart text is the existing 11 px SVG text (12 px for the two annotations from 900 px up). One new constant block beside `simData.ts`: `TL_LANES = [{ id: 'people', h: [200, 150] }, { id: 'euro', h: [200, 150] }, { id: 'dx', h: [130, 110] }]` (heights at wide and narrow), `TL_INSETS = { wide: { L: 44, R: 12, T: 14 }, narrow: { L: 40, R: 12, T: 14 } }`, `TL_KEY_GAP = 8`. Words only from Anna's `copy.ts` entries; no number or unit typed in a component.

### 9. The mock

`docs/design/min-4700/timeline-mock.html` (open it in a browser; add `?theme=dark` for the dark mapping, `?hide=drop,dx` to see a measure dropped, `?still=1` for no draw-in). It loads the repo's real token and page CSS and contains a reference builder (about 60 lines of plain JS: the axes, the x scale, the lines, the key placement). It is a reference for Ren, not code to ship: it types its placeholder numbers and its strings, which the app must not. Renders in `docs/design/min-4700/shots/` (1280 and 390, light and dark). **The values in it are placeholders: month 24 shows 4,109 patients, 1,693 records, 11.8 diagnoses, €62k drop, €164k income, taken from the CTO's scratch numbers and Product's estimate; the real ones come from `timeline`.**

### 10. Words I need from Anna (placeholders in the mock)

Lane titles and unit lines (People, Euros, Diagnoses; "Patients and records, running total"; the euro unit, once the CEO seat fixes the basis); the three kind tags (Plan, Model, Computed on synthetic records); the table's summary ("Show the values") and its column heads; the matches-only note for lane 1 if patients drop. Title, caption, band label, marker label, "Plan month", the three assumption lines, the tie sentence and the aria text are Anna's draft strings from MIN-4697, used as written.

### 11. Left out, and why

An area fill under the lines (overlapping fills in one lane blur the kinds, and an area makes the euro lane look bigger than its numbers); a second y axis or any rescale (banned); month 25 or later (CTO: out); hover or tap tooltips (the values are on screen as text, and touch is not verified); a legend (labels are at the lines); folding the three small charts; per-point value labels along the lines (the end value and the table carry the numbers; more labels at 11 px would crowd 12 px month steps at 390); a count-up of the end values (a number that is not the data is on screen for a moment).

### 12. Dark view (proposal; the app has no dark theme)

You asked for light and dark. Nothing in `src/` switches theme, and A12 left a dark mode out, so this ships only if someone builds the theme. The card is written with role tokens only, so a theme change reaches it without edits. The mapping the mock uses (`html.inverse`) takes the existing brand palette only: ground `--teal-night`, text `--white`, computed `--mint`, model `--peach`, plan `--white`. Two derived mixes are not in the palette and need approval if it ships: the card (`--white` 6% over `--teal-night`) and muted text (`--white` 72% over `--teal-night`). Computed on the dark card (about `#264749`): mint 6.78, peach 7.87, white 10.33, muted text 6.01, `border-strong` mix 4.07, mint on the band 6.00. Same patterns, markers and tags, so the kinds are told apart the same way.

## A14. Addendum: one plot, five lines, animated (MIN-4722, parent MIN-4696)

**Superseded by A15 (MIN-4747, founder 2026-11-15: one diagram with a slider, not animated).** Sections 1 to 4 (the scale rule, the line table, the plot geometry, heads) are kept in A15 where A15 says so; the clock, the month readout, Replay and the head labels in sections 4 to 7 are gone. Patients are tagged Plan, not Computed (CTO ruling on MIN-4720), in the section 2 table below.

Founder, 2026-11-15, verbatim: "no no no. We said one diagram with all the lines on the same showing how while the users are growing so as the matches how the other numbers are growing", then "animated". The contract is the CTO's on MIN-4720 (comment 6fba2571): one plot, five lines, one scale per unit (people against patients; euros against income; diagnoses on their own), linear from zero, gridlines at 0, half and the reference, no unit tick values, the scale fixed from the first frame, straight segments, every real value visible at a line head (or in a five-row readout on a phone), the card on its own clock. This section settles only what the CTO left to design. Goal: supports directions 4 and 5 (patients, matches and money growing together on the page that sells them).

**Verified:** the mock `docs/design/min-4722/timeline-mock.html` loads the repo's token files, holds the real `timeline` block of `data/synthetic/simulation.json` (synthetic records and a plan) and Anna's section 8 strings; rendered in headless Chrome at 1280 and 390 (iframe, so the phone layout is real), final frame, month 14, month 6. Measured from the DOM: no horizontal overflow at either width (`scrollWidth` equals the viewport), phone readout rows 53 to 61 px high, label stack at 1280 contiguous and inside the plot. The greyscale render of the 1280 final frame (`shots/1280-final-greyscale.png`) still tells solid, dash-dot and dashed apart, and the five marker shapes apart. **Not verified:** the frame budget (the mock redraws head shapes with `innerHTML`; Ren builds them once and moves them), touch, a real phone, reduced motion in a real browser (the mock only honours `?still=1` and the media query), contrast numbers re-measured (A13 section 7 pairs are reused: same tokens, same grounds), the IntersectionObserver start on a scrolled page. Figma: no file touched; the mock and renders are the record for this issue.

### 1. What the CTO's scale rule does to the picture (so Ren is not surprised)

References (from the file): people 2,806, euros €228,923 a year, diagnoses 9.8. At month 24 patients, income and diagnoses all end at the top gridline; matches end at 40.5% of that height and the modelled drop at 38.5%. Months 1 to 8 are flat on the zero line by plan. Matches and the drop end 2% of the plot apart (about 7 px at 1280): they cross-read as one pair, which is the truth (both are about 40% of their reference), and the labels, markers and patterns keep them apart.

### 2. Telling five lines apart without colour (settled)

**Pattern says the kind. Marker shape says the line. The label says both in words.** Colour repeats the kind and is never the only cue.

| Line | Kind tag (Anna 8.1) | Pattern | Colour token | Marker |
|---|---|---|---|---|
| Patients | Computed on synthetic records | solid | `--color-link` | square |
| With a match | Computed on synthetic records | solid | `--color-link` | circle |
| Income, plan | Plan | dash-dot `12 4 2 4` | `--color-info` | triangle up |
| Diagnoses, model | Model | dashed `6 4` | `--color-flag-text` | triangle down |
| Cost drop, model | Model | dashed `6 4` | `--color-flag-text` | diamond |

Line 3 px, straight segments (`stroke-linejoin: round`, butt caps: a round cap blurs a dash). Small markers (radius 3.6 px, 2 px `--color-surface` stroke) sit on every line at months 12 and 18, inside the revealed group, so a line is identifiable in the middle of the plot, not only at its head. The head marker is radius 6 and is not in the clipped group (it slides with the head). Where two lines share a pattern and colour (patients and matches; diagnoses and the drop) the markers and the labels are what separate them: this is the weakest point of the design, see open question 1.

### 3. The plot (one SVG, built at its measured width, 1 unit = 1 CSS px)

| | 1280 (card 1120, padding 24) | 390 (card 358, padding 12/16) |
|---|---|---|
| SVG width | 1072: plot 812 + label column 260 | 324 |
| Insets `L`, `R`, `T`, `B` | 24, 12, 26, 44 | 24, 12, 24, 40 |
| Plot height `H` | 340 | 240 |
| Month step | 33.7 px | 12.5 px |
| Card height (final) | about 988 | about 1,674 |

`x(m) = L + (m - 1) * (Wp - L - R) / 23` (`Wp` = SVG width minus the label column), `y(f) = T + H * (1 - f)` where `f` = value / the unit's reference (the maximum of the unit's lines in the file; unit tests are the CTO's). Layers, bottom to top: pilot band (months 3 to 8, `--color-surface-quiet`, `x(2.5)` to `x(8.5)`, full height; label `tlBand` as an HTML overlay top-left in the band, 600 11/12 px); vertical hairlines at months 3, 6, ... 24; gridlines at 1 (dotted `2 3`, `--color-border-strong`, so the reference reads as the ceiling), at 0.5 (`.grid`) and 0 (`.axis`); the playhead (below); the first-paid line at `x(9)` and its label `tlFirstPaid` (SVG text, 600, with a 3 px `--color-surface` paint-order halo so the playhead never cuts it); month ticks (24), month labels every third and "Plan month"; the clipped lines group; the head markers; the leaders.

**The y axis wording (the CTO's first slot).** Left of the zero line: `0` (`tlScaleBase`), 11 px, `--color-muted`. Above the top gridline, left-aligned at `L`: `tlScaleTop` "Top: the largest value in the unit", 11 px, `--color-muted`, one instance (the three unit groups share the one top gridline, so Anna's "once per unit group" collapses to once). **No label on the half gridline and no tick values.** Under the plot, always visible, never inside a disclosure: `tlScale` (full ink, `--text-doctor-body`, `--color-text`) and under it `tlScaleMore` (`--text-label` at weight 400, `--color-muted`). Those two sentences are the contract with the reader that heights compare only inside a unit.

### 4. Heads, label collisions and the phone readout (settled)

**1280.** The labels live in the right column (248 px wide, 12 px gap), not on the plot, because three lines end at the same point. Each label is 68 px tall (a fixed constant, so no measuring in the frame loop): a 22 px marker column, then the value (600 24/28, `--color-text`; the "a year" suffix `--text-label`, `--color-muted`), the short head name (`tlHead.*`, `--text-label`, `--color-text`), the kind tag (`--text-label`, `--color-muted`). A 1 px leader in the line's colour runs from the head marker to the right, horizontally, to 10 px past the plot, then diagonally to the label's first line. De-collision, every frame, arithmetic only: sort the five heads by head y (ties by the fixed order patients, income, diagnoses, matches, drop); each label's top is `max(head y - 14, 0, previous top + 68 + 6)`; then a back pass pulls the stack up if the last label would pass the plot's bottom. Final frame: the top three labels stack at 0, 74 and 148, matches at 222, drop at 296 (all inside the 410 px SVG). **The three heads coincide at the top at month 24:** their markers overlap there and the last drawn (diagnoses) shows on top. This is intended; the three leaders fan out to three labels whose own markers are separate.

**390.** No head labels and no leaders. The five head markers stay on the lines. Under the plot a readout of five rows (a `ul`), fixed order patients, with a match, income, cost drop, diagnoses (people, then euros, then diagnoses, so the order never jumps and rows of one unit sit together): a 36 x 14 glyph (the line's pattern and its marker), the head name over the kind tag, the value at the right (`--text-h2`, tabular numerals, the "a year" suffix on a line below in `--text-label`, `--color-muted`). Row min height 52 px (measured 53 to 61). The rows change at month edges with the heads' labels. Between 481 and 899 px: the 390 layout, the plot as wide as the column.

### 5. The month readout and Replay (settled)

`tlMonth` "Month {n} of {last}" at `--text-label` 16 px, `--color-text`, tabular numerals, and the Replay button (`tlReplay`, `aria-label` `tlReplayAria`) side by side, in one row of 44 px minimum. **1280:** top right of the card, level with the title, the title block and the caption left (the caption max 70ch). **390:** its own row between the caption and the plot, readout left, Replay right. Replay is a pill (1.5 px `--color-link` border, `--glass-card` fill, `--color-link` text, 16 px label), min 96 x 44. It is present but `disabled` while the run is going (border `--color-border-strong`, text `--color-muted`), and enabled at the end of the run; it restarts this card's clock only. Not sticky. The readout steps with the values at month edges.

### 6. Motion (speed settled)

- **500 ms a month.** The month position is `mc = min(24, 1 + t / 500)`; the displayed month `n = floor(mc)`; the run ends at `t = 12,000 ms`, which is `mc = 24` at 11.5 s and a 0.5 s hold on the final frame. The 400 to 600 ms band was weighed: at 400 ms the run is 9.6 s and the flat pilot is 2.8 s, but the first paid month (9) arrives at 3.2 s, before a reader has read the band; at 600 ms the run is 14.4 s and the flat stretch is 4.8 s of nothing. 500 ms puts month 9 at 4.0 s, month 11 (first matches) at 5.0 s, and keeps the whole story under the 12 s the CTO costed.
- **Start:** once, when 40% of the card is in view; if it is already in view at first paint, then. The frame before the start is the empty chart: axes, band, labels and the readout "Month 1 of 24", all values 0.
- **Draw:** a clip rectangle's width follows `x(mc) + 1` (width attribute, no reflow); a 1 px playhead (`--color-border-strong`) at `x(mc)` from the top gridline to the zero line, hidden when `mc` is 24, shows where the run is. The head markers sit at `x(mc)` on the straight segment between months `n` and `n + 1` (so they slide); **the number in a label or row shows month `n`'s value and changes only at month edges**, so a displayed number is always a value from the file, never a tween. The heads' labels slide with their heads by `transform` (label height is a constant, no layout reads); leaders are 5 path `d` writes. React state changes 24 times; everything else per frame is written through refs (CTO, MIN-4720 section 3).
- **Reduced motion:** the finished chart at once (clip at full width, no playhead, labels in place), the readout "Month 24 of 24", **no Replay element**, no timer. The same for a server render.
- **No `aria-live`** during the run; the SVG is `aria-hidden`; the card keeps the aria text (`tlDescLead` with the five lines) and the values table.

### 7. States

| State | What shows |
|---|---|
| Not started (off screen) | The empty chart at month 1; Replay disabled |
| Running | As section 6; Replay disabled |
| Finished | The final frame; Replay enabled |
| Reduced motion, server render, `at` beyond the end | The finished chart, no Replay |
| `timeline` missing or invalid | No card (A13 section 5, unchanged); the hero and charts as today |
| Optional line absent (diagnoses, drop) | The line, its head, its label and row go; the unit's reference is the maximum of what remains; the label stack closes up; `tlScaleMore` needs Anna's variant |

### 8. Notes under the card, order (all Anna's, unchanged)

Right under the scale sentences, in this order: `tlRampPerCase`, `tlAssumeDx`, `tlIncomePlan`, `tlEuroNote`, `tlFormula`, `tlTie` (the last in `--color-muted`), then "Show the values" and its table (five rows, months 12 and 24). The permanent label bar stays sticky as today. At 390 these notes are most of the card's height; if the page must be cut, nothing in this list is cut (the CEO seat's conditions); cut the diagnoses line and its note instead.

### 9. Tokens and constants

No new colour, no new type token, no new string: every word is in `docs/simulation-copy.md` section 8. New constants beside `simData.ts`: `TP_GEOM = { wide: { L: 24, R: 12, T: 26, H: 340, B: 44, labelCol: 260 }, narrow: { L: 24, R: 12, T: 24, H: 240, B: 40, labelCol: 0 } }`, `TP_LABEL_H = 68`, `TP_LABEL_GAP = 6`, `TP_MS_PER_MONTH = 500`, `TP_VIEW_START = 0.4`. Tokens used: `--color-link`, `--color-info`, `--color-flag-text`, `--color-surface`, `--color-surface-quiet`, `--color-border`, `--color-border-strong`, `--color-text`, `--color-muted`, `--glass-card`, `--glass-edge`, `--radius-card`, `--radius-pill`, `--shadow-soft`, `--target-min`, `--text-lead`, `--text-h2`, `--text-label`, `--text-doctor-body`. Reduce `matches.css` accordingly: the `.tl-lane*`, `.tl-keys`, `.tl-key*` rules go with the lanes.

### 10. Checks Ren can measure

Every axis from zero and the three gridlines at `y(0)`, `y(.5)`, `y(1)`; every point `y` inverts to value / reference within 0.5 px, and the scale is identical at `t` = 0, 6,000 and 12,000 ms; at month 24 matches/patients and drop/income heights equal the true ratios (0.405, 0.385); every head carries (or its readout row carries) the month's real value; reduced motion has no Replay and the final chart; no horizontal overflow at 390 and 1280; phone rows at least 44 px; 1280 labels at least 6 px apart and inside the plot; the three patterns (`none`, `6 4`, `12 4 2 4`) and five marker shapes present; frame budget as the CTO set.

### 11. The mock, and open questions

`docs/design/min-4722/timeline-mock.html` (`?t=6500` freezes month 14, `?still=1` the finished chart, `?ms=400..600`). Renders in `docs/design/min-4722/shots/`: `1280-final`, `1280-month14`, `1280-month6`, `390-final`, `390-month14`, `390-month6`, and the greyscale check. It is a reference, not code to ship: it types its strings and redraws shapes with `innerHTML`.

1. **Patients and matches look alike** (solid teal, differ by square and circle plus the label); the same for diagnoses and the drop. Anna's kind tags make this so. If the CTO or the CEO seat wants a pattern per line, a fourth and fifth pattern would break the "pattern = kind" rule; I did not add them. Decision for the CTO.
2. **The leaders cross the not-yet-drawn region mid-run** (the labels stay in the right column). They are quiet 1 px lines but long at month 6 to 12. The alternative, labels that travel with the heads, collides with the lines. Kept the column; flagging it.
3. **A zero money value reads "€0"** (not "€0k"); the one formatter for the page covers it. Anna: confirm "€0 a year" at the flat months.
4. **Left out:** a legend, hover or tap values, a label on the half gridline, any second axis, an area fill, a count-up between months, a dark view (the app has no dark theme).

## A15. Addendum: one diagram, a plan-year slider, nothing moves (MIN-4747, parent MIN-4696). Supersedes A14. **Superseded by A16 (MIN-4772) on 2026-11-15.**

Founder, 2026-11-15, verbatim: "We just need one fucking diagram with all the numbers not animated but with a slider showing in 10 years the money can be saved in greece while we grow the correct diagnoses". About the EU hero: "wtf is this number? asking again." Back's acceptance: one diagram, one card, nothing moves unless the viewer drags the slider. The hero card (dot field and the EU-27 figure), the three small charts and the animated card (A14) are all replaced by this one card; the permanent label "Simulation on synthetic data. A model, not a measurement" stays. Words: Anna, MIN-4723 comment 9e14b7f0. Rules: the CTO's one-scale-per-unit contract (MIN-4720 comment 6fba2571), still in force until the CTO's MIN-4744 ruling says otherwise. Goal: supports directions 4 and 5 (a doctor or investor sees what real matching and the patient analysis could change in Greece over ten years, as a model and not a promise).

**What survives from A14:** the five lines, the pattern-is-kind rule, the markers, the kind tags, the scale rule and its sentences, the permanent label, the notes. **What dies:** the clock, the playhead, the clip reveal, the month readout, Replay, head labels and leaders, the 24 monthly points, the 500 ms per month. Nothing in this card is animated: no transition, no easing, no timer, no `requestAnimationFrame`, no IntersectionObserver. The only thing that changes is what the viewer's slider causes, and it changes in the same frame as the input event. Reduced motion needs no branch.

**Verified:** the mock `docs/design/min-4747/slider-mock.html` loads the repo's token files and renders at 1280 and 390 (iframe, so the phone layout is real) at plan year 3 and 10 (and 1, and the variants in section 9). Measured from the DOM: no horizontal overflow at either width (`scrollWidth` equals the viewport); the slider thumb's centre x equals the year marker's x to the tenth of a pixel at both widths; slider 44 px high; readout rows 57 to 61 px (the diagnoses row 114 with its one-line help); at 390 the card top to the slider's bottom is 587 px. Contrast pairs computed from the token hexes: ink on peach 12.78, ink on mist 14.86, the three line colours on mist (the assumed band) 4.85 to 10.90 (all above the 3:1 non-text floor), the slider track `--field-border` on white 4.38, the thumb on white 5.47. A greyscale render (`shots/1280-year3-greyscale-crop.png`) tells solid, dashed and dash-dot apart. **Not verified:** a real phone and touch (the drag, the 44 px target by thumb), keyboard in Safari and Firefox (only Chrome rendered; the Firefox thumb rules are written and unrun), a screen reader reading `aria-valuetext`, the hero and rows with real numbers (all numbers in the mock are placeholders, section 11), the card on the real page below the real hero stub. Figma: no file touched; the mock and renders are the record, as in A14.

### 1. The card, top to bottom

| # | Block | 1280 | 390 |
|---|---|---|---|
| 1 | Title (`gTitle`, `--text-lead`) | full width | full width |
| 2 | Caption (`gCaption`, `--text-doctor-body`, `--color-muted`, max 70ch) | under the title | **moves below the readout rows** (it is five lines; it must not push the slider down) |
| 3 | The money readout (the hero number) | right column, top | first block, above the plot |
| 4 | The plot with the slider under it | left column, spans the readout's height | full width |
| 5 | The other four readout rows | right column, under the money | under the slider |
| 6 | The notes (section 8) and "Show the values" | full width, under | full width, under |

Grid: wide is two columns, `minmax(0,1fr)` and 320 px, gap 24, areas `plot money` / `plot list`; narrow is one column, gap 8, areas `money` / `plot` / `list`. The caption and notes sit outside the grid and change position with CSS `order` only (one element each, no duplicate text). The card keeps A14's surface (`--glass-card`, `--glass-edge`, `--radius-card`, `--shadow-soft`, padding 12/16 at 390, 16/24 from 900). Between 481 and 899 px: the 390 layout, the plot as wide as the column.

### 2. The plot (one SVG, built at its measured width, 1 unit = 1 CSS px)

| | 1280 (card 1120) | 390 (card 358) |
|---|---|---|
| SVG width | 726 (the left column) | 324 |
| Insets `L`, `R`, `T`, `B` | 28, 20, 46, 40 | 28, 20, 54, 40 |
| Plot height `H` | 320 | 160 |
| Year step | 75.3 px | 30.7 px |
| Plot block height | 406 | 254 |

`x(y) = L + (y - first) * (W - L - R) / (last - first)` (`y` a year; with 10 years, `first` 1, `last` 10), `yy(f) = T + H * (1 - f)`, `f` = value / the unit's reference (the maximum of the unit's lines over every year in the file). The scale never changes with the slider. Layers, bottom to top: the assumed band (section 6); vertical hairlines at every year (`--color-border`); gridlines at 1 (dotted `2 3`, `--color-border-strong`, the ceiling), at 0.5 and at 0 (the axis); year ticks and numbers 1 to 10 (11 px, `--color-muted`) and the axis title "Plan year" (`gSliderLabel`); the five straight polylines; the current-year line; the five markers at that year. **No label on any line and no value on the plot.** Every value is in the readout, which is also the legend (glyph = the line's pattern plus its marker). Direct labels at the right end were dropped: patients, income and diagnoses all end at the same point, and a value on a line that the slider moves would repeat the readout.

The y axis wording (CTO rule 5): `0` left of the zero line, and `tlScaleTop` "Top: the largest value in the unit" above the top gridline at `L`; no tick values, no label on the half gridline. The two scale sentences `tlScale` and `tlScaleMore` sit with the notes (section 8), always visible, never in a disclosure.

**The current year.** A 1.5 px vertical line in `--color-text` from the top gridline to the axis, at `x(year)`, and one marker per line on it (shape and size in section 3). It jumps from year to year; there is no tween. The slider's thumb centre is at the same x (section 5), so the line and the thumb read as one control.

### 3. The five lines

| Line (readout order) | Kind tag | Pattern | Colour token | Marker | Stroke |
|---|---|---|---|---|---|
| Money in Greece: "Modelled drop in cost in Greece" (or "Money saved in Greece", section 9) | Model | dashed `6 4` | `--color-flag-text` | diamond, r 7.5 | **4.5 px** (the only heavy line) |
| Our income | Plan | dash-dot `12 4 2 4`, dash offset 11 | `--color-info` | triangle up, r 6 | 3 px |
| Patients in the network | **Plan** | dash-dot `12 4 2 4` | `--color-info` | square, r 6 | 3 px |
| Records with a match | Computed on synthetic records | solid | `--color-link` | circle, r 6 | 3 px |
| Correct diagnoses gained | Model | dashed `6 4` | `--color-flag-text` | triangle down, r 6 | 3 px |

Patients is **Plan** (CTO ruling MIN-4720, fix B; the A14 table said Computed and was wrong). The pattern says the kind, the marker says the line, colour repeats the kind and is never the only cue. Draw order, bottom to top: diagnoses, matches, patients, income, money, so the money line is always on top. Patients and income share a pattern and a colour: the 11 px dash offset on income makes their dashes interleave where they overlap, and the markers and the readout separate them. Straight segments, `stroke-linejoin: round`, butt caps. Markers have a 2 px `--color-surface` stroke.

### 4. The readout (the five values at the slider's year)

**The money block (most prominent).** A card inside the card: `--color-surface-quiet` fill, 1 px `--color-border-strong`, `--radius-sm`, padding 8/16/12. Inside: the line's glyph (36 x 14) and the head name (`--text-label` at 16 px, `--color-text`); the value (600, **40 px at 1280, 36 px at 390**, `--color-text`, tabular numerals); under it "a year" (`--text-label` 16 px, `--color-muted`; at 390 it sits on the value's line, at 1280 on the next); the kind tag "Model" (`--text-label`, `--color-muted`); and `gHelp.money` (14 px, `--color-muted`). Measured: 188 px high at 1280 (at year 3), 146 px at 390.

**The four rows**, in this order and never reordered: Our income, Patients in the network, Records with a match, Correct diagnoses gained (euros, then people, then diagnoses, as A14 grouped by unit). Each row: a 36 px glyph column, the head name over the kind tag (both `--text-label`; name `--color-text`, tag `--color-muted`), and the value at the right (`--text-h2`, `--color-text`, tabular numerals, nowrap) with its suffix under it (`--text-label`, `--color-muted`: "a year, plan", "a year, in the model"; none for the two people rows). Minimum row height 56 (measured 57 to 61); a 1 px `--color-border` rule between rows. Diagnoses carries `gHelp.dx` as one extra line (14 px, `--color-muted`).

**Number format (one formatter for the page, Anna to confirm):** euros under €1,000 whole ("€640"); under €1 million in thousands ("€121k"); from €1 million with one decimal ("€1.3 million"); people as a whole number with thousands separators; diagnoses one decimal under 10, whole from 10. A value that changes the displayed unit (€999k to €1.0 million) is allowed to jump; it is a different year.

### 5. The slider

A native `<input type="range">`, `min` first year, `max` last year, `step` 1, no JavaScript widget. Label (`gSliderLabel`, "Plan year", `--text-label` at 16 px) at the left and the year text at the right of one row above it ("Year 3 of 10", `gSliderValue`, 600 16 px, tabular numerals), then the track. **Height 44 px (`--target-min`): the whole 44 px band is the touch target, not only the thumb.** Track: 8 px, `--radius-pill`, `--color-border-strong` (4.38:1 on white). Thumb: 32 px circle, `--color-link` fill, 3 px `--color-surface` ring, 1.5 px `--color-link` outer ring (5.47:1). Focus: `--focus-ring` / `--focus-offset` on the thumb (`:focus-visible` only). No filled "progress" track: the value is read from the marker, not the fill.

**Alignment:** the input's left margin is `L - 16` and its width `(W - L - R) + 32`, so the thumb's centre is exactly `x(year)` (measured: equal to the marker to 0.1 px at both widths). The 16 is half the thumb; Firefox's 26 px thumb needs `L - 13` and `+ 26`; Ren sets both from one constant.

**Keyboard and assistive technology:** arrows move one year, Home and End go to the first and last year, Page keys are the browser default; nothing to build. `aria-valuetext` is "Year 3 of 10, plan" or "Year 7 of 10, assumed growth", set on every input. The SVG is `aria-hidden`. **No `aria-live`:** the slider's value text is the announcement; the card's description (`gDesc`) is rewritten on every input and is read when the card is read, not announced. "Show the values" (a `details` with a ten-row table) stays as the accessible version of the whole chart.

**Reading under the finger:** at 390 the money number is above the plot and the slider is below it, with 587 px between the card's top and the slider's bottom (so the number, the plot and the thumb are on one 664 px screen under a 72 px label bar only if the card is scrolled to its top; 659 of 664, tight, see open question 6).

### 6. Years past the plan must look like an assumption

The plan covers years 1 to 3 (`plan_last`); everything after is an assumed growth rate. Three cues, all on at once, none colour-only:

1. **A hatched band** behind the plot from half a year after the last plan year to the right edge (`x(plan_last + 0.5)`): `--color-surface-quiet` with 45 degree hairlines 9 px apart (`--color-border-strong` at 55% opacity, 1.5 px), a 1.5 px dashed ink edge on its left (`4 3`, `--color-text`). The hatch is decoration only; every line and marker has at least 4.85:1 against the band.
2. **Two labels above the plot**, 11 px (12 from 900) 600 `--color-text`, each over its own region, top aligned to the card's edge of the SVG: "Plan: years 1 to 3" (NEW `gBandPlan`) over the plan region and "Assumed growth, not in the plan: 40% a year" (NEW `gBandAssumed`, the rate from the file) over the assumed region. At 390 both wrap to two lines (a reserved 30 px strip, T = 54). They are above the plot, not on it: a label on the band hid the lines at years 9 and 10 in the first render.
3. **A state line under the slider** with a fixed 26 px height so the slider never moves: for plan years the words "In the plan" (NEW `gStatePlan`, `--text-label`, `--color-muted`); for assumed years a pill with "Assumed growth, not in the plan" (NEW `gStateAssumed`: `--color-caution-bg` fill, ink text 12.78:1, 1 px `--color-flag-text` edge, `--radius-pill`, `--text-label`). The slider's `aria-valuetext` says the same.

The lines themselves are drawn the same way in both regions (a different stroke would claim two different kinds of line); the band is what says "assumed". Patients and income keep the kind tag "Plan" in the readout in every year; the state line and the band carry the assumption.

### 7. So that either answer fits (CTO MIN-4744, CEO seat MIN-4746)

One constant block, nothing else in the layout changes: `DG = { first, last, unit: 'year' | 'month', planLast, step, assumedRate }`.

- **Horizon, yearly 1 to 10 (as drawn) or monthly to 120.** The plot is one polyline per line between the file's points; `x()` and the ticks use `first`/`last`; ticks and numbers are always one per year (a month horizon labels every 12th month as the year), so 120 points change no layout. The slider's `max` is `last` and `step` 1; at 120 the thumb moves 5.6 px per step at 1280 and 2.4 px at 390, which is below a finger's precision; for a monthly file keep `step` 1 for the keyboard and let the pointer snap to every month (nothing more to design). The year text becomes `gSliderValue` with "Month {n} of {last}" (Anna's second key) or, preferably, "Year {y}, month {m}". The band's left edge is `x(planLast + 0.5)` either way.
- **Growth assumption.** The rate is read from the file and printed in `gBandAssumed` and `gAssumeGrowth`. If the CTO or the CEO seat chooses a different rule per line (not one rate), the band and the labels do not change; the label reads "Assumed growth, not in the plan" without a number, and `gAssumeGrowth` carries the rules in words.
- **"Saved" or "modelled drop" (the CEO seat rules).** Only the money line's head name, the card title, the caption and the table column change (Anna's columns M and S). The block and the readout are the same size in both: "Money saved in Greece" is shorter than "Modelled drop in cost in Greece", so M is the longer string and the one the layout is checked with. `?saved=1` in the mock shows S (`shots/1280-year10-saved-wording.png`).
- **Cumulative money.** If the CEO seat wants "added up over {n} years" it is one more row under the money block (`--text-h2`, same grammar, its own tag "Model"), never a new line on the plot (the plot's scale rule has no running total). Not drawn; Anna's `gDesc` has no string for it.

### 8. Notes under the card (Anna's strings, unchanged), in this order

`tlScale`, `tlScaleMore` (`--color-muted`, 14 px), then the scale fact "For scale: Greece spent {total} on health in {year}, {perInhabitant} for each inhabitant." (`--text-label` at 16 px; Anna's recommended A; it replaces the EU-27 figure), then `gAssumeEffect`, `gAssumeVisits`, `gAssumeShare`, `gAssumeGrowth`, `gIncomePlan`, `gBase`, `gFormula` (rewritten at the slider's year), `gSource` (`--color-muted`), then "Show the values" and its table. Nothing in this list is cut at 390 (the CEO seat's conditions); the card is 2,013 px high at 390 with them. "Years 1 and 2 in the table and the plot are the file's months 12 and 24" is Cron's note, not on screen.

### 9. States, variants, deleted

| State | What shows |
|---|---|
| First paint | Slider at plan year 3 (`plan_last`, the last year the plan covers), the readout and the marker for year 3, no scroll or timer needed |
| Any year | Every value, the marker and the state line change in the input event's frame |
| `timeline` (or its yearly series) missing or invalid | No card; the page head and the rest of the page as today (A13 section 5 rule) |
| An optional line absent (diagnoses) | Its line, marker and row go; its unit's reference is the maximum of what remains; the readout closes up; `tlScaleMore` needs Anna's variant |
| Reduced motion, server render | The same card; there is no motion to remove |

Variants for the open questions, kept in the mock only (`?plot=euro`, `?money=own`): see section 11. **Deleted from the page:** the hero card and its dot field and EU-27 figure, the three small charts (`sim-grid`), the animated timeline card with its clock, `TP_*` motion constants, Replay, and every string only they used (`tlMonth`, `tlReplay`, `tlReplayAria`, `tlHead.*`, head-label and readout-row keys from A14 section 4). Tokens used: `--color-link`, `--color-info`, `--color-flag-text`, `--color-text`, `--color-muted`, `--color-surface`, `--color-surface-quiet`, `--color-border`, `--color-border-strong`, `--color-caution-bg`, `--glass-card`, `--glass-edge`, `--radius-card`, `--radius-sm`, `--radius-pill`, `--shadow-soft`, `--target-min`, `--focus-ring`, `--focus-offset`, `--text-lead`, `--text-h2`, `--text-label`, `--text-doctor-body`. No new token and no new colour.

### 10. Checks Ren can measure

Every axis from zero and the three gridlines at `yy(0)`, `yy(.5)`, `yy(1)`; every point inverts to value / reference within 0.5 px; the plot is identical for every slider value (only the current-year line, the markers, the readout, the state line and `aria-valuetext` differ); the thumb centre equals the marker's x within 1 px at every year at 390 and 1280; the slider is 44 px high; keyboard Home, End and arrows move the year and the readout; at every year each readout value equals the file's value (the unit tests are the CTO's); no `transition`, `animation`, `requestAnimationFrame` or `setInterval` in the card's CSS and code; no horizontal overflow at 390 and 1280; readout rows at least 44 px; the band and both labels present only for the file's `plan_last`; the card's permanent label is present and sticky as today.

### 11. The mock, and open questions

`docs/design/min-4747/slider-mock.html` (`?y=<1..10>`, `?saved=1`, `?rate=`, `?plot=euro`, `?money=own`). **Every number is a placeholder:** years 1 and 2 follow the synthetic file's months 12 and 24 (money rescaled to Greece's base by 0.47: €1,915.30 against €4,074.88), year 3 is typed (8,200 patients, 3,400 matches, €560k income as Anna's plan, €121k drop, 29 diagnoses) and years 4 to 10 grow at a typed 40% a year. The yearly series is Cron's to produce, not typed in the app. Renders in `docs/design/min-4747/shots/`: `1280-year3`, `1280-year10`, `1280-year1`, `390-year3`, `390-year10`, `1280-year10-saved-wording`, `1280-year10-variant-money-own-scale`, `1280-year10-variant-euro-plot`, `1280-year3-greyscale-crop`. A reference, not code to ship: it types its strings.

1. **After plan year 3 the lines collapse, and the mock shows it.** With one growth rate for every line, patients, income and diagnoses are the same curve once each is drawn as a share of its own unit's maximum, and matches and the drop are the same curve at about 40% and 21% of it. Five lines read as two. This is what the CTO's rule produces (nothing is wrong in the drawing), and the readout carries the real numbers, but a viewer will ask why three lines lie on top of each other. The honest ways out are the CTO's call: (a) give each line its own assumed growth (then they separate for a reason); (b) draw only the euro unit on a true euro axis with tick values (`?plot=euro`), which lifts the CTO's "no unit tick values" ban for one unit, shows money and income against each other at their real ratio (the drop ends at about 21% of income) and leaves the other three as readout rows only; (c) keep five lines and accept the overlap. **My recommendation is (b), because it is the one that shows the founder's number, the money in Greece, on a line he can read.** The layout is the same for (a), (b) and (c).
2. **The money line is small beside income.** On the shared euro scale the Greek money figure ends at about 21% of income's height and gets lost under it. `?money=own` draws it on its own scale (it then climbs to the top and hides the other lines; shown, not recommended: it breaks "no per-line scaling inside one unit" and would read as larger than income). Option (b) above is the cleaner answer.
3. **The yearly figures after year 3 need an owner.** Anna's open question 1 (what grows the patients and income after the plan's third year) decides what the band says. Design needs only a rate per line, or one rate, in the file.
4. **"Saved" in the title.** The mock's default is the modelled-drop wording (Anna's M); S is rendered. The founder's own word is "saved"; the CEO seat rules.
5. **A running total is not drawn.** The founder's "in 10 years the money can be saved" can mean a total over ten years. Section 7 shows where it would go; it needs the CEO seat's yes and Anna's wording first.
6. **The 390 fit is close.** The money number, the plot and the thumb need 587 px of card plus the label bar (72 px on the page, 65 in the mock) against a 664 px screen: 652 to 659 px. It fits only with the card scrolled to its title; if Ren's measurement on the real page is over, the first thing to give is the money helper line (`gHelp.money`) at 390, which moves under the rows.
7. **Left out:** a legend (the readout is the legend), hover or tap values on the plot (the slider is the one input), a second axis, an area fill, a count-up, a dark view (the app has none), the EU-27 figure anywhere.

## A16. Addendum: one card, the loss first, Greece / Europe / Global, one share slider (MIN-4772, parent MIN-4696). Supersedes A15.

Founder, 2026-11-15 about 11:30 EET, verbatim: "nope something is not so good / We need to start by showing the money Greek health system is losing and how this is decreased as we do best matches and we decrease the wrong diagnoses", then "Can we have 3 In greece, in europe, Global?". Back's ruling (MIN-4772): one card, one plot, no animation; it opens on Greece's yearly loss; a three-way switch; one slider over the share of that geography's patients in the network, 0% to 100%; a marker for where our plan reaches by year 10 (91,205 patients, 0.9% of Greece); the loss falls while records with a match and correct diagnoses gained rise. Goal: supports directions 4 and 5 (the money a health system loses to wrong or missed diagnoses is the argument for the doctors and hospitals those two serve; synthetic model, labelled). Brand: checked against `docs/brand/brand-guidelines.md` (lean v0.1, MIN-4462) and the repo tokens; no new token, no new colour.

**What survives from A15:** the card surface, the permanent "Simulation on synthetic data. A model, not a measurement" bar, the native range input (44 px band, 32 px thumb, same focus ring), the kind tags and the pattern-is-kind rule (Model dashed, Plan dash-dot), the notes under the card, "Show the values", the number-format idea. **What dies:** the plan-year slider, the five lines, the assumed-growth band and its labels, the patients and income lines, the hatched band, the year ticks. Nothing animates: no transition, easing, timer or `requestAnimationFrame`; everything changes in the frame of the input or change event. **Reduced motion: n/a, there is no motion.**

**Verified** (mock `docs/design/min-4772/loss-card-mock.html`, headless Chrome, 390 through an iframe so the phone layout is real): no horizontal overflow at 390 and 1280 (`scrollWidth` equals the viewport); slider 44 px, switch buttons 44 px, readout rows at least 44 px; at 1280 the thumb's centre equals `x(share)` (815 against 815 at 100%); at 390 the card's top to the slider's bottom is 477 px, so the loss number, "lowered by" and the thumb share one 664 px screen (it was 817 px when the slider sat under the plot, which is why it moved, section 1). Renders: `docs/design/min-4772/shots/` `1280-` and `390-` `greece-0`, `greece-0.9pct`, `greece-100`, `europe-50`, `global-50`, plus `1280-greece-50-ceiling` (the variant). **Not verified:** a real phone and touch, keyboard in Safari and Firefox (Chrome only rendered), a screen reader on `aria-valuetext`, every number (all placeholders, section 9), contrast computed again (the colours are A15's pairs: ink on surface-quiet 14.86, flag-text on white about 6, link on white 5.47, track on white 4.38, white on link 5.47), the card on the real page. Figma: no file touched; mock and renders are the record, as A14 and A15. Not run: `design-critique` as a second reader; the side-by-side with A15 is in section 8.

### 1. The card, top to bottom

| # | Block | 1280 | 390 |
|---|---|---|---|
| 1 | Title (`--text-lead`) "The money a health system loses to wrong or missed diagnoses" (placeholder) | full width | full width |
| 2 | The switch: Greece / Europe / Global | under the title, 480 max width, left | full width |
| 3 | The loss block: "Greece loses" + the loss, large; then "Lowered by" + the amount and the percent | right column, top | first block under the switch |
| 4 | The slider: label, the share as text ("40% of Greece"), the track, the state line | under the plot, thumb aligned to the plot's x axis | **directly under the loss block, above the plot** (full width, no axis alignment) |
| 5 | The key, then the plot | left column | under the slider |
| 6 | Rows: records with a match, correct diagnoses gained, our plan | right column under the loss block | under the plot |
| 7 | Notes and "Show the values" | full width | full width |

Why the slider moves up at 390: with the slider under the plot, the loss number, the plot and the thumb needed 817 px, three screens' worth of scrolling to see one number change; above the plot it is 477. The plot still shows the current share (a vertical line and a diamond), so nothing is lost. Grid: wide two columns `minmax(0,1fr)` and 320 px, gap 24, areas `plot money` / `plot list`; narrow one column, areas `money`, `ctlbox`, `key`, `box`, `list` (the plot's three children are grid items through `display: contents`, one DOM order for both widths).

### 2. The switch

A radio group (native `<input type="radio">` with a visually hidden input and a styled `<label>`, legend "Where" visually hidden): three segments, each flex 1, 44 px high, 16 px 600 text, 1 px `--color-border-strong`, `--radius-sm` on the outer corners. Selected: `--color-link` fill, white text (5.47:1), the border the same colour. Focus: `--focus-ring` on the label of the focused input, `:focus-visible` only. Keyboard: the browser's own (Tab to the group, arrows move and select, so the card changes as it does for a click). **Changing geography keeps the slider's share** (40% of Greece becomes 40% of Europe): the viewer compares the three at one share. Default: Greece, share 0%. Greece is first because the founder said "the money Greek health system is losing".

### 3. The loss block (the headline)

`--color-surface-quiet`, 1 px `--color-border-strong`, `--radius-sm`, padding 8/16/12. Top part: the kind glyph (dashed, 30 x 14) and "{Geography} loses" (16 px, `--color-text`), the loss (600, **40 px at 1280, 36 px at 390**, tabular numerals) with "a year" (16 px, `--color-muted`) beside it, tag "Model". Under a 1 px rule: "Lowered by", the amount with a true minus ("−€201 million", 600, **32 px at 1280, 28 px at 390**), the percent in 16 px `--color-muted` ("(−9.2%)"), tag "Model". At 0% it reads "€0" with no percent. A helper line ("What Greece would lose a year if 40% of its patients were in the network") shows from 900 px only (at 390 it repeats the slider's own text). The loss is the largest number on the card; "lowered by" is the second. This is the second readout for the gentle line (section 4): the drop is 9% of the loss, so it is said in words and numbers large instead of being drawn larger.

**Number format (one formatter, Anna to confirm):** euros under €1,000 whole; under €1 million in thousands ("€121k"); from €1 million three significant figures with the unit word ("€201 million", "€1.8 million", "€2.19 billion", "€1.04 trillion"); counts under a million with separators, from a million three significant figures with the word ("4.15 million"); percentages below 10 to one decimal, whole from 10; a share below 1% to one significant figure ("0.9%", "0.02%", "0.001%"). Axis ticks use the short form ("€2.19 bn", "€93.5 bn", "€1.04 tn", "k", "m").

### 4. The plot (one SVG, built at its measured width, 1 unit = 1 CSS px)

| | 1280 (left column 726) | 390 (card 358, SVG 324) |
|---|---|---|
| Insets `L`, `R`, `T`, `B` | 64, 16, 34, 58 | 68, 16, 34, 58 |
| Plot height `H` | 320 | 200 |

`x(p) = L + p/100 * (W - L - R)`, `y(f) = T + H*(1 - f)`, `f` = the loss at share `p` divided by **the loss today** (share 0%). **The y axis runs from €0 and its top is today's loss; the line starts on the top gridline and ends at 90.8% of it (Greece, placeholder).** It is not cropped and not rescaled; at 1280 the whole drop is 29 px, at 390 it is 18 px. That is the truth of the model and the spec says so on the card (the first note, section 7). This is one unit (euros), so, unlike A15, the axis carries tick values: `€0`, half and the top, short form, 12 px, `--color-muted`, at `L - 6` (`L - 14` at 390 so the plan marker does not touch them). The CTO's one-scale-per-unit contract is met because there is exactly one unit in the plot; records with a match and correct diagnoses gained are readout rows with their own bar from zero (section 6) and are never drawn on this plot.

Layers, bottom to top: the **lowered area** (the polygon between the top gridline and the loss line, from 0% to the current share, `--color-caution-bg`; it grows with the slider); gridlines at 0, 25, 50, 75, 100% (`--color-border`); gridlines at 1 (dotted `2 3`, `--color-border-strong`, today's loss), 0.5 and 0 (the axis); ticks and "0%" to "100%" on the x axis (12 px `--color-muted`, the ends anchored inward) and the axis title "Share of Greece's patients in the network" (follows the switch); the **loss line** (a polyline through the file's points, dashed `6 4`, `--color-flag-text`, 4 px, round joins, butt caps; Model kind); the **plan marker** (below); the **current share** (a 1.5 px `--color-text` vertical line from the top gridline to the axis at `x(share)` and a diamond r 9.5 on the loss line, 2 px `--color-surface` edge). The key (above the plot, HTML, 14 px): dashed glyph "Loss a year, in the model", a swatch "Lowered by", a dash-dot glyph "Our plan, year 10" (and "Model ceiling" in the variant). No value is printed on the plot except the axis ticks and the plan marker's label; every value is in the readout.

**The plan marker.** A 2 px dash-dot (`12 4 2 4`) `--color-info` vertical line from 6 px above the top gridline to the axis, a 12 px square (Plan kind) on the axis, and the label "Our plan, year 10: 0.9%" (12 px 600 `--color-text`) in the top strip, anchored to the right of the line (to the left when it would not fit). It is drawn at the **true** share: 0.9% for Greece (6.5 px from the axis at 1280), 0.02% for Europe and 0.001% for Global, where it sits on the y axis itself (the line and square on the axis, the label starting 8 px right of it). Near zero it is deliberately not moved or enlarged: that it cannot be told from the axis is the finding. What it means in numbers is in the plan row (section 6), always visible, whatever the slider says: 91,205 patients, its share, and "At that size the loss falls by €X a year" (Greece €1.81 million, Europe €3.49 million, Global €1.08 million, placeholders).

**Optional line, the model ceiling (CEO seat rules, MIN-4771).** A 1.5 px dotted `2 3` `--color-flag-text` line from the top-left to the model's ceiling at 100% (Greece −20%, −€437 million), key entry "Model ceiling"; no value on the plot, its amount goes in the notes ("With perfect matching the model's ceiling is −€437 million"). Off by default; `?ceiling=1` renders it (`shots/1280-greece-50-ceiling.png`).

### 5. The slider

Native `<input type="range">`, `min` 0, `max` 100, `step` 1, 44 px high (the whole band is the target), 8 px track `--color-border-strong`, 32 px thumb `--color-link` with a 3 px `--color-surface` ring; no filled progress track. Label "Share of patients in the network" (16 px 600; "Share in the network" at 390) at the left, the share as text at the right ("40% of Greece", 600 16 px, tabular numerals). At 1280 the input's left margin is `L - 16` and its width `(W - L - R) + 32` so the thumb's centre is `x(share)` (Firefox's 26 px thumb needs `L - 13` and `+ 26`; Ren sets both from one constant); at 390 it is full width (it is not under the plot).

**The plan stop.** Integer steps cannot land on 0.9%. Rule: **when the plan share is 0.5% or more (Greece only), the integer stop nearest it (1) means the plan share** (0.9%), so the viewer can stand exactly on the marker; below 0.5% (Europe, Global) stop 0 stays 0 and the plan is read in its row. The thumb then sits 0.7 px from the marker at 1280, inside the 1 px tolerance. Greece's stop 1 reads "0.9%" everywhere (text, hero, rows, `aria-valuetext`).

**The state line** (a fixed 26 px so nothing moves): at 0% "Today: nobody in the network, nothing changes"; at the plan stop "The size our plan reaches by year 10"; at 100% "Every patient in the network, at today's match rate"; empty otherwise. **Keyboard and assistive technology:** arrows move one step, Home and End the ends, Page keys the browser's; `aria-valuetext` "40% of Greece's patients in the network. The loss falls by €88 million a year." on every input; the SVG is `aria-hidden`; no `aria-live`; the card's description (`aria-describedby`) is rewritten on every change and read when the card is read. Touch: the 44 px band; no drag-only action (a tap on the track moves the thumb natively).

### 6. The rows

In this order: **Records with a match**, **Correct diagnoses gained**, **Our plan, year 10**. Each: name over the kind tag at the left (16 px, tag `--color-muted`), the value at the right (`--text-h2`, tabular numerals, nowrap), then for the first two a thin 8 px bar from zero (`--color-border` track, `--color-flag-text` fill, `--radius-pill`, `aria-hidden`; the fill is the value as a fraction of **the same row's value at 100%**, so each bar has its own honest scale from zero) and the line "At 100%: 4.15 million" (14 px `--color-muted`). Minimum 44 px, a 1 px `--color-border` rule between. The plan row has the dash-dot glyph, tag "Plan", value 91,205 and one sentence (section 4). **Our income** is not on the card; if the CEO seat keeps it (MIN-4771) it is one more row under the plan row, tag "Plan", no plot line (`?income=1`).

### 7. Notes under the card (placeholders for Anna, MIN-4770), in this order

1. "The axis starts at €0 and its top is today's loss. The drop is small beside the loss, and the drawing keeps it that way." (muted; says plainly why the line is gentle)
2. The method sentence: why a wrong or missed diagnosis costs money, the 11% (OECD estimate), the geography's health spending and its source ("Greece spent €19.9 billion on health (Eurostat 2024)").
3. **Global only:** "health systems, records and prices differ widely; the same 11% and the same match effect are applied to all; read the figure as the order of magnitude, not a forecast." (Europe gets no caveat of its own beyond the method sentence unless Anna asks.)
4. The source line (muted). Then "Show the values": a table of 0 to 100% in tens, every column the readout's, its caption following the switch.

The permanent label stays sticky at the top of the page. Nothing in the notes is cut at 390.

### 8. States and the side-by-side with A15

| State | What shows |
|---|---|
| First paint | Greece, share 0%: "Greece loses €2.19 billion a year", "Lowered by €0", the line, the plan marker, nothing shaded |
| Slider at the plan stop (Greece 0.9%) | the thumb on the marker; "Lowered by −€1.81 million (−0.1%)"; the lowered area is a hairline; the state line names it |
| Slider at 100% | Greece €1.98 billion, "Lowered by −€201 million (−9.2%)", the area at full width, records 4.15 million, diagnoses 243,120, bars full |
| Europe or Global at 50% | the same card; the plan marker on the y axis; figures in billions and trillions; the Global note shows |
| Switch changes | geography words, axis ticks and title, all values and the notes change; the share stays |
| `simulation.json` missing a geography | its segment is not drawn; if none, no card (A13 section 5 rule) |
| Reduced motion | n/a, no motion |

Against A15 (one card, five lines, plan years): the loss comes first and is the biggest number; the page has one unit on its plot instead of five lines in three; the slider changes the viewer's own question (how many patients) instead of time; the 0.9% plan marker answers "how big is our plan" at the true scale. What A15 did better and was kept: the 44 px slider with its aligned thumb, the readout as the legend, the permanent label.

### 9. Placeholders, open questions

**Every number in the mock is a placeholder:** Greece uses the coordinator's figures (spend €19.87 bn, 11%, −9.2% at 100%, ceiling −20%, 91,205 patients), its patient count (10.13 million) is 91,205 / 0.9%; Europe (spend €1.7 trillion, 449 million patients) and Global (€9.5 trillion, 8.1 billion) are typed; the match rate (41%) and the diagnoses rate (2.4% of patients) are typed and linear in the share. The app reads every value from the generator output (MIN-4769) and types none; if the model's curve is not a straight line, the polyline follows the file's points (the mock draws 101).

1. **The line is gentle, by design.** Axis from €0, drop 9%: the card says so in the first note and the "lowered by" readout carries it large. A second plot with a cropped axis is the thing to refuse; if the founder wants the drop to look bigger, the only honest lever is the CEO seat's ceiling line (variant), not the axis.
2. **Plan stop and Europe or Global.** Plan share is 0.02% and 0.001% there; the marker sits on the axis and the plan row says what it is worth. Decision for the CEO seat if he wants it on the slider too: a stop below 1% (a non-linear scale or a fixed jump), which I recommend against.
3. **Model ceiling and income:** both off by default, variants rendered or specified; the CEO seat rules (MIN-4771).
4. **Kind tag on "records with a match":** A15 tagged it "Computed on synthetic records"; scaled to Europe and Global it is a model, so I tag all four values "Model". The CTO (MIN-4769) confirms.
5. **Words:** every string is a placeholder for Anna (MIN-4770), including the title, "loses", the three notes and the state lines; the world's wording ("The world loses") is hers.
6. **Share kept across the switch** is my choice; the alternative (reset to 0%) is one line.
7. **Left out:** a second chart, a cropped axis, hover or tap values on the plot, an animation, a dark view, a running total, income on the plot.

---

# B. `/doctor/simulate` (MIN-4609)

## B1. What the screen has to make felt

Each filter looks like a filter: the dots that leave fade out, the dots that stay stay at full strength, a bar and one sentence say how many remain, and the last step lands on the ringed, numbered matches. Today the stages switch in one frame (`level()` in `DotCanvas.tsx` picks 1, .45 or .1 at once) and the viewer must read the card below to know what happened.

## B2. Layout

### Desktop (1440)

Machine card, records card, matching card, matches card, as today. The records card gains one **narrowing strip** between the card's body text and the canvas:

```
 +--------------------- records card ----------------------------------------------------+
 | 2 The 5,000 records                                                                   |
 | One dot each. Country and age band only, no names.                                    |
 | [ strip: step sentence 16/24 ink (aria-hidden mirror)                    ]            |
 | [ fraction bar 4 high: track --skeleton, fill --color-link, width = bright / 5000 ]   |
 | canvas: cell 8 px, 129 cols x ~39 rows, ~336 high                                     |
 | legend, group note                                                                    |
```
Strip background `--color-surface`, no blur (a blurred sticky layer over a repainting canvas is a long-task risk), `border-bottom: 1px solid var(--color-border)`, padding 8 12.

### 390 px

| Element | Change |
|---|---|
| Canvas cell | 5 px (was 6 at width below 520). 326 px wide card inner: 60 cols x 84 rows = 444 high, so the whole canvas, the strip and the label fit one 390 x 664 viewport (72 + about 70 + 444 = 586). Dots are 3.6 px: Ren checks by eye; if they read as dust on a real phone, 6 px stays and the strip alone is kept |
| Strip | `position: sticky; top: var(--label-h)` inside the records card, so it sits under the sticky label and leaves with the card. `--label-h` is set from the label's measured height (a `ResizeObserver`, 4 lines) because the label wraps to 1 or 2 lines. Strip height about 68 (sentence 2 lines + 4 bar + padding) |
| Records card | On entering the dots phase, scroll the card's top to just under the label (B3 step 2) |
| Match cards | One column (existing); the contact steps stay inside each card |

## B3. Step table (one run; `t = 0` is the click on "Run the simulation")

`M` = the recorded machine run's real replay length (`vmOffsets`, unchanged). `R` = the moment the dot reveal finishes (`M + 700 + 1400`).

| # | Step | What moves | The one thing the viewer understands | Start | Duration | Easing | Delay / stagger | End state |
|---|---|---|---|---|---|---|---|---|
| 1 | The machine | The four state boxes change colour as the recorded run reaches them; each log line enters (opacity 0 to 1, `translateY(4px)` to 0). While "Running", the box pulses opacity 1 to .45 (existing). | A short-lived machine made the records, then went away | each recorded offset (unchanged) | colour 200 (`--dur-fast`), log line 200 | `--ease-out`; pulse `ease-in-out` 1000, only while Running | none | `Deleted` state shown; the machine label (fixed) visible throughout |
| 2 | Scroll to the records | On phase `dots` the records card top scrolls to just under the label bar. Only if the page has not been scrolled since the click, and only when not reduced. | Where to look now | `M + 700` | smooth scroll, browser default | browser | none | Card top at `--label-h + 8` |
| 3 | The 5,000 records | 5,000 dots fill in (existing reveal: count follows `1 - (1 - p)^2`) | There are 5,000 records, one dot each | `M + 700` | 1,400 | quadratic ease-out (existing) | none | All dots at full strength. Ends at `R` (tolerance ±100) |
| 4 | The patient's features | Step row 1 lights (opacity .35 to 1, left border to `--color-link`); the strip appears (opacity 0 to 1) with that sentence, bar at 100% | These coded features are what is compared | `R + 400` | 400 (`--dur-step`) | `--ease-out` | none | Canvas unchanged |
| 5 | Opt-in | Dots of records that did not opt in fade alpha 1 to .10. Bar width 100% to `opted_in / n`. Strip sentence swaps (old fades out 100 ms, new fades in 100 ms). Step row 2 lights. | Only people who agreed are compared | `R + 1,900` | 600 (`--dur-fade`) | `--ease-inout` | none | Opted-in dots at 1, the others at .10 |
| 6 | At least 4 shared codes | Dots not in `shareRows` fade to .10. Bar to `share_min / n`. Sentence swap. Row 3 lights. | How many share 4 or more codes | `R + 3,400` | 600 | `--ease-inout` | none | Share dots at 1, others .10 |
| 7 | Exact-set group | Dots in `shareRows` but not in the group fade 1 to .45; the rest stay at 1 (the group, or where the search stopped). Bar to `exact / n`. Sentence swap. Row 4 lights. | Only the largest group with exactly the same codes remains | `R + 4,900` | 600 | `--ease-inout` | none | Group dots 1, share dots .45, others .10 |
| 8 | k = 5 | Row 5 lights with the k sentence (`kShown` or `kHidden`). Dots do not change. | The group is large enough to show, or it is not and nothing is shown | `R + 6,400` | 400 | `--ease-out` | none | Same dots |
| 9 | The matches | A ring (radius 9, 2.5 px `--ink`) and its number appear on each matched record: ring scale .4 to 1 and opacity 0 to 1. The number fades in with its ring. If there are none (`COPY.empty`), nothing is drawn. | These are the matched records, and how many | `R + 6,800` | 300 (`SM_RING_MS`) | `--ease-out` | stagger `min(120, 600 / count)` ms | All rings and numbers visible. Ends by `R + 6,800 + 300 + 600` at the latest |
| 10 | The matches card | The match count line (`sm-big`) enters (opacity 0 to 1, `translateY(8px)` to 0), then the shared-pattern chips, then each match card. | The count in words, and what the matches share | `R + 7,300` | 400 (`--dur-step`) | `--ease-out` | chips 40 ms stagger; cards 80 ms stagger, 4 cards at most counted (later cards enter with the fourth) | Held. Phase `done`. The contact label (fixed) visible from the card's first frame |

Step interval is `SM_STAGE_MS = 1,500` (was 900); each narrowing has 600 ms of motion and 900 ms to read the sentence. Total from `R` to the held outcome: 7,700 ms.

After `done`, the contact steps on each match card keep their existing four 900 ms steps; each step row lights with `--dur-step` and `--ease-out` instead of an instant swap.

**Canvas implementation limits (hard):** one canvas, no DOM per dot, no per-dot shadow or blur. Draw only while a transition runs (a `requestAnimationFrame` loop that stops at rest; no idle loop). Group the draw by (colour group, from-level, to-level): at most 14 x 9 = 126 fills per frame, alpha computed per bucket as `lerp(ALPHA[from], ALPHA[to], easeInOut(p))`. Acceptance: no long task over 50 ms during any stage transition at 390 and at 1440.

## B4. The outcome frame (from `R + 7,700`)

| Element | Where | Size, token | Contrast |
|---|---|---|---|
| Page label `pageLabel` | Sticky bar | white 16/24 600 on `--color-info` | 12.30 |
| Machine label | Machine card | existing | existing |
| Matching label `matchingLabel` | Matching card | existing | existing |
| Strip sentence (final: k sentence) | Records card strip | 16/24 ink, solid white | 16.77 |
| Fraction bar | Under the strip | 4 high; fill `--color-link`, track `--skeleton` | fill on track 4.36 (graphic, 3 needed); fill on white 5.47 |
| Rings and numbers | Canvas | `--ink` 2.5 px ring, 600 12px numbers | ink on `--color-surface` 16.77 |
| Match count line | Matches card | `--text-h2` 24/29 (`sm-big`) | ink on card glass 15.58 |
| Contact label `contactLabel` | Matches card | existing, static | existing |

Bar width at the end is the true `exact / n`, with a 4 px minimum so a tiny group stays visible (the only place a drawn size differs from the data, and the sentence carries the exact number).

## B5. Reduced motion

Run click: the machine card jumps to its last state (as today); the dots are all drawn at once; the strip shows the final sentence and the bar at its final width; rings and numbers drawn; rows 1 to 5 lit; the matches card present; no scroll, no fade, no pulse. Contact steps on each card jump to the final step (as today).

## B6. States

| State | What is on screen |
|---|---|
| Idle | Label, title, intro, the Run button. No strip |
| Playing | B3 steps |
| Done | B4 |
| Reduced motion | B5 |
| No matches (k not reached) | Rows through 4, the `kHidden` sentence on row 5 and in the strip, no rings, `COPY.empty` in the matches card, bar at its last width. Same timings up to step 8; steps 9 and 10 become the card entering with `COPY.empty` |
| Run data cannot be read (`parseRun` throws) | Label, title, one glass card with a one-line error and no Run button. Needs a string from Anna (`runError`, MIN-4604). Not built today |

## B7. Data fields

None new. Every number is already in the matcher's return (`funnel.opted_in`, `share_min`, `exact`, `match_count`, `shareRows`, `matched`).

## B8. Words I need from Anna

None for the motion. One for the error state if Product keeps it in scope: `runError`.

## B9. React Bits

**Zero.** The canvas does the dot work; the strip, bar and entries are CSS. A React Bits component would put DOM or WebGL per dot, which the story forbids.

## B10. Left out, and why

- Dot hover or tap, tooltips: out of scope (MIN-4594).
- Recolouring dots by group state (the 14 group colours stay as they are; they are look only).
- A looping idle animation, a progress ring, sound, confetti.
- A replay of single stages or a stage scrubber.
- Any change to the machine card's states beyond timing, or to the contact cards' content.

---

# C. Hand-off summary

- Ren, MIN-4608: sections 0, 1, A. Ren, MIN-4609: sections 0, 1, B. Paste the step tables on the build issues; each row is a test.
- Cron, MIN-4607: A8.
- Ren, MIN-4702: A13 (the timeline diagram, MIN-4700) with `docs/design/min-4700/timeline-mock.html`; Cron, MIN-4701: A13 sections 5 and 7 for what the data must hold.
- CTO, MIN-4610: no React Bits dependency; one new type token, two new motion tokens, one new data block; the new data is additive.
- Anna, MIN-4604: A9 and B8.
- Cut order inside this spec (matches Product's cut line): B whole screen first; then A's quality bar; then steps 6 and 7 (landing baselines and edge); the euro figure last.
