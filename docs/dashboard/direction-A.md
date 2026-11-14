# Direction A · "Mission Control"

Read `guidelines.md` first (tokens, data-viz, motion, shared sample data section 6, exercise template section 7). This page only says what A adds or overrides.

**Concept in one line:** the whole project on one dark screen, like a launch console on a wall display: a giant countdown, a ladder of 7 milestones, live meters, and everything else one keystroke away in a slide-over, so the founder never leaves the console.

**Who it is for:** the founder glancing from across a room or on a second monitor all night. Strength: everything visible at once, strongest "real time" feel. Weakness: dense; the reading pages (exercises) are a step removed.

References that shaped it: R1, R2 (realtime tiles, live dot), R3 (density), R14, R16 (today marker on a time axis), R20 (countdown beside activity), R25, R26 (agent step logs), R38 (agent lanes).

---

## Token overrides vs guidelines

| Token | Override | Why |
|---|---|---|
| Default theme | **Dark** (`[data-theme="dark"]` on load; the toggle still works) | console feel, easy on eyes overnight |
| `--r-2` | 6 px (tiles), `--r-3` 10 px (drawer) | tighter, more instrument-like |
| Card padding | `--s-3` (12 px); grid gap `--s-3` | density: the whole overview fits 1440 x 900 without scroll |
| Labels | `--t-micro` and all card titles in **mono**, uppercase | console labelling |
| `--t-stat` | 24 / 28 | fits 6 tiles in a row |
| `--t-hero` | 96 / 96 at 1440; 120 in wall mode | the countdown is the screen |
| Accent glow | `--glow: 0 0 0 1px var(--brand), 0 0 24px rgb(91 217 203 / 0.18)` on the current milestone and the hero only | "armed" look; used nowhere else |
| Background | `--bg` plus a 1 px grid pattern at 2% (`background-image` of two linear-gradients, 24 px cell) | subtle console surface |

Everything else (colours, RAG, meters, source chips, easing, reduced motion) as in the guidelines.

---

## (a) Overview dashboard

Desktop 1440 x 900, no scroll. Left rail 56 px (icons: Overview, Exercises, Decks, Demo; keys `1` to `4`). Top bar 56 px as in guidelines section 5.

```
+--+------------------------------------------------------------------------------------------+
|  | Health app · Gen AI Summit   [SAMPLE DATA]   Verdict: AT RISK ▲     Sat 15:30:12  ◐  ⏸   |
|O |------------------------------------------------------------------------------------------|
|v |  TIME TO SUBMISSION DEADLINE            [LIVE · clock]  | NOW  M1 · Setup + dashboard pick |
|e |                                                          | gate: both roles can log in     |
|x |   26h 30m 12s                                           | NEXT M2 Sat 18:00 · A1 at 90%   |
|  |   ▕██░░░░░░░░░░░░░░░░░░░░░▏ 12:00 ─ 13:00▏ ─ 17:00▏ ─ 18:00 |  RISK FLAGS (2)  ▲ ▲           |
|E |                                                          | ▲ Coordinator chat 338k/350k    |
|x |                                                          | ▲ M1 gate: 2 setup issues open  |
|D |------------------------------------------------------------------------------------------|
|e |  M1 ▮▮▮▮▯▯▯▯▯  4/9 | M2 ▯ 0/8 | M3 ▯ 0/7 | M4 ▯ 0/6 | M5 ▯ 0/9 | M6 ▯ 0/5 | M7 ▯ 0/6   OVERALL 8% |
|m |  ^NOW cursor (brand glow)  Sat 15:00 ─────── ... ─────── Sun 18:00       diamonds = gates      |
|o |------------------------------------------------------------------------------------------|
|  | TASKS            | TOKENS · weighted (SAMPLE)            | MONEY            | WHO IS WORKING  |
|  | 4 done  3 prog   | Back   ████████▌  210k  ▏soft ▕hard   | Est. EUR 41.80   | ● Pix  MIN-4446 |
|  | 2 review 38 open | Pix    ███████    180k                | ▁▂▃▅▆▇ step line | ● Back MIN-4445 |
|  | 3 blocked        | Anna   █████▌     140k                | CREDITS left     | ● Anna MIN-4429 |
|  | [by role bars]   | Ren    ███▌        95k                | Gemini 262/300   | ○ Ren  waits    |
|  |                  | ...top 6 agents, "show 10"            | fal 50/50 ...    | ○ Cron idle 41m |
|  |                  | CHATS  Coordinator ▕███████▏338k ▲    |                  | live log ▾      |
+--+------------------------------------------------------------------------------------------+
```

Behaviour:

