"""Agent leaderboard (MIN-4584) and the repo tiles inside the deadline card (MIN-4569 placement): the pure model runs in node, guards on the page source and the dev fixtures.

The page itself is looked at in a browser (dev/leaderboard-busy.json with both blocks, dev/leaderboard-stub.json like the public Pages stub). Here: the cases a browser
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
LB_JS = os.path.join(DRAFTS, "shared", "leaderboard.js")
NODE = shutil.which("node")

TEAM = ["Back", "Anna", "Pix", "Ren", "Cron", "CTO", "Spast", "Release", "CEO", "E2E", "Scrum", "SEO", "JobScout"]

RUNNER = r"""
const vm = require('vm'), fs = require('fs'); const w = {};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), { window: w }); const L = w.Leaderboard;
const TEAM = %s;
const row = (n, v, mins, runs) => ({ n, v, mins, runs });
const names = v => v.rows.map(r => r.n);
const out = {};
// the feed as Cron sends it: all 13 configured agents, zeros included, sorted by tokens, plus two built-ins
const FEED = [row('Pix', 9236564, 171.0, 28), row('Ren', 6033214, 143.5, 22), row('Back', 5037126, 60.2, 25), row('Cron', 4522027, 112.8, 14), row('Anna', 3913157, 48.6, 12),
  row('CTO', 2849095, 37.9, 19), row('general-purpose', 2100000, 18.4, 6), row('Release', 1469576, 41.3, 20), row('CEO', 969807, 11.4, 4), row('Spast', 801228, 3.2, 1),
  row('Explore', 420000, 4.1, 3), row('E2E', 0, 0.0, 0), row('Scrum', 0, 0.0, 0), row('SEO', 0, 0.0, 0), row('JobScout', 0, 0.0, 0)];
