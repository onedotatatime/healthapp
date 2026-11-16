# CFO fixes for deck v4.7 (numbers sheet for Anna)

| | |
|---|---|
| **Owner** | CEO seat acting as CFO (ceo-minhos), Linear MIN-4503. Applies it: Anna (marketing-minhos), on branch `fix/cfo-v4.7`. |
| **Date** | 15 Nov 2026 |
| **Source of every number** | `docs/business/funding-model.py` v4 (rerun: `python3 docs/business/funding-model.py`; `--v3` gives the old numbers) and `docs/business/team-and-funding-plan.md` v4. |
| **Decision behind it** | Founder, 15 Nov 2026, verbatim, on the tranche choice: **"CFO will answer"**. CFO on the founder's behalf: €1M stays, tranches €400k then €600k, both committed at signing, the second released by the gate. Logged in conductor `docs/founder-decisions.md`. |
| **Rows** | **103**, covering the four must-fix items and every should-fix item of the CFO review of deck v4.6 (MIN-4503, 15 Nov 2026 03:37 UTC). |

## How to apply it

1. Apply every row **word for word**, in table order. Each old text was checked by script: it occurs **exactly once** in each file named in "Where", and all rows were applied in this order to copies of the files without a miss.
2. **Old and new texts are in code format**: copy what is between the backticks, nothing else. In the deck files a `\*` is a literal backslash and star; keep it. A row marked "Block" has its exact text in the Blocks section below the table (table rows and multi-line text).
3. Files: **deck-content.md** = `docs/deck/deck-content.md` · **slides.ts**, **notes.ts**, **appendix.ts** = `landing/src/deck/` (the web deck) · **pitch-script.md** = `docs/submission/pitch-script.md`. Where a row names two files, the same old text is in both: change both.
4. After applying, this must return nothing: `grep -rnE "month 29|month twenty-nine|6 to 14%|€75M|seventy-five|€300k|€700k|€285k|€112k|€204k|never below the start|gap before tranche 2|fifty dollars|\$1\.9B|\$8\.5B|10 trials a year|Wrong diagnoses cost" docs/deck/deck-content.md landing/src/deck docs/submission/pitch-script.md`, except three expected hits: the version history in the deck header (old entries keep their old numbers on purpose), the v4.3 note above slide 13 ("tranches of €300k and €700k", history), and "certification (CTO estimate €300k to €800k" in A9 §8 (deck-content.md and appendix.ts), which is not a tranche. Checked on the applied copies: see the hand-back.
5. Not text, but follows from it: the slide images in `docs/deck/slides/` for slides 3, 6c, 7, 10, 13, 14 and A3, A4, A6, A7, A9 need re-rendering, and A9c in the web deck gains three lines (check it still fits). Pix and Ren own those.

## The table

