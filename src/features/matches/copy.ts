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
  // MIN-4664 (CTO decision MIN-4660 section 2): the server answers the same for three cases, so the screen says all three and never which one.
  panelEmptyWhy: 'Shown when the patient has not turned matching on, when no pattern is shared, or when fewer than 5 records share it.',
  panelIdle: 'Compare the pattern in this record with the seeded records.',
  panelRun: 'Run the matching',
  panelRunAgain: 'Run again',
  panelEnded: 'Access to this record has ended. Nothing was compared.',
  matchTotal: (n: number, g: number) => `${n} seeded synthetic records share a pattern with this record, in ${g} ${g === 1 ? 'group' : 'groups'}.`,
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
  // Spec A12 (MIN-4680), words by Anna (MIN-4683). A dot counts as one record; where it sits and which dots turn teal are not identity.
  simFieldLabel: (a: { matched: number; visible: number }) =>
    `Match field: ${a.matched.toLocaleString('en-US')} of ${a.visible.toLocaleString('en-US')} synthetic records have a match`,
  simFieldCaption:
    'One dot, one synthetic record. Teal is a match; position says nothing about who it is.',
  // The timeline: one plot, five lines, animated (MIN-4724, spec A14). Final strings: docs/simulation-copy.md section 8.1 (Anna, MIN-4723), the keys as she lists them.
  // No number is typed here: months, counts, euros, points, the price and the geography come from the data as arguments.
  tlTitle: 'As patients join, the other numbers grow with them',
  tlCaption: (a: { first: number; last: number }) =>
    `Plan months ${a.first} to ${a.last}, on synthetic records. In this model, as patients join, the records with a match, the modelled drop in cost, the fewer wrong or missed diagnoses and our planned income grow along with them.`,
  tlTie: (a: { amount: string; geography: string }) =>
    `The ${a.amount} a year above applies this same model to all ${a.geography} health spending. This chart counts only the patients in the network, so its figures are far smaller.`,
  // The axis sentences: always on screen, never behind a tap (CEO seat condition 11). The reader compares heights only inside a unit.
  tlScale: 'Each unit has its own scale: people, euros, diagnoses. Compare heights only inside a unit. Across units, compare how the lines grow.',
  tlScaleMore: 'Patients and records with a match share one scale. Income and the modelled drop share another. Diagnoses have their own. Every scale starts at zero.',
  tlScaleTop: 'Top: the largest value in the unit',
  tlScaleBase: '0',
  tlMonth: (a: { n: number; last: number }) => `Month ${a.n} of ${a.last}`,
  tlReplay: 'Replay',
  tlReplayAria: (a: { first: number }) => `Replay the chart from month ${a.first}`,
  tlXAxis: 'Plan month',
  tlBand: 'Free pilot: no patients counted',
  tlFirstPaid: 'First paid cases',
  // The short label at a line's head (and in the phone readout), then the full name (the values table), the unit and the kind.
  tlHead: { patients: 'Patients', matches: 'With a match', income: 'Income, plan', drop: 'Cost drop, model', dx: 'Diagnoses, model' },
  tlName: {
    patients: 'Patients in the network',
    matches: 'Records with a match',
    dx: 'Fewer wrong or missed diagnoses',
    drop: 'Modelled drop in cost',
    income: 'Our income',
  },
  tlUnit: {
    patients: 'patients, running total',
    matches: 'records, running total',
    income: '€ a year, plan',
    drop: '€ a year, model',
    dx: 'a year, model',
  },
  tlTag: { plan: 'Plan', model: 'Model', computed: 'Computed on synthetic records' },
  // Anna's tlVal.eur and tlVal.dx are "{amount} a year": the value and the suffix are two elements here so the suffix can be small, and this is the suffix.
  tlPerYear: 'a year',
  tlAssumeDx: 'Assumption: one visit per patient a year.',
  tlRampPerCase: (a: { price: string; from: number; to: number }) =>
    `Assumption: each paid case is one new patient in the network, at ${a.price} a case. Months ${a.from} to ${a.to} are a free pilot with no patients counted. Doctor-seat fees are income, not patients.`,
  tlIncomePlan: 'Income: our plan, not a measurement. Every price and volume is an assumption.',
  // `geography` is `euro.geography` of the file; with no euro block the sentence says nothing about a geography rather than a wrong one.
  tlEuroNote: (a: { price: string; perPatient: string; last: number; geography?: string }) =>
    `Each case is paid once, at ${a.price}. The modelled drop is a yearly figure for the patients in the network (${a.perPatient} per patient a year at month ${a.last}). In this model it counts only the direct cost of wrong or missed diagnoses, on the average spending per inhabitant${a.geography ? ` for ${a.geography}` : ''}.`,
  tlFormula: (a: { points: string; perInhabitant: string; patients: string; amount: string }) =>
    `${a.points} points × ${a.perInhabitant} × ${a.patients} patients = ${a.amount} a year`,
  tlShowValues: 'Show the values',
  tlColMeasure: 'Measure',
  tlColMonth: (month: number) => `Month ${month}`,
  tlTableCaption: (a: { first: number; second: number }) => `Plan months ${a.first} and ${a.second}, the same figures as the chart.`,
  // The text alternative, filled from the data. Every money and diagnoses figure is "a year" (CEO seat condition 10: no running total on screen or in the aria text).
  tlDescLead: (a: { first: number; last: number; lines: number }) =>
    `One chart with ${({ 3: 'three', 4: 'four', 5: 'five' } as Record<number, string>)[a.lines] ?? a.lines} lines, plan months ${a.first} to ${a.last}, synthetic model. Each unit has its own scale, so heights are compared only inside a unit.`,
  tlDescPatients: (a: { paid: number | null; last: number; n: string }) =>
    a.paid === null ? `Patients in the network: ${a.n} at month ${a.last}.` : `Patients in the network: none until month ${a.paid}, ${a.n} at month ${a.last}.`,
  tlDescMatches: (a: { n: string; last: number }) => `Records with a match: ${a.n} at month ${a.last}.`,
  tlDescDx: (a: { n: string }) => `Modelled fewer wrong or missed diagnoses: ${a.n} a year.`,
  tlDescDrop: (a: { amount: string }) => `Modelled drop in cost: ${a.amount} a year.`,
  tlDescIncome: (a: { amount: string }) => `Planned income: ${a.amount} a year, plan.`,
  tlDescClose: 'A model and a plan, not a measurement.',
} as const;
