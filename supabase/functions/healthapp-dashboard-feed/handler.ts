// healthapp-dashboard-feed: the page reads the last snapshot (MIN-4456).
// Gateway JWT (anon key as bearer) stays on; then the dedicated view key. CORS: the dashboard's own origin only.
import { corsHeaders, type Deps, KEY_HEADER, keysMatch, readKeys, reply } from "../_shared/dashboard.ts";

export function makeHandler(deps: Deps) {
  return async function handle(req: Request): Promise<Response> {
    const cors = corsHeaders(req, deps.env);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...cors, "Cache-Control": "no-store" } });
    if (req.method !== "GET") return reply(405, { ok: false, error: "GET only" }, { ...cors, Allow: "GET, OPTIONS" });
    const keys = readKeys(deps.env);
    if (!keys) return reply(503, { ok: false, error: "not configured" }, cors);
    if (!(await keysMatch(req.headers.get(KEY_HEADER), keys.view))) {
      return reply(401, { ok: false, error: "unauthorized" }, cors);
    }
    let text: string | null;
    try {
      text = await deps.store.get();
    } catch {
      console.error("healthapp-dashboard-feed: storage read failed");
      return reply(502, { ok: false, error: "storage read failed" }, cors);
    }
    if (text === null) return reply(404, { ok: false, error: "no snapshot yet" }, cors);
    return new Response(text, {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    });
  };
}
