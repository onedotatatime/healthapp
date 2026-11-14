// Static boundaries for the scan-next functions (MIN-4556; CTO decision on MIN-4555 §1, §4, §6): the list and the
// delete call no model, the refusal path keeps nothing, the kick answers before it reads, and the reader of
// a photo stays in exactly the two functions PRD 10.6 control 1 names. A scan of executable text (comments stripped).
import { assertEquals } from "jsr:@std/assert@1";

const ROOT = new URL("../", import.meta.url);
const code = (p: string) =>
  Deno.readTextFileSync(new URL(p, ROOT)).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\s\/\/.*$/gm, "");
const NEW = ["healthapp-my-exams", "healthapp-exam-delete", "healthapp-unconfirm-doc"];
const FILES = NEW.flatMap((n) => [`${n}/handler.ts`, `${n}/index.ts`]);

Deno.test("N1 control 1: the list, the delete and the unconfirm import nothing that calls a model", () => {
  for (const f of FILES) {
    const src = code(f);
    assertEquals(/model\.ts|generateJson|GEMINI|fetch\(|extract\.ts|analysis\.ts/.test(src), false, f);
    for (const m of src.matchAll(/(?:from\s+|import\s*\(?\s*)["']([^"']+)["']/g)) assertEquals(/model|extract|analysis/.test(m[1]), false, `${f}: ${m[1]}`);
  }
});

Deno.test("N1 control 1: of every function, only extract-exam and assistant import the model module", () => {
  const callers: string[] = [];
  for (const e of Deno.readDirSync(ROOT)) {
    if (!e.isDirectory || !e.name.startsWith("healthapp-")) continue;
    for (const f of Deno.readDirSync(new URL(`${e.name}/`, ROOT))) {
      if (!f.name.endsWith(".ts") || f.name.endsWith("_test.ts")) continue;
      if (/model\.ts|generateJson/.test(code(`${e.name}/${f.name}`))) { callers.push(e.name); break; }
    }
  }
  assertEquals(callers.sort(), ["healthapp-assistant", "healthapp-extract-exam"]);
});

Deno.test("env reads in the two new functions: SUPABASE_* names only, by literal", () => {
  for (const f of FILES) for (const m of code(f).matchAll(/Deno\.env\.get\(\s*([^)]*)\)/g)) assertEquals(/^"SUPABASE_[A-Z_]+"$/.test(m[1].trim()), true, `${f}: ${m[1]}`);
});

Deno.test("the list's answer shape has no value, name or verdict field (its one mark is the row's `unchecked`)", () => {
  const src = code("_shared/contract.ts");
  const block = src.slice(src.indexOf("export const ExamListItem"), src.indexOf("export type ExamListItem"));
  assertEquals(block.includes("z.object({"), true);
  assertEquals(/printed|value_num|value_text|flag|analyte|full_name|mismatch|score|cause|advice|diagnos|storage_path|sha256/i.test(block), false);
});

Deno.test("the kick answers before it reads: the response is built from the claim, and the reading is only handed to background()", () => {
  const src = code("healthapp-extract-exam/handler.ts");
  const handle = src.slice(src.indexOf("export function makeHandler"), src.indexOf("const FAIL_OF"));
  // inside the request handler the only model, download or analysis work is the call handed to background()
  assertEquals(/deps\.generate\(|deps\.blobs\.|analyseFile\(|saveExtraction\(/.test(handle.replace("analyseFile(deps, { env: who.env, patientId: who.uid, state: cur", "")), false);
  assertEquals(handle.includes("deps.background(readInBackground("), true);
  assertEquals(handle.includes('json(req, 202, out)'), true);
  assertEquals(handle.includes("claimForReading("), true);
});

Deno.test("a refusal deletes the file first and writes the row second; a failed delete is failed, never refused", () => {
  const src = code("healthapp-extract-exam/handler.ts");
  const refused = src.slice(src.indexOf("const refused = async"), src.indexOf("try {", src.indexOf("const refused = async")));
  const at = (s: string) => refused.indexOf(s);
  assertEquals(at("deps.blobs.remove(") > 0 && at("deps.blobs.remove(") < at("deps.store.markRefused("), true);
  assertEquals(refused.includes('failed("delete_failed"'), true);
});

Deno.test("the store clears the whole row on a refusal in one statement, and the table refuses a refused row that keeps anything", () => {
  const pg = code("_shared/pgstore.ts");
  const stmt = pg.slice(pg.indexOf("async markRefused"), pg.indexOf("async markFailed"));
  for (const col of ["storage_path", "content_type", "sha256_file", "sha256_record", "kind", "language", "exam_date", "issuer", "printed_name", "printed_id", "identity_status", "extract_confidence"]) {
    assertEquals(new RegExp(`${col} = null`).test(stmt), true, col);
  }
  const sql = Deno.readTextFileSync(new URL("../../sql/015_scan_next.sql", import.meta.url));
  for (const col of ["storage_path", "content_type", "sha256_file", "sha256_record", "kind", "language", "exam_date", "issuer", "printed_name", "printed_id", "identity_status", "extract_confidence"]) {
    assertEquals(new RegExp(`${col} is null`).test(sql.slice(sql.indexOf("documents_refused_empty"))), true, col);
  }
});

Deno.test("the claim and the sweep are single statements, and the migration leaves every policy alone", () => {
  const pg = code("_shared/pgstore.ts");
  const claim = pg.slice(pg.indexOf("async claimForReading"), pg.indexOf("async markRefused"));
  assertEquals(/update \$\{S\}\.documents set status = 'reading'[\s\S]*returning id/.test(claim), true);
  assertEquals(/read_attempts < \$3::int/.test(claim), true);
  const sql = Deno.readTextFileSync(new URL("../../sql/015_scan_next.sql", import.meta.url));
  assertEquals(/policy|grant |revoke |enable row level security/i.test(sql.replace(/--.*$/gm, "")), false);
});

// The real statements are exercised against a real Postgres (dev, rolled-back rows, 2026-11-14); the fake store
// cannot catch a wrong WHERE, so each one is also pinned here by the part of it that carries the rule.
Deno.test("the store's statements carry their rule: who, which statuses, and the table's default", () => {
  const pg = code("_shared/pgstore.ts");
  const part = (from: string, to: string) => pg.slice(pg.indexOf(from), pg.indexOf(to, pg.indexOf(from) + 1));
  const claim = part("async claimForReading", "async markRefused");
  assertEquals(claim.includes("(status in ('queued', 'failed') or (status = 'draft' and kind is null))"), true);
  assertEquals(claim.includes("patient_id = $2::uuid"), true);
  assertEquals(part("async saveExtraction", "async deleteUnsaved").includes("where id = $1 and patient_id = $2 and status = 'reading' returning id"), true);
  assertEquals(part("async deleteUnsaved", "async confirm").includes("patient_id = $2::uuid and status <> 'confirmed' returning id"), true);
  assertEquals(part("async listOwn", "async saveExtraction").includes("from ${S}.documents d where d.patient_id = $1::uuid order by d.created_at desc"), true);
  assertEquals(part("async markFailed", "async sweepStuck").includes("and status = 'reading'"), true);
  assertEquals(part("async sweepStuck", "async listOwn").includes("where d.patient_id = $1::uuid"), true);
  assertEquals(part("async createDraft", "getOwn(env").includes("values ($1, $2, 'queued', $3, $4)"), true);
});

// --- MIN-4555 addendum: saved with no tap, the mark, the unconfirm ------------------------------------------------
const sqlText = (f: string) => Deno.readTextFileSync(new URL(`../../sql/${f}`, import.meta.url)).replace(/--.*$/gm, "");

Deno.test("one path writes `confirmed`: the store's confirm. The automatic save, the patient's confirm and the unconfirm all go through or around it, never beside it", () => {
  const writers: string[] = [];
  const walk = (dir: URL) => {
    for (const e of Deno.readDirSync(dir)) {
      if (e.isDirectory) walk(new URL(`${e.name}/`, dir));
      else if (e.name.endsWith(".ts") && !e.name.endsWith("_test.ts") && !e.name.startsWith("testkit")) {
        const src = code(new URL(e.name, dir).pathname.slice(new URL(ROOT).pathname.length));
        if (/set[^`;]*status = 'confirmed'/.test(src)) writers.push(e.name);
      }
    }
  };
  walk(ROOT);
  assertEquals(writers, ["pgstore.ts"]);
  const pg = code("_shared/pgstore.ts");
  assertEquals((pg.match(/status = 'confirmed',/g) ?? []).length, 1); // and one statement in it
  const handler = code("healthapp-extract-exam/handler.ts");
  assertEquals(/status = 'confirmed'|"confirmed"\s*\)|status: "confirmed"/.test(handler.replace(/status: kept \? "confirmed" : "draft"/, "")), false);
  assertEquals(handler.includes("autoConfirmable(built.draft)"), true);
  assertEquals(handler.includes("planConfirm(s, ConfirmDocRequest.parse("), true); // the plan is the patient's own, not a copy
  assertEquals(handler.includes("store.confirm("), false); // the store confirms inside the save, not a second call after a visible draft
});

Deno.test("the store's statements carry the mark: confirm sets it from the caller, unconfirm and open clear it, only on the owner's confirmed row", () => {
  const pg = code("_shared/pgstore.ts");
  const part = (from: string, to?: string) => pg.slice(pg.indexOf(from), to ? pg.indexOf(to, pg.indexOf(from) + 1) : undefined);
  assertEquals(pg.includes("unchecked = $4::boolean"), true); // in writeConfirm, the one writer
  assertEquals(part("async confirm(").includes("writeConfirm(tx, S, docId, outcome.plan, opts?.unchecked === true)"), true);
  const save = part("async saveExtraction(", "async deleteUnsaved(");
  assertEquals(save.includes("writeConfirm(tx, S, docId, o.plan, true)"), true); // automatic: marked
  assertEquals(save.indexOf("writeConfirm(") > save.indexOf("insert into ${S}.findings"), true); // after the rows are in, same transaction
  const un = part("async unconfirm(", "async markOpened(");
  assertEquals(un.includes("set status = 'draft', confirmed_at = null, unchecked = false where id = $1::uuid and patient_id = $2::uuid and status = 'confirmed'"), true);
  assertEquals(un.includes("[docId, patientId], true)"), true); // the row is locked in the transaction
  const opened = part("async markOpened(", "async confirm(");
  assertEquals(opened.includes("set unchecked = false where id = $1::uuid and patient_id = $2::uuid and status = 'confirmed' and unchecked"), true);
  assertEquals(part("async listOwn(", "async saveExtraction(").includes("d.unchecked"), true);
});

Deno.test("016 adds the mark and nothing else: a column, default false, no policy, grant or constraint", () => {
  const sql = sqlText("016_unchecked.sql");
  assertEquals(/alter table __SCHEMA__\.documents add column if not exists unchecked boolean not null default false;/.test(sql), true);
  assertEquals(/policy|grant |revoke |enable row level security|constraint|update |delete |insert into (?!__SCHEMA__\._applied)/i.test(sql), false);
});

Deno.test("every reader the doctor or the matching reaches filters on status = 'confirmed', so an unconfirmed exam leaves them at the next read", () => {
  // policies and SQL (002: documents, results, findings; 005: the matching; 013: file_analysis) and the two Postgres readers of the record
  const near = (src: string, what: RegExp, within = 400) => {
    let n = 0;
    for (const m of src.matchAll(what)) {
      n++;
      assertEquals(src.slice(m.index, m.index! + within).includes("status = 'confirmed'"), true, `${what} at ${m.index}`);
    }
    return n;
  };
  const core = sqlText("002_core.sql");
  assertEquals((core.match(/status = 'confirmed'/g) ?? []).length, 3);
  assertEquals(near(core, /create policy (documents|results|findings)_doctor_in_grant/g, 900), 3);
  const matches = sqlText("005_matches.sql");
  assertEquals((matches.match(/documents d on d\.id = \w\.document_id and d\.status = 'confirmed'/g) ?? []).length, 3);
  assertEquals(near(matches, /join __SCHEMA__\.documents/g, 120) , 3);
  const fa = sqlText("013_file_analysis.sql");
  assertEquals(near(fa, /documents d\b/g, 400) >= 1, true);
  const pg = code("_shared/assistant_pg.ts");
  assertEquals(near(pg, /\.documents d on/g, 300), 2); // results and findings of the grant's patient: the assistant and over-time share them
});