| # | Where | Old text | New text or number | Why |
|---|---|---|---|---|
| | **Must-fix 1: break-even month** | | | |
| 1 | Slide 14, headline · deck-content.md | `Why €1M: six people, 29% to sell, break-even at month 29\*.` | `Why €1M: six people, 30% to sell, break-even at month 31\*.` | Break-even is the month gross profit (revenue less €5 a case) covers running costs: month 31. Month 29 was revenue alone; cash falls until month 30. Sell is 30% after the cost-method fix (should-fix row on per-hire cost). |
| 2 | Slide 14, headline (web) · slides.ts | `Why €1M: six people, 29% to sell, break-even at month 29*.` | `Why €1M: six people, 30% to sell, break-even at month 31*.` | Same as the row above. |
| 3 | Slide 14, footer (deck and web note) · deck-content.md, slides.ts | `Break-even on our conservative revenue line (slide 10).` | `Break-even: when gross profit covers running costs, on our conservative revenue line (slide 10).` | One definition of break-even, said once on the slide. |
| 4 | Slide 14, speaker notes (deck and notes.ts) · deck-content.md, notes.ts | `Twenty-nine percent goes to selling. On our conservative line it pays for itself at month twenty-nine, with money left.` | `Thirty percent goes to selling. On our conservative line we break even at month thirty-one, with money left.` | Break-even is the month gross profit (revenue less €5 a case) covers running costs: month 31. Month 29 was revenue alone; cash falls until month 30. |
| 5 | A9 §6, heading line · deck-content.md, appendix.ts | `**6. Break-even, on both revenue lines (slide 10)** *(gross margin 87.5%: €5 cost on a €40 case)*` | `**6. Break-even, on both revenue lines (slide 10)** *(gross margin 87.5%: €5 cost on a €40 case; break-even is the first month gross profit covers running costs)*` | As row 4. |
| 6 | A9 §6, table row · deck-content.md, appendix.ts | Block 6a (below) | Block 6b (below) | Break-even is the month gross profit (revenue less €5 a case) covers running costs: month 31. Month 29 was revenue alone; cash falls until month 30. Upside unchanged (month 12 on both definitions). |
| 7 | A9 §7, last line · deck-content.md, appendix.ts | `Rerun with the same €112k buffer: break-even still month 29, and sales can still slip 6 months.` | `Rerun with the same €97k buffer and the same €400k first tranche: break-even still month 31, and sales can still slip 5 months.` | Model v4 rerun of the levers (they save €115.6k; the ask is still about €885k). |
| 8 | A9 §8, "Not counted" bullet · deck-content.md, appendix.ts | `(if the sponsor pilot converts, break-even moves to month 27)` | `(if the sponsor pilot converts, one trial in months 19 to 24 and then five a year, break-even moves to month 28)` | Month 27 was revenue alone; on gross profit it is month 28. Trial volume is five a year everywhere. |
| 9 | Pitch script, "Who is the team" answer · pitch-script.md | `On our conservative revenue line, revenue passes costs at month 29, with about €200k still in the bank.` | `On our conservative revenue line we break even (gross profit covers running costs) at month 31, with about €186k still in the bank at the lowest point.` | Break-even is the month gross profit (revenue less €5 a case) covers running costs: month 31. Month 29 was revenue alone; cash falls until month 30. The low after tranche 2 is €186k (month 30), with every hire costed one way. |
| | **Must-fix 2: tranches and the buffer** | | | |
| 10 | Slide 13, "What I ask" · deck-content.md | `**What I ask.** **€1M\*** over 24 months, in two gated tranches:` | `**What I ask.** **€1M\*** over 24 months, committed at signing, released in two gated tranches:` | CFO decision on the founder's delegation ("CFO will answer", 15 Nov): €400k then €600k, both committed at one signing, the second released by the gate. €300k left 3 to 8 days of cash before its own gate. |
| 11 | Slide 13, "What I ask" (web) · slides.ts | `'over 24 months, in two gated tranches'` | `'over 24 months, committed at signing, released in two gated tranches'` | As row 10. |
| 12 | Slide 13, gates table, row 1 · deck-content.md | Block 12a (below) | Block 12b (below) | As row 10. |
| 13 | Slide 13, gates table, row 2 · deck-content.md | Block 13a (below) | Block 13b (below) | CFO decision on the founder's delegation ("CFO will answer", 15 Nov): €400k then €600k, both committed at one signing, the second released by the gate. €300k left 3 to 8 days of cash before its own gate. The gate is a written commitment: "1,000 paid cases a year" cannot be measured at the end of a free pilot. |
| 14 | Slide 13, gates (web), row 1 · slides.ts | `{ gate: 'A hospital signs a pilot', amount: '€300k' },` | `{ gate: 'A hospital signs a pilot', amount: '€400k' },` | As row 10. |
| 15 | Slide 13, gates (web), row 2 · slides.ts | `{ gate: 'The pilot proves price, volume and cost per case', amount: '€700k' },` | `{ gate: 'The hospital commits to 1,000+ paid cases a year at €40+; a case costs us €5 or less', amount: '€600k' },` | As row 10. |
| 16 | Slide 13, speaker notes (deck and notes.ts) · deck-content.md, notes.ts | `What I ask is one million euros over twenty-four months, in two parts. Three hundred thousand only when a hospital signs a pilot. Seven hundred thousand only when that pilot proves the price, the volume and the cost of each case.` | `What I ask is one million euros over twenty-four months, committed at one signing. Four hundred thousand when a hospital signs a pilot. Six hundred thousand released only when that hospital commits to paid cases at our price, and each case costs us five euros or less.` | As row 10. |
| 17 | Slide 13, "Sources" line · deck-content.md | `§5 (the three numbers: €40 a case or more, 1,000 cases a year or more, €5 or less a case to run; on A9)` | `§5 (the gate: the hospital commits in writing to 1,000 or more paid cases a year at €40 or more, and a case costs €5 or less to run; on A9)` | The gate as a written commitment. |
| 18 | A9 §2, buffer row · deck-content.md, appendix.ts | Block 18a (below) | Block 18b (below) | One cost method for every hire adds €14.5k; it comes out of the buffer (should-fix row on per-hire cost). |
| 19 | A9 §4, bullet 2 · deck-content.md, appendix.ts | Block 19a (below) | Block 19b (below) | As row 10. |
| 20 | A9 §4, bullet 3 · deck-content.md, appendix.ts | `- The buffer (€112k) covers about 3.4 months of the steady burn: slower sales, a longer DPIA or ethics approval, a gap before tranche 2.` | `- The buffer (€97k at month 24) covers about 2.9 months of the steady burn: slower sales, a longer DPIA or ethics approval.` | The old "gap before tranche 2" was false: the buffer sat in tranche 2. The reserve for the gap is now in tranche 1 (bullet above). |
| 21 | A9 §5, G2 row (end of the row) · deck-content.md, appendix.ts | Block 21a (below) | Block 21b (below) | As row 10. |
| 22 | A9 §5, the three-numbers row · deck-content.md, appendix.ts | Block 22a (below) | Block 22b (below) | CFO decision on the founder's delegation ("CFO will answer", 15 Nov): €400k then €600k, both committed at one signing, the second released by the gate. €300k left 3 to 8 days of cash before its own gate. Price and volume become one written commitment, measurable when the gate fires. |
| 23 | 3-minute script, the ask (deck); pitch script, 2:30 to 3:00 · deck-content.md, pitch-script.md | `I ask for one million euros over twenty-four months, released only when a hospital signs a pilot.` | `I ask for one million euros over twenty-four months: four hundred thousand when a hospital signs a pilot, the rest when that hospital commits to paid cases.` | Only the first tranche is released by the pilot signature; "€1M released only when a hospital signs a pilot" overstated it. |
| 24 | Pitch script, "Who is the team" answer · pitch-script.md | `in two tranches: €300k when a hospital signs a pilot, €700k only when the pilot proves €40 a case or more, 1,000 cases a year or more and €5 or less a case to run.` | `in two tranches, both committed at signing: €400k when a hospital signs a pilot, €600k released only when that hospital commits in writing to 1,000 or more paid cases a year at €40 or more, and a case costs €5 or less to run.` | As row 10. |
| 25 | Pitch script, "Who is the team" answer · pitch-script.md | `29% goes to selling.` | `30% goes to selling.` | Sell is €297k of €1M after the cost-method fix. |
| 26 | Open questions, Q27 · deck-content.md | `€1M over 24 months, €300k then €700k (slides 13, 14, A9)` | `€1M over 24 months, €400k then €600k, both committed at signing (slides 13, 14, A9; the tranche split is the CFO's, on the founder's delegation, 15 Nov: "CFO will answer")` | As row 10. |
| | **Must-fix 3: slide 10 ratio** | | | |
| 27 | Slide 10, second number · deck-content.md | `- **About 6 to 14%\*:** that revenue as a share of what better records save on tests, in Greece alone.` | `- **About 12 hospitals\*** at €40k a year each cover our running costs.` | Not like-for-like: year-3 revenue from every country divided by savings in Greece alone. Replaced by a ratio on one base: break-even revenue (€458k a year) ÷ €40k a hospital = 11.4, so 12 (11 bring €440k, short). |
| 28 | Slide 10, strip (web) · slides.ts | `strip: { value: 'About 6 to 14%*', text: 'that revenue as a share of what better records save on tests, in Greece alone.' },` | `strip: { value: 'About 12 hospitals*', text: 'at €40k a year each cover our running costs.' },` | As row 27. |
| 29 | Slide 10, speaker notes (deck and notes.ts) · deck-content.md, notes.ts | `Compare that with slide 7: better records could save four to seventy-five million a year on tests, in Greece alone. Our customers pay a small share of what the system saves.` | `About twelve hospitals, at forty thousand euros a year each, cover our running costs.` | As row 27. |
| 30 | Slide 10, "Sources" line · deck-content.md | `` **Sources:** S10 and S15 via slide 7; S18; S19; S8; `buyers.md`. `` | `` **Sources:** S18; S19; S8; `buyers.md`; the break-even line from `docs/business/funding-model.py` (A9). `` | Slide 10 no longer uses slide 7's savings. |
| 31 | A6, contents item 5 · deck-content.md | `5. "A fraction of what they save", the arithmetic.` | `5. Break-even in hospitals, the arithmetic.` | As row 27. |
| 32 | A6 §5, the paragraph · deck-content.md, appendix.ts | `**5. The arithmetic:** **"A fraction of what they save", the arithmetic** *(our estimate, shown small on the slide)*: slide 7 says better records could save **€4M (conservative) to €75M (upside) a year on tests, in Greece alone**. Our year-3 revenue from every customer in every country is **€0.56M to €4.85M**: about **14%** of the conservative saving and about **6%** of the upside one. Savings outside Greece and the savings on diagnostic error itself are not counted, so the real ratio is smaller.` | `**5. Break-even in hospitals** *(our estimate)*: at the steady team of six our running costs are about €33.4k a month. At an 87.5% gross margin that needs about **€458k of revenue a year**: **about 12 hospitals at €40k a year** (11.4, rounded up: 11 bring €440k), or about 760 doctor seats at €600 a year, or a mix. Slide 10's conservative year 3 is €560k. v4.6 compared year-3 revenue from every country with savings on tests in Greece alone; the two did not share a base, so that ratio is dropped.` | As row 27. |
| 33 | A6, "Sources" line · deck-content.md, appendix.ts | `S10 and S15 via slide 7 (verified inputs, our estimate); S18` | `S18` | A6 no longer uses slide 7's savings. |
| 34 | A4, "One line on who pays" · deck-content.md, appendix.ts | `What that could earn, and how it compares with these savings: slide 10.` | `What that could earn: slide 10.` | The comparison with these savings is dropped (row above). |
| 35 | 3-minute script (deck) · deck-content.md | `half a million to five million euros a year by year three, a small share of what better records save.` | `half a million to five million euros a year by year three. About twelve hospitals cover our running costs.` | As row 27. |
| 36 | 30-second script (deck) · deck-content.md | `Hospitals pay per case or per seat, a small share of what better first decisions save: in Greece, diagnostic error costs about €3.5bn a year.` | `Hospitals pay per case or per seat. In Greece alone, diagnostic error costs about €3.5bn a year.` | Same unlike comparison, said in words: worldwide fees against one country's cost of error. |
| 37 | Pitch script, likely questions · pitch-script.md | `- Is that a fraction of the savings? Slide 8 puts the saving on tests at €4M to €75M a year in Greece alone; our year-3 revenue from every country is about 6 to 14% of it. Our estimate.` | `- When do you break even? When gross profit covers our running costs: about €458k of revenue a year, about 12 hospitals at €40k a year. On our conservative line, at month 31. Our estimate.` | As row 27. |
| | **Must-fix 4: the upside cash low** | | | |
| 38 | A9 §6, table row · deck-content.md, appendix.ts | Block 38a (below) | Block 38b (below) | Model v4: one cost method for every hire (+€14.5k). |
| 39 | A9 §6, table row (becomes two rows) · deck-content.md, appendix.ts | Block 39a (below) | Block 39b (below) | Model v4, cash simulated tranche by tranche. "Never below the start" was false: costs start months before revenue. |
| 40 | A9 §6, table row · deck-content.md, appendix.ts | Block 40a (below) | Block 40b (below) | Model v4 rerun with the tranche schedule and one cost method. |
| 41 | A9 §6, the paragraph under the table · deck-content.md, appendix.ts | Block 41a (below) | Block 41b (below) | The two unit-economics lines the brief asked for, plus the upside caveat. €449k becomes €458k (steady burn €33.4k a month, one cost method); 11.4 hospitals round up to 12. |
| | **Should-fix** | | | |
| 42 | A9 §1, team table row · deck-content.md, appendix.ts | Block 42a (below) | Block 42b (below) | One cost method for every hire: variable pay loaded with employer contributions, €200 a month of tools for every person, part-time included. +€14.5k over 24 months, out of the buffer. |
| 43 | A9 §1, team table row · deck-content.md, appendix.ts | Block 43a (below) | Block 43b (below) | As row 42. |
| 44 | A9 §1, team table row · deck-content.md, appendix.ts | Block 44a (below) | Block 44b (below) | As row 42. |
| 45 | A9 §1, team table row · deck-content.md, appendix.ts | Block 45a (below) | Block 45b (below) | As row 42. |
| 46 | A9 §2, Sell row · deck-content.md, appendix.ts | Block 46a (below) | Block 46b (below) | As row 42. |
| 47 | A9 §2, Prove row · deck-content.md, appendix.ts | Block 47a (below) | Block 47b (below) | As row 42. |
| 48 | A9 §3, burn row · deck-content.md, appendix.ts | Block 48a (below) | Block 48b (below) | As row 42. |
| 49 | A9 §3, burn row · deck-content.md, appendix.ts | Block 49a (below) | Block 49b (below) | As row 42. |
| 50 | A9 §3, burn row · deck-content.md, appendix.ts | Block 50a (below) | Block 50b (below) | As row 42. |
| 51 | A9 §3, burn row · deck-content.md, appendix.ts | Block 51a (below) | Block 51b (below) | As row 42. |
| 52 | A9 §3, burn row · deck-content.md, appendix.ts | Block 52a (below) | Block 52b (below) | As row 42. |
| 53 | A9 §3, burn row · deck-content.md, appendix.ts | Block 53a (below) | Block 53b (below) | As row 42. |
| 54 | A9 §3, burn row · deck-content.md, appendix.ts | Block 54a (below) | Block 54b (below) | As row 42. |
| 55 | A9 §3, burn row · deck-content.md, appendix.ts | Block 55a (below) | Block 55b (below) | As row 42. |
| 56 | A9 §3, burn row · deck-content.md, appendix.ts | Block 56a (below) | Block 56b (below) | As row 42. |
| 57 | A9 §3, line under the table · deck-content.md, appendix.ts | `Average €37.0k a month over the 24 months.` | `Average €37.6k a month over the 24 months.` | As row 42. |
| 58 | A9 §8, cost bullet · deck-content.md, appendix.ts | `- Costs are loaded monthly costs for Athens employees: gross salary (14 payments a year) × 1.2179 for employer social security (21.79%, **secondary**), ÷ 12, plus about €200 a month for tools.` | `- Costs are loaded monthly costs for Athens employees, one method for every hire: gross salary with any variable pay (14 payments a year) × 1.2179 for employer social security (21.79%, **secondary**), ÷ 12, × the share of time, plus about €200 a month for tools for every person, part-time included.` | As row 42. |
| 59 | A9 §8, margin bullet · deck-content.md, appendix.ts | `break-even rises to about €523k to €785k a year.` | `break-even rises to about €534k to €801k a year.` | One cost method for every hire: variable pay loaded with employer contributions, €200 a month of tools for every person, part-time included. +€14.5k over 24 months, out of the buffer. Steady burn €33.4k ÷ 75% and ÷ 50%. |
| 60 | Slide 14, spend bar · deck-content.md | Block 60a (below) | Block 60b (below) | One cost method for every hire: variable pay loaded with employer contributions, €200 a month of tools for every person, part-time included. +€14.5k over 24 months, out of the buffer. Shares 29.7 / 36.1 / 24.5 / 9.7; rounded they sum to 100. |
| 61 | Slide 14, spend bar (web), Sell · slides.ts | `{ pct: 29, value: '€285k · 29%', label: 'Sell', accent: true },` | `{ pct: 30, value: '€297k · 30%', label: 'Sell', accent: true },` | As row 42. |
| 62 | Slide 14, spend bar (web), Prove · slides.ts | `{ pct: 24, value: '€242k · 24%', label: 'Prove' },` | `{ pct: 24, value: '€245k · 24%', label: 'Prove' },` | As row 42. |
| 63 | Slide 14, spend bar (web), Buffer · slides.ts | `{ pct: 11, value: '€112k · 11%', label: 'Buffer' },` | `{ pct: 10, value: '€97k · 10%', label: 'Buffer' },` | As row 42. |
| 64 | A9, first line · deck-content.md, appendix.ts | `From the CEO's plan v3 (` | `From the CEO's plan v4 (` | The plan is v4. |
| 65 | Slide 7, headline (deck and web) · deck-content.md, slides.ts | `Wrong diagnoses cost 17.5% of health spending.` | `Diagnostic error costs 17.5% of health spending.` | The OECD's 17.5% is misdiagnosis 11% + overdiagnosis 5.5% + underdiagnosis 1% (S10, §131 to 133): diagnostic error, not only wrong diagnoses. |
| 66 | Slide 7, third number · deck-content.md | `- **€4M to €75M\*** a year: our first slice` | `- **€4M to €30M\*** a year: our first slice` | Upside made defensible: the 50% "we prevent" rested on S17, an odds ratio (0.44) for duplicate imaging only, applied to every unnecessary test. v4.7 keeps the conservative line's 20% on both lines; the upside differs only in its cost base (OECD's 2.5% of all spending, S10 × S15) and adoption (30%). €497M × 20% × 30% = €29.8M. |
| 67 | Slide 7, third number (web) · slides.ts | `value: '€4M to €75M*'` | `value: '€4M to €30M*'` | As row 66. |
| 68 | Slide 7, visual note · deck-content.md | `our first slice: €4M to €75M\* a year, tests only` | `our first slice: €4M to €30M\* a year, tests only` | As row 66. |
| 69 | Slide 7, speaker notes (deck and notes.ts) · deck-content.md, notes.ts | `between 4 and 75 million euros a year in Greece, depending on adoption.` | `between 4 and 30 million euros a year in Greece, depending on adoption.` | As row 66. |
| 70 | A4 §1 and 2, "Our first slice" · deck-content.md, appendix.ts | `to about €75M a year (upside)**` | `to about €30M a year (upside)**` | As row 66. |
| 71 | A4 §3, upside formula · deck-content.md, appendix.ts | `- Upside: €497M (OECD's 2.5% unnecessary-test share × €19.87bn Greek spend) × 50% we prevent (assumption, anchored to S17: duplicate-imaging odds 0.44 when doctors used a shared record) × 30% adoption (assumption) = **about €75M**.` | `- Upside: €497M (OECD's 2.5% unnecessary-test share, S10, × €19.87bn Greek spend, S15) × 20% we prevent (assumption, the same as the conservative line) × 30% adoption (assumption) = **about €30M** (€29.8M). The 20% sits well under the one measured effect: doctors who used a shared record ordered fewer duplicate images, odds ratio 0.44 (S17). S17 covers duplicate imaging only, not every unnecessary test, so it no longer sets a 50% share (v4.6).` | As row 66. |
| 72 | A4 §3, last line · deck-content.md, appendix.ts | `Never say €75M without` | `Never say €30M without` | As row 66. |
| 73 | 3-minute script (deck) · deck-content.md | `4 to 75 million euros a year in Greece alone, depending on adoption.` | `4 to 30 million euros a year in Greece alone, depending on adoption.` | As row 66. |
| 74 | A4 §4, last sentence · deck-content.md, appendix.ts | `the €4M to €75M is ours and labelled so.` | `the €4M to €30M is ours and labelled so.` | As row 66. |
| 75 | A4 §4, sources · deck-content.md, appendix.ts | `S17 (verified), S6 (verified). No count` | `S17 (verified). No count` | S6 (AAMC physician count) is not used on A4; it belongs to A7. |
| 76 | A7, headline (deck and web) · deck-content.md, slides.ts | `about $1.9B a year in the US, EU and India` | `about €1.9bn a year in the US, EU and India` | A7 priced seats in dollars ($600) while A6 calls €600 "the same assumption"; at $1.10 to €1 they differ by 10%. Prices are assumptions, so A7 now uses A6's euros; every figure keeps its number. The deck's rule is euros only. |
| 77 | A7, table, United States · deck-content.md | Block 77a (below) | Block 77b (below) | As row 76. |
| 78 | A7, table, European Union · deck-content.md | Block 78a (below) | Block 78b (below) | As row 76. |
| 79 | A7, table, India · deck-content.md | Block 79a (below) | Block 79b (below) | As row 76. |
| 80 | A7, table, SAM · deck-content.md | Block 80a (below) | Block 80b (below) | As row 76. |
| 81 | A7, TAM line (and a new line after it) · deck-content.md | Block 81a (below) | Block 81b (below) | A7 priced seats in dollars ($600) while A6 calls €600 "the same assumption"; at $1.10 to €1 they differ by 10%. Prices are assumptions, so A7 now uses A6's euros; every figure keeps its number. The deck's rule is euros only. The brief also asked to say the per-case line is not sized. |
| 82 | A7, visual note · deck-content.md | `with the dollar figure in each` | `with the euro figure in each` | As row 76. |
| 83 | A7, speaker notes (deck and slides.ts A7_NOTES) · deck-content.md, slides.ts | `At an assumed fifty dollars a seat a month` | `At an assumed fifty euros a seat a month` | As row 76. |
| 84 | A7, speaker notes (deck and slides.ts A7_NOTES) · deck-content.md, slides.ts | `about a 1.9 billion dollar a year market` | `about a 1.9 billion euro a year market` | As row 76. |
| 85 | A7 (web), TAM circle · slides.ts | `value: 'about $8.5B'` | `value: 'about €8.5bn'` | As row 76. |
| 86 | A7 (web), SAM circle · slides.ts | `sam: { label: 'SAM', value: 'about $1.9B'` | `sam: { label: 'SAM', value: 'about €1.9bn'` | As row 76. |
| 87 | A7 (web), table, United States · slides.ts | `'$600 per seat (assumption)', '$543M'` | `'€600 per seat (assumption)', '€543M'` | As row 76. |
| 88 | A7 (web), table, European Union · slides.ts | `'$600 per seat (assumption)', '$1,188M'` | `'€600 per seat (assumption)', '€1,188M'` | As row 76. |
| 89 | A7 (web), table, India · slides.ts | `'$120 per seat (assumption)', '$166M'` | `'€120 per seat (assumption)', '€166M'` | As row 76. |
| 90 | A7 (web), table, SAM · slides.ts | `{ cells: ['SAM', '', '', 'about $1.9B'], total: true },` | `{ cells: ['SAM', '', '', 'about €1.9bn'], total: true },` | As row 76. |
| 91 | A7 (web), TAM line (and a new line after it) · slides.ts | Block 91a (below) | Block 91b (below) | As row 76. |
| 92 | A6 §7, "Why €50 a seat?" · deck-content.md, appendix.ts | `Same assumption A7 used in dollars.` | `The same €600 a year A7 uses for every seat.` | As row 76. |
| 93 | Slide 6c, card 3 line (deck and web) · deck-content.md, slides.ts | `Our fee per trial, out of that saving.` | `Our fee per trial, about 13% of that saving.` | The fee does not depend on the saving; it is €24,000 ÷ €180,000 = 13.3% of it. |
| 94 | A3, card 3, big-number line · deck-content.md, appendix.ts | `€5,000 set-up + €1,000 per randomised patient *(assumptions)* × about 19 randomised.` | `€5,000 set-up + €1,000 per randomised patient *(assumptions)* × about 19 randomised: about 13% of the €180,000 saving.` | As row 2. |
| 95 | A3, card 3, trials a year · deck-content.md, appendix.ts | `- 10 trials a year: about €240,000 *(assumption; not in slide 10's totals)*. Never the patient.` | `- 5 trials a year: about €120,000 *(assumption; not in slide 10's totals; the funding plan uses the same five a year)*. Never the patient.` | One trial volume everywhere: five a year (the plan and the model). Ten had no basis but being round. |
| 96 | Slide 3, point 2 · deck-content.md | `- Since November 2026, Greece caps repeat tests. Doctors need the earlier result. *(S16)*` | `- Greek press reports that since November 2026, Greece caps repeat tests. Doctors need the earlier result. *(Greek press, S16)*` | S16 is secondary (Greek press; the EOPYY decision itself was not opened), but the slide read as fact. It says "Greek press reports" until someone opens the decision; then the old wording can return with S16 marked verified. |
| 97 | Slide 3, point 2 (web) · slides.ts | `{ text: 'Since November 2026, Greece caps repeat tests. Doctors need the earlier result.', source: 'S16' },` | `{ text: 'Greek press reports that since November 2026, Greece caps repeat tests. Doctors need the earlier result.', source: 'Greek press · S16' },` | As row 96. |
| 98 | Slide 3, speaker notes (deck and notes.ts) · deck-content.md, notes.ts | `Second, this month Greece started putting lab results in MyHealth and limiting repeat tests,` | `Second, Greek press reports that this month Greece started putting lab results in MyHealth and limiting repeat tests,` | As row 96. |
| 99 | Slide 3, "Sources" line · deck-content.md | `**Sources:** S14 (verified), S16 (secondary), S4 (verified).` | `**Sources:** S14 (verified), S16 (secondary: Greek press; the EOPYY decision itself not opened, so the slide says "Greek press reports"), S4 (verified).` | As row 96. |
| 100 | 3-minute script (deck) · deck-content.md | `Since this month, Greece puts public lab results in MyHealth and limits repeat tests.` | `Since this month, Greek press reports, Greece puts public lab results in MyHealth and limits repeat tests.` | As row 96. |
| 101 | Pitch script, header line · pitch-script.md | `` Numbers match `docs/deck/deck-content.md` v3.1 (team and ask: slides 14 and 15). `` | `` Numbers match `docs/deck/deck-content.md` v4.7 (team and ask: slides 13 and 14). `` | Slide numbers since deck v4.2. |
| 102 | Pitch script, "How do you make money?" · pitch-script.md | `(Deck slide 11.)` | `(Deck slide 10.)` | Revenue is slide 10 since deck v4.2. |
| 103 | Deck header, Version cell (insert before v4.6) · deck-content.md | Block 103a (below) | Block 103b (below) | The deck records its own version history. |

