import { isAuthApiError, isAuthSessionMissingError } from '@supabase/supabase-js';
import { ApiError } from './call';
import { supabase } from './client';

/** MIN-4648: one place that attaches the user's token to a call and survives a token the server refused. */

const needsRefresh = (e: unknown) => e instanceof ApiError && (e.status === 401 || e.code === 'unauthenticated');

/** The auth server refused the refresh: the session is gone for good. 429 (rate limit) and 409 (another tab refreshed or signed out) are not refusals. */
const refused = (error: unknown) =>
  isAuthSessionMissingError(error) || (isAuthApiError(error) && [400, 401, 403, 404].includes(error.status));

/**
 * Runs `run(accessToken)` with this device's token. A local "Not signed in" (no session at all) is thrown as is.
 * On a server 401 (or an RLS read's PGRST301, which the readers map to 401) it refreshes the session once and
 * retries once, never more. A refresh refused by the auth server signs this device out
 * (auth-js 2.119 keeps the session and fires no SIGNED_OUT when the access token has not expired, so we do it) and throws
 * `session_ended` with no retry; a refresh that could not reach it, or 429 or 409, stays status 0 and signs nobody out.
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
  let r: Awaited<ReturnType<typeof supabase.auth.refreshSession>>;
  try {
    r = await supabase.auth.refreshSession();
  } catch {
    throw new ApiError(0, 'Could not reach the server.');
  }
  if (r.error ? refused(r.error) : !r.data.session) {
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
    throw new ApiError(401, 'The session ended.', 'session_ended');
  }
  if (r.error || !r.data.session) throw new ApiError(0, 'Could not reach the server.');
  fresh = r.data.session.access_token;
  return run(fresh);
}
