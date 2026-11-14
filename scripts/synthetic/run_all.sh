#!/bin/sh
# Generate -> test -> simulate, then prove it is reproducible (second run must give identical files). Run from this directory.
set -e
OUT=${1:-out}
rm -rf "$OUT" "$OUT.check"
python3 generate.py "$OUT"
python3 run_test.py "$OUT" | tee "$OUT/test-output.txt"
python3 simulate.py "$OUT" | tee "$OUT/simulation-output.txt"
python3 generate.py "$OUT.check" >/dev/null && python3 simulate.py "$OUT.check" >/dev/null
for f in cohort.json test-personas.json persona-maria.json simulation.json; do
  cmp "$OUT/$f" "$OUT.check/$f"
done
echo "REPRODUCIBLE: second run gave byte-identical files"; shasum -a 256 "$OUT"/*.json
rm -rf "$OUT.check"
