---
name: token-refresh-401
description: MIN-4648 (2026-11-15): share-code 401s were session_not_found after a second-device sign-in/out (global signOut), not a stale token; my first clock theory was wrong
metadata:
  type: project
---

At 01:53 UTC on 2026-11-15, "Could not make a code" appeared on the live app. I first blamed the device clock and the refresh cooldown. The auth_logs showed `session_not_found` instead: the founder had signed in on a second device, and the phone's session was deleted on the server.

- **The cause was in the code.** Every `supabase.auth.signOut()` call in the app passes no scope, and the default is `'global'` (auth-js 2.119). That covers the Profile button, the demo Reset and the no-profile path in AuthProvider. A sign-out on one device ends every session of that account.
- **The other possible cause:** "single session per user" in Conductor's shared Auth settings. We cannot change those settings (docs/deploy.md §6).
- **What did not cause it:** `healthapp-demo-login` ends nothing, because generateLink plus verifyOtp only add a session.
- **Why the 401s looked the way they did:** the edge functions' `getUser` turns `session_not_found` into a 401 `unauthenticated`. The client never refreshes a JWT that has not expired, so it kept sending a dead token for 75 s.
- **The fix (Ren, Lane C):**
  - `signOut({scope:'local'})`;
  - one `authedCall` that refreshes and retries once, then fails with `session_ended`;
  - Login shows "Your session ended";
  - `isGrantGone` drops `unauthenticated`.

**Why:** I decided on a mechanism before I had the auth_logs error code, and the code proved me wrong.

**How to apply:** for any auth 401 incident, get the `/user` error code first:
- expired JWT points to the clock and refresh;
- `session_not_found` points to a revoked session, so look for a `signOut` with a global scope or a session setting;
- 429 or 5xx points to the auth server.

Grep for `signOut(` without a scope in any Supabase client review. See [[healthapp-function-deploys]].

**Second lesson (post-build pass, same day):** my decision said a refused refresh makes supabase-js drop the session and fire `SIGNED_OUT`. That is false in auth-js 2.119 while the access token has not expired: `_callRefreshToken` keeps the session ("proactive refresh failed … preserving session") and fires nothing. Proved with a fake-fetch probe against the real library. The fix is for the app to call `signOut({scope:'local'})` itself on a refusal (400/401/403/404 or session-missing). It must not sign out on 429 or 409 `AuthRefreshDiscardedError`. Also, `supabase.from()` resolves `{error,status}` and never throws, so a retry wrapper only works if the throw is inside the callback.

**How to apply:** before a decision relies on library event behaviour, read that version's source or run a probe. Do not reason from docs or memory.
