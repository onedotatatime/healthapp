# Pitch deck (served at `/deck`)

A web presentation built from reusable slide templates. The words live in one data file.

- `slides.ts`: the whole deck as typed data. One object per slide. Words come from `docs/deck/deck-content.md`; speaker notes too.
- `types.ts`: the props every template takes (a `Slide` is a union keyed by `template`).
- `templates/`: layouts. `Cover`, `Hero` (full-bleed image + text column + optional `tag` of `'Concept render'` or `'Mock-up'`, optional `stepsTitle` + `steps` (a small numbered "how it's used" list, numbers in teal); used by slide 6b), `Stats`, `Statement` (points + side panel), `Funnel` (big number), `Chart` (stacked bars from data), `Table`, `Product` (phone frames), `Compare` (positioning map), `Steps` (timeline or ascending cards, or `variant: 'flow'`: a quiet left-to-right four-step flow with a `body` paragraph, small teal numerals on a hairline, the last step ending on a coral dot, no image; used by slide 7b), `TeamAsk`, `Appendix`.
- `Deck.tsx`: the presenter (scaling, keys, hash, notes, print). `deck.css`: all styles, on a fixed 1920x1080 canvas.
- Entry: `landing/deck/index.html` (`noindex`), built to `dist/deck/index.html`. The landing at `/` is a separate entry.

## Make a new deck

1. Copy `slides.ts` to `slides.<name>.ts`, keep the `Slide[]` shape, and replace the data. Pick a `template` per slide; TypeScript tells you which fields it needs.
2. Point `main.tsx` at the new file (or add `deck/<name>/index.html` and a second input in `vite.config.ts`).
3. Rules baked into the types: every `product` card and every `statement` side panel of kind `notice`, `phone` or `matches` must carry a `tag` of `'Mock-up'` or `'Working demo · synthetic data'`. Do not add red, a trademark sign, or a funding-sources slide.
4. A `hero` slide's `tag`, `kicker`, `stepsTitle` and `steps` are optional. Slide 6b carries no concept label (founder, 2026-11-15: it is no longer shown as a concept); a hero that does show an unbuilt thing should still say so with a `tag`.
5. Keep every "assumption" or "our estimate" label at the same size as its number.

## Presenting

Arrows, space, Enter, PageUp/Down, click (left third goes back); Home/End; `F` fullscreen; `N` speaker notes. The URL hash is the slide `id`, not its position: `/deck#8`, `#6b` (the Vault concept slide), `#7b` (clinical trials, not built yet), `#16` (the backup, also `#a`). A slide with a `counter` (6b, 7b) shows that label and is not counted, so the others keep "n / 15". Print (Cmd+P, save as PDF) gives one 16:9 slide per page. Screenshots: `?clean&scale1` hides the presenter chrome and pins the slide at 1920x1080.
