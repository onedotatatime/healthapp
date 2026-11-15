#!/bin/sh
# One recorded run of the 50,000-record recruitment file on one boxd machine (MIN-4741). Synthetic only.
# Copies four scripts (nothing else), runs build_recruit.py there, pulls recruit-50000.json back, proves it is byte-identical
# to the committed file (cmp), deletes the machine, and writes the REAL timestamps of each phase to data/synthetic/recruit-50000.vm.json.
# It never edits recruit-50000.json. Needs the boxd CLI signed in (no key is read or printed here).
# Usage: sh scripts/synthetic/run_recruit_on_boxd.sh [out.vm.json]     default: data/synthetic/recruit-50000.vm.json
set -eu
HERE=$(cd "$(dirname "$0")" && pwd)
COMMITTED="$HERE/../../data/synthetic/recruit-50000.json"
OUT=${1:-"$HERE/../../data/synthetic/recruit-50000.vm.json"}
NAME="healthapp-recruit-$(date -u +%Y%m%d-%H%M%S)"
TMP=$(mktemp -d); LOG="$TMP/log"
trap 'boxd machine remove "$NAME" -y >/dev/null 2>&1 || true; rm -rf "$TMP"' EXIT
now() { python3 -c 'import time;print(time.time())'; }
T0=$(now); echo "[created] boxd machine new $NAME"
boxd machine new "$NAME" --json --delete-after 30m >"$LOG.new" 2>&1 || { cat "$LOG.new"; exit 1; }
T1=$(now); cat "$LOG.new"
boxd machine exec "$NAME" -- python3 --version
boxd machine exec "$NAME" -- mkdir -p sim
for f in generate.py match.py recruit.py build_recruit.py; do boxd machine cp "$HERE/$f" "$NAME:sim/$f"; done
T2=$(now); echo "[running]"
boxd machine exec "$NAME" -- sh -c "cd sim && python3 build_recruit.py recruit-50000.json && sha256sum generate.py match.py recruit.py build_recruit.py recruit-50000.json" | tee "$LOG.run"
T3=$(now)
boxd machine cp "$NAME:sim/recruit-50000.json" "$TMP/recruit-50000.json"
boxd machine get "$NAME" --json >"$LOG.get" 2>&1 || true
boxd list --json >"$LOG.list" 2>&1 || true
cmp "$TMP/recruit-50000.json" "$COMMITTED" && echo "[cmp] machine file is byte-identical to the committed file"
boxd machine remove "$NAME" -y; T4=$(now); echo "[deleted]"
python3 - "$TMP/recruit-50000.json" "$OUT" "$NAME" "$LOG.new" "$LOG.get" "$LOG.run" "$LOG.list" "$T0" "$T1" "$T2" "$T3" "$T4" <<'PY'
import json, os, sys, datetime
src, out, name, lnew, lget, lrun, llist, *t = sys.argv[1:]; t = [float(x) for x in t]
iso = lambda x: datetime.datetime.fromtimestamp(x, datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
sh = {l.split()[1]: l.split()[0] for l in open(lrun) if len(l.split()) == 2 and len(l.split()[0]) == 64}
def grab(path):
    try: return json.load(open(path))
    except Exception: return {}
get = grab(lget); new = grab(lnew)
lst = grab(llist); lst = lst if isinstance(lst, list) else lst.get("machines", [])
mine = next((m for m in lst if isinstance(m, dict) and m.get("name") == name), {})
region = get.get("region") or new.get("region") or mine.get("region") or "org default (the CLI does not report it)"
vm = {"provider": "boxd", "machine": name, "region": region, "size": get.get("size"), "started_at": iso(t[0]), "seconds": round(t[4] - t[0], 1),
      "phases": [{"id": "created", "at": iso(t[1]), "seconds": round(t[1] - t[0], 1), "log": "machine ready"},
                 {"id": "running", "at": iso(t[2]), "seconds": round(t[3] - t[2], 1), "log": "build_recruit.py recruit-50000.json"},
                 {"id": "done", "at": iso(t[3]), "seconds": 0.0, "log": "recruit-50000.json written, sha256 computed"},
                 {"id": "deleted", "at": iso(t[4]), "seconds": round(t[4] - t[3], 1), "log": "machine deleted"}],
      "script_sha256": {k: v for k, v in sh.items() if k.endswith(".py")},
      "file_sha256": sh.get("recruit-50000.json"),
      "file_bytes": os.path.getsize(src), "deleted": True}
with open(out, "w") as f: json.dump(vm, f, separators=(",", ":"), sort_keys=True); f.write("\n")
print(json.dumps(vm, indent=1))
PY
