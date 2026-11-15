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

  // The simulation page: one diagram with a plan-month slider (MIN-4749; spec A15; words: docs/simulation-copy.md section 9, Anna MIN-4723 comment 9e14b7f0).
  // No number is typed here: years, months, counts, euros, points and the geography come from the data as arguments.
  simLabel: 'Simulation on synthetic data. A model, not a measurement', // fixed by the CTO, never rewritten
  simUnavailable: 'The simulation data could not be read.',
  // Section 6 of docs/simulation-copy.md (Anna, MIN-4604; approved by the CEO seat on MIN-4605). Every number is filled from the data file.
  simAssumption: (a: { start: string; ceiling: string }) =>
    `Assumption, not a finding: each match lowers the chance of a wrong or missed diagnosis by ${a.start}, rising to ${a.ceiling} as matches accumulate.`,
  gTitle: { drop: 'What matching could change in Greece, year by year', saved: 'What matching could save Greece, year by year' },
  gCaption: {
    drop: (a: { first: number; last: number }) =>
      `Plan years ${a.first} to ${a.last}, on synthetic records and a plan. Move the slider to see, at any month, how many patients have joined, how many records find a match, how many diagnoses go right instead of wrong or missed, what that is worth in Greek health spending in the model, and our planned income.`,
    saved: (a: { first: number; last: number }) =>
      `Plan years ${a.first} to ${a.last}, on synthetic records and a plan. Move the slider to see, at any month, how many patients have joined, how many records find a match, how many diagnoses go right instead of wrong or missed, how much money it could have saved in Greek health spending, in the model, and our planned income.`,
  },
  gSliderLabel: 'Plan year',
  gSliderValue: (a: { year: number; month: number }) => `Year ${a.year}, month ${a.month}`,
  gSliderAria: (a: { first: number; last: number }) => `Plan year, from ${a.first} to ${a.last}. The numbers below show that point in the plan.`,
  gHead: {
    patients: 'Patients in the network',
    matches: 'Records with a match',
    dx: 'Correct diagnoses gained',
    money: { drop: 'Modelled drop in cost in Greece', saved: 'Money that could be saved in Greece, in the model' },
    income: 'Our income',
  },
  gTag: { plan: 'Plan', model: 'Model', computed: 'Computed on synthetic records' },
  // The suffix under a value. "a year" is the yearly basis (a year at that month's network size); the total basis says "in total".
  gSuffix: {
    yearly: { money: 'a year', income: 'a year, plan', dx: 'a year, in the model' },
    total: { money: 'in total since the start', income: 'in total since the start, plan', dx: 'in total since the start, in the model' },
  },
  gHelp: {
    dx: { yearly: 'Fewer wrong or missed diagnoses a year, in the model.', total: 'Fewer wrong or missed diagnoses added up since the start, in the model.' },
    money: (a: { year: number }) => `Cost of wrong or missed diagnoses that the model removes, on ${a.year} spending.`,
  },
  // Pending Anna (MIN-4723 asked for these four, Pix's A15 names them; the growth wording is replaced by the CTO's rule on MIN-4744: income is held flat after the plan).
  gBandPlan: (a: { planYears: number }) => `Plan: years 1 to ${a.planYears}`,
  gBandAssumed: (a: { planYears: number }) => `After plan year ${a.planYears}: income held flat, not in the plan`,
  gStatePlan: 'In the plan',
  gStateAssumed: 'After the plan: income held flat',
  gAxisTitle: 'Plan year',
  // The scale sentences (docs/simulation-copy.md section 8) and, for the euro-only plot, one sentence of its own (pending Anna).
  gScale: 'Each unit has its own scale: people, euros, diagnoses. Compare heights only inside a unit. Across units, compare how the lines grow.',
  gScaleMore: 'Patients and records with a match share one scale. Income and the modelled drop share another. Diagnoses have their own. Every scale starts at zero.',
  gScaleEuro: 'The plot shows euros only, on one scale that starts at zero. Patients, records with a match and diagnoses are in the list.',
  gScaleTop: 'Top: the largest value in the unit',
  gFact: (a: { total: string; year: number; perInhabitant: string; geography: string }) =>
    `For scale: ${a.geography} spent ${a.total} on health in ${a.year}, ${a.perInhabitant} for each inhabitant.`,
  gAssumeVisits: 'Assumption: one visit per patient a year.',
  gAssumeShare: (a: { share: string }) =>
    `The cost share is an OECD model estimate for a typical OECD country, about ${a.share} of health spending. It is not a Greek measurement.`,
  // The CTO's one line under the diagram (MIN-4744 section 1), word for word, with the numbers from the file.
  gPlateau: (a: { records: string; month: number; planYears: number }) =>
    `Past ${a.records} records (month ${a.month}) the matches and their effect are held at the ${a.records}-record values; past year ${a.planYears} the plan's revenue is held flat.`,
  // The CEO seat's strings (MIN-4746 comment 88b0c07c, conditions 12 and 15), word for word.
  gIncomePlan: (a: { planYears: number }) => `Income: our plan to year ${a.planYears}, then held flat. Not a forecast.`,
  gAssumeStay: 'Assumption: no patient leaves the network, and the effect applies every year.',
  // The running totals under the yearly figures (CEO ruling 4, CTO fix A). Money keeps the drop wording whatever DIAGRAM.money is: "saved" is never put on a total.
  gTotal: {
    money: (a: { value: string; first: number }) => `${a.value} added up since month ${a.first}, in the model`,
    dx: (a: { value: string; first: number }) => `${a.value} added up since month ${a.first}, in the model`,
    income: (a: { value: string; first: number }) => `${a.value} added up since month ${a.first}, plan`,
  },
  gBase: (a: { geography: string; year: number; perInhabitant: string; total: string }) =>
    `Spending base: ${a.geography}, ${a.year}, ${a.perInhabitant} per inhabitant, ${a.total} a year in all.`,
  gFormula: (a: { points: string; perInhabitant: string; patients: string; amount: string }) =>
    `${a.points} points × ${a.perInhabitant} × ${a.patients} patients = ${a.amount} a year`,
  gSourceLead: 'Health spending:',
  gBaselines: 'Baselines applied:',
  gShowValues: 'Show the values',
  gTableCaption: 'Every plan year, at its last month, the same figures as the diagram.',
  gColYear: 'Plan year',
  gColPatients: 'Patients',
  gColMatches: 'With a match',
  gColDx: { yearly: 'Diagnoses a year', total: 'Diagnoses in total' },
  gColMoney: { drop: { yearly: 'Modelled drop a year', total: 'Modelled drop in total' }, saved: { yearly: 'Could be saved a year, in the model', total: 'Modelled drop in total' } },
  gColIncome: { yearly: 'Income a year', total: 'Income in total' },
  gColDxTotal: 'Diagnoses added up',
  gColMoneyTotal: 'Modelled drop added up',
  gColIncomeTotal: 'Income added up',
  gTableAfter: '(income held flat)',
  gDesc: (a: { year: number; month: number; patients: string; matches: string; dx: string; moneyHead: string; money: string; income: string; per: string }) =>
    `One diagram, plan year ${a.year}, month ${a.month}, synthetic model. Patients: ${a.patients}. Records with a match: ${a.matches}. Correct diagnoses gained: ${a.dx} ${a.per}, in the model. ${a.moneyHead}: ${a.money} ${a.per}. Our income: ${a.income} ${a.per}, plan. A model and a plan, not a measurement.`,
} as const;
