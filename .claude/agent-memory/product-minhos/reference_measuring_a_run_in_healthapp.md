---
name: measuring-a-run-in-healthapp
description: How to get real Actuals (time, tokens) for a role-agent run in a healthapp worktree, where the extractor's default lookup returns "no transcript found"
metadata:
  type: reference
---

In a healthapp worktree, `extract-runs.py --actuals` with no arguments returns "no transcript found (None)". Several earlier Product Actuals blocks were posted as "unmeasured" for that reason. It does work when given the run's own transcript and a window:

- The extractor is in conductor, not in healthapp: `~/AppDevelopment/conductor/scripts/measure/extract-runs.py`.
- The transcript of a dispatched role agent is `~/.claude/projects/<worktree path with / replaced by ->/<session id>/subagents/agent-<id>.jsonl` (the newest file there).
- Pass `--transcript <that file> --window <ISO from>/<ISO to>`; `--actuals` refuses to run without `--window`.
- Money: `dashboard/rates.json` (copied from conductor `public.model_pricing`) had no `claude-fable-5-2` row on 2026-11-15, only `claude-fable-5-1`. Say which row was used.

Check the clock with `date -u` before writing a time into a comment. First used on MIN-4669.
