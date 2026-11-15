# CFO fixes for deck v4.8 (decisions sheet for Anna)

| | |
|---|---|
| **Owner** | CEO seat acting as CFO (ceo-minhos), Linear MIN-4503. Applies it: Anna (marketing-minhos), on her own branch from `staging`. |
| **Date** | 15 Nov 2026 |
| **Source of every number** | `docs/business/funding-model.py` v5 (rerun: `python3 docs/business/funding-model.py`; its cash numbers are v4's, unchanged) and `docs/business/team-and-funding-plan.md` v5 (section 6). |
| **Decision behind it** | Founder, 15 Nov 2026, verbatim, on the money decisions still open: **"CFO you make the call"**. CFO on the founder's behalf: D2 (convertible loan agreement, €3.5M pre-money cap for tranche 1, 1.5 times for tranche 2, walk away above 25%), Q38 (€5,000 per trial plus €1,000 per randomised patient, billed to the sponsor or CRO only), Q39 (government revenue not counted until a contract is signed), D3 (hiring order kept; tranche-2 hires wait for the release), D5 (no founder salary from this round), D6/D13 (both new seats kept; the clinician is an employee with options). Logged in conductor `docs/founder-decisions.md`; the founder can overturn each. |
| **Rows** | **10** (16 file edits). Only Q38, Q39 and D5 reach the deck; D2, D3 and D6/D13 change no deck text (the deck shows no instrument, caps, dilution or hiring triggers). **No number on a main slide changes**; the only main-slide text change is slide 6c's headline. |

## How to apply it

1. Apply every row **word for word**, in table order. Each old text was checked by script: it occurs **exactly once** in each file named in "Where", and all rows were applied in this order to copies of the files without a miss.
2. **Old and new texts are in code format**: copy what is between the backticks, nothing else. A row marked "Block" has its exact text in the Blocks section below the table (table rows contain `|`).
3. Files: **deck-content.md** = `docs/deck/deck-content.md` · **slides.ts**, **notes.ts**, **appendix.ts** = `landing/src/deck/` (the web deck) · **pitch-script.md** = `docs/submission/pitch-script.md`. Where a row names two files, the same old text is in both: change both. notes.ts and pitch-script.md need no change: slide 6c's notes already say "five thousand to set the trial up, and a thousand per randomised patient", and the pitch script does not price trials.
4. After applying, this must return nothing: `grep -rnE "only per patient|Q38 open|Q38 \(prices\) open|Q38 is open|the site where the sponsor|€72k, from the buffer" docs/deck/deck-content.md landing/src/deck docs/submission/pitch-script.md`. Checked on the applied copies: no hit.
5. Not text, but follows from it: the slide image for 6c in `docs/deck/slides/` needs re-rendering (headline only). Pix and Ren own that. Check the new 6c headline still fits on two lines in the web deck.

## The table

| # | Decision | Where | Old text | New text | Why |
|---|---|---|---|---|---|
| 1 | Q38: slide 6c headline | Slide 6c, headline (deck and web) · deck-content.md, slides.ts | `We make it faster, and charge only per patient.` | `We make it faster. The sponsor pays per trial and per randomised patient.` | "Only per patient" was false: there is a €5,000 set-up fee per trial. Q38 decided (CFO on the founder's behalf, 15 Nov 2026; founder: "CFO you make the call"): €5,000 per trial plus €1,000 per randomised patient, billed to the sponsor or CRO. |
| 2 | Q38 | Slide 6c, "Rules kept" line · deck-content.md | `The fee stays €1,000 per randomised patient (Q38 open).` | `The fee is €5,000 per trial plus €1,000 per randomised patient, billed to the sponsor or CRO only (Q38 decided: CFO on the founder's behalf, 15 Nov 2026).` | Q38 decided (CFO on the founder's behalf, 15 Nov 2026; founder: "CFO you make the call"). |
| 3 | Q38 | A3, answer "Why €1,000 a randomised patient, not €1,500?" (end) · deck-content.md, appendix.ts | `The value case rests on days saved, not on the fee. Q38 is open: the founder decides.` | `The value case rests on days saved, not on the fee. We reconsider €1,500 only after a sponsor pilot measures 5 or more days saved.` | Q38 decided: €1,000, not €1,500. A first sponsor can say yes at €1,000 without a track record; a higher price waits for measured days. |
| 4 | Q38 | A3, answer "Trial clinics pay?" · deck-content.md, appendix.ts | `We bill the sponsor or CRO, or the site where the sponsor's recruitment budget runs through it. Never the patient.` | `We bill the sponsor or CRO only, never the site: one payer and one contract per trial. Never the patient.` | Q38 decided: the sponsor or CRO only. Faster cash, one contract, and no per-patient money passing through a site that may also be our hospital customer. |
| 5 | Q38 | A3, Sources line · deck-content.md, appendix.ts | `Q38 (prices) open.` | `Q38 (prices, who is billed) decided, 15 Nov 2026.` | Q38 decided. |
| 6 | D5 | A9 §8, "Not in the budget" bullet · deck-content.md, appendix.ts | `the founder's own pay (€3,000 a month would cost €72k, from the buffer), ` | `a salary for the founder (he takes none from this round and keeps his equity), ` | D5 decided (CFO on the founder's behalf, 15 Nov 2026; founder: "CFO you make the call"): no founder salary from this round. The old line read as if his pay would come from the buffer. Full-time pay at €48k gross from month 10 would leave a €21k buffer and 1 month of slip (model v5). |
| 7 | Q39 | A9 §8, "Not counted" bullet · deck-content.md, appendix.ts | `government revenue (tenders are slow)` | `government revenue (tenders are slow; counted only once a contract is signed)` | Q39 decided (CFO on the founder's behalf, 15 Nov 2026; founder: "CFO you make the call"): not counted until a contract or framework is signed, the same rule as grants. |
| 8 | Q38 | Open questions, Q38 row · deck-content.md | Block 8a (below) | Block 8b (below) | Q38 decided. |
| 9 | Q39 | Open questions, Q39 row · deck-content.md | Block 9a (below) | Block 9b (below) | Q39 decided. |
| 10 | Version | Deck header, Version cell (insert before v4.7) · deck-content.md | Block 10a (below) | Block 10b (below) | Version history, same format as v4.7. |

## Blocks

### Block 8: Open questions, Q38 row (deck-content.md)

8a, old:

```text
| Q38 | Slide 6c prices (was 7c; new in v3.9, moved and changed in v4.0): €5,000 per trial set-up and €1,000 per randomised patient (v3.9 had €1,500; lowered because ASPE puts the recruitment line at about $500 to $700 per participant, S29 and S30, and a vendor average at $1,379, S28) are assumptions. Also the 5 days saved and $1.10 to €1 (since v4.5 every card is in euros at that rate: €36,000 a day, €180,000 saved, €156,000 kept by the sponsor). Approve them for the slide, or show the unit without a price. Also: do we bill the sponsor or CRO only, or the site too where the sponsor's recruitment budget runs through it? | Founder, through the CEO |
```

8b, new:

```text
| Q38 | **Answered in v4.8** (CFO on the founder's behalf, 15 Nov 2026; founder: "CFO you make the call"): €5,000 per trial set-up and €1,000 per randomised patient (not €1,500), billed to the sponsor or CRO only, never the site. The 5 days saved and $1.10 to €1 stay labelled assumptions on the slide. | CFO (decided) |
```

### Block 9: Open questions, Q39 row (deck-content.md)

9a, old:

```text
| Q39 | **New in v4.2.** Slide 9 (business model) names governments and national health systems as a buyer group (founder: "We need hospitals, governments, private clinics"), but slide 10 still counts no revenue from them (tenders, year 2+). The CEO's €1M plan (v3) keeps them uncounted inside the 24 months (tenders are slow) and funds a public-procurement adviser (A9). Open: the founder confirms. | Founder, through the CEO |
```

9b, new:

```text
| Q39 | **Answered in v4.8** (CFO on the founder's behalf, 15 Nov 2026; founder: "CFO you make the call"): government revenue is not counted, in the 24 months or on slide 10, until a contract or framework is signed. Governments stay a buyer group on slide 9. | CFO (decided) |
```

### Block 10: Deck header, Version cell (insert before v4.7) (deck-content.md)

10a, old:

```text
| **Version** | **v4.7, 15 Nov 2026** (
```

10b, new:

```text
| **Version** | **v4.8, 15 Nov 2026** (MIN-4503: the CFO's decisions on the founder's delegation, applied word for word from `docs/business/cfo-fixes-v4.8.md`. Founder, 15 Nov 2026, verbatim: *"CFO you make the call"*. Slide 6c headline: the sponsor pays per trial and per randomised patient (the old headline named only a per-patient fee; there is also a €5,000 set-up fee); A3: €1,000 a randomised patient decided, billed to the sponsor or CRO only; A9: no founder salary from this round, government revenue counted only once a contract is signed; Q38 and Q39 answered. No number on a main slide changes.) v4.7, 15 Nov 2026 (
```

## Already changed on this branch (no action for Anna)

- `docs/business/funding-model.py`: v5. Same cash numbers as v4; prints the decided dilution (19.5%, 22.1% at the floor, walk-away above 25%), the €1,500 trial fee not chosen (€33.5k a trial, 18.6% of the saving), and the cost of a full-time founder (a contingency, not in the plan).
- `docs/business/team-and-funding-plan.md`: v4 → v5. The six decisions in section 6, the term sheet in section 3, dilution in section 4.
- `docs/business/clinical-trials-fit.md`: section 8, Q38 decided (who pays, the set-up fee paid at signing, €1,500 only after measured days).

## The decisions and their effect on the model

| Decision | Choice | Effect on the model |
|---|---|---|
| D2 | One convertible loan agreement; pre-money caps €3.5M (floor €3.0M), tranche 2 at 1.5 times (€5.25M); 20% discount; no cash interest; walk away above 25% | Dilution about 19.5% (was a range of 19.5% to 29%); 22.1% at the floor. No cash change |
| Q38 | €5,000 per trial (paid at signing) plus €1,000 per randomised patient; the sponsor or CRO billed only | None: €24k a trial, 13% of the €180k saving; five a year about €120k, not in slide 10; break-even with trials still month 28 |
| Q39 | Government revenue not counted until a contract is signed | None: it was never in the model |
| D3 | Order kept (months 1, 2, 3, 10, 13); tranche-2 hires wait for the release; the second engineer also for the first paid hospital, else month 19 | None in the base case; makes "tranche 1 lasts to month 12.5 if the gate fails" binding |
| D5 | No founder salary from this round | None. Full-time at €48k gross from month 10 would cost €76k: buffer €21k, break-even month 32, low €77k, slip 1 month |
| D6/D13 | Both new seats kept; the clinician an employee with options, not co-founder shares | None: €78k and €57k stay; team €592k (59%) |
