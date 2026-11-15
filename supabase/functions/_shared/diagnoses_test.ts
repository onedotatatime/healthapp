// The diagnoses guard (MIN-4662; CTO decision on MIN-4660 §3, §4). Each rule below was forced red once: the
// control was removed, the test failed, the control was put back (see the PR body for the list).
import { assertEquals } from "jsr:@std/assert@1";
import { responseSchemaOf } from "./model.ts";
import { DiagnosesResponse, DiagnosisItem, DiagnosisStatement } from "./contract.ts";
import { buildFacts } from "./assistant.ts";
import { better, citationCount, fold, MAX_ITEMS, ModelDiagnoses, verify } from "./diagnoses.ts";
import { answerOf, GOOD, item, RECORD, stmt, U } from "./testkit_diagnoses.ts";

const facts = buildFacts(RECORD);
const run = (a: ModelDiagnoses) => verify(a, facts, RECORD);

Deno.test("a good answer: full cites, verified, sorted by name whatever order the model wrote", () => {
  const v = run(GOOD);
  assertEquals(v.items.map((i) => i.name), ["Gout", "Osteoarthritis", "Rheumatoid arthritis"]); // the model wrote RA, OA, Gout
  assertEquals(v.failures, []);
  assertEquals(v.drops, 0);
  assertEquals(v.items[2].fits[0].cites, [`r:${U(4)}`]); // short ids are mapped to the contract's full ids
  assertEquals(JSON.stringify(v.items).includes('"r4"'), false);
  assertEquals(citationCount(v.items), 6); // Gout 1, Osteoarthritis 2, Rheumatoid arthritis 2 fits + 1 does_not_explain
  for (const i of v.items) DiagnosisItem.parse(i);
});

Deno.test("the order is the alphabet, set by the server: accents and case do not move an item", () => {
  const names = ["zeta", "Écho", "alpha", "Beta"];
  const v = run(answerOf(...names.map((name) => item({ name }))));
  assertEquals(v.items.map((i) => i.name), ["alpha", "Beta", "Écho", "zeta"]);
  const rev = run(answerOf(...[...names].reverse().map((name) => item({ name }))));
  assertEquals(rev.items.map((i) => i.name), v.items.map((i) => i.name)); // the model's order never leaves the function
});

Deno.test("an unverifiable statement is dropped: unknown id, no cite, wrong number, wrong date, a number from another line, a bare id in the text", () => {
  const good = stmt("CRP was 7.9 mg/L on 2025-12-09, above the printed range 0 - 5.", "r2");
  const bads = [
    stmt("CRP was 7.9 mg/L on 2025-12-09, above the printed range 0 - 5.", "r99"),
    stmt("CRP was 7.9 mg/L on 2025-12-09, above the printed range 0 - 5."),
    stmt("CRP was 41.2 mg/L on 2025-12-09, above the printed range 0 - 5.", "r2"),
    stmt("CRP was 7.9 mg/L on 2025-12-10, above the printed range 0 - 5.", "r2"),
    stmt("CRP was 3.8 mg/L on 2025-12-09, above the printed range 0 - 5.", "r2"), // 3.8 is on r3, not r2
    stmt("CRP was 7.9 mg/L on 2025-12-09, above the printed range 0 - 5 (see r2).", "r2"),
    stmt("On 9 December 2025 CRP was 7.9 mg/L, above the printed range.", "r2"), // not ISO: 9 and 2025 are not on the line
  ];
  for (const bad of bads) {
    const v = run(answerOf(item({ fits: [bad, good] })));
    assertEquals(v.items[0].fits.length, 1, bad.text);
    assertEquals(v.items[0].fits[0].text, good.text);
    assertEquals(v.drops, 1, bad.text);
    assertEquals(v.failures.length, 1, bad.text);
    // the same statement alone leaves no verified "fits": the whole item goes
    const alone = run(answerOf(item({ fits: [bad] })));
    assertEquals([alone.items.length, alone.drops], [0, 2], bad.text); // the statement and the item
  }
});

Deno.test("an unverifiable does_not_explain is dropped too, and the item stays", () => {
  const v = run(answerOf(item({ does_not_explain: [stmt("CRP was 99 mg/L.", "r3"), stmt("CRP was 3.8 mg/L on 2026-10-22, within the printed range.", "r3")] })));
  assertEquals(v.items[0].does_not_explain.map((s) => s.cites), [[`r:${U(3)}`]]);
  assertEquals(v.drops, 1);
});

