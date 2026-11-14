import { assertEquals } from "jsr:@std/assert@1";
import { type DraftOut, type Gt, score, sameId, sameName } from "./score.ts";

const gt: Gt = {
  n: 1, file: "x", kind: "blood_test", exam_date: "2025-05-14", issuer: "Ιατρικό Εργαστήριο «Υγεία», Αθήνα",
  printed_name: "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ", printed_id: "AK123456",
  results: [{ analyte: "CRP", value_num: 18.4, unit: "mg/L", ref_low: 0, ref_high: 5, flag: "high" }],
  findings: [{ kind: "conclusion", text: "Ήπια οστεοαρθρίτιδα του δεξιού γόνατος.", date: "2025-05-14" }],
  expected: { outcome: "draft" },
};
const perfect = (): DraftOut => ({
  document: { kind: "blood_test", exam_date: "2025-05-14", issuer: "Ιατρικό Εργαστήριο «Υγεία», Αθήνα" },
  printed_name: "Παπαδοπούλου Μαρία", printed_id: "AK 123456",
  results: [{ analyte: "CRP", value_num: 18.4, unit: "mg/L", ref_low: 0, ref_high: 5, flag: "high" }],
  findings: [{ kind: "conclusion", text_original: "Ήπια οστεοαρθρίτιδα του δεξιού γόνατος.", finding_date: "2025-05-14" }],
});

Deno.test("the instrument can fail: a perfect draft is 100%, each breakage costs exactly its field", () => {
  const p = score(gt, perfect());
  assertEquals([p.correct, p.total, p.nameOk, p.idOk, p.dateOk], [12, 12, true, true, true]);
  const cases: [string, (d: DraftOut) => void, number][] = [
    ["value", (d) => { d.results[0].value_num = 18; }, 1],
    ["unit", (d) => { d.results[0].unit = "g/L"; }, 1],
    ["flag", (d) => { d.results[0].flag = "normal"; }, 1],
    ["date", (d) => { d.document.exam_date = "2025-14-05"; }, 1],
    ["id", (d) => { d.printed_id = "AK123457"; }, 1],
    ["name", (d) => { d.printed_name = "Παπαδοπούλου Μαρίνα"; }, 1],
    ["finding text", (d) => { d.findings[0].text_original = "Ήπια οστεοαρθρίτιδα του αριστερού γόνατος."; }, 1],
    ["finding invented in place of the real one", (d) => { d.findings[0].text_original = "Φυσιολογικό"; }, 4],
    ["missing result", (d) => { d.results = []; }, 4],
    ["extra result", (d) => { d.results.push({ ...d.results[0], analyte: "ESR" }); }, 1],
  ];
  for (const [name, mutate, cost] of cases) {
    const d = perfect();
    mutate(d);
    const s = score(gt, d);
    assertEquals(s.total - s.correct, cost, name);
  }
});

Deno.test("name match ignores accents, case and order; IDs ignore spaces and dashes; different people differ", () => {
  assertEquals(sameName("ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ", "Μαρία Παπαδοπούλου"), true);
  assertEquals(sameName("ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ", "ΠΑΠΑΔΟΠΟΥΛΟΣ ΓΕΩΡΓΙΟΣ"), false);
  assertEquals(sameName(null, null), true);
  assertEquals(sameName("X", null), false);
  assertEquals(sameId("AK-123 456", "ak123456"), true);
  assertEquals(sameId("ΑΚ123456", "AK123456"), true); // Greek capitals that look Latin
  assertEquals(sameId("ΑΚ123456", "AK123457"), false);
  assertEquals(sameId(null, null), true);
  assertEquals(sameId("AK123456", null), false);
});
