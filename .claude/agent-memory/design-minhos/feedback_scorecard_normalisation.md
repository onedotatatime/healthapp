---
name: scorecard-normalisation
description: When merging seat scorecards on different scales, map each seat's "no evidence" anchor to 0, not raw percentages
metadata:
  type: feedback
---

When seats score on different scales (0–5, 1–5, 0–3, "×20"), convert each with its own floor → 0 and ceiling → 100. A raw percentage of a 1-based scale gives the floor free points: Sales 21/50 read as 42% but is 28 normalised; Product 49/100 is 36. After conversion the four health-app seats sat within 28–37, and Product's "test" band (50) landed at 37.5, next to the CEO's G1 bar of ~40.

**Why:** MIN-4441 (health-app lean room, 14 Nov 2026). Averaging raw percentages would have made the 1-based seats look more optimistic than they were, and hidden that two seats set the same bar independently.

**How to apply:** any synthesis of scored seat papers. State the conversion rule in a table, show raw and normalised side by side, and judge gates on named rows, not the total. Related: [[room-synthesis-disagreements]] (unflagged tensions inside one seat's own paper are worth naming).
