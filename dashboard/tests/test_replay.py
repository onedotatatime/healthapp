"""Dashboard replay (MIN-4766): the pure model runs in node, guards on the page source, the dev fixtures and the Pages bundle.

The page itself is looked at in a browser (replay/index.html?feed=../dev/replay.json&now=2026-11-14T16:00). Here: the cases a browser cannot be asked cheaply twice
(bucket edges, the partial last bucket, reduced motion, bad series). `node` is needed for the model tests; without it they are skipped, the source and bundle tests still run."""
import json
import os
import re
import shutil
import subprocess
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
DRAFTS = os.path.join(ROOT, "docs", "dashboard", "drafts")
REPLAY = os.path.join(DRAFTS, "replay")
REPLAY_JS = os.path.join(REPLAY, "replay.js")
NODE = shutil.which("node")

RUNNER = r"""
const vm = require('vm'), fs = require('fs'); const w = {};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), { window: w }); const M = w.ReplayModel;
const FIX = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = {};
const T0 = Date.parse('2026-11-14T10:00:00Z'), STEP = 15 * 60000, UNTIL = Date.parse('2026-11-14T14:00:02Z');
const S = [0, 0, 0, 5, 9, 9, 10, 12, 20, 21, 22, 23, 24, 25, 26, 30];            // 16 buckets: the last one is the partial step ending at UNTIL
const at = t => M.valueAt(S, T0, STEP, UNTIL, t);
// bucket edges: element i is the value at from + (i + 1) * step
out.edges = [-1e9, 0, STEP - 1, STEP, 2 * STEP - 1, 3 * STEP, 4 * STEP - 1, 4 * STEP, 15 * 60000 * 15 - 1].map(d => at(T0 + d));
out.beforeStart = at(T0 - 5 * STEP);
out.afterUntil = [at(UNTIL), at(UNTIL + 1e9)];
out.lastFullEdge = at(T0 + 15 * STEP);                                              // 225 min: the last full edge, still not the partial one
out.noUntil = M.valueAt(S, T0, STEP, NaN, T0 + 1e12);                               // no window: never past the last full bucket, never a throw
out.slice = [M.sliceAt(S, T0, STEP, UNTIL, T0 + 4 * STEP).length, M.sliceAt(S, T0, STEP, UNTIL, UNTIL).length, M.sliceAt(S, T0, STEP, UNTIL, T0 - 1).length];
out.sliceNoMutate = (() => { const c = JSON.stringify(S); M.sliceAt(S, T0, STEP, UNTIL, UNTIL); return JSON.stringify(S) === c; })();
out.badInputs = [M.valueAt([], T0, STEP, UNTIL, T0), M.valueAt(S, NaN, STEP, UNTIL, T0), M.valueAt(S, T0, 0, UNTIL, T0), M.valueAt(S, T0, STEP, UNTIL, NaN)];
// span and playhead
const A = Date.parse('2026-11-14T12:00:00+02:00'), D = Date.parse('2026-11-15T18:00:00+02:00');
out.spanEnd = [M.spanEnd(D - 1000, D) === D - 1000, M.spanEnd(D + 5000, D) === D, M.spanEnd(D + 5000, NaN) === D + 5000];
out.head = [0, 15000, 30000, 59999, 60000, 90000, -5].map(e => { const h = M.playhead(A, D, e, false); return [h.p, h.t === A + h.p * (D - A), h.done]; });
out.headEnd = M.playhead(A, D, 60000, false).t === D;
out.headReduced = [0, 999, 1000, 1999, 30500, 59999, 60000].map(e => M.playhead(A, D, e, true).p);
// duration: 60 s of real time is the whole run, whatever the span
out.duration = [M.DURATION_MS, M.playhead(A, D, 59999, false).done, M.playhead(A, A + 60000, 60000, false).done];
// can play
const snap = FIX.full;
out.can = [
  M.canPlay({ hasKey: false, snap }), M.canPlay({ hasKey: true, snap: null }), M.canPlay({ hasKey: true, error: new Error('x'), snap }),
  M.canPlay({ hasKey: true, snap: { tokens: { series: [] } } }), M.canPlay({ hasKey: true, snap: { tokens: { series: [1], seriesFrom: 'nope' } } }),
  M.canPlay({ hasKey: true, snap: {} }), M.canPlay({ hasKey: true, snap }), M.canPlay(), M.canPlay({ hasKey: true, snap: { tokens: { series: [1, 'x'], seriesFrom: '2026-11-14T10:00:00Z' } } })
];
out.labels = ['nokey', 'unreadable', 'noseries'].map(k => [M.LABEL[k], M.WHY[k]]);
// frames from the dev fixture
const till = ms => Date.parse('2026-11-14T10:00:00Z') + ms;
out.f0 = M.frame(snap, till(0));
out.f30 = M.frame(snap, till(2 * 60 * 60000));
out.fEnd = M.frame(snap, Date.parse(snap.tokens.window.until));
out.fNoDone = M.frame(FIX.nodone, till(2 * 60 * 60000));
out.fBadDone = [M.frame({ tokens: snap.tokens, money: snap.money, doneSeries: { seriesFrom: 'x', stepMin: 15, total: [1] } }, till(1)).hasDone,
  M.frame({ tokens: snap.tokens, money: snap.money, doneSeries: { seriesFrom: snap.tokens.seriesFrom, stepMin: 0, total: [1] } }, till(1)).hasDone,
  M.frame({ tokens: snap.tokens, money: snap.money, doneSeries: { seriesFrom: snap.tokens.seriesFrom, stepMin: 15, total: ['a'] } }, till(1)).hasDone,
  M.frame({ tokens: snap.tokens, money: snap.money, doneSeries: [] }, till(1)).hasDone,
  M.frame({ tokens: snap.tokens, money: snap.money }, till(1)).hasDone];
out.fNoMoney = M.frame({ tokens: snap.tokens }, till(60 * 60000));
// directions
const dirs = [{ n: 1, title: 'A', status: 'on_track', note: '5 of 8 done, 1 blocked', updatedAt: 'x' }, { n: 2, title: 'B', status: 'at_risk', note: 'no issues mapped', updatedAt: 'x' }, { n: 3, title: 'C', status: 'not_started', note: '', updatedAt: 'x' }, null, 'junk'];
out.dirs = M.directionsAt(dirs, { 1: 2, 2: 1, 3: 1 });
out.dirsOver = M.directionsAt(dirs, { 1: 99 })[0].note;                                // never more done than today's total
out.dirsNoMutate = (() => { const c = JSON.stringify(dirs); M.directionsAt(dirs, { 1: 2 }); return JSON.stringify(dirs) === c; })();
out.dirsBad = [M.directionsAt(null, {}), M.directionsAt(undefined, {}), M.directionsAt('x', {})];
out.dirsNoSeries = M.directionsAt(dirs, {})[0].note;
console.log(JSON.stringify(out));
"""


