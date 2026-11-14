# Submission form: the problem, the data and the model

| | |
|---|---|
| **Owner** | Anna Lytica (Marketing), MIN-4429 |
| **For** | Gen AI Summit Hackathon submission form, 14–15 Nov 2026 |
| **Founder's request** | "The problem, the data, and the model you want to end up with. A paragraph is plenty. until 2000" |
| **Limit** | 2000 characters including spaces. This paragraph: **1993** (measured with `wc -m`, plain ASCII, no line breaks). |
| **Status** | Draft. Nothing sent. The founder pastes it himself. |

Rules kept: claim only what runs (the prototype is described as what we build this weekend; the end state is marked as the target); synthetic data only in the demo; "insurers never see them", the founder's rule, not widened or narrowed; "possible causes" named as out of scope; Gemini named as the demo's choice (PRD §10.1); no "the only", "the first", "end-to-end encrypted" or dollar figures.

## Paste this

Problem: a patient's medical history lives on paper, in photocopies in a drawer. A new doctor works from the pages the patient remembers to bring and what they remember to say, and an orthopaedist and a rheumatologist treating the same person rarely see each other's results, so doctors guess, miss things or repeat exams. Data: the prototype we build this weekend uses synthetic exams only, about ten blood tests, imaging reports and doctors' letters in Greek and English for two invented people, each marked as synthetic, with extraction scored against a ground-truth file. Real records come later, only with the patient's consent and after a data-protection impact assessment, and insurers never see them. Model, as we build it: a multimodal model (Gemini, the demo's choice) reads a photo of an exam into a fixed schema (date, lab, each value with its unit and printed range, and the document's own words) with no field for an opinion. Code, not the model, flags values outside the printed range and refuses an exam whose name or ID is not the patient's. The patient lets a doctor in, in person by QR code, for a set time, enforced in the database. The doctor then asks questions over the whole history. Every answer cites the exam it came from; the server checks each cited number and date against that source before showing it, marks what fails as unverified, and says "not in this record" when the answer is not there. Access grants and document fingerprints go into a signed, hash-chained log the patient can read. The patient never gets an AI interpretation. Where we want to end up: the key on the patient's phone so we cannot read records at rest, the AI seeing one request's facts in the patient's region without their name, and records verified by the lab that issued them. Suggesting possible causes is out of scope: that would be a regulated medical device. The first buyer we want to test is a hospital's international-patient department, paying per case; patients use it free.
