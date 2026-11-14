# Direction C · "The Briefing"

Read `guidelines.md` first (tokens, data-viz, motion, shared sample data section 6, exercise template section 7). This page only says what C adds or overrides.

**Concept in one line:** a plain-language status briefing you scroll like a story, one question per section ("Will we make it?", "Where are we?", "What does it cost?"), with a big verdict first, built phone-first so the founder can read it in bed, in a taxi or on stage.

**Who it is for:** the founder checking from his phone, and anyone he forwards it to. Strength: the clearest answer in the shortest time, readable without training, best on 390 px. Weakness: least dense; on a big screen you scroll a little more than in A.

References that shaped it: R17 (On track / Some risk / Concerned verdict), R12 (tinted status tiles), R4 (one big numeral per card), R15 and R18 (step-by-step milestones), R22 (circular countdown, optional ring), R21 (plain-units time remaining), R23 and R24 (human activity lines), R29 and R27 (reading page), R33 (swipeable slide rail), R35 and R36 (live link with copy).

---

## Token overrides vs guidelines

| Token | Override | Why |
|---|---|---|
| Default theme | **Light**, with automatic dark from the system | phone use in all lights |
| Body | `--t-body` 16 / 26 (not 14 / 22) | comfortable reading on a phone |
| `--t-stat` | 36 / 40; `--t-display` 48 / 52 | one big number per card |
| `--t-hero` | 64 / 68 desktop, 44 / 48 at 390 px | the verdict banner carries the countdown |
| Radius | `--r-2` 16 px for cards, `--r-3` 24 px for the verdict banner | friendly, phone-native |
| Card padding | `--s-5` (24 px), gap `--s-4` | airy, one idea per card |
| Card backgrounds | **tinted by meaning**: verdict and risk cards use `--ok-tint` / `--warn-tint` / `--bad-tint`; stat cards use `--surface`; the current milestone uses `--brand-tint` | tint carries the state before any text is read; text and glyph still carry it for colour-blind readers |
| Layout width | content column max 720 px; on desktop a 2-column grid up to 1120 px | readable lines |
| Touch targets | 48 px tall | thumb use |
| Labels | sentence case in plain words, not uppercase micro-labels | the briefing reads as sentences |

---

## (a) Overview dashboard: the Briefing

One scrolling page. Phone (390) is the primary layout; desktop uses a left chapter nav plus a 2-column grid.

