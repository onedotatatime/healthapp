# Dashboard design guidelines (tokens, data-viz, motion)

Owner: Pix Elidis (Design) · MIN-4446 under MIN-4445 · Sat 14 Nov 2026 · for Ren (MIN-4447) to build 3 clickable HTML drafts.
Hard project deadline: Sun 15 Nov 2026 18:00 Athens (submit by 17:00, feature freeze Sun 13:00).
Colour contrast numbers below were computed (WCAG 2 relative luminance), not eyeballed. Not verified: real-device rendering, the Greek locale, print.

The three directions (`direction-A.md`, `direction-B.md`, `direction-C.md`) use these tokens and rules and override only what each one names. Where a direction says nothing, this page decides.

---

## 1. Principles (short)

1. **Glance first.** The founder asks one question all day: "will we make it by Sun 18:00?" The first screen answers it in under 3 seconds with the countdown, the verdict and the next gate.
2. **A number always says where it comes from.** Every tile carries a source chip: `LIVE · clock`, `SAMPLE · Linear` (live in the real build), or `SAMPLE · no live source` (entered by hand or needs a new reader). Drafts run entirely on sample data, so the top bar also shows one global `SAMPLE DATA` badge.
3. **Colour is never the only signal.** Red/amber/green always ships with a glyph and a word.
4. **Motion explains a change, it does not decorate.** Something moves only when data changed, a state changed, or the user acted.
5. **Reuse the deck's identity.** Teal, ink, paper and navy come from the pitch deck (`docs/deck/deck-draft.html`), so the dashboard and the deck look like one product.

## 2. Tokens

Ren: define these as CSS custom properties on `:root` (light) and `[data-theme="dark"]`. Switch with `prefers-color-scheme` by default and a manual toggle. Names are final; values may be tuned by a direction.

### 2.1 Colour (light / dark)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F7F8F6` | `#0A1C26` | page background (deck `paper` / `navy`) |
| `--surface` | `#FFFFFF` | `#102A36` | cards, tiles |
| `--surface-2` | `#EAEFEE` | `#16364A` | inset areas, track of a meter, hovered row |
| `--line` | `#D3DADB` | `#24424E` | hairlines and dividers (decorative, not carrying meaning) |
| `--line-ui` | `#6F8890` | `#7E98A1` | borders of inputs and the empty part of a segmented control (needs 3:1) |
| `--ink` | `#12303A` | `#E8EEF0` | primary text |
| `--ink-2` | `#55696F` | `#9FB4BB` | secondary text, labels |
| `--brand` | `#0E7C86` | `#5BD9CB` | primary accent, "now", links on surfaces |
| `--brand-text` | `#0B6A73` | `#5BD9CB` | brand-coloured text |
| `--brand-tint` | `#DCEBEC` | `#12414A` | selected row, brand chip background |
| `--ok` / `--ok-text` / `--ok-tint` | `#1F9254` / `#17703F` / `#DDF1E5` | `#4FD08C` / `#4FD08C` / `#123B2A` | green: done, on track |
| `--warn` / `--warn-text` / `--warn-tint` | `#B87A12` / `#8A5200` / `#F6E7CC` | `#F2B544` / `#F2B544` / `#3F3013` | amber: at risk, soft cap |
| `--bad` / `--bad-text` / `--bad-tint` | `#D4382E` / `#A8231B` / `#FBE3E0` | `#FF8479` / `#FF8479` / `#451C19` | red: late, hard cap, failed |
| `--idle` | `#6F8890` | `#7E98A1` | not run, no data, idle agent |

Measured contrast (text tokens need 4.5:1, fills and meter marks need 3:1):

| Pair | Light | Dark |
|---|---|---|
| `--ink` on `--bg` | 13.06 | 14.85 |
| `--ink-2` on `--surface` | 5.77 | 6.91 (on dark surface) |
| `--brand-text` on `--surface` | 6.32 | 8.70 |
| `--ok-text` on `--surface` / on `--ok-tint` | 6.13 / 5.19 | 7.63 on surface |
| `--warn-text` on `--surface` / on `--warn-tint` | 6.39 / 5.24 | 8.15 on surface |
| `--bad-text` on `--surface` / on `--bad-tint` | 7.19 / 5.88 | 6.28 on surface |
| `--ok` fill on `--surface` | 3.96 | n/a (dark uses the text value) |
| `--warn` fill on `--surface` | 3.60 | n/a |
| `--bad` fill on `--surface` | 4.77 | n/a |
| `--brand` fill on `--surface` | 4.95 | n/a |
| white text on `--brand` button | 4.95 | n/a |

