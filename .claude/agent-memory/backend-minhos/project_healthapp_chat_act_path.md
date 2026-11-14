---
name: healthapp-chat-act-path
description: Non-obvious facts about the dashboard chat bridge (MIN-4497 runs 2 and 3): ripgrep glob behaviour, CI key grep trap, what the act guard may and may not allow after the CTO's M1-M4/S1 fixes, static serving rules, snapshot test traps
metadata:
  type: project
---

Measured with a real ripgrep (the claude binary answers as rg with `ARGV0=rg`): a `-g` glob overrides BOTH gitignore and hidden-file rules (`-g '*.json'` finds an ignored `launch.json`). So `GREP_GLOB_EXTS` in `dashboard/chat_guard.py` is only md, py, ts, tsx, js, mjs, css, html (run 3, CTO M4); json, yaml, toml, txt, sh, sql go through Grep's `type` (`rg --type`), which keeps the ignore rules. **How to apply:** any new Grep/Glob allowance gets a canary test with a real rg, and the premise (the leaking call) is asserted as a control.

Run 3 act-guard rules (CTO 420bf529): no `npm`, `npx`, `pytest`, `python3 -m` and no `linear-as` in either layer (the agent can write package.json or conftest.py, and `linear-as` with inline values allowed any mutation); writes inside the worktree never under `.github`, `.claude`, `.husky`, `.githooks` (any depth, lower-cased because the Mac disk is case-insensitive) or to `.mcp.json`, while the agent-memory folder (which sits under the MAIN checkout's `.claude/`) stays writable; the act turn always starts `--session-id <actSession>` (a fresh uuid stored on the proposal, hidden from responses), never `--resume`. Static serving: `Host` is checked on every static request, realpath containment per file, no dot segments, no listing, `--extra-dir NAME=DIR` at `/NAME/`, bridge refuses a folder overlapping the key folder.

The Dashboard workflow's key-pattern grep runs over tracked files and matches the bare Supabase secret prefix, even in a comment or the README. Write such a prefix split (`"sb" + "_secret_"`) in code and describe it in words in prose. **How to apply:** run the grep before the first push, not after (as `grep -rnE ... dashboard` when git refuses the pathspec form).

Snapshot tests: `sn.build()` runs the real `build_branches` (real git, real `gh pr list`, slow and impure); a new test that calls `build` or `main` must `mock.patch.object(sn, 'build_branches', return_value={})` and `fetch_linear`, or it takes minutes.

`chat_service.sh` runs under the Mac's `/bin/bash` 3.2: an empty array expanded under `set -u` fails, so optional repeated options are kept as a newline-separated string. `dashboard/tests/test_chat_service.py` runs the real script with a fake HOME and fake `launchctl` and `lsof`.

Mutation sweep of the act path (run 2, 62 mutants): everything killed except four defence-in-depth rows that are redundant by design, plus one real gap: when two guards stack, build the fixture that passes the first and fails only the second.
