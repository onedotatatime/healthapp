---
name: browser-pane-timing-checks
description: How to check a timed animation in the Browser pane (hidden pane pauses rAF; transforms skew rects; fake clock via SPA remount)
metadata:
  type: feedback
---

In the Browser pane, a hidden pane pauses `requestAnimationFrame` and the CSS animation timeline, so real-time timing and screenshots taken mid-entry are unreliable (a figure shows faded because its 400 ms entry animation had not advanced).

**Why:** MIN-4608 (2026-11-15). A first clock used the rAF frame timestamp and ran about 550 ms late; real-time runs in the pane stayed 0.2 to 0.6 s late even after the fix.

**How to apply:**
- Clock code uses `performance.now()` inside the tick, never the rAF argument.
- To verify timing, override `window.requestAnimationFrame` (a queue) and `performance.now` (a fake value) after the page loads, then remount the route by `history.pushState` + a `popstate` event (to `/login` and back), and drive frames in one script with a `MessageChannel` yield. The page's own pending real rAF never fires in a hidden pane, so overriding without a remount does nothing. Set the fake time to its value at mount plus the wanted offset: the clock's t0 is the fake time when the effect ran.
- Measure positions with `offsetTop` chains, not `getBoundingClientRect`, while entry animations (translateY) are unfinished; call `document.getAnimations().forEach(a => a.finish())` before a screenshot.
- Do not print whole markup in a failing assertion (renderToStaticMarkup output is huge); pipe vitest output through `cut -c1-140 | head`.
