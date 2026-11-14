"""Public dashboard content (MIN-4600, CTO decision on MIN-4458, 15 Nov): the business exercises, the deck link, the Demo tab gone and the
Doctor simulations view. Source and bundle guards; the page itself is looked at in a browser (the built bundle served from a temp folder).

The bundle tests run dashboard/pages-bundle.sh for real, into a folder outside the repo, and plant faults in a copy of the tree to see each new guard fire."""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
DRAFTS = os.path.join(ROOT, "docs", "dashboard", "drafts")
SIM_JS = os.path.join(DRAFTS, "shared", "sim-data.js")
LABEL = "Seeded synthetic data. Not real patients."
DECK = "https://healthapp-landing.pages.dev/deck/"


def read(*p):
    with open(os.path.join(ROOT, *p)) as f:
        return f.read()


def sims():
    text = read("docs", "dashboard", "drafts", "shared", "sim-data.js")
    return json.loads(re.search(r"^const SIMS = (\{.*\});$", text, re.M).group(1)), text


def bundle(src_root, out):
    return subprocess.run(["bash", os.path.join(src_root, "dashboard", "pages-bundle.sh"), out], capture_output=True, text=True)


class SimData(unittest.TestCase):
    def test_committed_file_is_what_the_generator_writes(self):
        r = subprocess.run([sys.executable, os.path.join(ROOT, "dashboard", "build_sims.py"), "--check"], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stderr)

    def test_only_the_whitelisted_aggregates_are_there(self):
        d, text = sims()
        self.assertEqual(set(d), {"label", "run", "growth"})
        self.assertEqual(d["label"], LABEL)
        self.assertEqual(set(d["run"]), {"machine", "provider", "size", "started_at", "seconds", "deleted", "phases", "seed", "n", "k", "min_shared", "funnel", "match_count", "by_country"})
        self.assertEqual(set(d["growth"]), {"label", "seed", "cohort_size", "k", "min_shared", "x_label", "x_values", "rate_label", "rate_unit", "rate_values"})
        self.assertLessEqual(len(text.encode()), 4096)

    def test_the_numbers_are_the_sources_numbers(self):
        d, _ = sims()
        with open(os.path.join(ROOT, "data", "synthetic", "run-5000.json")) as f:
            run = json.load(f)
        with open(os.path.join(ROOT, "data", "synthetic", "simulation.json")) as f:
            sim = json.load(f)
        self.assertEqual(d["run"]["funnel"], run["result"]["funnel"])
        self.assertEqual(sum(n for _, n in d["run"]["by_country"]), len(run["result"]["matched"]))
        self.assertEqual(d["run"]["by_country"], [["GR", 2], ["ES", 1], ["FR", 1], ["NL", 1]])
        series1 = [s for s in sim["series"] if s["id"] == 1][0]
        self.assertEqual(d["growth"]["rate_values"], series1["values"])
        self.assertEqual(len(d["growth"]["x_values"]), 12)

    def test_nothing_per_record_nothing_from_the_persona_cohort_or_later_series(self):
        _, text = sims()
        with open(os.path.join(ROOT, "data", "synthetic", "run-5000.json")) as f:
            run = json.load(f)
        with open(os.path.join(ROOT, "data", "synthetic", "simulation.json")) as f:
            sim = json.load(f)
        self.assertIsNone(re.search(r'\b(records|detail|matched|persona|codes|labs|imaging|symptoms)"?\s*:|syn-[0-9]', text))
        for code in run["persona"]["codes"] + run["result"]["groups"][0]["pattern"] + ["persona-rare", "age_band", "script_sha256"]:
            self.assertNotIn(code, text)
        for s in sim["series"]:
            if s["id"] != 1:
                self.assertNotIn(s["label"], text)
                self.assertNotIn(json.dumps(s["values"], separators=(",", ":")), text)
        self.assertNotIn("cohort.json", text)
        self.assertNotIn("/Users/", text)


class Page(unittest.TestCase):
    def setUp(self):
        self.a = read("docs", "dashboard", "drafts", "direction-A", "a.js")
        self.html = read("docs", "dashboard", "drafts", "direction-A", "index.html")
        self.common = read("docs", "dashboard", "drafts", "shared", "common.js")

    def test_demo_tab_is_gone_and_slot_five_is_simulations(self):
        self.assertNotIn("#/demo", self.html)
        self.assertIn('<a href="#/simulations" data-view="simulations" title="Simulations (5)"><b>5</b>Sims</a>', self.html)
        self.assertNotIn("data-view=\"demo\"", self.html)
        self.assertIn("'5':'#/simulations'", self.a)
        self.assertNotIn("function demoView", self.a)
        self.assertIsNone(re.search(r"href=\"#/demo\"", self.a))

    def test_old_demo_links_land_on_the_simulations(self):
        self.assertRegex(self.a, r"if\(p\[0\]==='demo'\)\{ p\[0\] = 'simulations'; history\.replaceState\(null,'','#/simulations'\)")

    def test_sim_data_loads_before_the_page_script(self):
        self.assertLess(self.html.index("shared/sim-data.js"), self.html.index('src="a.js"'))

    def test_deck_link_is_one_constant_and_a_url_only(self):
        self.assertEqual(self.common.count(DECK), 1)
        self.assertIn("id=\"deckLink\" href=\"'+esc(H.deckUrl)+'\" target=\"_blank\" rel=\"noopener\">Open the pitch deck", self.a)
        self.assertNotIn("<iframe", self.a)
        decks = self.a[self.a.index("function decksView()"):self.a.index("let viewerT0")]
        self.assertNotRegex(decks, r"https?://")                    # the only address in the view is the constant
        self.assertNotIn("file://", self.a)

    def test_both_labels_are_in_the_view_the_boxd_one_on_the_5000_run_only(self):
        view = self.a[self.a.index("function simsView()"):self.a.index("function renderDrawer(")]
        self.assertEqual(len(re.findall(r"\+\s*lab\+", view)), 2)                                    # both simulation cards
        self.assertEqual(view.count("Recorded run on a '+esc(r.provider)+' machine, '+esc(dateOf(r.started_at))+'. Replayed here, not live."), 1)
        self.assertEqual(view.count("Replayed here, not live"), 1)