## Blocks

Exact text for the rows marked "Block". Replace the whole of block a with the whole of block b. A line break inside a block is a real line break in the file.

### Block 6: A9 §6, table row (deck-content.md, appendix.ts)

6a, old:

```text
| **Revenue passes costs** | **Month 29** | **Month 12** |
```

6b, new:

```text
| **Break-even** (gross profit covers running costs) | **Month 31** | **Month 12** |
```

### Block 12: Slide 13, gates table, row 1 (deck-content.md)

12a, old:

```text
| A hospital signs a pilot | **€300k** |
```

12b, new:

```text
| A hospital signs a pilot | **€400k** |
```

### Block 13: Slide 13, gates table, row 2 (deck-content.md)

13a, old:

```text
| The pilot proves price, volume and cost per case | **€700k** |
```

13b, new:

```text
| The hospital commits to 1,000+ paid cases a year at €40+; a case costs us €5 or less | **€600k** |
```

### Block 18: A9 §2, buffer row (deck-content.md, appendix.ts)

18a, old:

```text
| Buffer | About 3.4 months of the steady burn | €112k | 11% |
```

18b, new:

```text
| Buffer | About 2.9 months of the steady burn | €97k | 10% |
```

### Block 19: A9 §4, bullet 2 (deck-content.md, appendix.ts)

