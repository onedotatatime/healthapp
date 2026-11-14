import { assertEquals } from "jsr:@std/assert@1";
import { OverTimeResponse } from "../_shared/contract.ts";
import type { PatientRecord, ResultFact } from "../_shared/assistant.ts";
import { call, DOCTOR, fakeAuth, PATIENT } from "../_shared/testkit_docs.ts";
import { makeHandler } from "./handler.ts";

const GRANT = "99999999-9999-4999-8999-999999999999";
const U = (n: number) => `aaaaaaaa-0000-4000-8000-${String(n).padStart(12, "0")}`;
const row = (n: number, date: string, key: string, name: string, v: number, unit = "mg/L", hi: number | null = 5): ResultFact => ({
  id: U(n), exam_date: date, kind: "blood_test", provenance: "uploaded_by_patient", analyte: name, analyte_key: key, value_num: v,
  value_text: null, unit, ref_low: 0, ref_high: hi, ref_text: null, flag: "unknown", edited_by_patient: false,
});

// SYNTHETIC Maria (the seeded record's shape): CRP over three dates, anti-CCP twice, ferritin once, ESR in two units.
const RECORD: PatientRecord = {
  results: [
    row(1, "2025-05-14", "crp", "CRP (C-αντιδρώσα πρωτεΐνη)", 18.4),
    row(2, "2025-12-09", "crp", "CRP (C-αντιδρώσα πρωτεΐνη)", 7.9),
    row(3, "2026-10-22", "crp", "C-reactive protein (CRP)", 3.8),
    row(4, "2025-12-09", "anti_ccp", "Anti-CCP", 74, "U/mL", 20),
    row(5, "2026-10-22", "anti_ccp", "Anti-CCP", 82, "U/mL", 20),
    row(6, "2026-10-22", "ferritin", "Ferritin", 60, "ng/mL", 200),
    row(7, "2025-05-14", "esr", "ESR", 30, "mm/h", 20),
    row(8, "2026-10-22", "esr", "ESR", 3, "mm", 20),
  ],
  findings: [],
  diary: [],
};

interface Opts {
  record?: PatientRecord | null;
  grant?: { patient_id: string; live: boolean } | null;
  throwOn?: "grantState" | "record";
}
function setup(o: Opts = {}) {
  const reads: string[] = [];
  const logs: Record<string, unknown>[] = [];
  const h = makeHandler({
    auth: fakeAuth,
    store: {
      roleOf: (_e, uid) => Promise.resolve(uid === DOCTOR ? "doctor" : uid === PATIENT ? "patient" : null),
      grantState(_e, gid, doctor) {
        reads.push("grantState");
        if (o.throwOn === "grantState") return Promise.reject(new Error("db down"));
        const g = o.grant === undefined ? { patient_id: PATIENT, live: true } : o.grant;
        return Promise.resolve(gid === GRANT && doctor === DOCTOR ? g : null);
      },
      record() {
        reads.push("record");
        if (o.throwOn === "record") return Promise.reject(new Error("db down"));
        return Promise.resolve(o.record === undefined ? RECORD : o.record);
      },
    },
    log: (l) => logs.push(l),
  });
  const get = (token = "td", grant = GRANT) => h(call("healthapp-over-time", { grant_id: grant }, token));
  return { h, get, reads, logs };
}

