---
name: healthapp-function-download-diff
description: healthapp function deploys — download each live function into its own folder before diffing; one-off smoke scripts go in the scratchpad
metadata:
  type: project
---

`supabase functions download <name>` writes `supabase/functions/_shared/` too, so downloading several functions into one folder overwrites the shared files with the last one's copy. On MIN-4640 (2026-11-15) each function went into its own folder, then every file was compared with `git show <commit>:<path> | cmp`. That proved v23/v5/v13 = `39c6e9f` before and v24/v6/v14 = `8624839` after. `supabase/config.toml` sets `verify_jwt = false` per healthapp function; `functions list -o json` shows it, and passing `--no-verify-jwt` keeps it from flipping.

The session's Write hook refuses files in another worktree (even my own deploy worktree), so a one-off smoke script goes in the scratchpad, takes the repo path as an argument, and its text goes on the issue so it outlives the scratchpad.

**Why:** a merged `_shared/` download would have produced false "differs" (or false "identical") results on the rollback-target check.
**How to apply:** every function deploy round: per-function download folders, cmp file by file, check `verify_jwt` before and after. Related: [[healthapp-function-smoke-creds]], [[healthapp-sql-needs-connector]].
