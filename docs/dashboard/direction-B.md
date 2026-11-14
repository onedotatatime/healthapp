# Direction B · "The Journey Map"

Read `guidelines.md` first (tokens, data-viz, motion, shared sample data section 6, exercise template section 7). This page only says what B adds or overrides.

**Concept in one line:** the 30 hours from build start to the deadline drawn as one horizontal time map, with a moving "now" line; every number (milestones, agents, tokens, money, risks) hangs on the same time axis, so the founder reads progress as a journey, not as a pile of tiles.

**Who it is for:** the founder who thinks "where are we on the road to 18:00 and how fast are we burning". Strength: one shared axis connects cause and effect (tokens jump when an agent lane is busy). Weakness: the least glanceable of the three at a distance; it rewards a minute of looking.

References that shaped it: R14, R16, R38 (time axis, today marker, swimlanes), R19 and R15 (milestones), R9 and R2 (cumulative usage), R17 (RAG scale), R29, R27 (reading page with contents rail), R31, R32, R33 (deck viewer), R18, R34 (stage path and release status).

---

## Token overrides vs guidelines

| Token | Override | Why |
|---|---|---|
| Default theme | **Light** (paper `#F7F8F6`); dark available | the map needs white space to breathe; light also prints for the pitch room |
| Display type | page titles and section titles in `"Source Serif 4", Georgia, serif`, 600, `--t-h1` 28 / 34; hero countdown stays mono | editorial feel, like a report with a map in it |
| `--r-2` | 12 px; `--r-3` 20 px | softer cards |
| Card shadow | `0 1px 2px rgb(10 28 38 / 0.06), 0 8px 24px rgb(10 28 38 / 0.04)` | the map "floats" on the paper |
| `--t-hero` | 48 / 52 (the countdown is a header element here, not the whole screen) | the map is the hero |
| Lane colours | **No categorical hues.** Agent identity is the lane label. Bar fill = state: active `--brand`, done `--brand-tint` with a 1 px `--brand` border, blocked `--bad-tint` with a diagonal hatch, planned (future) `--surface-2` dashed outline | avoids an unvalidated categorical palette; state is what matters |
| Time grid | vertical hour lines `--line` at 1 h, stronger at midnight (`--ink-2` 20%); night hours (Sun 00:00 to 08:00) get a `--surface-2` 40% band labelled `overnight, agents only` | founder rest is his call; agents carry M3 and M4 |

---

## (a) Overview dashboard: the Timeline page

Desktop 1440 wide, vertical scroll (the map is about 600 px tall, the cards below it about 500 px). Top bar 56 px with the four page tabs.

```
+----------------------------------------------------------------------------------------------+
| Health app · Gen AI Summit  [Timeline] Exercises  Decks  Demo     [SAMPLE DATA]  ◐ ⏸  15:30   |
|----------------------------------------------------------------------------------------------|
| 26h 30m 12s  to deadline [LIVE]    8% of the way (4 of 50 issues) ▕█░░░░░░░░░░▏   AT RISK ▲  |
| "Submit by Sun 17:00. Next gate: M1 closes Sat 18:00 with both roles logged in."             |
|----------------------------------------------------------------------------------------------|
| [Fit] [Next 6 h] [Full]    Sat 14 ──────────────────────────  Sun 15 ───────────────────      |
|        12   15  ┃NOW 18   21   00   03   06   09   12  ┃13:00  15  ┃17:00 ┃18:00            |
| MILESTONES  ▕M1▮▮▮▯▏▕ M2 ▯▯▯▏▕ M3 ▯▯▏▕  M4  ▯▏▕   M5   ▯▏▕M6▏▕M7▏    ◆ gates               |
| Pix         ░░░░░░░░[██ MIN-4446 ▸ ]- - - - - - - - - - - - - - - - - - - - - - - - - -     |
| Back        ░░░░[████ MIN-4445 ▸ ]- - - ...                                                  |
| Anna        ░░░░░░░[███ MIN-4429 ████]                                                       |
| Ren         ░░░░░░░░░░░░░ ┈┈┈ waits on MIN-4446 ┈┈┈                                         |
| Cron  CTO  Release  (3 lanes, collapsible "+ 4 idle")                                        |
| TOKENS Σ    ▁▂▃▄▅▆▇ ┃ ╌╌╌╌╌╌ projection to deadline ~ 4.1M [SAMPLE · no live source]         |
| MONEY EUR   ▁▂▃▄▅▆▇ ┃ ╌╌╌╌╌╌ projection ~ EUR 190 est.                                      |
| RISKS       ▲ 15:12 coordinator 338k                      ▲ forecast: M1 gate 18:00         |
|----------------------------------------------------------------------------------------------|
| TASKS          | TOKENS BY AGENT AND CHAT        | CREDITS LEFT         | DEMO                    |
| 4 done 3 prog  | per-agent meters, soft/hard      | Gemini 262 / 300     | ▲ deploying · 0/3 clean |
| 2 rev 38 open  | ticks; chat meters below         | fal 50 / 50 ...      | ● ● ▲ ▲ ■ ○ ○ ○  Open → |
+----------------------------------------------------------------------------------------------+
```