```
PHONE 390                                      DESKTOP 1440
+---------------------------+                  +------+---------------------------------------+
| Health app    SAMPLE DATA |                  |Briefing  1 Will we make it?  | countdown ring |
|                           |                  |Exercises 2 Where are we?     +----------------+
| ┌───────────────────────┐ |                  |Decks     3 What is done?     | milestones ... |
| │ ▲ AT RISK  (amber)    │ |                  |Demo      4 Who is doing what?| two columns of |
| │ We can still make it, │ |                  |          5 What does it cost?| cards up to    |
| │ but 2 things need     │ |                  |          6 What could go     | 1120 px        |
| │ attention.            │ |                  |            wrong?            |                |
| │                       │ |                  |  (chapter nav = scrollspy)   |                |
| │   26h 30m 12s  [LIVE] │ |                  +------+---------------------------------------+
| │   to the deadline     │ |
| │   Sun 15 Nov, 18:00   │ |   1  WILL WE MAKE IT?
| │ (ring ◯ optional)     │ |      verdict banner (above) + "Submit by Sun 17:00" + next gate
| └───────────────────────┘ |
|                           |   2  WHERE ARE WE?
| 2  Where are we?          |      vertical stepper M1..M7, current open
|  ◉ M1 Setup + dashboard   |        ◉ M1  Sat 15:00-18:00   4 of 9   ▕████░░░░░▏ NOW
|    Sat 15:00-18:00        |           gate: both roles can log in
|    4 of 9 issues ▕███░▏   |        ○ M2  Sat 18:00-22:00   0 of 8   (collapsed)
|    gate: both log in      |        ○ M3 ... M7
|  ○ M2  ... (tap to open)  |      overall 8% · 4 of 50 issues
|  ○ M3 ... ○ M7            |
|                           |   3  WHAT IS DONE?
| 3  What is done?          |      three tinted tiles: Done 4 · In progress 3 · Open 38
|  [Done 4][In prog 3]      |      callout: "3 blocked" (red tint) · "2 in review"
|  [Open 38]  3 blocked ■   |      by role: horizontal list of 9 thin bars
|                           |
| 4  Who is doing what?     |   4  WHO IS DOING WHAT?
|  ● Pix  MIN-4446 · 1m ago |      agent cards (grid 2 x n on desktop, 1 x n on phone)
|  ● Back MIN-4445 · 3m     |
|  ○ Ren  waits · 12m       |   5  WHAT DOES IT COST?
|                           |      two stat cards: Estimated cost EUR 41.80 · Credits left (worst)
| 5  What does it cost?     |      token list by agent with meters + chat list (coordinator amber)
|  EUR 41.80 est. [SAMPLE]  |
|  Credits: Gemini 262/300  |   6  WHAT COULD GO WRONG?
|  tokens by agent ▾        |      risk cards in plain sentences, each with "what to do"
|                           |
| 6  What could go wrong?   |
|  ▲ Chat near its limit    |
|  ▲ M1 gate may slip       |
|                           |
| [Briefing][Pages][Decks][Demo]   <- bottom tab bar (phone only)
+---------------------------+
```

Rules for each section:

1. **Will we make it? (verdict banner).** A `--r-3` banner tinted by the derived verdict (amber in the sample): a RAG glyph and word (`▲ At risk`), one sentence ("We can still make it, but 2 things need attention.") generated from the flag count, the countdown in `--t-hero` mono with unit words under it (`26 hours 30 minutes 12 seconds to the deadline, Sun 15 Nov 18:00`, R21 style), the `LIVE · clock` chip, and `Submit by 17:00 · freeze 13:00` as two small facts. Optional **ring**: a 160 px circular progress of the total window (R22) behind the digits on desktop, hidden on phone. A `Copy status as text` button builds a 6-line plain-text summary (verdict, countdown, milestone, tasks, cost, top flag) and copies it; this is the "forward it" action.
2. **Where are we? (stepper).** M1 to M7 as a vertical stepper (R15, R18). The current milestone is expanded in a `--brand-tint` card with name, window, `done of total` meter and the gate sentence; others are collapsed single lines (`M2 · Sat 18:00 to 22:00 · 0 of 8`) that open on tap (accordion, one open at a time besides the current). A past milestone not 100% shows `▲`. Overall percentage and `4 of 50 issues` under the stepper.
3. **What is done? (tasks).** Three big tiles (R12): Done, In progress, Open, each a `--t-stat` number with a one-word label, tinted `--ok-tint`, `--brand-tint`, `--surface-2`. Under them, two callouts: `2 in review` and `3 blocked` (blocked is a `--bad-tint` card with `■` and a link-looking `See which` that expands a 3-line list in the draft). Then by-role thin bars (9 roles).
4. **Who is doing what? (agents).** One card per agent (R23, R24): initials avatar 40 px, name and role, a status line in words (`Working on MIN-4446, Dashboard guidelines`, or `Waiting: needs Design first`), the last-activity time (`1 minute ago`), the active ring on the dot while working. Active agents first.
5. **What does it cost? (money and tokens).** Two stat cards side by side (stacked on phone): `Estimated cost EUR 41.80` with a step sparkline, and `Credits left`, showing the **tightest** credit as `Gemini 262 of 300 left` plus `All credits` expanding to the 4 meters. Below: `Tokens by agent` as a ranked list with meters and soft/hard ticks (top 5, `Show all 10`), and `Tokens by chat` (the coordinator chat in amber with the words `Near its limit`). Source chips on each card.
6. **What could go wrong? (risks).** Each flag is a card in plain words with a tint and a suggested action: `▲ The coordinator chat is near its limit (338k of 350k). Start a new chat after this task.` and `▲ Milestone 1 may slip: 2 setup issues are open and 2.5 hours remain.` If there are no flags the card says `Nothing is flagged right now ●` in green.
7. **Sticky mini bar.** When the verdict banner scrolls out, a 48 px bar sticks to the top: verdict glyph, countdown (`26:30:12`) and the current milestone id (`M1`). The browser tab title mirrors the countdown.

