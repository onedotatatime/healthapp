---
name: project-possible-diagnoses-history
description: History of the doctor's "Possible causes / Possible diagnoses" feature in healthapp: cut on 2026-11-14, brought back by the founder on 2026-11-15, and the regulatory precedent to cite
metadata:
  type: project
---

PRD story E3 "Possible causes, for the doctor only" was cut on 2026-11-14 (MIN-4489, Canceled, nothing built). On 2026-11-15 about 04:30 Athens the founder asked for "Possible diagnoses" on the live doctor dashboard; it is slice 2 (Lane C) of MIN-4659, with the CTO's decision first on MIN-4660.

**Why:** the founder's newer words outrank a coordinator cut. The regulatory precedent is PRD §8 flag 3: possible causes make the product an EU MDR medical device, accepted for the hackathon demo, and it goes on the deck's last slide. It covers the doctor-only list; it does not cover advice ("Suggested next exams"), ranking or anything on the patient side.

**How to apply:** when this feature comes up again, do not reopen MIN-4489; work on MIN-4659. Product already ruled "Suggested next exams" and a contact flow out of scope. Anything beyond the E3 rules (no number, no rank, citations on every card, doctor session only) goes from the CTO to the CEO seat before a build. See [[reference-healthapp-linear-setup]] for labels and the story format.
