# Story deck: the words, slide by slide

| | |
|---|---|
| **What** | A personal story deck, told by Lefteris in the first person. It sits next to the pitch deck (`docs/deck/deck-content.md`, v4.9) and does not replace it. |
| **Version** | v1, 15 Nov 2026 (Marketing, Anna Lytica). |
| **Founder's brief** | 15 Nov 2026, verbatim, quoted in full at the end of this file. |
| **Next** | Ren builds the slides on this branch (`feat/story-deck`). Pix's house rules apply (`docs/brand/brand-guidelines.md`). |
| **Length** | 8 frames (1, 2, 3a, 3b, 4, 5, 5b, 6). About 3 minutes spoken, plus the live actions on 3b and 5. |

**How to read each slide.** *Headline* is the big line. *Support* is at most one smaller line. *Labels* are every other word that shows on the slide. *Speaker notes* are what he says, about 15 to 30 seconds, in his voice. The founder's own sentences are kept as close to his words as possible; only grammar and rhythm are tidied.

**Rules this deck keeps (check again after any edit):**

1. **No diagnosis claims**, from the app or about him. His condition is not named.
2. **No insurers.** No statistic on any slide except the two on 5b (and the €3.5bn estimate that comes with the second), all from the pitch deck's sources. Dates and the "5,000 synthetic records" label are not statistics.
3. **Never implied that matching or trials run on real people today.** Slides 4 and 5 are questions ("what if"). The live frame on slide 5 is labelled a simulation on synthetic records.
4. **His own records are shown by his choice**, and the words say they are his own (slides 2, 3a, 3b).
5. No exclamation marks. Pathien has no ™ or ®. Coral is fill only, no red (pitch deck rules 6 and brand note).

---

## Slide 1: Intro

**Headline:** Hi, I'm Lefteris.

**Support:** A product builder, based in Athens.

**Labels (three facts, small, under the name):**
- Founder, onedotatatime.design studio
- Designing digital products since 2009
- Product design lead at Kariera.gr and MoRo Technology

**Labels (footer, small, as on the pitch deck cover):** Pathien lockup · Gen AI Summit Hackathon · Biotech & AI · Athens LifeTech Park

**Visual note for Pix and Ren:** Modelled on the pitch deck's cover (slide 1) and team slide (slide 13): same layout grid, the Pathien lockup small, the event line small. The founder photo is the house one: `~/AppDevelopment/travelhood/brand/social/events/lefteris-profile.jpg` (the photo we use in house templates). Name in full on the slide as alt text and caption: "Lefteris Georgaras".

**Speaker notes (~20 s):** "Hi, I'm Lefteris. I'm a product builder, based here in Athens. I run a small design studio, onedotatatime.design, and I've been designing digital products since 2009. This weekend I built something with a team of AI agents. But this is not a story about software. It's a story about me."

**Facts and where they come from:**
- "Founder, onedotatatime.design studio": founder, 14 Nov 2026, verbatim: *"Just me Lefteris Georgaras (founder of onedotatatime.design studio)"*; pitch deck slide 13.
- "Designing digital products since 2009" and "Product design lead at Kariera.gr and MoRo Technology": his CV (`~/Desktop/LefterisGeorgaras.pdf`), public career facts only. First design role 2009; Lead Digital Product Designer at MoRo Technology (2019) and at Kariera.gr, later VP of Design there (2022). **For the founder to confirm:** the CV is older than today. The label is written so it holds whether he is still at Kariera.gr or not. If he prefers his title, use "VP of Design, Kariera.gr" (add "former" if he has left).
- "Built with a team of AI agents this weekend": pitch deck slide 13 ("One founder and AI agents built this").
- Nothing private on this slide: no phone, no personal email, no age, no address.

---

## Slide 2: 2019, in hospital

**Headline:** And that's me, back in 2019, in hospital.

**Support:** No doctor could give me an answer. I was trying to figure out what my body was telling me.

**Labels:**
- Under the hospital photo: **Me, in hospital, 2019**
- Under the first screenshot: **My spreadsheet, 2019**
- Under the second screenshot: **My spreadsheet, 2019**
- Footer, small: *My own photo and my own records, shared by my choice.*

**Visual note for Pix and Ren:** The hospital photo large on the left, the two spreadsheet screenshots stacked or fanned on the right, each with its label. The founder supplies the photo and the two screenshots (not in the repo). Crop the screenshots so no name, ID number or doctor's name shows. No highlight on any single value: the slide is about the search, not a result.

