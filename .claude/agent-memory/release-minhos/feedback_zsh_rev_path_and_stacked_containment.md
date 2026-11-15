---
name: zsh-rev-path-and-stacked-containment
description: zsh eats `$t:e2e-...` as a modifier (use "${t}:path"); a stacked branch's base can show "content differs" from staging even when fully merged
metadata:
  type: feedback
---

In zsh, `git show $t:e2e-live/x.ts` fails: `$t:e` is read as the `:e` (extension) modifier. Always write `"${t}:path"` for rev:path arguments.

Containment check for stacked branches (MIN-4750, 2026-11-15): `feat/min-4748` (base of `feat/min-4749`) showed its file "differs" from staging after #166's squash, because #166 rewrote that file later. Prove it with `git merge-base --is-ancestor <base-head> <merged-pr-head>` instead. Likewise the merged PR head can differ in a file that staging also changed (3-way merge result); read the merged file, do not treat it as unmerged.

**Why:** both nearly read as "not merged, keep the branch" or as a broken command.
**How to apply:** in the cleanup containment loop, fall back to the ancestor check against the merged PR head before keeping a branch. Related: [[release-audit-cleanup]].
