# Live doctor dashboard: hand-off spec (MIN-4661 → MIN-4664, MIN-4665)

Pix Elidis, 2026-11-15. Parent story: MIN-4659 (directions 4 and 5). Brand: `docs/brand/brand-guidelines.md` section 11. Tokens: `docs/brand/tokens.css` section 6. The glass system it sits on: `docs/design/ios-glass-handoff.md`. Format precedent: MIN-4586.

| What | Where |
|---|---|
| Working picture of every rule below (`?screen=<id>`; add `&phone=1` inside a 390 wide iframe) | `docs/design/min-4659/mockups.html` |
| The new rules as CSS, on the app's own class names; imports the shipped `docs/design/min-4585/reference.css` | `docs/design/min-4659/dashboard.css` |
| Renders: 1280 and 390 | `docs/design/min-4659/shots/*.webp` (list in section 10) |
| Figma page "Doctor dashboard (MIN-4659)" | https://www.figma.com/design/5jgmJHOs9AWAEjv4R3xN5I (the renders, placed as images; the HTML is the source) |

Screen ids in `mockups.html`: `overview`, `chart-states`, `matches-states`, `diagnoses`, `diagnoses-states`, `ask`.

**All data in the mockups is synthetic and made up: it does not count toward the goal.** The patient header is the live one ("The patient, 54", "Shared with you for 15 minutes"): no new field (MIN-4659 scope).

`dashboard.css` is a picture of the spec, not app code. Port the rules into `src/features/assistant/assistant.css` and `src/features/matches/matches.css`; do not import it.

**What does not change.** Every route, every `data-testid` that exists today (kept, and the new ones in this file follow the same pattern), the source viewer (`SourceViewer`, solid white side sheet from 900, bottom sheet under), the ask panel, the citation chip, the provenance marks, every existing sentence. New sentences are listed in section 9; they are proposals, Anna owns them.

## 1. Layout

| Width | Shape |
|---|---|
| 1280 and 1440 (from 900) | Page max 1360, side padding 32. Grid `244px | 1fr`, gap 24. Left nav, then the main column. Timer bar on top (the shipped one, unchanged), then the h1 and the line under it, then the grid |
| Under 900 (390 is the one I checked) | One column, the existing stack. No nav column: the same three links become three cells in one card under the title, 64 high, icon over a 14/600 label that may wrap to two lines ("Possible / diagnoses"). Nothing is lost: every view is one tap away |

