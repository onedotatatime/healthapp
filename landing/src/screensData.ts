// Demo screens: strings are Anna's `docs/landing/copy.md` (## screens), word for word. All values are synthetic.

export const screensCopy = {
  chip: 'Synthetic demo data',
  title: 'See it in action',
  sub: 'Four screens from the prototype, filled with synthetic data.',
  note: 'No real patients, labs or results.'
};

export const captions = [
  { id: 's-history', title: 'Your history', line: 'Every exam on one timeline, with date, type and lab.', label: 'Patient app: Maria\'s history, four exams on one timeline (synthetic).' },
  { id: 's-scan', title: 'Photo to record', line: 'A photographed blood test, read into values, units and printed ranges.', label: 'Patient app: a blood test read into values, units and printed ranges, ferritin flagged as outside the printed range (synthetic).' },
  { id: 's-share', title: 'Let a doctor in', line: 'A QR code, a timer and a log. You stay in control.', label: 'Patient app: a QR code with an expiry countdown and an access log (synthetic, not scannable).' },
  { id: 's-ask', title: 'Ask, with sources', line: 'Doctors ask across the history. Every answer shows its source.', label: 'Doctor view: a question about ferritin answered with its source exam, and a question answered "Not in this record" (synthetic).' }
] as const;

// Labels inside the abstract screens (spec: docs/landing/design-screens.md). Everything else is skeleton bars.
export const labels = {
  history: 'Blood test · Mar 2026',
  flag: 'Outside printed range',
  countdown: '29:41',
  share: 'Doctor access',
  question: 'Was ferritin ever low?',
  source: 'Source: Blood test · 12 Mar 2026'
};

// 11x11 static QR-style pattern: three 3x3 finder squares (solid), a mint centre tile, fixed fill. Not scannable.
export const QR_N = 11;
const FILL = [
  '11101010111',
  '11110110111',
  '11101001011',
  '01010100010',
  '10110000101',
  '01100000110',
  '11001000011',
  '00101101010',
  '11100110101',
  '11001011010',
  '11110101101'
];
export const qrCells: Array<'on' | 'off' | 'logo'> = (() => {
  const out: Array<'on' | 'off' | 'logo'> = [];
  for (let r = 0; r < QR_N; r++) for (let c = 0; c < QR_N; c++) {
    const finder = (r < 3 && c < 3) || (r < 3 && c > 7) || (r > 7 && c < 3);
    const quiet = (r < 4 && c < 4) || (r < 4 && c > 6) || (r > 6 && c < 4);
    if (r === 5 && c === 5) out.push('logo');
    else if (finder) out.push('on');
    else if (quiet) out.push('off');
    else out.push(FILL[r][c] === '1' ? 'on' : 'off');
  }
  return out;
})();
