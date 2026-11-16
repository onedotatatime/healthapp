import { assertEquals } from "jsr:@std/assert@1";
import { ANALYTE_KEYS, analyteKey, build, flagOf, LOINC_LIST_HEADER, loincListText, type ModelExtract, parseDate, parseNumber, parseRange } from "./extract.ts";

Deno.test("numbers: comma decimals, Greek and English thousands, not-a-number stays null", () => {
  assertEquals(parseNumber("5,2", "el"), 5.2);
  assertEquals(parseNumber("18,4", null), 18.4);
  assertEquals(parseNumber("1.250", "el"), 1250); // Greek thousand
  assertEquals(parseNumber("1.250", "en"), 1.25); // English decimal
  assertEquals(parseNumber("1,250", "en"), 1250);
  assertEquals(parseNumber("1.250,5", "el"), 1250.5);
  assertEquals(parseNumber("12.8", "el"), 12.8);
  assertEquals(parseNumber("<5", "el"), null);
  assertEquals(parseNumber("αρνητικό", "el"), null);
  assertEquals(parseNumber("", "el"), null);
});

Deno.test("ranges: bounds, one-sided, Greek 'έως', unparsable -> null", () => {
  assertEquals(parseRange("0 - 5", "el"), { low: 0, high: 5 });
  assertEquals(parseRange("12,0 - 16,0", "el"), { low: 12, high: 16 });
  assertEquals(parseRange("4.0–10.0", "en"), { low: 4, high: 10 });
  assertEquals(parseRange("<14", "el"), { low: null, high: 14 });
  assertEquals(parseRange("> 40", "en"), { low: 40, high: null });
  assertEquals(parseRange("έως 5", "el"), { low: null, high: 5 });
  assertEquals(parseRange("see note", "en"), null);
  assertEquals(parseRange("5 - 1", "en"), null);
  assertEquals(parseRange("", "en"), null);
});

Deno.test("flag comes from the printed range, and is unknown without one", () => {
  assertEquals(flagOf(18.4, 0, 5), "high");
  assertEquals(flagOf(58, 60, 150), "low");
  assertEquals(flagOf(100, 70, 100), "normal");
  assertEquals(flagOf(38, null, 14), "high");
  assertEquals(flagOf(48, 40, null), "normal");
  assertEquals(flagOf(3, null, null), "unknown");
  assertEquals(flagOf(null, 0, 5), "unknown");
});

Deno.test("dates: dd/mm first, never mm/dd; written months; impossible dates refused", () => {
  assertEquals(parseDate("04/05/2026"), "2026-05-04");
  assertEquals(parseDate("14/05/2025"), "2025-05-14");
  assertEquals(parseDate("14.05.2025"), "2025-05-14");
  assertEquals(parseDate("2026-03-18"), "2026-03-18");
  assertEquals(parseDate("22 October 2026"), "2026-10-22");
  assertEquals(parseDate("October 22, 2026"), "2026-10-22");
  assertEquals(parseDate("2 April 2026"), "2026-04-02");
  assertEquals(parseDate("14 Μαΐου 2025"), "2025-05-14");
  assertEquals(parseDate("31/02/2026"), null);
  assertEquals(parseDate("13/13/2026"), null);
  assertEquals(parseDate("soon"), null);
});

Deno.test("analyte keys: Greek and English printings of one analyte share a key", () => {
  assertEquals(analyteKey("CRP (C-αντιδρώσα πρωτεΐνη)"), "crp");
  assertEquals(analyteKey("C-reactive protein (CRP)"), "crp");
  assertEquals(analyteKey("ΤΚΕ (Ταχύτητα καθίζησης ερυθρών)"), "esr");
  assertEquals(analyteKey("Erythrocyte sedimentation rate (ESR)"), "esr");
  assertEquals(analyteKey("Αντι-CCP"), "anti_ccp");
  assertEquals(analyteKey("Rheumatoid factor (RF)"), "rf");
  assertEquals(analyteKey("Αιμοσφαιρίνη"), "hemoglobin");
  assertEquals(analyteKey("Haemoglobin"), "hemoglobin");
  assertEquals(analyteKey("Something unlisted"), null);
});

