// The pitch deck: the whole content of the presentation, as typed data.
// Source of the words: docs/deck/deck-content.md (v3.2). Speaker notes are copied from the same file.
// Templates live in ./templates; to make another deck, copy this file and change the data (see README.md).
import type { Slide } from './types';

// Speaker notes by slide ("A" = Appendix A). One string per paragraph.
const N: Record<string, string[]> = {
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
    "Maria photographs her exams once. We read them and check each one is hers, so nobody builds a record out of someone else's papers. When a symptom starts at night, she logs it instead of searching, and taps send to my doctor. The app does not tell her what it means; her doctor sees it next to her whole history. At the orthopaedist she shows a DNA-shaped code. He scans, she approves, and for fifteen minutes he can ask her history anything. Every answer points to the page it came from."
  ],
  "5": [
    "Let me show you, live. Everything you see runs on synthetic data.",
    "(Run the demo. If a step fails, switch to the screenshot version and narrate it; do not retry on stage.)"
  ],
  "6": [
    "We designed privacy in from the first line. The key lives on the patient's device. A doctor gets in only face to face, only with a yes, and only for a set time. Every access goes into a log the patient can read and nobody can edit; the log holds fingerprints, never health data. Those are product rules, not settings."
  ],
  "6b": [
    "Pathien Vault keeps the whole record on a device the patient owns, under our own encryption, not in the cloud. Here is how it's used. The patient is abroad, or at a hospital, and not in a serious condition. The doctor scans the code on the Vault, and it opens our doctor page. One of our support team calls the hospital to verify the situation, then gives the doctor access for a set time."
  ],
  "7": [
    "The founder's question was simple: somewhere in the world, someone has Maria's pattern. If she says yes, her doctor can see that similar unnamed cases exist and ask to talk to the doctor treating one of them. Not to sell data. To shorten the years patients spend going from doctor to doctor. Opt-in only, and she can withdraw at any time."
  ],
  "8": [
    "The OECD put a price on it last year: diagnostic error eats 17.5 percent of health spending, almost 2 percent of GDP. Halving it would free 8 percent. Take Greece, where we are standing: that is about three and a half billion euros a year. We start with the smallest, most measurable slice, unnecessary and repeated tests. On tests alone, between 4 and 75 million euros a year in Greece, depending on adoption. The bigger prize is the diagnosis itself."
  ],
  "9": [
    "Epic summarises what is inside one hospital. National apps like MyHealth hold public lab results inside one country, and we complement them. ChatGPT Health and symptom checkers talk to the patient, from whatever the patient types in. OpenEvidence answers doctors from the literature, not from this patient. We sit where none of them sits: the record the patient carries across every provider and border, with an assistant that answers only the doctor, and shows its source."
  ],
  "10": [
    "The patient is free. The first buyer is the hospital that treats patients from abroad: their records arrive in other languages, on paper, or not at all, and the hospital already asks for them before the trip. Clinic chains pay per doctor seat. Rare-disease networks are our free pilots. Later, national agencies. Research use, if ever, is opt-in and never a data sale."
  ],
  "11": [
    "How do we earn? Not from diagnoses: we never make one. Hospitals pay for the complete history in front of their doctors. An international-patient department pays per case; a clinic chain pays per doctor seat. On our assumptions, year three is between about half a million and five million euros. Compare that with slide 8: better records could save four to seventy-five million a year on tests, in Greece alone. Our customers pay a small share of what the system saves. Every price here is an assumption, and the pilots exist to test it."
  ],
  "12": [
    "We start where records are thickest and the buyer already wants them. This weekend, here, we look for a clinical champion. Next, an innovation gateway like Mayo Clinic Platform to validate with clinicians. Then the first paying use: hospitals that treat patients from abroad, starting in the UAE. And the rare-disease community, where possible matches matter most. These are targets; we have not contacted anyone yet."
  ],
  "13": [
    "We know where the line is. Suggesting possible causes makes software a medical device in Europe, so we sequence. First the record: it stores, finds and shares, under GDPR and HIPAA. Then the opt-in network, with the EHDS as the legal route for research. Then the doctor's assistant, certified under the MDR, with the AI Act's high-risk rules. Today's demo uses only synthetic data. That is our plan, and it is the reason a hospital can say yes to step one now."
  ],
  "14": [
    "Today it is me, and a team of AI agents that built this with me this weekend. What I ask is six hundred thousand euros over eighteen months, in two parts. The first two hundred thousand comes only when a hospital signs a pilot. The other four hundred only when that pilot proves the price, the volume and the cost of each case."
  ],
  "15": [
    "Why this amount. Four people: an engineer and an ML engineer to build it and make the reading accurate and cheap, business development and marketing to sell it. Twenty-eight percent goes to selling. A university hospital, a target we have not contacted yet, would check the work with clinicians. And today: if you know a hospital that treats patients from abroad, or a doctor who would try the doctor view, come and find me. Thank you."
  ],
  "A": [
    "We size the paying side only: doctors. The US alone has about 905,000 physicians in direct care. At an assumed fifty dollars a seat a month, which sits under paid AI scribes and above the free tools, the US, the EU and India are about a 1.9 billion dollar a year market. That is the ceiling, not our plan. Our plan is on slide 11: two thousand seats at most by year three, plus per-case fees. These are our assumptions, and the pilots exist to test the price."
  ]
};