Below the briefing sections, a short `More pages` row (3 big tiles: Exercises 7, Decks 2, Demo 1) repeats the navigation so no page is more than one scroll from the top.

## (b) Business-exercise pages, same template

Navigation: `Exercises` tab. First screen: **chapter covers** in a horizontally snapping carousel on phone and a 4+3 grid on desktop: each cover is a card with the chapter number in large type (`01`), the title, the room's one-line recommendation and a read-time estimate (words / 200 wpm). Tapping a cover opens the page.

```
PHONE 390 reading page                           DESKTOP reading page
+---------------------------+                    +--------------------------------------------+
| ‹ Exercises    1 of 7  ⋯  |                    | ‹ Exercises   ▕ reading progress bar ▏ 1/7  |
| ▕█████░░░░░░░░░░░▏ read % |                    |-------------+------------------------------|
| WORKSHOP 6  [Recommended, |                    | CONTENTS    |  Workshop 6 · [status chip]  |
|  not decided]             |                    |  ▌1 ...     |  Market fit scorecard         |
| Market fit scorecard      |                    |   2 ...     |  facilitator · date · ticket  |
| Pix · MIN-4441 · 14 Nov   |                    |   3 ...     |  room's line (24/32)          |
| ┌───────────────────────┐ |                    |             |  figure slot: 28 / 100        |
| │ 28 / 100 (figure)     │ |                    |  Prev 05    |  1. ... body, 72ch            |
| └───────────────────────┘ |                    |  Next ─     |  decisions panel (amber)      |
| "28 of 100, before fit…"  |                    |             |  footer: source path · issue  |
| Contents ▾ (select)       |                    +-------------+------------------------------+
| 1. One scale ...          |
| ...                       |
| ‹ Prev 05        Next ─ › |
+---------------------------+
```

- The page body is the template in guidelines section 7. What is specific to C: a **reading-progress bar** under the top bar (percentage of the page scrolled, `--brand`), `Chapter n of 7`, the contents as a `Contents` select on phone (sticky rail on desktop) and large Prev/Next buttons at the bottom (48 px tall, full width on phone).
- Every page uses the same cover tile on the overview and the same page structure, so the 7 are visibly one family.

## (c) The two decks

Navigation: `Decks` tab. Each deck is a **swipeable slide rail** (R33): slides as 16:9 thumbnails in a horizontal scroll-snap row, the first slide larger.

```
+---------------------------+
| Decks                     |
| Short pitch · 6 slides    |
| 90 seconds · short v1     |
| [▭][▭][▭][▭][▭][▭] swipe →|   <- scroll-snap thumbnails (titles beneath)
| [Present ▸] [Open ↗]      |
|                           |
| Pitch deck · 13 slides    |
| Appendix for questions    |
| [▭][▭][▭][▭][▭] ... →     |
| [Present ▸] [Open ↗]      |
+---------------------------+
Tap a thumbnail or Present: full-screen viewer, swipe left/right between slides, "3 / 6", ✕
```

