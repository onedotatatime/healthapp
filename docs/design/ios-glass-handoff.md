# iOS glass redesign: hand-off spec (MIN-4586 → MIN-4587, MIN-4588)

Pix Elidis, 2026-11-14. Parent story: MIN-4585. Brand: `docs/brand/brand-guidelines.md` (section 11 is the glass layer), tokens: `docs/brand/tokens.css` (section 6).

| What | Where |
|---|---|
| Working picture of every rule below (open it in a browser, `?screen=<id>` shows one screen) | `docs/design/min-4585/mockups.html` |
| The same rules as CSS, written against the app's own class names | `docs/design/min-4585/reference.css` |
| Renders, 2x, 390 x 844 (workspace also 390 x 1900 and 1280 x 900) | `docs/design/min-4585/shots/*.webp` |
| Figma | https://www.figma.com/design/5jgmJHOs9AWAEjv4R3xN5I page "iOS glass (MIN-4585)", collections "Brand (Pathien)" and "Glass (MIN-4586)" |
| Graphics | `public/brand/` (list in section 8) |

**Three things that do not change.** Every route in `src/App.tsx`. Every `data-testid`, on an element that still exists and is still visible when it was before. Every word on every screen. The mockups hold sample data; where a word in a mockup is not in the app today (for example a list row's sentence), it is a placeholder, and the app's word stays.

`reference.css` is a picture of the spec, not app code. Port the values and rules into `src/styles/` and the feature CSS files; do not import the file.

## 1. Before anything else: three token names that collide

`docs/brand/tokens.css` and `src/styles/tokens.css` use the same names with different values. Importing the brand file over the app without renaming breaks spacing silently.

| Name | Drop 0 value | Brand value | Do this |
|---|---|---|---|
| `--space-6` | 24px | 32px | Rename uses in `src/` in this order: `--space-6` → `--space-5`, then `--space-8` → `--space-6`, then `--space-12` → `--space-7` |
| `--space-8` | 32px | 64px | as above |
| `--space-12` | 48px | not defined | as above |
| `--radius-sm` | 4px | 16px | No use of 4px survives; see the radius rows in section 2 |
| `--ink` | #12303A | #12201F | Takes the brand value. The app should use `--color-text` |

## 2. Token mapping: every token in `src/styles/tokens.css`

| Drop 0 token | Replace with | Note |
|---|---|---|
| `--paper` | `--color-bg` (air) plus the ambient ground | Section 3 |
| `--surface` | `--glass-card` for a card, tile or list card on the ground; `--color-surface` (white) where the text is long or the thing is an input | |
| `--surface-2` | `--color-surface-quiet` (mist) | |
| `--ink` | `--color-text` | |
| `--ink-2` | `--color-muted` | Muted text straight on the ground is 4.91:1; fine at 16px and up |
| `--line` | `--color-border` (ink 8%) | Dividers only |
| `--line-strong` | `--color-border-strong` (#6B7C7A) | Control edges; 4.07:1 at worst on card glass |
| `--teal` as a fill that carries a label (`.btn.primary`, `.btn.primary.pick`, `.mark.verified`, `.mark.status.ready`, `.saved`) | `--color-primary` (mint) with `--color-on-primary` (ink) text | **Never white text on mint (1.52:1).** `.btn.primary.pick{color:#fff}` goes |
| `--teal` as a dark fill under white (`.chip[aria-pressed='true']`, `.mx-switch[aria-checked='true']`) | `--color-link` (teal-600), white on it 5.47 | |
| `--teal` as a graphic (timer fill, spinner arc, `.bar i`, focus rows) | `--color-link` | |
| `--teal-text` | `--color-link` | Not as small text on chrome glass or straight on the ground (section 4) |
| `--teal-tint` | `--color-surface` for the citation chip (the brand's source chip is white); `--color-surface-quiet` for focused rows (`tr[data-focus]`, `.as-quote[data-focus]`); `--color-success-bg` for `.saved` | |
| `--slate`, `--slate-tint` | `--color-info` (teal-night) on `--color-info-bg` (mist) | Decision A |
| `--amber-bg`, `--amber-ink` | `--color-caution-bg` (peach) with ink text and a 1px `--color-flag-text` edge; for "outside the printed range" the flag chip | Decision B |
| `--red-bg`, `--red-ink` | `--color-surface` with a 1.5px `--color-flag-text` (coral-900) edge and icon, ink text | Decision C |
| `--night`, `--night-ink`, `--night-ink-2` | `--color-inverse-bg` (teal-night), `--color-inverse-text` (white), `--night-ink-2` (#BBC8C9) | Decision D |
| `--helix-patient`, `--helix-doctor`, `--qr-ink` | `--mint`, `--coral`, `--ink` on a solid white card | Decision D |
| `--font-sans` | `--font` (Manrope 400/500/600/700 from `@fontsource/manrope`, no CDN) | |
| `--font-mono` | removed: `--font` with `font-variant-numeric: tabular-nums` | Decision E |
| `--text-patient-body` 18/27 | `400 18px/1.5 var(--font)` | Stays 18: the patient reads this at arm's length |
| `--text-patient-value` | `600 20px/1.4 var(--font)`, tabular | |
| `--text-doctor-body` 15/22 | `400 16px/1.5 var(--font)` | The brand's floor is 16 |
| `--text-doctor-value` | `600 16px/1.5 var(--font)`, tabular | |
| `--text-h1` 28/34 | `600 32px/1.1 var(--font)`, -0.03em | The large title |
| `--text-h2` 22/28 | `600 24px/1.2 var(--font)`, -0.03em | |
| `--text-label` 14/20 | `600 14px/1.3 var(--font)` | Chips, marks, labels, tab labels. Nothing else under 16, except chart ticks at 12 |
| `--text-timer` | `600 20px/1.4 var(--font)`, tabular | |
| `--text-code` | `600 28px/1.3 var(--font)`, tabular, letter-spacing .12em | |
| `--space-1` to `--space-4` | same names, same values | |
| `--space-6`, `--space-8`, `--space-12` | `--space-5`, `--space-6`, `--space-7` | Section 1 |
| `--radius-sm` 4, `--radius-md` 8 | `--radius-sm` 16 (notes, strips, rows inside a card, the scan frame); `--radius-image` 24 (list cards, tiles, photos, textarea, empty state); `--radius-card` 32 (cards, sheets, the sign-in card) | Only the brand's steps |
| `--radius-pill` | same | Buttons, inputs, chips, marks, the tab bar |
| `--tap-patient` 48 | button 52, input 56; nothing interactive under `--target-min` 44 | |
| `--tap-doctor` 44 | `--target-min` 44 | |
| `--focus` 2px ink | `--focus-ring` 3px teal-600, offset 3px; white on teal-night | 3.78:1 at worst on chrome glass (needs 3) |

### The five decisions, each with its reason

- **A. The doctor's slate tone goes.** The brand page has one palette for one product. Where slate marked "this is a note about the data" (`.as-strip`, `.mx-label`, `.sim-label`, `.ot-band`), use the brand's info pair: teal-night on mist, 10.90:1. `.sim-label` becomes teal-night with white text (12.30).
- **B. Amber becomes peach, with ink text.** The brand has no amber; it has peach as its chip tint, and ink on peach is 12.78. A caution keeps its icon, its words and a 1px coral-900 edge, so it never rests on colour. "Outside the printed range" is not a caution: it is the brand's flag chip, a coral dot and the words in coral-900 on coral 12% (5.67), with no warning triangle (the brand page: "never an alarm icon").
- **C. No red, including doctor-side errors.** The brand page lists "Red anywhere" as a don't. An error is a white note with a 1.5px coral-900 edge and icon and ink text; coral-900 on white is 6.73. What makes it an error is the icon, the words and `role="alert"`, which `ErrorNote` already has.
- **D. The night scene stays, in teal-night.** A dark surround helps the doctor's camera find the QR, so the scene keeps its job and takes the brand's dark colour. The patient's strand is mint and the doctor's is coral: two brand fills that differ in hue and in lightness (8.08 and 4.90 on teal-night, graphics need 3). The QR card stays solid white with ink modules: no glass, no tint, nothing that could cost a scan.
- **E. Mono goes; Manrope with tabular figures.** The brand page asks for one family and tabular numbers. Digits still line up in columns, which was the reason for the mono. The typed code gets .12em tracking so its characters stay apart. Check once in the build that Manrope's `tnum` is on (two rows of digits must align); if it is not, tell me.

## 3. The shell

**Ground.** One fixed layer behind the app: `bg-ambient.webp` at 70% 40%, cover, under `--ambient-veil`. Use a fixed element (`.app-bg`), not `background-attachment: fixed` (iOS Safari ignores it). The sign-in screen shows the image without the veil. The share scene has no ground: it is teal-night.

**Patient tab bar** (`.tabbar`). A floating chrome-glass pill, 64 high, 12px from each side, bottom `max(12px, env(safe-area-inset-bottom))`, max width 456. Three tabs, each the exact title of its screen:

| Tab | Route | Icon (Phosphor, bold) | `aria-current="page"` on |
|---|---|---|---|
| Your record | `/patient` | FolderSimple | `/patient`, `/patient/exams/*` |
| Add symptom | `/patient/diary` | PlusCircle | `/patient/diary` |
| Who had access | `/patient/access` | Eye | `/patient/access` |

Three and not five because the label style is 14px and five labels do not fit at 390; "Scan an exam" and "Share with a doctor" are actions, and they are the two tiles at the top of the home screen. The active tab is a mint capsule with ink icon and label; inactive tabs are ink. The bar shows on every patient route except `/patient/share`. A `div.tab-fade` (aria-hidden) sits under it so content fades out before the home indicator. Page bottom padding: tab bar + safe area + 48.

**Large titles.** Tab destinations and the two home screens: the `h1` is the large title (32px), first thing in the page, with `env(safe-area-inset-top) + 12px` above it. No bar on those screens.

**Navigation bar** (`.navbar`) on pushed screens only (`/patient/exams/add`, `/patient/exams/:id`, `/patient/exams/:id/review`, `/doctor/connect`): sticky chrome glass, 52 high plus the top safe area, one 44 x 44 back control (CaretLeft, `aria-label` "Back to your record"; on the doctor side "Back"). The screen's `h1` stays in the page under it. The existing "Back to your record" and "See my exams" links stay where they are (they are selected by tests or by people).

**Sheets** (`.sheet`): bottom, top corners 32, a 36 x 5 grabber (decorative), `--shadow-card`, over a teal-night 35% scrim. Two uses:
1. The patient's request screen (`[data-testid="share-asking"]`): chrome glass over the scrim over the plain ground. The mockup shows the home screen behind it only to show the blur; do not build a fake home behind it.
2. The doctor's source viewer (`.as-sheet`) under 900px: a bottom sheet, 92dvh at most, **solid white** (long reading and a photo). From 900px it stays the right side sheet, solid white, starting under the timer.

The citation popover (`.chip-card`) is solid white, radius 16, `--shadow-soft`.

**Doctor side.** No tab bar (two places). `/doctor`: large title, then the entry bar as a floating chrome-glass pill holding the mint "Connect to a patient" button, in the tab bar's position. Workspace: the access timer is the top bar, chrome glass, sticky, with the top safe area inside it. At 390 the panels are cards in one column; from 900px two columns (2fr 3fr) inside a 1120 max width.

**Safe areas.** `index.html` already has `viewport-fit=cover`. Top: inside the nav bar, the timer, or the page's top padding. Bottom: the tab bar, the entry bar and every sheet. Side padding 16.

## 4. Where glass goes, and where it does not

Full table and the measured pairs: brand guidelines section 11. The parts that change code:

- Chrome glass (`--glass-chrome` + `backdrop-filter: var(--glass-filter)`, with the `-webkit-` prefix): `.tabbar`, `.navbar`, `.sheet`, `.timer`, `.hs-entry`, the sign-in card. Nothing else gets a `backdrop-filter`. The mockups have two blurred surfaces on a screen at most; keep it under four.
- Card glass (`--glass-card`, no blur): `.card`, `.tile`, `.record-link`, `.group`, `.empty`, `.mx-optin`, `.mx-panel`, `.ot-series` container, and the default (ghost) `.btn` fill.
- Solid white: `.rows` (results), the assistant's answers and thread, `.as-sheet`, `.chip-card`, every input, the QR card.
- **No blur over the live camera** (`.hs-scan video`) or over `.thumb` and `.photo img`; nothing translucent may overlap them.
- Teal-600 text: fine inside a card or on white. On chrome glass (`.timer .btn`, buttons in a sheet or the sign-in card) the ghost button's edge and label are ink. A bare link on the ground is ink with an underline.
- `.timer.soon` is `--glass-caution` with ink text and a coral-900 fill bar; `.timer.ended` is `--glass-quiet` with ink text.
- Fallbacks are already in `docs/brand/tokens.css`: under `prefers-reduced-transparency: reduce`, and without `backdrop-filter` support, the glass tokens turn solid. Add `.app-bg{background:var(--color-bg)}` under the same media query. `prefers-reduced-motion: reduce`: keep the app's existing global rule.

## 5. Components, mapped to the code

| Component | In code | Spec |
|---|---|---|
| Button | `.btn`, `.btn.primary`, `.btn.block` (app.css) | Pill, min height 52, padding 0 28, 600 16px. Primary: mint, ink label; hover mint-hover, lift 1px, `--shadow-btn-hover`. Default (ghost): 1.5px teal-600 edge and label on card glass; hover white. Small (`.as-btn`, `.row-actions .btn`, timer): 44. Disabled: opacity .6. Icon 22 |
| Input | `.field input`, `.field textarea` | Solid white, 1.5px `--color-border-strong`, pill, 56 high, padding 0 24; textarea radius 24. Label 14/600, 16px indent. Invalid: 2px coral-900 edge plus the existing `.err` line in coral-900 |
| Card | new `.card`; `.mx-optin`, `.mx-panel`, the workspace panels | Card glass, radius 32, padding 24 20, 1px `--glass-edge`, `--shadow-soft` |
| Grouped list | new `.group` (diary rows, access rows, the access link, sign out) | One card, rows min 56, ink 8% hairline between rows, a CaretRight at the end of a row that navigates |
| List card | `.record-link` (exams.css) | Card glass, radius 24, padding 16 20, gap 4. Title 20/600, dates 16/500 muted |
| Tile | new `.tile` around `add-exam-link` and `entry-link` on the patient home | Two columns, gap 12, min height 104, radius 24, icon 26 top, label 16/600 bottom. Scan: mint. Share: card glass with a teal-600 icon |
| The four marks | `.mark.verified` / `.uploaded` / `.edited` / `.name-match`, `.unchecked` (app.css) | Pill, min height 28, 14/600, ink label and the same icons. Verified: mint fill. Uploaded: no fill, 1px field-border edge. Edited: mist fill, field-border edge. Name match only, Not checked: peach fill, 1px coral-900 edge. Meanings and words unchanged |
| Status chip | `.mark.status.*` (exams.css) | neutral: as Uploaded. ready: mint. saved: as Edited. caution: as Not checked |
| Flag | `.oor`, `.oor-count` | Coral 12% pill, 8px coral dot, words in coral-900 14/600. Drop the Warning icon in `OutOfRange` (the dot replaces it). `.check-this`: peach pill, ink, coral-900 edge |
| Citation chip | `.chip`, `.chip-card` (app.css) | White, 1px teal-600 edge, teal-600 number 14/600, 28 high; keep the `::after` hit area (48 x 48). Pressed: teal-600 fill, white. Card: white, radius 16 |
| Access timer | `.timer*` (app.css) | Chrome glass bar; time 20/600 tabular; track ink 14%, fill teal-600; states in section 4 |
| Notes | `.note`, `.note.caution` (Primitives `ErrorNote`) | Radius 16, 16px ink text. Error: white, 1.5px coral-900 edge. Caution: peach, no edge. An icon (WarningCircle, 22) in front of the children is welcome but not required |
| Spinner, empty state | `.spinner`, `.empty` (Primitives) | Spinner arc teal-600 on a skeleton ring. Empty: card glass, 1.5px dashed field-border, radius 24, muted text |
| Saved banner | `.saved`, `.scan-saved`, `.scan-count` | Mint fill, ink, radius 24; the count is a white pill. **Scope it as `.saved:not(.mark)`:** today `.saved` also styles the "Saved" status chip (`.mark.status.saved`) and makes it twice the size of the other chips |
| Fixed line | `.fixed-line` | Mist block, teal-night text, radius 16, no left bar |
| Switch | `.mx-switch`, `.mx-knob` | 64 x 44, off: mist with a field-border edge and an ink knob; on: teal-600 with a white knob |
| Tab bar, navigation bar, sheet | new | Section 3 |

Motion: 0.2s ease-out (`--dur-fast`, `--ease-out`) on colour and the 1px lift; a sheet slides up in 0.4s (`--dur-step`), transform only. The blur itself never animates.

## 6. Screens

| Screen | Mockup | Notes |
|---|---|---|
| Sign in (`/login`) | `login` | Ground without the veil. One chrome-glass card: the lockup (150 wide, `public/brand/pathien-lockup.svg`, inside the card so it never sits on the petal), the `h1`, the text, the field, the buttons. The label "Demo passcode" stays the input's label |
| Patient home (`/patient`) | `patient-home` | Large title, "Signed in as", the two tiles (`add-exam-link`, `entry-link`: the same links, moved next to each other; moving them in the markup is in scope), `h2` My exams, the list cards, `h2` Your diary as a grouped list, the access link as a grouped row, the matches card, sign out. `EntryBar` no longer floats on this screen |
| Scan (`/patient/exams/add`) | `scan` | Pushed. The saved banner, the text, one card with the two pick buttons ("Take a photo" 64 high: it is the action of direction 1), "See my exams" as a ghost button. The saving and failed states use the same card; `.thumb` radius 24, never under glass |
| Record (`/patient/exams/:id`) and review | `record` | Pushed. Title, meta, the marks, the photo (radius 24), `h2` Results as one solid white card with hairlines between results; the value is 20/600 ink, the printed range muted, the flag chip under it. The fixed line, then Unconfirm as a ghost button. Review: the same card with the inputs; from 760px the two columns stay |
| Add symptom (`/patient/diary`) | `diary` | Tab destination, large title, the form in one card, the emergency line under it in ink-soft |
| Who had access (`/patient/access`) | `access` | Tab destination, large title, a grouped list. The "Back to your record" button stays |
| Share, the code (`/patient/share`) | `share` | Teal-night, no tab bar. Title 24, the helix in mint and coral, the solid white QR card (radius 24, 20 padding), "valid" line, the code, the ghost button in white, the two links in `--night-ink-2` |
| Share, the request | `share-asking` | The sheet, section 3. Approve is mint, Decline is the ink-edged ghost |
| Share, running and ended | none | Timer bar (patient) on top, then the page as a card screen. Follows the patterns |
| Doctor home (`/doctor`) | `doctor-home` | Large title, the empty state, sign out (small ghost), the floating entry bar |
| Connect (`/doctor/connect`) | `doctor-connect` | Pushed. The camera box (teal-night, radius 24, mint frame, no glass), then one card with the typed code and its button |
| Workspace | `doctor-workspace` (390, 390 full scroll, 1280) | Timer bar; title; each panel a card: the overview lists, About this file (`dl`: one column under 520), the ask form on solid white with the info strip, Over time (chart: ink line, dashed projection, mist band, ticks 12px muted, no colour for good or bad), Possible matches (info strip, mist group blocks, source-style chips) |
| `/kit`, `/demo`, `/simulation`, `/preview/*`, `/s`, `/health` | none | Follow the patterns. `/simulation`: `.sim-label` teal-night with white text; chart cards are `.card` |

## 7. Title, icon, theme colour (`index.html`, `public/manifest.webmanifest`)

- `<title>` and the manifest `name` and `short_name`: Pathien.
- `theme-color`, manifest `theme_color` and `background_color`: #F7FAFA.
- Icons: `public/brand/favicon.svg` (browser tab), `public/brand/pathien-app-icon.svg` (manifest, `any`), `public/brand/apple-touch-icon.png` (`<link rel="apple-touch-icon">`). The icon ground is air, never teal (brand section 9).
- Status bar on the Home Screen: leave `apple-mobile-web-app-status-bar-style` at its default. `black-translucent` would put white status text over a light app.

## 8. Graphics

No image was generated: everything needed already existed. fal: 0 generations.

| File | From | Use |
|---|---|---|
| `public/brand/bg-ambient.webp` (18 KB, 1920 x 1200) | `landing/public/img/bg-hero.webp`, the site's petal background | The ground |
| `public/brand/pathien-lockup.svg`, `pathien-lockup-white.svg`, `pathien-symbol.svg` | `docs/brand/logo/` | Sign-in card; white version for teal-night if needed |
| `public/brand/favicon.svg`, `pathien-app-icon.svg`, `apple-touch-icon.png` | `docs/brand/logo/`, `landing/public/brand/` | Section 7 |

## 9. What I checked, and what I did not

Checked, in the mockups rendered by headless Chrome at 390 x 844: no horizontal overflow on any of the 11 screens; no clipped label in a tab, button, mark or tile; every link, button and input at least 44 x 44 (the citation chip is 32 x 28 to the eye and 48 x 48 to the finger); one or two blurred surfaces per screen; Manrope 600 on every title; the contrast pairs in brand section 11, computed from the composited colours; the reduced-transparency look, by turning the tokens solid (`?screen=patient-home&rt=1`). By eye, at full size: the 14 renders.

Not checked: a real iPhone, in Safari or from the Home Screen (the safe areas are simulated at 47 and 34); scrolling speed on a phone; the real `prefers-reduced-transparency` query; the focus ring by eye on each surface; the workspace at 1280 below the first screen; `/kit`, `/demo`, `/simulation`, the review screen and the share "running" and "ended" states, which have no mockup; whether Manrope's tabular figures are on in the `@fontsource` build.

## 10. Ask me when

- A label does not fit a tab or a tile at 390 with real data.
- A screen needs a word that is not in the app (that is a `Q ·` issue to Anna, through me).
- The founder's phone shows a white or black strip in the status bar from the Home Screen.
- Any pair measures under AA in the built app: send me the two computed colours.
