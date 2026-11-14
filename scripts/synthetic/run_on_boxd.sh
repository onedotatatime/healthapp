#!/bin/sh
# One recorded run of the 5,000-record cohort on one boxd machine (MIN-4504). Synthetic only.
# Copies three scripts (nothing else), runs generate.py --n 5000 and build_run.py there, pulls run-5000.json back,
# deletes the machine, and writes the REAL timestamps of each phase into the "vm" block of the file.
# Needs the boxd CLI signed in. Usage: sh run_on_boxd.sh <S> <out.json>
set -eu
S=${1:?S}; OUT=${2:?out.json}; HERE=$(cd "$(dirname "$0")" && pwd)
NAME="healthapp-sim-$(date -u +%Y%m%d-%H%M%S)"
LOG=$(mktemp); trap 'boxd machine remove "$NAME" -y >/dev/null 2>&1 || true; boxd list >>"$LOG" 2>&1 || true' EXIT
now() { python3 -c 'import time;print(time.time())'; }
T0=$(now); echo "[created] boxd machine new $NAME"
boxd machine new "$NAME" --json --delete-after 30m >"$LOG.new" 2>&1 || { cat "$LOG.new"; exit 1; }
T1=$(now); cat "$LOG.new"
boxd machine exec "$NAME" -- python3 --version
boxd machine exec "$NAME" -- mkdir -p sim
for f in generate.py match.py build_run.py; do boxd machine cp "$HERE/$f" "$NAME:sim/$f"; done
T2=$(now); echo "[running]"
boxd machine exec "$NAME" -- sh -c "cd sim && python3 generate.py out --n 5000 --sarcoid $S && python3 build_run.py out run-5000.json && sha256sum generate.py match.py build_run.py run-5000.json" | tee "$LOG.run"
T3=$(now)
boxd machine cp "$NAME:sim/run-5000.json" "$OUT.vm"
boxd machine get "$NAME" --json >"$LOG.get" 2>&1 || true
boxd list --json >"$LOG.list" 2>&1 || true; cat "$LOG.list"
boxd machine remove "$NAME" -y; T4=$(now); echo "[deleted]"
python3 - "$OUT.vm" "$OUT" "$NAME" "$LOG.new" "$LOG.get" "$LOG.run" "$LOG.list" "$T0" "$T1" "$T2" "$T3" "$T4" <<'PY'
import json, sys, datetime
src, out, name, lnew, lget, lrun, llist, *t = sys.argv[1:]; t = [float(x) for x in t]
iso = lambda x: datetime.datetime.fromtimestamp(x, datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
d = json.load(open(src))
sh = {l.split()[1]: l.split()[0] for l in open(lrun) if l.strip().endswith((".py", ".json")) and len(l.split()[0]) == 64}
def grab(path):
    try: return json.load(open(path))
    except Exception: return {}
get = grab(lget); new = grab(lnew)
lst = grab(llist); lst = lst if isinstance(lst, list) else lst.get("machines", [])
mine = next((m for m in lst if isinstance(m, dict) and m.get("name") == name), {})
region = get.get("region") or new.get("region") or mine.get("region") or "org default (the CLI does not report it)"
d["vm"] = {"provider": "boxd", "machine": name, "region": region, "size": get.get("size"), "started_at": iso(t[0]), "seconds": round(t[4] - t[0], 1),
           "phases": [{"id": "created", "at": iso(t[1]), "seconds": round(t[1] - t[0], 1), "log": "machine ready"},
                      {"id": "running", "at": iso(t[2]), "seconds": round(t[3] - t[2], 1), "log": "generate.py --n 5000, build_run.py"},
                      {"id": "done", "at": iso(t[3]), "seconds": 0.0, "log": "run-5000.json written"},
                      {"id": "deleted", "at": iso(t[4]), "seconds": round(t[4] - t[3], 1), "log": "machine deleted"}],
           "script_sha256": {k: v for k, v in sh.items() if k.endswith(".py")}, "deleted": True}
with open(out, "w") as f: json.dump(d, f, separators=(",", ":"), sort_keys=True); f.write("\n")
print(json.dumps(d["vm"], indent=1))
PY
