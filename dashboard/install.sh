#!/bin/bash
# Installs the dashboard job on this Mac (MIN-4456). Prints no key, no URL with a key, no secret.
#
#   dashboard/install.sh [--viewer-url BASE] [--rotate] [--no-secrets] [--uninstall]
#
# What it does:
#   1. ~/.healthapp-dashboard/ (mode 700): copies snapshot.py, rates.json and open.sh, keeps hand-set.json and directions.json if present.
#   2. push.key and view.key (mode 600, `openssl rand -hex 32`), created once; --rotate makes new ones.
#   3. push.json (mode 600): the ingest URL and the PUBLIC anon key the Supabase gateway wants as a bearer.
#   4. Sets the function secrets HEALTHAPP_DASHBOARD_PUSH_KEY, HEALTHAPP_DASHBOARD_VIEW_KEY and
#      HEALTHAPP_DASHBOARD_ALLOWED_ORIGINS one by one, with --project-ref (never --prune, never unset).
#   5. A launchd job every 3 minutes (ai.minhos.healthapp-dashboard), one run at once.
#   6. Puts the viewer URL (BASE#k=<view key>&a=<anon key>) on the clipboard only.
#
# BASE is the page's address. Release fills it when the Pages project exists (--viewer-url or
# HEALTHAPP_DASHBOARD_VIEWER_URL). Until then the local page is used.
set -euo pipefail
umask 077

PROJECT_REF="${HEALTHAPP_DASHBOARD_PROJECT_REF:-fnbnhvgrnkrbsrwhgcgc}"
HOME_DIR="${HEALTHAPP_DASHBOARD_HOME:-$HOME/.healthapp-dashboard}"
LABEL="ai.minhos.healthapp-dashboard"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
VIEWER_URL="${HEALTHAPP_DASHBOARD_VIEWER_URL:-http://127.0.0.1:8765/direction-A/index.html}"
ROTATE=0
SECRETS=1
UNINSTALL=0
SRC="$(cd "$(dirname "$0")" && pwd)"

while [ $# -gt 0 ]; do
  case "$1" in
    --viewer-url) VIEWER_URL="${2:?--viewer-url needs a value}"; shift 2 ;;
    --rotate) ROTATE=1; shift ;;
    --no-secrets) SECRETS=0; shift ;;
    --uninstall) UNINSTALL=1; shift ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

if [ "$UNINSTALL" = 1 ]; then
  launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
  rm -f "$PLIST"
  echo "uninstalled the job; $HOME_DIR left in place (keys and state)"
  exit 0
fi

ORIGIN="$(python3 -c 'import sys,urllib.parse as u; p=u.urlparse(sys.argv[1]); print("%s://%s" % (p.scheme, p.netloc))' "$VIEWER_URL")"

mkdir -p "$HOME_DIR"
chmod 700 "$HOME_DIR"
cp "$SRC/snapshot.py" "$SRC/rates.json" "$SRC/open.sh" "$HOME_DIR/"
chmod 700 "$HOME_DIR/open.sh"
[ -f "$HOME_DIR/hand-set.json" ] || cp "$SRC/hand-set.sample.json" "$HOME_DIR/hand-set.json"
python3 "$SRC/sync_agents.py" "$SRC/hand-set.sample.json" "$HOME_DIR/hand-set.json" || echo "warning: could not add the sample's new agents to $HOME_DIR/hand-set.json" >&2      # append-only (MIN-4574)
[ -f "$HOME_DIR/directions.json" ] || cp "$SRC/directions.sample.json" "$HOME_DIR/directions.json"      # never overwritten: the founder's statuses stay

for k in push view; do
  if [ "$ROTATE" = 1 ] || [ ! -s "$HOME_DIR/$k.key" ]; then
    openssl rand -hex 32 > "$HOME_DIR/$k.key"
  fi
  chmod 600 "$HOME_DIR/$k.key"
