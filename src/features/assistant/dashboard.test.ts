/** MIN-4664: the doctor dashboard's rules, from the CTO's decision on MIN-4660 section 1 and 4. Synthetic series only: they say nothing about any real record. */
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { buildChart, CAP_NOTICE, CARDS_SHOWN, flagChips, niceTicks, orderSeries } from './analysis';
import type { OverTimeSeries } from './analysis.contract';
import { MOCK_SERIES_RECORD } from './analysis.mock';
import { FlagsRow, OverTimeView, type OverTimeState } from './OverTime';
import { buildExams, buildIndex } from './record';

const index = buildIndex(MOCK_SERIES_RECORD);
const text = (m: string) => m.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
let n = 0;
const uid = () => `00000000-0000-4000-8000-${String(900000 + n++).padStart(12, '0')}`;

/** A series with the given values, one result a month, printed range lo..hi on every result. */
function series(key: string, analyte: string, values: number[], lo: number | null, hi: number | null, projection = false): OverTimeSeries {
  const points = values.map((value, i) => ({
    cite: `r:${uid()}`, date: `2026-0${i + 1}-10`, value, ref_low: lo, ref_high: hi,
    out_of_range: lo === null && hi === null ? null : (hi !== null && value > hi) || (lo !== null && value < lo),
  }));
  const outs = points.filter((p) => p.out_of_range === true);
  return {
    key, analyte, unit: 'u', points,
    out_of_range: { count: outs.length, first_date: outs[0]?.date ?? null, latest_date: outs.at(-1)?.date ?? null },
    projection: projection ? { n: values.length, slope_per_day: 0.1, first_date: points[0].date, last_date: points.at(-1)!.date, horizon_days: 60, horizon_date: '2026-09-10', value_at_horizon: 20 } : null,
  };
}
const counts = (n: number, records = 40) => ({ records_read: records, values_with_series: n, projections_computed: 0, series_excluded: 0, errors: 0 });
const ready = (s: OverTimeSeries[], records = 40): OverTimeState => ({ status: 'ready', data: { series: s, counts: counts(s.length, records) } });
const view = (state: OverTimeState, expanded = false) => renderToStaticMarkup(h(OverTimeView, { state, index, openCite: null, onOpenCite: () => {}, expanded }));
const cards = (m: string) => m.match(/data-testid="chart-card"/g)?.length ?? 0;

describe('card order: out of range first, then by name', () => {
  const list = [series('b', 'Glucose', [90, 95], 70, 100), series('a', 'Albumin', [40, 41], 35, 50), series('d', 'ESR', [10, 28], 0, 20), series('c', 'CRP', [3, 9], null, 5)];
  it('puts the series with a result outside its range first, each group by analyte', () => {
    expect(orderSeries(list).map((s) => s.analyte)).toEqual(['CRP', 'ESR', 'Albumin', 'Glucose']);
  });
  it('is the same order in the markup', () => {
    const m = text(view(ready(list)));
    const at = ['CRP', 'ESR', 'Albumin', 'Glucose'].map((a) => m.indexOf(`${a} `));
    expect(at.every((i) => i >= 0)).toBe(true);
    expect([...at].sort((x, y) => x - y)).toEqual(at);
  });
  it('does not mutate the response it was given', () => {
    const before = list.map((s) => s.key).join();
    orderSeries(list);
    expect(list.map((s) => s.key).join()).toBe(before);
  });
});

describe('six cards, then "Show all N"', () => {
  const eleven = Array.from({ length: 11 }, (_, i) => series(`k${i}`, `Value ${String.fromCharCode(65 + i)}`, [1 + i, 2 + i], null, null));
  it(`shows ${CARDS_SHOWN} and the button that opens the rest`, () => {
    const m = view(ready(eleven));
    expect(cards(m)).toBe(CARDS_SHOWN);
    expect(text(m)).toContain('Showing 6 of 11 values with two or more dated results.');
    expect(text(m)).toContain('Show all 11 values');
  });
  it('after it, the number of cards equals values_with_series', () => {
    const state = ready(eleven);
    const m = view(state, true);
    expect(cards(m)).toBe(state.status === 'ready' ? state.data.counts.values_with_series : -1);
    expect(text(m)).toContain('Show fewer');
  });
  it('six or fewer: no button and no line', () => {
    const m = view(ready(eleven.slice(0, 6)));
    expect(cards(m)).toBe(6);
    expect(m).not.toContain('data-testid="show-all"');
  });
  it('one series is one card, even when two share a unit', () => {
    expect(cards(view(ready([series('sys', 'Systolic', [120, 130], null, null), series('dia', 'Diastolic', [80, 85], null, null)])))).toBe(2);
  });
});

