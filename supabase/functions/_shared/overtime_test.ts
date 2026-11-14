import { assertEquals } from "jsr:@std/assert@1";
import type { ResultFact } from "./assistant.ts";
import { OverTimeResponse } from "./contract.ts";
import { keyOf, overTime, project } from "./overtime.ts";

const U = (n: number) => `aaaaaaaa-0000-4000-8000-${String(n).padStart(12, "0")}`;
let n = 0;
function res(date: string, value: number | null, o: Partial<ResultFact> = {}): ResultFact {
  return {
    id: U(++n), exam_date: date, kind: "blood_test", provenance: "uploaded_by_patient", analyte: "CRP", analyte_key: "crp",
    value_num: value, value_text: null, unit: "mg/L", ref_low: 0, ref_high: 5, ref_text: "0 - 5", flag: "unknown", edited_by_patient: false, ...o,
  };
}

Deno.test("a known line: values 10, 20, 30 on days 0, 10, 20 give slope 1, horizon 20 days, 50 there", () => {
  const p = project([{ day: 20000, value: 10 }, { day: 20010, value: 20 }, { day: 20020, value: 30 }])!;
  assertEquals(p.n, 3);
  assertEquals(p.slope_per_day, 1);
  assertEquals(p.horizon_days, 20);
  assertEquals(p.value_at_horizon, 50);
  assertEquals([p.first_date, p.last_date, p.horizon_date], ["2024-10-04", "2024-10-24", "2024-11-13"]);
});

Deno.test("a known line through real dates: CRP 18.4, 7.9, 3.8 (least squares, not a join of two points)", () => {
  // days from 2025-05-14: 0, 209, 526. slope = sxy/sxx computed by hand below.
  const o = overTime([res("2025-05-14", 18.4), res("2025-12-09", 7.9), res("2026-10-22", 3.8)]);
  const p = o.series[0].projection!;
  const xs = [0, 209, 526];
  const ys = [18.4, 7.9, 3.8];
  const mx = xs.reduce((a, b) => a + b) / 3;
  const my = ys.reduce((a, b) => a + b) / 3;
  const slope = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / xs.reduce((a, x) => a + (x - mx) ** 2, 0);
  assertEquals(p.slope_per_day, Number(slope.toPrecision(6)));
  const h = Math.floor((my + slope * (526 - mx)) / -slope); // 180 (the cap) would go below zero: the line stops where it reaches 0
  assertEquals([h < 180, p.horizon_days], [true, h]);
  assertEquals(p.value_at_horizon, Number((my + slope * (526 + h - mx)).toPrecision(6)));
  assertEquals(p.value_at_horizon >= 0, true);
  assertEquals(p.horizon_date, new Date(Date.UTC(2026, 9, 22) + h * 86_400_000).toISOString().slice(0, 10));
  assertEquals(slope < 0 && slope > -0.05, true); // hand-checked magnitude: about -0.0267
});

Deno.test("the horizon is capped at 180 days, and never longer than the data span", () => {
  const long = project([{ day: 20000, value: 1 }, { day: 20300, value: 2 }, { day: 20600, value: 3 }])!;
  assertEquals([long.horizon_days, long.horizon_date], [180, "2026-11-23"]);
  const p = project([{ day: 20000, value: 1 }, { day: 20010, value: 2 }, { day: 20030, value: 4 }])!;
  assertEquals(p.horizon_days, 30);
  assertEquals([p.last_date, p.horizon_date], ["2024-11-03", "2024-12-03"]);
});

Deno.test("a line that would go below zero stops before it does (all results are 0 or above); a line already there gives none", () => {
  const p = project([{ day: 20000, value: 10 }, { day: 20010, value: 5 }, { day: 20020, value: 1 }])!;
  assertEquals([p.horizon_days, p.horizon_date, p.value_at_horizon >= 0], [1, "2024-10-25", true]);
  assertEquals(project([{ day: 20000, value: 5 }, { day: 20010, value: 0.5 }, { day: 20020, value: 0 }]), null);
  // a value that is negative to begin with (a signed measure) is not clamped
  assertEquals(project([{ day: 20000, value: -1 }, { day: 20010, value: -2 }, { day: 20020, value: -3 }])!.value_at_horizon, -5);
});

Deno.test("the same value on the same date (a document uploaded twice) counts once; a different value the same day stays", () => {
  const o = overTime([res("2026-01-01", 4), res("2026-01-01", 4), res("2026-01-01", 4), res("2026-02-01", 6), res("2026-02-01", 7)]);
  assertEquals(o.series[0].points.map((p) => [p.date, p.value]), [["2026-01-01", 4], ["2026-02-01", 6], ["2026-02-01", 7]]);
  assertEquals(overTime([res("2026-01-01", 4), res("2026-01-01", 4)]).series.length, 0); // one distinct result is not a series
});

