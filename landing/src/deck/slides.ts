// The pitch deck: the whole content of the presentation, as typed data.
// Source of the words: docs/deck/deck-content.md (v4.3, 15 Nov 2026). Speaker notes are in ./notes.ts, copied from the same file.
// Main slides 1 to 14 (plus 5b, 6b, 6c) show the main numbers only; every detail is on the appendix slides A1 to A9 (./appendix.ts, and A7 below),
// reached from each main slide's "Details → A_" link. An estimate carries a small "*" on its number and one small footnote line (`note`).
// Templates live in ./templates; to make another deck, copy this file and change the data (see README.md).
import type { Slide } from './types';
import { N } from './notes';
import { detailSlides } from './appendix';

const QR = '/deck-qr.svg';
const A7_NOTES = [
  'Appendix slide. Shown when asked, or when a main slide\'s "Details" link is clicked. Not in the 3-minute script. The "Back" link returns to the main slide.',
  'Speaker notes (about 30 s): "We size the paying side only: doctors. The US alone has about 905,000 physicians in direct care. At an assumed fifty euros a seat a month, which sits under paid AI scribes and above the free tools, the US, the EU and India are about a 1.9 billion euro a year market. That is the ceiling, not our plan. Our plan is on slide 10: two thousand seats at most by year three, plus per-case fees. These are our assumptions, and the pilots exist to test the price."',
];

