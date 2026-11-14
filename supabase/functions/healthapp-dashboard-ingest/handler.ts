// healthapp-dashboard-ingest: the Mac pushes one snapshot (MIN-4456).
// Gateway JWT (anon key as bearer) stays on; then the dedicated push key. No CORS: only the Mac calls this.
import { type Deps, KEY_HEADER, keysMatch, MAX_BODY_BYTES, readCapped, readKeys, reply, SECRET_RE } from "../_shared/dashboard.ts";

export function makeHandler(deps: Deps) {
  return async function handle(req: Request): Promise<Response> {
    if (req.method !== "POST") return reply(405, { ok: false, error: "POST only" }, { Allow: "POST" });
    const keys = readKeys(deps.env);
    if (!keys) return reply(503, { ok: false, error: "not configured" });
    if (!(await keysMatch(req.headers.get(KEY_HEADER), keys.push))) {
      return reply(401, { ok: false, error: "unauthorized" });
    }
    const raw = await readCapped(req, MAX_BODY_BYTES);
    if (raw === null) return reply(413, { ok: false, error: "body over 256 KB" });
    let text: string;
    let doc: unknown;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(raw);
      doc = JSON.parse(text);
    } catch {
      return reply(400, { ok: false, error: "body is not valid JSON" });
    }
    if (typeof doc !== "object" || doc === null || (doc as { schema?: unknown }).schema !== 1) {
      return reply(400, { ok: false, error: "schema must be 1" });
    }
    if (SECRET_RE.test(text)) return reply(400, { ok: false, error: "body looks like it holds a key" });
    const receivedAt = deps.now().toISOString();
    try {
      await deps.store.put(JSON.stringify({ ...(doc as Record<string, unknown>), receivedAt }));
    } catch {
      console.error("healthapp-dashboard-ingest: storage write failed");
      return reply(502, { ok: false, error: "storage write failed" });
    }
    return reply(200, { ok: true, receivedAt });
  };
}
