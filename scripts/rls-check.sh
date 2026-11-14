#!/usr/bin/env bash
# Real-token RLS check for one env (MIN-4471, MIN-4492): each synthetic persona signs in and counts rows
# per table through the Data API. Prints counts and HTTP codes only, never a row or a token.
#   SUPABASE_URL=... SUPABASE_ANON_KEY=... HEALTHAPP_DEMO_PASSCODE=... scripts/rls-check.sh dev
#   (or HEALTHAPP_PERSONA_PASSWORD=... to sign in with GoTrue directly; the outsider needs it)
# Tokens: patient and doctor through healthapp-demo-login when HEALTHAPP_DEMO_PASSCODE is set (2 tries
# of its 5 a minute), else GoTrue with the persona password. The outsider has no demo-login route.
# Each table is read with `select=<its key column>`, never `select=*`: profiles grants 7 columns only
# (MIN-4492 fix 1), so `*` would fail for everyone and prove nothing.
# Then `nid=`: profiles?select=national_id_norm, which must be refused (42501) for every persona,
# the doctor in a live grant included.
# Expected: patient sees own rows; doctor without a grant 0 patient rows (own profile 1); outsider 0.
set -euo pipefail
env="${1:-}"; case "$env" in dev|demo) ;; *) echo "usage: rls-check.sh dev|demo" >&2; exit 2;; esac
: "${SUPABASE_URL:?}" "${SUPABASE_ANON_KEY:?}"
[ -n "${HEALTHAPP_DEMO_PASSCODE:-}${HEALTHAPP_PERSONA_PASSWORD:-}" ] || { echo "set HEALTHAPP_DEMO_PASSCODE or HEALTHAPP_PERSONA_PASSWORD" >&2; exit 2; }
tables="profiles:id documents:id results:id findings:id diary_entries:id grants:id assistant_turns:id handshake_tokens:jti rate_events:id"

token_for() { # persona -> access token on stdout, or nothing
  local persona="$1" body url
  if [ -n "${HEALTHAPP_DEMO_PASSCODE:-}" ] && [ "$persona" != outsider ]; then
    body=$(python3 -c 'import json,sys; print(json.dumps({"persona":sys.argv[1],"passcode":sys.argv[2]}))' "$persona" "$HEALTHAPP_DEMO_PASSCODE")
    curl -s -X POST "$SUPABASE_URL/functions/v1/healthapp-demo-login" -H "apikey: $SUPABASE_ANON_KEY" \
      -H 'content-type: application/json' -H "x-healthapp-env: $env" -d "$body"
  elif [ -n "${HEALTHAPP_PERSONA_PASSWORD:-}" ]; then
    body=$(python3 -c 'import json,sys; print(json.dumps({"email":sys.argv[1],"password":sys.argv[2]}))' \
      "${persona}.${env}@healthapp.invalid" "$HEALTHAPP_PERSONA_PASSWORD")
    curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" -H "apikey: $SUPABASE_ANON_KEY" \
      -H 'content-type: application/json' -d "$body"
  else
    echo '{}'
  fi | python3 -c 'import json,sys
try: print(json.load(sys.stdin).get("access_token",""))
except Exception: print("")'
}

for persona in patient doctor outsider; do
  token=$(token_for "$persona")
  [ -n "$token" ] || { echo "$persona: no token (sign-in failed or no route)"; continue; }
  line="$persona:"
  for tc in $tables; do
    t="${tc%%:*}"; col="${tc##*:}"
    out=$(curl -s -D - -o /dev/null "$SUPABASE_URL/rest/v1/$t?select=$col" -H "apikey: $SUPABASE_ANON_KEY" \
      -H "Authorization: Bearer $token" -H "Accept-Profile: healthapp_${env}" -H 'Prefer: count=exact' -H 'Range: 0-0')
    code=$(echo "$out" | head -1 | awk '{print $2}')
    count=$(echo "$out" | tr -d '\r' | awk -F'/' 'tolower($0) ~ /^content-range/ {print $2}')
    line="$line $t=${count:-$code}"
  done
  nid=$(curl -s -w ' %{http_code}' "$SUPABASE_URL/rest/v1/profiles?select=national_id_norm" -H "apikey: $SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $token" -H "Accept-Profile: healthapp_${env}" \
    | python3 -c 'import json,sys
raw=sys.stdin.read(); body,code=raw.rsplit(" ",1)
try: d=json.loads(body)
except Exception: d=None
print(code + ("/" + d.get("code","") if isinstance(d,dict) else "/rows=" + str(len(d)) if isinstance(d,list) else ""))')
  echo "$line nid=$nid"
done
