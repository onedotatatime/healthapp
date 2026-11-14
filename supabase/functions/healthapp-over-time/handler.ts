// healthapp-over-time (MIN-4551; CTO decision on MIN-4548): a doctor's view of one patient's numbers over
// time. A doctor with a live grant only: a patient gets 403 wrong_role, an ended, refused, revoked or
// somebody else's grant gets 403 grant_expired and no row is read. Plain arithmetic in _shared/overtime.ts:
// no model, nothing stored. Each call logs ONE line with five integers and nothing else (no id, name, value
// or date), so the counts can be read from the function logs without reading the record.
import { OverTimeRequest, type OverTimeResponse } from "../_shared/contract.ts";
import { type Auth, authenticate, readJson, type Store } from "../_shared/docs.ts";
import { fail, headersFor, json } from "../_shared/http.ts";
import { type AssistantStore } from "../_shared/assistant_pg.ts";
import { type Counts, overTime } from "../_shared/overtime.ts";

export interface Deps {
  auth: Auth;
  store: Pick<Store, "roleOf"> & AssistantStore;
  log(line: Record<string, unknown>): void;
}

const ZERO: Counts = { records_read: 0, values_with_series: 0, projections_computed: 0, series_excluded: 0, errors: 0 };
const ended = (req: Request) => fail(req, 403, "grant_expired", "Access to this patient's record has ended.");

export function makeHandler(deps: Deps) {
  const log = (c: Counts) =>
    deps.log({
      fn: "over-time",
      records_read: c.records_read,
      values_with_series: c.values_with_series,
      projections_computed: c.projections_computed,
      series_excluded: c.series_excluded,
      errors: c.errors,
    });
  return async function handle(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headersFor(req) });
    if (req.method !== "POST") return fail(req, 400, "bad_request", "POST only");
    const who = await authenticate(req, deps, ["doctor"]);
    if (who instanceof Response) return who;
    const body = await readJson(req);
    if (!body.ok) return fail(req, 400, "bad_request", "body must be JSON");
    const parsed = OverTimeRequest.safeParse(body.body);
    if (!parsed.success) return fail(req, 400, "bad_request", "grant_id is required");
    const { grant_id } = parsed.data;

    try {
      const grant = await deps.store.grantState(who.env, grant_id, who.uid);
      if (!grant || !grant.live) {
        log(ZERO);
        return ended(req);
      }
      const rec = await deps.store.record(who.env, grant_id, who.uid);
      if (!rec) {
        log(ZERO); // the grant ended between the two reads
        return ended(req);
      }
      const out: OverTimeResponse = overTime(rec.results);
      log(out.counts);
      return json(req, 200, out);
    } catch {
      log({ ...ZERO, errors: 1 });
      return fail(req, 500, "internal", "The numbers over time could not be read. Try again.");
    }
  };
}
