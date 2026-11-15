/**
 * Every on-screen string of /doctor/simulate (MIN-4594). English only (a prototype for one event).
 * Four labels are fixed word for word by the CTO (MIN-4504, 2026-11-14); the rest follow src/features/matches/copy.ts:
 * never "anonymous", always "without name or ID", no claim about the real product beyond the fixed labels.
 */
export const COPY = {
  // Fixed by the CTO: always visible / per step
  pageLabel: 'Seeded synthetic data. Not real patients.',
  machineLabel: (when: string) => `Recorded run on a boxd machine, ${when}. Replayed here, not live.`,
  machineFallback: 'Generated with the same script and seed on a development machine.',
  matchingLabel: 'The matching runs now, in this browser, on the 5,000 synthetic records.',
  contactLabel: "Simulated. Planned flow: both patients agree first, then their doctors are introduced. Every request goes into both patients' access logs.",

  title: 'Simulate matching on 5,000 records',
  intro:
    'The demo patient is synthetic and has a rare pattern: ACE high, cough, dry eyes, hilar lymphadenopathy on imaging, seen by pulmonology. Run the search to see which of 5,000 seeded records share it.',
  run: 'Run the simulation',
  runAgain: 'Run again',

  machineTitle: 'The machine',
  machineBody: 'One short-lived machine makes the 5,000 test records, then goes away.',
  machineWaiting: 'Replaying the recorded run',
  // MIN-4675, words by Anna on MIN-4672. "live" appears only in strings about the live run; "recorded" and "replayed" only in the replay ones.
  machineStarting: 'Asking for a live run on a boxd machine to make the 5,000 synthetic records.',
  liveLabel: (when: string) => `Live run on a boxd machine, started ${when}. Not a replay. Synthetic data.`,
  /** Shown above `machineLabel` when the recorded run is played because the live one did not happen. One per reason. */
  fallback: {
    off: 'Live runs are switched off right now. Showing the recorded run instead.',
    busy: 'Another live run is in progress. Showing the recorded run instead.',
    cap: 'The 24-hour limit of live runs is reached. Showing the recorded run instead.',
    timeout: 'The live run did not finish in time. Showing the recorded run instead.',
    error: 'The live run failed. Showing the recorded run instead.',
  },
  /** The log line of each live state: what the machine does at that step, the same words the recorded run logged. */
  liveLog: { created: 'machine ready', running: 'generate.py --n 5000, build_run.py', done: 'run-5000.json written', deleted: 'machine deleted' },
  machineStates: { created: 'Created', running: 'Running', done: 'Done', deleted: 'Deleted' },

  recordsTitle: 'The 5,000 records',
  recordsBody: 'One dot each. Country and age band only, no names.',
  groupNote: 'Group names show how the generator was seeded. They are not diagnoses.',
  canvasLabel: (stage: string) => `5,000 synthetic records, one dot each. ${stage}`,
  canvasStage: {
    all: 'All records shown.',
    opted: 'Records that did not opt in are faded.',
    share: 'Only records that share at least 4 codes with the demo patient stay bright.',
    exact: 'Only records with exactly the same set of shared codes stay bright.',
    shown: 'The matched records are ringed and numbered.',
  },

  matchingTitle: 'The matching',
  matchingBody: 'Only coded features are compared. Names and dates never are.',
  stepFeatures: 'Coded features of the demo patient',
  stepOptIn: 'Opt-in check',
  stepShared: 'At least 4 shared codes',
  stepExact: 'Exact-set groups',
  stepK: 'k = 5',
  optedIn: (n: string, of: string) => `${n} of ${of} records opted in. Records that did not opt in are never compared.`,
  shared: (n: number, codes: number) => `${n} records share 4 or more of the patient's ${codes} codes.`,
  exact: (n: number) => `${n} share exactly the same set of codes (the largest group).`,
  kShown: (n: number) => `${n} is 5 or more, so the group may be shown.`,
  kHidden: (n: number) => `${n} is below 5, so nothing is shown.`,

  matchesTitle: 'The matches',
  empty: 'No matches in the seeded data.', // the one empty answer
  matchLine: (n: number) => `${n} seeded synthetic records share this pattern.`,
  patternLabel: 'Shared pattern',
  countriesLabel: 'Countries',
  seededLine: (s: number) => `The generator seeded this rare pattern in ${s} of 5,000 records.`,
  cardTitle: (n: number) => `Match ${n}`,
  cardCountry: 'Country',
  cardBefore: 'Shown so far: the shared pattern and the country.',
  ask: 'Ask for an introduction',

  contactTitle: 'Contact',
  contactNote: 'Nothing is saved or sent from this page.',
  contactSteps: ['Request sent, without name or ID', 'Both patients asked', 'Both patients agreed', 'Unlocked'],
  examsTitle: 'Dummy exams',
  colMarker: 'Marker',
  colValue: 'Value',
  colRange: 'Range',
  colMonth: 'Month',
  high: 'high',
  low: 'low',
  positive: 'positive',
  negative: 'negative',
  imaging: 'Imaging',
  symptoms: 'Symptoms',
  specialties: 'Specialties',
  country: 'Country',
  ageBand: 'Age band',
  none: 'none',
  otherDoctor: (spec: string, country: string) => `The other treating doctor: ${spec}, ${country}. No name.`,
  sent: 'Message sent (simulated)',
  logDemo: 'Simulated entry in the demo patient\'s access log: introduction requested.',
  logMatch: (n: number, country: string) => `Simulated entry in the access log of match ${n} (${country}): introduction requested.`,

  growthLink: 'See how matches grow with the network',
  home: 'Simulate matching on 5,000 records',
} as const;

