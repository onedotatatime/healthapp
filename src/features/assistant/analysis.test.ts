import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { buildChart, dayOf, outOfRangeLine, projectionLabel } from './analysis';
import { computeOverTime } from './analysis.calc';
import { FileAnalysisRow, OverTimeResponse, type OverTimeSeries } from './analysis.contract';
import { MOCK_FILE_ANALYSIS, MOCK_SERIES_RECORD } from './analysis.mock';
import { AboutFileView, type FileState } from './FileFacts';
import { ID, MOCK_RECORD } from './mock';
import { OverTimeView, type OverTimeState } from './OverTime';
import { buildIndex } from './record';

const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);
const text = (markup: string) => markup.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ');
const index = buildIndex(MOCK_SERIES_RECORD);

// A literal response (not computed here): the numbers on screen are compared with these numbers, written by hand.
const crp = (n: number, date: string, value: number, flag: 'normal' | 'high'): OverTimeSeries['points'][number] => ({ cite: `r:${[ID.crpMar, '00000000-0000-4000-8000-000000000206', '00000000-0000-4000-8000-000000000207', ID.crpOct][n]}`, date, value, ref_low: null, ref_high: 5, flag });
const SERIES: OverTimeSeries = {
  analyte_key: 'crp', analyte: 'CRP', unit: 'mg/L',
  points: [crp(0, '2026-03-12', 3.1, 'normal'), crp(1, '2026-06-18', 8.9, 'high'), crp(2, '2026-08-20', 11, 'high'), crp(3, '2026-10-30', 14.2, 'high')],
  out_of_range: { count: 3, first_date: '2026-06-18', latest_date: '2026-10-30' },
  projection: { n: 4, slope_per_day: 0.04716, horizon_date: '2027-04-28', value_at_horizon: 22.94 },
};
const TWO: OverTimeSeries = {
  analyte_key: 'esr', analyte: 'ESR', unit: 'mm/h',
  points: [
    { cite: `r:${ID.esrMar}`, date: '2026-03-12', value: 12, ref_low: 0, ref_high: 20, flag: 'normal' },
    { cite: `r:${ID.esrOct}`, date: '2026-10-30', value: 28, ref_low: 0, ref_high: 20, flag: 'high' },
  ],
  out_of_range: { count: 1, first_date: '2026-10-30', latest_date: '2026-10-30' },
  projection: null,
};
const COUNTS = { records_read: 6, values_with_series: 2, projections_computed: 1, series_excluded: 3, errors: 0 };
const ready = (series: OverTimeSeries[], counts = COUNTS): OverTimeState => ({ status: 'ready', data: { series, counts } });
const view = (state: OverTimeState) => html(h(OverTimeView, { state, index, openCite: null, onOpenCite: () => {} }));

// Words the panels must never carry (CTO decision MIN-4548 section 2 and the issue's acceptance criteria).
const FORBIDDEN = /\b(rising|falling|improv\w*|worsen\w*|declin\w*|trend\w*|increas\w*|decreas\w*|better|worse|abnormal|healthy|risk\w*|cause\w*|diagnos\w*|condition\w*|advice|score)\b/i;

describe('the response shapes (a copy of the CTO decision, until Cron posts his)', () => {
  it('accepts the literal response and counts the five integers', () => {
    expect(OverTimeResponse.parse({ series: [SERIES, TWO], counts: COUNTS }).counts).toEqual(COUNTS);
  });
  it('refuses a series of one result, and a projection through fewer than three', () => {
    expect(OverTimeResponse.safeParse({ series: [{ ...TWO, points: [TWO.points[0]] }], counts: COUNTS }).success).toBe(false);
    expect(OverTimeResponse.safeParse({ series: [{ ...SERIES, projection: { ...SERIES.projection!, n: 2 } }], counts: COUNTS }).success).toBe(false);
  });
  it('has no field for a crossing date, a direction or free text beyond the document words', () => {
    const keys = JSON.stringify(Object.keys(OverTimeResponse.shape.series.element.shape.projection.unwrap().shape));
    expect(keys).toBe('["n","slope_per_day","horizon_date","value_at_horizon"]');
  });
  it('the mock file analyses all parse; text_original is capped at 200 characters and 20 items', () => {
    for (const row of Object.values(MOCK_FILE_ANALYSIS)) if (row) expect(FileAnalysisRow.safeParse(row).success).toBe(true);
    const done = MOCK_FILE_ANALYSIS[ID.docOct]!;
    expect(FileAnalysisRow.safeParse({ ...done, items: [{ text_original: 'x'.repeat(201), page: 1 }] }).success).toBe(false);
    expect(FileAnalysisRow.safeParse({ ...done, items: Array.from({ length: 21 }, () => ({ text_original: 'x', page: 1 })) }).success).toBe(false);
  });
});