19a, old:

```text
- Months 1 to 9 cost €292k, inside tranche 1 (€300k). Months 10 to 24 cost €596k; with the buffer, tranche 2 is €700k.
```

19b, new:

```text
- Tranche 1 (€400k) carries months 1 to 9 (€297k) and keeps €103k in reserve: about 3.5 months at the month-9 burn, for a late pilot or a late gate. Tranche 2 (€600k), committed at the same signing, carries months 10 to 24 (€606k) with what is left of that reserve.
- If the gate fails, tranche 1 alone, held at month 9's costs, lasts to about month 12.5.
```

### Block 21: A9 §5, G2 row (end of the row) (deck-content.md, appendix.ts)

21a, old:

```text
Opens **tranche 1, €300k** (months 1 to 9; month 1 about March 2027, assumption) |
```

21b, new:

```text
Opens **tranche 1, €400k** (months 1 to 9, plus about 3.5 months of reserve; month 1 about March 2027, assumption). **Tranche 2, €600k**, is committed at the same signing |
```

### Block 22: A9 §5, the three-numbers row (deck-content.md, appendix.ts)

22a, old:

```text
| **The three numbers**, at the end of the pilot | About month 9 | The buyer names **€40 a case or more**; **1,000 paid cases a year or more** per hospital; **€5 or less a case to run** at 98% field accuracy. Opens **tranche 2, €700k** (months 10 to 24) |
```

