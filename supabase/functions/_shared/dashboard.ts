// Shared by healthapp-dashboard-ingest and healthapp-dashboard-feed (MIN-4456, CTO decision 2).
// No Supabase import here: handlers are pure and tested with a fake store.

// Fixed by constant. Neither function reads x-healthapp-env or touches healthapp-demo.
export const BUCKET = "healthapp-dev";
export const OBJECT_PATH = "dashboard/snapshot.json";
export const KEY_HEADER = "x-dashboard-key";
export const MAX_BODY_BYTES = 256 * 1024;
export const MIN_KEY_CHARS = 32;

export interface Store {
  put(json: string): Promise<void>;
  get(): Promise<string | null>;
}

export interface Deps {
  env(name: string): string | undefined;
  store: Store;
  now(): Date;
}

// The only environment names a dashboard function may read (CTO decision 2). Enforced here, not only by grep.
const ENV_ALLOWED = /^(HEALTHAPP_DASHBOARD_|SUPABASE_)[A-Z_]*$/;
export function guardedEnv(read: (name: string) => string | undefined): Deps["env"] {
  return (name) => (ENV_ALLOWED.test(name) ? read(name) : undefined);
}

export function reply(status: number, body: unknown, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extra,
    },
  });
}

async function sha256(s: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
}

// Constant-time: both sides are hashed to 32 bytes, so neither the length nor the
// position of the first different byte reaches the clock. A missing key never matches.
export async function keysMatch(provided: string | null, expected: string): Promise<boolean> {
  const [a, b] = await Promise.all([sha256(provided ?? ""), sha256(expected)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0 && provided !== null;
}

export interface Keys {
  push: string;
  view: string;
}

// Both keys must be set, long enough and different, or the function refuses everything.
// 503 (not 401) so an unset secret never looks like a clean authorization pass.
export function readKeys(env: Deps["env"]): Keys | null {
  const push = env("HEALTHAPP_DASHBOARD_PUSH_KEY") ?? "";
  const view = env("HEALTHAPP_DASHBOARD_VIEW_KEY") ?? "";
  if (push.length < MIN_KEY_CHARS || view.length < MIN_KEY_CHARS || push === view) return null;
  return { push, view };
}

// Patterns built from pieces so a grep for key patterns does not match this definition.
export const SECRET_RE = new RegExp([
  "lin" + "_api_",
  "eyJ" + "[A-Za-z0-9_-]{30,}",
  "sb" + "_secret_",
  "sbp" + "_[A-Za-z0-9]{20,}",
  "SUPABASE_SERVICE" + "_ROLE_KEY\\s*[=:]\\s*\\S{20,}",
].join("|"));

// Reads at most `max` bytes; null means the body is bigger.
export async function readCapped(req: Request, max: number): Promise<Uint8Array | null> {
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > max) {
    await req.body?.cancel();
    return null;
  }
  if (!req.body) return new Uint8Array(0);
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.byteLength;
  }
  return out;
}

const DEFAULT_ORIGIN = "https://healthapp-dashboard.pages.dev";
const PREVIEW = /^https:\/\/[a-z0-9-]+\.healthapp-dashboard\.pages\.dev$/;

// Feed only. The dashboard's own origin, its preview subdomains, and exact origins listed
// in HEALTHAPP_DASHBOARD_ALLOWED_ORIGINS (comma separated, for the local viewer).
export function allowedOrigin(origin: string | null, env: Deps["env"]): string | null {
  if (!origin) return null;
  if (origin === DEFAULT_ORIGIN || PREVIEW.test(origin)) return origin;
  const extra = (env("HEALTHAPP_DASHBOARD_ALLOWED_ORIGINS") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return extra.includes(origin) ? origin : null;
}

export function corsHeaders(req: Request, env: Deps["env"]): Record<string, string> {
  const h: Record<string, string> = { "Vary": "Origin" };
  const o = allowedOrigin(req.headers.get("origin"), env);
  if (o) {
    h["Access-Control-Allow-Origin"] = o;
    h["Access-Control-Allow-Headers"] = `authorization, apikey, ${KEY_HEADER}, content-type, x-client-info`;
    h["Access-Control-Allow-Methods"] = "GET, OPTIONS";
    h["Access-Control-Max-Age"] = "600";
  }
  return h;
}