- Thumbnails are the slide titles on a `--surface-2` tile (from `deck-short-content.md` / `deck-content.md`: `Hook`, `Problem`, `Live demo`, `How it is safe`, `Who pays first`, `Regulatory path and the ask` for the short deck). If Ren has time, the first slide of each deck is a live iframe thumbnail; the rest stay title tiles.
- `Present` opens the real HTML in a full-screen `<iframe>`; a floating `3 / 6` pill and a `✕`. Swipe or arrow keys step if the deck exposes keyboard navigation; otherwise the viewer is just the iframe plus `✕`.
- Two rows, each identically structured; the 13-slide deck is labelled `Appendix`.

## (d) Demo-product slot

Navigation: `Demo` tab. It reads as a **"Ready to demo?" checklist**.

```
+---------------------------+
| Demo product  [SAMPLE]    |
| ┌───────────────────────┐ |
| │ ■ Not ready yet       │ |   verdict tile (red/amber/green by rule below)
| │ 0 of 3 clean runs;    │ |
| │ step 5 fails          │ |
| └───────────────────────┘ |
| ┌ Live link ────────────┐ |
| │ [Live ▲ deploying]    │ |
| │ demo.example.app      │ |
| │ [Copy]  [Open demo ↗] │ |
| └───────────────────────┘ |
| Build ● #14 passed 15:12  |
| Clean runs  ( ) ( ) ( )   |
| The 8 steps               |
|  ● 1 Photograph a blood.. |
|  ● 2 Refuses a document.. |
|  ▲ 3 Symptom diary...     |
|  ▲ 4 DNA-shaped QR...     |
|  ■ 5 Doctor asks, cites.. |
|  ○ 6 Possible causes...   |
|  ○ 7 Possible matches...  |
|  ○ 8 Access ends...       |
+---------------------------+
```

- **Verdict rule (derived, shown in words):** `Ready` (green) only when the build passed, the deploy is live, and clean runs are 3 of 3; `Not ready yet` (red) if any step is red or clean runs are under 3 and fewer than 3 hours remain; otherwise `Getting there` (amber). Sample shows `Not ready yet` (red) because step 5 fails.
- Each step is a full-width 48 px row with RAG glyph, number, title and the word (`Pass`, `Risk`, `Fail`, `Not run`); tapping a row expands one line of detail (the last-run note, `set by hand by CTO or Release`).
- Link card: `Live` badge, URL, `Copy` and `Open demo` buttons (R35, R36). The three clean-run circles fill in order.
- Source chip: `SAMPLE · no live source`, plus the note `Set by hand after each run (MIN-4445 item 2)`.

---

## Motion specifics for C

Everything in guidelines section 4, plus:

1. **Scroll reveal (once per section):** each section's cards fade up 8 px when they enter the viewport (`IntersectionObserver`, threshold 0.15), staggered by `--stagger` within a section, `--dur-3` `--ease-out`. Never re-plays on scroll back. Under reduced motion they are simply visible.
2. **Verdict banner:** on load the banner background tints in (`--dur-3`); when the verdict changes it cross-fades with the blur trick and the glyph does the single pulse (red only). The ring (desktop) fills from 0 to the elapsed fraction of the window on load (`--dur-5`, `--ease-out`) and thereafter advances in tiny steps once a minute.
3. **Sticky mini bar:** slides down 100% to 0 with opacity when the banner leaves the viewport, and back up when it returns (`--dur-2`, transform and opacity only). It is driven by scroll position through an `IntersectionObserver` on the banner, not by scroll events.
4. **Accordion (milestones, blocked list, all credits):** height animates through a CSS grid-row trick (`grid-template-rows: 0fr` to `1fr`) over `--dur-3` `--ease-in-out`, content fades in `--dur-2`; chevron rotates 180 degrees. Instant under reduced motion.
5. **Bottom tab bar (phone):** the active indicator slides between tabs (`--dur-3` `--ease-in-out`); page content cross-fades (`--dur-2`). No animation if the tab is changed with a keyboard.
6. **Reading progress bar:** width follows scroll with no easing (it is a direct readout), 3 px tall, `--brand`; hidden under reduced motion except as a static `read %` number.
7. **Slide rail:** native `scroll-snap` (no JS animation); the viewer opens with a `scale(0.96)` to 1 and opacity (`--dur-3`, `--ease-out`); slide change inside it is a 120 ms cross-fade.
8. **Copy status:** the button label cross-fades to `Copied` (`--dur-1`) and back after 1.5 s; no toast.

