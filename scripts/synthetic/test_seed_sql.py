"""Checks of the generated matching seeds and the 019/018 rollback (MIN-4649). Usage: python3 test_seed_sql.py
(exit 1 on a failed check). Synthetic data only. Reads the committed files; writes only to a temporary folder.
  - seed_sql.py writes 006, 007, 019 and rollback/019_018_down.sql byte for byte as committed (no hand edit);
  - 019's compact payload, decoded the way its SQL decodes it, is the 5,000 records of data/synthetic/run-5000.json
    (what /doctor/simulate matches against), ids syn-0001..syn-5000, and its fingerprint is the CTO's;
  - 019 is one statement that carries its own check, refuses without 018 applied AND live, before any write;
  - the rollback undoes 019 (back to 006's rows, by 006's fingerprint) and then 018 (005's function only);
  - `hdb render` cannot take the rollback, `hdb down` can;
  - the writer refuses a run-5000.json with one record changed and writes nothing.
Prints cohort_md5, the value `scripts/hdb matches <env>` must show after 019 is applied."""
import hashlib, json, os, re, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))
DATA, SQL = os.path.join(ROOT, "data", "synthetic"), os.path.join(ROOT, "supabase", "sql")
HDB = os.path.join(ROOT, "scripts", "hdb")
DOWN = os.path.join("rollback", "019_018_down.sql")
SEEDS = ("006_seed_match_cohort.sql", "007_seed_match_persona.sql", "019_seed_match_cohort_5000.sql", DOWN)
# Measured independently by the CTO on Postgres 18 (MIN-4649, comment a590828a): `hdb matches` after 019 and
# after 006, and md5(prosrc) of 005's healthapp_possible_matches rendered for dev and for demo.
FP_5000, FP_400 = "81b63f0922ec2054a862b762c538b315", "0d8c7e2adfdd3c41c5dfe2b946b5c536"
PROSRC_005 = {"dev": "780425476319eee2ce6e26942d162fff", "demo": "15fd25770c6b9348ea2785c3128297fc"}
MAX_BYTES = 56_000  # 006 (38 KB) and the CTO's spike (43.8 KB) went through one execute_sql call
fails = []


def check(name, ok, detail=""):
    print("%s  %s%s" % ("ok  " if ok else "FAIL", name, ("   " + detail) if (detail and not ok) else ""))
    if not ok:
        fails.append(name)


def write(data, out):
    return subprocess.run([sys.executable, os.path.join(HERE, "seed_sql.py"), "write", data, out],
                          capture_output=True, text=True)


def read(name):
    return open(os.path.join(SQL, name), encoding="utf-8").read()


def fingerprint(rows):  # as supabase/sql/checks/match_cohort_counts.sql computes it
    return hashlib.md5("|".join("%s %s %s %s %s" % r for r in rows).encode()).hexdigest()


def decode(text):
    """The rows a compact DO block writes, decoded the way its SQL decodes them:
    (id, country, age band, 'true'/'false', 'code,code,...') in id order, plus the fingerprint it checks."""
    lit = lambda name: re.search(r"^  %s +constant text +:= '([^']*)';$" % name, text, re.M).group(1)
    lst = lambda name: re.findall(r"'([^']*)'", re.search(r"^  %s +constant text\[\] := array\[(.*?)\];$" % name,
                                                          text, re.M | re.S).group(1))
    b62, countries, bands, codes = lit("b62"), lst("v_countries"), lst("v_bands"), lst("v_codes")
    payload = re.search(r"^  v_payload +constant text +:= '\n(.*?)\n';$", text, re.M | re.S).group(1)
    rows = [("syn-%04d" % n, countries[b62.index(w[0])], bands[b62.index(w[1])], "true" if w[2] == "1" else "false",
             ",".join(codes[b62.index(ch)] for ch in w[3:]))
            for n, w in enumerate(payload.split(), start=1)]
    return rows, lit("want_cohort"), lit("want_labs")


def statements_outside_comments(text):
    return "\n".join(l for l in text.split("\n") if not l.startswith("--")).strip()


