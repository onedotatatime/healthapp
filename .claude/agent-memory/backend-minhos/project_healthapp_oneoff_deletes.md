---
name: healthapp-oneoff-deletes
description: running a CTO-scoped one-off delete of real rows in healthapp (MIN-4629, 2026-11-15): catalog pre-flight, counts-only output, gate quoted at the wrong scope, and whole-account gates that race a live user
metadata:
  type: project
---

MIN-4629 (2026-11-15): the CTO's delete of the founder's pre-fix refused rows stopped at the gate. The decision required
"13 confirmed"; the matched account held 10 and the whole `healthapp_demo` schema held 13. Nothing was deleted; the
CTO decides whether the threshold was meant schema-wide.

**Why:** a number quoted in a decision ("13 confirmed") does not say at which scope it was counted. The guard query
counted per account, so an honest stop came from a scope mismatch, not from bad data.

**How to apply:**
- Before any delete on `documents`, check the catalog (not rows): in both schemas only `results`, `findings`,
  `file_analysis` reference it, all ON DELETE CASCADE, and it has no triggers (2026-11-15). A new referencing table
  means the delete cascades past the guards: stop and report.
- Real-row work stays counts only: run the CTO's files as written, add nothing that selects ids, names, paths or dates.
- When a gate number fails, also run the same count one scope wider (schema-wide) so the CTO can see whether the
  threshold was quoted at the other scope; report both, act on neither.
- A gate that fails is a stop even when the explanation looks obvious: the delete cannot be undone.
- Round 2 (same night) stopped too: between rounds the founder re-scanned, so one post-fix refused row with a third
  reason appeared, and the gates `refused_other = 0` and `docs_after_fix_deploy = 0` (counted over the whole account)
  failed while `deletable` stayed 18. On a live account, gates must count only the target window (rows before the
  cut-off), or every round races the user. Say so when reporting the stop; diffing round 1 against round 2 by total
  arithmetic located the one new row without querying it.
- Round 3 (CTO amendment 2: gate on pre-cut-off rows only) passed every gate and deleted 18; the schema went 33 to 15
  with every kept line equal. Window-scoped gates plus a whole-schema before/after table (no account filter) are the
  shape that works on a live account: the account-filtered query cannot read "after" once its anchor rows are gone.
- Actuals from a subagent run: `extract-runs.py --actuals` and `--self` find nothing here; pass
  `--transcript ~/.claude/projects/<p>/<parent-session>/subagents/agent-<id>.jsonl --actuals --window FROM/TO`.
