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

With the key in the address, the three iframes mount when the deck starts and are never unmounted, so a sign-in survives slide changes. On slides 3, 3b and 5 they are visible and interactive by default, on top of the screenshot. There is **no ready logic and no timeout** (MIN-4733: an 8 s timer that was never cleared on `load` marked every frame failed and hid a working app). A slow app is a white frame for a second.

**`L`** switches both frames of the current slide between live and screenshot (the first press goes to the screenshot); clicking a frame's badge switches that one frame. The iframes stay mounted, so switching back keeps the sign-in. `L` does nothing without the key.

Each iframe renders at its logical size (phone 390 x 844, desktop views 1280 wide) and is scaled to the frame with a CSS transform, so the app lays out at phone or desktop width. Sizes are in `STORY_FRAMES`.

Keys: while the mouse is over a live frame the keys go to the app (the frame takes focus on enter). When the mouse leaves, the keys go back to the deck, and a visible **Next** pill is always there as a way forward.

## Fallback pictures

`public/story/fallback-doctor.webp`, `fallback-patient.webp`, `fallback-simulate.webp`: synthetic captures (the doctor view of a synthetic patient, the patient home, the "Simulate matching" page on 5,000 synthetic records). They are what the deck shows by default, and when the presenter presses `L`. Replace a file, keep its name.