class Bundle(unittest.TestCase):
    def test_bundle_passes_and_carries_exercises_sims_and_deck_url_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = os.path.join(tmp, "out")
            r = bundle(ROOT, out)
            self.assertEqual(r.returncode, 0, r.stderr)
            content = open(os.path.join(out, "shared", "content.js")).read()
            self.assertEqual(content.count('"md":'), 7)
            self.assertEqual(content.count('"slides":[]'), 2)
            self.assertIsNone(re.search(r"MIN-\d", content))
            self.assertNotIn("Hook", content)                      # deck slide titles stay out
            self.assertTrue(60000 < len(content.encode()) < 122880)
            self.assertLessEqual(os.path.getsize(os.path.join(out, "shared", "sim-data.js")), 4096)
            self.assertLessEqual(os.path.getsize(os.path.join(out, "sample-data.js")), 2048)
            self.assertIn(DECK, open(os.path.join(out, "shared", "common.js")).read())
            self.assertFalse([f for _, _, fs in os.walk(out) for f in fs if f.endswith(".json")])
            self.assertNotIn("#/demo", open(os.path.join(out, "direction-A", "index.html")).read())

    def _planted(self, edit):
        with tempfile.TemporaryDirectory() as tmp:
            tree = os.path.join(tmp, "tree")
            os.makedirs(os.path.join(tree, "docs", "dashboard"))
            shutil.copytree(os.path.join(ROOT, "docs", "dashboard", "drafts"), os.path.join(tree, "docs", "dashboard", "drafts"))
            shutil.copytree(os.path.join(ROOT, "data", "synthetic"), os.path.join(tree, "data", "synthetic"))
            os.makedirs(os.path.join(tree, "dashboard"))
            for f in ("pages-bundle.sh", "build_sims.py"):
                shutil.copy(os.path.join(ROOT, "dashboard", f), os.path.join(tree, "dashboard", f))
            edit(tree)
            return bundle(tree, os.path.join(tmp, "out"))

    def test_an_email_in_the_exercises_fails_the_bundle(self):
        def edit(tree):
            p = os.path.join(tree, "docs", "dashboard", "drafts", "shared", "content.js")
            t = open(p).read()
            open(p, "w").write(t.replace("Synthetic personas only", "Synthetic personas only, write to someone@example.com", 1))
        r = self._planted(edit)
        self.assertNotEqual(r.returncode, 0)
        self.assertIn("email address", r.stderr)

    def test_a_per_record_field_in_sim_data_fails_the_bundle(self):
        def edit(tree):
            p = os.path.join(tree, "docs", "dashboard", "drafts", "shared", "sim-data.js")
            t = open(p).read()
            open(p, "w").write(t.replace('"seed":20261114', '"persona":{"id":"persona-rare"},"seed":20261114', 1))
        r = self._planted(edit)
        self.assertNotEqual(r.returncode, 0)
        self.assertIn("per-record field", r.stderr)

    def test_a_missing_label_fails_the_bundle(self):
        def edit(tree):
            p = os.path.join(tree, "docs", "dashboard", "drafts", "shared", "sim-data.js")
            t = open(p).read()
            open(p, "w").write(t.replace(LABEL, "Seeded data", 1))
        r = self._planted(edit)
        self.assertNotEqual(r.returncode, 0)
        self.assertIn("label is missing", r.stderr)

    def test_a_demo_link_in_the_page_fails_the_bundle(self):
        def edit(tree):
            p = os.path.join(tree, "docs", "dashboard", "drafts", "direction-A", "index.html")
            t = open(p).read()
            open(p, "w").write(t.replace('href="#/simulations"', 'href="#/demo"', 1))
        r = self._planted(edit)
        self.assertNotEqual(r.returncode, 0)
        self.assertIn("Demo tab is still", r.stderr)

    def test_an_exercise_missing_fails_the_bundle(self):
        def edit(tree):
            p = os.path.join(tree, "docs", "dashboard", "drafts", "shared", "content.js")
            with open(p) as f:
                c = f.read()
            data = json.loads(re.search(r"^const CONTENT = (\{.*\});\s*$", c, re.S | re.M).group(1))
            data["exercises"].pop()
            open(p, "w").write("const CONTENT = " + json.dumps(data) + ";\n")
        r = self._planted(edit)
        self.assertNotEqual(r.returncode, 0)
        self.assertIn("expected 7 exercises", r.stderr)


if __name__ == "__main__":
    unittest.main()
