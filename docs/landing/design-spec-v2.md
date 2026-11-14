# Landing design spec v2: warm and human, still tech (MIN-4464)

Founder, 2026-11-14: "match technology with more humanized colors and photos". Keep motion, Aurora, pinned scroll. Warm the surfaces and use people photography.

## Palette
| Token | Hex | Use |
|---|---|---|
| ivory | #FBF6EE | light section bg |
| sand | #F3EADB | alternate light bg, cards |
| ink | #1F1A17 | text on light |
| ink-soft | #5C5148 | secondary text on light |
| warm-night | #1C1512 | dark section bg |
| night-2 | #2A201B | cards on dark |
| cream | #F6EDE0 | text on dark |
| cream-soft | #CDBFAE | secondary text on dark |
| teal-600 (brand) | #0F766E | brand, buttons, links on light |
| teal-400 | #2DD4BF | brand glow on dark |
| coral (accent) | #F26B50 | one accent: highlights, step numbers, glows, button fill on dark |
| peach | #FFD9C7 | tints, chips |

## Sections
- Dark (Aurora): `hero` (warm-night), `tech` (warm-night), `footer` (#120D0B).
- Light: `problem` (ivory), `how` (sand), `who` (ivory), `trust` (sand), `roadmap` (ivory).
- Photos sit in rounded-2xl frames (radius 24px) with a soft warm shadow; hero photo overlaps the Aurora with a 1px cream/20% border. Keep glass 3D renders only in `tech` and as small accents.

## Aurora colours
Base #1C1512. Blobs: teal #0F766E and #2DD4BF at 35-45% alpha, plus coral #F26B50 at 20-25% alpha and a faint peach #FFD9C7 at 10%. Teal should dominate, coral is the warm second light.

## Contrast (WCAG AA, computed ratios, approximate)
| Pair | Ratio | Verdict |
|---|---|---|
| ink #1F1A17 on ivory #FBF6EE | ~16 | AA/AAA |
| ink-soft #5C5148 on ivory | ~7.3 | AA |
| ink-soft on sand #F3EADB | ~6.5 | AA |
| teal-600 #0F766E on ivory | ~5.3 | AA text and buttons |
| white on teal-600 | ~5.5 | AA |
| cream #F6EDE0 on warm-night | ~15 | AAA |
| cream-soft #CDBFAE on warm-night | ~9 | AAA |
| teal-400 #2DD4BF on warm-night | ~9 | AA (text/links on dark) |
| coral #F26B50 on warm-night | ~6.3 | AA (text on dark OK) |
| ink on coral button fill | ~6 | AA |
| coral #F26B50 on ivory | ~3.0 | FAILS for small text: on light use coral only for fills/large (24px+) or deeper #C2410C (~5.0 on ivory) for text |
| white on coral | ~3.1 | FAILS: use ink text on coral fills |

Verify with a checker before shipping; ratios above were estimated by hand.

## Type
Headings: add a warm serif, Fraunces (variable, weight 500-600, opsz auto) for h1/h2 and big numerals. Body and UI: keep Inter. Tech labels (eyebrows): Inter uppercase 12px, letter-spacing 0.08em, teal-600 on light, teal-400 on dark.

## Photos (in `landing/public/img/`, webp)
`hero` 1200x960 (hero), `problem` 1200x800, `how-1/2/3` 800x800 (the 3 steps), `who-patient` and `who-doctor` 800x1000 (the two cards). Add alt text per image; they have no readable text.