Deno.test("two results: a series, no projection. Three results on two dates: no projection", () => {
  const two = overTime([res("2026-01-01", 4), res("2026-03-01", 6)]);
  assertEquals([two.series.length, two.series[0].projection, two.counts.projections_computed], [1, null, 0]);
  const sameDay = overTime([res("2026-01-01", 4), res("2026-01-01", 5), res("2026-03-01", 6)]);
  assertEquals([sameDay.series.length, sameDay.series[0].projection], [1, null]);
});

Deno.test("mixed units are excluded and counted, not converted or guessed", () => {
  const o = overTime([res("2026-01-01", 4), res("2026-02-01", 5, { unit: "mg/dL" }), res("2026-03-01", 6)]);
  assertEquals([o.series.length, o.counts.series_excluded], [0, 1]);
  const spacing = overTime([res("2026-01-01", 4), res("2026-02-01", 5, { unit: " MG/L " })]);
  assertEquals([spacing.series.length, spacing.counts.series_excluded], [1, 0]); // case and spaces are the same unit
});

Deno.test("fewer than two dated results is excluded and counted; a single result is not a series and not counted", () => {
  const bad = overTime([res("not a date", 4), res("2026-02-01", 5), res("2026-02-30", 6)]);
  assertEquals([bad.series.length, bad.counts.series_excluded], [0, 1]);
  const single = overTime([res("2026-01-01", 4, { analyte_key: "ferritin", analyte: "Ferritin" })]);
  assertEquals([single.series.length, single.counts.series_excluded, single.counts.records_read], [0, 0, 1]);
});

Deno.test("out of range: counted against the limits on each result's own document, first and latest date", () => {
  const o = overTime([
    res("2025-05-14", 18.4), res("2025-12-09", 7.9), res("2026-04-01", 5), res("2026-10-22", 3.8),
    res("2026-11-01", 4, { ref_low: null, ref_high: null }),
    res("2026-11-02", 9, { ref_low: 10, ref_high: null }),
  ]);
  const s = o.series[0];
  assertEquals(s.points.map((p) => p.out_of_range), [true, true, false, false, null, true]); // 5 is on the limit: in range
  assertEquals(s.out_of_range, { count: 3, first_date: "2025-05-14", latest_date: "2026-11-02" });
});

Deno.test("no result outside its range: count 0 and null dates", () => {
  const s = overTime([res("2026-01-01", 1), res("2026-02-01", 2)]).series[0];
  assertEquals(s.out_of_range, { count: 0, first_date: null, latest_date: null });
});

Deno.test("two printed names of one coded value make one series, in date order, each point cites its own row", () => {
  const a = res("2026-10-22", 3.8, { analyte: "C-reactive protein (CRP)" });
  const b = res("2025-05-14", 18.4, { analyte: "CRP (C-αντιδρώσα πρωτεΐνη)" });
  const s = overTime([a, b]).series[0];
  assertEquals(s.points.map((p) => [p.date, p.cite]), [["2025-05-14", `r:${b.id}`], ["2026-10-22", `r:${a.id}`]]);
  assertEquals(s.analyte, "C-reactive protein (CRP)"); // the latest result's own name
});

Deno.test("uncoded values group by the printed name, de-accented; text-only results are ignored", () => {
  assertEquals(keyOf({ analyte: "Σίδηρος (Fe)", analyte_key: null }), keyOf({ analyte: "ΣΙΔΗΡΟΣ  fe", analyte_key: null }));
  const o = overTime([
    res("2026-01-01", 4, { analyte_key: null, analyte: "Σίδηρος" }), res("2026-02-01", 5, { analyte_key: null, analyte: "σιδηρος" }),
    res("2026-02-01", null, { analyte_key: null, analyte: "Σίδηρος", value_text: "high" }),
  ]);
  assertEquals([o.series.length, o.series[0].points.length, o.counts.records_read], [1, 2, 3]);
});

Deno.test("the response says nothing a doctor could mistake for a verdict, and has no crossing date", () => {
  const o = overTime([res("2025-05-14", 18.4), res("2025-12-09", 7.9), res("2026-10-22", 3.8)]);
  const parsed = OverTimeResponse.parse(o);
  const keys = new Set<string>();
  const walk = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) (keys.add(k), walk(x));
  };
  walk(parsed);
  assertEquals(
    [...keys].sort(),
    ["analyte", "cite", "count", "counts", "date", "errors", "first_date", "horizon_date", "horizon_days", "key", "last_date", "latest_date",
      "n", "out_of_range", "points", "projection", "projections_computed", "records_read", "ref_high", "ref_low", "series", "series_excluded",
      "slope_per_day", "unit", "value", "value_at_horizon", "values_with_series"].sort(),
  );
});

Deno.test("an empty record is a valid answer", () => {
  const o = overTime([]);
  assertEquals(OverTimeResponse.parse(o), { series: [], counts: { records_read: 0, values_with_series: 0, projections_computed: 0, series_excluded: 0, errors: 0 } });
});
