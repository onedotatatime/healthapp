"""The five project directions on the dashboard (via coordinator, founder 2026-11-14): the pure model run in node, guards on the page source, the dev fixtures.

The panel itself is looked at in a browser (dev/directions.json with the field, dev/fresh.json without it, the public stub bundle). Here: the cases a browser
cannot be asked cheaply twice. `node` is needed for the model tests; without it they are skipped, the source and fixture tests still run."""
import json
import os
import re
import shutil
import subprocess
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
DRAFTS = os.path.join(ROOT, "docs", "dashboard", "drafts")
MODEL = os.path.join(DRAFTS, "shared", "directions.js")
NODE = shutil.which("node")

RUNNER = r"""
const vm = require('vm'), fs = require('fs'); const w = {};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), { window: w }); const D = w.Directions;
const now = Date.parse('2026-11-14T20:00:00Z');
const e = (n, status, o) => Object.assign({ n, status, title: 'T' + n, note: 'note ' + n, updatedAt: '2026-11-14T19:48:00Z' }, o || {});
const v = (list, load) => D.view(list, now, load || 'ok');
const out = { hasTitles: 'TITLES' in D };
out.none = [v(undefined), v(null), v({}), v('x'), v([]), v([null, 3, 'a', [], {}])].map(x => ({ n: x.rows.map(r => r.n), rep: x.reported, notes: x.rows.map(r => r.note), titles: x.rows.map(r => r.title), titled: x.rows.map(r => r.titled), reported: x.rows.map(r => r.reported), count: x.count }));
out.full = v([e(5, 'not_started'), e(3, 'off_track'), e(1, 'on_track'), e(4, 'at_risk'), e(2, 'on_track')]);
out.names = ['on_track', 'On track', 'ON-TRACK', ' at risk ', 'at_risk', 'off-track', 'Off Track', 'not started', 'Not_Started'].map(s => { const r = v([e(1, s)]).rows[0]; return [s, r.cls, r.word]; });
out.badStatus = ['green', 'done', '', null, undefined, 3, {}].map(s => v([e(1, s)]).rows[0].reported);
out.partial = v([e(2, 'on_track'), e(4, 'weird')]);
out.dup = v([e(1, 'on_track', { note: 'first' }), e(1, 'off_track', { note: 'second' })]).rows[0];
out.ranges = v([e(0, 'on_track'), e(6, 'on_track'), e(1.5, 'on_track'), e('2', 'at_risk'), e('x', 'on_track'), e(NaN, 'on_track')]).rows.map(r => r.reported);
out.titleFromFeed = v([e(1, 'on_track', { title: '<b>hijack</b>' })]).rows[0].title;
out.titleCases = [undefined, null, 5, '   ', 'ok'].map(t => { const r = v([e(1, 'on_track', { title: t })]).rows[0]; return [r.title === 'ok' ? 'ok' : r.title, r.titled]; });
out.titleLong = v([e(1, 'on_track', { title: 'x'.repeat(300) })]).rows[0].title.length;
out.titleLongEnd = v([e(1, 'on_track', { title: 'x'.repeat(300) })]).rows[0].title.slice(-1);
out.long = v([e(1, 'on_track', { note: 'x'.repeat(500) })]).rows[0].note.length;
out.longEnd = v([e(1, 'on_track', { note: 'x'.repeat(500) })]).rows[0].note.slice(-1);
out.ws = v([e(1, 'on_track', { note: '  one\n two\t three  ' })]).rows[0].note;
out.badNote = [v([e(1, 'on_track', { note: 5 })]).rows[0].note, v([e(1, 'on_track', { note: null })]).rows[0].note, v([e(1, 'on_track', { note: undefined })]).rows[0].note];
out.upd = {
  now: D.updated(now, '2026-11-14T20:00:00Z'), s30: D.updated(now, '2026-11-14T19:59:31Z'), m1: D.updated(now, '2026-11-14T19:59:00Z'), m12: D.updated(now, '2026-11-14T19:48:00Z'),
  m59: D.updated(now, '2026-11-14T19:01:00Z'), h1: D.updated(now, '2026-11-14T19:00:00Z'), h5: D.updated(now, '2026-11-14T15:00:00Z'), d1: D.updated(now, '2026-11-13T20:00:00Z'), d3: D.updated(now, '2026-11-11T09:00:00Z'),
  future: D.updated(now, '2026-11-14T21:00:00Z'), bad: D.updated(now, 'soon'), nul: D.updated(now, null), num: D.updated(now, 5), nan: D.updated(NaN, '2026-11-14T19:48:00Z'), offset: D.updated(now, '2026-11-14T21:48:00+02:00'),
};
out.load = ['loading', 'error', 'ok'].map(l => { const x = D.view([e(1, 'on_track')], now, l); return [l, x.rows[1].note, x.count]; });
out.loadNone = ['loading', 'error'].map(l => D.view([], now, l).rows[0].note);
console.log(JSON.stringify(out));
"""