The deck's amber `#D9962B` is only 2.52:1 on white, so it is **not** used for any meter or marker; `--warn` is the deeper `#B87A12`. Dark-mode `--line` (1.91:1) is decorative only; nothing that carries meaning uses it.

**Text never wears a series colour.** Values and labels stay in `--ink` / `--ink-2`; a coloured mark beside them carries identity (the dataviz rule).

### 2.2 Type

Stack: UI `Inter, system-ui, -apple-system, "Segoe UI", sans-serif`. Numbers and ids `"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace`. Ren may load Inter and JetBrains Mono from Google Fonts for the draft; the fallbacks keep it working offline. **All numbers use `font-variant-numeric: tabular-nums`** so a value changing never shifts its neighbours.

| Token | Size / line / weight | Use |
|---|---|---|
| `--t-hero` | 72 / 76 / 600 mono, `-0.02em` | the countdown (desktop); 44 / 48 on 390 px wide |
| `--t-display` | 40 / 44 / 600 | one headline number per section |
| `--t-stat` | 28 / 32 / 600 | stat tile value |
| `--t-h1` | 24 / 30 / 600 | page title |
| `--t-h2` | 18 / 24 / 600 | card title |
| `--t-body` | 14 / 22 / 400 | body |
| `--t-small` | 13 / 18 / 500 | labels, chips, table cells |
| `--t-micro` | 11 / 14 / 600, uppercase, `+0.06em` | eyebrow, axis labels |

### 2.3 Spacing and radius

Spacing is a 4 px base: `--s-1 4`, `--s-2 8`, `--s-3 12`, `--s-4 16`, `--s-5 24`, `--s-6 32`, `--s-7 48`, `--s-8 64`. Card padding `--s-4` (dense) or `--s-5` (airy). Grid gap `--s-4`. Page max width 1440; below 900 px everything stacks to one column and the hero stays first.

Radius: `--r-1 6` (chips, inputs) · `--r-2 10` (tiles, cards) · `--r-3 16` (panels, drawers) · `--r-pill 999` (badges, meters). Borders 1 px `--line`. Shadows are rare: a single `0 1px 2px rgb(10 28 38 / 0.06)` on cards in light; none in dark (use `--surface` contrast instead).

### 2.4 Breakpoints

`sm 390` (phone, one column) · `md 900` (two columns) · `lg 1280` (full layouts as drawn) · `xl 1600` (wall display; scale `--t-hero` to 96).

## 3. Data-viz rules

Form first: a headline number is a **stat tile, not a chart**; a share of a cap is a **meter**; change over time is a **sparkline or a step line**; state is **RAG**. No pie or donut charts, no dual axis, no 3D (dataviz non-negotiables).

### 3.1 Stat tile

```
LABEL (micro, ink-2)            [source chip]
28,400            -> value, --t-stat, tabular
+1,200 vs 1h ago  -> delta, --t-small, ink-2 (arrow glyph + sign; colour only if it crosses a threshold)
▁▂▃▅▆▇ sparkline (optional, 24 px tall)
```

Rules: one value per tile, unit in the label not the value, delta always has an arrow glyph and a sign, a delta is coloured only when it breaches a threshold (not "up is green"). The tile never holds more than a sparkline; anything bigger gets its own card. Pattern references: R1, R2, R3, R4.

### 3.2 Meter (a share of a cap)

A 8 px tall pill (`--r-pill`) on a `--surface-2` track. The fill is `--brand` while under the soft cap, `--warn` from the soft cap, `--bad` from the hard cap. **Tick marks** at the soft and hard cap (1 px, `--ink-2`, 12 px tall) so the thresholds are visible before they are crossed. Label left: name; label right: `used / cap` in mono; status word (`OK`, `Near cap`, `Over cap`) with a glyph appears when not OK. Never colour alone. Token caps for the agent meter: soft 300k, hard 400k; for the chat meter: soft 350k, hard 400k. Credits meter runs the other way: it shows `left` of `granted`, warn under 30% left, bad under 20% left (the risk-flag rule in MIN-4445). References: R7, R8, R10, R11, R12.

### 3.3 Sparkline and step line

