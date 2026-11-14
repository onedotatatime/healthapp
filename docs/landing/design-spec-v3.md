# Landing design spec v3: Kora layout (MIN-4464)

Founder, 2026-11-14: "use images and layout like kora template". Ref: kora.framer.media. Supersedes v2 palette and dark Aurora; copy blocks per `copy.md` (`nav`, `hero`, `hero-card`, `statement`, `change`, `how[].does`).

## Tokens
| Token | Hex | Use |
|---|---|---|
| air | #F7FAFA | page base |
| white | #FFFFFF | cards, nav pill |
| mist | #EAF3F2 | alt section, Before card |
| ink | #12201F | body and card text (AA on air/white) |
| ink-soft | #4A5D5B | secondary text (>=4.5:1 on white) |
| headline-grey | #C3CDCC | hero headline over blurred photo (decorative scale, big text only) |
| mint | #7FE3CF | pill CTA fill, text ink on it |
| teal-600 | #0F766E | links, small accent text on light |
| teal-night | #0B3B3D | statement overlay tint, footer |
| coral | #F4846B | chips, step numbers, After check icons (fill only) |
| peach | #FFD9C7 | chip tints |

## Type
Manrope (Google Font, 400/500/600/700), headings and body. Headings 600, tracking -0.04em, line-height 0.98. Hero h1 clamp(56px, 9vw, 144px); section h2 clamp(40px, 6vw, 96px); body 18px/1.5, -0.01em. Fallback: system-ui.

## Radii, shadow
Pill 999px (nav, CTA, chips); card 32px; inner image 24px; small image 16px. Shadow: 0 24px 60px -24px rgba(11,59,61,.25). Gutters 24px mobile, 48px desktop, max width 1360px.

## Sections
1. **nav**: fixed floating white pill, top 20px left 24px, logo + 4 links, backdrop-blur. Mobile: logo + menu button.
2. **hero**: full-bleed `bg-hero.webp` (blurred petal), h1 headline-grey two lines over the empty top area. Centred under it a sharp rounded card (24px, 360x240) with `hero.webp`. Bottom-left: mint pill CTA with arrow dot, 3 avatars + stars. Bottom-right: white **hero-card** (32px) with `who-doctor.webp` portrait left (120x160), label chip, two lines, arrow.
3. **statement**: full-bleed `bg-statement.webp` with teal-night overlay 35%, one huge white line (h2 size) that reveals word by word grey (#7C8F8E) to white.
4. **change**: huge split headline, line 1 and line 2. Between them a centred 32px card (480px wide) flipping Before (mist, check icons grey) to After (white, coral check icons). Uses `problem.webp` as a 16px thumb inside Before.
5. **how**: 3 sticky stacked cards 01-03, each 32px, white on air, `top: 96px + n*24px`. Card: big number (coral), title, one line, "What it does" list (3 bullets), photo right (`how-1..3.webp`, 24px).
6. **who**: 2 portrait cards (`who-patient`, `who-doctor`), 32px, text overlaid on a bottom white-gradient chip.
7. **tech**: 4 items in a 2x2 grid of mist cards, 32px, icon in a coral/20 circle. Light, no dark section.
8. **trust**, **roadmap**: air and mist alternating, cards 32px, roadmap as horizontal list with mint dots.
9. **footer**: teal-night, white text, pill CTA mint.

## Motion (Lenis smooth scroll + GSAP ScrollTrigger)
- Lenis: duration 1.1, `lenis.on('scroll', ScrollTrigger.update)`, gsap ticker drives `lenis.raf`.
- Hero: h1 lines fade-up 24px, 0.8s, stagger .1; bg scales 1.08 to 1 on scroll scrub.
- Statement: split into words; scrub, each word colour grey to white with stagger, pin 1 viewport, end `+=150%`.
- Change: pin; line 1 xPercent 0 to -18, line 2 0 to +18 scrub; at 50% the card flips Before to After (rotateX 0 to 180, backface hidden, 0.6s, toggled by `onUpdate` threshold).
- How: CSS `position: sticky` stack; previous card scales to 0.94 and dims to 0.7 opacity as next arrives (scrub).
- Other: fade-up 24px once.
- `prefers-reduced-motion`: Lenis off, no pin, no scrub; words white, split halves static, Before and After shown side by side, cards stacked normally.

## Mobile (below 768px)
Nav pill full width minus 24px. Hero h1 56px, hero card under CTA, bg-hero `object-position: 70% 40%`. Statement keeps the word reveal without pin (trigger start top 80%). Change: no slide-apart, card flip kept by tap or scroll; stacked Before above After if flip fails. How: stack stays sticky, photo above text, `top: 72px`. Who and tech single column.

## Assets
New: `bg-hero.webp`, `bg-statement.webp` (1920x1200, upscaled from FAL max 1440x1184). Reused: `hero`, `problem`, `how-1..3`, `who-patient`, `who-doctor`.

## Not verified
Contrast pairs not computed here; run a11y check on mint/ink, headline-grey on bg-hero (large decorative text) and statement grey word start state.
