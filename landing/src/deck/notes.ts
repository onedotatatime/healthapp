// Speaker notes by slide id, copied from docs/deck/deck-content.md (v4.3). One string per paragraph. Shown with N.
export const N: Record<string, string[]> = {
  "1": [
    "This is Maria. She has knee pain and swollen joints. At night she types her symptoms into a search bar. By day she sees an orthopaedist and a rheumatologist. Her blood tests, her MRI report and two doctors' letters sit in a folder, some on paper, some in an app, some from a private lab. Each doctor sees the page Maria remembered to bring. Neither sees what the other found. Maria is synthetic. Her story is not unusual."
  ],
  "2": [
    "The OECD says up to 15 percent of diagnoses are inaccurate, delayed or wrong. In the US alone, about 795,000 people a year die or are left permanently disabled by a missed dangerous disease. On the other side of the desk, half of Greeks, and 60 percent of Europeans, look up their health online, and symptom checkers get the diagnosis right first time only about a third of the time. The doctor guesses from half a history. The patient guesses from a search engine. The information exists. It just never arrives at one desk."
  ],
  "3": [
    "Three things changed. First, a 2026 Nature Medicine study: the models alone found the right condition 95 percent of the time, but people using them got under 35 percent, because they gave the model incomplete information. A smarter chatbot is not the answer. The complete record, in front of the doctor, is. Second, this month Greece started putting lab results in MyHealth and limiting repeat tests, so doctors need the earlier result at hand. Third, Europe's EHDS gives patients the right to hold and add to their record. We are not a rival to the national file. We carry what it does not hold: private tests, imaging, old paper, records from abroad, and a summary for the doctor."
  ],
  "4": [
    "Maria photographs her exams once. We read them and check each one is hers, so nobody builds a record out of someone else's papers. When a symptom starts at night, she logs it instead of searching, and taps send to my doctor. The app does not tell her what it means; her doctor sees it next to her whole history. At the orthopaedist she shows a DNA-shaped code. He scans, she approves, and for fifteen minutes he can ask her history anything. Every answer points to the page it came from. Let me show you, live. Everything you see runs on synthetic data.",
    "Run the demo, about 60 seconds, as listed on A2. If a step fails, switch to the fallback screenshots on A2 and narrate them; do not retry on stage.",
    "For questions (not on the slide):",
    "\"Is this real?\" The working pipeline runs on synthetic data: reading the photo into values, the name and ID match, the handshake and the time limit enforced by the database, cited answers, the signed log of who looked. Measured on the demo: 235 of 235 fields read correctly on our synthetic test set (S20).",
    "\"What is simulated?\" The encryption key sits on our server, not on Maria's phone; the \"verified by source\" lab is our own demo lab (the signature check is real); possible matches come from a seeded synthetic set; doctor-to-doctor contact is a mock-up.",
    "\"Is any of it real patient data?\" No. Synthetic patient, synthetic exams, no real health data.",
    "The full list: A2."
  ],
  "5": [
    "We designed privacy in from the first line. The key lives on the patient's device. A doctor gets in only face to face, only with a yes, and only for a set time. Every access goes into a log the patient can read and nobody can edit; the log holds fingerprints, never health data. Those are product rules, not settings."
  ],
  "5b": [
    "Pathien Vault keeps the whole record on a device the patient owns, under our own encryption, not in the cloud. Here is how it's used. The patient is abroad, or at a hospital, and not in a serious condition. The doctor scans the code on the Vault, and it opens our doctor page. One of our support team calls the hospital to verify the situation, then gives the doctor access for a set time."
  ],
  "6": [
    "The founder's question was simple: somewhere in the world, someone has Maria's pattern. If she says yes, her doctor can see that similar unnamed cases exist and ask to talk to the doctor treating one of them. Not to sell data. To shorten the years patients spend going from doctor to doctor. Opt-in only, and she can withdraw at any time."
  ],
  "6b": [
    "Clinical trials. With a separate yes, we pre-screen the patient's record against a trial's criteria. The site confirms, the patient chooses. Between visits, the trial team sees her diary in her own words and her values over time. Here is what that is worth."
  ],
  "6c": [
    "Today, the trials recruiting in Europe carry about three hundred and sixty million dollars of recruitment budget, and a day of delay costs a sponsor about forty thousand dollars. If our pre-screen brings a trial to full enrolment five days sooner, that is about two hundred thousand dollars saved. We charge five thousand euros to set a trial up and a thousand per randomised patient. The sponsor keeps most of the saving. The patient never pays."
  ],
  "7": [
    "The OECD put a price on it last year: diagnostic error eats 17.5 percent of health spending, almost 2 percent of GDP. Halving it would free 8 percent. Take Greece, where we are standing: that is about three and a half billion euros a year. We start with the smallest, most measurable slice, unnecessary and repeated tests. On tests alone, between 4 and 75 million euros a year in Greece, depending on adoption. The bigger prize is the diagnosis itself."
  ],
  "8": [
    "Epic summarises what is inside one hospital. National apps like MyHealth hold public lab results inside one country, and we complement them. ChatGPT Health and symptom checkers talk to the patient, from whatever the patient types in. OpenEvidence answers doctors from the literature, not from this patient. We sit where none of them sits: the record the patient carries across every provider and border, with an assistant that answers only the doctor, and shows its source."
  ],
  "9": [
    "The patient is free. Three groups pay. Hospitals, public and private, pay per case or per doctor seat; the first are the ones that treat patients from abroad, whose records arrive in other languages, on paper, or not at all. Governments and national health systems license it, through a tender or a sandbox, as a patient-held layer next to the national record. Private clinics, chains, diagnostic centres and telehealth pay per doctor seat. Research use, if ever, is opt-in and never a data sale."
  ],
  "10": [
    "How do we earn? Not from diagnoses: we never make one. Hospitals pay for the complete history in front of their doctors. An international-patient department pays per case; a clinic chain pays per doctor seat. On our assumptions, year three is between about half a million and five million euros. Compare that with slide 7: better records could save four to seventy-five million a year on tests, in Greece alone. Our customers pay a small share of what the system saves. Every price here is an assumption, and the pilots exist to test it."
  ],
  "11": [
    "We start where records are thickest and the buyer already wants them. This weekend, here, we look for a clinical champion. Next, an innovation gateway like Mayo Clinic Platform to validate with clinicians. Then the first paying use: hospitals that treat patients from abroad, starting in the UAE. And the rare-disease community, where possible matches matter most. These are targets; we have not contacted anyone yet."
  ],
  "12": [
    "We know where the line is. Suggesting possible causes makes software a medical device in Europe, so we sequence. First the record: it stores, finds and shares, under GDPR and HIPAA. Then the opt-in network, with the EHDS as the legal route for research. Then the doctor's assistant, certified under the MDR, with the AI Act's high-risk rules. Today's demo uses only synthetic data. That is our plan, and it is the reason a hospital can say yes to step one now."
  ],
  "13": [
    "Today it is me, and a team of AI agents that built this with me this weekend. What I ask is one million euros over twenty-four months, in two parts. Three hundred thousand only when a hospital signs a pilot. Seven hundred thousand only when that pilot proves the price, the volume and the cost of each case."
  ],
  "14": [
    "Why this amount. Six people: two engineers and an ML engineer to build it, a clinician to keep it safe and on the regulatory path, and business development and marketing to sell it to hospitals, clinics and governments. Twenty-nine percent goes to selling. On our conservative line it pays for itself at month twenty-nine, with money left. If you know a hospital that would pilot this, come and find me. Thank you."
  ]
};
