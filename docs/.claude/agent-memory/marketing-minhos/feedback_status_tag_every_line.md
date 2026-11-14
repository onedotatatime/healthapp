---
name: status-tag-every-line
description: Health app copy — tag every example line as runs / product-only / not built before it goes in a deck or paper, and never write a founder rule wider than his words
metadata:
  type: feedback
---

On the health app, give every example line a status before it is used: **runs in the demo**, **product only**, or **not built**. Check it against the real/simulated table (`docs/PRD.md` §10.2) and the CTO's allowed / product-only / forbidden list (`docs/reviews/cto-review.md` §6).

**Why:** my deck v1 (MIN-4429, 2026-11-13) carried three lines that failed this. "The patient holds the key" (the demo keeps the key on the server). "A consented, translated history that arrives before the patient does" (no sharing at a distance, no translation; the record opens only in person, PRD P6). "Insurers: never a buyer ... not a channel" (the founder's rule is about data only; who may pay is his five open edges). The CEO review caught the first and third (comments 5 and 6). I found the second myself a day later, while writing the lean-workshop paper (MIN-4437). A privacy-first health brand does not survive one claim the system does not keep.

**How to apply:** when a value proposition is written for a buyer, check the *mechanism* it needs (remote grant, translation, dependants) against the stories in the PRD, not only the wording against the forbidden list. If the mechanism is missing, the line is a "proposition to test" and goes to the founder as an open question. Quote a founder rule in his own words and stop there; anything wider is a proposal with his name on the decision.

Related: [[research-donotuse-vs-brief]] (label assumption numbers, raise a Q with an owner).
