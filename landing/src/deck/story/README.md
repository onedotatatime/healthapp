# /story: the founder's story deck

A second web deck on the same engine as `/deck` (`../Deck.tsx` is untouched; `StoryDeck.tsx` is its sibling, because the story needs beats and live frames).

- **Words:** `docs/story/story-deck-content.md` (Anna). Slides and notes: `../slides.story.ts`, `../notes.story.ts`. Copy them word for word.
- **Layout:** `docs/story/layout-spec.md` (Pix). 1920x1080 canvas, tokens from `../deck.css`, extra styles in `story.css`.
- **Run:** `npm run dev` then `/story`. Build: `npm run build` gives `dist/story/index.html` (noindex in the page and in `public/_headers`).

## Slides and keys

`#1 #2 #3 #4 #5 #5b #5c #6` (`#3b` is an old link and lands on `#3`). Arrows, space, Home/End, click (left third back), `F` fullscreen, `N` notes, `?clean&scale1` for screenshots, as in `/deck`.
`#3` and `#4` are the two beats of one slide (slide 3): the same doctor browser frame and patient phone, only the header changes, so the iframes are the same elements and a sign-in survives. `#4` has its own header (the first "what if", Brazil). No line under the headline and no frame labels on slide 3 or 4 (founder, 15 Nov: "delete"). `#5c` is the live simulation page, after "Did you know" (`#5b`). There is no timeline on any slide.

## Live frames (the one thing to know)

Every address is in one constant: **`STORY_FRAMES` in `config.ts`**. The CTO's decision (MIN-4729: which URLs, and how the patient and the doctor sign in as two different users) changes that file and nothing else.

| Address | What happens |
|---|---|
| `/story` | **Screenshots only.** No iframe is in the DOM, so no app page and no real record loads. Every badge says `Screenshot`. This is what a casual visitor gets. |
| `/story?live=<PRESENTER_KEY>` | Live frames load (the key is `PRESENTER_KEY` in `config.ts`). Not a secret: it only keeps casual visitors on screenshots. |
| `/story?live=<PRESENTER_KEY>&static` or `/story?static` | Every frame is a screenshot, nothing is loaded (a bad venue network). `static` wins over the key. |

With the key in the address, the four iframes mount when the deck starts and are never unmounted, so a sign-in survives slide changes. On slides 3, 4, 5 and 5c they are visible and interactive by default, on top of the screenshot. There is **no ready logic and no timeout** (MIN-4733: an 8 s timer that was never cleared on `load` marked every frame failed and hid a working app). A slow app is a white frame for a second.

**`L`** switches both frames of the current slide between live and screenshot (the first press goes to the screenshot); clicking a frame's badge switches that one frame. The iframes stay mounted, so switching back keeps the sign-in. `L` does nothing without the key.

Each iframe renders at its logical size (phone 390 x 844, desktop views 1280 wide) and is scaled to the frame with a CSS transform, so the app lays out at phone or desktop width. Sizes are in `STORY_FRAMES`.

Keys: while the mouse is over a live frame the keys go to the app (the frame takes focus on enter). When the mouse leaves, the keys go back to the deck, and a visible **Next** pill is always there as a way forward.

## Fallback pictures

`public/story/fallback-doctor.webp`, `fallback-patient.webp`, `fallback-simulate.webp`, `fallback-simulation.webp`: synthetic captures (the doctor view of a synthetic patient, the patient home, the "Simulate matching" page on 5,000 synthetic records, and the public `/simulation` page, captured signed out). They are what the deck shows by default, and when the presenter presses `L`. Replace a file, keep its name.
