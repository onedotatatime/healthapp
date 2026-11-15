---
name: mockup-renders-and-actuals
description: How to render 390 px HTML mockups with headless Chrome without cropping, and where a design run's own transcript and rate card are for Actuals
metadata:
  type: reference
---

**Rendering phone mockups.** Headless Chrome will not lay a page out narrower than about 500 px, so `--window-size=390,844` gives a 500 px layout cropped to 390 (labels cut off on the right, and it looks like a design bug). Load the mockup in an `<iframe>` of exactly 390 x 844 inside a wrapper page, pass `--allow-file-access-from-files`, screenshot the wrapper and crop. The same wrapper can read `getBoundingClientRect` and computed styles from the iframe and print them with `--dump-dom`: target sizes, overflow, clipped labels and the count of `backdrop-filter` surfaces come back as text, with no screenshot opened.

**Actuals for a dispatched run.** `extract-runs.py --session <id>` measures the coordinator's chat, not the agent. The agent's own transcript is in `~/.claude/projects/<project>/<session>/subagents/agent-*.jsonl`; grep those for a string only this run wrote, then use `--transcript <file> --actuals --window FROM/TO`. The rate card is the Supabase `model_pricing` table; without a Supabase tool the money line reads "unknown" with that reason.

Learned on MIN-4586 (healthapp, 2026-11-14). Related: [[scorecard-normalisation]].
