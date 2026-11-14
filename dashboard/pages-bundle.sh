#!/usr/bin/env bash
# Builds the exact folder that is uploaded to the Cloudflare Pages project `healthapp-dashboard`
# (MIN-4459). Only Direction B and what it loads. Never the dev fixtures (they hold real Linear
# titles and spend), never Directions A and C or the picker page (they load Google Fonts).
#
#   dashboard/pages-bundle.sh <out-dir>
#   npx wrangler pages deploy <out-dir> --project-name healthapp-dashboard --branch main
#
# Fails if the folder would contain a dev fixture, a resource loaded from another host,
# or a key-shaped value.
set -euo pipefail

OUT="${1:?usage: dashboard/pages-bundle.sh <out-dir>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/docs/dashboard/drafts"

case "$OUT" in
  "$ROOT"|"$ROOT"/*) echo "out-dir must be outside the repo" >&2; exit 2 ;;
esac

rm -rf "$OUT"
mkdir -p "$OUT"
cp -R "$SRC/direction-B" "$SRC/shared" "$SRC/fonts" "$OUT/"
cp "$SRC/sample-data.js" "$SRC/_headers" "$SRC/robots.txt" "$OUT/"

# The root sends the viewer to Direction B. No inline script (the CSP forbids it).
cat > "$OUT/index.html" <<'HTML'
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow">
<meta http-equiv="refresh" content="0; url=/direction-B/index.html"><title>healthapp dashboard</title></head>
<body><a href="/direction-B/index.html">Open the dashboard</a></body></html>
HTML

fail=0
if find "$OUT" \( -name 'dev-snapshot.json' -o -path '*/dev/*' -o -name 'snapshot.example.json' \) | grep -q .; then
  echo "dev fixture in the upload set" >&2; fail=1
fi
# Anything the browser would load from another host (links to Linear are fine, loads are not).
LOADS='(src|href)=["'"'"']https?://[^"'"'"']*\.(js|css|woff2?|ttf)|<link[^>]+href=["'"'"']https?://|url\(["'"'"']?https?://|@import|preconnect'
if grep -rnE "$LOADS" "$OUT" --include='*.html' --include='*.css' --include='*.js' >&2; then
  echo "third-party resource in the upload set" >&2; fail=1
fi
if grep -rnE 'eyJ[A-Za-z0-9_-]{30,}|sb_''secret_|SUPABASE_SERVICE_''ROLE_KEY=[A-Za-z0-9_.-]{20,}|lin_''api_[A-Za-z0-9]{20,}|sb''p_[A-Za-z0-9]{20,}|#k=[A-Za-z0-9]{16,}' "$OUT" >&2; then
  echo "key-shaped value in the upload set" >&2; fail=1
fi
[ "$fail" = 0 ] || exit 1
echo "upload set ok: $(find "$OUT" -type f | wc -l | tr -d ' ') files in $OUT"