const good: ModelExtract = {
  readable: true, document_kind: "blood_test", language: "el", issuer: "Εργαστήριο", exam_date: "14/05/2025",
  printed_name: "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ", printed_id: "AK123456",
  header_confidence: { exam_date: 0.9, issuer: 0.9, printed_name: 0.9, printed_id: 0.9 },
  results: [{ analyte: "CRP", value: "18,4", unit: "mg/L", ref_text: "0 - 5", loinc: "", confidence: 0.95 }],
  findings: [],
};

Deno.test("build: a good read becomes a draft with numbers, flag and key computed in code", () => {
  const b = build(good);
  if (!b.ok) throw new Error("expected a draft");
  const r = b.draft.results[0];
  assertEquals([r.value_num, r.value_text, r.ref_low, r.ref_high, r.flag, r.analyte_key], [18.4, null, 0, 5, "high", "crp"]);
  assertEquals(b.draft.exam_date, "2025-05-14");
  assertEquals(b.draft.language, "el");
});

Deno.test("build: the model's own opinion cannot set a flag (no field for it); text values stay text", () => {
  const b = build({ ...good, results: [{ analyte: "Anti-CCP", value: "αρνητικό", unit: "", ref_text: "", loinc: "", confidence: 0.8 }] });
  if (!b.ok) throw new Error("expected a draft");
  assertEquals([b.draft.results[0].value_num, b.draft.results[0].value_text, b.draft.results[0].flag, b.draft.results[0].unit], [null, "αρνητικό", "unknown", null]);
});

Deno.test("build: never half-read, each missing piece has its own typed refusal", () => {
  const reason = (m: ModelExtract) => {
    const b = build(m);
    return b.ok ? "draft" : b.reason;
  };
  assertEquals(reason({ ...good, readable: false }), "unreadable");
  assertEquals(reason({ ...good, document_kind: "other" }), "unsupported_kind");
  assertEquals(reason({ ...good, printed_name: "  " }), "name_missing");
  assertEquals(reason({ ...good, exam_date: "" }), "incomplete");
  assertEquals(reason({ ...good, exam_date: "31/02/2026" }), "incomplete");
  assertEquals(reason({ ...good, results: [], findings: [] }), "incomplete");
  assertEquals(reason({ ...good, results: [{ analyte: "CRP", value: "", unit: "", ref_text: "", loinc: "", confidence: 1 }] }), "incomplete");
  assertEquals(reason({ ...good, readable: false, printed_name: "" }), "unreadable"); // order: unreadable first
});

Deno.test("build: findings keep the document's words and get a date; a missing ID stays null", () => {
  const b = build({
    ...good, document_kind: "imaging_report", language: "el", printed_id: "", results: [],
    findings: [{ kind: "conclusion", text: " Ήπια οστεοαρθρίτιδα. ", date: "", specialty: "", confidence: 0.9 }],
  });
  if (!b.ok) throw new Error("expected a draft");
  assertEquals(b.draft.findings[0], { kind: "conclusion", text_original: "Ήπια οστεοαρθρίτιδα.", text_lang: "el", finding_date: "2025-05-14", specialty: null, confidence: 0.9 });
  assertEquals([b.draft.printed_id, b.draft.header_confidence.printed_id], [null, null]);
});

Deno.test("normalizeId: Greek lookalike capitals, spaces, dashes, case; different IDs stay different", async () => {
  const { normalizeId } = await import("./extract.ts");
  assertEquals(normalizeId("ΑΚ 123-456"), "AK123456");
  assertEquals(normalizeId("ak123456"), "AK123456");
  assertEquals(normalizeId("ΑΒ654321") === normalizeId("AK123456"), false);
  assertEquals(normalizeId("Σ123"), "Σ123"); // a letter with no Latin twin is left alone
  assertEquals(normalizeId(""), "");
});

