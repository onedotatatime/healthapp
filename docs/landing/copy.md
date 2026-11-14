# Landing page copy (MIN-4463)

English only. 438 words in total, counted on the visible strings below (headings of this file, `·` separators and notes not counted).

## nav

- **labels** (link to `how`, `who`, `tech`, `roadmap`): How it works · Who it's for · Under the hood · Roadmap
- **cta:** Get in touch

## hero

- **headline:** Your medical history, in one place.
- **subhead:** Photograph your exams once. Doctors you let in can ask questions, and every answer shows its source.
- **cta** (scrolls to `how`): See how it works
- **tag:** Hackathon prototype · synthetic data

## hero-card

Small card, bottom-right of the hero. Not a stat, not a testimonial.

- **label:** How it answers
- **line:** Was ferritin ever low? Yes, in the March lab exam (source linked).
- **footnote:** Synthetic example

## statement

Full-bleed line, revealed word by word:

Your health history is scattered across paper, drawers and different doctors' offices.

## change

- **headline, part 1:** What changes when
- **headline, part 2:** your history is in one place

**Before**
- Paper in a drawer
- A new doctor starts from memory
- Specialists don't see each other's results
- Exams get repeated

**After**
- One history on your phone
- A doctor let in by QR, for a set time
- Every answer cites its source exam
- You see every access

## how

1. **Photograph past exams**
   Each one is read into a fixed record: date, lab, values, units, ranges. Values outside the printed range are flagged.
   **What it does:**
   - Reads date, lab, values, units, ranges
   - Flags values outside the printed range
   - Saves into a fixed record
2. **Let a doctor in**
   Share by QR code, in person, for a set time.
   **What it does:**
   - Share by QR code, in person
   - Access lasts for a set time
   - Every access is logged, and you can read it
3. **Ask across your history**
   The doctor asks questions over everything. Every answer cites its source exam.
   **What it does:**
   - Answers across all your exams
   - Each answer cites its source exam
   - Says "not in this record" when it isn't

## who

### patient
- **title:** For patients
- Your whole history, in your pocket.
- You choose who sees it, and for how long.
- You can read every access.

### doctor
- **title:** For doctors
- The full picture before the consultation starts.
- Ask a question, get the source exam with it.
- Fewer repeated exams.

## tech

**title:** Under the hood

- **Reads into a fixed schema.** A multimodal model fills set fields, with no field for opinions.
- **Every citation is checked.** The server verifies each number and date against the source, and says "not in this record" when it isn't.
- **Access that expires.** Time-limited access is enforced in the database.
- **A log you can read.** Signed, hash-chained, and readable by the patient.

## trust

- Answers are cited and checked.
- No AI interpretation for patients.
- You see every access.
- Insurers never see records.

## roadmap

**title:** Where we're going

- **Future:** the key on your phone, so we cannot read records at rest.
- **Future:** the model sees one request's facts, without your name.
- **Future:** records verified by the lab that issued them.

## footer

- [name]
- Built at GenAI Summit Hackathon · Athens · Nov 2026
- [contact]

## Notes for Pix and Ren

- `[name]` and `[contact]`: founder to supply.
- Roadmap items must be visibly labelled "Future" (chip or muted style); nothing above the roadmap is future.
- Left out on purpose: any numbers, testimonials, "possible causes" or diagnosis claims.

## screens

Section id `screens`, placed after `how`. Four phone or desktop frames from the demo, each with a caption. The patient in all screens is Maria, a synthetic person. The doctor is Dr. N., synthetic.

- **title:** See it in action
- **subtitle:** Four screens from the prototype, filled with synthetic data.
- **note (small, under the title):** Synthetic demo data. No real patients, labs or results.

### s-history (patient app)
- **caption title:** Your history
- **caption line:** Every exam on one timeline, with date, type and lab.
- **screen title:** Maria's history
- **tag:** Synthetic
- **item 1:** 12 Mar 2026 · Blood test · Lab A
- **item 2:** 28 Nov 2025 · Chest X-ray · Imaging Centre B
- **item 3:** 05 Sep 2025 · Thyroid ultrasound · Imaging Centre B
- **item 4:** 14 May 2025 · Urine test · Lab C
- **button:** Photograph an exam

### s-scan
- **caption title:** Photo to record
- **caption line:** A photographed blood test, read into values, units and printed ranges.
- **card title:** Blood test · 12 Mar 2026 · Lab A
- **thumbnail label:** Source photo
- **column heads:** Value · Unit · Printed range
- **row 1 (flagged):** Ferritin · 14 · ng/mL · 15–150 · flag label: Outside printed range
- **row 2:** Hemoglobin · 13.2 · g/dL · 12.0–16.0
- **row 3:** Glucose · 88 · mg/dL · 70–99
- **row 4:** Total cholesterol · 182 · mg/dL · under 200
- **footer:** Read from your photo. Check it against the original.

The flag shows only the label and the printed range. No colour-coded meaning, no explanation.

### s-share
- **caption title:** Let a doctor in
- **caption line:** A QR code, a timer and a log. You stay in control.
- **card title:** Doctor access
- **instruction:** Show this code to your doctor, in person.
- **countdown:** Expires in 29:41
- **access-log line:** Access log · Dr. N. (synthetic) scanned 10:42 · access until 11:12

### s-ask (doctor view)
- **caption title:** Ask, with sources
- **caption line:** Doctors ask across the history. Every answer shows its source.
- **tag:** Doctor view · Synthetic
- **input placeholder:** Ask about this record
- **question 1:** Was ferritin ever low?
- **answer 1:** Yes. Ferritin was 14 ng/mL on 12 Mar 2026, below the printed range of 15–150.
- **source chip:** Source: Blood test · 12 Mar 2026 · Lab A · Uploaded by patient
- **question 2:** Any penicillin allergy?
- **answer 2 (muted):** Not in this record.

## ctas

| id | label | target | placement |
|---|---|---|---|
| `cta-patients` | For patients | Scrolls to the patient card in `who` | Nav, hero (secondary link) |
| `cta-doctors` | For doctors | Scrolls to the doctor card in `who` | Nav, hero (secondary link) |
| `cta-updates` | Get updates | Opens `mailto:[contact]?subject=Get updates` | Nav (button, replaces "Get in touch"), footer band, small link at the end of each `who` card |

**Footer band (`cta-updates`):**
- **headline:** Hackathon prototype. Hear when we pilot.
- **email input placeholder:** you@email.com
- **button:** Get updates

Notes
- The update form has no backend yet. It must be a `mailto:[contact]` link, nothing stored. If Ren fills the typed address into the mail body, fine; otherwise drop the input and keep the button, so nothing implies we collect it.
- The nav "Get in touch" label is replaced by "Get updates".
- Hero keeps "See how it works" as primary; the two role links sit beside it.
- Screen microcopy is only what the demo shows. If a screen is not built by launch, drop it rather than fake it.
