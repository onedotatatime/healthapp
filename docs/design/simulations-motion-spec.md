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
- CTO, MIN-4610: no React Bits dependency; one new type token, two new motion tokens, one new data block; the new data is additive.
- Anna, MIN-4604: A9 and B8.
- Cut order inside this spec (matches Product's cut line): B whole screen first; then A's quality bar; then steps 6 and 7 (landing baselines and edge); the euro figure last.
