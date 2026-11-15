/**
 * Every on-screen string of /doctor/simulate (MIN-4594, one flow since MIN-4736). English only (a prototype for one event).
 * Three labels are fixed word for word: `pageLabel`, `machineLabel` and `machineFallback` (CTO, MIN-4504). The rest follow
 * src/features/matches/copy.ts: never "anonymous", always "without name or ID", no claim about the real product beyond the fixed labels.
 * Words for the one flow by Anna Lytica on MIN-4739. No number is typed into a string: `total`, `max`, `n`, `found`, `asked` and `k` are
 * passed in from the file or the search.
 */
export const COPY = {
  // Fixed by the CTO: always visible / in the machine step
  pageLabel: 'Seeded synthetic data. Not real patients.',
  machineLabel: (when: string) => `Recorded run on a boxd machine, ${when}. Replayed here, not live.`,
  machineFallback: 'Generated with the same script and seed on a development machine.',

  machineTitle: 'The machine',
  machineBody: (total: string) => `One short-lived machine makes the ${total} synthetic records, then goes away.`,
  machineWaiting: 'Replaying the recorded run',
  // Kept for the live cut (cut 2); the page does not show them now. "live" appears only in strings about the live run.
  liveLabel: (when: string) => `Live run on a boxd machine, started ${when}. Not a replay. Synthetic data.`,
  /** Shown above `machineLabel` when the recorded run is played because the live one did not happen. One per reason. */
  fallback: {
    off: 'Live runs are switched off right now. Showing the recorded run instead.',
    busy: 'Another live run is in progress. Showing the recorded run instead.',
    cap: 'The 24-hour limit of live runs is reached. Showing the recorded run instead.',
    timeout: 'The live run did not finish in time. Showing the recorded run instead.',
    error: 'The live run failed. Showing the recorded run instead.',
  },
  machineStates: { created: 'Created', running: 'Running', done: 'Done', deleted: 'Deleted' },

  recordsTitle: (total: string) => `The ${total} records`,
  recordsBody: 'One dot each, without name or ID. The place of a dot means nothing.',
  canvasLabel: (total: string, stage: string) => `${total} synthetic records, one dot each. ${stage}`,
  canvasStage: {
    all: 'All records shown.',
    opted: 'Records that did not opt in to matching are faded.',
    fit: 'Only records that fit the criteria stay bright.',
    selected: 'The selected records are highlighted and ringed.',
    selectedMany: (max: string) => `More than ${max} records are selected, so they are enlarged, not ringed.`,
  },

  growthLink: 'See how matches grow with the network',
  home: 'Recruit for a trial: search the synthetic records',
} as const;

/**
 * The recruitment search (MIN-4706). Words by Anna Lytica on MIN-4709 and MIN-4739, pasted as written. The founder removed the two
 * label pills under the box on 2026-11-15 ("also remove that"): `understandsLabel`, `sourceLabelDev`, `sourceLabelBoxd` are gone.
 * No number is typed into a string: every `n`, `found`, `asked`, `total`, `k` is passed in from the search.
 */
export const RECRUIT_COPY = {
  // 1. Section and box
  title: 'Recruit for a trial',
  intro: (total: string) => `Write what you need in one sentence, then search. The search looks through ${total} seeded synthetic records and narrows them to the ones that fit. Nobody is contacted.`,
  loadError: 'The synthetic records could not be loaded. Reload the page to try again.',
  inputLabel: 'Your sentence',
  placeholder: 'I want to recruit 40 people matching rheumatoid arthritis for a trial',
  button: 'Search the records',

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

  // 9. Profiles of the selected records (MIN-4756, MIN-4758). Words by Anna Lytica, pasted as written.
  profilesTitle: (n: string) => `The ${n} selected records, one by one`,
  recordLabel: (n: string) => `Record ${n}`,
  countryLabel: 'Country',
  ageBandLabel: 'Age band',
  /** Wrap any specialty code with this. It reads as a field on the record, never as a finding. */
  specialtyOn: (name: string) => `${name} (specialty on the record)`,
  showing: (a: string, n: string) => `Showing ${a} of ${n}`,
  /** k = how many the click adds: 100, or what is left when fewer remain. */
  showMore: (k: string) => `Show ${k} more`,
  /** Fixed by the CTO, word for word. Plain small text, not a bordered pill. Do not edit. */
  profilesNote: 'Shown one by one because these records are synthetic. On real records the matching answers in groups, never one record at a time.',

  // 10. What they have in common
  commonTitle: 'What they have in common',
  commonBasis: (n: string) => `Counted over the ${n} selected records.`,
  allHave: (n: string) => `All ${n} have`,
  halfHave: 'At least half have',
  xOfN: (x: string, n: string) => `${x} of ${n}`,
  /** list: "40-49: 18, 50-59: 22" built from the file's age-band strings and the counts. */
  ageBands: (list: string) => `Age bands: ${list}.`,
  commonNothingMore: 'No other coded feature is on at least half of these records.',

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
