/** The calculation `healthapp-over-time` does on the server (MIN-4548 section 2), for the mock and the tests only: the UI never calls it. */
import type { OverTimeResponse, OverTimeSeries } from './analysis.contract';
import { dayOf, horizonFor } from './analysis';
import type { ResultRow } from './contract';
import type { RecordData } from './record';

export function computeOverTime(record: RecordData): OverTimeResponse {
  const docs = new Map(record.documents.map((d) => [d.id, d]));
  const groups = new Map<string, ResultRow[]>();
  let excluded = 0;
  for (const r of record.results) {
    if (r.value_num === null || !r.analyte_key || !docs.get(r.document_id)?.exam_date) continue;
    groups.set(r.analyte_key, [...(groups.get(r.analyte_key) ?? []), r]);
  }
  const series: OverTimeSeries[] = [];
  for (const [key, rows] of groups) {
    if (rows.length < 2) continue;
    if (new Set(rows.map((r) => r.unit)).size > 1) { excluded++; continue; }
    const pts = rows.map((r) => ({ r, date: docs.get(r.document_id)!.exam_date! })).sort((a, b) => a.date.localeCompare(b.date));
    const outside = pts.filter((p) => p.r.flag === 'low' || p.r.flag === 'high');
    const dates = new Set(pts.map((p) => p.date));
    let projection: OverTimeSeries['projection'] = null;
    if (pts.length >= 3 && dates.size >= 3) {
      const xs = pts.map((p) => dayOf(p.date));
      const ys = pts.map((p) => p.r.value_num!);
      const mx = xs.reduce((a, b) => a + b) / xs.length;
      const my = ys.reduce((a, b) => a + b) / ys.length;
      const slope = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / xs.reduce((a, x) => a + (x - mx) ** 2, 0);
      const horizon = horizonFor(pts[0].date, pts[pts.length - 1].date);
      projection = { n: pts.length, slope_per_day: slope, horizon_date: horizon, value_at_horizon: my + slope * (dayOf(horizon) - mx) };
    }
    series.push({
      analyte_key: key,
      analyte: pts[0].r.analyte,
      unit: pts[0].r.unit ?? '',
      points: pts.map((p) => ({ cite: `r:${p.r.id}`, date: p.date, value: p.r.value_num!, ref_low: p.r.ref_low, ref_high: p.r.ref_high, flag: p.r.flag })),
      out_of_range: { count: outside.length, first_date: outside[0]?.date ?? null, latest_date: outside[outside.length - 1]?.date ?? null },
      projection,
    });
  }
  series.sort((a, b) => a.analyte.localeCompare(b.analyte));
  return {
    series,
    counts: { records_read: record.documents.length, values_with_series: series.length, projections_computed: series.filter((s) => s.projection).length, series_excluded: excluded, errors: 0 },
  };
}