How the map works:

1. **One shared x-axis** from Sat 12:00 (build start) to Sun 18:00, hour ticks, day labels, the `overnight` band, and four vertical markers: `NOW` (solid `--brand`, glow), `13:00 freeze` (dashed), `17:00 submit` (dashed), `18:00 deadline` (solid `--bad`, flagged `■`). The viewport starts on `Next 6 h` around NOW; `Fit` shows everything (1440 less the 120 px label column leaves 1320 px for 30 hours, so each hour is about 44 px); `Full` stretches to 60 px per hour with horizontal scroll.
2. **Milestones row (M1 to M7):** segments positioned by their windows; fill = `done/total` (meter, guidelines 3.5), label inside when the segment is wider than 70 px, else above. Gates are diamonds `◆` at segment ends; a met gate is filled `--ok`, an unmet gate in the past is `--warn`, in the future `--ink-2` outline.
3. **Agent lanes** (R38, R16): one 28 px lane per agent, label at left (name and role). Bars are issue work periods (`MIN-4446`) positioned from first to last activity; the active bar's right end sits at NOW and shows a small pulsing dot (guidelines 4.2 active ring). Only active and recently active agents are shown by default (4 lanes); `+ 4 idle` expands the rest. Clicking a bar opens a small popover: issue id and title, state, last activity, tokens used in that period (sample).
4. **Cumulative rows** under the lanes, same x-axis: `TOKENS Σ` (all agents, weighted tokens) and `MONEY EUR` are step lines (guidelines 3.3) up to NOW, then a dashed straight **projection** to the deadline at the last 2 hours' rate. The projection is a straight line only; it is labelled `projection` and carries the `SAMPLE · no live source` chip. The soft/hard cap does not apply on this row (caps are per agent and per chat, shown in the cards).
5. **Risks row:** triangles at the time a flag raised (`15:12`) and at forecast times (`forecast: M1 gate 18:00` hollow triangle). Hover shows the rule that raised it.
6. **Scrubbing:** moving the pointer over the map draws a vertical crosshair through all rows and a tooltip anchored to the top (time, current milestone, who was active, tokens Σ, EUR Σ at that moment). Touch: press and drag. Keyboard: the map takes focus; left/right arrows move the crosshair by 15 minutes.
7. **Header band** (above the map): countdown (`--t-hero` 48 mono, source chip `LIVE · clock`), overall percent with a thin bar (`4 of 50 issues`), verdict chip (RAG, derived as in A), and one plain sentence generated from data: "Submit by Sun 17:00. Next gate: M1 closes Sat 18:00 with both roles logged in."
8. **Four cards under the map** (equal width, 4 columns at 1440, two at 900, one on phone): Tasks (segmented 100% bar and by-role bars), Tokens by agent and chat (per-agent meters with soft/hard ticks, chat meters), Credits (meters showing left of granted, warn under 30%, bad under 20%), Demo summary (compact, links to the Demo tab).

Below 900 px the map becomes a **vertical** timeline (milestones as a stack, NOW as a horizontal line, agents as chips on the segment they work in) so it stays usable on a phone; the cumulative rows become two sparklines in the cards.

## (b) Business-exercise pages, same template

Tab `Exercises` opens a **reading page**, not a drawer. Route `#/exercises` shows the series; `#/exercises/06` shows a page.

```
+----------------------------------------------------------------------------------------------+
| Exercises   (00)──(01)──(02)──(03)──(04)──(05)──(06)       <- series strip, current is filled |
|----------------------------------------------------------------------------------------------|
| CONTENTS (sticky)   |  WORKSHOP 6 · [Recommended, not decided]                                |
|  ▌1 One scale       |  Market fit scorecard                  (serif, 28)                      |
|   2 The room's ...  |  Facilitator Pix · MIN-4441 · 14 Nov 2026 · Room: CEO, Marketing...     |
|   3 ...             |  ┌───────────────────────────────────────────────┐  ┌──────────────┐   |
|                     |  │ "28 of 100, before fit: park by default and   │  │  28 / 100    │   |
|  ─────────          |  │  test"  (the room's line)                      │  │  figure slot │   |
|  Prev 05            |  └───────────────────────────────────────────────┘  └──────────────┘   |
|  Next ─             |  1. One scale for five seats  [tables, 72ch column]                     |
|                     |  ...                                                                    |
|                     |  ┌ For the founder: decisions (amber panel) ────────────────────────┐   |
|                     |  └──────────────────────────────────────────────────────────────────┘   |
|                     |  source: docs/lean/06-market-fit-scorecard.md · MIN-4441    ‹ 05  ─ ›   |
+----------------------------------------------------------------------------------------------+
```