Deno.test("direction words need a matching flag when every cited line is a result", () => {
  const cases: [string, string[], boolean][] = [
    ["CRP was 3.8 mg/L on 2026-10-22, above the printed range 0 - 5.", ["r3"], false], // r3 is normal
    ["CRP was 3.8 mg/L on 2026-10-22, raised.", ["r3"], false],
    ["CRP was 18.4 mg/L on 2025-05-14, within the printed range 0 - 5.", ["r1"], false], // r1 is high
    ["CRP was 18.4 mg/L on 2025-05-14, normal.", ["r1"], false],
    ["CRP was 18.4 mg/L on 2025-05-14, below the printed range 0 - 5.", ["r1"], false], // nothing is low in this record
    ["CRP was 18.4 mg/L on 2025-05-14 and 3.8 mg/L on 2026-10-22, above range on the first date.", ["r1", "r3"], true], // one cited result is high
    ["CRP was 18.4 mg/L on 2025-05-14, above the printed range 0 - 5.", ["r1"], true],
    ["CRP was 3.8 mg/L on 2026-10-22, within the printed range.", ["r3"], true],
    ["CRP was 3.8 mg/L on 2026-10-22, above the printed range 0 - 5.", ["r3", "f1"], true], // a finding is cited: the rule needs every line to be a result
  ];
  for (const [text, cites, ok] of cases) {
    const v = run(answerOf(item({ fits: [stmt(text, ...cites)] })));
    assertEquals(v.items.length, ok ? 1 : 0, text);
  }
});

Deno.test("not_in_record: a term found in any record line is dropped, folded for case, accents, punctuation and the final sigma", () => {
  const terms = [
    "Anti-CCP", // in the r4 line, same spelling
    "ANTI CCP", // case and the hyphen
    "αντιδρωσα", // the line has "αντιδρώσα"
    "ΠΡΩΤΕΪΝΗ", // upper case, no accent, against "πρωτεΐνη"
    "osteoarthritis", // in a finding
    "knee pain", // in the diary
    "Morning stiff", // a part of a word in a finding is still in the record
    "blood test", // the line says blood_test
  ];
  const v = run(answerOf(item({ not_in_record: [...terms, "Rheumatoid factor", "Uric acid"] })));
  assertEquals(v.items[0].not_in_record, ["Rheumatoid factor", "Uric acid"]);
  assertEquals(v.drops, terms.length);
});

Deno.test("not_in_record: a term over 60 characters, a term with advice, an empty term and a repeat are not shown", () => {
  const long = "a".repeat(61);
  const v = run(answerOf(item({ not_in_record: [long, "Order a biopsy, you should", "   ", "Uric acid", "uric  ACID", "Rheumatoid factor"] })));
  assertEquals(v.items[0].not_in_record, ["Uric acid", "Rheumatoid factor"]);
  assertEquals(v.drops, 2); // the long term and the advice; an empty term and a repeat are not "removed text"
});

Deno.test("a forbidden word in a name drops the item: likelihood, rank, a percent sign, a leading number or #, advice", () => {
  const names = [
    "Most likely lupus", "Probable lupus", "Lupus (probably)", "Leading cause: lupus", "Suspected lupus", "Confirmed lupus",
    "Definite lupus", "Lupus 40%", "1. Lupus", "2 lupus", "#2 lupus", "Lupus, rank 1", "Top lupus", "Lupus should be excluded", "Urgent lupus",
    "", "x".repeat(81),
  ];
  for (const name of names) {
    const v = run(answerOf(item({ name }), item({ name: "Gout" })));
    assertEquals(v.items.map((i) => i.name), ["Gout"], JSON.stringify(name));
    assertEquals(v.drops, 1, JSON.stringify(name));
  }
  // an ordinary name that holds none of them stays
  assertEquals(run(answerOf(item({ name: "Systemic lupus erythematosus" }))).items.length, 1);
});

Deno.test("a word of advice, urgency or likelihood drops the statement", () => {
  const words = [
    "CRP was 7.9 mg/L on 2025-12-09, and the doctor should repeat it.",
    "CRP was 7.9 mg/L on 2025-12-09; recommend a repeat.",
    "CRP was 7.9 mg/L on 2025-12-09. This is urgent.",
    "CRP was 7.9 mg/L on 2025-12-09. Treat immediately.",
    "CRP was 7.9 mg/L on 2025-12-09, so prescribe something.",
    "CRP was 7.9 mg/L on 2025-12-09, which must be followed up.",
    "CRP was 7.9 mg/L on 2025-12-09; emergency.",
    "CRP was 7.9 mg/L on 2025-12-09, probably above range.",
    "CRP was 7.9 mg/L on 2025-12-09, most likely above range.",
    "CRP was 7.9 mg/L on 2025-12-09, a suspected rise above range.",
  ];
  const good = stmt("CRP was 7.9 mg/L on 2025-12-09, above the printed range 0 - 5.", "r2");
  for (const w of words) {
    const v = run(answerOf(item({ fits: [stmt(w, "r2"), good] })));
    assertEquals(v.items[0].fits.map((s) => s.text), [good.text], w);
  }
});

