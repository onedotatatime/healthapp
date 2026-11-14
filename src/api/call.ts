import type { z } from 'zod';
import type { EnvState } from '../lib/env';

type OkEnv = Extract<EnvState, { status: 'ok' }>;

/** A function call that failed. `status` is the HTTP status, or 0 when the server was not reached. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
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
    opts: { accessToken?: string; signal?: AbortSignal } = {},
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
      const msg = json && typeof json === 'object' && 'error' in json ? String((json as { error: unknown }).error) : `HTTP ${res.status}`;
      throw new ApiError(res.status, msg);
    }
    const parsed = schema.safeParse(json);
    if (!parsed.success) throw new ApiError(res.status, `Unexpected response from ${name}.`);
    return parsed.data;
  };
}
