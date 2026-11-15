# /story deck: layout spec (Design, for Ren)

Founder request 2026-11-15 (six slides, one new deck, real-time frames). Builds on the web-deck engine in `landing/src/deck/` (Deck.tsx, deck.css, templates/). Words come from Anna (written in parallel), so every text box below has a length budget instead of copy.

Goal: supports direction 1 (the founder's own exams), 4 (analysis and projection) and 5 (matching).

## 0. Ground rules

- **Stage.** The engine canvas is **1920x1080** (`deck.css`, `Deck.tsx` W/H), not 1600x900. Keep it; do not add a second canvas. All numbers below are engine px. For a 1600x900 render multiply by 0.8333 (a 28px body line is 23px at 1600).
- **Margins.** 120px left and right (content 1680 wide), as every other slide. Eyebrow at top 54 (22px caps, 600, .1em, teal; mint on night). Content zone is y 122 to 950.
- **Fonts.** Manrope only (`Manrope Variable`). Plus Jakarta Sans exists only inside the outlined logo SVGs; load no second font.
- **Type scale in use** (already in deck.css, nothing new except the two big numbers): headline xl 66 / lg 64 / sm 56 (the `Headline` util steps down by length); big headline 132 (slide 6 only); body 28/36; small 22; caps 22 .09em; stat 112/800; **new: 240/700 for the two "Did you know" numbers**. Tracking -.04em on display, -.01em on body (tokens `--track-display`, `--track-body`).
- **Colour.** Tokens only: air `#F7FAFA`, mist `#EAF3F2`, ink `#12201F`, soft `#4A5D5B`, mint `#7FE3CF`, teal `#0F766E`, night `#0B3B3D`, coral `#F4846B` (the path's dot only), peach `#FFD9C7` (tags), skel `#DCE8E7`. No red, no gradient, no trademark sign, no insurer anywhere.
- **Entry.** `landing/story/index.html`, copy of `landing/deck/index.html`, plus a second input in `vite.config.ts`. `<meta name="robots" content="noindex, nofollow">`, no sitemap entry, no link from the landing. `slides.story.ts` copies the `Slide[]` shape.
- **Slide order and ids.** `1`, `2`, `3` (beats `3a`, `3b`), `4`, `5`, `5b`, `6`. The counter reads 1 to 6; `5b` carries `counter` like the existing `6b` so the founder's six stay six.
- **Chrome.** Story slides drop the `.slide-foot` and the bottom-right `foot-lockup` (the path rail owns the bottom strip). The Pathien lockup (150px wide) sits top right at `right:120; top:58`, where the counter sits today. Slide 1 and 6 use the big lockup instead.

## 1. The motif: the teal path (persistent layer)

It is the logo's own gesture (the p's foot becomes a straight path that ends in one dot), used as a timeline from Lefteris in 2019, through today, to "what if".

- **One persistent SVG** inside `.frame`, outside the `.slide` sections (so it survives slide changes and animates between them), `viewBox 0 0 1920 1080`, `pointer-events:none`, above slide backgrounds.
- **Rail:** horizontal line at **y=1008**, from x=120 to x=1800, stroke 6px, round caps. Colour teal `#0F766E` on air and mist slides, mint `#7FE3CF` on night (crossfade .4s with the slide theme).
- **The dot:** circle r=11, coral `#F4846B` (4.9:1 on night, decoration only, never the carrier of meaning). It is the end of the drawn line, like the logo.
- **Waypoints (dot x):** slide 1 = 120, slide 2 = 520, slide 3 = 960, slide 4 = 1280, slide 5 = 1480, slide 5b = 1640, slide 6 = 1800.
- **Drawing:** on every slide change the line extends (or retracts) to the new waypoint and the dot rides the end, 0.8s, `--ease-out` (`cubic-bezier(.22,1,.36,1)`, the expo-out feel of Lenis). Implement with `pathLength=1` and `stroke-dashoffset`, not width animation.
- **Two textures, one meaning.** Up to x=960 ("Today") the line is solid: what happened. From 960 to 1640 the line is a dotted stroke (`stroke-dasharray: 2 16`, round caps): what if, not yet true. On slide 6 the dotted part cross-fades to solid (0.8s) while the dot arrives at 1800: what-if becomes the live thing you can try. Two overlaid paths, opacity swap; no dash animation.
- **Labels** under the rail at y 1020 to 1046, 22px caps 600 .09em, `soft` on light, `#A9BDBC` on night, the active one ink (teal on night: mint): `2019` at x=520, `Today` at x=960, `What if` at x=1280 (spans 4, 5, 5b), `Live` at x=1800 (right aligned). A 2x14 tick above each label.
- **Pulses:** dot scales 1 to 1.6 to 1 (0.8s, once) on slide 3 beat b and when slide 6 lands. Nothing loops.
- **Reduced motion:** no drawing; the rail snaps to the waypoint in .01s (the tokens already collapse to .01s).
- **Guard:** keep every slide's content above y=950. The rail strip is y 996 to 1050.

## 2. Motion, all slides (the Lenis feel, in a key-driven deck)

The deck has no scroll, so "Lenis feel" means the same easing, the same durations and no overshoot. Reference: `brand-guidelines.md` section 7.

- **Ease:** `--ease-out` everywhere. No bounce, no spring, no parallax, no scrub.
- **Slide change:** outgoing slide opacity 1 to 0 and y 0 to -24, 0.4s; incoming opacity 0 to 1 and y 24 to 0, 0.8s, starting at 0.2s into the exit. This needs both slides mounted for ~0.6s (today `.slide{display:none}`): keep the outgoing one mounted with `aria-hidden` until its exit ends. Do not unmount the slides that hold iframes (see section 9).
- **Inside a slide:** blocks fade-up 24px once, 0.8s, stagger .1 (eyebrow, headline lines, body, visuals in that order).
- **Wheel and trackpad:** do not bind them (inertia fires several slides per gesture). Keys and click only, as the engine does.
- **Reduced motion:** opacity only, .01s (the engine tokens), no y movement, no paper landing, no pulse.

## 3. Slide by slide

### Slide 1 Intro (template: `cover`, almost unchanged)

- Theme air, `bg-hero.webp` background, same eyebrow slot (Anna: keep the event line, 70 chars max).
- **Headline** in the `cover-h1` slot, 86px/80, 700, -.045em, left 120, top 186, width 1030: "Hi, I'm Lefteris." (one line). Under it a sub line, 40px/48, 500, ink, same left, top ~300: "Product builder, based in Athens." (50 chars max).
- **Details** (founder said "some details about me"): 3 rows at left 120, top 420, each a 22px caps teal label + 28px value, 20px apart, width 900. Budget: label 14 chars, value 50 chars. Anna decides which three (role, what I build, why this).
- **Photo:** `~/AppDevelopment/minhOS/public/lefteris.jpg` (793x793). Same box as the cover: left 1230, top 110, **560x700**, radius 32, `--sh` shadow, `object-fit:cover; object-position:50% 30%` (crops the square to 4:5, keeps the face). Export WebP q80 at 1120 px wide for crisp 2x; the 793 source is upscaled 1.4x at 1920 and is the only soft point. If the founder has a larger original, use it.
- **Foot:** lockup 360px at left 120, top 796 and a tagline (32/38, 500, 900 wide, 70 chars max), as the cover.
- **Path:** only the coral dot at x=120, y=1008 with one pulse; the line has not started.
- **Motion:** photo scales 1.04 to 1 and fades up in 1.2s; text fade-up stagger .1.

### Slide 2 "That's me in 2019, at the hospital" (NEW template `story-memoir`)

Theme **mist** (the desk); paper and photo stand out in white and photo colour.

Grid (engine px):

| Element | x | y | w x h | Notes |
|---|---|---|---|---|
| Hospital photo | 120 | 122 | 740 x 828 | radius 32, `--sh`, object-fit cover. One large photo. |
| Headline | 940 | 122 | 860 wide | 56/58, 700, -.04em, 2 lines max, 80 chars max |
| Body | 940 | 282 | 760 wide | 28/36, 400, 2 to 3 lines, 130 chars max |
| Spreadsheet A | 820 | 450 | 560 x 350 | rotate -2.2deg, behind B |
| Spreadsheet B | 1230 | 590 | 560 x 350 | rotate +1.6deg, on top, overlaps A by ~150 x 160 |

- Spreadsheets read as paper: 12px white border (`#fff`), radius 6, hairline `rgba(18,32,31,.08)`, shadow `--sh` plus `0 2px 6px rgba(11,59,61,.12)`. Sheet A also overlaps the photo's right edge by 40px (820 vs 860). Keep the sheets 16:10 crops of the densest, most readable part; they are texture and proof, not meant to be read from the room.
- Photo caption: 22px soft under nothing; instead a small chip on the photo bottom-left, inside, 24px from the edges: mist at 90%, ink 22px 600, "Athens, 2019" (Anna, 30 chars max). Photo alt text is Anna's, one phrase.
- **Placeholder until the assets land** (documented, never shipped): missing photo = skel `#DCE8E7` box with 2px dashed `#6B7C7A` border, centred 22px soft label "Photo: hospital 2019 · docs/story/assets/hospital-2019.jpg"; missing sheets = white paper with a fake grid (header row mint-soft, 9 rows of 16px skel bars) and the same rotation and shadow, label "Screenshot: spreadsheet 1 / 2". Each placeholder shows a peach `PLACEHOLDER` pill top-left. Ren: add a test that fails the production build if any placeholder renders.
- **Asset names to assume** (founder drops them in `docs/story/assets/`): `hospital-2019.jpg`, `spreadsheet-1.png`, `spreadsheet-2.png`; copy to `landing/public/story/`, WebP q80, long edge at most 1800. Confirm names when files arrive.
- **Motion:** photo fades up 24px (0.8s) and scales 1.04 to 1; sheet A lands 0.3s later, sheet B 0.45s: each from y +40 and an extra 3deg of rotation to its resting angle, 0.8s `--ease-out`, no bounce.
- **Path:** dot at x=520, label "2019" active.

### Slide 3 "That's me today" (NEW template `story-live`, two beats 3a and 3b, one slide)

Theme air. Headline `Headline` lg 64, full width, top 122, two lines max (about 80 chars). Zone for frames: y 276 to 932.

| Element | x | y | w x h | Notes |
|---|---|---|---|---|
| Browser frame (doctor, desktop width) | 120 | 276 | 1280 x 656 | bar 52, viewport 1280 x 604 |
| Phone frame (patient) | 1486 | 276 | 314 x 656 | 10px night bezel, screen 294 x 636 |
| Live badge, browser | in bar, right 16 | | 36 high | see section 5 |
| Live badge, phone | 1486, centred | 940 | 36 high | pill under the phone |
| Tag | 120 | 944 | | "Live demo · my own records", peach pill |

- **Iframes use fixed logical sizes so the app's breakpoints fire right:** doctor iframe `1280 x 604` at scale 1; patient iframe `390 x 844` with `transform: scale(.7536)`, `transform-origin: 0 0`, inside a 294x636 overflow-hidden screen with radius 36. Pointer coordinates survive the stage's scale transform in Chromium.
- Both frames show the founder's real records, by his choice. They are the working app (the screenshot he sent: doctor "Patients" empty state, patient "Your record").
- **Beat a** ("me today, still trying to work it out"): frames static and calm. Iframes loaded but `pointer-events:none`; click on the frames advances the deck like anywhere else. Badges read "Ready" (mist, no pulse).
- **Beat b** ("now with the tool, all my exams analysed"): the same slide, me acting.
  - Headline swaps: old text out (opacity to 0, y -24, 0.4s), new in (y 24 to 0, 0.8s, stagger .1 per line). The frames do not move or reload.
  - Badges become "Live" (mint fill, teal pulsing dot) with a 0.4s colour change.
  - Both frames gain a 3px teal ring (`box-shadow: 0 0 0 3px #0F766E, var(--sh)`, the brand focus ring) fading in 0.4s: the audience sees these are now hot.
  - Phone lifts: y -8 and scale 1.04 (origin centre), shadow from `--shadow-soft` to `--shadow-card`, 0.8s ease-out.
  - Iframes get `pointer-events:auto`; the stage's click-to-advance is disabled over the frames (cursor default). Path dot pulses once.
  - Key handling: see section 9, decisions 3.
- Hash: `#3` = beat a, `#3b` = beat b. Space or arrow advances beat then slide; back reverses.

### Slide 4 "What if my doctor can find similar rare cases and cross-check with a doctor in Brazil?" (template: `statement` with side `matches`, reused)

Theme air. Headline is about 90 chars: it lands on `Headline` `lg` (64px) or `sm` (56px) in two lines. Anna: keep at most 90 chars.
- Left `.st-main` (x 120, y 298, w 850): zero to two points, `numbered` style, 32/38, 500, 60 chars each. The question is the point; do not pad.
- Right: the existing `side-matches` SVG panel (770x620 at left 1030, top 290): the pattern box = "Similar cases", the Dr node = "Doctor in Brazil" (`contact`), opt-in toggle label as today. Carries the `Mock-up` tag (types.ts rule).
- No flags, no map clip-art. The teal spokes and the two Dr discs already read as "found one, ask the other doctor".
- **Motion:** spokes draw in sequence (0.8s, stagger .1), the Dr disc fades after; the right-hand disc is the last thing in. Path dot at x=1280, label "What if" activates (dotted line from here on).

### Slide 5 "What if people with similar symptoms could find a cure, together with their doctors, in a clinical trial?" (template `story-live`, single beat)

Theme air. The sentence is about 110 chars, too long for one line. It goes in a **left column 600 wide**, 52/55, 700, -.04em, up to 5 lines (about 290px tall), top 122. Anna: 115 chars hard cap.

| Element | x | y | w x h | Notes |
|---|---|---|---|---|
| Headline | 120 | 122 | 600 wide | 52/55, up to 5 lines |
| Browser frame (doctor "Simulate matching") | 800 | 150 | 1000 x 790 | bar 52, viewport 1000 x 738 |
| Tag | 120 | 890 | | peach pill `Working demo · synthetic data` (existing allowed tag) |
| Live badge | in bar, right 16 | | | |

- Iframe logical size **1280 x 945**, `transform: scale(.78125)`, origin top left: it renders the page at desktop breakpoint and fits 1000 wide. The simulation runs on 5,000 synthetic records, so the tag is the standard synthetic one, not the "my own records" one.
- Interaction: click-through enabled from the start (this is the matching demo he narrates); same hand-back rule as slide 3 beat b. The 3px teal ring is on from the start.
- **Motion:** the frame fades up and scales 0.98 to 1, 0.8s. No motion inside the slide chrome; the app's own simulation motion is the show.
- **Path:** dot at x=1480.

### Slide 5b "Did you know" (NEW template `story-bignumbers`)

Theme **night**, mint numbers on night (same look as the Funnel slide, `fn-big`). Eyebrow "Did you know?" (Anna).

Two columns split by a 2px vertical rule `rgba(127,227,207,.25)` at x=960 from y 250 to 900.

| Element | x | y | Notes |
|---|---|---|---|
| Left number "4.7" + unit "years" | 120 | 250 | number 240/.92, 700, -.05em, mint; unit 96/700, `#fff`, baseline aligned, 16px gap. Width about 800 |
| Left label | 120 | 560 | 36/44, 600, `#fff`, 760 wide, 80 chars max |
| Left source | 120 | 840 | 22/28, `#A9BDBC`, 760 wide |
| Right number "17.5%" | 1020 | 250 | same 240/.92, mint, width about 700 |
| Right label | 1020 | 560 | 36/44, 600, white, 760 wide, 80 chars max |
| Right climax line | 1020 | 700 | "≈ €3.5bn in Greece alone", 52/58, 700, white with "€3.5bn" in mint; one line, 760 wide |
| Right source | 1020 | 840 | 22/28, `#A9BDBC` |

- `font-variant-numeric: tabular-nums` on both numbers.
- Estimate rule (README 5): if Anna labels the 3.5bn "our estimate", that label stays on the same line at **52px**, same size as the figure, never a small footnote.
- Source lines carry the exact source and year (Anna supplies; existing deck cites OECD for 17.5%). Contrast `#A9BDBC` on night is about 8:1.
- **Motion:** numbers count up from 0 over 1.2s `--ease-out` (4.7 steps by 0.1, 17.5 by 0.1), left first, right 0.3s later; labels fade after. Reduced motion: final values at once.
- **Path:** dot at x=1640, mint rail.

### Slide 6 "Find me for a live demo" (NEW template `story-close`, night)

- Eyebrow "Live demo" (mint). **Headline** 132/130, 700, -.04em, on two lines on purpose: "Find me for" / "a live demo." (left 120, top 270, width 1100).
- **Contact block** left 120, top 640: profile photo circle 112 (same `lefteris.jpg`, `object-position 50% 30%`) at left, to its right 36/44 700 white name line and 28/36 `#A9BDBC` contact lines. Two lines max, 40 chars each. **Contact details are the founder's to supply; do not invent any.**
- **QR card** right-aligned to the margin: left 1560, top 280, **240 x 240**, white, radius 32, `--sh`, 20px padding. Use the existing `public/deck-qr.svg`, or a QR to the live app if the founder prefers; caption under it 22px `#A9BDBC` (Anna, 24 chars).
- **Lockup:** white version 300px wide, left 120, bottom area y 860.
- **Path:** the dotted segment turns solid and the dot arrives at x=1800, sitting right under the QR card's right edge; one pulse. "Live" label activates.
- **Motion:** headline lines fade-up stagger .1, QR card last. Nothing loops.

## 4. Visuals summary

| Slide | Template | Reuse or new | Visual hero |
|---|---|---|---|
| 1 | cover | reuse | portrait 560x700 |
| 2 | story-memoir | new | photo 740x828 + two overlapping sheets 560x350 |
| 3 | story-live | new | browser 1280x656 + phone 314x656 |
| 4 | statement / matches | reuse | matches panel 770x620 |
| 5 | story-live | new (same) | browser 1000x790 |
| 5b | story-bignumbers | new | 240px numbers |
| 6 | story-close | new | headline 132 + QR |

## 5. Frame chrome (browser, phone, Live badge)

**Browser frame.** Outer radius 24 (`--radius-image`), white surface, 2px border `rgba(18,32,31,.08)`, shadow `--sh`, overflow hidden. Top bar 52px high, background mist `#EAF3F2`, hairline below. Left: three 14px circles in skel `#DCE8E7`, 10px apart (no red, yellow, green: the brand has no red). Centre-left after the dots: an address pill, 36 high, radius 999, white, 20px `soft` text showing the **hostname of the iframe src** only. Right: the Live badge. The viewport below is the iframe.

**Phone frame.** 10px `night` bezel, outer radius 54, screen radius 44 (the engine's `.phone-frame` uses 84; that one is for a big phone, so re-derive for 314 wide). Small notch pill 60x10 in skel, top centre, over the screen. Screen white. No device brand, no buttons.

**Live badge** (pill, 36 high, 16px side padding, 20px/700 caps `.06em` ink):
- `Live`: mint fill, 10px teal dot with a pulse ring (scale 1 to 1.8, opacity .5 to 0, 1.6s loop; off under reduced motion). `role="status"`.
- `Ready`: mist fill, ink text, no dot movement (slide 3 beat a).
- `Screenshot`: skel fill, ink text, no dot (shown whenever the fallback is on screen). Honest labelling is not optional: never show "Live" over a picture.
- Tag pill beside or below: peach, 22/600 ink, as `.demo-tag`. Slide 3 needs a new tag text `Live demo · my own records`, so extend `DemoTag` in `types.ts` (today only `Mock-up` and `Working demo · synthetic data`).

## 6. Static fallbacks

Each iframe sits on top of its fallback `<img>`; the iframe fades in (opacity 0 to 1, 0.4s) only after the app reports ready; otherwise the image stays.

| Frame | Fallback file | Status |
|---|---|---|
| Slide 3 doctor, desktop | **new** capture `doctor-desktop-1280.webp` at 1280x604 logical (2560x1208 px), taken with the founder's records | needed; interim `docs/design/min-4585/shots/doctor-workspace-1280.webp` (1280x900) cropped to 1280x604 |
| Slide 3 patient, phone | `docs/design/min-4585/shots/patient-home.webp` (780x1688 = 390x844 at 2x) | exists, exact size, fits the 294x636 screen |
| Slide 5 matching | **new** capture `simulate-1280.webp`, 1280x945 logical | needed |

- `doctor-home.webp` is also 780x1688 (phone width), so it is a mobile fallback, not the desktop frame the founder asked for.
- Fallback triggers: no ready message within 5 seconds, iframe `error`, `navigator.onLine === false`, or `?static` in the URL (forced offline mode for a bad venue network). The badge flips to `Screenshot` in each.
- Alt text on fallback images describes the screen in one phrase ("Doctor's patient list, empty"). Iframes carry `title="Doctor view, live"` and so on.

## 7. Accessibility

- AA at minimum: teal on air and mist 5.2:1, mint on night 8.1:1, `#A9BDBC` on night about 8:1, white on night 12:1. Coral dot is decoration.
- Colour never carries state alone: Live/Ready/Screenshot are words plus a dot.
- Min target 44x44 for the "hand back" pill; focus ring 3px teal (white on night), never removed.
- Photos get alt text from Anna; the rail SVG is `aria-hidden`.
- Reduced motion handled in section 2 and section 1.

## 8. Constraints checked

- Real data only in the frames (his choice). Photos of him and his spreadsheets are his own.
- No insurer, no funding slide, no red, no trademark sign (types rule).
- `noindex, nofollow`; also an `X-Robots-Tag: noindex` header on `/story` if the host allows.

## 9. Decisions Ren (and the CTO) need to make

1. **Beats vs two slides for 3a/3b.** I recommend one slide with an internal `beats: 2` (keys advance the beat first). The iframes must never remount between 3a and 3b. If the engine cannot take beats, hoist the iframes into a Deck-level portal. Hash `#3` and `#3b` both work either way.
2. **Two logged-in users in one browser.** The doctor frame is Νίκος Ανδρέου and the phone frame is Ελευθέριος Γεωργάρας, both on the same origin: shared storage means one session wins. Needs two separate origins (subdomains) or per-frame storage (for example `sessionStorage` keyed by a demo param). This is Cron's and the CTO's call; the design assumes it works.
3. **Keyboard focus after clicking inside an iframe.** Arrow keys then go to the app, not the deck. Proposed: pill "Next" (44px, bottom right, above the rail) always visible while a frame is hot, plus refocus the deck window on mouse leave of the frame and on `pathien:ready`/message from the app if the app can send one. Decide how the presenter's clicker works on stage.
4. **Ready signal and framing.** The "Live" state needs the app to `postMessage({type:'pathien:ready'})` and to allow framing from the deck origin (`frame-ancestors`). Without a ready message, only a timer is possible, and a refused frame cannot be detected. Decide it with Cron.
5. **Public page, real records.** `/story` is public (noindex is not a lock). Recommend live mode only with a presenter key in the URL; everyone else gets the screenshot fallback with `Screenshot` badge. The screenshots themselves show his real records, which he chose.
6. **Did-you-know position.** The founder listed it with slide 5; I placed it as `5b`, after the matching frame and before the close. If he wants it between 4 and 5, only the path waypoints change.
7. **Sources.** 4.7 years and the 17.5% figure need a source line each, and the 3.5bn is a derived estimate. Anna owns the wording; the layout has room for two lines of 22px source per number.
8. **The 793px profile photo** is upscaled 1.4x on slide 1. Ask the founder for a larger original, or accept it.
9. **Asset filenames** are assumed (section 3, slide 2); change them when the files arrive.