with tempfile.TemporaryDirectory() as tmp:
    r = write(DATA, tmp)
    check("seed_sql.py write exits 0", r.returncode == 0, r.stderr.strip())
    for name in SEEDS:
        a, b = os.path.join(tmp, name), os.path.join(SQL, name)
        same = os.path.exists(a) and open(a, "rb").read() == open(b, "rb").read()
        check("regenerated %s is byte-identical to the committed file" % name, same)

# ---- 019: the 5,000 records of /doctor/simulate, one compact self-checking statement
text = read(SEEDS[2])
run = json.load(open(os.path.join(DATA, "run-5000.json")))
rows, want_cohort, want_labs = decode(text)
check("019 holds 5,000 rows", len(rows) == 5000, "found %d" % len(rows))
want = [("syn-%04d" % (i + 1), rec[0], run["age_bands"][rec[1]], "true" if rec[2] else "false",
         ",".join(run["codes"][j] for j in rec[4])) for i, rec in enumerate(run["records"])]
diff = next((i for i, (g, w) in enumerate(zip(rows, want)) if g != w), None)
check("019's payload decodes back to run-5000.json's records (country, age band, opt-in, codes), ids syn-0001..",
      len(rows) == len(want) and diff is None, "first difference at row %s" % diff)
check("opted in: 019 and run-5000.json agree", sum(r[3] == "true" for r in rows) == sum(x[2] for x in run["records"]))
check("019's decoded rows have the CTO's fingerprint %s" % FP_5000, fingerprint(rows) == FP_5000, fingerprint(rows))
check("019 checks itself against that same fingerprint", want_cohort == FP_5000, want_cohort)

lab_block = lambda t: re.findall(r"^ +(\('[a-z_0-9]+', '[^']*', [0-9.]+, [0-9.]+, (?:'[A-Za-z_0-9]+'|null), "
                                 r"(?:'[A-Za-z_0-9]+'|null)\))", t, re.M)
labs019, labs006 = lab_block(text), lab_block(read(SEEDS[0]))
check("019 writes the same lab thresholds as 006", labs019 == labs006 and len(labs019) == 19, "%d vs %d" % (len(labs019), len(labs006)))
labs_md5 = hashlib.md5("|".join(" ".join(v.strip("'").replace("null", "") for v in re.split(r", ", l[1:-1]))
                                for l in labs019).encode()).hexdigest()
check("019 checks the thresholds against their own fingerprint", want_labs == labs_md5, "%s vs %s" % (want_labs, labs_md5))

body = statements_outside_comments(text)
check("019 is ONE statement: a single DO block", body.startswith("do $$\n") and body.endswith("\nend $$;")
      and body.count("$$") == 2)
check("019 fits one execute_sql call (< %d bytes)" % MAX_BYTES, len(text.encode()) < MAX_BYTES, str(len(text.encode())))
check("019 lines stay short (<= 160 characters)", max(map(len, text.split("\n"))) <= 160)
first_write = min(i for i in (body.find("insert into"), body.find("delete from")) if i >= 0)
applied = body.find("_applied where file = '018_matches_codes_once.sql'")
live = body.find("p.prosrc like '%into my_codes%'")
check("019 checks 018 in _applied before its first insert or delete", 0 <= applied < first_write)
check("019 checks 018's LIVE body (not only _applied) before its first insert or delete", 0 <= live < first_write)
check("019 raises when 018 is missing", "raise exception '019_seed_match_cohort_5000.sql needs 018" in body)
check("019 raises when the cohort fingerprint differs, before it records itself",
      0 <= body.find("cohort fingerprint % is not %: nothing was changed") < body.find("insert into __SCHEMA__._applied"))
check("019 records itself in _applied as its last write", body.endswith(
    "values ('019_seed_match_cohort_5000.sql') on conflict (file) do nothing;\nend $$;"))
check("019 says Do not edit, and never to re-run 006 after it",
      "Do not edit." in text and "NEVER re-run 006 after this file" in text)