describe('Over time: what is on screen equals the response', () => {
  const out = text(view(ready([SERIES, TWO])));
  it('shows every result in date order with its own printed range', () => {
    const order = ['12 Mar 2026 3.1 mg/L', '18 Jun 2026 8.9 mg/L', '20 Aug 2026 11 mg/L', '30 Oct 2026 14.2 mg/L'].map((s) => out.indexOf(s));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(out).toContain('below 5');
    expect(out).toContain('0 to 20');
  });
  it('says how many times, first and latest, from the response', () => {
    expect(out).toContain('Outside the printed range 3 times, first 18 Jun 2026, latest 30 Oct 2026.');
    expect(out).toContain('Outside the printed range 1 time, first 30 Oct 2026, latest 30 Oct 2026.');
    expect(outOfRangeLine({ ...SERIES, out_of_range: { count: 0, first_date: null, latest_date: null } })).toBe('Never outside the printed range.');
  });
  it('prints the horizon point exactly as returned', () => {
    expect(out).toContain('The line ends at 22.94 mg/L on 28 Apr 2027.');
  });
  it('prints the five counts as a footer', () => {
    expect(out).toContain('Records read 6, values with a series 2, projections 1, series excluded 3, errors 0.');
  });
  it('marks a result outside its range with a word and a diamond, not by colour alone', () => {
    const m = view(ready([SERIES]));
    expect(m.match(/above range/g)?.length).toBe(3);
    expect(m.match(/data-outside="true"/g)?.length).toBeGreaterThanOrEqual(3);
    expect(m.match(/ot-pt-out/g)?.length).toBe(3);
    expect(m.match(/<circle class="ot-pt"/g)?.length).toBe(1);
  });
  it('gives every point its source chip, named with the source and its mark', () => {
    const m = view(ready([SERIES]));
    expect(m.match(/class="chip"/g)?.length).toBe(4);
    expect(m).toContain('aria-label="Source 4: Blood test: CRP, 30 Oct 2026, uploaded by patient"');
  });
});

