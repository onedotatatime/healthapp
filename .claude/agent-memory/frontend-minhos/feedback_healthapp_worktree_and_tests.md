---
name: healthapp-worktree-and-test-setup
description: healthapp frontend facts that cost time (MIN-4675): write hook limits edits to the session worktree; no jsdom so component DOM tests are renderToStaticMarkup; browser harness trick
metadata:
  type: feedback
---

The Write/Edit hook blocks any file outside the session's own worktree (agent-call-live-runs-*). A second worktree I created for the branch was unwritable, so I removed it and switched the session worktree to the feature branch (`git switch -c feat/... origin/staging`). Other agents' uncommitted `.claude/agent-memory` edits ride along; stage only your own files.

**Why:** MIN-4675 (2026-11-15), lost ten minutes and an `npm ci` to a wrong worktree.
**How to apply:** do not `git worktree add` for yourself in healthapp; branch inside the session worktree at the start.

healthapp's vitest is node-only, `include: src/**/*.test.ts`, no jsdom or testing-library, and "no new library" is the rule. Component DOM is tested with `createElement` + `renderToStaticMarkup` in a `.test.ts`; stateful logic (stream, guard) is kept pure and injected (`send`), so it is tested without a DOM. Interaction is checked in the browser pane through a throwaway harness under `.harness/` (vite root `.harness`, `.claude/launch.json`, rAF shimmed to timers because a hidden pane pauses it); delete both before committing.
