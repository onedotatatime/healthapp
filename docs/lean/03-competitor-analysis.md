# Workshop 3 · Competitor analysis

**Status: recommended, not decided.** The founder decides on MIN-4442.

Facilitator: Pix Elidis (Design), MIN-4441 · 14 Nov 2026. Sources: the five seat papers; competitor facts come from `docs/research/market-and-competitors.md` (MC) and `docs/research/buyers.md` (BY) as the seats cite them. **Nobody tried the products or read user reviews.** No figure on Sales' "do not put on a slide" list is used. The treg verification pass the founder approved has no result in any paper (CEO Q1, Sales Q8).

---

## 1. The competitor matrix (jobs, not features)

● shipped, as reported in the research · ◐ partial · ○ announced or planned · — not found in the research (absence of evidence, not evidence of absence)

| Job | Substitute (folder, photos, portals, chatbot) | Provider and state apps (NHS App, ABDM, Malaffi, myHealth, ePA) | Doctolib | Epic (MyChart, Emmie, Art) | ChatGPT Health, Claude, Google, Apple | OpenEvidence, Glass | PicnicHealth, Eka Care | Patients Know Best | **Us, demo** | **Us, product (after work)** |
|---|---|---|---|---|---|---|---|---|---|---|
| Old paper into one timeline | ◐ | — | ○ | — | ◐ (photo and ask) | — | ◐ | — | ● synthetic, 3 exam types, EL and EN | needs measured accuracy on real paper (98% bar) |
| Doctor-side answer from *this patient's* history | — | ◐ one system | ○ | ◐ one system | — (answers the patient) | — (answers from literature) | — | — | ● cited | MDR review for anything that summarises or ranks |
| In-person, time-limited, patient-approved access | — | — | — | — | — | — | — | — | ● | needs doctor identity per country (Q5) |
| "Verified by source" vs "uploaded by patient" per record | — | n/a (they are the source) | — | n/a | — | — | — | — | simulated | needs a lab or rail partner (Q4) |
| Across providers and borders | ◐ | — | — | — | — (US pipes; not in EEA or UK) | n/a | ◐ (US; India) | ◐ (UK, provider-paid) | demo only | EHDS and rail import |
| Specialist-to-specialist view | — | — | — | ◐ | — | — | — | — | ◐ (E4, P1) | Scope B |
| Opt-in matches for care | — | — | — | — | — | — | — | — | seeded | Scope B, ethics review |
| Free to the doctor | n/a | n/a | — | n/a | n/a | ● | n/a | n/a | n/a | to test |

Sources: Product §3 (job table), Sales §3.1 and §3.2 (feature and pricing gaps), Marketing §3 (substitutes), MC §2.1 to §2.5, BY §0. Patients Know Best and Doctolib are added at Sales' request: the deck's map (slide 9) omits both.

## 2. Positioning 2×2 (the room's proposal)

The deck's slide 9 uses *who holds the record* × *one provider ↔ every provider, every border, old paper*, and puts `[Name]` alone in the top-right. Marketing flags that "every provider, every border, old paper" is not claimed yet (the demo reads three exam types in two languages). The room proposes axes that describe what runs today.

**Horizontal:** whom the AI answers · patient ← → doctor
**Vertical:** whose history it works from · one institution's or one country's record ↓ ↑ the patient's own outside paper, across providers

| | **AI answers the patient** | **AI answers the doctor** |
|---|---|---|
| **The patient's own outside paper and history** | ChatGPT Health, Claude for Healthcare (photo or upload, then ask; US-led); the "photograph and ask a chatbot" habit; Eka Care (India) | **`[Name]`: hypothesis.** Cited answers from the patient's own outside history. Demo scope: 3 exam types, Greek and English. Neighbours: PicnicHealth (retrieval and digitising, US, no doctor-side assistant found); Patients Know Best (patient-held, UK, no assistant found) |
| **One institution's or one country's record** | Epic MyChart Emmie; Apple Health Records; national apps (NHS App, ABDM, Malaffi, myHealth); Doctolib's planned document vault | Epic Art; Navina, Metriport; scribes (Abridge, Heidi, Tandem) for notes going forward |
| *Off the map* | | OpenEvidence, Glass: answers from the literature, not from a patient's record |

Reading: the top-right cell is thin, not empty. Two neighbours hold half the idea each (PicnicHealth the paper, Patients Know Best the patient-held record). Say neither "only" nor "first" (all five seats).

## 3. Threat ranking, by seat

