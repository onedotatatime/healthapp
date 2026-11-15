#!/usr/bin/env bash
# Builds the exact folder that is uploaded to the Cloudflare Pages project `healthapp-dashboard`
# (MIN-4459). Only Direction A (the dashboard base since MIN-4530) and what it loads. Never the dev
# fixtures (they hold real Linear titles and spend), never Directions B and C or the picker page.
#
#   dashboard/pages-bundle.sh <out-dir>
#   npx wrangler pages deploy <out-dir> --project-name healthapp-dashboard --branch main
#
# Fails if the folder would contain a dev fixture or any *.json, a resource loaded from another host,
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
cp -R "$SRC/direction-A" "$SRC/shared" "$SRC/fonts" "$OUT/"
cp "$SRC/_headers" "$SRC/robots.txt" "$OUT/"

# Public bundle, view key as the only gate (CTO decisions on MIN-4458, 14 and 15 Nov 2026): the sample data, the deck text and every
# local path stay out. The business exercises are public since 15 Nov (founder's call): shared/content.js carries them, with issue ids
# replaced by "the issue"; the deck slides stay empty stubs. The source files are not changed; the bundled copies are rewritten here.
# Each edit must match exactly once, so a change in the source fails the bundle instead of slipping through.
python3 - "$SRC" "$OUT" <<'PY'
import json, re, sys
src, out = sys.argv[1], sys.argv[2]

def sub_once(text, pattern, repl, what, flags=0):
    new, n = re.subn(pattern, repl, text, flags=flags)
    if n != 1:
        sys.exit(f"pages-bundle: expected exactly one match for {what}, found {n}")
    return new

# 1. content.js: the exercises as they are (issue ids replaced), the decks as empty stubs.
raw = open(f"{src}/shared/content.js").read()
m = re.search(r"^const CONTENT = (\{.*\});\s*$", raw, re.S | re.M)
if not m:
    sys.exit("pages-bundle: shared/content.js does not have the expected shape")
exercises = json.loads(m.group(1))["exercises"]
if len(exercises) != 7:
    sys.exit(f"pages-bundle: expected 7 exercises, found {len(exercises)}")
ex_text = re.sub(r"MIN-\d+", "the issue", json.dumps(exercises, ensure_ascii=False, separators=(",", ":")))
with open(f"{out}/shared/content.js", "w") as f:
    f.write("// Public bundle (CTO decision of 15 Nov): the business exercises only. No deck text, no issue ids.\n"
            f'const CONTENT = {{"exercises":{ex_text},"decks":{{"short":{{"slides":[],"version":"","file":"","secs":0}},'
            '"full":{"slides":[],"version":"","file":""}}};\n')

# 2. sample-data.js: same shape; only the four build times and the two cap pairs are kept.
sd = open(f"{src}/sample-data.js").read()
def grab(pattern, what):
    m = re.findall(pattern, sd)
    if len(m) != 1:
        sys.exit(f"pages-bundle: expected exactly one {what} in sample-data.js, found {len(m)}")
    return m[0]