22b, new:

```text
| **The gate (three numbers)**, at the end of the pilot | About month 9 | The hospital **commits in writing to 1,000 or more paid cases a year at €40 or more a case**, and the pilot measures **€5 or less a case to run** at 98% field accuracy. Releases **tranche 2, €600k** (months 10 to 24), already committed |
```

### Block 38: A9 §6, table row (deck-content.md, appendix.ts)

38a, old:

```text
| Cash at month 24 | about €255k | about €1.49M |
```

38b, new:

```text
| Cash at month 24 | about €241k | about €1.47M |
```

### Block 39: A9 §6, table row (becomes two rows) (deck-content.md, appendix.ts)

39a, old:

```text
| **Cash at its lowest** | **about €204k, month 30** | never below the start |
```

39b, new:

```text
| **Cash at its lowest, before tranche 2** | **about €104k, month 9** (€600k committed, not yet drawn) | about €114k, month 9 |
| **Cash at its lowest, after tranche 2** | **about €186k, month 30** | **about €690k, month 11** (costs start months before revenue) |
```

### Block 40: A9 §6, table row (deck-content.md, appendix.ts)

40a, old:

```text
| Months sales can slip and still reach break-even | 6 | 18 |
```

40b, new:

```text
| Months sales can slip and still reach break-even | 5 | 17 |
```

