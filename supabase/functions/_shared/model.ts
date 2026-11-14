// The one wrapper for every Gemini call (MIN-4471; PRD 10.1, 10.4; cto-review §3 lens findings).
// Forced JSON response schema, temperature 0, retry with backoff, a 60 s abort over the whole call,
// no caching. It never logs a prompt, an image or an answer: callers log status codes and timings.
// Credential today: a Gemini API key (HEALTHAPP_GEMINI_API_KEY), dev and synthetic data only.
// Vertex AI in the EU replaces it before the real-data gate (MIN-4449); only `endpoint` changes.
import { z } from "npm:zod@4.6.7";

// gemini-2.5-flash answers 404 "no longer available to new users" (measured 2026-11-14). The bake-off
// (MIN-4475) fixes the id; HEALTHAPP_GEMINI_MODEL overrides it without a deploy of code.
export const DEFAULT_MODEL = "gemini-3.8-flash";
export const TIMEOUT_MS = 60_000;
export const MAX_ATTEMPTS = 3;

export type Part =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } }; // base64

export interface JsonCall<T> {
  model?: string;
  system?: string;
  parts: Part[];
  /** The zod schema of the answer. Sent to the model as JSON Schema and checked on the way back. */
  schema: z.ZodType<T>;
  timeoutMs?: number;
  maxAttempts?: number;
}

export interface ModelDeps {
  apiKey: string | undefined;
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

export type ModelErrorKind = "config" | "timeout" | "http" | "invalid";
export class ModelError extends Error {
  constructor(readonly kind: ModelErrorKind, readonly status?: number, readonly attempts = 0) {
    super(`model ${kind}${status ? ` ${status}` : ""} after ${attempts} attempt(s)`);
  }
}

export interface JsonResult<T> {
  data: T;
  model: string;
  attempts: number;
  ms: number;
}

/** zod -> the JSON Schema subset Gemini's responseJsonSchema accepts. */
export function responseSchemaOf(schema: z.ZodType): Record<string, unknown> {
  const js = z.toJSONSchema(schema, { target: "draft-2020-12" }) as Record<string, unknown>;
  delete js.$schema;
  return js;
}

const RETRYABLE = (status: number) => status === 429 || status >= 500;

export async function generateJson<T>(call: JsonCall<T>, deps: ModelDeps): Promise<JsonResult<T>> {
  if (!deps.apiKey) throw new ModelError("config");
  const doFetch = deps.fetch ?? fetch;
  const sleep = deps.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const model = call.model ?? DEFAULT_MODEL;
  const timeoutMs = call.timeoutMs ?? TIMEOUT_MS;
  const maxAttempts = call.maxAttempts ?? MAX_ATTEMPTS;
  const started = Date.now();
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), timeoutMs);

  const body = JSON.stringify({
    contents: [{ role: "user", parts: call.parts }],
    ...(call.system ? { systemInstruction: { parts: [{ text: call.system }] } } : {}),
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      responseJsonSchema: responseSchemaOf(call.schema),
    },
  });
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  let last: ModelError = new ModelError("invalid", undefined, 0);
  try {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (attempt > 1) {
        const wait = Math.min(500 * 2 ** (attempt - 2) + Math.floor(Math.random() * 250), 4000);
        if (Date.now() - started + wait >= timeoutMs) break;
        await sleep(wait);
      }
      let res: Response;
      try {
        res = await doFetch(url, {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": deps.apiKey },
          body,
          signal: abort.signal,
        });
      } catch {
        if (abort.signal.aborted) throw new ModelError("timeout", undefined, attempt);
        last = new ModelError("http", 0, attempt);
        continue; // network error: retry
      }
      if (!res.ok) {
        await res.body?.cancel();
        last = new ModelError("http", res.status, attempt);
        if (RETRYABLE(res.status)) continue;
        throw last;
      }
      let text = "";
      try {
        const payload = await res.json();
        text = (payload?.candidates?.[0]?.content?.parts ?? [])
          .map((p: { text?: string }) => p.text ?? "").join("");
        const parsed = call.schema.safeParse(JSON.parse(text));
        if (parsed.success) return { data: parsed.data, model, attempts: attempt, ms: Date.now() - started };
      } catch {
        if (abort.signal.aborted) throw new ModelError("timeout", undefined, attempt);
      }
      last = new ModelError("invalid", 200, attempt); // empty, not JSON, or not the schema: retry
    }
    if (abort.signal.aborted) throw new ModelError("timeout", undefined, last.attempts);
    throw last;
  } finally {
    clearTimeout(timer);
  }
}
