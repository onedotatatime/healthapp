import { assertEquals } from "jsr:@std/assert@1";
import { analyteKey, build, flagOf, type ModelExtract, parseDate, parseNumber, parseRange } from "./extract.ts";

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
  results: [{ analyte: "CRP", value: "18,4", unit: "mg/L", ref_text: "0 - 5", confidence: 0.95 }],
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
  const b = build({ ...good, results: [{ analyte: "Anti-CCP", value: "αρνητικό", unit: "", ref_text: "", confidence: 0.8 }] });
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
  assertEquals(reason({ ...good, results: [{ analyte: "CRP", value: "", unit: "", ref_text: "", confidence: 1 }] }), "incomplete");
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