**Speaker notes (~25 s):** "And that's me, back in 2019, in hospital. I saw doctors, I did test after test, and no doctor could give me an answer. So I did what I know. I opened a spreadsheet and put every result in it, date by date. I was trying to figure out what my body was telling me."

---

## Slide 3a: Today

**Headline:** And that's me today, still trying to figure this out.

**Support:** And helping doctors find the answer.

**Labels:**
- Over the left frame (patient view, "Your record"): **My record · my own exams, since 2019**
- Over the right frame (doctor view): **My doctor's view · the same exams**
- Footer, small: *Live app · my own records, shown by my choice.*

**Visual note for Pix and Ren:** Two live app frames side by side, the patient view on the left (`/patient`, "Your record"), the doctor view on the right (`/doctor`). The founder showcases them live. Use the build that holds his own records (`https://staging.healthapp-8ui.pages.dev`, or production once it carries them; `docs/deploy.md` §2), never the synthetic twin.

**Speaker notes (~20 s):** "And that's me today, still trying to figure this out. But not alone in a spreadsheet any more. I'm helping doctors find the answer. On the left, my record: my own exams, the real ones, going back to 2019. On the right, what my doctor sees."

---

## Slide 3b: Today, the same slide while I act

**Headline:** And that's me today, still trying to figure this out.

