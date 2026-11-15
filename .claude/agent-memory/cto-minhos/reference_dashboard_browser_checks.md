---
name: dashboard-browser-checks
description: How to check healthapp dashboard behaviour in a browser during a review: Playwright route interception, no background servers; which fixtures make which flags
metadata:
  type: reference
---

For a behaviour check of `docs/dashboard/drafts/` (MIN-4534 run 2, 2026-11-14):

- Do not start background `python3 -m http.server` processes. The auto-mode classifier denied that. Use instead a Node script in the scratchpad that imports `<checkout>/node_modules/playwright/index.mjs` and serves the files through `ctx.route('**/*')` from disk under a fake origin (`http://dash.test`).
- `dev/fresh.json` has only M1 late (M2 has total 0). To test "a new reason reopens it", copy the drafts folder to the scratchpad and set M2 `total` to 3, then use `?now=…T22:30`.
- `dev/error.json` has good linear and hand readings and one failed block, so `Live.feedErr` is null and the alert opens. It is not a "feed down" fixture. A missing file (404) is.
- To move time inside an open page: `H.offset += ms; H.emit('live')`.
- Direction A plus `live.js` throws in `a.js paintSpark`, and the feed never loads. That is MIN-4528's problem.

**How to apply:** reuse the scripts pattern for any later dashboard review. Remove the temporary `git worktree add --detach` checkout afterwards.