Deno.test("an item with no verified fits is dropped whole; the first of two items with one name stays", () => {
  const dead = item({ name: "Lupus", fits: [stmt("CRP was 99 mg/L.", "r2")] });
  const v = run(answerOf(dead, item({ name: "Gout" })));
  assertEquals(v.items.map((i) => i.name), ["Gout"]);
  assertEquals(v.drops, 2); // the statement, then the item
  const a = item({ name: "Gout" });
  const b = item({ name: "GOUT", fits: [stmt("CRP was 3.8 mg/L on 2026-10-22, within the printed range.", "r3")] });
  const dup = run(answerOf(a, b));
  assertEquals(dup.items.length, 1);
  assertEquals(dup.items[0].name, "Gout");
  assertEquals(dup.drops, 1);
  // an unverifiable first copy does not hide a verified second one
  const second = run(answerOf(item({ name: "Gout", fits: [stmt("CRP was 99 mg/L.", "r2")] }), b));
  assertEquals(second.items.map((i) => i.name), ["GOUT"]);
});

Deno.test("at most six items, and the statements per part are capped at the wire's limits", () => {
  const many = run(answerOf(...["A", "B", "C", "D", "E", "F", "G", "H"].map((name) => item({ name: `Condition ${name}` }))));
  assertEquals(many.items.length, MAX_ITEMS);
  assertEquals(many.drops, 2);
  const f = stmt("CRP was 7.9 mg/L on 2025-12-09, above the printed range 0 - 5.", "r2");
  const big = run(answerOf(item({ fits: [f, f, f, f, f, f], does_not_explain: [f, f, f, f, f], not_in_record: ["Term one", "Term two", "Term three", "Term four", "Term five"] })));
  assertEquals([big.items[0].fits.length, big.items[0].does_not_explain.length, big.items[0].not_in_record.length], [4, 3, 3]);
  DiagnosisItem.parse(big.items[0]);
});

Deno.test("not_enough shows nothing, whatever items the model also wrote", () => {
  const v = run({ ...GOOD, not_enough: true });
  assertEquals([v.items, v.failures, v.drops], [[], [], 0]);
});

Deno.test("extra keys the model writes (score, rank, probability) never reach the answer", () => {
  const dirty = answerOf({ ...item(), score: 0.9, rank: 1, probability: "high" } as never);
  (dirty.items[0].fits[0] as Record<string, unknown>).confidence = 0.8;
  const v = run(dirty);
  assertEquals(Object.keys(v.items[0]).sort(), ["does_not_explain", "fits", "name", "not_in_record"]);
  assertEquals(Object.keys(v.items[0].fits[0]).sort(), ["cites", "text"]);
  // and the model's own schema drops unknown keys on the way in
  assertEquals("score" in ModelDiagnoses.parse(dirty).items[0], false);
});

Deno.test("the wire schema is strict: an extra key on the response, an item, a statement or the counts is refused; limits hold", () => {
  const good = {
    run_id: U(90), status: "ok" as const, truncated: false, created_at: "2026-11-15T08:00:00.000Z",
    counts: { facts: 8, items: 1, citations: 1, guard_drops: 0, errors: 0 },
    items: [{ name: "Gout", fits: [{ text: "CRP was 7.9 mg/L on 2025-12-09.", cites: [`r:${U(2)}`] }], does_not_explain: [], not_in_record: [] }],
  };
  assertEquals(DiagnosesResponse.safeParse(good).success, true);
  const bad = (f: (x: typeof good) => unknown) => DiagnosesResponse.safeParse(f(structuredClone(good))).success;
  for (const key of ["score", "rank", "probability", "confidence", "likelihood"]) {
    assertEquals(bad((x) => ({ ...x, [key]: 1 })), false, `response.${key}`);
    assertEquals(bad((x) => ({ ...x, items: [{ ...x.items[0], [key]: 1 }] })), false, `item.${key}`);
    assertEquals(bad((x) => ({ ...x, items: [{ ...x.items[0], fits: [{ ...x.items[0].fits[0], [key]: 1 }] }] })), false, `statement.${key}`);
    assertEquals(bad((x) => ({ ...x, counts: { ...x.counts, [key]: 1 } })), false, `counts.${key}`);
  }
  assertEquals(bad((x) => ({ ...x, items: Array.from({ length: 7 }, () => x.items[0]) })), false); // more than six
  assertEquals(bad((x) => ({ ...x, items: [{ ...x.items[0], fits: [] }] })), false); // a card always has a fit
  assertEquals(DiagnosisStatement.safeParse({ text: "x", cites: [] }).success, false); // and a citation
  assertEquals(bad((x) => ({ ...x, items: [{ ...x.items[0], name: "n".repeat(81) }] })), false);
  assertEquals(bad((x) => ({ ...x, status: "maybe" })), false);
});