t = {k: grab(rf'\b{k}:\s*"([0-9T:+-]{{25}})"', k) for k in ("deadline", "buildStart", "freeze", "submitBy")}
caps = {k: grab(rf'\b{k}:\{{\s*soft:(\d+),\s*hard:(\d+)\s*\}}', k) for k in ("agentCaps", "chatCaps")}
with open(f"{out}/sample-data.js", "w") as f:
    f.write("// Public stub (CTO go-live decision): the live feed fills it; no sample data in the public bundle.\n"
            "const DATA = {\n"
            f'  deadline:"{t["deadline"]}", buildStart:"{t["buildStart"]}", freeze:"{t["freeze"]}", submitBy:"{t["submitBy"]}",\n'
            '  milestones:[], current:"",\n'
            "  tasks:{ done:0, inProgress:0, inReview:0, open:0, blocked:0, total:0, byRole:{} },\n"
            f'  tokens:{{ agentCaps:{{ soft:{caps["agentCaps"][0]}, hard:{caps["agentCaps"][1]} }}, '
            f'chatCaps:{{ soft:{caps["chatCaps"][0]}, hard:{caps["chatCaps"][1]} }}, perAgent:[], perChat:[], series:[] }},\n'
            "  money:{ estimateEUR:0, estimateSeries:[], credits:[] },\n"
            "  agents:[], flags:[],\n"
            '  demo:{ build:{ state:"idle", label:"", at:"" }, deploy:{ state:"idle", label:"" }, url:"", cleanRuns:0, cleanTarget:0, steps:[], notes:{} },\n'
            "  exercises:[], decks:[]\n"
            "};\n"
            "DATA.lanes = []; DATA.flagsTimed = [];\n"
            'DATA.tokens.projection = { at:"", v:0 }; DATA.money.projection = { at:"", v:0 };\n')

# 3-5. common.js: the local deck path, the sample event log, the facilitator, ticket and Linear link.
p = f"{out}/shared/common.js"
c = open(p).read()
c = sub_once(c, r"'file:///Users/[^']*/'\+CONTENT\.decks\[k\]\.file", "''", "the local deck path")
c = sub_once(c, r"Plain script, works from file://\.", "Plain script.", "the file:// header note")
c = sub_once(c, r"^H\.log = \[.*\];$", "H.log = [];", "the H.log sample events", re.M)
c = sub_once(c, r"<span><b>Facilitator</b>[^<]*</span><span><b>Ticket</b>MIN-\d+</span>", "", "the facilitator and ticket")
c = sub_once(c, r' · <a href="https://linear\.app/[^"]*">MIN-\d+</a>', "", "the Linear link")
open(p, "w").write(c)
PY

# The root sends the viewer to Direction A. No inline script (the CSP forbids it).
cat > "$OUT/index.html" <<'HTML'
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow">
<meta http-equiv="refresh" content="0; url=/direction-A/index.html"><title>healthapp dashboard</title></head>
<body><a href="/direction-A/index.html">Open the dashboard</a></body></html>
HTML

fail=0
# The bundle ships Direction A and nothing else (MIN-4530): B, C and the picker stay in the repo, not on Pages.
[ -f "$OUT/direction-A/index.html" ] || { echo "direction-A is missing from the upload set" >&2; fail=1; }
if [ -e "$OUT/direction-B" ] || [ -e "$OUT/direction-C" ]; then echo "a direction other than A is in the upload set" >&2; fail=1; fi
if find "$OUT" \( -name 'dev-snapshot.json' -o -path '*/dev/*' -o -name 'snapshot.example.json' \) | grep -q .; then
  echo "dev fixture in the upload set" >&2; fail=1
fi
# The chat bridge, its guard and its key never leave the Mac, and no chat key (the c= fragment) is in a page (MIN-4497).
if find "$OUT" \( -name 'chat_bridge.py' -o -name 'chat_guard.py' -o -name 'chat.key' -o -name 'chat.off' -o -name 'chat_service.sh' \) | grep -q .; then
  echo "chat bridge file in the upload set" >&2; fail=1
fi
if grep -rnE '[#&]c=[A-Za-z0-9]{16,}' "$OUT" >&2; then
  echo "chat key (a c= fragment) in the upload set" >&2; fail=1
fi
# The page loads no JSON; any *.json here is a fixture, renamed or not (CTO change 2, MIN-4458).
if find "$OUT" -type f -iname '*.json' | grep . >&2; then
  echo "json file in the upload set" >&2; fail=1
fi
# Anything the browser would load from another host (links to Linear are fine, loads are not).
LOADS='(src|href)=["'"'"']https?://[^"'"'"']*\.(js|css|woff2?|ttf)|<link[^>]+href=["'"'"']https?://|url\(["'"'"']?https?://|@import|preconnect'
if grep -rnE "$LOADS" "$OUT" --include='*.html' --include='*.css' --include='*.js' >&2; then
  echo "third-party resource in the upload set" >&2; fail=1
