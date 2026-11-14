import { corsHeaders } from "../_shared/cors.ts";
import { readEnv } from "../_shared/env.ts";

// No session, no database, no secrets: proves the page can reach a function.
export function handle(req: Request): Response {
  const headers = {
    ...corsHeaders(req),
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
  };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  const env = readEnv(req);
  if (!env) {
    return new Response(JSON.stringify({ ok: false, error: "x-healthapp-env must be dev or demo" }), {
      status: 400,
      headers,
    });
  }
  return new Response(JSON.stringify({ ok: true, env }), { status: 200, headers });
}