// Questions-only backup lines from deck-content.md (slides 8 and 11). Not for reading out.
N['8'].push(
  'For questions (do not read out): savings a year = cost base × share avoidable × share we prevent × adoption. Conservative: €810M (Greek stand-alone lab and imaging spend, 2024, S15) × 25% unnecessary (OECD low end, S10) × 20% we prevent (assumption) × 10% adoption (assumption) = about €4M. Upside: €497M (OECD\'s 2.5% unnecessary-test share × €19.87bn Greek spend) × 50% we prevent (assumption, anchored to S17: duplicate-imaging odds 0.44 when doctors used a shared record) × 30% adoption (assumption) = about €75M. Whole prize: €19.87bn × 17.5% = about €3.5bn (our estimate). Never say €75M without "upside" and the adoption assumption.',
);
N['11'].push(
  'For questions (do not read out): Why €40 to €80 a case? No one publishes a price for a consented, translated record packet. We ask buyers for their figure first. Why €50 a seat? Below paid AI scribes (Tandem Pro lists €125 a month, S18), above the free tools (OpenEvidence and Glass are free to US clinicians, S8). Is 45,000 cases a lot? Turkey alone welcomed about 1.5M health tourists in 2024 (S19, secondary). 45,000 cases is about 3% of one country\'s year. Who saves, who pays? Not always the same desk. The payer or the patient saves on repeated tests; the international-patient department pays for a faster first visit and patients who arrive ready. The pilot measures both.',
);

const QR = '/deck-qr.svg';

