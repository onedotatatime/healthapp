---
name: reference-actuals-subagent
description: How to measure Actuals for a healthapp subagent run (extract-runs.py needs the subagent transcript and a window); money is unknown without Supabase
metadata:
  type: reference
---

`python3 scripts/measure/extract-runs.py --actuals` (run in ~/AppDevelopment/conductor) with no arguments, or with `--session <parent id>`, measures the coordinator, not this agent. Use:

`--transcript ~/.claude/projects/<project-dir>/<session>/subagents/agent-<id>.jsonl --actuals --window <FROM>/<TO>` (newest `agent-*.jsonl` in that folder; `head -c 300` it to check the brief matches).

The rate card is in Supabase `model_pricing`, so write `spent money: unknown — <reason>` when the dispatch has no Supabase access. Post Linear comments as yourself with `~/.claude/bin/linear-as MARKETING`, body built with python json.dumps, and check exit 0.
