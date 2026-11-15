---
name: shared-worktree-data-files
description: other role agents edit data/ and scripts/ in the same worktree while Ren builds; never overwrite tracked data files for review
metadata:
  type: feedback
---

Never copy a scratch fixture over a tracked data file (e.g. data/synthetic/simulation.json) to look at a screen. In the MIN-4702 build Cron regenerated that file in the same worktree minutes later, so an overwrite can destroy another agent's uncommitted output.

**Why:** the worktree is shared by Back, Anna and the CEO seat during one story; contracts also change mid-build (MIN-4698 changed the money units after I started).
**How to apply:** review with a scratch vite config that swaps the JSON import (resolveId plugin, FIXTURE env), and re-read the issue comments before writing the parser. See [[feedback_healthapp_worktree_and_tests]].
