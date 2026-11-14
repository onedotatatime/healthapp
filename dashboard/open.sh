#!/bin/sh
# Opens the live dashboard in Google Chrome with this Mac's view key (MIN-4459). Prints no key and no URL with a key.
# Replaces "paste the link from the clipboard": any screenshot overwrites the clipboard.
#
#   ~/.healthapp-dashboard/open.sh             check the feed with this Mac's keys, then open the page in Chrome
#   ~/.healthapp-dashboard/open.sh --check     check only, open nothing
#   ~/.healthapp-dashboard/open.sh --base URL  another copy of the page (default: the Pages Direction A page)
#   ~/.healthapp-dashboard/open.sh --local     the page with the agent chat, served by the local chat bridge on
#                                              127.0.0.1 (MIN-4500); --port N if the bridge is not on 8765
#
# The keys travel in the URL fragment (#k=&a=), which no server or log receives; the page stores them once in this
# browser and removes them from the address bar. install.sh copies this file next to the keys.
# --local adds the chat key (#c=) only to the 127.0.0.1 page, after the bridge answered 200 to it (CTO, MIN-4499 §3).
# The chat key never goes on the pages.dev URL, is never printed and never put on the clipboard.
set -eu
HOME_DIR="$HOME/.healthapp-dashboard"
BASE="https://healthapp-dashboard.pages.dev/direction-A/"
FEED="https://fnbnhvgrnkrbsrwhgcgc.supabase.co/functions/v1/healthapp-dashboard-feed"
CHECK_ONLY=0
LOCAL=0
PORT=8765
BASE_SET=0
while [ $# -gt 0 ]; do
  case "$1" in
    --check) CHECK_ONLY=1; shift ;;
    --base) BASE="${2:?--base needs a URL}"; BASE_SET=1; shift 2 ;;
    --local) LOCAL=1; shift ;;
    --port) PORT="${2:?--port needs a number}"; shift 2 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done
case "$PORT" in ''|*[!0-9]*) echo "--port needs a number" >&2; exit 2 ;; esac
if [ "$LOCAL" = 1 ]; then
  [ "$BASE_SET" = 1 ] && { echo "--local and --base do not go together" >&2; exit 2; }
  BASE="http://127.0.0.1:$PORT/direction-A/index.html"
fi
BASE="${BASE%%#*}"

if [ ! -s "$HOME_DIR/view.key" ] || [ ! -s "$HOME_DIR/push.json" ]; then
  echo "No keys in $HOME_DIR. Run dashboard/install.sh first." >&2; exit 3
fi
ORIGIN="$(python3 -c 'import sys, urllib.parse as u; p = u.urlsplit(sys.argv[1]); print(p.scheme + "://" + p.netloc)' "$BASE")"

# 0. --local: the bridge must answer 200 to GET /chat/health with this Mac's chat key. The key reaches curl on stdin.
if [ "$LOCAL" = 1 ]; then
  if [ ! -s "$HOME_DIR/chat.key" ]; then
    echo "No chat key in $HOME_DIR. Install the chat bridge first (dashboard/chat_service.sh install)." >&2; exit 3
  fi
  code="$(python3 -c '
import sys
home, port = sys.argv[1], sys.argv[2]
k = open(home + "/chat.key").read().strip()
for h in ("x-chat-key: " + k, "Host: 127.0.0.1:" + port):
    sys.stdout.write("header = \"%s\"\n" % h)
' "$HOME_DIR" "$PORT" | curl -s -o /dev/null -w '%{http_code}' --max-time 10 -K - "http://127.0.0.1:$PORT/chat/health" || true)"
  case "$code" in
    200) echo "chat bridge: OK (HTTP 200 on 127.0.0.1:$PORT with this Mac's chat key)" ;;
    403) echo "chat bridge: HTTP 403. The bridge on 127.0.0.1:$PORT does not accept this Mac's chat key. Tell Release." >&2; exit 5 ;;
    503) echo "chat bridge: HTTP 503. The bridge runs but has no chat key loaded. Run dashboard/chat_service.sh status." >&2; exit 5 ;;
    404) echo "chat bridge: HTTP 404. Port $PORT answers, but it is not the chat bridge (the plain page server?)." >&2; exit 5 ;;
    *) echo "chat bridge: HTTP ${code:-none}, nothing answered on 127.0.0.1:$PORT. Run dashboard/chat_service.sh status." >&2; exit 5 ;;
  esac
fi

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
#    The chat key (#c=) is added only in --local mode and only when the page is on 127.0.0.1.
URL="$(python3 -c '
import json, sys, urllib.parse as u
home, base, local = sys.argv[1], sys.argv[2], sys.argv[3] == "1"
k = open(home + "/view.key").read().strip()
a = json.load(open(home + "/push.json"))["anon"]
frag = "k=%s&a=%s" % (k, a)
if local:
    if u.urlsplit(base).hostname != "127.0.0.1":
        sys.exit("refusing to put the chat key on a page that is not on 127.0.0.1")
    frag += "&c=" + u.quote(open(home + "/chat.key").read().strip(), safe="")
sys.stdout.write("%s#%s" % (base, frag))
' "$HOME_DIR" "$BASE" "$LOCAL")"
if open -Ra "Google Chrome" >/dev/null 2>&1; then open -a "Google Chrome" "$URL"; else open "$URL"; fi
if [ "$LOCAL" = 1 ]; then echo "opened the dashboard with the agent chat in a new browser tab"; else echo "opened the dashboard in a new browser tab"; fi
