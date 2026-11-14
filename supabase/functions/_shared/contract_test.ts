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
  ["demoLoginPatient", C.DemoLoginResponse, F.demoLoginPatient],
  ["demoLoginDoctor", C.DemoLoginResponse, F.demoLoginDoctor],
  ["docCreate", C.DocCreateResponse, F.docCreate],
  ["extractDraft", C.ExtractResponse, F.extractDraft],
  ["extractRefusedName", C.ExtractResponse, F.extractRefusedName],
  ["extractRefusedId", C.ExtractResponse, F.extractRefusedId],
  ["extractRefusedUnreadable", C.ExtractResponse, F.extractRefusedUnreadable],
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
  assertEquals(Object.keys(C.FUNCTIONS).length, 13);
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