def run_model():
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        full = json.load(open(os.path.join(DRAFTS, "dev", "replay.json")))
        nodone = json.load(open(os.path.join(DRAFTS, "dev", "replay-nodone.json")))
        json.dump({"full": full, "nodone": nodone}, f)
    try:
        r = subprocess.run([NODE, "-e", RUNNER.replace("process.argv[1]", "'%s'" % REPLAY_JS).replace("process.argv[2]", "'%s'" % f.name)],
                           capture_output=True, text=True, timeout=30)
    finally:
        os.unlink(f.name)
    assert r.returncode == 0, r.stderr
    return json.loads(r.stdout)


@unittest.skipUnless(NODE, "node is not installed")
class ModelTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.o = run_model()

    def test_bucket_edges(self):
        # before the first edge: 0; at an edge the bucket is in; one ms before it is not
        self.assertEqual(self.o["edges"], [0, 0, 0, 0, 0, 0, 0, 5, 25])
        self.assertEqual(self.o["beforeStart"], 0)

    def test_last_element_is_the_value_at_until_not_before(self):
        self.assertEqual(self.o["lastFullEdge"], 26)
        self.assertEqual(self.o["afterUntil"], [30, 30])
        self.assertEqual(self.o["noUntil"], 30)       # without a window a time past the series reads its last value, and nothing throws

    def test_slice_matches_the_value(self):
        self.assertEqual(self.o["slice"], [4, 16, 0])
        self.assertTrue(self.o["sliceNoMutate"])

    def test_bad_inputs_are_zero_not_a_throw(self):
        self.assertEqual(self.o["badInputs"], [0, 0, 0, 0])

    def test_span_ends_at_now_or_the_deadline(self):
        self.assertEqual(self.o["spanEnd"], [True, True, True])

    def test_playhead_is_time_based_and_ends_exactly_on_the_end(self):
        # p is elapsed / 60 s, clamped; the last frame is exactly the end instant, whatever the rounding
        self.assertEqual([h[0] for h in self.o["head"]], [0, 0.25, 0.5, 59999 / 60000, 1, 1, 0])
        self.assertEqual([h[2] for h in self.o["head"]], [False, False, False, False, True, True, False])
        self.assertTrue(all(h[1] for h in self.o["head"][:4]))
        self.assertTrue(self.o["headEnd"])

    def test_reduced_motion_is_one_step_per_second_over_the_same_60_seconds(self):
        self.assertEqual(self.o["headReduced"], [0, 0, 1 / 60, 1 / 60, 30 / 60, 59 / 60, 1])

    def test_the_run_is_sixty_seconds(self):
        self.assertEqual(self.o["duration"], [60000, False, True])

    def test_play_is_disabled_without_key_or_read_or_series(self):
        can = self.o["can"]
        self.assertEqual([c["reason"] for c in can], ["nokey", "unreadable", "unreadable", "noseries", "noseries", "noseries", None, "nokey", "noseries"])
        self.assertEqual([c["ok"] for c in can], [False] * 6 + [True, False, False])
        labels = self.o["labels"]
        self.assertEqual(labels[0][0], "Open this page with your viewer link")
        self.assertEqual(labels[1][0], "Open this page with your viewer link")
        self.assertNotIn("viewer link", labels[2][0])       # no history is not a key problem

    def test_frames_from_the_fixture(self):
        f0, f30, fe = self.o["f0"], self.o["f30"], self.o["fEnd"]
        self.assertEqual((f0["done"], f0["tokens"], f0["eur"]), (0, 0, 0))
        self.assertEqual(f0["tokSeries"], [])
        # 2 h in = 8 buckets
        self.assertEqual(len(f30["tokSeries"]), 8)
        self.assertEqual(f30["done"], 3)                    # doneSeries.total[7] of the fixture
        self.assertEqual(f30["byMilestone"], {"M1": 3, "M2": 0})
        self.assertEqual(f30["byDirection"]["1"], 2)
        # the end of the window is the last element of every series: the invariant the live page relies on
        self.assertEqual(fe["done"], 12)
        self.assertEqual(fe["byMilestone"], {"M1": 5, "M2": 3})
        self.assertEqual([fe["byDirection"][k] for k in "12345"], [5, 4, 2, 1, 1])
        full = json.load(open(os.path.join(DRAFTS, "dev", "replay.json")))
        self.assertEqual(fe["tokens"], full["tokens"]["series"][-1])
        self.assertEqual(fe["eur"], full["money"]["estimateSeries"][-1])
        self.assertEqual(len(fe["tokSeries"]), len(full["tokens"]["series"]))

    def test_no_done_series_means_no_done_numbers(self):
        f = self.o["fNoDone"]
        self.assertFalse(f["hasDone"])
        self.assertEqual((f["done"], f["byMilestone"], f["byDirection"]), (0, {}, {}))
        self.assertGreater(f["tokens"], 0)                  # tokens and money still replay

    def test_a_bad_done_series_is_no_done_history(self):
        self.assertEqual(self.o["fBadDone"], [False, False, False, False, False])

    def test_no_money_series_gives_no_euro_value(self):
        f = self.o["fNoMoney"]
        self.assertIsNone(f["eur"])
        self.assertEqual(f["eurSeries"], [])

    def test_direction_notes(self):
        d = self.o["dirs"]
        self.assertEqual(d[0]["note"], "2 of 8 done")       # N is today's total, read from the live note; the rest of the live note is dropped
        self.assertIsNone(d[0]["updatedAt"])
        self.assertEqual((d[0]["title"], d[0]["status"]), ("A", "on_track"))      # title and status stay live
        self.assertEqual(d[1]["note"], "no issues mapped")                         # no "d of N" in the note: left alone
        self.assertEqual(d[2]["note"], "")
        self.assertEqual(d[3:], [None, "junk"])
        self.assertEqual(self.o["dirsOver"], "8 of 8 done")
        self.assertTrue(self.o["dirsNoMutate"])
        self.assertEqual(self.o["dirsBad"], [[], [], []])
        self.assertEqual(self.o["dirsNoSeries"], "5 of 8 done, 1 blocked")