1. **Verdict** (top bar, centre): derived word `ON TRACK ●` / `AT RISK ▲` / `OFF TRACK ■` from the risk flags (any red flag = off track, any amber = at risk). Sample shows AT RISK.
2. **Hero countdown** per guidelines 4.3, plus a progress bar of the whole window with the 13:00 and 17:00 ticks.
3. **NOW / NEXT panel:** current milestone name and gate, next milestone and its gate. Small `RISK FLAGS` list under it (max 3, `+n more` opens the drawer on the Risk tab, same drawer as below).
4. **Milestone ladder:** 7 segments on one time axis (width proportional to hours: 3, 4, 4, 6, 5, 2.5, 2.5). Each segment is a meter of `done/total`; the NOW cursor is a vertical `--brand` line with glow that moves with the real clock; gates are diamonds at the segment ends (fill when the gate is met). Overall % at the right. This is the one place where the axis is time, not issues.
5. **Four panels in the bottom row** (widths 2 / 4 / 3 / 3 of 12):
   - **Tasks:** done / in progress / in review / open / blocked as one 100% segmented bar (segments separated by 2 px `--bg` gaps) with the numbers beneath; a small by-role list of bars below (top 5, `show all`).
   - **Tokens:** per-agent meters with soft/hard ticks (guidelines 3.2), top 6 agents by default; a second small block `CHATS` with per-chat meters (the coordinator at 338k is amber). Tile source chip: `SAMPLE · no live source`.
   - **Money:** `Est. EUR 41.80` (stat tile with a step-line sparkline) and the credits list: each line is a meter showing `left of granted`.
   - **Who is working:** agent rows (guidelines 3.6), active first, then idle by recency; below, a **live log** of the last 5 events (`15:29 Pix commented on MIN-4446`) that scrolls by inserting at the top.
6. **Demo strip:** a 40 px strip is pinned to the bottom of the overview: `DEMO  build ● passed 15:12 · deploy ▲ deploying · clean runs 0/3 · 8 steps: ● ● ▲ ▲ ■ ○ ○ ○ · open ↗`. It is the compact form of view (d); clicking it opens the Demo drawer.

Below 1280 px the panels wrap to two rows; below 900 px the order is hero, verdict and flags, ladder (vertical), tasks, tokens, money, who, demo.

## (b) Business-exercise pages, same template

Entry: rail icon `Exercises` (key `2`) opens a **slide-over drawer**, 70% width on desktop, full width on phone. The overview stays visible, dimmed to 40%, behind it.

```
+-- drawer (70%) ---------------------------------------------------------------+
| EXERCISES  [00][01][02][03][04][05][06]     <- 7 mono tabs, key 0..6   [Esc ✕] |
|--------------------------------------------------------------------------------|
| WORKSHOP 6 · [Recommended, not decided]                                         |
| Market fit scorecard                                                            |
| Facilitator Pix · MIN-4441 · 14 Nov 2026 · room: CEO, Marketing, Sales...       |
| "28 of 100, before fit: park by default and test"      |  28 / 100  (figure)    |
|---------------------------+----------------------------------------------------|
| CONTENTS                  | 1. One scale for five seats                        |
| ▌1 One scale ...          |    [table]                                          |
|  2 The room's scorecard   | 2. The room's scorecard ...                         |
|  3 ...                    |                                                     |
|---------------------------+----------------------------------------------------|
| For the founder: decisions 1..8 (amber panel)       | Prev: 05 · Next: ―         |
+--------------------------------------------------------------------------------+
```

- The 7 tabs are the same page template (guidelines section 7) rendered from the page's markdown; only the content differs, so all 7 look the same by construction.
- Tabs are `00` to `06` in mono with the title as tooltip; the active tab has the `--brand` underline sliding (`--dur-3`).
- Keyboard: `0` to `6` jump to a page without animation; `j`/`k` scroll; `Esc` closes.

## (c) The two decks

Rail icon `Decks` (key `3`) opens the same drawer pattern. Inside: a **stage + filmstrip** viewer (R31, R33).

```
+-- drawer ---------------------------------------------------------------------+
| DECKS   [ Pitch deck · 13 slides ]  [ Short pitch · 6 slides · 90 s ]    [✕]    |
|---------------------------------------------------------------------------------|
| +------------------------------------------+  +----+                             |
| |                                          |  |01  |  <- filmstrip (vertical)    |
| |        iframe of deck-short.html         |  |02  |                             |
| |        (slide 3 / 6)                     |  |03▌ |                             |
| |                                          |  |04  |                             |
| +------------------------------------------+  |05  |                             |
| ‹ Prev   3 / 6   Next ›   [Open full ↗]       |06  |                             |
+---------------------------------------------------------------------------------+
```

- Segmented control switches the deck (the stage cross-fades, `--dur-2`).
- The stage is an `<iframe>` of the real file (Ren copies `deck-draft.html` and `deck-short.html` next to the draft; read-only copy, no edits). If the file cannot be scrolled by slide through the iframe, Ren renders the slide titles (from `deck-content.md` and `deck-short-content.md`) as the filmstrip and shows the whole deck in the iframe.
- Arrow keys step slides (no animation on keyboard); `Open full` opens the file in a new tab.
- `Updated` line shows the deck file's version string (`short v1, 14 Nov 2026`).

## (d) Demo-product slot

Two forms: the pinned 40 px strip on the overview, and the **Demo drawer** (rail icon `Demo`, key `4`).

