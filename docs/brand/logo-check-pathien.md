# Pathien logo check

Date: 2026-11-14. Owner: Anna Lytica (Marketing). Linear: MIN-4462.
Scope: the logo only (symbol, app icon, lockup). The name check is in `brand-check-pathien.md`.
Founder, 2026-11-14: "Ana can you use treg to check the brand?", then "and the logo".

## Verdict: caution

No identical mark and no famous-brand conflict turned up. The logo can go on the demo landing page as it is.

The risk is the opposite of a single clash: a rounded "p" with a separate dot, white on teal, is one of the most common app-icon ideas there is. Google Lens returned 60 matches for the app icon. I looked at the top 40: all 40 are teal or green "p" marks, and about a dozen have a separate dot. One of them (Picli) is close to a twin. A mark this common is hard to tell apart in a store and gets narrow protection if it is ever registered.

Before any trademark filing or store listing, Pix should make the symbol less generic (tweaks below) and someone must run the figurative-mark search that treg could not do.

## Checks

| # | Check | Result | Source / tool | Cost |
|---|---|---|---|---|
| 1a | Visual similarity, app icon (`app-icon-512.png`) | 60 matches. Top 40 viewed: all teal/green "p" marks. Closest listed below. No identical mark. Pinterest, Patreon and Paytm did not come up (different colour and shape). | treg `serper.google.serp.lens` (Google Lens), call `fc5fd680df3049a08844ad03531a4fa5` | $0.003 |
| 1b | Visual similarity, lockup (`lockup@2x.png`) | 60 matches, matched on the wordmark letters, not the symbol: Pathify, Patheon (Thermo Fisher), Pathion, Pathful, Pathen, Pathir. These are name findings and belong to the name check. I did not open each of their logos. No lockup with the same symbol plus wordmark came up. | treg `serper.google.serp.lens`, call `44dc2d3760444ec0999564ccea351211` | $0.003 |
| 2 | Trademark design marks (EUIPO, USPTO, classes 9, 42, 44) | **Not checked.** treg has no trademark or figurative-mark tool (`treg catalog search "trademark"` returned 0). I filed a catalog request with treg. Nothing here says the mark is free to register. | treg catalog | $0 |
| 3 | App-icon crowding, App Store health | 10 keyword searches (US store), 8 results each; icons of the 12 Medical / Health & Fitness apps starting with "P" viewed. None is a teal "p" with a dot. Nearest in idea: Practo, a white "p" between two dots on navy. The store cannot be searched by icon look, so this is a sample, not a full list. Google Play was not searched by keyword; Lens surfaced Play icons instead (LocDrop, PensiunKu, ParentPath, Payaa). | treg `litescrape.app_store.search.apps` x10 | $0.0015 |
| 4 | Font licence (Manrope, wordmark outlined) | Clear. Manrope is SIL Open Font License 1.1 (Copyright 2018 The Manrope Project Authors, designer Mikhail Sharanda). The OFL FAQ, question 1.1, says yes to creating logos from the outlines. No attribution is needed on the logo; the reserved-name rule only applies if we redistribute a modified font file, which we do not. | google/fonts `ofl/manrope/OFL.txt` and `METADATA.pb`; openfontlicense.org/ofl-faq | $0 |

Total treg spend: **$0.0075** (cap was about $3). `treg host` (free) put the two PNGs at public URLs for Lens; they expire on 2026-11-21.

## Closest look-alikes

Ranked by how close they are to our app icon.

