#!/bin/bash
# Installs, stops and re-keys the dashboard chat bridge on this Mac (MIN-4497). Prints no key, ever.
#
#   dashboard/chat_service.sh install [--page-dir DIR] [--extra-dir NAME=DIR] [--port 8765]   copy the files, make chat.key, load the launchd job
#   dashboard/chat_service.sh uninstall                                 unload the job (keys and chats stay)
#   dashboard/chat_service.sh off | on                                  kill switch: chat.off makes the bridge refuse every new turn
#   dashboard/chat_service.sh rotate-key                                new chat.key (mode 600), restart the bridge, end every running turn
#   dashboard/chat_service.sh status                                    job loaded, chat.off, key present, turns logged today
#
# The bridge binds 127.0.0.1 only and replaces the ad-hoc `python3 -m http.server 8765`. `install` refuses to start while something
# else listens on the port: stop the old server yourself first (it never kills a process it did not start).
# `--extra-dir how-it-works=<folder>` serves one more folder at /how-it-works/ with the same rules as the page folder (repeatable). Neither folder may
# be inside ~/.healthapp-dashboard (the keys): the bridge refuses to start if one is.
# Start it from this script (launchd) or from a Terminal. Never from inside a Claude session.
set -euo pipefail
umask 077

HOME_DIR="${HEALTHAPP_DASHBOARD_HOME:-$HOME/.healthapp-dashboard}"
LABEL="ai.minhos.healthapp-dashboard-chat"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
SRC="$(cd "$(dirname "$0")" && pwd)"
PORT=8765
PAGE_DIR="$SRC/../docs/dashboard/drafts"
EXTRA_LIST=""          # one NAME=DIR per line (no arrays: /bin/bash 3.2 on the Mac fails on an empty one under set -u)
CMD="${1:-}"
[ $# -gt 0 ] && shift

while [ $# -gt 0 ]; do
  case "$1" in
    --page-dir) PAGE_DIR="${2:?--page-dir needs a folder}"; shift 2 ;;
    --extra-dir)
      SPEC="${2:?--extra-dir needs NAME=DIR}"; shift 2
      case "$SPEC" in *=?*) ;; *) echo "--extra-dir needs NAME=DIR" >&2; exit 2 ;; esac
      NAME="${SPEC%%=*}"; DIR="${SPEC#*=}"
      case "$NAME" in *[!a-z0-9-]*|-*|"") echo "--extra-dir: the name is lower-case letters, digits and dashes" >&2; exit 2 ;; esac
      [ -d "$DIR" ] || { echo "--extra-dir: no folder $DIR" >&2; exit 2; }
      EXTRA_LIST="$EXTRA_LIST$NAME=$(cd "$DIR" && pwd -P)
" ;;
    --port) PORT="${2:?--port needs a number}"; shift 2 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

new_key() { openssl rand -hex 32 > "$HOME_DIR/chat.key"; chmod 600 "$HOME_DIR/chat.key"; }
loaded() { launchctl print "gui/$(id -u)/$LABEL" >/dev/null 2>&1; }

case "$CMD" in
  install)
    PAGE_DIR="$(cd "$PAGE_DIR" && pwd)"
    EXTRA_XML=""
    while IFS= read -r SPEC; do
      [ -n "$SPEC" ] || continue
      EXTRA_XML="$EXTRA_XML    <string>--extra-dir</string><string>$SPEC</string>
"
    done <<EOF_EXTRA
$EXTRA_LIST
EOF_EXTRA
    if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1 && ! loaded; then
      echo "port $PORT is in use by another process. Stop the old page server first, then run install again." >&2; exit 3
    fi
    mkdir -p "$HOME_DIR"; chmod 700 "$HOME_DIR"
    cp "$SRC/chat_bridge.py" "$SRC/chat_guard.py" "$SRC/snapshot.py" "$HOME_DIR/"
    [ -s "$HOME_DIR/chat.key" ] || new_key
    chmod 600 "$HOME_DIR/chat.key"
    [ -f "$HOME_DIR/hand-set.json" ] || cp "$SRC/hand-set.sample.json" "$HOME_DIR/hand-set.json"
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
    <string>$HOME_DIR/chat_bridge.py</string>
    <string>--home</string><string>$HOME_DIR</string>
    <string>--page-dir</string><string>$PAGE_DIR</string>
${EXTRA_XML}    <string>--port</string><string>$PORT</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$HOME_DIR/chat-bridge.out</string>
  <key>StandardErrorPath</key><string>$HOME_DIR/chat-bridge.out</string>
  <key>EnvironmentVariables</key>
  <dict><key>PATH</key><string>/usr/bin:/bin:/usr/sbin:/sbin</string></dict>
</dict>
</plist>
EOF
    chmod 644 "$PLIST"
    launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
    launchctl bootstrap "gui/$(id -u)" "$PLIST"
    echo "installed: chat bridge on 127.0.0.1:$PORT serving $PAGE_DIR$(printf '%s' "$EXTRA_LIST" | while IFS== read -r N D; do [ -n "$N" ] && printf ', /%s/ -> %s' "$N" "$D"; done) (job $LABEL). Key in $HOME_DIR/chat.key (mode 600), not printed."
    ;;
  uninstall)
    launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
    rm -f "$PLIST"
    echo "unloaded the chat bridge; $HOME_DIR (key, chats, logs) left in place"
    ;;
  off)
    mkdir -p "$HOME_DIR"; : > "$HOME_DIR/chat.off"
    echo "chat is off: the bridge refuses every new turn (a turn already running finishes; use the Stop button or 'uninstall' to end it)"
    ;;
  on)
    rm -f "$HOME_DIR/chat.off"
    echo "chat is on"
    ;;
  rotate-key)
    [ -d "$HOME_DIR" ] || { echo "no $HOME_DIR; run install first" >&2; exit 3; }
    new_key
    if loaded; then
      launchctl kill SIGTERM "gui/$(id -u)/$LABEL"      # SIGTERM, not kickstart -k (SIGKILL): the bridge ends every turn it started; KeepAlive restarts it with the new key
      echo "chat key rotated and the bridge restarted. Open the dashboard again with open.sh (the old tab's key no longer works)."
    else
      echo "chat key rotated. The bridge is not loaded as a job: restart it by hand so it reads the new key."
    fi
    ;;
  status)
    if loaded; then echo "job: loaded ($LABEL)"; else echo "job: not loaded"; fi
    if [ -e "$HOME_DIR/chat.off" ]; then echo "kill switch: ON (chat.off present)"; else echo "kill switch: off"; fi
    if [ -s "$HOME_DIR/chat.key" ]; then echo "chat.key: present, $(wc -c < "$HOME_DIR/chat.key" | tr -d ' ') bytes"; else echo "chat.key: missing"; fi
    if [ -f "$HOME_DIR/chat.log" ]; then echo "turns today: $(grep -c "^$(date -u +%Y-%m-%d)T.* turn kind=" "$HOME_DIR/chat.log" || true)"; fi
    ;;
  *)
    echo "usage: chat_service.sh install|uninstall|off|on|rotate-key|status" >&2; exit 2 ;;
esac