const mainSlides: Slide[] = [
  {
    id: '1', template: 'cover', theme: 'air', notes: N['1'],
    eyebrow: 'Gen AI Summit Hackathon · Biotech & AI · Athens LifeTech Park',
    headline: 'Your medical history,\nin one place.',
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
          { pre: 'Up to', number: '15%', text: 'of diagnoses are **inaccurate, delayed or wrong.**', source: 'OECD, S10' },
          { number: '795,000', text: 'people a year in the US **die or are disabled** by a missed dangerous disease.', source: 'BMJ Qual Saf, S11' },
        ],
      },
      {
        label: "The patient's side", tone: 'light',
        cards: [
          { number: '51%', text: 'of Greeks look up their health online. Symptom checkers are right first only **34%** of the time.', source: 'Eurostat, S12 · BMJ, S13' },
        ],
      },
    ],
    links: [{ to: 'A1', label: 'Sources and more numbers → A1' }],
  },
  {
    id: '3', template: 'statement', theme: 'air', no: '03', kicker: 'Why now', notes: N['3'],
    headline: "AI knows the medicine. It lacks the patient's history.",
    pointStyle: 'plain',
    points: [
      { text: "**AI alone:** right condition **94.9%** of the time. In people's hands: under **34.5%**.", source: 'Nature Medicine, 2026 · S14' },
      { text: 'Greek press reports that since November 2026, Greece caps repeat tests. Doctors need the earlier result.', source: 'Greek press · S16' },
      { text: "Since 2025, Europe's EHDS lets patients add to and control their own record.", source: 'S4' },
    ],
    side: {
      kind: 'compare',
      title: 'What was missing',
      bars: [
        { label: 'AI alone', value: '94.9%', tone: 'deep' },
        { label: "In people's hands", value: '< 34.5%', tone: 'mint', gap: 'the missing history' },
      ],
    },
    links: [{ to: 'A1', label: 'Details → A1' }],
  },
  {
    id: '4', template: 'product', theme: 'air', no: '04', kicker: 'Product', notes: N['4'],
    headline: 'Every exam in one history. Every answer shows its source.',
    steps: [
      { n: 1, title: 'Photograph', icon: 'photo', text: 'Photograph an exam. Pathien reads every value, unit and range.' },
      { n: 2, title: 'Match', icon: 'match', text: "Name and ID must match the account. Anyone else's exam is refused." },
      { n: 3, title: 'Timeline', icon: 'timeline', text: 'Exams and logged symptoms in date order, in one timeline.' },
      { n: 4, title: 'Handshake', icon: 'helix', text: "The doctor scans the patient's DNA-shaped code. The patient gives the doctor permission, for a set time." },
      { n: 5, title: 'Ask', icon: 'ask', text: 'The doctor asks. Each answer links to the exam it came from.' },
    ],
    links: [{ to: 'A2', label: 'Details, and what the demo runs for real → A2' }],
  },
  {
    id: '5', template: 'statement', theme: 'mist', no: '05', kicker: 'Privacy by design', notes: N['5'],
    headline: 'The patient holds the key. The log holds only fingerprints.',
    pointStyle: 'bar',
    points: [
      { text: "Records are encrypted. The key is on the patient's phone, by design." },
      { text: 'A doctor gets in only in person, with a yes, for a set time.' },
      { text: 'Every access goes into a signed log the patient can read.' },
    ],
    side: { kind: 'phone', caption: "Key on the patient's phone" },
    links: [{ to: 'A2', label: 'Details → A2' }],
  },
  {
    id: '5b', counter: '5b', template: 'hero', theme: 'air', notes: N['5b'],
    headline: 'Pathien Vault. The whole record, on a device the patient owns.',
    body: 'For privacy-first patients: a small device holds the full record, encrypted by our own software, not in the cloud.',
    stepsTitle: "How it's used",
    steps: [
      'The patient is abroad or at a hospital, possibly in a serious condition.',
      'The doctor scans the code on the Vault.',
      'The code opens the Pathien doctor page.',
      'A Pathien support person calls the hospital to verify the situation, then gives the doctor access for a set time.',
    ],
    image: { src: '/deck/vault-hero.jpg', alt: 'A slim teal-night aluminium device, a rounded pebble with a tone-on-tone Pathien mark and one small coral light, on a pale surface' },
    lockupSuffix: 'Vault',
    links: [{ to: 'A2', label: 'Details → A2' }],
  },
  {
    id: '6', template: 'statement', theme: 'air', no: '06', kicker: 'Possible matches', notes: N['6'],
    headline: 'A rare pattern becomes findable, only when the patient says yes.',
    pointStyle: 'bar',
    points: [
      { text: 'Opt-in, unnamed, and the patient can withdraw at any time.' },
      { text: 'The doctor sees similar unnamed cases and can ask to talk to their doctor.' },
    ],
    callout: { number: '4.7 years', text: 'the average wait for a rare-disease diagnosis in Europe.', source: 'EURORDIS · S3' },
    side: { kind: 'matches', pattern: { title: "Maria's pattern", sub: '3 markers · 2 symptoms' }, optIn: 'Opt-in', contact: 'Contact requested' },
    links: [{ to: 'A2', label: 'Details → A2' }],
  },
  {
    id: '6b', counter: '6b', template: 'twocol', theme: 'air', kicker: 'Clinical trials', notes: N['6b'],
    headline: 'The right patients for trials, heard between visits. Only with their yes.',
    columns: [
      {
        title: 'Patient selection and recruitment',
        points: [
          "With consent, we pre-screen the record against the trial's criteria.",
          'The site confirms the match. The patient chooses.',
        ],
      },
      {
        title: 'Patient experience',
        points: [
          "A symptom diary in the patient's own words.",
          'Values over time, shared with the trial team with consent.',
        ],
      },
    ],
    pointer: 'What it saves a sponsor, and what we charge: next slide.',
    footer: 'Consent only. A pre-screen, never a diagnosis. Never a data sale.',
    links: [{ to: 'A3', label: 'Details → A3' }],
  },
  {
    id: '6c', counter: '6c', template: 'threecards', theme: 'air', kicker: 'Clinical trials', notes: N['6c'],
    headline: 'Recruitment is slow and costly. We make it faster. The sponsor pays per trial and per randomised patient.',
    cards: [
      { title: 'Today, what a day of delay costs', figure: { value: '€36,000', mark: '*', unit: 'What one day of delay costs one trial to run.' } },
      { title: 'With Pathien, what one trial saves', figure: { value: '€180,000', mark: '*', unit: 'Saved per trial if enrolment ends 5 days sooner: 5 × €36,000.' } },
      { title: 'How we charge, and what the sponsor keeps', accent: true, figure: { value: '€24,000', mark: '*', unit: 'Our fee per trial, about 13% of that saving. The sponsor keeps €156,000.' } },
    ],
    note: '* Our estimate for one trial in one country, in euros at $1.10 to €1. Days saved and prices are assumptions. Not a result.',
    links: [{ to: 'A3', label: 'Details → A3' }],
  },
  {
    id: '7', template: 'funnel', theme: 'night', no: '07', kicker: 'Impact, what better decisions save', notes: N['7'],
    headline: 'Diagnostic error costs 17.5% of health spending. Better first decisions are the biggest saving in healthcare.',
    big: { number: '17.5%', label: 'of health spending' },
    points: ['goes on the harm of diagnostic error. (OECD, S10)'],
    funnelTitle: 'Greece, a year',
    steps: [
      { value: '€19.9bn', text: "Greece's health spending a year", tone: 'deep' },
      { value: '€3.5bn*', text: 'a year: what diagnostic error costs Greece.', tone: 'mint' },
      { value: '€4M to €30M*', text: 'a year: our first slice, repeated and unnecessary tests in Greece.', tone: 'coral' },
    ],
    note: '* Our estimate on sourced inputs; the share we prevent and adoption are assumptions. Not a forecast.',
    links: [{ to: 'A4', label: 'Details → A4' }],
  },
  {
    id: '8', template: 'compare', theme: 'air', no: '08', kicker: 'Competition', notes: N['8'],
    headline: "Others hold one provider's chapter, or answer the patient. We give the doctor the whole book, and the patient keeps it.",
    map: {
      top: 'Every provider, every border, old paper',
      boxes: [
        { name: 'Pathien', sub: "the patient's whole history, for the doctor, with sources", x: 600, y: 74, w: 440, h: 150, hero: true },
        { name: 'National apps', sub: "one country's public record", x: 40, y: 250, w: 470, h: 104 },
        { name: 'ChatGPT Health, symptom checkers', sub: 'answer the patient', x: 580, y: 270, w: 460, h: 130 },
        { name: 'Epic', sub: "one health system's chart", x: 40, y: 400, w: 470, h: 104 },
      ],
      axisY: 'One provider or one country',
      axisX: 'Who holds the record',
      low: 'Institution or state',
      high: 'The patient',
    },
    rows: [
      { name: 'Off the map, not a record: OpenEvidence', line: 'answers doctors from the literature, not this patient.' },
    ],
    links: [{ to: 'A5', label: 'Details → A5' }],
  },
  {
    id: '9', template: 'table', theme: 'air', roomy: true, no: '09', kicker: 'Business model, who pays', notes: N['9'],
    headline: 'Hospitals, health systems and private clinics pay.',
    cols: '470px 760px 1fr',
    head: ['Who pays', 'Who they are', 'How they pay'],
    rows: [
      { cells: ['**Hospitals**', 'Public and private, including international-patient departments', 'Per case or per doctor seat'], emphasis: 'wedge' },
      { cells: ['**Governments and national health systems**', 'Ministries, national health services and health-data agencies', 'Licence, tender or sandbox'] },
      { cells: ['**Private clinics**', 'Clinic chains, diagnostic centres, telehealth', 'Per doctor seat'] },
    ],
    after: 'Also: clinical-trial sponsors pay per randomised patient (slide 6c).',
    links: [{ to: 'A6', label: 'Details → A6' }, { to: 'A7', label: 'Market size → A7' }],
  },
  {
    id: '10', template: 'chart', theme: 'air', no: '10', kicker: 'What we can earn', notes: N['10'],
    headline: 'Hospitals and clinics pay per case and per seat. Year 3: €0.56M to €4.85M*.',
    chartTitle: 'Our revenue a year, conservative and upside*',
    series: [{ key: '', label: 'Revenue' }],
    // values in € thousands, one per series; only the year totals are shown as labels (the stack by revenue line is on A6)
    groups: [
      { label: 'Year 1', bars: [{ label: 'conservative', total: '€26k', values: [26] }, { label: 'upside', total: '€258k', values: [258] }] },
      { label: 'Year 2', bars: [{ label: 'conservative', total: '€180k', values: [180] }, { label: 'upside', total: '€1.7M', values: [1705] }] },
      { label: 'Year 3', bars: [{ label: 'conservative', total: '€0.56M', values: [560] }, { label: 'upside', total: '€4.85M', values: [4850] }] },
    ],
    callout: {
      title: 'Our revenue in year 3, conservative to upside',
      items: [
        { number: '€0.56M*', label: 'conservative' },
        { number: '€4.85M*', label: 'upside' },
      ],
    },
    strip: { value: 'About 12 hospitals*', text: 'at €40k a year each cover our running costs.' },
    note: '* Our estimate. Every price, customer count and volume is an assumption for the pilots to test. Not a forecast.',
    links: [{ to: 'A6', label: 'Details → A6' }, { to: 'A7', label: 'Market size → A7' }],
  },
  {
    id: '11', template: 'steps', variant: 'path', theme: 'mist', no: '11', kicker: 'Go-to-market', notes: N['11'],
    headline: 'Start where the history is thickest and the buyer already asks for it.',
    steps: [
      { title: 'This weekend · Athens LifeTech Park', text: 'A clinical champion pair.' },
      { title: 'Clinical validation · Mayo Clinic Platform', text: 'On synthetic or de-identified data.' },
      { title: 'First revenue · international-patient hospitals', text: 'UAE first.' },
      { title: 'The network · rare-disease groups', text: 'Where possible matches prove themselves.' },
    ],
    // pins sit at their rough geographic position; chips sit in one row, west to east
    places: [
      { name: 'Rochester', x: 250, y: 80, cx: 230, cy: 205 },
      { name: 'Brussels', x: 820, y: 52, cx: 650, cy: 205 },
      { name: 'Athens', x: 930, y: 112, cx: 1070, cy: 205 },
      { name: 'Abu Dhabi', x: 1260, y: 146, cx: 1490, cy: 205 },
    ],
    banner: 'Named organisations are targets. None has been contacted.',
    links: [{ to: 'A8', label: 'Details → A8' }],
  },
  {
    id: '12', template: 'steps', variant: 'ascend', theme: 'air', no: '12', kicker: 'Regulatory path', notes: N['12'],
    footer: 'Every step keeps the same rules: no diagnosis to patients, no health data on a chain.',
    headline: 'The record ships first. The assistant ships certified. A plan, not a risk.',
    steps: [
      { title: '1. The record', ships: 'Stores, finds and shares the history', badges: ['GDPR', 'HIPAA'] },
      { title: '2. The network', ships: 'Opt-in possible matches', badges: ['GDPR', 'EHDS'] },
      { title: '3. Decision support', ships: 'Possibilities for the doctor to evaluate', badges: ['EU MDR', 'AI Act', 'FDA'], seal: 'Certification' },
    ],
    links: [{ to: 'A8', label: 'Details → A8' }],
  },
  {
    id: '13', template: 'teamask', theme: 'air', no: '13', kicker: 'Team today, and what I ask', notes: N['13'],
    headline: 'One founder and AI agents built this. Next: €1M*, released by a hospital pilot.',
    team: {
      label: 'Team today', name: 'Lefteris Georgaras', role: 'Founder, onedotatatime.design, with AI agents', agents: 'AI agents',
      partner: { title: 'Research partner · target', text: 'A university hospital and an AI research centre (targets, not contacted).' },
    },
    ask: { label: 'What I ask', amount: '€1M', mark: '*', line: 'over 24 months, committed at signing, released in two gated tranches' },
    gates: {
      head: ['Gate', 'Tranche'],
      rows: [
        { gate: 'A hospital signs a pilot', amount: '€400k' },
        { gate: 'The hospital commits to 1,000+ paid cases a year at €40+; a case costs us €5 or less', amount: '€600k' },
      ],
    },
    note: '* Our plan, not a raise in progress; costs are assumptions. Nobody is hired before a hospital signs a pilot. Certification is the next round.',
    links: [{ to: 'A9', label: 'Details → A9' }],
  },
  {
    id: '14', template: 'spend', theme: 'air', no: '14', kicker: 'Why the money', notes: N['14'],
    headline: 'Why €1M: six people, 30% to sell, break-even at month 31*.',
    line: '6 people: 3 build, 2 sell, 1 clinical and regulatory lead.',
    parts: [
      { pct: 30, value: '€297k · 30%', label: 'Sell', accent: true },
      { pct: 36, value: '€361k · 36%', label: 'Build' },
      { pct: 24, value: '€245k · 24%', label: 'Prove' },
      { pct: 10, value: '€97k · 10%', label: 'Buffer' },
    ],
    contact: { label: 'Scan or visit', link: 'healthapp-landing.pages.dev', email: 'hello@onedotatatime.design', qr: QR },
    note: '* Our plan; costs are assumptions. Break-even: when gross profit covers running costs, on our conservative revenue line (slide 10).',
    links: [{ to: 'A9', label: 'Details → A9' }],
  },
];