| # | Who | What it looks like | Field | Link | Risk |
|---|---|---|---|---|---|
| 1 | Picli (beta) | Teal rounded square, off-white single rounded stroke with an open loop, separate pale dot. Same build and palette as ours. | Unknown app, in TestFlight beta | https://testflight.apple.com/join/Yjqup1ph | Highest. Near twin as an app icon. |
| 2 | Rankly Media | Dark teal rounded square, light-green single stroke that hooks over a separate dot. Same build (it reads as "r"). | Marketing agency | https://ranklymedia.com/services/ | Medium. Different field. |
| 3 | Pathment | Teal rounded square, white bold "P", mint dot. Same three colours, and a "Path" name. | Unknown (GitHub organisation, 2 repositories) | https://github.com/pathment | Medium. Colours plus name prefix. |
| 4 | Patientfy | Dark teal, white bold "P", green dot. | Marketing for dental and medical practices | https://www.facebook.com/patientfy/ | Medium. Health-adjacent, but business-to-business. |
| 5 | Puvema | Dark teal circle, thin single-line "p" ending in dots. | Online wellness community | https://puvema.com/offering/online-wellness-community/ | Medium. Same idea (line plus dots), wellness. |
| 6 | PeptidePlug | Dark green rounded square, white rounded "p", coral dot at the foot of the stem. | Peptide supplier ratings | https://www.peptideplug.xyz/ | Low to medium. |
| 7 | Propily | Dark green rounded square, "P" with a mint dot at lower right. | AI product (press kit page) | https://propilyai.com/assets | Low. |
| 8 | InvestPlay | Dark teal, thin single-line "p" with a dot. | Investing | https://www.instagram.com/investplay_/ | Low. Finance. |
| 9 | Practo | White "p" between two dots on navy. | Medical, App Store | https://apps.apple.com/us/app/practo-doctor-appointment-app/id953772015 | Low. Same category, different colour and weight. |
| 10 | Pathful | White single-line "P" loop on a green-blue gradient. | Career education | https://www.youtube.com/@Pathful | Low. |

Not verified: whether any of these is a registered trademark, and what Picli and Pathment actually do.

## Tweaks for Pix

Shape matters more than colour here. Listed by effect.

1. **Make it read as a path first, a "p" second.** At icon size the story ("a line rises and loops into a p, ending in a dot") is lost and it reads as a plain "p" plus dot. Give the line a visible lead-in before the stem (it starts low and rises), so the outline is no longer a standard "p".
2. **Move the dot.** It now sits under the bowl, to the right of the stem: the same slot Picli, Rankly and Propily use. Put it where the line is heading, with a clear gap, so it reads as a destination and not as a counter-fill.
3. **Change the icon ground.** White glyph on a teal rounded square is what all 40 matches share. Try the off-white ground with a teal line, or `--teal-night`. The brand teal stays; only the icon ground changes.
4. **Do not rely on a coral dot alone.** `--coral` is in the palette for dots, but PeptidePlug already has white "p" plus coral dot on dark green.
5. **Use the lockup wherever there is room.** The symbol alone is not distinctive; with the wordmark it is.

After the redraw, run Lens again on the new icon (two calls, under one cent) and check that Picli and Rankly drop out of the top results.

## Still open

- Figurative-mark search in classes 9, 42 and 44. Free route: TMview (tmdn.org) and EUIPO eSearch plus; both have an image search; USPTO search takes design codes. This needs a person or a browser run; it was out of this run's 8 minutes.
- Picli: find the owner and the category before a store listing.

## Round 2 (redraw), 2026-11-14

Pix redrew the symbol and the icon ground after the tweaks above. Same method: `treg host` for the new `app-icon-512.png` (https://treg.to/m/wrJpcCbwr63krnSx_dMJioLe5Y7CgSMz.png, expires 2026-11-21), then `serper.google.serp.lens`, call `63ca6f5eae7e48bcbeab494865a345e8`, $0.003. 60 matches; I viewed thumbnails of the ten closest.

**What changed:** the line now runs as a path from the bowl, down the stem and out along the baseline in a foot that ends in a dot with a clear gap (the dot is where the line is heading, no longer in the slot under the bowl). Ground is air #F7FAFA with a teal-600 line and a coral dot (tweaks 1 to 4).

**Result.** The Picli-style twins are gone:
- Not in the 60 matches: Picli, Pathment, Patientfy, Propily, PeptidePlug. The old top match (Picli TestFlight link) no longer appears.
- Still in the list: Rankly Media (#16, press page) and Puvema (#37). Both are the old "single line plus dots" idea, now far down.
- Lens still returns p-shaped app icons, as it will for any "p": Pivyt (#1, off-white thick "p" with a coral dot on dark green), Praxido (#2), Pepti (#3), Reluce (#5 and #17, off-white ground, thin sage looped "p", dot at lower right). None is a twin. Nearest in feel is **Reluce** (off-white ground, loop "p", dot lower right); ours has a thick stem with a baseline foot, a teal line and a coral dot, so it is distinguishable at icon size but not unrelated.

**Verdict after redraw: low to medium crowding** (was caution). Not checked and still open: the figurative-mark search (TMview, EUIPO, USPTO design codes) and who owns Reluce and Pivyt. Lens is a visual sample, not a legal clearance.
