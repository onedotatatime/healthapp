---
name: simulation-model-decisions
description: Health app /simulation - what the CEO seat approved (20% ceiling, 10% start, EU-27 2024 euro figure), the eight conditions, and the lesson to test shape claims on the data
metadata:
  type: project
---

The `/simulation` screen's model was decided twice by the CEO seat on the founder's behalf: MIN-4506 (2026-11-14, a match lowers the chance of a wrong or missed diagnosis by 20%, three conditions) and MIN-4605 (2026-11-15, the effect rises from 10% to 20% with matches made so far; the cost drop is shown in euros on EU-27 2024 Eurostat spending, per inhabitant as the second line; conditions 4 to 8). The full text is the `CEO ·` comment on each issue and the two entries in conductor's `docs/founder-decisions.md`.

**Why:** the founder asked for both in his own words ("connect the drop with real money"; "match by match the model is being better and better"). The seat only set parameters, and only inside what was already approved: 20% stays the upper limit at every step, so nothing was widened. See [[founder-wants-results-not-wording-questions]].

**How to apply:**
- Any use of the 10%, the 20% or the euro figure outside the labelled simulation screen (deck, video, landing page, post) comes back first. Production and the submission keep the founder's yes.
- A ceiling above 20%, a new baseline or a second currency is a new decision, not a tweak.
- Before approving any sentence about the shape of a series ("each step", "more and more", "faster"), run the generator's numbers. On MIN-4605 a proposed caption ("each step lowers the cost more than the one before") was false on the real series; the match rate even dips at one step.
- A figure shown with its formula must be reproducible from the numbers on screen: compute it from the displayed (rounded) values, or a viewer with a calculator finds a mismatch.
- The prototype's matcher does not learn. The rising effect is an assumption about a future learning matcher; never let copy say the software improves today.