| Seat | 1 | 2 | 3 | 4 | 5 | The real competitor |
|---|---|---|---|---|---|---|
| **CEO** | Epic | OpenAI | OpenEvidence | — | — | "Doing nothing" |
| **Sales** | Epic (Emmie plus Art) | ChatGPT Health and the big AI platforms | **Doctolib** (moved up) | OpenEvidence | State rails | (lists substitutes in the map) |
| **Product** | **Doctolib** (EU) | Epic, OpenAI, OpenEvidence (US) | State rails | PicnicHealth, Eka Care | — | "The substitute": folder, photos, portals, a chatbot |
| **Marketing** | Patient: the chatbot habit · Doctor: the free tool he already opens · Buyer: the inbox · Europe: Doctolib | | | | | "Good enough" |
| **CTO** | No ranking. "Photo to structured data is a commodity." Anyone ships it in a sprint; the trust features are weeks of work, not years | | | | | Position, not code |

## 4. Where the seats agree

1. **Do not compete on "AI reads your exam".** CEO, CTO, Sales, Marketing. Anyone with a phone and a chatbot already can; Epic, OpenAI or OpenEvidence can add it in a sprint.
2. **The gap is real and narrow:** old paper, cross-border, the doctor-side trust marks (identity match, provenance, citations), and no insurer. CEO, Sales, Product, Marketing; the CTO adds that only the *position* is hard to copy, not the code.
3. **The real competitor is mostly not a company:** a folder, phone photos, the portals, an inbox. CEO, Product, Marketing.
4. **The state rails close "records in one place" on a known clock:** US now, NHS single record Dec 2028, EHDS 2029 and 2031. All seats. Germany's ePA has about 4% active use (secondary): access does not mean use.
5. **Never "the only" or "the first".** All five. An empty category can be white space or a market nobody could fund (CEO, Product).
6. **Messages already owned:** "understand your results" (ChatGPT Health, Claude, Emmie) and "all your records in one place" (Apple, PKB, state apps). Marketing; CEO and Sales agree in substance.

## 5. Where the seats disagree

| Question | One side | Other side |
|---|---|---|
| **Biggest threat** | **Epic** (CEO, Sales) — both patient and doctor surfaces, large US share | **Doctolib in Europe** (Product #1; Sales moves it to #3 and says MC and BY "should say the same thing"). Marketing: by message, the chatbot habit and the free tool, not a company |
| **Doctolib: rival or partner?** | Threat (Product, Marketing) | "Also the likeliest partner", undecided (Sales; its canvas lists Doctolib under key partners as "partner or competitor") |
| **What makes an edge durable** | **Position:** patient-held custody with no insurer principal, old paper, cross-border, being allowed to operate (CTO) | **Neutrality plus relationships:** no insurer, the labs that give "verified by source", already being inside the international-patient workflow (Sales) |
| **Regulation as a moat** | A shield for now that cuts both ways: it holds ChatGPT Health out of the EEA and UK and holds our assistant back too; ends when a large player funds the compliance (CTO) | Not raised as an edge by the other seats; CEO and Product treat regulation only as a cost |
| **Can old messy paper be an edge?** | Only if measured: a tuned pipeline beating general models on old, multi-language paper would be a real, narrow edge; no measurement exists (CTO) | Treated as a differentiator now (Sales, Marketing, as "candidate" and "open ground") |

## 6. The room's recommendation

1. **Position on the doctor's side of the first visit, from the patient's own outside paper, with every answer opening its source.** Do not lead with the assistant or with "records in one place".
2. **Fix slide 9 before any pilot conversation:** add Patients Know Best and Doctolib (Sales); drop "every provider, every border, old paper" from the axis until a second language and country run (Marketing); label `[Name]`'s cell as the target, not the demo. The deck is not edited here; this is a proposal for the founder and Marketing.
3. **Treat Doctolib as the European question to answer early: rival or partner.** Sales' undecided view is the honest one.
4. **Make "the edge is position, not code" the line every seat uses** (CTO), so no copy implies a technical moat.

**Riskiest assumption:** the platforms and rails do not close the gap within the pilot horizon. **Test:** in each doctor interview, "What did the last patient who brought paper do, and what did you use?" and "What do your patients show you from a chatbot?" **Metric:** doctors who say a current tool or a chatbot printout already gives them enough. **Threshold:** fewer than 3 of 5 to keep the doctor-side wedge; at 3 or more, treat the assistant as a feature for someone else's tool (CEO steelman B). **Gate:** G1.

## 7. Open questions for the founder

1. Run the treg verification pass now, to check the competitor ranking and funding figures, or defer it? (CEO Q1, Sales Q8)
2. Is Doctolib a company to approach as a partner, or to plan against? Not before G1, and nothing is contacted until you say so.
