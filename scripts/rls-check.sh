#!/usr/bin/env bash
# Real-token RLS check for one env (MIN-4471): each synthetic persona signs in with GoTrue and
# counts rows per table through the Data API. Prints counts and HTTP codes only.
#   HEALTHAPP_PERSONA_PASSWORD=... SUPABASE_URL=... SUPABASE_ANON_KEY=... scripts/rls-check.sh dev
# Expected: patient sees own rows; doctor (no live grant) 0 patient rows (own profile 1);
# outsider (signed in, no profile) 0 everywhere.
set -euo pipefail
env="${1:-}"; case "$env" in dev|demo) ;; *) echo "usage: rls-check.sh dev|demo" >&2; exit 2;; esac
: "${HEALTHAPP_PERSONA_PASSWORD:?}" "${SUPABASE_URL:?}" "${SUPABASE_ANON_KEY:?}"
tables="profiles documents results findings diary_entries grants assistant_turns handshake_tokens rate_events"
for persona in patient doctor outsider; do
  body=$(python3 -c 'import json,sys; print(json.dumps({"email":sys.argv[1],"password":sys.argv[2]}))' \
    "${persona}.${env}@healthapp.invalid" "$HEALTHAPP_PERSONA_PASSWORD")
  token=$(curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" -H "apikey: $SUPABASE_ANON_KEY" \
    -H 'content-type: application/json' -d "$body" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("access_token",""))')
  [ -n "$token" ] || { echo "$persona: sign-in failed"; continue; }
  line="$persona:"
  for t in $tables; do
    # select=id, never *: profiles grants clients its columns, not the table, so * is refused (42501).
    col=id; [ "$t" = handshake_tokens ] && col=jti
    out=$(curl -s -D - -o /dev/null "$SUPABASE_URL/rest/v1/$t?select=$col" -H "apikey: $SUPABASE_ANON_KEY" \
      -H "Authorization: Bearer $token" -H "Accept-Profile: healthapp_${env}" -H 'Prefer: count=exact' -H 'Range: 0-0')
    code=$(echo "$out" | head -1 | awk '{print $2}')
    count=$(echo "$out" | tr -d '\r' | awk -F'/' 'tolower($0) ~ /^content-range/ {print $2}')
    line="$line $t=${count:-$code}"
  done
  echo "$line"
done