fi
if grep -rnE 'eyJ[A-Za-z0-9_-]{30,}|sb_''secret_|SUPABASE_SERVICE_''ROLE_KEY=[A-Za-z0-9_.-]{20,}|lin_''api_[A-Za-z0-9]{20,}|sb''p_[A-Za-z0-9]{20,}|#k=[A-Za-z0-9]{16,}' "$OUT" >&2; then
  echo "key-shaped value in the upload set" >&2; fail=1
fi
# No local path anywhere (CTO decision on MIN-4458).
if grep -rnE '/Users/|file://' "$OUT" >&2; then
  echo "local path in the upload set" >&2; fail=1
fi
# sample-data.js stays a stub: small, and no issue ids.
f="$OUT/sample-data.js"
if [ "$(wc -c < "$f")" -gt 2048 ]; then echo "$f is larger than 2 KB (real content?)" >&2; fail=1; fi
if grep -nE 'MIN-[0-9]' "$f" >&2; then echo "issue id in $f" >&2; fail=1; fi
# content.js: the 7 exercises and two empty deck stubs, nothing else (CTO guard 1, MIN-4458 15 Nov).
f="$OUT/shared/content.js"
size=$(wc -c < "$f")
if [ "$size" -gt 122880 ] || [ "$size" -lt 20000 ]; then echo "$f is $size bytes, expected 20 to 120 KB" >&2; fail=1; fi
if [ "$(grep -o '"md":' "$f" | wc -l | tr -d ' ')" != 7 ]; then echo "$f does not hold exactly 7 exercises" >&2; fail=1; fi
if [ "$(grep -o '"slides":\[\]' "$f" | wc -l | tr -d ' ')" != 2 ]; then echo "$f deck slides are not the two empty stubs" >&2; fail=1; fi
if grep -nE 'MIN-[0-9]' "$f" >&2; then echo "issue id in $f" >&2; fail=1; fi
if grep -nE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' "$f" >&2; then echo "email address in $f" >&2; fail=1; fi
# sim-data.js: the generated aggregates (MIN-4600): in date with data/synthetic/, small, labelled, and no per-record field.
python3 "$ROOT/dashboard/build_sims.py" --check >&2 || fail=1
f="$OUT/shared/sim-data.js"
if [ ! -f "$f" ]; then echo "shared/sim-data.js is missing" >&2; fail=1; else
  if [ "$(wc -c < "$f")" -gt 4096 ]; then echo "$f is larger than 4 KB" >&2; fail=1; fi
  if ! grep -qF 'Seeded synthetic data. Not real patients.' "$f"; then echo "the synthetic-data label is missing from $f" >&2; fail=1; fi
  if grep -nE '\b(records|detail|matched|persona|codes|labs|imaging|symptoms)"?\s*:|syn-[0-9]' "$f" >&2; then echo "per-record field in $f" >&2; fail=1; fi
fi
# The deck link is one constant, and the Demo tab is gone.
if ! grep -qF 'https://healthapp-landing.pages.dev/deck/' "$OUT/shared/common.js"; then echo "deck URL missing from shared/common.js" >&2; fail=1; fi
if grep -qF '#/demo' "$OUT/direction-A/index.html"; then echo "the Demo tab is still in direction-A/index.html" >&2; fail=1; fi
# No issue id in common.js outside comments (stricter than "in a string literal": code counts too).
if perl -0777 -pe 's{/\*.*?\*/}{}gs; s{^\s*//[^\n]*}{}gm' "$OUT/shared/common.js" | grep -nE 'MIN-[0-9]' >&2; then
  echo "issue id in shared/common.js outside a comment" >&2; fail=1
fi
[ "$fail" = 0 ] || exit 1
echo "upload set ok: $(find "$OUT" -type f | wc -l | tr -d ' ') files in $OUT"