// A7 keeps its own layout (nested circles and a table); the other appendix slides use the generic `detail` page.
const a7: Slide = {
  id: 'A7', counter: 'A7', template: 'appendix', theme: 'air', no: 'Appendix A7', kicker: 'Market sizing', notes: A7_NOTES,
  back: [{ to: '9', label: 'Back to slide 9' }, { to: '10', label: 'Back to slide 10' }],
  footer: 'The seat price is an assumption to be tested in pilots. A ceiling, not a forecast.',
  headline: 'Every doctor who sees a new patient is a seat: about €1.9bn a year in the US, EU and India, on our assumptions.',
  tam: { label: 'TAM', value: 'about €8.5bn', tag: 'assumption · a ceiling' },
  sam: { label: 'SAM', value: 'about €1.9bn', tag: 'assumption' },
  head: ['', 'Doctors', 'At an assumed price', 'Per year'],
  rows: [
    { cells: ['United States', '**905,452** direct-care physicians (AAMC 2025, S6, verified)', '€600 per seat (assumption)', '€543M'] },
    { cells: ['European Union', 'about 1.98M practising physicians (Eurostat 2023, S7, secondary)', '€600 per seat (assumption)', '€1,188M'] },
    { cells: ['India', '1,386,157 registered doctors (NMC via Parliament, S7, secondary)', '€120 per seat (assumption)', '€166M'] },
    { cells: ['SAM', '', '', 'about €1.9bn'], total: true },
  ],
  lines: [
    '**TAM about €8.5bn a year:** about 14.1M doctors worldwide at €600. (Derived from a secondary density figure, S7; a ceiling, not a forecast.)',
    "**The per-case line is not sized here.** This ceiling counts doctor seats only; slide 10's per-case line (hospitals, €40 to €80 a case) has no market size on this slide.",
    "**SOM retired in v3.** The old line (about $19M a year by year 3, 1% of SAM seats, about 42,700 paying doctors, assumption) is replaced by slide 10's bottom-up line: **€0.56M to €4.85M in year 3** (our estimate), with 400 to 2,000 paying seats plus 8,000 to 45,000 paid cases. One revenue story: slide 10. This slide only says how big the ceiling is.",
    '**Sources:** S6 (verified), S7 (secondary; derived and assumption labels per the market-and-competitors research, §1.2).',
  ],
};

// Appendix order: A1 ... A9. The split ones (A2, A3, A6, A9) are consecutive; A7 sits between A6c and A8.
const byId = (id: string) => {
  const s = detailSlides.find((d) => d.id === id);
  if (!s) throw new Error(`appendix slide ${id} missing`);
  return s;
};
const appendix: Slide[] = [
  ...['A1', 'A2', 'A2b', 'A2c', 'A3', 'A3b', 'A4', 'A5', 'A6', 'A6b', 'A6c'].map(byId),
  a7,
  ...['A8', 'A9', 'A9b', 'A9c'].map(byId),
];

export const slides: Slide[] = [...mainSlides, ...appendix];