class SourceTests(unittest.TestCase):
    def read(self, name):
        with open(os.path.join(REPLAY, name), encoding="utf-8") as f:
            return f.read()

    def test_folder_holds_only_its_three_files(self):
        self.assertEqual(sorted(os.listdir(REPLAY)), ["index.html", "replay.css", "replay.js"])

    def test_page_loads_direction_a_unchanged_and_replay_last(self):
        html = self.read("index.html")
        scripts = re.findall(r'<script src="([^"]+)"></script>', html)
        self.assertEqual(scripts[-2:], ["../direction-A/a.js", "replay.js"])
        self.assertIn('href="../direction-A/a.css"', html)

    def test_no_inline_script_no_inline_handler_no_other_host(self):
        html = self.read("index.html")
        self.assertEqual(re.findall(r"<script(?![^>]*\bsrc=)[^>]*>", html), [])
        self.assertIsNone(re.search(r"\son[a-z]+=", html))
        for name in ("index.html", "replay.js", "replay.css"):
            self.assertIsNone(re.search(r"https?://", self.read(name)), name)
        self.assertNotIn("#/demo", html)
        self.assertIsNone(re.search(r"MIN-\d", html + self.read("replay.js") + self.read("replay.css")))

    def test_play_gate_texts_are_the_agreed_strings(self):
        js = self.read("replay.js")
        for s in ("Play the build in 60 seconds", "Replay", "Open this page with your viewer link"):
            self.assertIn(s, js)
        self.assertIn("Real history from Linear and the token log, 15-minute steps.", self.read("index.html"))

    def test_the_clock_is_not_forked_and_the_poll_is_paused(self):
        js = self.read("replay.js")
        self.assertIn("H.offset = ", js)
        self.assertIn("H.sim.paused = true", js)
        self.assertIn("performance.now()", js)
        self.assertIn("H.emit('live')", js)
        self.assertNotIn("requestAnimationFrame", js)       # frames are time-based, never counted

    def test_dev_fixtures_are_counts_only_and_equal_the_live_numbers(self):
        full = json.load(open(os.path.join(DRAFTS, "dev", "replay.json")))
        ds = full["doneSeries"]
        self.assertEqual(sorted(ds), ["byDirection", "byMilestone", "seriesFrom", "stepMin", "total"])
        n = len(full["tokens"]["series"])
        for s in [ds["total"], *ds["byMilestone"].values(), *ds["byDirection"].values()]:
            self.assertEqual(len(s), n)
            self.assertTrue(all(isinstance(v, int) for v in s) and s == sorted(s))
        self.assertEqual(ds["total"][-1], full["tasks"]["done"])
        for m in full["milestones"]:
            if m["id"] in ds["byMilestone"]:
                self.assertEqual(ds["byMilestone"][m["id"]][-1], m["done"])
        for d in full["directions"]:
            self.assertTrue(d["note"].startswith("%d of " % ds["byDirection"][str(d["n"])][-1]))
        self.assertNotIn("doneSeries", json.load(open(os.path.join(DRAFTS, "dev", "replay-nodone.json"))))


