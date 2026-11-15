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

  // The simulation page: ONE loss card (MIN-4774; spec A16; words: Anna MIN-4723 comment b08a38aa column M, CEO seat MIN-4771 rulings 2 and 3, CTO MIN-4769).
  // No number is typed here: euros, counts, shares, years and the geography come from the data as arguments. Final strings: Anna, MIN-4770 comment 82f2dfc2.
  simLabel: 'Simulation on synthetic data. A model, not a measurement', // fixed by the CTO, never rewritten
  simUnavailable: 'The simulation data could not be read.',
  rTitle: {
    greece: (a: { amount: string }) => `Greece's health system loses about ${a.amount} a year to wrong or missed diagnoses, in this model`,
    eu27: (a: { amount: string }) => `Health systems in the EU-27 lose about ${a.amount} a year to wrong or missed diagnoses, in this model`,
    world: (a: { amount: string }) => `Health systems worldwide lose about ${a.amount} a year to wrong or missed diagnoses, in this model`,
    other: (a: { name: string; amount: string }) => `${a.name} loses about ${a.amount} a year to wrong or missed diagnoses, in this model`,
  },
  rLead: 'Move the slider: the more patients are in the network, the lower the loss.',
  rSwitchAria: 'Health system',
  // The words for one geography, keyed by the id in the file; an unknown id falls back to its name. `of`: "40% of Greece"; `adj`: "of Greek health spending".
  rSubject: {
    greece: { of: 'Greece', adj: 'Greek' },
    eu27: { of: 'the EU-27', adj: 'EU-27' },
    world: { of: 'the world', adj: 'world' },
  } as Record<string, { of: string; adj: string }>,
  rSliderLabel: 'Patients in the network',
  rSliderLabelShort: 'Share in the network', // under 900 px
  rSliderValue: (a: { share: string; of: string }) => `${a.share} of ${a.of}`,
  rSliderAria: 'Share of patients in the network, from 0 to 100 percent. The numbers below show that share.',
  rSliderText: (a: { share: string; of: string; amount: string }) => `${a.share} of ${a.of}'s patients in the network. The loss falls by ${a.amount} a year.`,
  // The state line under the slider: a fixed height, so nothing moves.
  rState: {
    zero: 'Nobody in the network: the loss is unchanged',
    plan: 'About the size our plan reaches in year 10',
    full: 'Every patient in the network, at the synthetic match rate',
  },
  rHead: { loss: 'Loss a year to wrong or missed diagnoses', matches: 'Records with a match', dx: 'Correct diagnoses gained' },
  /** The money label is one constant (CEO seat MIN-4771 ruling 3: "Lower by"; the founder's form stays here, one word to switch, never without the CEO seat). */
  rMoneyWording: 'lower' as 'lower' | 'saved',
  rMoneyLabel: { lower: 'Lower by', saved: 'Could be saved, in the model' },
  rKey: { loss: 'Loss a year, in the model', drop: 'Lowered by' },
  rUnit: { year: 'a year' },
  rTag: { model: 'Model', plan: 'Plan' },
  rHelpLoss: (a: { share: string; adj: string; year: number }) => `The model's loss: ${a.share} of ${a.adj} health spending, ${a.year}.`,
  rAt100: (a: { value: string }) => `At 100%: ${a.value}`,
  rPlanName: (a: { year: number }) => `Our plan, year ${a.year}`,
  rPlanMarker: (a: { year: number; share: string }) => `Our plan, year ${a.year}: ${a.share}`,
  rPlanRow: (a: { patients: string; share: string; of: string; amount: string }) =>
    `${a.patients} patients is ${a.share} of ${a.of}. At that size the loss falls by ${a.amount} a year.`,
  rPlanMarkerAria: (a: { year: number; share: string }) => `Marker: the share of patients our plan reaches in year ${a.year}, ${a.share}.`,
  rAxisTitle: (a: { of: string }) => `Share of ${a.of}'s patients in the network`,
  // The notes under the card, in this order (spec A16 section 7).
  rNoteAxis: 'The axis starts at €0, so the drop is drawn at its true size beside the loss.',
  // The CTO's required line (MIN-4769 section 1), word for word, with the record count from the file.
  rStraight: (a: { records: string }) =>
    `A straight line because the match rate and its effect are held at the ${a.records}-record values (synthetic). They are not measured at this size.`,
  rAssume: (a: { rate: string; effect: string }) =>
    `Assumption, not a finding: ${a.rate} of opted-in synthetic records found a match, and each match lowers the chance of a wrong or missed diagnosis by ${a.effect}. Both are held at every share.`,
  rAssumeVisits: 'Assumption: one visit per patient a year.',
  rAssumeStay: 'Assumption: no patient leaves the network, and the effect applies every year.',
  rSameRates: 'The same match rate and effect are used in every view, so the loss falls by the same percentage in each. Only the spending base differs.',
  // Anna's gAssumeShare for Greece and the EU-27 as drafted; the world's is the CEO seat's wording (MIN-4771 section 2). {share} is the file's baseline.
  rAssumeShare: {
    greece: (a: { share: string }) => `The ${a.share} is an OECD model estimate for a typical OECD country, applied here as an assumption. It is not a Greek measurement.`,
    eu27: (a: { share: string }) => `The ${a.share} is an OECD model estimate for a typical OECD country, applied here to the EU-27 as an assumption. It is not an EU measurement.`,
    world: (a: { share: string }) =>
      `The ${a.share} is an OECD model estimate for a typical OECD country, applied here to the world as an assumption. Low- and middle-income countries differ widely, and the OECD paper gives no estimate for them. Read it as a scale, not a measurement.`,
    other: (a: { share: string; of: string }) => `The ${a.share} is an OECD model estimate for a typical OECD country, applied here to ${a.of} as an assumption.`,
  },
  rBase: (a: { geography: string; year: number; total: string; perInhabitant: string }) =>
    `Spending base: ${a.geography}, ${a.year}, ${a.total} a year in all, ${a.perInhabitant} for each inhabitant.`,
  rFormula: (a: { points: string; total: string; geography: string; year: number; amount: string }) =>
    `${a.points} points × ${a.total} (${a.geography}, ${a.year}) = ${a.amount} a year`,
  // Only where the file converts a currency (the world, 2023): the original, the head count and the named rate, visible without a tap (CEO seat conditions 18 and 19).
  rFx: (a: { total: string; perHead: string; people: string; year: number; rate: string }) =>
    `Converted to euros from ${a.total} (${a.perHead} a head × ${a.people} people, ${a.year}) at the ECB's ${a.year} average rate, US$${a.rate} per €1.`,
  rSourceLead: 'Health spending:',
  rPopulationLead: 'Population:',
  rBaselines: 'Baselines applied:',
  rShowValues: 'Show the values',
  rTableCaption: (a: { name: string }) => `${a.name}: every 10% of the share in the network, the same figures as the card.`,
  rColShare: 'Share in the network',
  rColLoss: 'Loss a year',
  rColDx: 'Correct diagnoses gained',
  rDesc: (a: { name: string; year: number; share: string; loss: string; drop: string; matches: string; dx: string; dropHead: string }) =>
    `One card, ${a.name}, ${a.year}. Loss a year to wrong or missed diagnoses with ${a.share} of patients in the network: ${a.loss}. ${a.dropHead} ${a.drop} a year, records with a match ${a.matches}, correct diagnoses gained ${a.dx} a year. A model, not a measurement.`,
} as const;
