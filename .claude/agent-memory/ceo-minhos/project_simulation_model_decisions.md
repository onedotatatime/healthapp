---
name: simulation-model-decisions
description: Health app /simulation - what the CEO seat approved (20% ceiling, 10% start, EU-27 2024 euro figure, the month timeline with per-case ramp and yearly money figures), the fifteen conditions, and the lessons on shape claims and on rerunning the generator
metadata:
  type: project
---

The `/simulation` screen's model was decided three times by the CEO seat on the founder's behalf. The full text is the `CEO ·` comment on each issue and the entries in conductor's `docs/founder-decisions.md`.

- MIN-4506 (2026-11-14): a match lowers the chance of a wrong or missed diagnosis by 20%; conditions 1 to 3.
- MIN-4605 (2026-11-15): the effect rises from 10% to 20% with matches made so far; the cost drop is shown in euros on EU-27 2024 Eurostat spending, per inhabitant as the second line; conditions 4 to 8.
- MIN-4698 (2026-11-15): one diagram over plan months 1 to 24. Patients come from paid cases only (2,806 at month 24, not 4,109: doctor-seat fees are income, not patients). The modelled drop and our income are yearly figures on one euro axis from zero, at true size (about €88k against €229k a year at month 24). No running total of modelled money. "Saved" stays off the screen. Conditions 9 to 15. The plan's income on a public page in production went to the founder as MIN-4705.

**Why:** the founder asked for each in his own words ("connect the drop with real money"; "match by match the model is being better and better"; "one diagram with all the numbers inside ... how the money saved and our income grow"). The seat only set parameters, and only inside what was already approved: 20% stays the upper limit, the baselines and the Eurostat base did not change. See [[founder-wants-results-not-wording-questions]].

**How to apply:**
- Any use of the 10%, the 20%, the euro figure or the timeline outside the labelled simulation screen (deck, video, landing page, post) comes back first. Production and the submission keep the founder's yes.
- A ceiling above 20%, a new baseline, a new spending base or a second currency is a new decision, not a tweak.
- Before approving any sentence about the shape of a series ("each step", "more and more", "faster"), run the generator's numbers. On MIN-4605 a proposed caption was false on the real series. On MIN-4698 the match count rose every month but the match rate fell once.
- When two roles offer two rules (two ramps, two accumulation methods), rerun the generator with each before choosing. On MIN-4698 the two ways to add up the drop differed by 1.7 times, which was the reason to use neither.
- A figure shown with its formula must be reproducible from the numbers on screen: compute it from the displayed (rounded) values, or a viewer with a calculator finds a mismatch.
- When a true-size comparison looks unfavourable (the modelled drop below our income), ship it at true size, tell the founder in one line what he will see and the one phrase that takes it off, and do not hide it for him.
- Company figures on a public page in production (the plan's income, the price) are not covered by the simulation delegations. They go to the founder as a `Q` issue that does not block staging.
- The prototype's matcher does not learn. The rising effect is an assumption about a future learning matcher; never let copy say the software improves today.
