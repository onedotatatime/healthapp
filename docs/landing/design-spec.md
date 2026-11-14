# Landing page: design spec (MIN-4464)

For Ren. One page, four sections, light theme only. Lean: bare minimum for the 14-16 Nov 2026 hackathon. Component names are from reactbits.dev; Ren confirms the exact names and installs only what is used.

Tone: calm, clean, trustworthy, lots of white space. No neon, no gradients, no glow, no dark mode.

## Tokens

| Token | Hex | Use |
|---|---|---|
| `paper` | `#FFFFFF` | page background |
| `mist` | `#F4F7F8` | alternate section background, cards, tag pill |
| `ink` | `#14232B` | headings, body text |
| `slate` | `#4A5B66` | subhead, step lines, footer text |
| `teal` | `#0F6E6E` | CTA fill, links, step numbers |

**Font:** Inter (Google Fonts, weights 400 and 600, `display=swap`). One family only.

**Sizes (3):**
- `display`: 56px/1.1 weight 600 at 1440; 36px/1.15 at 375. Headline only.
- `body`: 18px/1.6 weight 400. Subhead, step lines, promises. Step titles are 18px weight 600.
- `small`: 14px/1.5. Tag, footer, CTA label (weight 600).

**Spacing (px):** 8, 16, 24, 48, 96. Section padding 96 top and bottom at 1440, 48 at 375. Content width max 1040, centred. Side padding 24 at 375.
**Radius:** 12 (cards, images), 999 (tag pill, CTA).
**Border:** 1px solid `#14232B` at 10% opacity on cards. No shadows.

## Sections

### 1. `hero` (background `paper`)
- 1440: two columns 7/5, vertically centred, min height 640. Left: tag pill, headline (max 7 words), subhead (max 15 words), CTA. Right: hero image, 12 radius.
- 375: one column, tag, headline, subhead, CTA (full width, 48 high), then image below at 16:10. 
- Tag: "Hackathon prototype · synthetic data", `small`, `slate` on `mist` pill, 8/16 padding.
- CTA: `teal` fill, white `small` text, 48 high, 999 radius. Target: anchor to `#how`. Hover: darken to `#0B5A5A`. Focus ring: 2px `teal`, 2px offset.
- Component: **BlurText** on the headline (animateBy words, 60ms delay, plays once on load). Subhead, CTA and image: **FadeContent** (blur off, 600ms, staggered 100ms).
- Background: none.

### 2. `how` (background `mist`)
- 1440: section title is not required; three cards in one row, 3 columns, 24 gap. Each card: `paper` fill, 12 radius, 24 padding, graphic on top (1:1, 12 radius), step number (`teal`, `small`, 600), title (`body` 600), one line (`body`, `slate`).
- 375: cards stack, 24 gap, graphic 16:9 crop.
- Component: **SpotlightCard** wrapping each card, spotlight colour `rgba(15,110,110,0.08)` (barely visible; pointer only, off on touch). Reveal on scroll: **AnimatedContent** (distance 24, 600ms, stagger 120ms, once).
- Background: none.

### 3. `trust` (background `paper`)
- 1440: three promises in one row, separated by 1px `ink` 10% vertical rules, no cards, no icons. Each: `body`, `ink`, max 28 characters per line feel, centred block 1040 wide.
- 375: stacked, separated by 1px horizontal rules, 24 padding between.
- Component: **FadeContent** per promise, 500ms, stagger 100ms. Nothing else.
- Background: none.

### 4. `footer` (background `mist`)
- 1440 and 375: single block, 48 padding. Product name left, one line right (stacked at 375). `small`, `slate`. Includes the synthetic-data note and the hackathon name and dates (copy from Anna).
- No component, no animation.

## Lenis (smooth scroll)
- Package `lenis`, one instance at app root, driven by `requestAnimationFrame`.
- `duration: 1.1`, `easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))` (the Lenis default expo-out), `smoothWheel: true`, `syncTouch: false` (native touch scroll).
- Anchor links (`#hero`, `#how`, `#trust`, `#footer`) use `lenis.scrollTo(target, { offset: 0, duration: 1.2 })`. Update the hash after. Without JS, plain anchors still work.
- Under `prefers-reduced-motion: reduce`: do not create the Lenis instance; use native scroll with `scroll-behavior: auto`. Also disable all React Bits animations (render the final state, no BlurText, no AnimatedContent, no FadeContent delay, no spotlight).

## Image slots (FAL)
FAL access method is pending the founder. Specify only. Put files in `landing/public/img/`, export WebP (quality 80) plus keep the PNG original off-repo. Add `alt` text in the page; step graphics are decorative-adjacent so alt describes the idea in one short phrase.

**Shared style (prepend to every prompt):** "Flat minimal vector illustration, soft rounded shapes, calm muted palette of white, pale grey-blue (#F4F7F8) and deep teal (#0F6E6E) with dark ink navy (#14232B) outlines, generous empty space, no gradients, no glow, no text, no letters, no numbers, no faces, no people, no real documents, nothing resembling a real medical record, abstract and clearly illustrative."

| Slot | File | Size | Aspect | Prompt (after the shared style) |
|---|---|---|---|---|
| Hero visual | `hero.webp` | 1200x960 | 5:4 (cropped 16:10 at 375) | "A smartphone in the centre with a soft stack of blank paper sheets on one side folding into the phone, and a small abstract key shape beside it, on a pale background." |
| How 1 | `how-1.webp` | 800x800 | 1:1 | "A blank sheet of paper next to a phone camera frame with simple corner brackets, suggesting a photo being taken, no marks on the paper." |
| How 2 | `how-2.webp` | 800x800 | 1:1 | "A simple square pattern of dots and rounded squares (an abstract code, not a real QR code) beside a small hourglass, suggesting limited time access." |
| How 3 | `how-3.webp` | 800x800 | 1:1 | "A rounded speech bubble with three blank lines, linked by a thin line to a small blank page card, suggesting an answer pointing to its source." |
| OG share | `og.png` | 1200x630 | 1.91:1 | "Wide composition: the phone with folding blank paper sheets and a key shape on the right third, empty pale space on the left two thirds for the title to be added by the page." |

Review each output by eye: reject any with text, faces, a real-looking QR, a realistic chart, or a medical symbol that reads as a real record. OG title is set in `og:title`, not baked into the image.

## Contrast (WCAG AA, computed)
| Text on background | Ratio | Needs | Result |
|---|---|---|---|
| `ink` on `paper` | 16.09 | 4.5 | pass |
| `ink` on `mist` | 14.95 | 4.5 | pass |
| `slate` on `paper` | 7.05 | 4.5 | pass |
| `slate` on `mist` (tag, footer) | 6.55 | 4.5 | pass |
| white on `teal` (CTA) | 6.04 | 4.5 | pass |
| `teal` on `paper` (step number, links) | 6.04 | 4.5 | pass |
| `teal` on `mist` | 5.61 | 4.5 | pass |
| Focus ring `teal` on `paper` | 6.04 | 3 | pass |

Touch targets 48px high. Headline is real text (not in an image). One `h1` (hero), `h2` per other section.

## Skipped (lean)
Dark mode; a nav bar; a full logo or brand mark; icons; video; parallax or scroll-linked effects; cursor effects; a background; a separate mobile hero crop beyond CSS; i18n (English only); Figma frames; real FAL generation (access pending); alt-text copy (Anna or Ren); loading skeletons; analytics.
