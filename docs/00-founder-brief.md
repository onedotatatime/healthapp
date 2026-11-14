# Health app: founder brief (source of record)

Working name: "healthapp" (no brand name yet; Anna and the CEO may propose one in the deck).
Written by the coordinator on 2026-11-13. It quotes the founder verbatim. Every agent reads it before working.

## Context

- Event: Gen AI Summit Hackathon, Athens LifeTech Park, **Sat 14 – Sun 15 Nov 2026**, overnight. Source: https://hackathon.polymath42.com/prep
- Tracks: Voice & Enterprise Agents (Wonderful) · **Biotech & AI (the host, Athens LifeTech Park)** · Content & Digital Art (fal) · Open Track (hardware gets extra points). We target **Biotech & AI**.
- Credits (amounts at kickoff): Google AI (Gemini inference), Wonderful (selected teams only), fal, boxd, Firecrawl, Oumi, treg. Source: https://hackathon.polymath42.com/credits
- Plan: PRD, research, buyers and deck are done tonight (13 Nov). Design and development start tomorrow at the hackathon.
- The founder chose this idea over "make TravelHood viral in one day" (13 Nov).

## The founder's words: the problem (verbatim)

> A very new idea about medical health that solves the follwoing
> * Until now all people have their exams and theis medical history in papers photocopies etc
> * If I want to go to a doctor I need to tell him my history and dont forget to take my exams with me plus he cannot read all my previous exams so as to get my diagnosis. So he make some guesses or missing some info
> * Why not digitizing once our past exams so as the doctor has overview and ask AI for info about the past, like an assistant for the doctor to ask specific questios and the assistant help him to find the right diagnose and also close the gap between doctors eg the orthopedic to combine results with reumatologist

## The founder's initial requirements (verbatim)

> * The user can take photo and we digitize and read the exam data dates conditions etc
> * We care about his privacy so we need to find a way to secure his data maybe at blockchain
> * The doctor can request access to the patients data by scanning his device with a QR that looks like a DNA (DNA just for the fun)
> * The patient cannot ask his AI for diagnosis we dont want them to be their doctor but they can enter their symptoms while they are happening so as the doctor has clear view about his patient
> * The AI can analyze the data and try to find possible causes of the problem that only the doctor can evaluate better or connections with other LLMs that specialised to research and medical data
> * These data should not be accessible to insurance companies as proofs. they should be totally disclosed between the patient and the doctor.
> * The named data should be abled to be confirmed by the original document with the patients name and ID so as not to fake documents and diagnoses. We need to make sure that the person and the data is totally clear
> * Explore the possibility to use the data anonymous or training other models??? needs discussion
> * To complete create anonymity we need to find a way to have the NONAMED data in one place at blockchain and only can be confirmed with the patients data only the doctor and the patient handshake their phones with the DNA scan

## Coordinator's four flags, and the founder's answers (verbatim)

1. **Flag:** No health data on a blockchain, not even unnamed data (GDPR right to erasure; re-identification). Encrypted storage with the key on the patient's phone; the chain (or a signed log) holds only document fingerprints and access grants.
   **Founder:** "Agree, that was my point"
2. **Flag:** A photo can't prove a document is authentic. Real proof comes from the source (lab digital signature or QR code, or the Greek national systems e-prescription / myHealth). Demo: mark each record "verified by source" or "uploaded by patient".
   **Founder:** "thats true, somehow just to secure that I will not take other's exam as mine"
   (Meaning: the must-have is that the exam's patient name/ID matches the account holder, so nobody can claim someone else's exam.)
3. **Flag:** Suggesting possible causes makes it a medical device under EU MDR (certification). Fine for the hackathon; costly for a product.
   **Founder:** "We need to add it at a pitching deck as something at the end"
4. **Flag:** Anonymous data for training: opt-in only (EHDS gives a legal route).
   **Founder:** "True -> we need something like "possible matches". Somehow to ask the user if we can use his data anonymous so as to find matches about his condition with someone else acrross the globe and give doctor the possibility yo communicate for finding cure and cause"

Also: "We can find stuff from the Athens LifeTech Park tomorrow"

## What the founder asked for tonight (verbatim)

> So now go on all together to
> * Create PRD
> * Make a market research for both data but also competitors
> * Talk and brainstorm at C level based on the PRD make comments changes and approve ALL together the PRD. We will continue to designs and development tomorrow
> * Find possible buyers -> hospitals, clinics etc or even governments
> * Create the pitching deck finally like a PRO

## Later founder decisions

- 2026-11-13, **test data (overrides "synthetic data only" anywhere in the PRD):** "BTW we will use as test data my medical exams. I have plenty of them, just as a proof of concept to create the roleplay and understand if the solution works or not with a doctor. Just keep that in mind. The exams could be paper or MRIs or Xrays". The founder consents for his own records only. Handling rules (coordinator, for the CTO to confirm or tighten):
  - Store them only in the demo project's private storage, never in git, Linear, Slack, Notion, the deck or any agent memory. Delete or keep them after the event: the founder decides.
  - AI calls go through a paid, no-training, no-retention endpoint (e.g. Vertex AI / Gemini API paid tier). Never a free tier that may train on the data. The CTO confirms which endpoint the credits give.
  - MRIs and X-rays: the demo reads the radiologist's written **report**. The image itself is stored and shown as an attachment; the AI does **not** interpret images (that is radiology, a regulated medical device). Supported inputs: paper photos, PDFs, report text, and DICOM/JPEG images as attachments.
  - On stage, the founder chooses which exams appear on screen. Provide a "presentation mode" that hides his name and ID numbers.
  - No other person's exams, ever. The identity-match rule (story B1) is tested on his own name.
- 2026-11-13, on deployment and deletion: "In order to test we need to have a deployed version so we can use them and then delete them .its ok". So the demo is **deployed** (a hosted test environment, not localhost only), his exams are used there for the role-play with a doctor, and they are **deleted after the test**. Release adds a one-command wipe of storage, the database and model-side files, and the CTO verifies the wipe.
- 2026-11-13, on the AI endpoint: "CTO confirms, also we can use maybe some of the services we will have credits tomorrow?" The CTO picks the endpoint, and he should prefer the hackathon credits (Google AI → Gemini via Vertex AI or the paid API, with no training and no retention) when their terms allow it. Where a credit service's data terms are unclear, it stays out of the path for his real exams.

- 2026-11-13, **market focus (overrides any Greece-first framing in this file or in earlier briefs):** "Dont focus on the greek market. we need to focus on global market". Research, buyers, PRD and deck size and target the global market. Greece is at most one possible launch or pilot location (the hackathon is in Athens), not the market.

- 2026-11-13, on using treg.to (https://treg.to/) for the market research: **"Yes, tomorrow"**. Spast runs a treg pass at the hackathon, once the credits are claimed: search demand in the main global markets, competitor funding (Crunchbase), buyer firmographics and hiring signals, and patient voice on Reddit and social. The founder creates the treg account. No personal contact lookups (emails, phones). This adds to the sourced research; it doesn't replace it.

## File layout

- `docs/PRD.md`: the PRD (Back owns; every role writes its own section)
- `docs/research/market-and-competitors.md`: market data + competitor teardown (Spast)
- `docs/research/buyers.md`: possible buyers (Spast)
- `docs/reviews/`: C-level and role comments and sign-offs
- `docs/deck/`: deck content and the designed deck