// ---------------------------------------------------------------------------------------------
// MIN-4689: the LOINC code is validated in code, against the list the store read from lab_loinc.
// ---------------------------------------------------------------------------------------------
const CODES = new Set(["1988-5", "718-7"]);
const withCodes = (...codes: string[]): ModelExtract => ({
  ...good,
  results: codes.map((c) => ({ analyte: "CRP", value: "18,4", unit: "mg/L", ref_text: "0 - 5", loinc: c, confidence: 0.9 })),
});

Deno.test("build: a code on the list is kept, one that is not is dropped, an empty string is null; counts only", () => {
  const b = build(withCodes("1988-5", "2345-7", "", "  718-7  ", "nonsense"), CODES);
  if (!b.ok) throw new Error("expected a draft");
  assertEquals(b.draft.results.map((r) => r.loinc), ["1988-5", null, null, "718-7", null]);
  assertEquals(b.loinc, { coded: 2, dropped: 2 });
});

Deno.test("build: with no list (the table could not be read) every code is null and every given code counts as dropped", () => {
  const b = build(withCodes("1988-5", ""), null);
  if (!b.ok) throw new Error("expected a draft");
  assertEquals(b.draft.results.map((r) => r.loinc), [null, null]);
  assertEquals(b.loinc, { coded: 0, dropped: 1 });
});

Deno.test("build: the code changes nothing else of the row (key, flag and value are the code's business, not the model's)", () => {
  const a = build(withCodes(""), CODES), b = build(withCodes("718-7"), CODES); // a haemoglobin code on a CRP row
  if (!a.ok || !b.ok) throw new Error("expected drafts");
  assertEquals({ ...b.draft.results[0], loinc: null }, a.draft.results[0]);
  assertEquals(b.draft.results[0].analyte_key, "crp"); // the over-time key stays analyteKey's (MIN-4689 §3)
});

Deno.test("loincListText: the header, then one line per row: code | English | Greek | unit (blank when null)", () => {
  assertEquals(
    loincListText([
      { loinc: "1988-5", name_en: "C reactive protein [Mass/volume] in Serum or Plasma", name_el: "CRP", ucum: "mg/L" },
      { loinc: "8061-4", name_en: "Nuclear Ab [Presence] in Serum", name_el: null, ucum: null },
    ]),
    `${LOINC_LIST_HEADER}\n1988-5 | C reactive protein [Mass/volume] in Serum or Plasma | CRP | mg/L\n8061-4 | Nuclear Ab [Presence] in Serum |  | `,
  );
});

Deno.test("020's seed: every analyte_key is an extraction key or a match_lab_defs key; the 020 check names exactly analyteKey's keys", async () => {
  const sql = (f: string) => Deno.readTextFile(new URL(`../../sql/${f}`, import.meta.url));
  const seed = await sql("020_lab_loinc.sql");
  const T = String.raw`'(?:[^']|'')*'`;
  const row = new RegExp(String.raw`^  \('([0-9]{1,7}-[0-9])', ${T}, (?:${T}|null), (?:${T}|null), (?:'([a-z0-9_]+)'|null), '[0-9.]+'\)`, "gm");
  const keys = [...seed.matchAll(row)].map((m) => m[2]).filter((k): k is string => !!k);
  assertEquals([...seed.matchAll(row)].length, 95);
  const matchKeys = [...(await sql("006_seed_match_cohort.sql")).matchAll(/^ {2}\('([a-z0-9_]+)', '[^']*', [0-9.]+, [0-9.]+,/gm)].map((m) => m[1]);
  assertEquals(matchKeys.length, 19);
  for (const k of keys) assertEquals(ANALYTE_KEYS.includes(k) || matchKeys.includes(k), true, k);
  for (const k of matchKeys) assertEquals(keys.includes(k), true, `match key ${k} has no code`);
  const check = await sql("checks/lab_loinc_check.sql");
  const listed = check.match(/unnest\(array\[([^\]]+)\]\)/)?.[1].match(/'([a-z0-9_]+)'/g)?.map((x) => x.slice(1, -1)) ?? [];
  assertEquals([...listed].sort(), [...ANALYTE_KEYS].sort());
});