Sparklines: 2 px line in `--brand`, no axis, end dot 6 px with a 2 px `--surface` ring, area fill `--brand` at 12% opacity. Cumulative series (tokens, money) are **step lines** because they only ever go up. A vertical `--brand` hairline marks "now"; a dashed `--ink-2` hairline marks 13:00 freeze, 17:00 submit and 18:00 deadline. Grid is `--line`, 1 px, horizontal only. Hover shows a crosshair and a tooltip (value, time); the tooltip is also reachable by keyboard (arrow keys move it). References: R2, R9, R14.

### 3.4 RAG

Four states, each with colour, glyph and word, in a chip (`--r-1`, `--t-small`, tint background, text token):

| State | Glyph | Word | Colours |
|---|---|---|---|
| Green | `●` filled circle | `Pass` / `On track` | `--ok-tint` bg, `--ok-text` |
| Amber | `▲` triangle | `Risk` | `--warn-tint` bg, `--warn-text` |
| Red | `■` square | `Fail` / `Late` | `--bad-tint` bg, `--bad-text` |
| Grey | `○` ring | `Not run` | `--surface-2` bg, `--ink-2` |

Distinct shapes are the colour-blind fallback. The 8 demo steps use all four. Reference: R17 (Basecamp's on track / some risk / concerned scale), R18.

### 3.5 Milestone bar

One horizontal bar per milestone M1 to M7: label `M3 · Diary and handshake`, time window in mono (`Sat 22:00 to Sun 02:00`), a meter showing `done / total issues`, and the gate text underneath in `--ink-2`. The **current** milestone has a `--brand` left border 3 px and a `NOW` micro-chip; past milestones that are not 100% show a `--warn` glyph. References: R14, R15, R16, R19.

### 3.6 Activity row (who works on what)

`[avatar 24] Name · role · [status dot] Active|Idle · MIN-xxxx title (truncate) · last activity "2m ago"`. Active dot is `--ok` with a soft pulse (see motion). Idle is `--idle`, no pulse. References: R23, R24, R25, R26, R38.

### 3.7 Source chip

Pill, `--t-micro`, three variants: `LIVE · clock` (`--ok-tint`), `SAMPLE · Linear` (`--surface-2`, `--ink-2`), `SAMPLE · no live source` (hatched: `repeating-linear-gradient(45deg, var(--surface-2) 0 4px, transparent 4px 8px)`, `--ink-2`). The hatch is the visual rule for "not real yet".

## 4. Motion and animation

Personality: a crisp operations console, not a playful app. Everything is fast, ends clearly, and never blocks reading. Animate only `transform`, `opacity` and (for bars) `transform: scaleX` with `transform-origin: left`. No `transition: all`. No `scale(0)`: entrances start at `scale(0.96)` with opacity 0. No `ease-in`.

### 4.1 Tokens

```css
--dur-1: 120ms;   /* press, hover, chip */
--dur-2: 200ms;   /* tooltip, popover, row hover, tab change */
--dur-3: 320ms;   /* panel/drawer enter, card enter */
--dur-4: 600ms;   /* number tween, meter fill on data change */
--dur-5: 900ms;   /* first-load bar fill, change flash fade */
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);        /* default, entrances */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);    /* things moving across the screen (timeline cursor, tab underline) */
--ease-exit: cubic-bezier(0.4, 0, 1, 1);           /* exits are faster than enters: use dur-2 for what entered in dur-3 */
--stagger: 40ms;
```

### 4.2 What animates, when

| Event | Motion | Timing |
|---|---|---|
| **First load** | Cards fade up 8 px (`translateY(8px)` to 0, opacity 0 to 1), staggered by `--stagger` in reading order, max 8 cards staggered (the rest appear together). Meters fill from 0 once. | `--dur-3` per card, bars `--dur-5` `--ease-out` |
| **A number changes** (tokens, tasks, money) | Digits tween old to new (count) and the tile gets a **change flash**: background `--brand-tint` fading to `--surface` and the delta chip appears. No movement of the tile. | tween `--dur-4` `--ease-out`; flash `--dur-5` |
| **A meter changes** | Fill width animates by `scaleX` to the new value; crossing the soft cap swaps the fill colour at the crossing point (no transition on colour, so the change is crisp) and the status word fades in. | `--dur-4` `--ease-out` |
| **A RAG state changes** | The chip cross-fades with a 2 px blur during the swap (masks the two-object overlap), then a 1-time `scale(1)` to `scale(1.06)` to `scale(1)` pulse on red only. | 200 ms; pulse 320 ms |
| **A milestone becomes current** | The `NOW` chip and the 3 px brand border slide to the new row; the old row's border fades. | `--dur-3` `--ease-in-out` |
| **Agent goes active** | Status dot turns `--ok`; one ring expands (`scale 1 to 2.2`, opacity 0.5 to 0) and repeats every 1.8 s **only while active**; row text does not move. On going idle the ring stops and the dot turns `--idle` in `--dur-2`. | loop 1.8 s `--ease-out` |
| **New activity row arrives** | Inserts at top, previous rows shift down 1 row height; new row fades in. | `--dur-3` `--ease-out` |
| **Tab / view change** | Content cross-fades (opacity only, no slide); underline/segment indicator slides. Not animated at all when triggered by keyboard shortcut. | content `--dur-2`; indicator `--dur-3` `--ease-in-out` |
| **Drawer / slide-over opens** | Slides from the right 24 px with opacity, backdrop fades; exits in `--dur-2`. | `--dur-3` `--ease-out` |
| **Hover / press** | Row hover background `--surface-2`; buttons `scale(0.97)` on `:active`. Hover effects only under `@media (hover:hover) and (pointer:fine)`. | `--dur-1` |
| **Tooltip** | Fade + `scale(0.97)` to 1, origin at the mark; the second tooltip opened while one is open has 0 delay and 0 duration. | 125 ms |

### 4.3 The countdown

- Format: `26h 30m 12s` in `--t-hero` mono, with `d` omitted (the deadline is under 48 h away). Under 1 h: `59m 12s`. Under 1 min: `42s`. After the deadline: `Submitted` or `Time is up` (red).
- It updates once a second from the clock, **not** from a tween: only the seconds digit changes. The seconds digit rolls: old digit moves up 6 px and fades out while the new one rises from 6 px below, 160 ms `--ease-out`. Minutes and hours change without a roll. Tabular figures guarantee zero horizontal jitter.
- Beneath it: a thin **progress bar of the total window** (Sat 12:00 build start to Sun 18:00) with the 13:00 freeze and 17:00 submit ticks; the fill is `--brand`.
- Thresholds (colour of the hero number): above 3 h `--ink`; under 3 h `--warn-text`; under 1 h `--bad-text`. At each threshold crossing the number does a single change flash, nothing continuous.
- **Last 10 minutes only:** a 1.6 s ring pulse around the hero (opacity 0.35 to 0), the only continuous decorative motion allowed in the whole product.
- The browser tab title mirrors it (`26:30:12 · Health app`), and the tick pauses when `document.hidden` and re-syncs from the clock on return (so it never drifts).
- References: R20 (countdown beside a leaderboard), R21 (time remaining as plain text with units), R22 (circular timer, used only as an optional ring variant in Direction C), R14 (the "today" marker on a timeline).

### 4.4 Live-data update behaviour (the "real time" feel)

Drafts simulate it: every 4 to 8 seconds, one random tile gets a new sample value and plays the number-change motion. Rules the real build keeps:

1. **Batch updates:** apply incoming data once per second at most, so ten changes in one second animate once.
2. **Show freshness:** every card header has `Updated 3s ago` in `--ink-2`, ticking. After 60 s without data it turns `--warn-text` with a `▲ Stale` chip; after 5 min `--bad-text`.
3. **Never reorder rows under the pointer** while the user hovers a table (hold the sort until the pointer leaves).
4. **No animation for the user's own filters or tab keys** (they repeat often).

### 4.5 Reduced motion

`@media (prefers-reduced-motion: reduce)`: remove all translate and scale motion, ring pulses and the seconds roll. Keep what aids comprehension: opacity cross-fades at 120 ms, the change flash (it is a colour fade, no movement), and colour changes. Number tweens become instant swaps. Meters jump to the new value. The countdown still ticks (text swaps, no roll). The last-10-minutes pulse becomes a static ring in `--bad`. The activity ring becomes a static `Active` word. Add a manual `Reduce motion` toggle in the top bar that sets the same behaviour (`data-motion="reduced"`).

## 5. Layout and component notes for all directions

- **Top bar** (all views): product name `Health app · Gen AI Summit`, the global `SAMPLE DATA` badge, theme toggle, reduce-motion toggle, and a tiny live clock (Athens). Height 56 px.
- **Cards:** `--surface`, `--r-2`, 1 px `--line`, header = title (`--t-h2`) + source chip + `Updated Ns ago`.
- **Focus:** 2 px `--brand` outline with 2 px offset on every interactive element; never removed. All targets at least 40 px tall on touch.
- **Empty and error states:** a card with no data shows `No data yet` and the reason (for example `Needs a refresh job; see MIN-4445 item 4`), never a blank box.
- **Language:** English only in drafts (the dashboard is an internal tool).

## 6. Shared sample data (all three directions use exactly this)

Ren: one file `sample-data.js` exporting `DATA`, used by all 3 drafts. Frozen "now" is Sat 14 Nov 2026 15:30 Athens, but the countdown reads the **real clock** against the real deadline; a `?now=2026-11-15T14:00` URL parameter overrides it so the founder can see the late-stage states.

```js
const DATA = {
  deadline: "2026-11-15T18:00:00+02:00",
  buildStart: "2026-11-14T12:00:00+02:00",
  freeze:   "2026-11-15T13:00:00+02:00",
  submitBy: "2026-11-15T17:00:00+02:00",
  milestones: [ // done/total are SAMPLE counts; real build reads Linear
    { id:"M1", name:"Setup and dashboard pick",   start:"Sat 15:00", end:"Sat 18:00", done:4, total:9, gate:"Both roles can log in as patient and doctor" },
    { id:"M2", name:"Digitize and identity",      start:"Sat 18:00", end:"Sat 22:00", done:0, total:8, gate:"A1 at 90% on 5 docs, else cut to English and 2 exam types" },
    { id:"M3", name:"Diary and handshake",        start:"Sat 22:00", end:"Sun 02:00", done:0, total:7, gate:"Demo steps 1, 2, 4 run end to end" },
    { id:"M4", name:"Doctor's assistant",         start:"Sun 02:00", end:"Sun 08:00", done:0, total:6, gate:"Demo steps 5 and 6 run" },
    { id:"M5", name:"P1 if P0 is green",          start:"Sun 08:00", end:"Sun 13:00", done:0, total:9, gate:"All 8 steps run" },
    { id:"M6", name:"Freeze, 3 clean runs",       start:"Sun 13:00", end:"Sun 15:30", done:0, total:5, gate:"3 clean runs in a row" },
    { id:"M7", name:"Submission and pitch prep",  start:"Sun 15:30", end:"Sun 18:00", done:0, total:6, gate:"Submitted by 17:00" }
  ],                                   // totals: 50 issues, 4 done = 8%
  current: "M1",
  tasks: { done:4, inProgress:3, inReview:2, open:38, blocked:3, total:50,   // 4+3+2+38+3 = 50
           byRole:{ Product:9, Design:6, Frontend:11, Backend:10, Marketing:4, Sales:2, CTO:3, E2E:3, Release:2 } },   // sums to 50
  tokens: { // weighted tokens (in x1, cache write x2, cache read x0.1, out x5), SAMPLE
    agentCaps:{ soft:300000, hard:400000 }, chatCaps:{ soft:350000, hard:400000 },
    perAgent:[ {n:"Back",v:210000},{n:"Anna",v:140000},{n:"Pix",v:180000},{n:"Ren",v:95000},{n:"Cron",v:60000},
               {n:"CTO",v:85000},{n:"Spast",v:70000},{n:"Release",v:30000},{n:"CEO",v:25000},{n:"E2E",v:10000} ],
    perChat:[ {n:"Coordinator (main)",v:338000},{n:"Design chat",v:152000},{n:"Frontend chat",v:97000},{n:"Backend chat",v:61000} ],
    series:[ /* 12 cumulative points, one per 15 min, Sat 12:30 to 15:15 */ 40,95,150,240,330,420,520,640,760,880,1010,1130 ].map(k=>k*1000)
  },
  money: { // SAMPLE, no live source. EUR estimate = tokens by model x rate card; credits entered by hand
    estimateEUR: 41.8, estimateSeries:[0.9,2.1,4.0,6.2,9.0,12.4,16.5,20.9,26.0,31.2,36.4,41.8],
    credits:[ {n:"Google AI (Gemini)",granted:300,used:38}, {n:"fal",granted:50,used:0}, {n:"Firecrawl",granted:100,used:12}, {n:"treg",granted:50,used:0} ] // amounts to be confirmed at kickoff (PRD Q13)
  },
  agents:[ // who works on what, SAMPLE (live: Linear issue + session file time)
    {n:"Pix",role:"Design",state:"active",issue:"MIN-4446",title:"Dashboard guidelines + 3 directions",last:"1m"},
    {n:"Back",role:"Product",state:"active",issue:"MIN-4445",title:"Real-time dashboard: goal and metrics",last:"3m"},
    {n:"Anna",role:"Marketing",state:"active",issue:"MIN-4429",title:"Short pitch deck copy",last:"6m"},
    {n:"Ren",role:"Frontend",state:"idle",issue:"MIN-4447",title:"3 clickable drafts (waits on Design)",last:"12m"},
    {n:"Cron",role:"Backend",state:"idle",issue:"-",title:"Waiting on PRD sign-off",last:"41m"},
    {n:"CTO",role:"CTO",state:"idle",issue:"-",title:"Reviewing Gemini endpoint terms",last:"18m"},
    {n:"Release",role:"Release",state:"idle",issue:"-",title:"-",last:"2h"}
  ],
  flags:[ // derived (risk rules from MIN-4445 item 7), SAMPLE
    {level:"warn", text:"Coordinator chat at 338k of 350k soft cap"},
    {level:"warn", text:"M1 gate: 2 setup issues open, 2.5 h left in the block"}
  ],
  demo:{ // SAMPLE, set by hand by CTO or Release after each run
    build:{state:"pass", label:"Build #14 passed", at:"15:12"}, deploy:{state:"warn", label:"Staging: deploying"}, url:"https://demo.example.app (sample)",
    cleanRuns:0, cleanTarget:3,
    steps:[ {n:1,t:"Photograph a blood test, record appears",s:"pass"},{n:2,t:"Refuses a document with the wrong name and ID",s:"pass"},
            {n:3,t:"Symptom diary records without interpreting",s:"warn"},{n:4,t:"DNA-shaped QR handshake, countdown starts",s:"warn"},
            {n:5,t:"Doctor asks, answer cites the source exam",s:"fail"},{n:6,t:"Possible causes, for the doctor only",s:"idle"},
            {n:7,t:"Possible matches, opt-in",s:"idle"},{n:8,t:"Access ends, log shows who looked",s:"idle"} ]
  },
  exercises:[ // the 7 lean pages in docs/lean/ (read-only source)
    {n:"00",t:"Summary",f:"00-summary.md"},{n:"01",t:"Personas",f:"01-personas.md"},{n:"02",t:"Empathy maps",f:"02-empathy-maps.md"},
    {n:"03",t:"Competitor analysis",f:"03-competitor-analysis.md"},{n:"04",t:"Value proposition",f:"04-value-proposition.md"},
    {n:"05",t:"Business model canvas",f:"05-business-model-canvas.md"},{n:"06",t:"Market fit scorecard",f:"06-market-fit-scorecard.md"}
  ],
  decks:[ {id:"full",t:"Pitch deck, 13 slides",f:"deck-draft.html",slides:13}, {id:"short",t:"Short pitch, 6 slides, about 90 seconds",f:"deck-short.html",slides:6} ]
};
```

Task counts by role sum to 50 and the status counts sum to 50; milestone totals sum to 50. Ren keeps those sums so the totals agree on every view.

## 7. The shared exercise-page template (one template for all 7 pages)

All three directions render the 7 business-exercise pages with the **same structure**; a direction only changes the chrome around it (see each direction's section b). Source of each page: `docs/lean/0N-*.md` in the `business-design-exercises-status-179124` worktree (read-only; Ren copies the text into the draft, he does not edit the source). The lean pages already share one skeleton, and the template mirrors it:

1. **Page header:** `Workshop N` micro-eyebrow, title (`--t-h1`), a status chip (`Recommended, not decided` in amber-tint, as every page states it), and a meta strip (facilitator, date, ticket, room) as `label: value` pairs.
2. **The room's line:** one sentence verdict in `--t-display`-adjacent size (24/32), taken from the page's "Recommendation in one line" (page 00 table, row for that workshop).
3. **Headline figure slot:** one number plus label from the page's own first table (for example `28 of 100` on page 06; `7 cards + 2 anti-personas` on page 01). If a page has no natural figure the slot shows `-`.
4. **Contents rail:** the page's own numbered sections (`## 1.`, `## 2.` ...), sticky, with scrollspy (the active item gets the `--brand` bar). On phone it collapses to a `Contents` select.
5. **Body:** the markdown sections rendered in the reading style: max line length 72ch, tables full width with `--line` rows and a zebra of `--surface-2` at 40%, blockquotes with a 3 px `--brand` left border.
6. **Decisions and open questions:** the page's batched decisions as a numbered list in a `--warn-tint` panel ("For the founder").
7. **Footer:** source file path in mono, the issue link, and `Previous` / `Next` page links so the 7 pages read as a series.

Reading references for this template: R27 and R30 (contents rail beside a long document), R28 and R29 (clean document page with status chip), R31 is not used here.

## 8. Mobbin references used (all web screens; every one opened and looked at)

Each is cited where it justifies a choice above or in a direction. Click-through links:

| # | App · screen | What it justifies |
|---|---|---|
| R1 | [Plausible · realtime stats](https://mobbin.com/screens/fc6d3dbf-987e-4479-8cfe-a1c683008e64) | live dot beside a stat tile; tiles in one segmented strip |
| R2 | [Supabase · Realtime reports](https://mobbin.com/screens/8cb671de-6c75-4358-96e6-21e36eb3243d) | "last 60 minutes" realtime range, mint step-bars, empty-state wording |
| R3 | [Searchable · AEO dashboard](https://mobbin.com/screens/34b4a165-3965-4465-8c21-6e07ba6f3f62) | dense tile + table density, delta with sign |
| R4 | [Delphi · Insights](https://mobbin.com/screens/81ecd65b-c4a3-4827-b2a3-359105f4a145) | one big light numeral per tile, progress under it |
| R5 | [Plain · Insights breakdowns](https://mobbin.com/screens/72526f03-b98d-4df9-8c99-27e59a321ccc) | per-category thin bars with value at the right |
| R6 | [Base44 · Analytics](https://mobbin.com/screens/edec3865-59d0-4f6a-b4c3-d685fbdc6f92) | tabbed stat strip above one area chart |
| R7 | [Unify · Usage](https://mobbin.com/screens/34bc05a5-e664-4772-9308-462fde6a7c01) | `385 / 500 used` meter, usage by seat table |
| R8 | [Base44 · Credit usage](https://mobbin.com/screens/214cd277-2b79-4f21-917f-1f4e225f07ed) | meter + daily bars, `available` figure at right |
| R9 | [Gumloop · Usage and limits](https://mobbin.com/screens/690a3101-806b-4ddb-b670-0bc190897916) | bar chart over a usage log table |
| R10 | [Mintlify · Usage](https://mobbin.com/screens/bace818b-24f4-4136-9a81-b3d176d1556a) | `used / included` with reset date, overage alerts |
| R11 | [Gumloop · Insights](https://mobbin.com/screens/95548930-658d-49e0-bf4d-6436f9aaadf6) | `Credits remaining 12.7k of 20.0k` bar in the sidebar |
| R12 | [hilos · Usage remaining](https://mobbin.com/screens/9451f28e-56c1-4401-802c-a20c8eaa0b51) | tinted status tiles, remaining-credits modal |
| R13 | [Stripe · Meter usage](https://mobbin.com/screens/837a1c85-1863-4e88-b896-2b613a5b5333) | two meters side by side with an alert bell |
| R14 | [Miro · Timeline view](https://mobbin.com/screens/0e0bae61-13e4-40e6-a0f3-7d9b37bc06b8) | "today" marker, dashed milestone verticals, diamonds |
| R15 | [Base44 · Milestones](https://mobbin.com/screens/aa7aea9d-42a2-4900-91fd-9ba2e8e1be19) | one bar per level with a checklist beneath |
| R16 | [Plane · Work items Gantt](https://mobbin.com/screens/a48ea42b-7e0b-446e-b159-234596d2e253) | week columns, current-day highlight band |
| R17 | [Basecamp · How far along are we](https://mobbin.com/screens/ff982ddf-c752-47b1-a88b-af037dde8cae) | On track / Some risk / Concerned scale and a gauge |
| R18 | [Cofounder · How to build a company](https://mobbin.com/screens/79463fb7-052d-4a6f-ba53-d59ffe8a4851) | stage columns with a status tick per card |
| R19 | [Upwork · Milestone timeline](https://mobbin.com/screens/c4c4b551-666e-415a-8b79-35a5042e0bdb) | milestones remaining / paid as a row of figures |
| R20 | [Base44 · Launchpad voting](https://mobbin.com/screens/13c3cd28-8c1d-414b-85a5-0382bedbf19e) | `Voting ends in 06d 02h 38m 21s` countdown with recent activity beneath |
| R21 | [Customer.io · Scheduled send](https://mobbin.com/screens/a9543e20-593d-44ed-b543-172185d22dc5) | `Time remaining 1 day 13 hours 49 minutes 55 seconds` in plain units |
| R22 | [MagicPath · Break timer](https://mobbin.com/screens/b98e6a4b-7b76-45c7-b938-ea889134bd76) | circular countdown ring |
| R23 | [Plane · Recent activity](https://mobbin.com/screens/66f35733-2957-45ee-b424-b991b2ce4d4f) | one-line activity rows with relative time |
| R24 | [Basecamp · Latest activity](https://mobbin.com/screens/b71d21b5-1078-44a4-adb3-9583531a6059) | day-grouped timeline with "1 person active" |
| R25 | [Devin · Session](https://mobbin.com/screens/8a2e6a33-0453-4091-8c92-3bf960adec85) | agent step list, `Worked for 11s`, passed badge |
| R26 | [Replit · Agent log](https://mobbin.com/screens/d7fb8b32-04b6-45e4-a491-dab311db27fa) | agent actions with durations, checkpoint rows |
| R27 | [Wix · Marketing plan with Contents](https://mobbin.com/screens/c333015a-3112-4e7e-b82b-d20448cc2cb3) | document page with a Contents rail and a last-edited meta |
| R28 | [incident.io · Post-incident review](https://mobbin.com/screens/6f5d41f7-2f35-4eb1-bae4-96d0a09df8a2) | document with status chip and a serif title |
| R29 | [Plane · Pages](https://mobbin.com/screens/7f56d55a-93ed-4b37-9980-e81794b3dbd1) | centred reading column, numbered headings |
| R30 | [Searchable · Content editor](https://mobbin.com/screens/ccdced58-698c-4b1b-91b7-fcceecf33471) | left contents list that follows the document |
| R31 | [Canva · Presenter view](https://mobbin.com/screens/597fac49-7dbf-496d-9650-7dafa9f16bcd) | large slide plus a filmstrip and a timer |
| R32 | [Gumloop · Deck viewer](https://mobbin.com/screens/f372f436-44e0-42d4-8d94-1fe49a0a39a5) | HTML deck in a viewer with `01 / 03` and arrows |
| R33 | [Gemini Notebook · Slides](https://mobbin.com/screens/29318eb0-90f2-4ff5-8fe6-241b28364aaa) | slide with a vertical thumbnail rail |
| R34 | [Plane · Release](https://mobbin.com/screens/ac2810a2-a05e-4579-b3e9-906736cd6ddd) | release status chip, `1/4` progress bar, activity list |
| R35 | [Replit · Published](https://mobbin.com/screens/b9011f24-7710-4c2e-83c8-5a36b631e366) | "project is live" with a copy-link row |
| R36 | [WeTransfer · You're live](https://mobbin.com/screens/b6323600-691d-42e4-94ef-47fab0b504bb) | `Live` badge and the URL with a Copy button |
| R37 | [Base44 · Published](https://mobbin.com/screens/99190c15-95c7-4ff6-89d5-a1574742aee7) | published URL with copy and open icons |
| R38 | [Square · Workday](https://mobbin.com/screens/9eba6531-f7ba-44e9-b6c0-07ccf28d85c8) | per-person swimlane on a time axis (agent lanes) |

38 references. Searches run: realtime dashboards, usage/billing meters, project timelines, countdowns, activity feeds, document pages, deck viewers, deploy status (8 queries, web platform, mode standard). Not found as a good match on Mobbin: a countdown dashboard hero. The countdown rules (section 4.3) combine R20, R21 and R22 with the project's own deadline logic.

## 9. Hand-off checklist for Ren

- [ ] Tokens as CSS variables (section 2), light and dark, plus the motion tokens (4.1).
- [ ] One `sample-data.js` (section 6), shared by all three drafts, sums intact.
- [ ] Every tile has a source chip; the top bar has `SAMPLE DATA`.
- [ ] The countdown reads the real clock and honours `?now=`.
- [ ] A simulated update every 4 to 8 s plays the number-change motion.
- [ ] `prefers-reduced-motion` and the manual toggle work.
- [ ] 390 px and 1440 px both checked; keyboard focus visible.
- [ ] Not verified by Design: any draft's real rendering. Pix reviews the drafts by eye at 1440 and 390, light and dark, before the founder picks.