describe('Over time: the projection label is permanent and honest', () => {
  it('sits in the markup next to the dashed line, not in a tooltip, with the exact CTO text', () => {
    const m = view(ready([SERIES]));
    expect(text(m)).toContain('Straight line through 4 results, 12 Mar 2026 to 30 Oct 2026. Arithmetic, not a prediction and not a diagnosis.');
    expect(m).not.toContain('role="tooltip"><strong>Straight'); // not in a chip card
    expect(m).not.toMatch(/title="Straight/);
    expect(m.match(/data-testid="ot-line"/g)?.length).toBe(1); // one line, one projection
    expect(m).toMatch(/stroke-dasharray|ot-line/);
  });
  it('builds the label from n and the first and last result dates', () => {
    expect(projectionLabel(5, '2026-01-02', '2026-02-03')).toBe('Straight line through 5 results, 2 Jan 2026 to 3 Feb 2026. Arithmetic, not a prediction and not a diagnosis.');
  });
  it('a series without a projection says "Not enough results for a projection" and draws no line and no label', () => {
    const m = view(ready([TWO]));
    expect(text(m)).toContain('Not enough results for a projection');
    expect(m).not.toContain('data-testid="ot-line"');
    expect(m).not.toContain('Straight line through');
  });
  it('the dashed line is the response line: it ends at the horizon value and has the response slope', () => {
    const c = buildChart(SERIES);
    const p = SERIES.projection!;
    const days = dayOf(p.horizon_date) - dayOf(SERIES.points[0].date);
    expect(c.line!.x2).toBeCloseTo(c.plot.x1, 6); // the last x of the plot is the horizon date
    expect(c.line!.y2).toBeCloseTo(c.yOf(p.value_at_horizon), 6);
    expect(c.line!.y1).toBeCloseTo(c.yOf(p.value_at_horizon - p.slope_per_day * days), 6); // value at the first result's date
    expect(c.line!.y1).toBeGreaterThan(c.line!.y2); // pixel y grows downward: the line goes up with this slope
  });
});

describe('Over time: states and words', () => {
  it('loading, failed (with a retry), and no series', () => {
    expect(view({ status: 'loading' })).toContain('data-state="loading"');
    const failed = html(h(OverTimeView, { state: { status: 'error' }, index, openCite: null, onOpenCite: () => {}, onRetry: () => {} }));
    expect(text(failed)).toContain('The results over time could not be loaded.');
    expect(failed).toContain('data-testid="over-time-retry"');
    const empty = view(ready([], { ...COUNTS, values_with_series: 0, projections_computed: 0 }));
    expect(text(empty)).toContain('No value in this record has two or more dated results');
    expect(empty).not.toContain('data-testid="ot-series"');
  });
  it('carries no word about health, direction, score or advice in any state', () => {
    const label = projectionLabel(4, '2026-03-12', '2026-10-30');
    for (const m of [view(ready([SERIES, TWO])), view({ status: 'loading' }), view({ status: 'error' }), view(ready([]))]) {
      expect(text(m).replace(label, '')).not.toMatch(FORBIDDEN);
    }
  });
  it('the forbidden-word scan can fail: a direction word is caught', () => {
    expect('Values are rising').toMatch(FORBIDDEN);
  });
  it('the mock over-time calculation is a straight least-squares line: 1, 2, 3 on days 0, 10, 20 has slope 0.1', () => {
    const rec = { ...MOCK_RECORD, documents: MOCK_RECORD.documents.slice(0, 0), results: [], findings: [], diary: [] };
    const d = (i: number, date: string) => ({ ...MOCK_RECORD.documents[0], id: `00000000-0000-4000-8000-00000000f0${i}`, exam_date: date });
    const r = (i: number, v: number) => ({ ...MOCK_RECORD.results[0], id: `00000000-0000-4000-8000-00000000e0${i}`, document_id: `00000000-0000-4000-8000-00000000f0${i}`, value_num: v, flag: 'normal' as const });
    const out = computeOverTime({ ...rec, documents: [d(1, '2026-01-01'), d(2, '2026-01-11'), d(3, '2026-01-21')], results: [r(1, 1), r(2, 2), r(3, 3)] });
    expect(out.series[0].projection!.slope_per_day).toBeCloseTo(0.1, 10);
    expect(out.series[0].projection!.value_at_horizon).toBeCloseTo(5, 10); // 20 days past the last point, as far ahead as the data is long
    expect(out.series[0].projection!.horizon_date).toBe('2026-02-10');
    // two results: no projection
    expect(computeOverTime({ ...rec, documents: [d(1, '2026-01-01'), d(2, '2026-01-11')], results: [r(1, 1), r(2, 2)] }).series[0].projection).toBeNull();
  });
});

const row = (id: string) => MOCK_FILE_ANALYSIS[id] as FileAnalysisRow;
const file = (state: FileState) => html(h(AboutFileView, { state, mark: 'uploaded' }));

describe('About this file: the four states', () => {
  it('analysed: type, pages, readable, quality words, provenance, presence, items with the document words', () => {
    const m = file({ status: 'ready', row: row(ID.docOct) });
    const t = text(m);
    expect(m).toContain('data-state="done"');
    expect(t).toContain('Blood test, 2 pages');
    expect(t).toContain('Readable');
    expect(t).toContain('Blurred, cropped');
    expect(t).toContain('Uploaded by patient');
    expect(t).toContain('Uploaded 30 Oct 2026, 09:02, 472 KB, image/jpeg.');
    expect(t).toContain('File fingerprint (SHA-256, first 8): a3f19c0e');
    expect(t).toContain('Issuer: present');
    expect(t).toContain('Date: present');
    expect(t).toContain('Stamp or signature: absent');
    expect(t).toContain('2 items on this file are not in the record');
    expect(m).toContain('<blockquote class="as-quote">Ferritin 48 ng/mL (ref 30-400)<span class="as-meta"> Page 2.</span></blockquote>');
    expect(m).not.toContain('<details class="as-items" data-testid="file-items" open');
  });
  it('analysed with nothing missing says so', () => {
    expect(text(file({ status: 'ready', row: row(ID.docMar) }))).toContain('No item on this file is missing from the record.');
    expect(text(file({ status: 'ready', row: row(ID.docMar) }))).toContain('No quality problem noted');
  });
  it('not analysed yet (no row)', () => {
    const m = file({ status: 'ready', row: null });
    expect(m).toContain('data-state="none"');
    expect(text(m)).toContain('This file has not been analysed yet.');
  });
  it('failed: the code, and the values are unchanged', () => {
    const m = file({ status: 'ready', row: row(ID.docLetter) });
    expect(m).toContain('data-state="failed"');
    expect(text(m)).toContain('The analysis of this file failed (code: model_unavailable). The values above are unchanged.');
    expect(text(m)).not.toContain('Readable');
  });
  it('a hash that does not match the stored file says so in words', () => {
    expect(text(file({ status: 'ready', row: { ...row(ID.docOct), hash_verified: false } }))).toContain('the stored file does NOT match this fingerprint');
  });
  it('loading and a failed read (with retry)', () => {
    expect(file({ status: 'loading' })).toContain('data-state="loading"');
    const m = html(h(AboutFileView, { state: { status: 'error' }, mark: 'uploaded', onRetry: () => {} }));
    expect(text(m)).toContain('The file analysis could not be read.');
    expect(m).toContain('data-testid="about-file-retry"');
  });
  it('carries no word about health, cause, condition or advice in any state', () => {
    for (const s of [row(ID.docOct), row(ID.docMar), null, row(ID.docLetter)]) {
      expect(text(file({ status: 'ready', row: s }))).not.toMatch(FORBIDDEN);
    }
  });
});
