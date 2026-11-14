#!/bin/sh
# Opens the live dashboard in Google Chrome with this Mac's view key (MIN-4459). Prints no key and no URL with a key.
# Replaces "paste the link from the clipboard": any screenshot overwrites the clipboard.
#
#   ~/.healthapp-dashboard/open.sh             check the feed with this Mac's keys, then open the page in Chrome
#   ~/.healthapp-dashboard/open.sh --check     check only, open nothing
#   ~/.healthapp-dashboard/open.sh --base URL  another copy of the page (default: the Pages Direction B page)
#
# The keys travel in the URL fragment (#k=&a=), which no server or log receives; the page stores them once in this
# browser and removes them from the address bar. install.sh copies this file next to the keys.
set -eu
HOME_DIR="$HOME/.healthapp-dashboard"
BASE="https://healthapp-dashboard.pages.dev/direction-B/"
FEED="https://fnbnhvgrnkrbsrwhgcgc.supabase.co/functions/v1/healthapp-dashboard-feed"
CHECK_ONLY=0
while [ $# -gt 0 ]; do
  case "$1" in
    --check) CHECK_ONLY=1; shift ;;
    --base) BASE="${2:?--base needs a URL}"; shift 2 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done
BASE="${BASE%%#*}"

if [ ! -s "$HOME_DIR/view.key" ] || [ ! -s "$HOME_DIR/push.json" ]; then
  echo "No keys in $HOME_DIR. Run dashboard/install.sh first." >&2; exit 3
fi
ORIGIN="$(python3 -c 'import sys, urllib.parse as u; p = u.urlsplit(sys.argv[1]); print(p.scheme + "://" + p.netloc)' "$BASE")"

# 1. The feed must answer 200 with these keys, sent from the page's origin. Headers reach curl on stdin, never argv.
code="$(python3 -c '
import json, sys
home, origin = sys.argv[1], sys.argv[2]
k = open(home + "/view.key").read().strip()
a = json.load(open(home + "/push.json"))["anon"]
for h in ("x-dashboard-key: " + k, "Authorization: Bearer " + a, "apikey: " + a, "Origin: " + origin):
    sys.stdout.write("header = \"%s\"\n" % h)
' "$HOME_DIR" "$ORIGIN" | curl -s -o /dev/null -w '%{http_code}' --max-time 15 -K - "$FEED" || true)"
case "$code" in
  200) echo "feed: OK (HTTP 200 with this Mac's keys)" ;;
  401|403) echo "feed: HTTP $code. The server does not accept this Mac's view key (Supabase secret and view.key differ). Tell the CTO." >&2; exit 4 ;;
  404) echo "feed: HTTP 404, nothing pushed yet. Check $HOME_DIR/run.log." >&2; exit 4 ;;
  *) echo "feed: HTTP ${code:-none}, the feed did not answer normally." >&2; exit 4 ;;
esac
[ "$CHECK_ONLY" = 1 ] && exit 0

# 2. Open a NEW tab, so the page loads fresh and reads the keys from the fragment.
URL="$(python3 -c '
import json, sys
home, base = sys.argv[1], sys.argv[2]
k = open(home + "/view.key").read().strip()
a = json.load(open(home + "/push.json"))["anon"]
sys.stdout.write("%s#k=%s&a=%s" % (base, k, a))
' "$HOME_DIR" "$BASE")"
if open -Ra "Google Chrome" >/dev/null 2>&1; then open -a "Google Chrome" "$URL"; else open "$URL"; fi
echo "opened the dashboard in a new browser tab"
