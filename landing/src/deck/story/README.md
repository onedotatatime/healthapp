# /story: the founder's story deck

A second web deck on the same engine as `/deck` (`../Deck.tsx` is untouched; `StoryDeck.tsx` is its sibling, because the story needs beats, a persistent path and live frames).

- **Words:** `docs/story/story-deck-content.md` (Anna). Slides and notes: `../slides.story.ts`, `../notes.story.ts`. Copy them word for word.
- **Layout:** `docs/story/layout-spec.md` (Pix). 1920x1080 canvas, tokens from `../deck.css`, extra styles in `story.css`.
- **Run:** `npm run dev` then `/story`. Build: `npm run build` gives `dist/story/index.html` (noindex in the page and in `public/_headers`).

## Slides and keys

`#1 #2 #3 (#3b = its second beat) #4 #5 #5b #6`. Arrows, space, Home/End, click (left third back), `F` fullscreen, `N` notes, `?clean&scale1` for screenshots, as in `/deck`.
A key press or click on slide 3 moves to its second beat first, then to the next slide. The frames never remount between beats.

## Live frames (the one thing to know)

Every address is in one constant: **`STORY_FRAMES` in `config.ts`**. The CTO's decision (MIN-4729: which URLs, and how the patient and the doctor sign in as two different users) changes that file and nothing else.

| Address | What happens |
|---|---|
| `/story` | **Screenshots only.** No iframe is in the DOM, so no app page and no real record loads. Every badge says `Screenshot`. This is what a casual visitor gets. |
| `/story?live=<PRESENTER_KEY>` | Live frames load (the key is `PRESENTER_KEY` in `config.ts`). Not a secret: it only keeps casual visitors on screenshots. |
| `/story?live=<PRESENTER_KEY>&static` or `/story?static` | Every frame is a screenshot, nothing is loaded (a bad venue network). `static` wins over the key. |

With the key in the address: **`L`** switches both frames of the current slide between live and screenshot; clicking a frame's badge switches that one frame. `L` does nothing without the key.

A frame shows its iframe only after it is ready: the app posts `{type:'pathien:ready'}` to the deck, or the iframe's `load` event fires. A cross-origin frame cannot tell the page that it was refused, so `L` is the way back to the screenshot. A frame that is live is also labelled `Live` (slide 3 from its second beat, slide 5 from the start), `Ready` or `Screenshot`: never `Live` over a picture.

After a click inside a frame the arrow keys go to the app. A visible **Next** pill appears while a frame has the mouse, and a mouse move outside the frame hands the keyboard back to the deck.

## Fallback pictures

`public/story/fallback-doctor.webp`, `fallback-patient.webp`, `fallback-simulate.webp`: synthetic captures (the doctor view of a synthetic patient, the patient home, the "Simulate matching" page on 5,000 synthetic records). They are what the deck shows by default. Replace a file, keep its name.
