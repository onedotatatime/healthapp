---
name: reference-actuals-measurement
description: How a ceo-minhos subagent run measures its own Actuals (time, tokens) and prices them without Supabase access
metadata:
  type: reference
---

- `extract-runs.py --actuals` alone and `--self` find nothing for a dispatched subagent (it is not in an `agent-<id>` worktree). What works: `python3 ~/AppDevelopment/conductor/scripts/measure/extract-runs.py --actuals --transcript <file> --window <FROM>/<TO>` (UTC ISO times). The file is `~/.claude/projects/<project-dir>/<session-id>/subagents/agent-*.jsonl`. The session id is the last part of the scratchpad path.
- `--session <id>` measures the coordinator's transcript, not the subagent's.
- Rate card without Supabase: `~/AppDevelopment/conductor/supabase/migrations/0057_cost_report_cents_and_pricing.sql`. claude-opus-5-5 costs, in $ per million tokens: input 4, output 20, cache write 5, cache read 0.20. Web search is $10 per 1,000. Check for a later migration before you rely on these rates.