### Block 41: A9 §6, the paragraph under the table (deck-content.md, appendix.ts)

41a, old:

```text
Break-even at the steady team of six: about €449k of revenue a year (about 11 hospitals at €40k a year, or about 750 doctor seats). The plan is sized on the conservative line; if the upside arrives, tranche 2 can be smaller.
```

41b, new:

```text
**Unit economics, in two lines** *(assumptions)*:
- One hospital pays **€40k a year** (1,000 cases × €40) at an **87.5% gross margin**; it costs about **€30k to €40k to win** and pays that back in **about 12 months**.
- **About 12 hospitals** cover our running costs (€458k a year; 11 bring €440k, short of it), or about 760 doctor seats; at month 24 the conservative line runs at **about €19k a month**, half of that.

The plan is sized on the conservative line; if the upside arrives, tranche 2 can be smaller or released early. **The upside needs more people, not modelled:** it runs 45,000 cases and 2,000 seats a year by year 3 on the six-person cost base.
```

### Block 42: A9 §1, team table row (deck-content.md, appendix.ts)

42a, old:

```text
| Clinical and regulatory lead (half-time) | Month 1 | €3.1k | €76k |
```

42b, new:

```text
| Clinical and regulatory lead (half-time) | Month 1 | €3.2k | €78k |
```

