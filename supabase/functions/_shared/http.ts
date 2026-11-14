// Shared response helpers for healthapp functions: CORS, no-store, the contract's error body.
import { corsHeaders } from "./cors.ts";
import type { ErrorCode } from "./contract.ts";

export function headersFor(req: Request): Record<string, string> {
  return { ...corsHeaders(req), "Cache-Control": "no-store", "Content-Type": "application/json" };
}

export function json(req: Request, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: headersFor(req) });
}

export function fail(req: Request, status: number, code: ErrorCode, message: string): Response {
  return json(req, status, { error: { code, message } });
}

export async function sha256Hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Compare two secrets without leaking where they differ (both are hashed first). */
export async function sameSecret(a: string, b: string): Promise<boolean> {
  const [x, y] = await Promise.all([sha256Hex(a), sha256Hex(b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

/** A hash of the caller's address, for rate limits. Never stored or logged in clear. */
export function clientAddress(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return (xff ? xff.split(",")[0] : req.headers.get("cf-connecting-ip") ?? "unknown").trim();
}
