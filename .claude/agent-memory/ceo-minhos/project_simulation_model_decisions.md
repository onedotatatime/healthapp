---
name: simulation-model-decisions
description: Health app /simulation - what the CEO seat approved (20% ceiling, 10% start, the Greek Eurostat base that replaced EU-27, the 10-year slider diagram with plan year 3 repeated), the seventeen conditions, and the lessons on shape claims, whole-population headline figures and growth past the plan
metadata:
  type: project
---

The `/simulation` screen's model was decided five times by the CEO seat on the founder's behalf. The full text is the `CEO ·` comment on each issue and the entries in conductor's `docs/founder-decisions.md`.

- MIN-4506 (2026-11-14): a match lowers the chance of a wrong or missed diagnosis by 20%; conditions 1 to 3.
- MIN-4605 (2026-11-15): the effect rises from 10% to 20% with matches made so far; the cost drop is shown in euros on EU-27 2024 Eurostat spending, per inhabitant as the second line; conditions 4 to 8.
- MIN-4698 (2026-11-15): one diagram over plan months 1 to 24. Patients come from paid cases only (2,806 at month 24, not 4,109: doctor-seat fees are income, not patients). The modelled drop and our income are yearly figures on one euro axis from zero, at true size (about €88k against €229k a year at month 24). No running total of modelled money. "Saved" stays off the screen. Conditions 9 to 15. The plan's income on a public page in production went to the founder as MIN-4705.

- MIN-4721 (2026-11-15): the founder rejected the shipped three lanes ("one diagram with all the lines on the same", then "animated"). Now one plot, one scale per unit from zero (CTO, MIN-4720), real values always at the heads, readout or table, animated at 500 ms a month. Conditions 11 and 15 amended, 16 (motion) added; 1 to 10 and 12 to 14 stand. He answered MIN-4705 "OK, all three": income above the drop as is, "modelled drop" not "saved", income and €40 on the public page for the hackathon only (taking them off afterwards is still an open action).

- MIN-4746 (2026-11-15, about 10:30 EET): he rejected the animated plot before release ("one diagram with all the numbers not animated but with a slider showing in 10 years the money can be saved in greece") and the €18.5 billion EU-27 hero ("wtf is this number? asking again"). Now: one slider diagram over plan months 1 to 120, Greece's Eurostat base (€1,915.30 per inhabitant, €19,869.37 million, 10,375,764 residents, 2024), no hero, no small charts, no EU figure. Years 4 to 10 repeat the plan's year 3 (the plan's own rule), matches held past 5,000 records (CTO, MIN-4744). Lines are yearly; the readout also shows totals added up since month 1 (condition 10 lifted for the readout only). "Saved" stays off (his 08:10 yes). Year 10: 91,205 patients (0.88% of Greece), €1.76M a year, €7.0M added up, income €816k a year. A growth what-if past year 3 and the production yes are his: MIN-4755.

**Why:** the founder asked for each in his own words ("connect the drop with real money"; "match by match the model is being better and better"; "one diagram with all the numbers inside ... how the money saved and our income grow"). The seat only set parameters, and only inside what was already approved: 20% stays the upper limit, the baselines and the Eurostat base did not change. See [[founder-wants-results-not-wording-questions]].

**How to apply:**
- Any use of the 10%, the 20%, the euro figure or the timeline outside the labelled simulation screen (deck, video, landing page, post) comes back first. Production and the submission keep the founder's yes.
- A ceiling above 20%, a new baseline, a new spending base or a second currency is a new decision, not a tweak.
- Before approving any sentence about the shape of a series ("each step", "more and more", "faster"), run the generator's numbers. On MIN-4605 a proposed caption was false on the real series. On MIN-4698 the match count rose every month but the match rate fell once.
- When two roles offer two rules (two ramps, two accumulation methods), rerun the generator with each before choosing. On MIN-4698 the two ways to add up the drop differed by 1.7 times, which was the reason to use neither.
- A figure shown with its formula must be reproducible from the numbers on screen: compute it from the displayed (rounded) values, or a viewer with a calculator finds a mismatch.
- When a true-size comparison looks unfavourable (the modelled drop below our income), ship it at true size, tell the founder in one line what he will see and the one phrase that takes it off, and do not hide it for him.
- Company figures on a public page in production (the plan's income, the price) are not covered by the simulation delegations. They go to the founder as a `Q` issue that does not block staging.
- Read the founder's words about form literally. "One diagram" meant one plot with the lines on it, not one card; "grow" meant it moves. The seat's honesty conditions shape how his form is drawn; they must not swap the form for a safer one (lanes, static). Do not put motion on a cut line when the screen is about growth over time.
- When a condition gives way to his words, lift it narrowly and rebuild what it protected another way (unit ticks gone, so a line is never on screen without its real number).
- A release yes covers that release only. He said "Yes, release it" and rejected the chart's form minutes later.
- A headline that applies the model to a whole population with no path to it (the €18.5 billion) reads as meaningless to him, not as scale. Size a figure on a network the plan reaches and give scale with a plain fact.
- When his words ask for a horizon the plan does not cover, extend with the plan's own rule (no growth after year 3). Do not pick a growth number for him: a share of a country is a company growth claim, so it goes to him as an option with a recommendation and one phrase that turns it on.
- When his words can mean a yearly figure or a total, show both, labelled, with one basis for the lines.
- A word he already ruled off the screen ("saved") stays off when he uses it again in chat; he gets the phrase that flips it, not the same question twice.
- The prototype's matcher does not learn. The rising effect is an assumption about a future learning matcher; never let copy say the software improves today.
