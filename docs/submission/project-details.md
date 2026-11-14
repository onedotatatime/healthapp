# Submission: project details (MIN-4524)

Gen AI Summit Hackathon, Biotech & AI track. Paste each section into the form. Owner: Anna Lytica. Numbers come from the founder's measured run (14 Nov 2026), not from the research.

**Name.** healthapp (working name; no brand name chosen).

**Live demo URL, repo, video.** To fill at submission: [demo URL] · [repo URL] · [video URL].

## One line

Scan your old exams once. Your doctor sees the whole history, asks questions, and every answer shows its source.

## Problem

Most people keep their medical history on paper and in separate apps. A doctor sees only the page the patient remembered to bring, so decisions start from half a history. Patients fill the gap by asking a search engine, which puts the right diagnosis first about a third of the time (Semigran et al., BMJ, 2015). The OECD (2025) puts inaccurate, delayed or wrong diagnoses at up to 15%.

## What we built

A phone app for the patient and a screen for the doctor.

- The patient photographs paper exams. AI reads the date, lab, and every value with its unit and range. The patient checks each value before it is saved.
- The name and ID on the exam must match the account. Someone else's exam is refused.
- The patient logs symptoms as they happen and can send them to their doctor. The app explains nothing to the patient.
- The patient shows a code shaped like a DNA helix. The doctor scans it, the patient approves, and the doctor gets access for a set time.
- The doctor sees an overview and asks questions. Answers come only from the record, each with links to the exams they came from.
- Access ends by itself when the time runs out, or sooner with one tap. The patient can read who looked and when.

## Measured on the working demo

| What | Result |
|---|---|
| Scan of a paper exam, read into values | about 17 s |
| Patient approves code, doctor's view opens | 3.6 s |
| Doctor asks about CRP: cited answer with 5 sources | about 15 s |
| Access ends, doctor's view clears | about 3 s |
| Fields read correctly, synthetic set | 235 of 235 |
| Exams with a wrong name or ID | refused |

## Tech

- React progressive web app, hosted on Cloudflare Pages.
- Supabase in the EU (Ireland): database, auth, file storage and edge functions. Access rules are enforced in the database with row-level security, including the expiry time, not in the browser.
- Gemini reads the exam photos and answers the doctor's questions.
- Access grants are kept in a signed, hash-chained log. It holds document fingerprints and access events, never health data. There is no blockchain.

## What is real and what is simulated

Real: reading photos into values; the identity match; the time-limited, patient-approved access enforced by the database; the signed log of fingerprints and grants; encryption at rest by the platform; cited answers; no insurer account type, no export; the server refusing interpretation on the patient side.

Simulated or seeded: the encryption key sits on our server, not on the patient's phone (the product design puts it on the phone); the "verified by source" lab is our own demo lab (the signature check itself is real); possible matches come from a seeded synthetic set and doctor-to-doctor contact is simulated; the model provider sees the demo data.

Pilots, partners and regulators: none. Nobody has been contacted.

## Safety lines

- The patient side never diagnoses and shows nothing interpretive. There is no AI question box for patients. The only fixed text is: "If this is an emergency, call 112."
- The doctor's assistant answers only from the patient's record and shows its sources. Any possibilities are for the doctor to evaluate.
- Insurers never get access, as readers or as buyers. No data is sold.
- Possible matches are opt-in, off by default, unnamed, and can be withdrawn.
- Our AI agents never read real patient data.

## After the event (not built)

A real product needs keys on the patient's device, verification from real labs, and regulatory work (EU MDR, GDPR, EHDS). The roadmap is in the PRD.