class BundleTests(unittest.TestCase):
    def test_bundle_ships_replay_and_passes_its_own_checks(self):
        out = os.path.join(tempfile.mkdtemp(prefix="replay-bundle-"), "out")
        try:
            r = subprocess.run(["bash", os.path.join(ROOT, "dashboard", "pages-bundle.sh"), out], capture_output=True, text=True, timeout=120)
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertEqual(sorted(os.listdir(os.path.join(out, "replay"))), ["index.html", "replay.css", "replay.js"])
            self.assertEqual(sorted(os.listdir(out)), sorted(["direction-A", "replay", "shared", "fonts", "_headers", "robots.txt", "index.html", "sample-data.js"]))
            self.assertFalse(os.path.exists(os.path.join(out, "dev")))
            self.assertEqual(open(os.path.join(DRAFTS, "direction-A", "a.js")).read(), open(os.path.join(out, "direction-A", "a.js")).read())
        finally:
            shutil.rmtree(os.path.dirname(out), ignore_errors=True)

    def test_bundle_fails_when_replay_holds_a_copied_a_js(self):
        # run the real script in a mirror of the repo's inputs, with a.js copied into replay/ and an issue id in it
        mirror, outs = tempfile.mkdtemp(prefix="replay-mirror-"), tempfile.mkdtemp(prefix="replay-outs-")
        try:
            os.makedirs(os.path.join(mirror, "dashboard"))
            for f in ("pages-bundle.sh", "build_sims.py"):
                shutil.copy(os.path.join(ROOT, "dashboard", f), os.path.join(mirror, "dashboard", f))
            shutil.copytree(os.path.join(DRAFTS), os.path.join(mirror, "docs", "dashboard", "drafts"))
            shutil.copytree(os.path.join(ROOT, "data", "synthetic"), os.path.join(mirror, "data", "synthetic"))
            ok = subprocess.run(["bash", os.path.join(mirror, "dashboard", "pages-bundle.sh"), os.path.join(outs, "out1")], capture_output=True, text=True, timeout=120)
            self.assertEqual(ok.returncode, 0, ok.stderr)
            rp = os.path.join(mirror, "docs", "dashboard", "drafts", "replay")
            shutil.copy(os.path.join(DRAFTS, "direction-A", "a.js"), os.path.join(rp, "a.js"))
            bad = subprocess.run(["bash", os.path.join(mirror, "dashboard", "pages-bundle.sh"), os.path.join(outs, "out2")], capture_output=True, text=True, timeout=120)
            self.assertNotEqual(bad.returncode, 0)
            self.assertIn("replay/ holds more than", bad.stderr)
            os.unlink(os.path.join(rp, "a.js"))
            with open(os.path.join(rp, "replay.css"), "a") as f:
                f.write("/* MIN-1234 */\n")
            bad = subprocess.run(["bash", os.path.join(mirror, "dashboard", "pages-bundle.sh"), os.path.join(outs, "out3")], capture_output=True, text=True, timeout=120)
            self.assertNotEqual(bad.returncode, 0)
            self.assertIn("issue id in replay/", bad.stderr)
        finally:
            shutil.rmtree(mirror, ignore_errors=True)
            shutil.rmtree(outs, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