Deno.test("fold: case, accents, final sigma, punctuation", () => {
  assertEquals(fold("Anti-CCP"), "anti ccp");
  assertEquals(fold("  ΠΡΩΤΕΪΝΗ  "), "πρωτεινη");
  assertEquals(fold("ΜΑΡΙΑΣ"), fold("Μαρίας"));
  assertEquals(fold("μαρίασ"), fold("μαρίας")); // a sigma typed at the end of a word is the same term as the final sigma
  assertEquals(fold("x_ray, (knee)"), "x ray knee");
});

Deno.test("better: more verified items wins, then fewer removals, else the first", () => {
  const one = run(answerOf(item()));
  const two = run(answerOf(item(), item({ name: "Osteoarthritis" })));
  assertEquals(better(one, two), two);
  assertEquals(better(two, one), two);
  const clean = run(answerOf(item()));
  const dirty = run(answerOf(item({ fits: [item().fits[0], stmt("CRP was 99.", "r2")] })));
  assertEquals(better(dirty, clean), clean);
  assertEquals(better(clean, dirty), clean);
  assertEquals(better(clean, run(answerOf(item()))), clean);
});

Deno.test("M1: more cites than the wire allows never reaches the client: trimmed to 6 when the first 6 carry the numbers, dropped when they do not", () => {
  const all = ["r1", "r2", "r3", "r4", "f1", "f2", "d1"]; // seven distinct, valid ids
  const kept = run(answerOf(item({ fits: [stmt("CRP was 18.4 mg/L on 2025-05-14, above the printed range 0 - 5.", ...all)] })));
  assertEquals(kept.items[0].fits[0].cites.length, 6);
  assertEquals(kept.items[0].fits[0].cites[0], `r:${U(1)}`);
  // the number sits on the line the trim removes: the statement no longer verifies
  const lost = run(answerOf(item({ fits: [stmt("The diary says severity 6.", "r1", "r2", "r3", "r4", "f1", "f2", "d1")] })));
  assertEquals(lost.items.length, 0);
  // whatever is kept parses on the wire
  assertEquals(DiagnosisItem.safeParse(kept.items[0]).success, true);
});

Deno.test("M2: the bare-id rule drops a record id in the text, not an ordinary term such as vitamin D3", () => {
  const ok = (text: string, ...c: string[]) => run(answerOf(item({ fits: [stmt(text, ...c)] }))).items.length;
  assertEquals(ok("CRP was 7.9 mg/L on 2025-12-09 (see r2).", "r2"), 0); // r2 is this record's id
  assertEquals(ok("CRP was 7.9 mg/L on 2025-12-09, see d1.", "r2"), 0);
  assertEquals(ok("CRP was 7.9 mg/L on 2025-12-09; vitamin D3 and f8 were not measured.", "r2"), 1); // d3, f8 are not ids here
  assertEquals(ok("CRP was 7.9 mg/L on 2025-12-09; vitamin d3 is not on any line.", "r2"), 1); // even lowercase after "vitamin"
});

Deno.test("the model-side schema carries no size bound at any level (Gemini answers 400 to nested bounded arrays)", () => {
  const js = JSON.stringify(responseSchemaOf(ModelDiagnoses));
  for (const k of ["maxItems", "maxLength", "minItems", "minLength"]) assertEquals(js.includes(k), false, k);
});

Deno.test("an answer over every old model bound still goes through verify and parses as the wire contract", () => {
  const over = answerOf(
    ...Array.from({ length: 9 }, (_, n) =>
      item({
        name: n === 0 ? "Long".padEnd(130, "x") : `Condition ${String.fromCharCode(65 + n)}`, // item 0: 130 characters, over the wire's 80 -> dropped
        fits: [stmt("CRP was 7.9 mg/L. ".repeat(40), "r2"), ...Array.from({ length: 9 }, () => stmt("CRP was 7.9 mg/L on 2025-12-09, above the printed range 0 - 5.", "r2", "r2", "r3", "r4", "r1", "f1", "f2", "d1", "r2"))],
        not_in_record: Array.from({ length: 7 }, (_, k) => `term ${k}`.padEnd(110, "y")),
      })),
  );
  const v = run(over);
  const out = DiagnosesResponse.parse({
    run_id: crypto.randomUUID(), status: "ok", items: v.items, truncated: false,
    counts: { facts: facts.size, items: v.items.length, citations: citationCount(v.items), guard_drops: v.drops, errors: 0 }, created_at: new Date().toISOString(),
  });
  assertEquals(out.items.length, MAX_ITEMS); // 8 good items, first 6 by name
  assertEquals(v.items.every((i) => i.fits.length <= 4 && i.fits[0].cites.length <= 6 && i.not_in_record.length === 0), true);
});