### Block 43: A9 §1, team table row (deck-content.md, appendix.ts)

43a, old:

```text
| Business development | Month 2, full-time | €5.1k | €118k |
```

43b, new:

```text
| Business development | Month 2, full-time | €5.5k | €125k |
```

### Block 44: A9 §1, team table row (deck-content.md, appendix.ts)

44a, old:

```text
| Marketing | Month 3 half-time, full-time from month 10 | €1.8k, then €3.7k | €68k |
```

44b, new:

```text
| Marketing | Month 3 half-time, full-time from month 10 | €2.0k, then €3.9k | €72k |
```

### Block 45: A9 §1, team table row (deck-content.md, appendix.ts)

45a, old:

```text
| **Team total** | | **€27.7k at full team** | **€578k (58%)** |
```

45b, new:

```text
| **Team total** | | **€28.4k at full team** | **€592k (59%)** |
```

### Block 46: A9 §2, Sell row (deck-content.md, appendix.ts)

46a, old:

```text
| **Sell** | Business development €117.8k · marketing €67.6k · pilots and go-to-market €60.0k · public-procurement adviser €15.0k · trials sponsor pilot €25.0k | **€285k** | **29%** |
```

46b, new:

```text
| **Sell** | Business development €125.4k · marketing €72.0k · pilots and go-to-market €60.0k · public-procurement adviser €15.0k · trials sponsor pilot €25.0k | **€297k** | **30%** |
```

### Block 47: A9 §2, Prove row (deck-content.md, appendix.ts)

47a, old:

```text
| Prove | Clinical and regulatory lead €75.5k · regulatory and legal €67.0k · regulatory pathway €50.0k · research partner €49.8k | €242k | 24% |
```

47b, new:

```text
| Prove | Clinical and regulatory lead €77.9k · regulatory and legal €67.0k · regulatory pathway €50.0k · research partner €49.8k | €245k | 24% |
```

### Block 48: A9 §3, burn row (deck-content.md, appendix.ts)

48a, old:

```text
| Q1 | 1 to 3 | €37.6k |
```

48b, new:

```text
| Q1 | 1 to 3 | €38.0k |
```

### Block 49: A9 §3, burn row (deck-content.md, appendix.ts)

49a, old:

```text
| Q2 | 4 to 6 | €31.2k |
```

49b, new:

```text
| Q2 | 4 to 6 | €31.8k |
```

### Block 50: A9 §3, burn row (deck-content.md, appendix.ts)

50a, old:

```text
| Q3 | 7 to 9 | €28.5k |
```

50b, new:

```text
| Q3 | 7 to 9 | €29.2k |
```

### Block 51: A9 §3, burn row (deck-content.md, appendix.ts)

51a, old:

```text
| Q4 | 10 to 12 | €38.0k |
```

51b, new:

```text
| Q4 | 10 to 12 | €38.6k |
```

### Block 52: A9 §3, burn row (deck-content.md, appendix.ts)

52a, old:

```text
| Q5 | 13 to 15 | €42.8k |
```

52b, new:

```text
| Q5 | 13 to 15 | €43.4k |
```

### Block 53: A9 §3, burn row (deck-content.md, appendix.ts)

53a, old:

```text
| Q6 | 16 to 18 | €41.9k |
```

53b, new:

```text
| Q6 | 16 to 18 | €42.5k |
```

### Block 54: A9 §3, burn row (deck-content.md, appendix.ts)

54a, old:

```text
| Q7 | 19 to 21 | €39.1k |
```

54b, new:

```text
| Q7 | 19 to 21 | €39.7k |
```

### Block 55: A9 §3, burn row (deck-content.md, appendix.ts)

55a, old:

```text
| Q8 | 22 to 24 | €37.1k |
```

55b, new:

```text
| Q8 | 22 to 24 | €37.7k |
```

### Block 56: A9 §3, burn row (deck-content.md, appendix.ts)

56a, old:

```text
| After | 25 on | €32.7k |
```

56b, new:

```text
| After | 25 on | €33.4k |
```

### Block 60: Slide 14, spend bar (deck-content.md)

60a, old:

```text
| **€285k · 29%** | €361k · 36% | €242k · 24% | €112k · 11% |
```