out.full = L.view(FEED, TEAM, 'ok');
out.fullRows = out.full.rows.map(r => [r.rank, r.n, r.tokens, r.time, r.runs, r.builtin, r.idle]);
// order: tokens, then time worked, then the feed order
out.tie = names(L.view([row('A', 100, 5, 1), row('B', 100, 90, 1), row('C', 100, 5, 1), row('D', 200, 1, 1)], [], 'ok'));
out.shuffled = names(L.view(FEED.slice().reverse(), TEAM, 'ok'));
out.noMutate = (() => { const c = JSON.stringify(FEED); L.view(FEED, TEAM, 'ok'); return JSON.stringify(FEED) === c; })();
// old feed: no mins and no runs
out.old = L.view([{ n: 'Pix', v: 900 }, { n: 'Ren', v: 1200 }, { n: 'Cron', v: 0 }], TEAM, 'ok').rows.map(r => [r.rank, r.n, r.tokens, r.time, r.runs, r.timeMissing, r.idle]);
// bad values are n/a, never zero and never a throw
out.bad = [null, undefined, '5', -1, NaN, Infinity, true, {}, []].map(x => { const r = L.view([row('X', 1, x, 3)], [], 'ok').rows[0]; return [r.time, r.timeMissing]; });
out.badTok = [null, undefined, '5', -1, NaN].map(x => { const r = L.view([row('X', x, 4, 3)], [], 'ok').rows[0]; return [r.tokens, r.tokMissing, r.time]; });
out.badRuns = [1.5, -1, '3', NaN, null].map(x => L.view([row('X', 1, 4, x)], [], 'ok').rows[0].runs);
out.runsText = [0, 1, 2, 43].map(x => L.view([row('X', 1, 4, x)], [], 'ok').rows[0].runs);
// empty, absent and malformed lists: one quiet sentence
out.empties = [[], undefined, null, 'x', 5, {}].map(x => L.view(x, TEAM, 'ok'));
out.junkRows = L.view([null, 5, 'x', {}, { n: '' }, { n: '  ' }, { n: 7, v: 1 }, []], TEAM, 'ok');
out.empty = ['ok', 'loading', 'error', undefined, 'weird'].map(l => L.view([], TEAM, l).empty);
out.dupes = L.view([row('Pix', 5, 1, 1), row('Pix', 9, 9, 9)], [], 'ok').rows.map(r => [r.n, r.tokens]);
// built-in agents: shown and marked, but only when the team is known
out.builtinMarked = L.view(FEED, TEAM, 'ok').rows.filter(r => r.builtin).map(r => r.n);
out.builtinUnknownTeam = [L.view(FEED, [], 'ok'), L.view(FEED, undefined, 'ok'), L.view(FEED, null, 'ok')].map(v => v.rows.filter(r => r.builtin).length);
// formats
out.clock = [0, 0.2, 0.5, 0.9, 1, 48.6, 59.4, 59.6, 60, 61, 171, 600.4, 5999.9, -1, NaN, null, '5'].map(L.clock);
out.fmt = [0, 7, 999, 1000, 9236564, 101214493].map(L.fmt);
out.hijack = L.view([row('<img src=x onerror=alert(1)>', 1, 1, 1)], [], 'ok').rows[0].n;
out.many = L.view(Array.from({ length: 40 }, (_, i) => row('A' + i, i, i, 1)), [], 'ok').rows.length;
console.log(JSON.stringify(out));
""" % json.dumps(TEAM)


@unittest.skipUnless(NODE, "node is not installed")
class Model(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        r = subprocess.run([NODE, "-e", RUNNER, LB_JS], capture_output=True, text=True, timeout=30)
        assert r.returncode == 0, r.stderr
        cls.o = json.loads(r.stdout)

    def test_every_agent_of_the_feed_is_a_row_zeros_included_no_cap(self):
        self.assertEqual(self.o["full"]["state"], "ok")
        self.assertEqual(len(self.o["fullRows"]), 15)                       # 13 configured + 2 built-ins
        self.assertEqual(self.o["many"], 40)
        self.assertEqual([r[1] for r in self.o["fullRows"]][-4:], ["E2E", "Scrum", "SEO", "JobScout"])

    def test_rows_show_rank_name_tokens_and_hours_and_minutes(self):
        r = {x[1]: x for x in self.o["fullRows"]}
        self.assertEqual(r["Pix"][:5], [1, "Pix", "9,236,564", "2h 51m", "28 runs"])
        self.assertEqual(r["Ren"][:4], [2, "Ren", "6,033,214", "2h 24m"])
        self.assertEqual(r["Back"][:4], [3, "Back", "5,037,126", "1h 00m"])
        self.assertEqual(r["Spast"][3:5], ["3m", "1 run"])                   # singular
        self.assertEqual(r["JobScout"][:5], [15, "JobScout", "0", "0m", "0 runs"])   # a real zero from the feed is a zero

    def test_ranked_by_tokens_descending(self):
        self.assertEqual([r[1] for r in self.o["fullRows"]],
                         ["Pix", "Ren", "Back", "Cron", "Anna", "CTO", "general-purpose", "Release", "CEO", "Spast", "Explore", "E2E", "Scrum", "SEO", "JobScout"])
        self.assertEqual([r[0] for r in self.o["fullRows"]], list(range(1, 16)))

    def test_ties_go_by_time_worked_then_feed_order(self):
        self.assertEqual(self.o["tie"], ["D", "B", "A", "C"])

    def test_feed_order_does_not_matter_except_for_full_ties(self):
        self.assertEqual(self.o["shuffled"][:11], [r[1] for r in self.o["fullRows"]][:11])
        self.assertEqual(sorted(self.o["shuffled"][11:]), ["E2E", "JobScout", "SEO", "Scrum"])   # the four zero agents tie on both keys
        self.assertTrue(self.o["noMutate"])

    def test_old_feed_without_mins_and_runs_shows_n_a_not_zero_and_not_an_error(self):
        self.assertEqual(self.o["old"], [[1, "Ren", "1,200", "n/a", "", True, False], [2, "Pix", "900", "n/a", "", True, False], [3, "Cron", "0", "n/a", "", True, True]])

    def test_only_non_negative_finite_numbers_count(self):
        for t, missing in self.o["bad"]:
            self.assertEqual((t, missing), ("n/a", True))
        for tok, missing, t in self.o["badTok"]:
            self.assertEqual((tok, missing, t), ("n/a", True, "4m"))
        self.assertEqual(self.o["badRuns"], ["", "", "", "", ""])
        self.assertEqual(self.o["runsText"], ["0 runs", "1 run", "2 runs", "43 runs"])

    def test_empty_absent_or_malformed_list_is_one_quiet_sentence_and_never_throws(self):
        for v in self.o["empties"] + [self.o["junkRows"]]:
            self.assertEqual((v["state"], v["rows"], v["empty"]), ("none", [], "Agent numbers are not reported yet."))
        self.assertEqual(self.o["empty"], ["Agent numbers are not reported yet.", "Loading the feed…", "The feed could not be read yet.",
                                           "Agent numbers are not reported yet.", "Agent numbers are not reported yet."])

    def test_a_name_is_taken_once(self):
        self.assertEqual(self.o["dupes"], [["Pix", "5"]])

    def test_built_in_agents_are_rows_and_marked_only_when_the_team_is_known(self):
        self.assertEqual(self.o["builtinMarked"], ["general-purpose", "Explore"])
        self.assertEqual(self.o["builtinUnknownTeam"], [0, 0, 0])

    def test_time_is_hours_and_minutes_and_minutes_never_look_like_tokens(self):
        self.assertEqual(self.o["clock"], ["0m", "<1m", "1m", "1m", "1m", "49m", "59m", "1h 00m", "1h 00m", "1h 01m", "2h 51m", "10h 00m", "100h 00m", "n/a", "n/a", "n/a", "n/a"])
        self.assertEqual(self.o["fmt"], ["0", "7", "999", "1,000", "9,236,564", "101,214,493"])   # tokens are never abbreviated: "m" only ever means minutes here

    def test_the_name_is_kept_as_text_for_the_page_to_escape(self):
        self.assertEqual(self.o["hijack"], "<img src=x onerror=alert(1)>")


class PageSource(unittest.TestCase):
    def read(self, *p):
        with open(os.path.join(DRAFTS, *p), encoding="utf-8") as f:
            return f.read()

    def test_the_page_loads_the_model_before_a_js(self):
        html = self.read("direction-A", "index.html")
        self.assertLess(html.index("leaderboard.js"), html.index('src="a.js"'))

    def test_the_tokens_card_shows_the_leaderboard_in_place_of_the_capped_agents_list(self):
        a = self.read("direction-A", "a.js")
        self.assertIn("Leaderboard.view(DATA.tokens.perAgent", a)
        self.assertIn("leaderboard()", a)
        for gone in ("agMore", "agAll", "show 10", "liveMeters(tk.perAgent"):
            self.assertNotIn(gone, a, gone)                                   # no "show 10" collapse, no second list of the same agents
        self.assertIn("esc(r.n)", a)                                          # the agent name only ever goes through esc()
        self.assertIn("DATA.agents, DATA.demo", a)                            # the card repaints when the team list changes (built-in marking)

    def test_the_tiles_are_in_the_deadline_card_and_the_separate_row_is_gone(self):
        a = self.read("direction-A", "a.js")
        hero = a[a.index('id="hero"'):a.index("</section>", a.index('id="hero"'))]
        self.assertIn('id="heroRepo"', hero)
        self.assertLess(hero.index('id="bar"'), hero.index('id="heroRepo"'))   # under the countdown and its progress bar
        self.assertNotIn("repoCard(true)", a)
        dyn = a[a.index("dyn.innerHTML = bandHTML()"):a.index("'<section class=\"panels\">'")]
        self.assertNotIn("repoCard", dyn)                                     # nothing between the milestones and the panels
        self.assertIn("slot.innerHTML = repoCard('hero')", a)
        self.assertIn("repoCard('drawer')", a)                                # the Branches drawer copy stays

    def test_the_hero_variant_is_not_a_card_inside_the_card(self):
        a = self.read("direction-A", "a.js")
        fn = a[a.index("function repoCard"):a.index("function leaderboard")]
        hero = fn[fn.index("? '<section class=\"hero-repo"):fn.index(": '<section class=\"card repo-card")]
        self.assertNotIn('class="card', hero)
        css = self.read("direction-A", "a.css")
        self.assertIn("grid-template-rows:auto auto auto 1fr auto", css)      # hero, directions, milestones, panels, demo strip: no row for the tiles
        self.assertNotIn(".rtiles.wide", css)

    def test_the_hero_card_never_gets_a_fixed_height(self):
        css = self.read("direction-A", "a.css")
        for rule in re.findall(r"\.hero-main[^{]*\{[^}]*\}", css) + re.findall(r"\.hero-repo[^{]*\{[^}]*\}", css):
            self.assertNotRegex(rule, r"(^|[;{])\s*(min-)?height\s*:", rule)  # the row height stays the right card's: tiles fill empty space, they do not stretch the row

    def test_the_bundle_script_copies_the_shared_folder_so_the_model_is_in_the_public_page(self):
        with open(os.path.join(ROOT, "dashboard", "pages-bundle.sh")) as f:
            self.assertIn('cp -R "$SRC/direction-A" "$SRC/shared"', f.read())


class Fixtures(unittest.TestCase):
    def load(self, name):
        with open(os.path.join(DRAFTS, "dev", name)) as f:
            return json.load(f)

    def test_busy_fixture_has_every_agent_with_minutes_and_runs_and_the_repo_block(self):
        d = self.load("leaderboard-busy.json")
        rows = d["tokens"]["perAgent"]
        self.assertTrue(set(TEAM) <= {r["n"] for r in rows})
        self.assertEqual(len(rows), 15)
        self.assertTrue(all(isinstance(r["mins"], float) and isinstance(r["runs"], int) for r in rows))
        self.assertEqual(len(d["repo"]), 14)
        self.assertEqual(len(d["forecast"]["blocked"]), 8)                    # the founder's overview: a tall right card, so the deadline card has an empty area

    def test_stub_fixture_is_the_public_pages_shape(self):
        d = self.load("leaderboard-stub.json")
        self.assertEqual(d["tokens"]["perAgent"], [])
        self.assertNotIn("repo", d)

    def test_the_feed_example_carries_mins_and_runs_on_all_thirteen(self):
        with open(os.path.join(ROOT, "dashboard", "fixtures", "snapshot.example.json")) as f:
            rows = json.load(f)["tokens"]["perAgent"]
        self.assertTrue(set(TEAM) <= {r["n"] for r in rows})
        self.assertTrue(all("mins" in r and "runs" in r for r in rows))


if __name__ == "__main__":
    unittest.main()