done
# the two keys must differ (the functions refuse to run otherwise)
if [ "$(cat "$HOME_DIR/push.key")" = "$(cat "$HOME_DIR/view.key")" ]; then openssl rand -hex 32 > "$HOME_DIR/view.key"; fi

# The anon key is public by design (the conductor console ships it). It is not printed and not kept in the repo.
supabase projects api-keys --project-ref "$PROJECT_REF" -o json 2>/dev/null | python3 -c '
import json, sys, os
home, ref = sys.argv[1], sys.argv[2]
anon = next(k["api_key"] for k in json.load(sys.stdin) if k.get("name") == "anon" and k.get("type") == "legacy")
conf = {"url": "https://%s.supabase.co/functions/v1/healthapp-dashboard-ingest" % ref, "anon": anon}
fd = os.open(os.path.join(home, "push.json"), os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
with os.fdopen(fd, "w") as f:
    json.dump(conf, f)
' "$HOME_DIR" "$PROJECT_REF"
chmod 600 "$HOME_DIR/push.json"

if [ "$SECRETS" = 1 ]; then
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  for pair in "PUSH_KEY:push" "VIEW_KEY:view"; do
    name="HEALTHAPP_DASHBOARD_${pair%%:*}"; file="$HOME_DIR/${pair##*:}.key"
    printf '%s=%s\n' "$name" "$(cat "$file")" > "$tmp/env"
    supabase secrets set --project-ref "$PROJECT_REF" --env-file "$tmp/env" >/dev/null 2>&1
    rm -f "$tmp/env"
  done
  # the page's own origin, plus the local viewer on 127.0.0.1:8765 (the founder's local copy of the same page)
  ORIGINS="$ORIGIN"; [ "$ORIGIN" = "http://127.0.0.1:8765" ] || ORIGINS="$ORIGIN,http://127.0.0.1:8765"
  supabase secrets set --project-ref "$PROJECT_REF" "HEALTHAPP_DASHBOARD_ALLOWED_ORIGINS=$ORIGINS" >/dev/null 2>&1
fi

# launchd's PATH has no /opt/homebrew/bin, where `gh` lives (MIN-4460). Put gh's own folder on the job's PATH (snapshot.py also looks
# in the usual places by itself). If gh is not installed the branches block says so, it does not fail the job.
JOB_PATH="/usr/bin:/bin:/usr/sbin:/sbin"
GH_DIR="$(dirname "$(command -v gh 2>/dev/null || true)")"
case "$GH_DIR" in /*) case ":$JOB_PATH:" in *":$GH_DIR:"*) ;; *) JOB_PATH="$GH_DIR:$JOB_PATH" ;; esac ;; esac

mkdir -p "$HOME/Library/LaunchAgents"
cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/python3</string>
    <string>$HOME_DIR/snapshot.py</string>
    <string>--home</string><string>$HOME_DIR</string>
    <string>--push</string>
  </array>
  <key>StartInterval</key><integer>180</integer>
  <key>RunAtLoad</key><true/>
  <key>StandardOutPath</key><string>$HOME_DIR/run.log</string>
  <key>StandardErrorPath</key><string>$HOME_DIR/run.log</string>
  <key>EnvironmentVariables</key>
  <dict><key>PATH</key><string>$JOB_PATH</string></dict>
</dict>
</plist>
EOF
chmod 644 "$PLIST"
: > "$HOME_DIR/run.log"

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"

# The viewer URL goes to the clipboard only: the view key and the public gateway key travel in the fragment,
# which no server or log ever receives. The page reads it once and removes it from the address bar.
python3 -c '
import json, sys
home, base = sys.argv[1], sys.argv[2]
k = open(home + "/view.key").read().strip()
a = json.load(open(home + "/push.json"))["anon"]
sys.stdout.write("%s#k=%s&a=%s" % (base, k, a))
' "$HOME_DIR" "$VIEWER_URL" | pbcopy

echo "installed: job $LABEL every 180 s, keys in $HOME_DIR (mode 600), viewer URL on the clipboard; to open the page run $HOME_DIR/open.sh"
