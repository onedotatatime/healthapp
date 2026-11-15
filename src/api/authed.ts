import { ApiError } from './call';
import { supabase } from './client';

/** MIN-4648: one place that attaches the user's token to a call and survives a token the server refused. */

const needsRefresh = (e: unknown) => e instanceof ApiError && (e.status === 401 || e.code === 'unauthenticated');

/** `refreshSession()` failed. A network failure stays a network error (status 0); any auth answer means the session is gone. */
function refreshFailure(error: { name?: string; status?: number } | null): ApiError {
  const network = !error || error.name === 'AuthRetryableFetchError' || !error.status || error.status >= 500;
  return network
    ? new ApiError(0, 'Could not reach the server.')
    : new ApiError(401, 'The session ended.', 'session_ended');
}

/**
 * Runs `run(accessToken)` with this device's token. A local "Not signed in" (no session at all) is thrown as is.
 * On a server 401 (or an RLS read's PGRST301, which the readers map to 401) it refreshes the session once and
 * retries once, never more. A refresh refused by the auth server throws `session_ended` with no retry
 * (supabase-js has already dropped the session and fired SIGNED_OUT); a refresh that could not reach it stays status 0.
 */
export async function authedCall<T>(run: (accessToken: string) => Promise<T>): Promise<T> {
  if (!supabase) throw new ApiError(0, 'Not configured.');
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new ApiError(401, 'Not signed in.', 'unauthenticated');
  try {
    return await run(data.session.access_token);
  } catch (e) {
    if (!needsRefresh(e)) throw e;
  }
  let fresh: string | undefined;
  try {
    const r = await supabase.auth.refreshSession();
    if (r.error || !r.data.session) throw refreshFailure(r.error);
    fresh = r.data.session.access_token;
  } catch (e) {
    throw e instanceof ApiError ? e : new ApiError(0, 'Could not reach the server.');
  }
  return run(fresh);
}
