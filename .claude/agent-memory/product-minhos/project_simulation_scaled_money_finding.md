---
name: simulation-scaled-money-finding
description: On /simulation, the model's cost drop scaled to patients on board is smaller than the plan's income (about €41 per patient a year vs €40 a case); size any derived figure before scoping it
metadata:
  type: project
---

Scaled to the patients actually on board, the simulation's modelled drop in cost is smaller than our income in the funding plan: at most €41 per patient a year (1.01 points × €4,074.88 per inhabitant, EU-27 2024) against a price of €40 a case. On the conservative line at plan month 24: 4,109 patients (revenue / €40), €164k income, roughly €62k modelled drop and roughly 12 fewer wrong or missed diagnoses (Product's interpolation on 2026-11-15, not a generator run).

**Why:** the founder asked (2026-11-15) for one diagram showing patients, matches, correct diagnoses, money saved and our income growing over time. The €18.5 billion on the page applies the 5,000-record match rate to all EU-27 spending; once scaled to the network the shape grows every month but the size is small. Scoped as MIN-4696 (sub-issues MIN-4697 to MIN-4704); the money question is the CEO seat's, MIN-4698.

**How to apply:** before scoping any new figure derived from the simulation (per patient, per hospital, per month), compute it roughly first and put the size on the issue, so design and build do not start on a claim that undercuts the pitch. Never fix the size by changing the 20%, the baselines or an axis; see [[simulation-claim-rules]]. Check MIN-4698's decision before reusing these numbers; the generator's real values may differ.
