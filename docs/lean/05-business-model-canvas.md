# Workshop 5 · Business Model Canvas

**Status: recommended, not decided.** The founder decides on MIN-4442.

Facilitator: Pix Elidis (Design), MIN-4441 · 14 Nov 2026. Sources: the five seat papers. **Every price, budget owner and sales-cycle figure is an assumption** (`buyers.md` status line: no buyer page was opened that night, no figure is verified). The CTO's cost and time figures are his own estimates, not sourced in the repo (PRD Q18 is open); treat them as orders of magnitude.

**The insurer rule.** The founder's data rule is absolute: "These data should not be accessible to insurance companies as proofs. they should be totally disclosed between the patient and the doctor." This canvas neither extends nor narrows it. The five commercial edges (public payers, hybrid public bodies, self-funded employers, a pharma and CRO research line, insurer-owned hospitals) are **open** and are placed in no block: not as a segment, a partner or an exclusion.

---

## 1. The canvas

| **Key partners** | **Key activities** | **Value propositions** | **Customer relationships** | **Customer segments** |
|---|---|---|---|---|
| A clinician (lead or co-founder) · one hospital pilot department · one lab network or national rail for "verified by source" · a patient group · a regulatory adviser and counsel · national rails as **sources to import from** (digital arms only; see open edge 2) · innovation gateways (Sheba ARC, Mayo Platform). **None signed** | Digitise and measure accuracy on real documents (the largest ongoing engineering cost, CTO) · run the consented share, the grant clock and the log · keep the product on the safe side of the device line (a review on every assistant change and every claim) · security and privacy operations · a DPIA before one third-person record · run pilots and collect measured results · keep copy and system in step | **Doctor:** ask the history; every answer opens its source. **Buyer:** a sourced history ready at the desk; "before arrival" is a proposition to test. **Patient:** photograph once; you decide who sees it and for how long; no diagnosis, no insurer view. See `04-value-proposition.md` | Pilot first (2 to 4 months, one department) with a named clinical lead · concierge onboarding through the buyer's coordinator · consent at every step, a log the patient can read · high touch in year 1: the doctor's adoption decides renewal | **First payer to test:** hospital international-patient departments. **Next:** multi-specialty clinic chains and telehealth platforms; lab networks (partner and buyer). **Free pilot:** rare-disease networks (timing disputed, §3). **Users who never pay:** patients, doctors. **Later:** national agencies (tender), only where open edges 1 and 2 allow |
| | **Key resources** (CTO's order of scarcity) | | **Channels** | |
| | 1. A named clinical lead (**missing**) · 2. regulatory and data-protection competence under contract (**missing**) · 3. model access under zero-retention terms per region · 4. a consented evaluation set of real documents · 5. the engineering already designed (grant model, signed log, gateway, EU cell) · 6. trust, which is spent once · plus the founder's attention, capped | | **"The asker":** a hospital department or clinic asks its patients for the history, and the patient comes in through that request (Marketing) · direct, founder-led, to named departments (Sales) · innovation gateways as validation doors · patient associations · doctor to doctor. **No consumer acquisition, no paid ads, no app-store plan.** No public launch without the founder's written go. **Nothing contacted** | |
| **Cost structure** | | | **Revenue streams** | |
| Clinical lead time · regulatory adviser and DPIA · security owner and a yearly external test · EU hosting · model inference (small next to people) · identity proofing per country · certification **only if** the assistant ships. CTO's order of magnitude for a record-only pilot in one EU cell: **2 to 3 engineers, a part-time security owner and a clinical lead for 4 to 6 months, plus legal and audit in the low tens of thousands of euros**, before the first third-person record. Certification paths in §2. Hackathon spend capped (CTO review, cited by the CEO: up to €30 if credits do not fit) | | | **Per-case fee** from international-patient departments (test first) · per-doctor seat for chains and telehealth (test second, against free tools) · partnership or integration fee from labs · grants for pilots (funding, not revenue) · tenders, year 2 or later. **Patients pay nothing. No data sale.** Research line: open edge 4, not placed. **No price is sourced** | |

## 2. Cost of the regulated feature (CTO's estimates, to be replaced by an adviser's quote)

| Path | Time | Cost |
|---|---|---|
| A. Stay out of scope: one regulatory opinion plus five engineering controls | 2 to 6 weeks | about €3k to €10k |
| B. EU class IIa ("possible causes", Rule 11) | 18 to 30 months, first-time manufacturer | about €300k to €800k to the first certificate, then €80k to €200k a year |
| C. EU class IIb | add about 12 months | add about €0.5M to €1.5M |
| D. US non-device decision support | 1 to 2 months | about $15k to $40k |
| E. US as a device (510(k) or De Novo) | 12 to 24 months | about $200k to over $1M |

One obstacle the plan has not named (CTO): a certified device needs a fixed, validated version, and a hosted general model changes on its provider's schedule. That pushes path B to the upper end.

## 3. Where the seats agree

1. **Provider-paid B2B with a free patient side.** All five (CTO by implication). Marketing explains why: the three refusals (no diagnosis, no insurer view, no data sale) remove the usual revenue sources, so providers pay for a better first visit.
2. **The first payer to test is the international-patient department.** CEO, Sales, Product, Marketing.
3. **The canvas's biggest holes are resources, not revenue numbers:** no clinician, no regulatory opinion, no signed pilot. CEO ("a pilot-and-grant business before it is a software business"), CTO ("the scarce resources are not engineers"), Product, Marketing ("a hole where the clinician should be"), Sales.
4. **No dollar TAM, SAM or SOM on a slide** until a buyer gives a figure. Sales (cut them, MC's own do-not-use list), Product (size the wedge or drop them), CEO (no dollar market size, Q24), Marketing (on Sales' do-not-use list). The CTO takes no position. The deck's slide 8 still shows them, labelled as assumptions; the founder decides (Q24).
5. **The founder's cap of about 4 hours a week until G1 is right for gathering evidence.** CEO; the CTO adds that it is **wrong for building**: the build is a funded team, not a side project.

## 4. Where the seats disagree

| Question | Side A | Side B |
|---|---|---|
| **Per case or per seat** | **Per case first:** Sales (test per case on one department), Product ("the first buyer pays per case"; a seat is "the hardest thing to sell" next to free tools), Marketing ("talk per case before per seat") | **Seat as the sizing unit:** the deck sizes the market on a $600 doctor seat (slide 8); the CEO keeps "per-case fee **or** per-doctor seat" and runs his sizing test on seats (about €150k a year of cost ≈ 250 seats at $600, "one mid-sized hospital group"). Product's flag: **the wedge buyer's pool (foreign patients per hospital × a per-case fee) has not been sized at all** |
| **Rare-disease pilot** | Free, grant-funded pilot now (CEO, Product, Sales; deck slide 10, "where possible matches matter most") | **Only once dependants exist** (Marketing): story B1 refuses the caregiver's exams. The CTO adds that matches are empty at small scale and k-anonymity hides rare cases (Q34) |
| **What makes it fundable** | "A fund-the-team question long before it is a market-size question"; G2 needs an outside funding route (CEO) | Same conclusion through cost: 2 to 3 engineers, security and a clinician for 4 to 6 months (CTO). A hospital partner that brings clinical governance, a DPO and security review "under its own roof" makes the pilot far cheaper (CTO) |
| **Key resources, first item** | A clinical lead (CTO, CEO, Sales, Product, Marketing all name one) | The CTO alone adds model access under zero-retention terms and a consented evaluation set as launch prerequisites; the weekend's terms are acceptable for one consenting founder only |
| **The geography of the wedge** | International-patient departments, many of them outside the EU (Bangkok, Istanbul, Abu Dhabi in the research) | The plan is "EU cell only until a named buyer pays for another" (CTO). Sales raises the conflict as a founder question (Q7, citing CEO review comment 20) |
| **Insurers on the canvas** | Listed as **excluded** in segments and revenue, by the data rule (CEO, Sales; deck slide 10, "Never: Insurers, excluded by design") | **Placed nowhere**; the data rule says who may *see*, and who may *pay* is the founder's to decide (Marketing). The room places none and resolves neither reading |
| **Unfair advantage** | Product adds a tenth block: candidate moats are patient control, old paper and foreign records, the trust marks; none proven | CTO: no technical moat; position only. CEO: patient trust and provenance "could matter; no data moat" |

## 5. The room's recommendation

1. **Run the canvas as a pilot-first, provider-paid model with a free patient side.** Test the **per-case fee on one international-patient department first**; test the seat second, against the free tools.
2. **Size the wedge, not the seat.** Before any dollar figure returns to a slide, estimate foreign patients per target hospital × a per-case fee a buyer names. Until then: the verified doctor count and the formula only (Q24).
3. **Treat the clinician and the regulatory opinion as the first two "costs" of continuing,** ahead of any engineering.
4. **Look for a hospital partner that brings governance under its own roof** (CTO). It is the cheapest version of every block on the left side of the canvas.
5. **Hold the rare-disease pilot until dependants are decided.**

**Riskiest assumption:** a hospital pays for records that arrive with, or before, the patient. **Test:** five buyer-side conversations after G0, founder-led: "What does one foreign patient's late or missing record cost you today, and which budget does it come from?" **Metric:** buyers who give a cost figure and name a budget owner. **Threshold:** 2 of 5, plus one written pilot interest from a non-insurer department. **Gate:** G1.

## 6. Open questions for the founder

1. **Dollar figures on slides (Q24):** keep slide 8's TAM, SAM and SOM with labels, or replace them with the verified doctor count and the formula? (Sales, Product, CEO, Marketing all lean to removing them.)
2. **The wedge outside the EU cell:** is a non-EU international-patient department acceptable as the first test, given the plan of one EU cell? (Sales Q7)
3. **A clinical co-founder or lead as a condition for continuing** at G2. (CEO Q4, Product Q4)
4. **The five insurer edges** stay yours. Two of them touch this canvas: insurer-owned hospital groups (edge 5) sit on the path to the first buyer (Product), and public payers and hybrid bodies (edges 1 and 2) decide whether national agencies can ever be a segment (Sales).
