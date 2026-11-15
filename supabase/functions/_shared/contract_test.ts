// Every fixture parses against its schema; a fixture that drifts from the contract fails CI.
import { assert, assertEquals } from "jsr:@std/assert@1";
import * as C from "./contract.ts";
import * as F from "./contract.fixtures.ts";

const cases: [string, { safeParse(x: unknown): { success: boolean; error?: unknown } }, unknown][] = [
  ["patientProfile", C.ProfileRow, F.patientProfile],
  ["doctorProfile", C.ProfileRow, F.doctorProfile],
  ...F.documents.map((d, i) => [`documents[${i}]`, C.DocumentRow, d] as [string, typeof C.DocumentRow, unknown]),
  ...F.results.map((r, i) => [`results[${i}]`, C.ResultRow, r] as [string, typeof C.ResultRow, unknown]),
  ...F.findings.map((r, i) => [`findings[${i}]`, C.FindingRow, r] as [string, typeof C.FindingRow, unknown]),
  ...F.diary.map((r, i) => [`diary[${i}]`, C.DiaryRow, r] as [string, typeof C.DiaryRow, unknown]),
  ["fileAnalysisDone", C.FileAnalysisRow, F.fileAnalysisDone],
  ["fileAnalysisFailed", C.FileAnalysisRow, F.fileAnalysisFailed],
  ["analyseDone", C.AnalyseResponse, F.analyseDone],
  ["demoLoginPatient", C.DemoLoginResponse, F.demoLoginPatient],
  ["demoLoginDoctor", C.DemoLoginResponse, F.demoLoginDoctor],
  ["docCreate", C.DocCreateResponse, F.docCreate],
  ["extractDraft", C.ExtractResponse, F.extractDraft],
  ["extractRefusedName", C.ExtractResponse, F.extractRefusedName],
  ["extractRefusedId", C.ExtractResponse, F.extractRefusedId],
  ["extractRefusedUnreadable", C.ExtractResponse, F.extractRefusedUnreadable],
  ["extractQueued", C.ExtractResponse, F.extractQueued],
  ["myExams", C.MyExamsResponse, F.myExams],
  ["examDraft", C.ExamDraftResponse, F.examDraft],
  ["examConfirmedOpen", C.ExamDraftResponse, F.examConfirmedOpen],
  ["unconfirmed", C.UnconfirmDocResponse, F.unconfirmed],
  ["examDeleted", C.ExamDeleteResponse, F.examDeleted],
  ["confirmDoc", C.ConfirmDocResponse, F.confirmDoc],
  ["docPhoto", C.DocPhotoResponse, F.docPhoto],
  ["handshakeCreate", C.HandshakeCreateResponse, F.handshakeCreate],
  ["grantPending", C.HandshakeClaimResponse, F.grantPending],
  ["grantActive", C.GrantDecideResponse, F.grantActive],
  ["grantRevoked", C.GrantRevokeResponse, F.grantRevoked],
  ["grantStatusNone", C.GrantStatusResponse, F.grantStatusNone],
  ["assistantAsk", C.AssistantResponse, F.assistantAsk],
  ["assistantNotInRecord", C.AssistantResponse, F.assistantNotInRecord],
  ["assistantCauses", C.AssistantResponse, F.assistantCauses],
  ["diagnosesOk", C.DiagnosesResponse, F.diagnosesOk],
  ["diagnosesNone", C.DiagnosesResponse, F.diagnosesNone],
  ["diagnosesOff", C.DiagnosesResponse, F.diagnosesOff],
  ["errorGrantExpired", C.ErrorBody, F.errorGrantExpired],
  ["errorTokenExpired", C.ErrorBody, F.errorTokenExpired],
  ["errorBadPasscode", C.ErrorBody, F.errorBadPasscode],
  ["errorRateLimited", C.ErrorBody, F.errorRateLimited],
  ["possibleMatchesMaria", C.PossibleMatchesResponse, F.possibleMatchesMaria],
  ["possibleMatchesEmpty", C.PossibleMatchesResponse, F.possibleMatchesEmpty],
  ["matchesOptInOn", C.MatchesOptIn, F.matchesOptInOn],
  ["matchesOptInOff", C.MatchesOptIn, F.matchesOptInOff],
];

Deno.test("every fixture parses against its schema", () => {
  for (const [name, schema, value] of cases) {
    const r = schema.safeParse(value);
    assert(r.success, `${name}: ${JSON.stringify(r.error)}`);
  }
});

Deno.test("every cite id in the assistant fixtures resolves to a fixture row", () => {
  const rows = new Set([
    ...F.results.map((r) => `r:${r.id}`),
    ...F.findings.map((r) => `f:${r.id}`),
    ...F.diary.map((r) => `d:${r.id}`),
  ]);
  for (const a of [F.assistantAsk, F.assistantCauses]) {
    for (const c of [...a.segments.flatMap((s: C.Segment) => s.cites), ...a.possibilities.flatMap((p: C.Possibility) => p.cites)]) {
      assert(rows.has(c), c);
    }
  }
});