describe('Flags chips: data only, above and below the printed range', () => {
  const chips = (list: OverTimeSeries[]) => flagChips(list).map((c) => c.text);
  it('says how many results are above', () => expect(chips([series('crp', 'CRP', [3, 9, 11, 14], null, 5)])).toEqual(['CRP: 3 results above the printed range']));
  it('says how many are below, and "result" for one', () => expect(chips([series('fe', 'Ferritin', [10, 90], 15, 150)])).toEqual(['Ferritin: 1 result below the printed range']));
  it('says both when both happen', () => expect(chips([series('x', 'Sodium', [120, 140, 150, 160], 135, 145)])).toEqual(['Sodium: 2 results above and 1 result below the printed range']));
  it('has no chip for a value that never left its range or printed none', () => {
    expect(chips([series('a', 'Albumin', [40, 41], 35, 50), series('b', 'Vitamin D', [20, 30], null, null)])).toEqual([]);
  });
  it('names no condition and no direction word', () => {
    const all = chips([series('crp', 'CRP', [3, 9], null, 5), series('fe', 'Ferritin', [10, 90], 15, 150)]).join(' ');
    expect(all).not.toMatch(/\b(rising|falling|improv\w*|worsen\w*|trend\w*|increas\w*|decreas\w*|risk\w*|diagnos\w*|condition\w*|watch|abnormal)\b/i);
  });
  it('renders one chip per flagged series, in the card order, and nothing when not ready', () => {
    const m = renderToStaticMarkup(h(FlagsRow, { state: ready([series('b', 'ESR', [10, 28], 0, 20), series('a', 'CRP', [3, 9], null, 5)]) }));
    expect(m.match(/data-testid="flag-chip"/g)?.length).toBe(2);
    expect(text(m).indexOf('CRP')).toBeLessThan(text(m).indexOf('ESR'));
    expect(renderToStaticMarkup(h(FlagsRow, { state: { status: 'loading' } }))).toBe('');
  });
  it('more than eight chips: eight, then "N more"', () => {
    const many = Array.from({ length: 11 }, (_, i) => series(`k${i}`, `V${String.fromCharCode(65 + i)}`, [1, 9], null, 5));
    const m = renderToStaticMarkup(h(FlagsRow, { state: ready(many) }));
    expect(m.match(/data-testid="flag-chip"/g)?.length).toBe(8);
    expect(text(m)).toContain('3 more');
  });
});

describe('the 500-row notice', () => {
  it('shows at 500 records read, with the CTO\'s words, and not at 499', () => {
    expect(text(view(ready([series('a', 'A', [1, 2], null, null)], 500)))).toContain(CAP_NOTICE);
    expect(text(view(ready([series('a', 'A', [1, 2], null, null)], 499)))).not.toContain('Only the first 500');
  });
  it('the CTO\'s sentence, word for word', () => {
    expect(CAP_NOTICE).toBe('Only the first 500 results of this record were read, oldest first. Newer results may be missing from these charts.');
  });
});

describe('the chart mapping: band, outside flag, projection', () => {
  it('both limits printed: two edge lines; only one: one; none: no band and no edge', () => {
    expect(buildChart(series('a', 'A', [10, 12], 5, 15)).bandEdges).toHaveLength(2);
    expect(buildChart(series('a', 'A', [10, 12], null, 15)).bandEdges).toHaveLength(1);
    const none = buildChart(series('a', 'A', [10, 12], null, null));
    expect(none.band).toBeNull();
    expect(none.bandEdges).toHaveLength(0);
  });
  it('marks exactly the results the response flags as outside', () => {
    const s = series('a', 'A', [3, 9, 4, 11], null, 5);
    expect(buildChart(s).points.map((p) => p.outside)).toEqual([false, true, false, true]);
  });
  it('draws the dashed line only when the response has a projection', () => {
    expect(buildChart(series('a', 'A', [1, 2, 3], null, null, true)).line).not.toBeNull();
    expect(buildChart(series('a', 'A', [1, 2], null, null)).line).toBeNull();
    expect(view(ready([series('a', 'A', [1, 2], null, null)]))).not.toContain('data-testid="ot-line"');
  });
  it('gives every result a 44 by 44 target that opens its source', () => {
    const m = view(ready([series('a', 'A', [1, 2, 3], null, null)]));
    expect(m.match(/role="button" tabindex="0"/g)?.length).toBe(3);
    expect(m.match(/class="ot-hit"[^>]*r="22"/g)?.length).toBe(3);
  });
  it('rounds the y ticks outward to round values, three of them', () => {
    expect(niceTicks(0, 46)).toEqual([0, 30, 60]);
    expect(niceTicks(-1.4, 29.6, true)).toEqual([0, 15, 30]); // a series that never goes below 0 has no tick under it
    const t = niceTicks(3.1, 14.2);
    expect(t).toHaveLength(3);
    expect(t[0]).toBeLessThanOrEqual(3.1);
    expect(t[2]).toBeGreaterThanOrEqual(14.2);
    expect(t[1] - t[0]).toBeCloseTo(t[2] - t[1], 9); // evenly spaced, so the middle tick is in the middle
    const u = niceTicks(3.1, 22.94);
    expect(u).toEqual([0, 15, 30]);
    expect(buildChart(series('a', 'A', [3, 14], null, null)).yTicks).toHaveLength(3);
  });
});

describe('the exams list', () => {
  it('is every document of the record, newest exam first', () => {
    const exams = buildExams(MOCK_SERIES_RECORD);
    expect(exams).toHaveLength(MOCK_SERIES_RECORD.documents.length);
    const at = exams.map((e) => e.at);
    expect([...at].sort((a, b) => b - a)).toEqual(at);
  });
  it('counts values and the ones outside the printed range from the results', () => {
    const e = buildExams(MOCK_SERIES_RECORD);
    const total = e.reduce((s, x) => s + x.values, 0);
    expect(total).toBe(MOCK_SERIES_RECORD.results.length);
    expect(e.reduce((s, x) => s + x.flagged, 0)).toBe(MOCK_SERIES_RECORD.results.filter((r) => r.flag === 'low' || r.flag === 'high').length);
  });
  it('a row opens its own document', () => {
    for (const e of buildExams(MOCK_SERIES_RECORD)) expect(e.subject).toEqual({ kind: 'doc', docId: e.key });
  });
});