export const slides: Slide[] = [
  {
    id: '1', template: 'cover', theme: 'air', notes: N['1'],
    eyebrow: 'Gen AI Summit Hackathon · Biotech & AI · Athens LifeTech Park',
    headline: 'Maria asks Google what her pain means. Her doctors each see one page of her history.',
    tagline: 'The whole history in front of the doctor, so the first decision is the right one.',
    background: '/img/bg-hero.webp',
    photo: { src: '/img/problem.webp', alt: 'A worn envelope of exams, an X-ray and loose letters on a table' },
  },
  {
    id: '2', template: 'stats', theme: 'air', no: '02', kicker: 'Problem', notes: N['2'],
    headline: 'Patients ask Google. Doctors decide from half a history. Both cost lives and money.',
    groups: [
      {
        label: "The doctor's side", tone: 'deep',
        cards: [
          { pre: 'Up to', number: '15%', text: 'of diagnoses are **inaccurate, delayed or wrong.**', source: 'OECD, 2025 · S10' },
          { number: '795,000', text: 'people a year in the US **die or are permanently disabled** because a dangerous disease was misdiagnosed.', source: 'Newman-Toker et al., BMJ Qual Saf, 2024 · S11' },
        ],
      },
      {
        label: "The patient's side", tone: 'light',
        cards: [
          { number: '51%', text: 'of Greeks look up their health online. Symptom checkers put the right diagnosis first only **34%** of the time.', source: 'Eurostat, 2025 · S12 · Semigran et al., BMJ, 2015 · S13' },
        ],
      },
    ],
    chips: ['Orthopaedist', 'Rheumatologist', 'Private lab', 'Search history'],
    closing: 'The history exists, split across providers, apps, private labs, paper and other countries. It never reaches one desk.',
  },
  {
    id: '3', template: 'statement', theme: 'air', no: '03', kicker: 'Why now', notes: N['3'],
    headline: "AI already knows the medicine. What it lacks is the patient's history, and the state is now forcing doctors to find it.",
    pointStyle: 'plain',
    points: [
      { text: "**AI is not the missing piece. The record is.** Language models alone named the right condition in **94.9%** of cases. People using the same models found it in fewer than **34.5%**, no better than searching on their own. What was missing was the patient's information.", source: 'Bean et al., Nature Medicine, 2026 · S14' },
      { text: "**Repeat tests are being cut.** Since 1 November 2026, Greece's EOPYY posts lab results to one national file (MyHealth) and caps how often key tests can be repeated. A doctor who cannot re-order a test needs the earlier result in hand.", source: 'Greek press, Nov 2026 · S16' },
      { text: '**Europe opens the record to the patient.** The EHDS is in force since March 2025: patients can add their own data, restrict access and see who looked. Patient summaries join in **2029**; lab results, images and discharge reports in **2031**.', source: 'European Commission · S4' },
      { text: '**AI reads documents.** A phone photo of a lab report becomes dates, values, units and ranges in seconds.', source: 'Shown live in the demo, slide 5' },
    ],
    side: {
      kind: 'compare',
      title: 'What was missing',
      bars: [
        { label: 'Model alone', value: '94.9%', tone: 'deep' },
        { label: 'Person using the model', value: '< 34.5%', tone: 'mint', gap: 'the missing history' },
      ],
      clockTitle: 'The clock',
      clock: [
        { when: 'Mar 2025', what: 'EHDS in force' },
        { when: 'Nov 2026', what: 'EOPYY repeat-test limits' },
        { when: '2029', what: 'Patient summaries' },
        { when: '2031', what: 'Labs and images' },
      ],
    },
  },
  {
    id: '4', template: 'product', theme: 'air', no: '04', kicker: 'Product', notes: N['4'],
    headline: 'Everything the patient has, in one history. The doctor asks, and every answer shows its source.',
    steps: [
      { n: 1, title: 'Photograph', icon: 'photo', tag: 'Mock-up', text: '**Photograph** an old exam. Pathien reads it: date, lab, every value with its unit and range.' },
      { n: 2, title: 'Match', icon: 'match', tag: 'Mock-up', text: "**It must be yours.** The name and ID on the exam must match the account. Someone else's exam is refused." },
      { n: 3, title: 'Timeline', icon: 'timeline', tag: 'Mock-up', text: '**One timeline.** Exams and the symptom diary, in date order. Patients log symptoms; the doctor gets the full picture; no self-diagnosis.' },
      { n: 4, title: 'Handshake', icon: 'helix', tag: 'Mock-up', text: '**The DNA handshake.** The patient shows a helix-shaped code, the doctor scans it, the patient approves. Access runs for a set time.' },
      { n: 5, title: 'Ask', icon: 'ask', tag: 'Mock-up', text: '**The doctor asks.** "When was her CRP raised?" The answer lists dates and values, each linked to the exam it came from.' },
    ],
    under: [
      { label: 'Under step 3', lines: ['Instead of searching at night, Maria logs the symptom and taps **Send to my doctor**. Her doctor sees it with her whole history. The app does not explain it. Fixed line: "If this is an emergency, call 112."'] },
      {
        label: 'Under step 5', badges: ['Verified by source', 'Uploaded by patient'],
        lines: [
          'Possibilities to evaluate, for the doctor only. Never shown to the patient.',
          '**Over time.** Each marker as a line across her exams, the readings outside the printed range marked, and a straight-line projection. Doctor view only, for the doctor to evaluate.',
        ],
      },
    ],
  },
  {
    id: '5', template: 'statement', theme: 'night', no: '05', kicker: 'Live demo', notes: N['5'],
    footer: 'Synthetic patient. Synthetic exams. No real health data.',
    headline: "Live: Maria's folder, a doctor's question, an answer with its source.",
    pointStyle: 'numbered',
    points: [
      { text: 'Photo of a blood test → structured record.' },
      { text: "Her husband's exam → refused: not her name, not her ID." },
      { text: 'DNA handshake → countdown starts.' },
      { text: '"Has her CRP been raised before?" → dates, values, links to the exams.' },
      { text: 'Orthopaedics and rheumatology side by side → possibilities, each with its sources, for the doctor only.' },
      { text: "Time ends → the doctor's screen closes; Maria's log shows who looked and until when." },
    ],
    side: {
      kind: 'notice', tag: 'Working demo · synthetic data',
      blocks: [
        { label: 'Working pipeline, on synthetic data', text: 'Reading the photo into values, the name and ID match, the handshake and the time limit enforced by the database, cited answers, the signed log of who looked. Measured on the demo: **235 of 235 fields** read correctly on our synthetic test set (S20).' },
        { label: 'Simulated tonight', text: 'The encryption key sits on our server, not on Maria\'s phone; the "verified by source" lab is our own demo lab (the signature check is real); possible matches come from a seeded synthetic set; doctor-to-doctor contact is a mock-up.' },
      ],
    },
  },
  {
    id: '6', template: 'statement', theme: 'mist', no: '06', kicker: 'Privacy by design', notes: N['6'],
    headline: 'The patient holds the key. The log holds only fingerprints.',
    pointStyle: 'bar',
    points: [
      { text: "**By design, the key is on the patient's phone.** Records are stored encrypted. Without the patient, nobody reads them, including us. (Demo: the key sits on our server tonight; slide 5.)" },
      { text: "**In person, for a set time.** A doctor gets in only by scanning the patient's code and getting a yes. Access ends by itself, or earlier with one tap." },
      { text: '**A log nobody can edit.** Every access is written to a signed, chained log the patient can read. The log holds fingerprints of documents and access grants. No health data ever goes on a chain.' },
      { text: '**No diagnosis for the patient.** The patient side has no AI question box at all.' },
    ],
    side: { kind: 'phone', caption: "Key on the patient's phone", tag: 'Mock-up' },
  },
  {
    id: '6b', counter: '6b', template: 'hero', theme: 'air', notes: N['6b'],
    headline: 'Pathien Vault. The whole record, on a device the patient owns.',
    body: 'For patients who want maximum privacy. A small device, bought once, holds the full record and every original, encrypted, at home or on a keyring. The phone opens it.',
    points: [
      '**Our own encryption, on the device.** Pathien\'s software encrypts every record on the Vault itself. Nothing goes to the cloud unless the patient turns on an encrypted backup.',
      '**Same product, same rules.** It stores and shares. It never interprets, so it never diagnoses.',
    ],
    stepsTitle: "How it's used",
    steps: [
      'The patient is abroad or at a hospital, not in a serious condition.',
      'The doctor scans the code on the Vault.',
      'The code opens the Pathien doctor page.',
      'A Pathien support person calls the hospital to verify the situation, then gives the doctor access for a set time.',
    ],
    image: { src: '/deck/vault-hero.jpg', alt: 'A slim teal-night aluminium device, a rounded pebble with a tone-on-tone Pathien mark and one small coral light, on a pale surface' },
    lockupSuffix: 'Vault',
    footer: 'An option for privacy-first patients. The core business is unchanged.',
  },
  {
    id: '7', template: 'statement', theme: 'air', no: '07', kicker: 'Possible matches', notes: N['7'],
    footer: 'Demo: possible matches come from a seeded synthetic set; doctor-to-doctor contact is a mock-up.',
    headline: 'A rare pattern becomes findable, only when the patient says yes.',
    pointStyle: 'bar',
    points: [
      { text: 'The patient can opt in. Off until they turn it on. Name and ID are never used. They can turn it off any time.' },
      { text: 'The doctor sees that unnamed patients elsewhere share the same pattern of markers and symptoms. No names, no exact dates, no location below country.' },
      { text: 'The doctor can ask to talk to the doctor treating that patient, to compare cause and treatment.' },
    ],
    callout: { number: '4.7 years', text: 'average wait for a rare-disease diagnosis in Europe, longer the more doctors are involved.', source: 'EURORDIS · S3' },
    side: { kind: 'matches', pattern: { title: "Maria's pattern", sub: '3 markers · 2 symptoms' }, optIn: 'Opt-in', tag: 'Mock-up', contact: 'Contact requested' },
  },
  {
    id: '8', template: 'funnel', theme: 'night', no: '08', kicker: 'Impact, what better decisions save', notes: N['8'],
    footer: '"Our estimate" means our arithmetic on sourced inputs. The share we prevent and the adoption rate are assumptions to be tested in pilots. Not a forecast.',
    headline: 'Wrong diagnoses cost 17.5% of health spending. Better first decisions are the biggest saving in healthcare.',
    big: { number: '17.5%', label: 'of health spending' },
    points: [
      '**17.5%** of health spending in a typical OECD country goes on the harm of diagnostic error, about **1.8% of GDP**. Halving it would free **8%**, about **USD 676 billion** a year across OECD countries. (OECD, 2025, S10)',
      '**25 to 30%** of medical tests are unnecessary, about **2.5%** of health spending. (OECD, 2025, S10)',
    ],
    muted: 'Hospitals and clinics pay per case or per seat; the patient is free. What that could earn, and how it compares with these savings: slide 11.',
    funnelTitle: 'Worked example, Greece · our estimate',
    steps: [
      { value: '€19.9bn', text: "Greece's health spending a year", tone: 'deep' },
      { value: '€3.5bn a year', text: 'The cost of diagnostic error (S10 × S15)', tag: 'our estimate', tone: 'mint' },
      { value: '€4M – €75M a year', text: 'Our first slice, tests only: about €4M (conservative) to about €75M (upside), depending on how many patients bring their record.', tag: 'our estimate · upside', tone: 'coral' },
    ],
  },
  {
    id: '9', template: 'compare', theme: 'air', no: '09', kicker: 'Competition', notes: N['9'],
    headline: 'Others hold one provider\'s chapter, or answer the patient. We give the doctor the whole book, and the patient keeps it.',
    map: {
      top: 'Every provider, every border, old paper',
      boxes: [
        { name: 'Pathien', sub: 'AI talks to: doctor', x: 360, y: 70, w: 230, h: 118, hero: true },
        { name: 'National apps', sub: 'Public lab results, one country', x: 45, y: 251, w: 284, h: 87 },
        { name: 'ChatGPT Health', sub: 'AI talks to: patient', x: 361, y: 251, w: 219, h: 87 },
        { name: 'Epic', sub: 'AI talks to: doctor', x: 45, y: 431, w: 178, h: 87 },
      ],
      axisY: 'One provider or one country',
      axisX: 'Who holds the record',
      low: 'Institution or state',
      high: 'The patient',
      note: 'Off the map, not a record: **OpenEvidence**. Answers from literature · AI talks to: doctor',
    },
    rows: [
      { name: 'Epic (MyChart, Emmie, Art)', well: 'Chart summaries inside one health system.', not: "The patient's outside history, old paper, records from abroad." },
      { name: "National apps (NHS App, India's ABDM, Abu Dhabi's Malaffi, Greece's MyHealth, which holds EOPYY lab results since Nov 2026)", well: 'Scale inside their borders; public lab results.', not: 'Private and out-of-pocket tests, imaging, old paper, records from abroad, a doctor-side summary across all of it. We work next to them, not against them.' },
      { name: 'ChatGPT Health, symptom checkers', well: 'Explains records and symptoms to the patient.', not: 'Answers go to the patient, from what the patient types in (slide 3: under 34.5% right); no doctor handshake; no source marking.' },
      { name: 'OpenEvidence (off the map: not a record)', well: 'Evidence answers for doctors.', not: "Answers from the literature, not from this patient's history." },
      { name: 'Pathien: patient-held, every provider and border', well: 'Old paper to one history; doctor-only assistant with sources; in-person handshake.', not: 'Not yet certified for decision support (slide 13).', hero: true },
    ],
  },
  {
    id: '10', template: 'table', theme: 'air', no: '10', kicker: 'Business model, who pays', notes: N['10'],
    footer: 'Models are hypotheses for pilots to test. Prices and volumes on slide 11 are assumptions.',
    headline: 'The patient never pays. Hospitals pay for a better first decision and fewer repeated tests.',
    cols: '170px 520px 600px 1fr',
    head: ['When', 'Who pays', 'For what', 'Model (to test in pilots)'],
    rows: [
      { cells: ['Year 1', '**Medical-tourism hospitals and international-patient departments**', 'A consented, translated history that arrives before the patient does', '**Per-case fee**'], emphasis: 'wedge' },
      { cells: ['Year 1', '**Multi-specialty clinic chains and telehealth platforms**', 'The doctor sees the whole history at the first visit', '**Per-doctor seat**'] },
      { cells: ['Year 1', '**Rare-disease networks**', 'A pilot where possible matches matter most', '**Free pilot, grant-funded**'] },
      { cells: ['Year 1', '**Lab networks**', 'Results the patient carries, marked "Verified by source"', '**Partnership**'] },
      { cells: ['Year 2+', '**National health-data agencies**', 'A patient-held layer next to the national record', '**Tender, sandbox**'] },
    ],
  },
  {
    id: '11', template: 'chart', theme: 'air', no: '11', kicker: 'What we can earn', notes: N['11'],
    footer: 'Our estimate. Every price, customer count and volume is an assumption for the pilots to test. Not a forecast. We never earn from a diagnosis: Pathien never makes one.',
    headline: 'Hospitals pay per case and per doctor seat. The health system saves many times what they pay.',
    chartTitle: 'Revenue a year · our estimate · every input an assumption',
    series: [
      { key: 'A', label: 'Per case' },
      { key: 'B', label: 'Per seat' },
      { key: 'C', label: 'Labs' },
    ],
    // values in € thousands, one per series (A, B, C)
    groups: [
      { label: 'Year 1', bars: [{ label: 'conservative', total: '€26k', values: [20, 6, 0] }, { label: 'upside', total: '€258k', values: [240, 18, 0] }] },
      { label: 'Year 2', bars: [{ label: 'conservative', total: '€180k', values: [120, 60, 0] }, { label: 'upside', total: '€1,705k', values: [1440, 240, 25] }] },
      { label: 'Year 3', bars: [{ label: 'conservative', total: '€560k', values: [320, 240, 0] }, { label: 'upside', total: '€4,850k', values: [3600, 1200, 50] }] },
    ],
    callout: {
      title: 'Year 3 · our estimate',
      items: [
        { number: '€0.56M', label: 'conservative · assumption' },
        { number: '€4.85M', label: 'upside · assumption' },
      ],
      note: 'Not counted: rare-disease pilots (free, grant-funded), national agencies (tenders, year 2+), research use (later, consent-gated, never a data sale).',
    },
    strip: [
      { caption: 'Tests, Greece (slide 8 funnel)', value: '€4M to €75M a year', tag: 'our estimate' },
      { caption: 'about', value: '6 to 14%', tag: 'our estimate' },
      { caption: 'Our year-3 revenue', value: '€0.56M to €4.85M', tag: 'our estimate' },
    ],
    stripNote: 'Savings outside Greece and on diagnostic error itself are not counted, so the real ratio is smaller.',
  },
  {
    id: '12', template: 'steps', variant: 'path', theme: 'mist', no: '12', kicker: 'Go-to-market', notes: N['12'],
    headline: 'Start where the history is thickest and the buyer already asks for it.',
    steps: [
      { title: 'This weekend · Athens LifeTech Park', text: "First clinicians' feedback, one orthopaedics and rheumatology pair as a clinical champion." },
      { title: 'Clinical validation · innovation gateways', text: 'Mayo Clinic Platform. Run on synthetic or de-identified data first.' },
      { title: 'First revenue · medical-tourism hubs', text: 'UAE first (Cleveland Clinic Abu Dhabi), then Bangkok and Istanbul (Bumrungrad, Acıbadem).' },
      { title: 'The network · rare-disease groups', text: 'EURORDIS and a national member, where possible matches prove themselves.' },
    ],
    // pins sit at their rough geographic position; chips sit in one row, west to east
    places: [
      { name: 'Rochester', x: 110, y: 60, cx: 110, cy: 205 },
      { name: 'Brussels', x: 520, y: 62, cx: 294, cy: 205 },
      { name: 'Athens', x: 640, y: 98, cx: 478, cy: 205 },
      { name: 'Istanbul', x: 690, y: 80, cx: 662, cy: 205 },
      { name: 'Abu Dhabi', x: 880, y: 128, cx: 846, cy: 205 },
      { name: 'Bangkok', x: 1050, y: 150, cx: 1030, cy: 205 },
    ],
    order: { label: 'Market order after the pilots', text: 'UAE and the Gulf → UK → India → US (rare disease and international-patient offices) → core EU as EHDS lands.' },
    banner: 'Named organisations are targets from public research. None has been contacted.',
  },
  {
    id: '13', template: 'steps', variant: 'ascend', theme: 'air', no: '13', kicker: 'Regulatory path', notes: N['13'],
    footer: 'Every step keeps the same rules: no diagnosis to patients, no health data on a chain.',
    headline: 'The record ships first. The assistant ships certified. A plan, not a risk.',
    steps: [
      { title: '1. The record', ships: 'Photo to history, identity match, handshake, cited search, symptom diary', applies: '**GDPR** (EU) and **HIPAA** (US): health data, explicit consent, impact assessment. Software that only stores, retrieves and shares is generally not a medical device.', badges: ['GDPR', 'HIPAA'] },
      { title: '2. The network', ships: 'Opt-in possible matches, doctor-to-doctor contact', applies: '**GDPR** explicit consent. **EHDS** gives the lawful route for research use. Our rule is stricter: opt-in only.', badges: ['GDPR', 'EHDS'] },
      { title: '3. Decision support', ships: '"Possibilities for the doctor to evaluate"', applies: '**EU MDR**: medical-device software, certified with a notified body. **EU AI Act**: high-risk obligations follow. **US FDA**: clinical decision-support guidance.', badges: ['MDR', 'AI Act', 'FDA'], seal: 'Certification' },
    ],
  },
  {
    id: '14', template: 'teamask', theme: 'air', no: '14', kicker: 'Team today, and what I ask', notes: N['14'],
    footer: 'Our plan, not a raise in progress. Nothing is raised and nobody is hired before a hospital agrees a pilot in writing. EU MDR certification is the next round.',
    headline: 'Built by one founder and AI agents. Next: €600k, released by a hospital pilot.',
    team: {
      label: 'Team today', name: 'Lefteris Georgaras', role: 'Founder, onedotatatime.design, working with AI agents', agents: 'AI agents',
      partner: { title: 'Research partner · target', text: 'A Greek university hospital and an AI research centre (targets, not yet contacted).' },
    },
    ask: { label: 'What I ask', amount: '€600k', line: 'over 18 months (our plan), in two tranches, each released by a gate below.', sub: 'It buys a real pipeline on consented records, a hospital pilot, and the first paying hospital.' },
    gates: {
      head: ['Gate, before any money', 'Tranche', 'What it buys'],
      rows: [
        { gate: 'A hospital agrees a pilot in writing', amount: '€200k', buys: 'Months 1 to 6: consent and data-protection review, the real pipeline, the pilot running' },
        { gate: 'The pilot proves three numbers: the buyer names €40 a case or more; 1,000 cases a year or more; €5 cost per case or less', amount: '€400k', buys: 'Months 7 to 18: the first paying hospital, a second hospital, the certification proposal' },
      ],
    },
    contact: { label: 'Scan or visit', link: 'healthapp-landing.pages.dev', email: 'hello@onedotatatime.design', qr: QR },
  },
  {
    id: '15', template: 'table', theme: 'air', no: '15', kicker: 'Why the money', notes: N['15'],
    footer: '* Our plan. Every cost is an assumption at Athens rates, with employer contributions. Sell = business development €86.7k + marketing €45.7k + pilots and go-to-market €36.0k. Research partner: months 4 to 15.',
    headline: 'Why €600k: four people, a research partner, and 28% for selling.',
    intro: 'Four hires and one research partner. Two build, two sell, and the partner checks the work with clinicians. Selling gets 28% of the money: business development, marketing, pilots and travel. Nobody is hired before a hospital signs.',
    cols: '580px 760px 1fr',
    head: ['Who', 'Why', 'Cost a month*'],
    accentCol: 2,
    rows: [
      { cells: ['**Engineer**', 'Builds the real pipeline: scan, store, keep the originals, with consent', '€5.3k'] },
      { cells: ['**ML engineer**', 'Makes the reading accurate (target: 98%) and cheap (target: €5 a case); cited answers for doctors', '€5.8k'] },
      { cells: ['**Business development**', 'Turns one pilot into the first paying hospital', '€5.1k'] },
      { cells: ['**Marketing**', 'Brings patients in through the hospital; part-time first', '€1.8k, then €3.7k'] },
      { cells: ['**Research partner (target, not contacted)**', 'Clinical validation and an ethics-approved test set', '€2.9k'] },
    ],
    bar: {
      title: 'Where the €600k goes · our plan',
      parts: [
        { pct: 28, value: '28% · €168k', label: 'Sell: marketing and sales', tone: 'deep' },
        { pct: 38, value: '38% · €226k', label: 'Build: product and AI', tone: 'soft' },
        { pct: 20, value: '20% · €120k', label: 'Prove: clinical, regulatory, legal', tone: 'quiet' },
        { pct: 14, value: '14% · €86k', label: 'Buffer', tone: 'outline' },
      ],
    },
  },
  {
    id: '16', template: 'appendix', theme: 'air', backup: true, no: 'Appendix A', kicker: 'Market sizing · Backup slide', notes: N['A'],
    footer: 'The seat price is an assumption to be tested in pilots. A ceiling, not a forecast.',
    headline: 'Every doctor who sees a new patient is a seat: about $1.9B a year in the US, EU and India, on our assumptions.',
    tam: { label: 'TAM', value: 'about $8.5B', tag: 'assumption · a ceiling' },
    sam: { label: 'SAM', value: 'about $1.9B', tag: 'assumption' },
    head: ['', 'Doctors', 'At an assumed price', 'Per year'],
    rows: [
      { cells: ['United States', '**905,452** direct-care physicians (AAMC 2025, S6, verified)', '$600 per seat (assumption)', '$543M'] },
      { cells: ['European Union', 'about 1.98M practising physicians (Eurostat 2023, S7, secondary)', '$600 per seat (assumption)', '$1,188M'] },
      { cells: ['India', '1,386,157 registered doctors (NMC via Parliament, S7, secondary)', '$120 per seat (assumption)', '$166M'] },
      { cells: ['SAM', '', '', 'about $1.9B'], total: true },
    ],
    lines: [
      '**TAM about $8.5B a year:** about 14.1M doctors worldwide at $600. (Derived from a secondary density figure, S7; a ceiling, not a forecast.)',
      "**SOM retired in v3.** The old line (about $19M a year by year 3, 1% of SAM seats, about 42,700 paying doctors, assumption) is replaced by slide 11's bottom-up line: **€0.56M to €4.85M in year 3** (our estimate), with 400 to 2,000 paying seats plus 8,000 to 45,000 paid cases. One revenue story: slide 11. This slide only says how big the ceiling is.",
    ],
  },
];