- The **series strip** is a 7-node path (R18 stage idea, R15 level idea): nodes `00` to `06`, connected by a 2 px `--line`; the current node is `--brand` filled with white numeral; visited nodes `--brand-tint`; hover shows the title. The strip is the same on every page, which is what makes the 7 pages read as one family.
- The page body is exactly the template in guidelines section 7. A single centred column of 72ch, the contents rail left, no right rail (R29, R27, R30).
- On `#/exercises` (no page chosen) show 7 cards in a 4+3 grid: number, title, the room's one-line recommendation and the headline figure, so the founder can scan all seven at once (this is the "pages visualised the same way" overview).

## (c) The two decks

Tab `Decks` shows **two poster cards** side by side; `Present` opens a full-viewport viewer.

```
+----------------------------------------------------------------------------------------------+
| Decks                                                                                          |
| +-----------------------------------+   +-----------------------------------+               |
| |  [ scaled iframe, slide 1 ]       |   |  [ scaled iframe, slide 1 ]       |               |
| |                                   |   |                                   |               |
| |  Pitch deck · 13 slides           |   |  Short pitch · 6 slides · 90 s    |               |
| |  Appendix for questions, Monday   |   |  The high-level idea              |               |
| |  [Present ▸]  [Open ↗]            |   |  [Present ▸]  [Open ↗]            |               |
| +-----------------------------------+   +-----------------------------------+               |
+----------------------------------------------------------------------------------------------+
Viewer (full viewport overlay):
| ✕   Short pitch · 3 / 6          ‹  [ stage, 16:9, iframe ]  ›               [timer 01:12]   |
|     ── progress dots ──          thumbnails rail (bottom, 6 titles)          notes toggle   |
```

- Cards give each deck equal weight and show the deck's real first slide as a live thumbnail (iframe scaled with CSS `transform: scale()`, `pointer-events: none`).
- The viewer follows R31 (presenter with filmstrip and a running timer) and R32 (slide counter and arrows): large stage, a bottom thumbnail rail, an optional speaker-notes panel (text from `deck-short-content.md`, shown if Ren has time; otherwise a `Notes in source` link). The timer counts up from 0 when `Present` is pressed, as a rehearsal clock.
- Keys: left/right to step (no animation), `Esc` closes, `f` toggles fullscreen.

## (d) Demo-product slot

Tab `Demo` shows a **flight path**: the 8 steps as nodes on a horizontal path with the build and link above.

```
+----------------------------------------------------------------------------------------------+
| Demo product                                                  [SAMPLE · no live source]       |
| [Live] https://demo.example.app (sample)  [Copy] [Open ↗]          (R35, R36, R37)            |
| BUILD  ● #14 passed 15:12     DEPLOY  ▲ Staging: deploying      CLEAN RUNS  ( ) ( ) ( )  0/3  |
|----------------------------------------------------------------------------------------------|
|   ●───────●───────▲───────▲───────■───────○───────○───────○                                   |
|   1       2       3       4       5       6       7       8                                    |
|  Photo   Wrong   Diary   QR      Doctor  Possible Possible Access                              |
|  to      name    notes   hand-   asks,   causes   matches  ends,                               |
|  record  refused         shake   cites                    log                                  |
|----------------------------------------------------------------------------------------------|
| Selected: 5 ■ Doctor asks, answer cites the source exam   Fail                                |
| Last run: sample 15:02 · note: "answer cites 2 of 3 exams" · set by hand (CTO or Release)     |
+----------------------------------------------------------------------------------------------+
```

- Nodes are RAG chips (guidelines 3.4) on a 2 px path whose segment colour follows the **earlier** node's state (so a red node visibly breaks the path onward).
- Click or arrow-key a node to read its detail line; the selected node has a 2 px `--brand` ring.
- Clean runs are three medallions (24 px circles) that fill brand in order; the label `0 of 3` is always text too.
- The same summary appears as the fourth card on the Timeline page.

---

## Motion specifics for B

Everything in guidelines section 4, plus:

