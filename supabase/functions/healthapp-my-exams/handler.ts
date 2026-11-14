// healthapp-my-exams (MIN-4556; CTO decision on MIN-4555): the patient's own uploads, one row each, newest first,
// and the stored draft of one of them for the review. No model, nothing written except the sweep of rows that
// are stuck (reading over 3 minutes, queued over 10 minutes), which every list call runs first for the caller.
// A row carries a status, a reason code and, once read, a kind, a date and a count: no value, no mark, no name.
import { DocumentRow, type ExamDraftResponse, MyExamsRequest, type MyExamsResponse } from "../_shared/contract.ts";
import { type Auth, authenticate, readJson, type Store, toListItem } from "../_shared/docs.ts";
import { fail, headersFor, json } from "../_shared/http.ts";

export interface Deps {
  auth: Auth;
  store: Pick<Store, "roleOf" | "sweepStuck" | "listOwn" | "getOwn">;
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
      // The review beside the photo: what extract-exam used to answer, read from the stored draft.
      const st = await deps.store.getOwn(who.env, who.uid, parsed.data.doc_id);
      if (!st || st.document.status !== "draft" || !st.document.kind) return fail(req, 404, "not_found", "No draft to review.");
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
      deps.log({ fn: "my-exams", status: "draft", results: st.results.length, findings: st.findings.length, ms: deps.now() - started });
      return json(req, 200, out);
    }

    const swept = await deps.store.sweepStuck(who.env, who.uid);
    const rows = await deps.store.listOwn(who.env, who.uid);
    const out: MyExamsResponse = { exams: rows.map(toListItem), server_now: new Date(deps.now()).toISOString() };
    deps.log({ fn: "my-exams", status: "list", exams: rows.length, swept, ms: deps.now() - started });
    return json(req, 200, out);
  };
}
