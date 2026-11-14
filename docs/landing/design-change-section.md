# Change section: Before/After wipe (MIN-4464). Replaces the rotateY flip. Tokens as in styles.css :root.

Goal: one wide comparison card, wipe reveals After over Before, ends on a full After, no empty space. Alignment: moves the "one place" promise from text to a visible before/after.

## Layout (.change)
- Section: bg var(--air), min-height 100vh, flex column, centre, gap 48px, padding 96px 0 64px. Pinned.
- Head: h2 centred, two lines "What changes when / your history is in one place", text-align center, clamp(40px,5.2vw,80px), weight 600, ls -.04em, lh 1.02, ink. Second line colour var(--teal).
- Card `.cmp`: width min(1100px, 100% - 96px), height 560px (1440). Radius 32, overflow hidden, bg #fff, shadow var(--sh) plus 0 0 0 1px rgba(18,32,31,.06). Position relative, isolation isolate.
- Two panes absolutely stacked, each inset 0, each pane is a full-card layer made of photo left 50% + list right 50% (photo | text), so wipe swaps whole layers.
  - Pane Before (bottom layer) and After (top layer, clip-path inset(0 0 0 100%) at start, 0 at end; reveals from right to left).
  - Pane inner: grid 5fr 6fr; photo cell full height, no padding; text cell padding 56px 56px 48px, flex column, justify center, gap 28px.
- Photo cell: img object-fit cover, fills 100% x 100%. Inner radius none (card clips). 
  - Before: problem.webp, object-position 38% 50%, filter saturate(.15) brightness(.82) contrast(.95); plus overlay linear-gradient(180deg, rgba(18,32,31,0) 50%, rgba(18,32,31,.28)).
  - After: how-1.webp, object-position 50% 28% (phone and face in frame), filter none; overlay none.
- Chip (top-left of text cell, not photo): height 32, padding 0 14px, radius 999, font 13/1 weight 700, ls .08em, uppercase. Before: bg var(--mist), colour var(--soft). After: bg var(--mint), colour var(--ink).
- List: 4 li, gap 20px, each flex, gap 16, align start. Text 22px/1.3 weight 600 ls -.02em. Before text colour var(--soft) (#4A5D5B); After var(--ink).
- Icons 32x32 circle, flex none. Before: bg var(--mist), inner x glyph 14px stroke #7C8B89 width 2 round, path "M10 10l12 12M22 10L10 22" in 32 viewBox. After: bg var(--mint), check stroke var(--ink) 2.2 round, path "M10 16.5l4 4 8-9". Dividers: li border-bottom 1px rgba(18,32,31,.08) with padding-bottom 20px except last.
- Handle `.cmp-h`: absolute top 0 bottom 0, width 2px, bg #fff, shadow 0 0 0 1px rgba(18,32,31,.08), left tracks the wipe edge (x from 100% to 0%). Knob centred vertically: 48px circle, bg #fff, shadow var(--sh), contains a double chevron (arrows left/right, stroke ink 2, 20px). z-index 3. Hidden after progress 1 (opacity 0 over last 8%).
- Bottom row of the card gets no extra content. Under the card: nothing.

## 375 / mobile (max-width 767px) and prefers-reduced-motion
- No pin, no wipe, no handle, no clip. Section padding 72px 0, gap 32px. h2 clamp 36px, centred.
- .cmp: width calc(100% - 32px), height auto, radius 24, overflow visible, background none, shadow none. Panes position static, stacked column, gap 16px.
- Each pane: own card (bg #fff, radius 24, shadow var(--sh), overflow hidden), grid 1 col: photo aspect-ratio 4/3 on top (same crops/filters), text padding 24px 24px 28px, gap 20. Text 18px/1.35; icons 28px.
- Reduced-motion at any width: same stacked static layout; ScrollTrigger not created.

## ScrollTrigger (desktop, no-preference only; gsap.matchMedia("(min-width:768px) and (prefers-reduced-motion:no-preference)"))
- Trigger .change, start "top top", end "+=110%", pin true, scrub 0.6, anticipatePin 1.
- Timeline (duration 1, ease "none" so scrub feels linear; easing is on the wipe tween):
  - 0 to 0.12: hold (Before readable). Head and card fade/translate in earlier on enter (opacity 0->1, y 32->0, .8s, power3.out, trigger top 80%).
  - 0.12 to 0.88: After pane clipPath "inset(0 0 0 100%)" -> "inset(0 0 0 0%)", ease "power2.inOut"; handle left "100%" -> "0%" same ease, same position; Before photo scale 1.00 -> 1.06 and After photo scale 1.06 -> 1.00 (parallax, transform-origin center); Before text opacity 1 -> .35.
  - 0.88 to 1: handle opacity 1 -> 0, hold on After.
- Per-item stagger inside After list: li opacity .0->1, x 16->0, stagger .06, positioned 0.30 to 0.80, so lines arrive as the edge passes them.
- Pane edge anti-flicker: will-change clip-path; handle uses same value.
- Remove old .face rotateY and backface rules; no flip code.

## A11y
- Both lists in DOM always. Before pane aria-label "Before", After "After". Handle aria-hidden. Visible text contrast: soft on white 7.6:1, ink on mint 11:1.