Deno.test("a doctor with a live grant: series, out-of-range history, one projection, counts; cites resolve to record rows", async () => {
  const t = setup();
  const res = await t.get();
  assertEquals(res.status, 200);
  const out = OverTimeResponse.parse(await res.json());
  assertEquals(out.series.map((s) => s.key), ["anti_ccp", "crp"]); // ordered by key; ferritin (1 result) and esr (2 units) are not series
  assertEquals(out.counts, { records_read: 8, values_with_series: 2, projections_computed: 1, series_excluded: 1, errors: 0 });
  const crp = out.series[1];
  assertEquals(crp.points.map((p) => p.cite), [U(1), U(2), U(3)].map((u) => `r:${u}`));
  assertEquals(crp.out_of_range, { count: 2, first_date: "2025-05-14", latest_date: "2025-12-09" });
  assertEquals(crp.projection?.n, 3);
  assertEquals((crp.projection?.horizon_days ?? 0) > 0 && (crp.projection?.horizon_days ?? 999) <= 180 && (crp.projection?.value_at_horizon ?? -1) >= 0, true);
  assertEquals(out.series[0].projection, null); // two results: no projection
  const known = new Set(RECORD.results.map((r) => `r:${r.id}`));
  assertEquals(out.series.flatMap((s) => s.points).every((p) => known.has(p.cite)), true);
});

Deno.test("a patient token is 403 wrong_role: no grant or record is read", async () => {
  const t = setup();
  const res = await t.get("tp");
  assertEquals([res.status, (await res.json()).error.code], [403, "wrong_role"]);
  assertEquals(t.reads, []);
});

Deno.test("an ended, unknown or somebody else's grant is 403 grant_expired: the record is never read", async () => {
  for (const o of [{ grant: { patient_id: PATIENT, live: false } }, { grant: null }] as Opts[]) {
    const t = setup(o);
    const res = await t.get();
    assertEquals([res.status, (await res.json()).error.code], [403, "grant_expired"]);
    assertEquals(t.reads.includes("record"), false);
  }
  const t = setup();
  const res = await t.get("td", "88888888-8888-4888-8888-888888888888");
  assertEquals([res.status, (await res.json()).error.code], [403, "grant_expired"]);
  assertEquals(t.reads.includes("record"), false);
  const u = setup({ record: null }); // the grant ended between the two reads
  assertEquals((await u.get()).status, 403);
});

Deno.test("no session, no profile, bad body, bad grant id, wrong method", async () => {
  const t = setup();
  assertEquals((await t.h(call("x", {}, null))).status, 401);
  assertEquals((await t.h(call("x", {}, "to"))).status, 403);
  assertEquals((await t.h(call("x", "not json", "td"))).status, 400);
  assertEquals((await t.h(call("x", {}, "td"))).status, 400);
  assertEquals((await t.h(call("x", { grant_id: "nope" }, "td"))).status, 400);
  assertEquals((await t.h(new Request("https://x/", { method: "GET" }))).status, 400);
  assertEquals(t.reads, []);
});

Deno.test("every call logs ONE line: fn plus the five integers, and no id, name, value or date", async () => {
  const t = setup();
  await t.get();
  assertEquals(t.logs.length, 1);
  assertEquals(t.logs[0], { fn: "over-time", records_read: 8, values_with_series: 2, projections_computed: 1, series_excluded: 1, errors: 0 });
  const { fn: _fn, ...nums } = t.logs[0];
  assertEquals(Object.keys(nums).sort(), ["errors", "projections_computed", "records_read", "series_excluded", "values_with_series"]);
  assertEquals(Object.values(nums).every((v) => Number.isInteger(v)), true);
  const text = JSON.stringify(t.logs);
  for (const leak of ["CRP", "2025", "18.4", "aaaaaaaa", "Anti", PATIENT, GRANT]) assertEquals(text.includes(leak), false, leak);
  const refused = setup({ grant: null });
  await refused.get();
  assertEquals(refused.logs, [{ fn: "over-time", records_read: 0, values_with_series: 0, projections_computed: 0, series_excluded: 0, errors: 0 }]);
});

Deno.test("a database failure is a 500 with errors: 1 in the log and no detail in the answer", async () => {
  for (const throwOn of ["grantState", "record"] as const) {
    const t = setup({ throwOn });
    const res = await t.get();
    assertEquals(res.status, 500);
    assertEquals((await res.text()).includes("db down"), false);
    assertEquals(t.logs, [{ fn: "over-time", records_read: 0, values_with_series: 0, projections_computed: 0, series_excluded: 0, errors: 1 }]);
  }
});