/**
 * The recruitment search (MIN-4706). Words by Anna Lytica on MIN-4709, pasted as written; the CTO's two labels
 * (`understandsLabel`, `sourceLabelDev`, `sourceLabelBoxd`) are fixed word for word and must not be edited.
 * No number is typed into a string: every `n`, `found`, `asked`, `total`, `k` is passed in from the search.
 */
export const RECRUIT_COPY = {
  // 1. Section and box
  title: 'Recruit for a trial',
  intro: 'Write what you need in one sentence. The page counts the records that fit your condition and shows how the list narrows. Nobody is contacted.',
  inputLabel: 'Your sentence',
  placeholder: 'I want to recruit 40 people matching rheumatoid arthritis for a trial',
  button: 'Search the records',

  // Fixed by the CTO, word for word (MIN-4706). Always visible under the box.
  understandsLabel: 'Understands a number and one condition from a fixed list of 13. No AI reads this sentence.',
  // `made.where` from the file picks the variant. Dev machine:
  sourceLabelDev: '50,000 seeded synthetic records, made ahead of time with the same generator and seed. The search runs now, in this browser.',
  // boxd block:
  sourceLabelBoxd: '50,000 seeded synthetic records, made ahead of time on a boxd machine with the same generator and seed. The search runs now, in this browser.',
  groupNote: 'Condition names show how the generator was seeded. They are not diagnoses.', // same meaning as today's groupNote

  // 8. Loading (decision: from a file, MIN-4706)
  loading: 'Loading the seeded synthetic records.',

  // 3. What the page read
  read: (n: string, name: string) => `Read from your sentence: ${n} records, ${name}.`,
  readNoNumber: (name: string) => `Read from your sentence: no number, ${name}.`,
  noNumberNote: 'No number was read, so every record that fits is shown. A zero counts as no number.',

  // 4. Result: found against asked
  resultEqual: (asked: string, found: string) => `Asked ${asked}. Found ${found}.`,
  resultShort: (found: string, asked: string) => `Found ${found} of the ${asked} asked. No other record fits these criteria.`,
  resultMore: (extra: string) => `${extra} more records fit these criteria and were not selected.`, // shown under resultEqual when eligible > asked
  resultNoNumber: (found: string) => `Found ${found} records that fit these criteria.`,
  compared: (must: string, some: string, min: string) =>
    some ? `Compared: every one of ${must}, and at least ${min} of ${some}.` : `Compared: every one of ${must}.`,
  comparedOnlyMust: (must: string) => `Compared: ${must}.`, // use when `some` is empty
  countries: (list: string) => `Countries of the selected records: ${list}.`,

  // 5. Funnel: label, then one line
  funnel: {
    records: { label: 'Records', line: 'All the seeded synthetic records the search looked at.' },
    optedIn: { label: 'Opted in to matching', line: 'Records that did not opt in are never compared. Opting in to matching is not agreeing to a trial.' },
    eligible: { label: 'Fit the criteria', line: 'Opted in, and matching every criterion in the Compared line.' },
    selected: { label: 'Selected', line: 'The first of these records, up to the number asked.' },
  },

  // 6. Edge cases, one sentence each
  fewerThanK: (k: string) => `Fewer than ${k} records fit these criteria, so nothing is shown.`, // covers 0 to 4
  unknownCondition: 'That condition is not in this search. Pick one of the conditions it knows:',
  emptyBox: 'The box is empty. Write a number and a condition, for example the sentence shown.',
  tooMany: (total: string) => `That number is more than the ${total} records in this search. Ask for ${total} or fewer.`,
  twoConditions: (used: string) => `Your sentence names two conditions. This search reads one, so it used ${used}. Search again for the other.`,

  // 7. Simulated invite
  simulatedNote: 'Simulated. Nobody is contacted. Nothing is saved or sent from this page.',
} as const;

/** The 13 conditions: name on screen (a seeded pattern, not a diagnosis). Spellings to type live in the file's synonyms. */
export const RECRUIT_CONDITION_NAMES = {
  inflammatory_back_pain: 'Inflammatory back pain pattern',
  rheumatoid_arthritis: 'Rheumatoid arthritis pattern',
  hypothyroid: 'Underactive thyroid pattern',
  type2_diabetes_metabolic: 'Type 2 diabetes pattern',
  iron_deficiency: 'Iron deficiency anaemia pattern',
  lupus_like: 'Lupus-like pattern',
  gout: 'Gout pattern',
  hyperthyroid: 'Overactive thyroid pattern',
  reduced_kidney_function: 'Reduced kidney function pattern',
  low_bone_density: 'Low bone density pattern',
  rare_sarcoid_like: 'Sarcoid-like pattern',
  rare_copper_metabolism: 'Copper metabolism pattern',
  rare_myopathy: 'Myopathy pattern',
} as const;

/** Ren, not Anna: a button on the unknown-condition sentence fills the box with Anna's placeholder, its two slots filled. */
export const recruitFill = (n: number, condition: string) => `I want to recruit ${n} people matching ${condition.toLowerCase()} for a trial`;
