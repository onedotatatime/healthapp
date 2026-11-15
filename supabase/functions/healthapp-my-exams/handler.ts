// healthapp-my-exams (MIN-4556; CTO decision on MIN-4555): the patient's own uploads, one row each, newest first,
// and the stored draft or saved exam of one of them. No model. Nothing is written except the sweep of rows that are stuck
// (reading over 3 minutes, queued over 10 minutes), which every list call runs first for the caller, and the `unchecked`
// mark an owner clears by opening a saved exam. A row carries a status, a reason code, once read a kind, a date and a
// count, and for a saved exam whether it is still unchecked: no value, no name.
// MIN-4637: every list call also deletes the caller's kept refused originals whose 14 days have passed (the lazy
// retention sweep): the object through the storage API first, the row's file columns second, so a failed delete leaves
// the row pointing at its object for the next call. No SQL ever touches storage's own tables for this.
import { bucketFor, DocumentRow, type ExamDraftResponse, type HealthappEnv, MyExamsRequest, type MyExamsResponse } from "../_shared/contract.ts";
import { type Auth, authenticate, type Blobs, readJson, type Store, toListItem } from "../_shared/docs.ts";
import { fail, headersFor, json } from "../_shared/http.ts";

export interface Deps {
  auth: Auth;
  store: Pick<Store, "roleOf" | "sweepStuck" | "listOwn" | "getOwn" | "markOpened" | "expiredKeptFiles" | "dropKeptFile">;
  /** Delete only, for the retention sweep (MIN-4637). */
  blobs: Pick<Blobs, "remove">;
  log(line: Record<string, unknown>): void;
  now(): number;
}

const NO_CONFIDENCE = { exam_date: null, issuer: null, printed_name: null, printed_id: null };

export function makeHandler(deps: Deps) {
  return async function handle(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headersFor(req) });
    if (req.method !== "POST") return fail(req, 400, "bad_request", "POST only");
    const started = deps.now();
    const who = await authenticate(req, deps, ["patient"]);
    if (who instanceof Response) return who;
    const body = await readJson(req);
    if (!body.ok) return fail(req, 400, "bad_request", "body must be JSON");
    const parsed = MyExamsRequest.safeParse(body.body);
    if (!parsed.success) return fail(req, 400, "bad_request", "doc_id must be a document id");

    if (parsed.data.doc_id) {
      // The exam beside the photo: what extract-exam used to answer, read from the stored row. A draft opens the review;
      // a saved exam answers the same shape, read-only, and opening it is what clears its `unchecked` mark (MIN-4555 addendum).
      const st = await deps.store.getOwn(who.env, who.uid, parsed.data.doc_id);
      const open = st && (st.document.status === "draft" || st.document.status === "confirmed") && st.document.kind;
      if (!st || !open) return fail(req, 404, "not_found", "No exam to open.");
      const cleared = st.document.status === "confirmed" && st.document.unchecked && await deps.store.markOpened(who.env, who.uid, st.document.id);
      if (cleared) st.document = { ...st.document, unchecked: false };
      const out: ExamDraftResponse = {
        draft: {
          document: DocumentRow.parse(st.document),
          printed_name: st.meta.printed_name,
          printed_id: st.meta.printed_id,
          header_confidence: st.meta.header_confidence ?? NO_CONFIDENCE,
          results: st.results.map(({ patient_id: _p, ...r }) => r),
          findings: st.findings.map(({ patient_id: _p, ...f }) => f),
        },
      };
      deps.log({ fn: "my-exams", status: st.document.status, opened: cleared, results: st.results.length, findings: st.findings.length, ms: deps.now() - started });
      return json(req, 200, out);
    }

    const swept = await deps.store.sweepStuck(who.env, who.uid);
    const kept = await sweepKeptFiles(deps, who.env, who.uid);
    const rows = await deps.store.listOwn(who.env, who.uid);
    const out: MyExamsResponse = { exams: rows.map((r) => toListItem(r)), server_now: new Date(deps.now()).toISOString() };
    deps.log({
      fn: "my-exams", status: "list", exams: rows.length, swept, kept_deleted: kept.deleted, kept_not_deleted: kept.not_deleted,
      ms: deps.now() - started,
    });
    return json(req, 200, out);
  };
}

/** The retention sweep for one caller: counts only. A delete the storage refused is left for the next call. Defined after
 *  makeHandler so the session check is the first thing in the file. */
async function sweepKeptFiles(deps: Deps, env: HealthappEnv, uid: string): Promise<{ deleted: number; not_deleted: number }> {
  let deleted = 0, notDeleted = 0;
  for (const f of await deps.store.expiredKeptFiles(env, uid)) {
    if (await deps.blobs.remove(bucketFor(env), f.storage_path)) {
      if (await deps.store.dropKeptFile(env, uid, f.id, f.storage_path)) deleted++;
    } else notDeleted++;
  }
  return { deleted, not_deleted: notDeleted };
}