- **Nav** (`.dnav`): card glass (no blur), radius 32, padding 12, sticky at `top: 88px` (under the 4px timer bar plus its row). Three links, 48 high, pill, icon 22 (Phosphor bold: `ChartLineUp`, `Stethoscope`, `ChatCircleText`), label 16/600. Active: mint capsule, ink (the tab bar's active state), `aria-current="page"`. Hover: white. It is `<nav aria-label="Doctor workspace">`.
- **One blurred surface** on a screen (the timer). The nav and every card are card glass or solid white. Diagnoses cards, the ask thread and the exams list inside the shell follow the glass rules: long reading is solid white.
- The three views are one route with a view state (Overview is the default). Ren decides routing. The access timer, the source viewer and the grant stay mounted across views, so switching views never reloads the record.
- The grid breakpoint is 900, as in the shipped workspace. The chart grid is 2 columns from 900 (at 1280 each card is 466 wide, at 1440 about 506) and 1 under it. I tried three columns: a 313 px card leaves a 270 px plot, which is too narrow to read dates.

## 2. Overview, top to bottom

1. **Over time** (section 3): the key, the chart cards, "Show all N values", the counts footer.
2. **Flags** (section 4).
3. **Possible matches** (section 5).
4. **Exams** (section 6).
5. **Below the list, unchanged from today:** the existing Outside the printed range list, Conditions written in the documents, Timeline (the diary entries stay here, MIN-4659) and About this file. Same panels, same words. The only work is moving them under the list. Mockup shows them as one dashed note.

This is the prototype's order (charts, flags, matches, exams) drawn in the glass system, with the live "Over time" calculation behind it.

## 3. Chart card (one per value with a series)

Source: `healthapp-over-time` response, one `OverTimeSeries` per card. The card count equals `counts.values_with_series` once "Show all" is open. Nothing is drawn from a file.

**Order and how many.** Out-of-range first (latest out-of-range date, newest first), then the rest by analyte name. This is an order of data presence, not of likelihood; it is never labelled as a ranking. **Six cards show** (three rows of two at 1280). Under the grid, a line "Showing 6 of 11 values with two or more dated results." above it, and a ghost button "Show all 11 values" (becomes "Show fewer"). When N is 6 or fewer neither appears. The existing counts footer stays under the grid ("Records read 53, values with a series 11, ...").

**Anatomy (top to bottom, `.cc`).** Card glass, radius 32, padding 16 20 20, gap 8.
1. Header: analyte name `h3` 20/600; right: the latest value 20/600 tabular and the unit 16/500 muted.
2. Sub line, 16/500 muted: "5 results, 20 Jan 2026 to 30 Oct 2026".
3. Flag chip "Outside the printed range" (coral dot, coral-900 words) **only when the latest result is outside**.
4. The plot (below).
5. Range line, 16/500 muted: "Printed range on the latest result: 0 to 5." or "No printed range on these documents."
6. The existing out-of-range sentence (`outOfRangeLine`), 16/500 ink.
7. The projection block (below) or "Not enough results for a projection" (`NOT_ENOUGH`).
8. A disclosure "Results as a table" (44 high, teal-600 label 14/600): the existing table (Date, Result, Printed range, Source chip). It is the text alternative of the chart; the svg has `role="img"` and an `aria-label` that says so (the shipped wording).

**The plot.** Computed by the existing `buildChart(series, w, h)` with **w = the card's inner width** (measure it; do not scale a fixed viewBox: scaling shrinks the tap targets) and h = 176. Left gutter 38 for y ticks, right 10, top 10, bottom 26.

| Element | Spec |
|---|---|
| Axis ticks | 3 y ticks at nice values (the min, the middle and the max of a rounded range: 0 / 20 / 40, not 0 / 23 / 46), 12/500 ink-soft, hairline grid `--color-border`. x: the first and the last result date, 12/500 ink-soft |
| Printed range band | Rect from limit to limit across the plot, fill `--color-surface-quiet` (mist), **plus a 1px line at each printed limit in `--color-border-strong` (#6B7C7A, 4.38 on white)**. The band alone is 1.1:1 against white, so the two edge lines are what makes it a graphic. Only one limit printed ("below 5"): the band runs from 0 to it. The band is the range on the **latest** result; where earlier documents print a different range, the existing key sentence says so |
| Line | 2px, `--color-link` (teal-600, 5.47 on white), round joins |
| Point, within the range or none printed | Filled circle r 5, teal-600, 1.5px white ring (4.85 on the mist band) |
| Point outside its own printed range | **Diamond 11 px, filled coral-900 (#9A3F2B, 6.73 on white, 5.96 on mist)**, 1.5px white ring. Shape, the flag word and the table carry the meaning; colour never does. No red anywhere |
| Dashed projection | From the last result to `horizon_date`, 2px teal-600, dash 6 5, ends in an open circle r 4.5 (white fill, teal-600 stroke). Drawn only when `projection` is not null (3 or more results on 3 or more dates) |
| Hit target | Every result has an invisible circle r 22 (44 x 44) with `tabindex="0"` and `role="button"`, `aria-label` "<analyte> <value> <unit>, <date>. Open source". Enter, Space or a click opens the source through the same `onOpenCite(cite)` the table chip uses. Hover and focus: the point gets a 2px ink ring; focus adds the 3px teal-600 `:focus-visible` ring, offset 3 |
| Popover (optional, state A in `chart-states`) | On hover or focus, a solid white radius-16 card with the value, date, flag chip, printed range and an "Open source" button (44 high). Not needed to meet the story: a click already opens the source. Cut it first if time is short |

**The projection block** (`.cc-proj`): a 36 x 8 dashed swatch, then the CTO's permanent label **verbatim** from `projectionLabel(n, first, last)`: "Straight line through 5 results, 20 Jan 2026 to 30 Oct 2026. Arithmetic, not a prediction and not a diagnosis.", then "The line ends at 21.28 mg/L on 28 Apr 2027." 16/500 muted. It is in the DOM and visible in every state that draws the dashed line (MIN-4548 section 2). No direction word, no score, no colour for better or worse.

**The key** (`.legend`), once above the grid, not per card: circle "Within the printed range, or none printed", diamond "Outside the printed range", band "The range printed on the latest result", dashed "Straight line". Labels 14/600 ink.

**States (all in `chart-states` or the overview).**

| State | What |
|---|---|
| Band present, points outside, projection | CRP, ESR (overview) |
| Only the high limit printed | CRP, ESR: band from 0 to the limit |
| Line shortened at 0 | Ferritin: the contract shortens the horizon where the line would cross 0; the card shows the shortened end |
| Two results | Haemoglobin: no dashed line, "Not enough results for a projection" |
| No printed range | Vitamin D: no band, no edge lines, circles only, "No printed range on these documents.", the line may still project |
| All within range | Glucose: no flag chip, "Never outside the printed range." |
| More cards than fit | "Show all N values" |
| A point's tap target | State A in `chart-states` |
| Loading / error / empty (the panel) | The existing `OverTimeView` states, unchanged words: spinner "Loading the results over time"; "The results over time could not be loaded." with "Try again"; "No value in this record has two or more dated results, so there is no series to show." in the empty card |

## 4. Flags row

`<ul class="flags">` under "Flags" (h2). Chips that name data and nothing else, computed in code from the same series (no model):

- One chip per value with `out_of_range.count > 0`: **flag chip** (coral 12% pill, 8px coral dot, words coral-900 14/600, 5.67 on card glass), the words "<Analyte> outside the printed range in <count> of <points> results". Order as the cards.
- Info chips (mist pill, teal-night words, an Info icon) for data facts: "<Analyte>: no printed range on these documents", and where it applies "<Analyte>: the printed range differs between documents".
- No chip names a condition, a direction ("rising"), a severity or a "watch". The prototype's "Watch:" chips are dropped for that reason.
- More than eight chips: the first eight, then a chip button "N more" that expands the row. Row wraps; no horizontal scroll.

## 5. Possible matches

The live `MatchesView` and its words stay; "run the matching" is the new part. **What "run" calls is MIN-4660 (the CTO).** The design only needs: one call, a result in under 3 s, and the permanent label in every state.

| State (`data-state`) | What shows |
|---|---|
| `idle` (before the run) | Title, the label, one line, the mint button "Run the matching" (52 high, Users icon) |
| `running` | The label, the spinner "Looking for similar patterns" (existing), the button disabled with `aria-busy="true"`. No percentage, no estimate |
| `populated` (result) | The label, one total line "14 seeded synthetic records in 2 groups share a pattern with this record.", then the existing group blocks (count line, Shared pattern chips, Countries chips) on mist, then the existing helper sentence and a small ghost "Run again" |
| `empty` | The label, the existing empty card "No matches in the seeded data.", the helper, "Run again" |
| `not opted in` | The label, a mist info note "This patient has not turned on matching. Nothing was compared." **Open point for the CTO:** the shipped server returns the same empty answer for not opted in, no match and fewer than 5, and the screen has no way to tell them apart (copy.ts: "identical for"). The MIN-4659 acceptance asks for a separate "not opted in" state. If the answer stays identical, this state collapses into `empty` and the acceptance line changes. I drew it so it is ready, not so it is promised |
| `error` | The label, a white note with the 1.5px coral-900 edge and icon, "Could not look for matches just now.", "Try again" (existing) |

- **"Seeded synthetic data. Not real patients."** is in the DOM and visible in all six (`data-testid="matches-label"`, the mist strip with the Flask icon). When the pool grows to 5,000 the label does not change.
- Never "anonymous"; the existing rules of `copy.ts` stand.
- Under 900 the groups stack; the pattern chips wrap.

## 6. Exams list

`<ul class="exams">` under "Exams" (h2) with "5 confirmed exams, newest first. A row opens its source." Card glass radius 32, rows min 72 with a hairline. A row is one link (the whole row, 44 or more): title 20/600 and the exam date 16/500 muted; below, the provenance marks (`ProvenanceMark`, unchanged), the value count, and the existing `oor-count` chip when the exam has values outside the range; a teal-600 CaretRight 22 at the end. It opens the source viewer on that exam. Newest first by exam date. The row text is whatever the record gives today; the sentences in the mockup are placeholders, the app's own stay.

## 7. Related diagnoses view (MIN-4665)

**Page.** The h2 "Related diagnoses", then **the fixed banner**, then the cards. The banner is rendered in every state and cannot be closed.

- **Banner** (`.dx-banner`): peach fill (`--color-caution-bg`), 1px coral-900 edge, ink 16/600, an Info icon. Default words are the prototype's: "For the doctor to evaluate. Not a diagnosis. Based on this patient's symptoms and exams only. Listed in alphabetical order; no ranking." (PRD 13.4's heading is the alternative; Anna decides if the CTO asks.) It is the surface's own tone: peach, not mist, so it is never read as part of the data.
- **Card** (`.dx-card`): **solid white** (long reading), radius 24, padding 24 20, `--shadow-soft`, a 1px ink 8% edge. Title 24/600 (the possibility). Rows, each a 14/600 muted label over 16/400 ink text: **Fits**, **Does not fully explain** (omitted when empty), **Not in this record** (omitted when empty), then **Based on** with one source chip per citation (white, 1px teal-600 edge, teal-600 14/600, "Blood test · 30 Oct 2026", hit area 48 x 48 as the shipped chip). A chip opens the record in the source viewer. **A card with no citation is never rendered.**
- **Order and look.** Alphabetical, as the server returns it; the banner says so. No number, no percentage, no rank, no "most likely", no icon per card, no colour difference between cards, no severity. All cards have the same weight and the same white. The grid is two columns from 900, one under it; do not size a card by its content to hint at importance (equal heights per row are fine).

| State | What |
|---|---|
| Before the request | A card glass block: h2 "Related diagnoses are made only when you ask", one sentence, the mint button "Show related diagnoses". Nothing is generated on open |
| Generating | The spinner "Reading the record" (the ask panel's words) above two skeleton cards (`--color-skeleton` bars, `aria-hidden`, never real data). Button gone |
| The cards | As above |
| Nothing to list | The dashed empty card: "No possibility could be listed from this record." |
| Error | White note, 1.5px coral-900 edge and icon, `role="alert"`, "Could not list related diagnoses just now.", "Try again" |

Fields the card needs from the function (MIN-4662 and the CTO's decision on MIN-4660 decide the shape): title, `fits` text, `does_not_fully_explain` text or null, `not_in_record` text or null, `cites[]` (at least one, resolved by the same `RecordIndex.resolve`). If the CTO changes a field name or adds a guard state, the layout does not move: a row is a label over text, and a new row follows the same pattern.

Doctor only: this view is in the lazy assistant chunk; no patient screen imports it (PRD N1, C2).

## 8. Ask the assistant

Placement only. The shipped `AskPanel` (info strip, field and Ask, quick questions, thread with numbered chips, the dashed general-knowledge box, "Not in this record.") goes in the main column, in a **solid white** card (long reading). Two optional changes, cheap, cut first:

- **Sources used** (the prototype's right panel, 280 wide, from 900): a list of the records the thread cited so far, each a link that opens the source viewer; derived from the answers' `cites` with `index.resolve`. No new data. Under 900 it drops below the thread. If it costs more than 15 minutes, skip it.
- The source viewer keeps its place: from 900 the right side sheet under the timer, solid white.

## 9. Tokens, new sentences, what to port

**New tokens: none.** One new use of an existing token: coral-900 as a **fill** (the out-of-range diamond), because coral itself is 2.5:1 on white and fails the 3:1 a graphic needs. The brand page lists coral-900 as text on light; this is its first fill use, measured at 6.73 on white and 5.96 on mist. If the brand owner objects, the fallback is an ink diamond (16.77): shape still carries it.

**New classes** (all in `dashboard.css`): `.dash-shell`, `.dash-main`, `.dnav`, `.legend`, `.cc-*` (card, head, latest, sub, plot, proj, out, table), `.show-all`, `.footer-counts`, `.cc-pop`, `.flags`, `.flag-info`, `.mx-run`, `.mx-total`, `.mx-foot`, `.exams`, `.exam*`, `.also`, `.dx-*`, `.src-chip`, `.skel`, `.ask-grid`, `.src-panel`, `.flagword`. Everything else is a shipped class from `reference.css`.

**New sentences, proposals for Anna** (through Back; MIN-4663 opens only if the CTO asks for new copy): "Run the matching", "Run again", "Compare the pattern in this record with the seeded records.", "14 seeded synthetic records in 2 groups share a pattern with this record.", "This patient has not turned on matching. Nothing was compared.", "Show all 11 values", "Show fewer", "Showing 6 of 11 values with two or more dated results.", "Results as a table", "Flags", "Exams", "5 confirmed exams, newest first. A row opens its source.", the flag chip words in section 4, "Related diagnoses are made only when you ask", "Show related diagnoses", "No possibility could be listed from this record.", "Could not list related diagnoses just now.", "Sources used", the key labels in section 3. The matches, ask and projection sentences that already exist are reused word for word.

**Not for Ren to decide:** what "run the matching" calls, how Related diagnoses is generated, guarded or worded (MIN-4660).

## 10. Checked, not checked, skipped

Renders (2x not made; 1x, headless Chrome 1280 x full height; the 390 ones in a 390 wide iframe because headless Chrome will not lay out under about 500): `shots/01-overview-1280`, `02-chart-states-1280`, `03-matches-states-1280`, `04-related-diagnoses-1280`, `05-diagnoses-states-1280`, `06-ask-1280`, `07-overview-390`, `08-diagnoses-390`, `09-ask-390`, `10-matches-states-390` (all `.webp`).

**Checked** (in text first, from computed styles and measurements in the rendered mockups, then by eye on the renders): no horizontal overflow at 1280 or 390 on overview, diagnoses, ask and matches-states; no interactive element under 44 x 44 except the citation and source chips (28 high to the eye, 48 x 48 to the finger, as shipped); no text under 14, and under 16 only the label style (chips, marks, kickers, the key, tab-style labels) and chart ticks at 12; one blurred surface per screen (the timer); the contrast pairs listed in section 3 against the brand page's measured table; no red anywhere; no number, rank or colour on a possibility card; the label "Seeded synthetic data. Not real patients." in six of six matches states.

**Not checked:** the real components (these are mockups, not the built app); hover and focus by eye on every point (drawn once: state A); touch behaviour of the chart on a real phone (the 44 px hit circles are geometry, not a touch test); the 1440 render (the same rules, a wider card: the chart is computed from the measured width); the chart with 11 real series or with a very long analyte name (a long name wraps in the header; check once with a real record); dark mode (not defined); the real prefers-reduced-transparency query (the toggle `?rt=1` of the 4586 mockups works here too); Manrope's tabular figures in the `@fontsource` build (open point from MIN-4586).

**Skipped (lean):** a popover is optional; "Sources used" is optional; no animation beyond the shipped 0.2 s colour and 1px lift (a card needs none); no new phone design (the three-cell strip is the only addition, and it is the minimum that keeps Related diagnoses reachable); "Suggested next exams", the contact flow and new header fields are out of scope (Back).

## 11. Ask me when

- A number on a card, a chip or a sentence does not fit with real data (a long analyte name, 20 flags, a unit like "x10^9/L").
- The CTO's comment on MIN-4660 changes a field of the card or of the matches result: I adjust in a short second run.
- Any pair measures under AA in the built app: send me the two computed colours.