1. **Map entrance:** the axis draws first (grid lines fade in, `--dur-3`), then milestone segments scale in on X from their left edge (`--dur-5`, staggered 40 ms), then lane bars (staggered 60 ms per lane), then the cumulative lines draw by `stroke-dashoffset` (`--dur-5`, `--ease-out`). Total under 1.2 s; skipped under reduced motion.
2. **NOW line:** moves once per minute by `translateX` (`--dur-3`, `--ease-in-out`); it never animates continuously. A small `NOW 15:31` flag rides on it.
3. **Active bar growth:** the right end of an active lane bar extends in steps whenever data arrives (at most once per 15 s), `--dur-2` `--ease-out`, with the active ring dot at its end.
4. **Zoom (`Fit`, `Next 6 h`, `Full`):** the map content transforms (`scaleX` of the track and a counter-scale of the labels so text does not stretch) over `--dur-3` `--ease-in-out`; triggered by keyboard it is instant.
5. **Scrubber:** the crosshair follows the pointer with no easing (a lag would read as wrong data); the tooltip fades in `--dur-1`. Rows highlight the nearest data point with a 6 px dot and 2 px surface ring.
6. **Page changes (tabs):** content cross-fades (`--dur-2`), the active tab underline slides (`--dur-3`). Series strip nodes fill in `--dur-2` when the user moves between exercise pages; the 7 pages cross-fade only the body, the strip stays put.
7. **Deck viewer:** open with scale `0.96` to `1` and opacity (`--dur-3` `--ease-out`), origin at the clicked card; slide changes are a plain 120 ms cross-fade (no slide-in; the deck has its own style).
8. **Flight path:** when a node changes state its segment to the next node recolours with the 200 ms blur cross-fade; a failed step plays the single red pulse.

## What Ren builds for the clickable HTML draft (B)

Folder: `drafts/b/` with `index.html`, `b.css`, `b.js` plus the shared `sample-data.js` and `tokens.css`.

**Views and navigation** (hash routing, no framework needed):

| Route | View | Navigation |
|---|---|---|
| `#/timeline` (default) | map + header band + 4 cards | top tab; zoom buttons `Fit`, `Next 6 h`, `Full`; click a lane bar for a popover; click `Demo` card to go to `#/demo` |
| `#/exercises` | 7-card overview (4+3) | top tab; click a card to open its page |
| `#/exercises/00` ... `#/exercises/06` | the shared reading template | series strip and Prev/Next links; contents rail scrolls with scrollspy |
| `#/decks` | two poster cards | top tab; `Present` opens the viewer overlay (`#/decks/short/3` keeps the slide in the URL) |
| `#/demo` | flight path | top tab; click or arrow-key a node |

**Extra sample data for B** (add to `sample-data.js`, in addition to the shared fields in guidelines section 6):

```js
DATA.lanes = [ // agent work periods on the shared axis, SAMPLE (real build: Linear issue + session file times)
  { agent:"Pix",  bars:[ {issue:"MIN-4441", from:"2026-11-14T12:30", to:"2026-11-14T14:05", state:"done"},
                         {issue:"MIN-4446", from:"2026-11-14T15:05", to:"now", state:"active"} ] },
  { agent:"Back", bars:[ {issue:"MIN-4435", from:"2026-11-14T12:10", to:"2026-11-14T13:40", state:"done"},
                         {issue:"MIN-4445", from:"2026-11-14T14:50", to:"now", state:"active"} ] },
  { agent:"Anna", bars:[ {issue:"MIN-4429", from:"2026-11-14T13:00", to:"now", state:"active"} ] },
  { agent:"Ren",  bars:[ {issue:"MIN-4447", from:"2026-11-14T15:30", to:"2026-11-14T18:00", state:"planned"} ], waitsOn:"MIN-4446" },
  { agent:"Cron", bars:[] }, { agent:"CTO", bars:[ {issue:"-", from:"2026-11-14T13:20", to:"2026-11-14T14:00", state:"done"} ] }, { agent:"Release", bars:[] }
];
DATA.flagsTimed = [ {at:"2026-11-14T15:12", level:"warn", text:"Coordinator chat 338k of 350k"},
                    {at:"2026-11-14T18:00", level:"warn", forecast:true, text:"M1 gate 18:00 at risk"} ];
DATA.tokens.projection = { at:"2026-11-15T18:00", v:4100000 };      // straight line from the last point
DATA.money.projection  = { at:"2026-11-15T18:00", v:190 };
```

**Must be real:** the clock-driven countdown and NOW line (from the real clock; `?now=` works), the shared x-axis with positions computed from timestamps, `Fit` / `Next 6 h` / `Full` zoom, the crosshair scrubber with tooltip values interpolated from the series, the 7 exercise pages in the template with the series strip, the deck card thumbnails and the viewer, the flight path with click selection, light/dark, reduced motion. **May be static:** projection arithmetic (hardcode the two projection points), lane bars after NOW, the vertical-timeline phone layout (a simple stacked fallback is enough for the draft), speaker notes.

**Acceptance for Ren's draft:** at 1440 the founder sees the map, the header sentence and the four cards after one small scroll; moving the pointer along the map shows how many tokens and euros had been spent at that time and who was active; all 7 exercise pages are reachable from the series strip and look identical in structure.