Deno.test("every cite id in the diagnoses fixtures resolves to a fixture row, and the list is sorted by name", () => {
  const rows = new Set([
    ...F.results.map((r) => `r:${r.id}`),
    ...F.findings.map((r) => `f:${r.id}`),
    ...F.diary.map((r) => `d:${r.id}`),
  ]);
  const cites = F.diagnosesOk.items.flatMap((i) => [...i.fits, ...i.does_not_explain]).flatMap((s) => s.cites);
  assert(cites.length > 0 && cites.every((c) => rows.has(c)));
  const names = F.diagnosesOk.items.map((i) => i.name);
  assertEquals(names, [...names].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" })));
  assertEquals(F.diagnosesOk.counts.citations, cites.length);
  assertEquals(F.diagnosesOk.counts.items, F.diagnosesOk.items.length);
});

Deno.test("the contract refuses what the settlements forbid", () => {
  // settlement 3: short cite ids are mapped by the server, never sent
  assertEquals(C.CiteId.safeParse("r:7f3a").success, false);
  // a record_fact segment shape with a numeric field on a possibility is refused (settlement 2)
  assertEquals(C.Possibility.safeParse({ label: "x", rationale: "y", cites: [] }).success, false);
  // settlement 6: the token is hs1.<22 base64url>, carried in the fragment
  assertEquals(C.HandshakeToken.safeParse("hs1.short").success, false);
  assertEquals(C.qrText("https://a.pages.dev/", "hs1.q3Zx7Kp0L9mN2bV4cX8aYw"), "https://a.pages.dev/s#hs1.q3Zx7Kp0L9mN2bV4cX8aYw");
  // the short code alphabet has no 0/O, 1/I/L
  assertEquals(C.ShortCode.safeParse("K7M3QX0R").success, false);
  assertEquals(C.ShortCode.safeParse("K7M3QXLR").success, false);
  // confirm-doc has no field for name or ID
  const parsed = C.ConfirmDocRequest.parse({ doc_id: F.IDS.docDraft, printed_name: "X", printed_id: "Y" });
  assertEquals("printed_name" in parsed || "printed_id" in parsed, false);
  // claim takes a token or a code
  assertEquals(C.HandshakeClaimRequest.safeParse({}).success, false);
  // an unknown env is refused
  assertEquals(C.HealthappEnv.safeParse("prod").success, false);
  // diary insert cannot carry recorded_at or a patient id
  const d = C.DiaryInsert.parse({ text: "a", severity: 3, recorded_at: "x", patient_id: F.IDS.doctor });
  assertEquals(Object.keys(d).sort(), ["severity", "text"]);
});

Deno.test("the function table names every P0 function with the healthapp- prefix", () => {
  for (const name of Object.keys(C.FUNCTIONS)) assert(name.startsWith("healthapp-"), name);
  assertEquals(Object.keys(C.FUNCTIONS).length, 14);
});

Deno.test("possible matches: one empty answer, nothing below country, nothing below k", () => {
  assertEquals(F.possibleMatchesEmpty, C.MATCHES_EMPTY);
  assertEquals(F.possibleMatchesMaria.match_count, F.possibleMatchesMaria.groups.reduce((s, g) => s + g.n, 0));
  const g = F.possibleMatchesMaria.groups[0];
  // a group below k, a person field, or a finer location is refused
  assertEquals(C.MatchGroup.safeParse({ ...g, n: C.MATCH_K - 1 }).success, false);
  assertEquals(C.MatchGroup.safeParse({ ...g, id: "syn-0001" }).success, false);
  assertEquals(C.MatchGroup.safeParse({ ...g, countries: ["GR-Athens"] }).success, false);
  assertEquals(C.MatchGroup.safeParse({ ...g, label: "real" }).success, false);
  assertEquals(C.MatchGroup.safeParse({ ...g, pattern: g.pattern.slice(0, C.MATCH_MIN_SHARED - 1) }).success, false);
  assertEquals(Object.keys(C.RPCS).sort(), [
    "healthapp_get_matches_opt_in",
    "healthapp_possible_matches",
    "healthapp_set_matches_opt_in",
  ]);
});

// MIN-4637 criterion 15: the list item is the same in Cron's contract and the frontend copy, field for field
Deno.test("ExamListItem is identical in both contract copies", () => {
  const block = (f: string) => {
    const s = Deno.readTextFileSync(new URL(f, import.meta.url));
    return s.slice(s.indexOf("export const ExamListItem = z.object({"), s.indexOf("export type ExamListItem"));
  };
  const server = block("./contract.ts"), web = block("../../../src/api/contract.ts");
  assertEquals(server.includes("file_kept: z.boolean().default(false),"), true);
  assertEquals(web, server);
});

Deno.test("the list fixture holds one refused row with its file kept and one without", () => {
  const refused = F.myExams.exams.filter((e) => e.status === "refused");
  assertEquals(refused.map((e) => [e.file_kept, e.can_retry]).sort(), [[false, false], [true, true]]);
  assertEquals(F.myExams.exams.filter((e) => e.status !== "refused").every((e) => e.file_kept === false), true);
});

// MIN-4637 (CTO must-fix 1): the client parses my-exams strictly, so an answer from a function that does not send file_kept yet
// must still parse, and as false.
Deno.test("an exam list item without file_kept parses as false; one with it keeps it", () => {
  const { file_kept: _drop, ...old } = F.myExams.exams.find((e) => e.status === "refused" && e.file_kept)!;
  const without = C.ExamListItem.safeParse(old);
  assertEquals(without.success, true);
  assertEquals(without.success && without.data.file_kept, false);
  const full = C.MyExamsResponse.safeParse({ exams: [old, F.myExams.exams.find((e) => e.file_kept)], server_now: F.myExams.server_now });
  assertEquals(full.success && full.data.exams.map((e) => e.file_kept), [false, true]);
});
