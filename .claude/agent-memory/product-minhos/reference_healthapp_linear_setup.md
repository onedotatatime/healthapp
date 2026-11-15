---
name: reference-healthapp-linear-setup
description: Where healthapp issues live in Linear, which label and assignee each seat uses, and how to measure a subagent run for the Actuals block
metadata:
  type: reference
---

Healthapp issues: Linear team minhOS (`MIN`), project "Health app — hackathon prototype". A search for "healthapp" finds no project; search "Health app".

Seats with no Linear user of their own are assigned to Cron Jobbidis with these Role labels: CTO = `System Architect`, Release = `Repository Architect` (title prefix `R ·`), E2E = `Quality Engineer`. Product = `Product Manager` (Back), Backend = `Backend Engineer` (Cron), Frontend = `Frontend Engineer` (Ren), Design = `Product Designer` (Pix; the plain `Design` label is not the Role label), Marketing = `Marketing Lead` (Anna). There is no Lane label in Linear: the lane is the `Lane:` line under the estimate block; Release puts it on the PR.

Milestones carry the hackathon clock (M6 freeze Sun 2026-11-15 13:00, M7 submit by 18:00): check them before ranking supporting work. Example of a supporting-work story with a "locally first" founder gate: MIN-4585.

Story format to copy: MIN-4554 (alignment line, estimate block, Lane, founder's words verbatim, sub-issue table, acceptance, Scope boundaries, process notes). Example of a founder-access story: MIN-4576.

Actuals from a subagent run: `python3 ~/AppDevelopment/conductor/scripts/measure/extract-runs.py --actuals --transcript ~/.claude/projects/<project>/<session>/subagents/agent-<id>.jsonl --window <first timestamp>/<now>`. `--self` fails outside an agent worktree, and `--session <id>` measures the coordinator, not you. The rate card is the Supabase `model_pricing` table; without Supabase write `spent money: unknown — <reason>`.