60b, new:

```text
| **€297k · 30%** | €361k · 36% | €245k · 24% | €97k · 10% |
```

### Block 77: A7, table, United States (deck-content.md)

77a, old:

```text
| $600 per seat *(assumption)* | $543M |
```

77b, new:

```text
| €600 per seat *(assumption)* | €543M |
```

### Block 78: A7, table, European Union (deck-content.md)

78a, old:

```text
| $600 per seat *(assumption)* | $1,188M |
```

78b, new:

```text
| €600 per seat *(assumption)* | €1,188M |
```

### Block 79: A7, table, India (deck-content.md)

79a, old:

```text
| $120 per seat *(assumption)* | $166M |
```

79b, new:

```text
| €120 per seat *(assumption)* | €166M |
```

### Block 80: A7, table, SAM (deck-content.md)

80a, old:

```text
| **SAM** | | | **about $1.9B** |
```

80b, new:

```text
| **SAM** | | | **about €1.9bn** |
```

### Block 81: A7, TAM line (and a new line after it) (deck-content.md)

81a, old:

```text
- **TAM about $8.5B a year:** about 14.1M doctors worldwide at $600. *(Derived from a secondary density figure, S7; a ceiling, not a forecast.)*
```

81b, new:

```text
- **TAM about €8.5bn a year:** about 14.1M doctors worldwide at €600. *(Derived from a secondary density figure, S7; a ceiling, not a forecast.)*
- **The per-case line is not sized here.** This ceiling counts doctor seats only; slide 10's per-case line (hospitals, €40 to €80 a case) has no market size on this slide.
```

### Block 91: A7 (web), TAM line (and a new line after it) (slides.ts)

91a, old:

```text
'**TAM about $8.5B a year:** about 14.1M doctors worldwide at $600. (Derived from a secondary density figure, S7; a ceiling, not a forecast.)',
```

91b, new:

```text
'**TAM about €8.5bn a year:** about 14.1M doctors worldwide at €600. (Derived from a secondary density figure, S7; a ceiling, not a forecast.)',
    "**The per-case line is not sized here.** This ceiling counts doctor seats only; slide 10's per-case line (hospitals, €40 to €80 a case) has no market size on this slide.",
```

### Block 103: Deck header, Version cell (insert before v4.6) (deck-content.md)

103a, old:

```text
| **Version** | **v4.6, 15 Nov 2026** (
```

103b, new:

```text
| **Version** | **v4.7, 15 Nov 2026** (MIN-4503: CFO fixes, applied word for word from `docs/business/cfo-fixes-v4.7.md`. Founder, 15 Nov 2026, verbatim, on the tranche choice: *"CFO will answer"*. Tranches €400k then €600k, both committed at signing, the second released when a hospital commits in writing to 1,000+ paid cases a year at €40+; break-even at month 31, when gross profit covers running costs (was "month 29", revenue alone); one cost method for every hire (spend bar €297k / €361k / €245k / €97k); slide 10's "6 to 14%" replaced by "about 12 hospitals cover our running costs"; slide 7 headline "Diagnostic error costs 17.5%", upside €75M → €30M; A7 in euros; trials five a year; slide 3 says "Greek press reports"; A9 tables from plan v4.) v4.6, 15 Nov 2026 (
```

## Already changed on this branch (no action for Anna)

- `docs/business/funding-model.py`: v4 (tranches, one cost method, both cash lows, unit economics, dilution, trial volume, slide 7's formula).
- `docs/business/team-and-funding-plan.md`: v3 → v4, every number above, the tranche decision, slide numbers as in the deck.
- `docs/business/clinical-trials-fit.md`: slide numbers (possible matches 6, revenue 10, trials economics 6c, 6b), five trials a year, the fee as 13% of the saving.

## The numbers, before and after (model output)

| | v3 (deck v4.6) | v4 (deck v4.7) |
|---|---|---|
| Tranches | €300k, then €700k raised after the gate | €400k, then €600k; both committed at signing |
| Tranche 1 against months 1 to 9 | €300k vs €292k: 8 days of reserve | €400k vs €297k: €103k, about 3.5 months |
| Spend over 24 months | €888.4k | €902.9k (one cost method, +€14.5k) |
| Sell / Build / Prove / Buffer | €285k / €361k / €242k / €112k (29 / 36 / 24 / 11%) | €297k / €361k / €245k / €97k (30 / 36 / 24 / 10%) |
| Burn: Q1 / Q3 / Q5 / after month 24 / average | €37.6k / 28.5k / 42.8k / 32.7k / 37.0k | €38.0k / 29.2k / 43.4k / 33.4k / 37.6k |
| Break-even, conservative | "revenue passes costs" month 29 (gross profit: month 31) | gross profit covers running costs: **month 31** (revenue alone: month 30) |
| Cash at its lowest, conservative | €204k, month 30 | €104k at month 9 before tranche 2; **€186k at month 30** after it |
| Cash at its lowest, upside | "never below the start" (in fact €696k, month 11) | €114k at month 9 before tranche 2; **€690k at month 11** after it |
| Cash at month 24, conservative / upside | €255k / €1.49M | €241k / €1.47M |
| Sales can slip, conservative / upside | 6 / 18 months | 5 / 17 months |
| Money lasts with no revenue | 27.4 months | 26.9 months (about 27) |
| Break-even revenue a year | €449k: "about 11 hospitals" | €458k: about 12 hospitals (11.4; 11 bring €440k) |
| Slide 7 upside, tests in Greece | €74.5M (50% prevented) | €29.8M (20% prevented, same as conservative) |
| Trials a year | 10 on A3, 5 in the plan | 5 everywhere (about €120k a year) |
| Lower-ask alternative | about €885k, break-even month 29, slip 6 | about €885k, break-even month 31, slip 5 |