**Support (replaces 3a's support line):** Now, by giving doctors the tool to analyse all my medical exams, we can finally make the difference.

**Labels:** the same as 3a.

**Visual note for Pix and Ren:** The same frame as 3a; only the support line changes. Lefteris acts in both frames while he talks. Nothing else moves on the slide.

**Speaker notes (~30 s, said while he acts):** "Let me show you. Here I add an exam to my record. Over here, my doctor sees it arrive, next to every exam before it, over time. And when my doctor asks a question, the answer points to the exam it came from. That's the part I never had in 2019. Now, by giving doctors the tool to analyse all my medical exams, we can finally make the difference."

**Actions note:** the three actions above (add an exam, the doctor sees it in the history, the doctor asks and the answer cites its exam) are the ones the app does today on the pitch deck's slide 4 and A2. If he chooses other actions on stage, keep the last sentence and drop the ones he does not do. Do not read out or show any "possible diagnoses" panel on this slide (rule 1).

---

## Slide 4: What if, a doctor in Brazil

**Headline:** And what if my doctor could find rare cases similar to mine, and cross-check with another doctor in Brazil?

**Support:** none. The question is the slide.

**Labels (small, on the visual):** **My doctor · Athens** · **Another doctor · Brazil** · **A similar case**

**Visual note for Pix and Ren:** Two doctor marks on a quiet map, Athens and Brazil, joined by one thin line, with one small "similar case" card between them. No app frame, no numbers, no "connected" or "matched" state: it is a question, not a feature. No "not built" tag is needed because nothing on the slide claims it works.

**Speaker notes (~20 s):** "Rare cases are rare everywhere. The one doctor who has seen a case like mine might be on the other side of the world. So: what if my doctor could find rare cases similar to mine, and cross-check with another doctor in Brazil?"

---

## Slide 5: What if, a clinical trial

**Headline:** And what if people with similar symptoms could finally find a cure, with their doctors, by taking part in a clinical trial?

**Support:** none.

**Labels:**
- Over the live frame (doctor view, `/doctor/simulate`): **My doctor's view · Simulate matching**
- Under the frame, small, required: *A simulation on 5,000 synthetic records. No real people.*

**Visual note for Pix and Ren:** The headline on top, one live frame of the doctor's "Simulate matching" page below it. The founder presses simulate on stage. The small line under the frame stays visible the whole time.

**Speaker notes (~25 s):** "And one more question. What if people with similar symptoms could finally find a cure, with their doctors, by taking part in a clinical trial? This is the doctor's side. I press simulate. What you see is a simulation on five thousand synthetic records, not real people. It shows how matches grow as more people join."

**Alternative headline (🟡, only if he wants it softer):** "…could finally find a treatment, with their doctors, by taking part in a clinical trial?" The brief's word is "cure", and as a question it promises nothing; the default keeps his word.

---

## Slide 5b: Did you know?

**Headline:** Did you know?

**Fact 1:** **4.7 years**: the average wait for a rare-disease diagnosis in Europe.
Source line, small: *EURORDIS Rare Barometer, Eur J Hum Genet, 2024*

**Fact 2:** **17.5%**: Diagnostic error costs 17.5% of health spending. About **€3.5bn\*** a year in Greece alone.
Source line, small: *OECD, The Economics of Diagnostic Safety, 2025*

**Footnote, small, bottom-left:** \* Our estimate: 17.5% of Greece's €19.9bn health spending (Eurostat, 2024).

**Visual note for Pix and Ren:** Two large numerals side by side, "4.7 years" and "17.5%", each with its one line and its source line. The "\*" and the footnote follow the pitch deck's rule 8 (small, bottom-left, muted text colour). No other number on the slide.

**Speaker notes (~20 s):** "Did you know? In Europe, people with a rare disease wait four point seven years, on average, for a diagnosis. And diagnostic error costs seventeen and a half percent of health spending. In Greece alone, on our estimate, that's about three and a half billion euros a year."

**Sources (from the pitch deck, `docs/deck/deck-content.md` v4.9):**
- 4.7 years: S3, EURORDIS Rare Barometer, Eur J Hum Genet 2024, verified, https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11369105/ (pitch deck slide 6 and A2).
- 17.5%: S10, OECD, *The Economics of Diagnostic Safety*, Health Working Paper No. 176, March 2025, verified, https://doi.org/10.1787/fc61057a-en (pitch deck slide 7 and A4). The wording "Diagnostic error costs 17.5%…" is the pitch deck's slide 7 headline.
- €3.5bn: our estimate, €19.87bn (S15, Eurostat 2024) × 17.5% (S10), as on pitch deck A4. Always with the "\*".

---

## Slide 6: Find me for a live demo

**Headline:** Find me for a live demo.

**Support:** I'll show you my record, and what my doctor sees.

**Labels:**
- **hello@onedotatatime.design**
- **healthapp-landing.pages.dev** (link: https://healthapp-landing.pages.dev)
- Pathien lockup, small

**Visual note for Pix and Ren:** The headline large, the support line, then the email and the URL on two lines. A QR to the landing page is optional (a plain QR; the DNA-shaped one is the product's handshake, not a link). The founder photo from slide 1 may close the loop, small.

**Speaker notes (~15 s):** "That's my story so far. Come and find me after this, and I'll show you live, on my own record. Thank you."

---

## Assets the slides need

| Slide | Asset | Where |
|---|---|---|
| 1, 6 | Founder photo (house template photo) | `~/AppDevelopment/travelhood/brand/social/events/lefteris-profile.jpg` |
| 1, 6 | Pathien lockup | `docs/brand/logo/pathien-lockup.svg` (light), `pathien-lockup-white.svg` (dark) |
| 2 | Hospital photo, 2019 | The founder supplies it |
| 2 | Two spreadsheet screenshots, 2019 | The founder supplies them (crop out names and IDs) |
| 3a, 3b | Live frames: patient `/patient`, doctor `/doctor` | The build with his own records (`docs/deploy.md` §2) |
| 5 | Live frame: doctor `/doctor/simulate` | The same build |

## For questions (not on any slide)

- *"Is that your real data?"* Yes, my own exams, shown by my choice. Everything else in the product is tested on synthetic data.
- *"Does the matching or the trial search work on real patients?"* Not today. Slide 5 is a simulation on 5,000 synthetic records. Slides 4 and 5 are the questions we want to answer next.
- *"Does the app tell you what you have?"* No. The patient side never interprets results. The doctor reads the history and decides.

## Founder's brief, 15 Nov 2026, verbatim

> One new deck
> Slide 1
> * Intro -> Hi I'm lefteris, product product builder based in Athens. Photo of me, you have it and some details about me. Use almost the same slide as deck
> Slide 2
> * And thats me back in 2019 at hospital. No doctor could give an answer and I was trying to figure out what my body was telling me. Photo of me at the hospital and two screenshots of the excel
> Slide 3
> * And thats me today still trying to figure this out and help doctors to find the answer. 2 Iframes that I will showcase real.
> * Same slide but me doing actions. But now by giving them the tool to analyse all my medical exams can finally make the difference
> Slide 4
> * And what if my doctor can find similar rare cases with me and cross check with another doctor in Brazil?
> Slide 5
> * And what if people with similar symptoms can finally find a cure with the help of their doctors together by taking part in a clinical trial ?iframe of this doing matching doctor/simulate
> * Did you know slide
>    * 4.7 years
>    * Diagnostic error 17% translated to 3.5 bl only in Greece?
> Slide 6
> * Find me for a live demo

Notes on the brief: "product product builder" is read as "product builder". "17%" is written 17.5%, the sourced figure (OECD, S10); "3.5 bl" is €3.5bn, our estimate, so it carries the "\*".