@unittest.skipUnless(NODE, "node is not installed")
class Model(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        r = subprocess.run([NODE, "-e", RUNNER, MODEL], capture_output=True, text=True, timeout=30)
        assert r.returncode == 0, r.stderr
        cls.o = json.loads(r.stdout)

    def test_the_page_owns_no_title(self):
        self.assertFalse(self.o["hasTitles"])                       # F2: the titles come only from the key-gated feed
        self.assertEqual([r["title"] for r in self.o["full"]["rows"]], ["T1", "T2", "T3", "T4", "T5"])

    def test_no_field_an_empty_array_or_junk_gives_five_not_reported_rows_and_never_throws(self):
        for x in self.o["none"]:
            self.assertEqual(x["n"], [1, 2, 3, 4, 5])
            self.assertEqual((x["rep"], x["reported"], x["count"]), (0, [False] * 5, "0 of 5 reported"))
            self.assertEqual(x["notes"], ["not reported yet"] * 5)
            self.assertEqual(x["titles"], ["Direction %d" % n for n in range(1, 6)])             # neutral rows: no title text
            self.assertEqual(x["titled"], [False] * 5)

    def test_rows_come_out_in_order_whatever_order_the_feed_sends(self):
        rows = self.o["full"]["rows"]
        self.assertEqual([r["n"] for r in rows], [1, 2, 3, 4, 5])
        self.assertEqual([r["word"] for r in rows], ["On track", "On track", "Off track", "At risk", "Not started"])
        self.assertEqual([r["cls"] for r in rows], ["ok", "ok", "bad", "warn", "none"])
        self.assertEqual([r["g"] for r in rows], ["●", "●", "■", "▲", "○"])       # a glyph with every colour: never colour alone
        self.assertEqual((self.o["full"]["reported"], self.o["full"]["count"]), (5, "5 of 5 reported"))
        self.assertEqual(rows[2]["note"], "note 3")
        self.assertEqual(rows[2]["updated"], "updated 12 min ago")

    def test_status_names_are_read_leniently_and_unknown_ones_are_not_guessed(self):
        self.assertEqual(self.o["names"], [["on_track", "ok", "On track"], ["On track", "ok", "On track"], ["ON-TRACK", "ok", "On track"], [" at risk ", "warn", "At risk"],
                                           ["at_risk", "warn", "At risk"], ["off-track", "bad", "Off track"], ["Off Track", "bad", "Off track"], ["not started", "none", "Not started"],
                                           ["Not_Started", "none", "Not started"]])
        self.assertEqual(self.o["badStatus"], [False] * 7)          # "green", "done", empty, null, a number, an object: not reported, never a made-up pill

    def test_a_partly_reported_feed_shows_the_rest_as_not_reported(self):
        r = self.o["partial"]["rows"]
        self.assertEqual([x["reported"] for x in r], [False, True, False, False, False])         # direction 4 had an unknown status
        self.assertEqual(self.o["partial"]["count"], "1 of 5 reported")
        self.assertEqual(r[0]["note"], "not reported yet")

    def test_the_first_entry_of_a_number_wins_and_numbers_outside_one_to_five_are_ignored(self):
        self.assertEqual((self.o["dup"]["note"], self.o["dup"]["word"]), ("first", "On track"))
        self.assertEqual(self.o["ranges"], [False, True, False, False, False])                  # only the string "2" (the one in range and whole) counts

    def test_the_title_is_the_feeds_as_text_capped_and_neutral_when_missing(self):
        self.assertEqual(self.o["titleFromFeed"], "<b>hijack</b>")  # kept as text; the page escapes it (PageSource test)
        self.assertEqual(self.o["titleCases"], [["Direction 1", False], ["Direction 1", False], ["Direction 1", False], ["Direction 1", False], ["ok", True]])
        self.assertEqual((self.o["titleLong"], self.o["titleLongEnd"]), (80, "…"))
        self.assertEqual(self.o["partial"]["rows"][0]["title"], "Direction 1")      # not reported: neutral, no title

    def test_a_note_is_one_line_of_text_and_capped(self):
        self.assertEqual(self.o["long"], 200)
        self.assertEqual(self.o["longEnd"], "…")
        self.assertEqual(self.o["ws"], "one two three")
        self.assertEqual(self.o["badNote"], ["", "", ""])

    def test_relative_time(self):
        u = self.o["upd"]
        self.assertEqual((u["now"], u["s30"], u["m1"], u["m12"], u["m59"]), ("updated just now", "updated just now", "updated 1 min ago", "updated 12 min ago", "updated 59 min ago"))
        self.assertEqual((u["h1"], u["h5"], u["d1"], u["d3"]), ("updated 1 h ago", "updated 5 h ago", "updated 1 d ago", "updated 3 d ago"))
        self.assertEqual(u["future"], "updated just now")           # a clock a little ahead is never "in -60 min"
        self.assertEqual(u["offset"], "updated 12 min ago")         # a +02:00 time is read as that instant
        self.assertEqual((u["bad"], u["nul"], u["num"], u["nan"]), ("", "", "", ""))

    def test_loading_and_error_do_not_claim_not_reported(self):
        self.assertEqual(self.o["load"], [["loading", "Loading the feed…", ""], ["error", "The feed could not be read yet.", ""], ["ok", "not reported yet", "1 of 5 reported"]])
        self.assertEqual(self.o["loadNone"], ["Loading the feed…", "The feed could not be read yet."])


class PageSource(unittest.TestCase):
    a_js = open(os.path.join(DRAFTS, "direction-A", "a.js")).read()
    live = open(os.path.join(DRAFTS, "shared", "live.js")).read()
    html = open(os.path.join(DRAFTS, "direction-A", "index.html")).read()

    def paint(self):
        return re.search(r"function paintDirections\(\)\{.*?\n\}\n", self.a_js, re.S).group(0)

    def test_every_feed_text_goes_through_esc(self):
        """A note, a word, a title and the relative time are built into markup: each is escaped, none is used raw."""
        body = self.paint()
        for field in ("r.note", "r.title", "r.word", "r.updated"):
            self.assertIn("esc(" + field + ")", body, field)
        bare = re.sub(r"esc\(r\.(note|title|word|updated)\)", "", body)                  # what is left may test a field (`r.note ?`), never concatenate it
        self.assertNotRegex(bare, r"\+\s*r\.(note|title|word|updated)\b|\br\.(note|title|word|updated)\s*\+")
        self.assertNotRegex(body, r"\+\s*d\.(note|status|title)\b")
        self.assertNotIn("fetch(", body)                            # the panel reads DATA only; the one transport is feed.js

    def test_the_live_layer_reads_the_field_defensively_and_blanks_it(self):
        self.assertIn("DATA.directions = Array.isArray(snap.directions) ? snap.directions : [];", self.live)
        self.assertIn("DATA.directions = [];", self.live)           # blanked at load: no sample value can show as live

    def test_the_page_loads_the_model_before_a_js_and_the_panel_is_marked_project_goal(self):
        self.assertLess(self.html.index("shared/directions.js"), self.html.index('src="a.js"'))
        self.assertIn("Project goal", self.a_js)
        self.assertIn('class="card dirs"', self.a_js)

    def test_the_panel_repaints_on_a_snapshot_on_the_clock_and_at_boot(self):
        self.assertEqual(len(re.findall(r"paintDirections\(\)", self.a_js)), 4)                   # the definition, the live handler, the clock tick, boot

    def test_no_em_dash_in_the_panel_text(self):
        self.assertNotIn("—", open(MODEL).read())
        self.assertNotIn("—", self.paint())


FIVE_TITLES = ("Scan → AI reads", "Store extracted data", "Store + analyse original files", "Real analysis + projection", "Real matching")


class NoTitlesInThePublicPage(unittest.TestCase):
    """CTO must-fix F2: the five titles are not public. The page source and the Pages bundle hold none of them; they come only from the key-gated feed."""

    def hits(self, root):
        found = []
        for base, dirs, files in os.walk(root):
            if os.path.basename(base) == "dev" and root == DRAFTS:       # the dev feeds are not part of the page (and the bundle script refuses them)
                dirs[:] = []
                continue
            for f in files:
                if f.endswith((".woff2", ".txt")):
                    continue
                text = open(os.path.join(base, f), encoding="utf-8", errors="replace").read()
                found += [(os.path.join(base, f), t) for t in FIVE_TITLES if t in text]
        return found

    def test_the_page_source_holds_none_of_the_five_titles(self):
        self.assertEqual(self.hits(DRAFTS), [])

    @unittest.skipUnless(shutil.which("bash"), "bash is needed")
    def test_the_pages_bundle_holds_none_of_the_five_titles(self):
        import tempfile
        with tempfile.TemporaryDirectory() as out:
            dest = os.path.join(out, "bundle")
            r = subprocess.run(["bash", os.path.join(ROOT, "dashboard", "pages-bundle.sh"), dest], capture_output=True, text=True, timeout=120)
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertEqual(self.hits(dest), [])


class Fixtures(unittest.TestCase):
    def load(self, name):
        return json.load(open(os.path.join(DRAFTS, "dev", name)))

    def test_one_dev_feed_has_the_field_and_one_does_not(self):
        with_field, without = self.load("directions.json"), self.load("fresh.json")
        self.assertNotIn("directions", without)
        self.assertEqual({k: v for k, v in with_field.items() if k != "directions"}, without)    # the only difference is the field
        ds = with_field["directions"]
        self.assertEqual({d["status"] for d in ds}, {"on_track", "at_risk", "off_track", "not_started"})     # all four pills
        self.assertEqual([d["n"] for d in ds], [1, 2, 3, 4])                                      # direction 5 is left out: its row reads "not reported yet"
        for d in ds:
            self.assertEqual(set(d), {"n", "title", "status", "note", "updatedAt"})

    def test_no_dev_feed_leaves_the_repo_in_the_public_bundle(self):
        script = open(os.path.join(ROOT, "dashboard", "pages-bundle.sh")).read()
        self.assertIn("-path '*/dev/*'", script)                    # the bundle script refuses any dev fixture (checked for real by pages-bundle.sh itself)


if __name__ == "__main__":
    unittest.main()
