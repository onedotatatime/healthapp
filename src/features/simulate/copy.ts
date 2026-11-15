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
  machineStarting: 'Starting a boxd machine now to make the 5,000 synthetic records.',
  liveLabel: (when: string) => `Live run on a boxd machine, started ${when}. Not a replay. Synthetic data.`,
  /** Shown above `machineLabel` when the recorded run is played because the live one did not happen. One per reason. */
  fallback: {
    off: 'Live runs are switched off right now. Showing the recorded run instead.',
    busy: 'Another live run is in progress. Showing the recorded run instead.',
    cap: "Today's limit of live runs is reached. Showing the recorded run instead.",
    timeout: 'The live run did not finish in 20 seconds. Showing the recorded run instead.',
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