```
+-- drawer ---------------------------------------------------------------------+
| DEMO PRODUCT                                           [SAMPLE · no live source] |
|---------------------------------------------------------------------------------|
| BUILD   ● Build #14 passed 15:12     DEPLOY  ▲ Staging: deploying              |
| LINK    https://demo.example.app (sample)  [Copy] [Open ↗]        (R35, R36)    |
| CLEAN RUNS  ○ ○ ○   0 of 3        Last run: not yet                              |
|---------------------------------------------------------------------------------|
| THE 8 STEPS                                                                      |
| 1 ● Photograph a blood test, record appears                    Pass             |
| 2 ● Refuses a document with the wrong name and ID              Pass             |
| 3 ▲ Symptom diary records without interpreting                 Risk             |
| 4 ▲ DNA-shaped QR handshake, countdown starts                  Risk             |
| 5 ■ Doctor asks, answer cites the source exam                  Fail             |
| 6 ○ Possible causes, for the doctor only                       Not run          |
| 7 ○ Possible matches, opt-in                                   Not run          |
| 8 ○ Access ends, log shows who looked                          Not run          |
| "Set by hand by the CTO or Release after each run"  (source note, MIN-4445 item 2) |
+---------------------------------------------------------------------------------+
```

- The 3 clean-run markers fill left to right (`●` brand) as `cleanRuns` increases; a failed step resets them with a single red flash.
- Each step row is a RAG chip (guidelines 3.4) plus the step title (PRD section 4); steps 1 to 8 are the same 8 as `DATA.demo.steps`.
- In the sample, a `Mark run clean` button (draft only, local state) lets the founder click the numbers forward to see the states; it is labelled `Draft only` and does not persist.

---

## Motion specifics for A

Everything in guidelines section 4, plus:

1. **Boot sequence (first load only, 700 ms total):** top bar and rail fade in (`--dur-2`); hero countdown digits fade in; ladder segments fill left to right with `--stagger` 40 ms each; panels fade up in reading order. Skipped on reload within 10 minutes (sessionStorage) and under reduced motion.
2. **NOW cursor:** moves by `transform: translateX` once a minute (`--dur-3`, `--ease-in-out`), so it never jitters.
3. **Live log:** a new row inserts at the top with `--dur-3`; rows beyond 5 fade out at the bottom (`--dur-2`).
4. **Drawer:** enter from the right, 24 px and opacity, `--dur-3` `--ease-out`; exit `--dur-2` `--ease-exit`; backdrop fades 40%. Switching tabs inside cross-fades (`--dur-2`). Opening via keys `1` to `4` has **no** animation (repeat use).
5. **Wall mode** (`?wall=1`, key `w`): hides rail and top-bar controls, scales type to the `xl` tokens, and slowly highlights each panel in turn (a 1 px `--brand` outline moving to the next panel every 20 s, `--dur-3`). Off under reduced motion (the outline stays on the hero).
6. **Red flag arrives:** the verdict word swaps with the 200 ms blur cross-fade and the single red pulse (guidelines 4.2); a flag row slides in under the NOW panel.

## What Ren builds for the clickable HTML draft (A)

Folder: `drafts/a/` with `index.html`, `a.css`, `a.js` and the shared `sample-data.js` and `tokens.css` (from guidelines).

**Views and navigation**

| View | How reached | Notes |
|---|---|---|
| Overview | default; rail `Overview`, key `1` | the single screen above |
| Exercises drawer | rail `Exercises`, key `2`; 7 tabs `00` to `06`, keys `0` to `6` | renders the 7 markdown pages in the template; copy the markdown text from `docs/lean/` into the draft as strings or small `.md` files rendered by a tiny inline renderer |
| Decks drawer | rail `Decks`, key `3` | 2-deck segmented control; iframe stage + filmstrip |
| Demo drawer | rail `Demo`, key `4`; also click the pinned strip | 8 steps, link, clean runs, `Mark run clean` draft control |
| Risk list | click `+n more` in NOW panel | same drawer, one list |

Esc closes any drawer. Theme toggle, reduce-motion toggle and `?now=` and `?wall=1` parameters work.

**Sample-data fields used:** `deadline`, `buildStart`, `freeze`, `submitBy`, `milestones[]`, `current`, `tasks`, `tokens.perAgent`, `tokens.perChat`, `tokens.agentCaps`, `tokens.chatCaps`, `money.estimateEUR`, `money.estimateSeries`, `money.credits`, `agents[]`, `flags[]`, `demo`, `exercises[]`, `decks[]`.

**Must be real in the draft:** the clock-driven countdown with digit roll, the NOW cursor position (derived from the clock between the milestone windows), the simulated update every 4 to 8 s (tokens or tasks or an agent state), drawer open/close, tab switching, deck stage switching, light/dark. **May be static:** the live log text (rotate a canned list), exercise page text beyond the first two sections of each page if time is short (say so in a banner `Draft: full text in source`), the filmstrip thumbnails (titles only).

**Acceptance for Ren's draft:** a founder at 1440 x 900 sees all 7 items without scrolling, can reach all 4 views in two clicks or one key, and can see an amber coordinator-chat flag and a red demo step in the sample.