## What Ren builds for the clickable HTML draft (C)

Folder: `drafts/c/` with `index.html`, `c.css`, `c.js` plus the shared `sample-data.js` and `tokens.css`. Build phone-first (390), then widen.

**Views and navigation** (hash routing):

| Route | View | Navigation |
|---|---|---|
| `#/briefing` (default) | 6 sections + verdict + sticky mini bar | bottom tab bar on phone, left chapter nav (scrollspy) on desktop; milestone accordion; `Copy status as text` |
| `#/exercises` | 7 chapter covers (carousel on phone, 4+3 grid on desktop) | tab; tap a cover |
| `#/exercises/00` ... `#/exercises/06` | the shared reading template | `Chapter n of 7`, Prev/Next buttons, contents select/rail, reading-progress bar |
| `#/decks` | two slide rails | tab; `Present` opens the full-screen viewer (`#/decks/short/3`) |
| `#/demo` | "Ready to demo?" checklist | tab; tap a step row to expand detail |

**Sample-data fields used:** all shared fields (`deadline`, `buildStart`, `freeze`, `submitBy`, `milestones`, `current`, `tasks`, `tokens`, `money`, `agents`, `flags`, `demo`, `exercises`, `decks`). C needs **no extra data**; the sentences are generated from these:

```js
verdict = flags.some(f=>f.level==="bad") ? "off" : flags.length ? "risk" : "on";
sentence = { on:"We are on track.", risk:`We can still make it, but ${flags.length} things need attention.`, off:"We are off track." }[verdict];
demoVerdict = (demo.build.state==="pass" && deployLive && demo.cleanRuns>=3) ? "ready"
            : demo.steps.some(s=>s.s==="fail") ? "not-ready"      // sample: step 5 fails -> not-ready
            : "getting-there";
```

(The verdict rule in section (d) also lets "fewer than 3 hours left with under 3 clean runs" turn it red; Ren may leave that clause out of the draft. Product confirms the real rule if the founder picks C.)

**Must be real:** the clock-driven countdown and thresholds (`?now=` works), the generated verdict sentence, the sticky mini bar, the milestone accordion, the 7 exercise pages in the template with reading progress, the deck rails with `Present`, the step list and the `Copy status as text` button (a real clipboard write), light/dark/reduced motion, and a layout that holds at 390 and 1440. **May be static:** ring on desktop (optional polish; do it last), live-iframe thumbnails of the decks (title tiles are enough), the `Show all` list expansions beyond the first expansion.

**Acceptance for Ren's draft:** at 390 px the founder reads the verdict, the countdown and the top risk without scrolling, reaches Exercises, Decks and Demo from the bottom tab bar in one tap, and the 7 exercise pages open in an identical template with a visible chapter progress.

---

## How the three directions differ (for the founder's choice)

| | A · Mission Control | B · The Journey Map | C · The Briefing |
|---|---|---|---|
| Mood | dark, dense, instrument panel | light, editorial, spatial | warm, plain-spoken, tinted cards |
| Organising idea | everything on one screen | everything on one time axis | one question per section |
| Best on | wall display, second monitor | laptop, a minute of study | phone, a 10-second glance |
| Countdown | giant hero, ring pulse in the last 10 min | header element plus a NOW line on the map | verdict banner with units in words |
| Other pages | slide-over drawers with keys 1 to 4 | full tabs, series strip, poster cards, flight path | bottom tab bar, chapter covers, slide rails, readiness checklist |
| Cost to build | medium (many panels, one screen) | highest (the time canvas and scrubber) | lowest (cards and scroll) |
