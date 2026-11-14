# Pitch deck (served at `/deck`)

A web presentation built from reusable slide templates. The words live in one data file.

- `slides.ts`: the whole deck as typed data. One object per slide. Words come from `docs/deck/deck-content.md`; speaker notes too.
- `types.ts`: the props every template takes (a `Slide` is a union keyed by `template`).
- `templates/`: layouts. `Cover`, `Stats`, `Statement` (points + side panel), `Funnel` (big number), `Chart` (stacked bars from data), `Table`, `Product` (phone frames), `Compare` (positioning map), `Steps` (timeline or ascending cards), `TeamAsk`, `Appendix`.
- `Deck.tsx`: the presenter (scaling, keys, hash, notes, print). `deck.css`: all styles, on a fixed 1920x1080 canvas.
- Entry: `landing/deck/index.html` (`noindex`), built to `dist/deck/index.html`. The landing at `/` is a separate entry.

## Make a new deck

1. Copy `slides.ts` to `slides.<name>.ts`, keep the `Slide[]` shape, and replace the data. Pick a `template` per slide; TypeScript tells you which fields it needs.
2. Point `main.tsx` at the new file (or add `deck/<name>/index.html` and a second input in `vite.config.ts`).
3. Rules baked into the types: every `product` card and every `statement` side panel of kind `notice`, `phone` or `matches` must carry a `tag` of `'Mock-up'` or `'Working demo · synthetic data'`. Do not add red, a trademark sign, or a funding-sources slide.
4. Keep every "assumption" or "our estimate" label at the same size as its number.

## Presenting

Arrows, space, Enter, PageUp/Down, click (left third goes back); Home/End; `F` fullscreen; `N` speaker notes. The URL hash is the slide (`/deck#8`; `#16` is the backup). Print (Cmd+P, save as PDF) gives one 16:9 slide per page. Screenshots: `?clean&scale1` hides the presenter chrome and pins the slide at 1920x1080.
