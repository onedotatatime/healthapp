/**
 * Every on-screen string of the matches screens (MIN-4507). English only (a prototype for one event).
 * Sources: docs/simulation-copy.md (Anna, MIN-4506, sections 3 and 4) for the panel and the simulation; PRD section 13
 * (Possible matches, consent switch) for F1. Never "anonymous"; always "without name or ID".
 */
export const COPY = {
  // F2: the doctor's panel
  panelTitle: 'Possible matches',
  panelLabel: 'Seeded synthetic data. Not real patients.', // fixed by the CTO, in the DOM in every state
  panelLoading: 'Looking for similar patterns',
  panelError: 'Could not look for matches just now.',
  panelRetry: 'Try again',
  panelEmpty: 'No matches in the seeded data.', // identical for: not opted in, no match, fewer than 5
  panelHelper: 'A match is a shared pattern in the seeded data. It is not a person and not a diagnosis.',
  matchLine: (n: number) => `${n} seeded synthetic records share this pattern.`,
  patternLabel: 'Shared pattern',
  countriesLabel: 'Countries',

  // F1: the patient's switch
  optInTitle: 'Find people with a pattern like yours',
  optInSwitch: 'Possible matches',
  optInTag: 'Opt-in, without name or ID.',
  optInBody:
    'Off until you turn it on. If you turn it on, the pattern in your record (markers, symptoms, conditions) is compared with seeded synthetic records in this demo. Your name and ID are never used or shown. You can turn this off at any time, and from then on you are no longer matched.',
  optInOn: 'On',
  optInOff: 'Off',
  optInLoading: 'Loading your choice',
  optInError: 'Your choice was not saved. It is unchanged. Try again.',
  optInReadError: 'Could not read your choice just now.',

  // The simulation screen (Anna, section 3)
  simLabel: 'Simulation on synthetic data. A model, not a measurement', // fixed by the CTO, never rewritten
  simTitle: 'What matching could change',
  simCaption:
    '30 seconds on seeded synthetic records. Watch matches grow as the network grows, and what a stated assumption would mean for wrong or missed diagnoses and what they cost.',
  // Section 6 of docs/simulation-copy.md (Anna, MIN-4604; approved by the CEO seat on MIN-4605). Every number is filled from the data file.
  simAssumption: (a: { start: string; ceiling: string }) =>
    `Assumption, not a finding: each match lowers the chance of a wrong or missed diagnosis by ${a.start}, rising to ${a.ceiling} as matches accumulate.`,
  simMatchesSoFar: 'Matches so far:',
  simEffectOfMatch: 'Assumed effect of a match:',
  simKicker: 'Modelled drop so far',
  simUnitYear: 'a year',
  simPerInhabitant: (a: { amount: string }) => `${a.amount} per inhabitant a year`,
  simOutcome: (a: { amount: string; geography: string; year: number }) =>
    `In this model, the cost of wrong or missed diagnoses is ${a.amount} a year lower for ${a.geography}, on ${a.year} spending.`,
  simFormula: (a: { drop: string; total: string; geography: string; year: number; amount: string }) =>
    `${a.drop} points of health spending × ${a.total} (${a.geography}, ${a.year}) = ${a.amount} a year`,
  simSourceLead: 'Health spending total:',
  simSourceLink: (a: { geography: string; year: number }) => `Eurostat, current health expenditure, ${a.geography}, ${a.year}`,
  simSourcesPrefix: 'Baselines:',
  simDropped: 'Series not shown: no solid source.',
  simReplay: 'Play again',
} as const;
