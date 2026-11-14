import type { z } from 'zod';
import type { EnvState } from '../lib/env';

type OkEnv = Extract<EnvState, { status: 'ok' }>;

/** A function call that failed. `status` is the HTTP status, or 0 when the server was not reached. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** Cron's typed error code (`model_unavailable`, `grant_expired`, ...) when the body carries one. */
    public code?: string,
  ) {
    super(message);
  }
}

/** Reads both error bodies: `{ error: "text" }` (foundation stub) and `{ error: { code, message } }` (Cron's contract). */
function errorOf(json: unknown, status: number): { message: string; code?: string } {
  const e = json && typeof json === 'object' && 'error' in json ? (json as { error: unknown }).error : undefined;
  if (typeof e === 'string') return { message: e };
  if (e && typeof e === 'object') {
    const { code, message } = e as { code?: unknown; message?: unknown };
    return { message: typeof message === 'string' ? message : `HTTP ${status}`, code: typeof code === 'string' ? code : undefined };
  }
  return { message: `HTTP ${status}` };
}

/**
 * The one wrapper for Edge Function calls. It is the only place that sends `x-healthapp-env`
 * (MIN-4449 decision 1, 1: on function calls only, never as a global supabase-js header).
 * `accessToken` is the user's session token; without it the anon key is sent (hello and demo-login).
 */
export function makeCall(env: OkEnv, fetchImpl: typeof fetch = (...a) => fetch(...a)) {
  return async function callFunction<T>(
    name: string,
    body: unknown,
    schema: z.ZodType<T>,
    opts: { accessToken?: string; signal?: AbortSignal; /** MIN-4557: the call survives the tab closing (the scan kick). */ keepalive?: boolean } = {},
  ): Promise<T> {
    let res: Response;
    try {
      res = await fetchImpl(`${env.supabaseUrl}/functions/v1/${env.functionPrefix}${name}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          apikey: env.anonKey,
          authorization: `Bearer ${opts.accessToken ?? env.anonKey}`,
          'x-healthapp-env': env.env,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: opts.signal,
        keepalive: opts.keepalive,
      });
    } catch {
      throw new ApiError(0, 'Could not reach the server.');
    }
    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      /* not JSON */
    }
    if (!res.ok) {
      const { message, code } = errorOf(json, res.status);
      throw new ApiError(res.status, message, code);
    }
    const parsed = schema.safeParse(json);
    if (!parsed.success) throw new ApiError(res.status, `Unexpected response from ${name}.`);
    return parsed.data;
  };
}