# ---- the rollback: 019 first (back to 006's rows), then 018 (005's function only)
down = read(DOWN)
rows400, want400, _ = decode(down)
ROW006 = re.compile(r"^  \('(syn-\d{4})','([A-Z]{2})','([^']+)',(true|false),'\{([^}]*)\}'(?:::text\[\])?\),?$", re.M)
rows006 = ROW006.findall(read(SEEDS[0]))
check("the rollback's rows are 006's 400 rows (decoded payload vs 006's VALUES)",
      len(rows400) == 400 and rows400 == rows006, "%d vs %d" % (len(rows400), len(rows006)))
check("the rollback checks 006's fingerprint %s" % FP_400, want400 == FP_400 == fingerprint(rows400), want400)
fn005 = read("005_matches.sql")
start = fn005.index("create or replace function __SCHEMA__.healthapp_possible_matches(")
fn = fn005[start:fn005.index("\n$$;\n", start) + 4]
check("the rollback holds 005's healthapp_possible_matches byte for byte", fn in down)
check("the rollback recreates that one function only (never the whole 005: 014's match_patient_codes stays)",
      down.count("create or replace function") == 1 and "005_matches.sql') " not in down
      and "match_patient_codes(patient" not in down)
src = fn[fn.index("\nas $$") + 6:fn.rindex("$$")]
for env, md5 in PROSRC_005.items():
    got = hashlib.md5(src.replace("__SCHEMA__", "healthapp_" + env).encode()).hexdigest()
    check("restored body md5(prosrc) on %s is the CTO's %s" % (env, md5), got == md5, got)
order = [down.find(s) for s in ("delete from __SCHEMA__._applied where file = '019_seed_match_cohort_5000.sql'",
                                "create or replace function __SCHEMA__.healthapp_possible_matches(",
                                "revoke execute on function __SCHEMA__.healthapp_possible_matches(uuid) from public",
                                "grant execute on function __SCHEMA__.healthapp_possible_matches(uuid) to authenticated",
                                "delete from __SCHEMA__._applied where file = '018_matches_codes_once.sql'",
                                "notify pgrst, 'reload schema'")]
check("rollback order: 019 undone (rows, then its _applied row), then 018 (function, revoke, grant, _applied), notify",
      all(i >= 0 for i in order) and order == sorted(order), str(order))
check("the rollback fits one execute_sql call", len(down.encode()) < MAX_BYTES)

r1 = subprocess.run([HDB, "render", "dev", DOWN], capture_output=True, text=True)
r2 = subprocess.run([HDB, "render", "dev", os.path.basename(DOWN)], capture_output=True, text=True)
r3 = subprocess.run([HDB, "down", "demo", os.path.basename(DOWN)], capture_output=True, text=True)
check("`hdb render` cannot take the rollback (it is not a migration)", r1.returncode != 0 and r2.returncode != 0)
check("`hdb down <env>` renders it with every name filled in",
      r3.returncode == 0 and "__SCHEMA__" not in r3.stdout and "healthapp_demo.healthapp_possible_matches" in r3.stdout)

# ---- the writer refuses a changed source and writes nothing
with tempfile.TemporaryDirectory() as tmp:
    data, out = os.path.join(tmp, "data"), os.path.join(tmp, "sql")
    os.makedirs(data); os.makedirs(out)
    for name in ("cohort.json", "persona-maria.json"):
        open(os.path.join(data, name), "w").write(open(os.path.join(DATA, name)).read())
    bad = json.loads(json.dumps(run))
    bad["records"][1234][2] = 0 if bad["records"][1234][2] else 1      # one record's opt-in flipped
    json.dump(bad, open(os.path.join(data, "run-5000.json"), "w"))
    r = write(data, out)
    check("the writer refuses a run-5000.json with one record changed, and writes no file at all",
          r.returncode != 0 and os.listdir(out) == [], r.stdout + r.stderr)

print("\ncohort_md5 (019, as `hdb matches` computes it): %s" % fingerprint(rows))
print("%s" % ("ALL CHECKS PASSED" if not fails else "FAILED: %s" % fails))
sys.exit(1 if fails else 0)
