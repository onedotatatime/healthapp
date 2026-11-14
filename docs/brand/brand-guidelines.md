# Brand guidelines (lean v0.1, MIN-4462)

Figma: https://www.figma.com/design/THuLsLkmvLjj9uYltxTteF

One page for the marketing site and the product app. Values come from the live CSS (`landing/src/styles.css`, https://healthapp-landing.pages.dev). Anything marked **(new)** fills a gap and is not on the live site. Importable tokens: `docs/brand/tokens.css`.
Name: Pathien (chosen by the founder, 2026-11-14). Logo: section 9. Voice is pending (Anna).

## 1. Principles
- **Calm:** lots of air, one accent action per screen, no alarms.
- **Human:** real faces, daylight, plain words; the person owns the record.
- **Clear:** one idea per screen, big type, skeleton shapes instead of detail.

## 2. Colour
| Token | Hex | Role and use |
|---|---|---|
| air | #F7FAFA | Page base |
| white | #FFFFFF | Cards, nav pill, inputs |
| mist | #EAF3F2 | Alternate section, quiet surface, "Before" card |
| ink | #12201F | All text, text on mint |
| ink-soft | #4A5D5B | Secondary text |
| headline-grey | #C3CDCC | Big decorative headline over a blurred photo only |
| mint | #7FE3CF | Primary button fill, chip fill, active bar. Hover #6FD8C2 |
| teal-600 | #0F766E | Links, ghost button, small accent text, focus ring |
| teal-night | #0B3B3D | Dark sections, footer, photo overlay at 35% |
| coral | #F4846B | **Fill only:** dots, step numbers, icons |
| coral-900 | #9A3F2B | Coral as text on light |
| peach | #FFD9C7 | Chip tint |
| skeleton | #DCE8E7 | Skeleton bars, inactive dots (decorative) |

**Contrast, measured with a WCAG 2.x script (relative luminance), AA = 4.5:1 text, 3:1 large text and UI:**
ink/air 15.98, ink/white 16.77, ink/mist 14.86, ink/mint 11.01, ink/peach 12.78, ink/coral 6.68, ink-soft/white 6.98, ink-soft/air 6.65, ink-soft/mist 6.18, teal-600/white 5.47, teal-600/air 5.22, teal-600/mist 4.85, coral-900/white 6.73, coral-900/air 6.41, coral-900/mist 5.96, coral-900 on coral 12% tint 5.95, white/teal-night 12.30, mint/teal-night 8.08, coral/teal-night 4.90, white/teal-600 5.47, input border #6B7C7A/white 4.38 (UI, needs 3).
Note: `design-spec-v3.md` quotes ink/mint 11.9 and teal/air 5.9; measured values are 11.01 and 5.22. All still pass AA.

**Don't:** white on mint (1.52). White on coral (2.51). Coral as text on light (2.39 to 2.51). Teal-600 on mint (3.59, large text only). Headline-grey on air (1.55) or for anything small. Skeleton on air (1.20) as a meaningful edge. Red anywhere. Gradients on buttons.

**Product semantic layer** (all in `tokens.css`; the app never uses raw palette names):
| Semantic | Maps to | Use |
|---|---|---|
| primary / on-primary | mint / ink | Main button, active state |
| surface, surface-quiet, bg | white, mist, air | Card, quiet panel, screen |
| text, muted | ink, ink-soft | Body, secondary (muted never below 16px) |
| link | teal-600 | Links, ghost button |
| success | teal-600 text on mint fill | "Verified", "Saved" |
| info | teal-night on mist | Neutral notes, "Synthetic demo data" |
| flag | coral dot + coral-900 label on coral 12% | "Outside printed range": dot plus label, never red, never an alarm icon |
| border, border-strong | ink 8% hairline, #6B7C7A | Row dividers, inputs |
| focus | teal-600 | 3px ring |
**Dark mode is not defined yet.** Do not invent one; ask Pix.

## 3. Typography
Manrope 400/500/600/700, fallback system-ui. Headings 600, tracking -0.04em, line-height .98. Body tracking -0.01em, line-height 1.5. Numbers in the app: `font-variant-numeric: tabular-nums`.
| Style | Site | App (new) |
|---|---|---|
| Hero h1 | clamp(56px, 9vw, 144px) | n/a |
| Section h2 | clamp(40px, 6vw, 96px) | n/a |
| h3 / card title | clamp(32px, 4vw, 56px), 1.1 | 24px/1.2, 600, -0.03em |
| Screen title | n/a | 32px/1.1, 600, -0.03em |
| Lead | 20px/1.4 | 20px/1.4 |
| Body | 18px/1.5, -0.01em | **16px/1.5 minimum**, 400 or 500 |
| Label, chip | 13px/1, 600 | 14px/1.3, 600 (chips and labels only) |
| Button | 16px/1, 600 (small 15px) | 16px/1, 600 |

## 4. Shape and space
- Radii: pill **999** (nav, buttons, chips), card **32**, image in a card **24**, small image and row **16**. Phone frame 32.
- Spacing (px): 4, 8, 12, 16, 24, 32, 48, 64, 96 (live CSS also uses 20, 28, 40, 72; prefer the named steps in `tokens.css`, which are **(new)** names). Gutters 24 mobile, 48 desktop, max width 1360.
- Shadow: card `0 24px 60px -24px rgba(11,59,61,.25)`; soft `0 8px 24px -16px rgba(11,59,61,.2)`; button hover `0 10px 24px -10px rgba(15,118,110,.5)`. No other shadows.

## 5. Components
- **Button, one family:** height 52 (small 44, never lower), padding 0 28, pill, 600 16px. Primary: mint fill, ink text; hover #6FD8C2 + lift 1px + shadow. Ghost: transparent, 1.5px teal-600 border and text; hover teal 8% fill. Primary may carry an arrow dot (ink circle 40px, white arrow).
- **Chips:** status chip: mist fill, ink-soft, 13px/600, pill; with a 6px coral dot for "Synthetic demo data". Flag chip: coral 8px dot + "Outside printed range" in coral-900 14px/600. Source chip: white, 1px teal-600 border, teal-600 14px/600, pill, "Source: <document> · <date>". Peach chip: peach fill, ink.
- **Card:** white on air (or mist on white), radius 32, card shadow, padding 24 to 40. Row inside a card: radius 16, min height 56.
- **Skeleton bars** (abstract screens, never real data): height 12, pill, #DCE8E7, widths 40/60/80%.
- **Phone frame ("See it in action"):** 320x640, 8px ink bezel, radius 32, fill air, card shadow, no status bar, notch or tab bar; inner padding 28, gap 16; one highlighted element per screen (mint 2px border or ring); no text under 16px except chips.
- **Input:** white, 1.5px #6B7C7A border, pill, 56 high; focus is the standard ring.

## 6. Imagery
- Photography (FAL): photorealistic, 85mm, natural daylight, real skin texture, happy and optimistic. Mediterranean homes and clinics. Faces may look at or away from the camera, never a selfie. No readable text, no logos, no sad or problem scenes. Medical paperwork only where it must read as medical (printed range columns, not legible values).
- Prompt suffix (**written from the brief; the original FAL prompt is not in the repo, Anna or Ren to confirm**): `photorealistic, 85mm lens, shallow depth of field, soft natural daylight, real skin texture, warm optimistic mood, Mediterranean interior, no text, no logos, no watermark`
- Hero moments: soft blurred petal background (`bg-hero.webp`, `bg-statement.webp`, 1920x1200), cover-fit, object-position 70% 40%; teal-night overlay 35% when white text sits on it. Photo cards use radius 24 inside a 32 card; the "Before" photo is desaturated (saturate .15).
- Format: WebP quality 80. Always alt text that describes the idea in one short phrase; decorative images get empty alt.

## 7. Motion
- **Lenis** smooth scroll: duration 1.1, expo-out easing, `smoothWheel` on, `syncTouch` off; drives GSAP ScrollTrigger via `lenis.on('scroll', ScrollTrigger.update)`. Anchor links scroll with duration 1.2.
- **Reveal:** fade-up 24px, 0.8s, stagger .1 (hero lines); other blocks fade-up once. Hero bg scales 1.08 to 1 on scrub.
- **Pinned, one at a time:** statement words grey to white (pin, end +=150%); screens pinned, end +=400%, 4 steps, scrub .6, step swap .4s (out: opacity to 0 and y -24; in: y 24 to 0, power2.out; hidden steps `visibility:hidden`). How cards are CSS sticky, previous scales .94 and dims to .7.
- **Product app:** transitions .2s to .4s ease-out; no scrub, no pin, no parallax.
- **Reduced motion:** Lenis off, no pin, no scrub, no hover translate, colour changes only, steps stack or sit in a 2x2 grid, words white, Before and After side by side.

## 8. Accessibility
- Contrast AA at minimum (table above); never colour alone for state (the flag is dot plus label).
- Targets at least 44x44, including nav links and progress buttons.
- Focus: `:focus-visible` 3px solid teal-600, offset 3px; white on dark sections; never removed.
- Body at least 16px in the app. Skip link on pages. Decorative screens are `aria-hidden` with a labelled figure.
- Reduced-motion fallback as in section 7.

## 9. Logo
Name chosen by the founder, 2026-11-14: Pathien (pathien.health). Trademark clearance pending.

**The idea.** The "p" is the symbol. Its foot curves into a straight path that runs under the whole word and ends in a single dot, sitting where the dot of the "i" would be (the "i" is dotless). The p's foot becomes the path, and the path ends in the i's dot: the path leads to you. A patient's history as one calm line. No medical cross, heart, pill or stethoscope. Round 3 (final, 2026-11-14): founder picked the Plus Jakarta Sans version ("back to jakarta") after the Manrope redraw and two font rounds; history in `logo-check-pathien.md`.

**Type.** The wordmark is Plus Jakarta Sans 600 (SIL Open Font License 1.1, outlined, so no font is needed), with a dotless "i" (U+0131). The "p" is drawn by hand on the same stem weight (112.5 units, like the font's stems) and sits at the x-height. This is the logo's own face: product and web type stay Manrope (section 3).

**Files** (`docs/brand/logo/`, SVG, fill-only shapes, no strokes, no fonts):
| File | Use |
|---|---|
| `pathien-lockup.svg` | Default logo, primary colour version, on light backgrounds (air, white, mist) |
| `pathien-lockup-mono.svg` | One-colour print, stamps, anything that cannot carry teal and coral: all ink, one colour: letters, p and path, dot |
| `pathien-lockup-white.svg` | For dark grounds: teal-night, teal-600, photos with the teal-night overlay |
| `pathien-wordmark.svg` | Same artwork as the lockup. The "p" is now part of the word, so wordmark and lockup are one logo; the file is kept only so existing links do not break. Do not use a version without the p |
| `pathien-symbol.svg` | The p with a short path ending in the dot, alone: the p and its path as one teal stroke, coral dot (avatars, social profile, small spots below 96px wide) |
| `pathien-app-icon.svg` | 1024 rounded square, air #F7FAFA ground with a hairline edge, the symbol centred. Round the corners only through the store's mask on iOS (use a square export there; `landing/public/brand/apple-touch-icon.png` is one) |
| `favicon.svg` | 32 viewBox, same symbol with heavier weights so it holds at 16px |
| `lockup@2x.png`, `app-icon-512.png`, `favicon-strip.png` | Previews only (white background; the strip shows 16, 32 and 48px at 8x). Use the SVGs |

**Colour versions.**
The p and its path are one stroke in teal (mint on dark): one shape, no seam where the foot becomes the path.

| Version | p and path (one stroke) | Letters "athıen" | Dot |
|---|---|---|---|
| Primary (colour) | teal-600 #0F766E | ink #12201F | coral #F4846B |
| Mono ink | ink #12201F | ink #12201F | ink #12201F |
| White | mint #7FE3CF | white #FFFFFF | coral #F4846B |

Primary and mono go on light grounds, white on dark. Contrast of the p and path: teal-600 on air 5.2:1, ink on air 16.0:1 (mono), mint on teal-night 8.1:1, mint on teal-600 3.6:1 (graphic only; the letters carry the name). The coral dot is 2.4:1 on air and 4.9:1 on teal-night; it is a decoration, never the only carrier of meaning. The icon ground is air, not teal: every close match found in the logo check is a white mark on a teal or green square.

**Clear space.** On all sides at least x, the x-height of the "a" in the wordmark, which is about 57% of the lockup's height. Keep other text, edges and images out of that zone.

**Minimum sizes.** Lockup 96px wide on screen (24mm in print). Symbol alone 16px (favicon) and up. Below 96px use the symbol.

**Don'ts.**
- Do not add a dot back on the i. The dot under the i is the path's end; a dot above it makes two.
- Do not separate the p from the word, or use the word without its p. Do not crop the path off.
- Do not recolour the p and path outside teal or mint (ink in mono), and do not split them into two colours. Coral only for the dot (primary and white versions); the mono version has no coral. No gradients.
- Do not stretch, squash, rotate or outline it.
- No shadows, glows, bevels, blur or other effects.
- Do not retype the wordmark in a font, change its weight or tracking, or capitalise it ("Pathien" in running text, "pathien" only in the logo).
- Do not put it on a busy photo without the teal-night overlay, or on a background under 4.5:1 contrast with the letters.
- Do not put the icon on a teal or green square.
- Do not add a medical symbol, a tagline or a registered mark inside the lockup.

**Figma.** "Pathien — Brand" (https://www.figma.com/design/THuLsLkmvLjj9uYltxTteF), page Logo: components Symbol, Wordmark, Lockup/Ink, Lockup/White, Lockup/Mono, App icon, Favicon. Instances on the Logo page and the Cover follow the components.

## 10. Voice (placeholder, Anna fills in)
_Tone, vocabulary, words we avoid, how we phrase a result that is outside the printed range._
