"""Repo number tiles (MIN-4569) and "Who is working shows every agent" (MIN-4575): the pure models run in node, guards on the page source, the dev fixture.

The page itself is looked at in a browser (dev/repo-13-agents.json with the block and 13 agents, the stub bundle without either). Here: the cases a browser
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
SHARED = os.path.join(DRAFTS, "shared")
REPO_JS = os.path.join(SHARED, "repo-numbers.js")
CHAT_MODEL_JS = os.path.join(SHARED, "chat-model.js")
NODE = shutil.which("node")

FEED_REPO_KEYS = ["branchesOpen", "branchesMerged", "prsOpen", "prsMerged", "prsTotal", "commitsStaging", "commitsStaging24h", "commitsMain", "commitsMain24h",
                  "linesAdded", "linesRemoved", "filesChanged", "codeLines", "codeFiles"]

RUNNER = r"""
const vm = require('vm'), fs = require('fs'); const w = {};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), { window: w }); const R = w.RepoNumbers;
const w2 = {}; vm.runInNewContext(fs.readFileSync(process.argv[2], 'utf8'), { window: w2 }); const M = w2.ChatModel;
const FULL = { branchesOpen: 5, branchesMerged: 58, prsOpen: 3, prsMerged: 60, prsTotal: 63, commitsStaging: 96, commitsStaging24h: 7, commitsMain: 82, commitsMain24h: 0,
  linesAdded: 35779, linesRemoved: 682, filesChanged: 365, codeLines: 35097, codeFiles: 321 };
const out = { ids: R.IDS };
const v = (r, l, e) => R.view(r, l || 'ok', e);
const flat = x => x.tiles.map(t => [t.id, t.v, t.s, t.missing]);
out.full = v(FULL); out.fullFlat = flat(out.full);
out.absent = [undefined, null, 5, 'x', [], [1, 2]].map(x => v(x));
out.emptyObj = v({});
out.allBad = v({ branchesOpen: null, prsOpen: 'x', codeLines: -4, linesAdded: 1.5, filesChanged: NaN });
out.partial = v({ branchesOpen: 2, commitsStaging: 10 });
out.partialFlat = flat(out.partial);
out.zero = flat(v(Object.assign({}, FULL, { prsOpen: 0, branchesOpen: 0 }))).filter(t => ['prsOpen', 'branchesOpen'].includes(t[0]));
out.badValues = [null, undefined, '5', -1, 1.5, NaN, Infinity, 2 ** 60, true, {}, []].map(x => flat(v(Object.assign({}, FULL, { prsOpen: x }))).find(t => t[0] === 'prsOpen'));
out.pair24 = { without: flat(v(Object.assign({}, FULL, { commitsStaging24h: undefined }))).find(t => t[0] === 'commitsStaging'),
  badTotal24: flat(v(Object.assign({}, FULL, { commitsMain: undefined }))).find(t => t[0] === 'commitsMain') };
out.fmt = [0, 7, 999, 1000, 35779, 1234567].map(R.fmt);
out.load = ['loading', 'error', 'ok', 'weird', undefined].map(l => v(undefined, l).empty);
out.errMsg = [v(undefined, 'ok', 'prs: gh not authenticated'), v(undefined, 'ok', 'a   b\n c.'), v(undefined, 'ok', 'x'.repeat(400)), v(undefined, 'ok', 5), v(undefined, 'ok', '   ')].map(x => x.empty);
out.errNotUsedWhenData = v(FULL, 'ok', 'prs: gh failed').state;
out.hijack = flat(v(Object.assign({}, FULL, { branchesOpen: '<img src=x onerror=alert(1)>' }))).find(t => t[0] === 'branchesOpen');
out.extra = flat(v(Object.assign({}, FULL, { someBranchName: 'feat/secret', path: '/Users/x' }))).map(t => t[0]);

// who-is-working order
const ag = (n, state) => ({ n, state });
const FEED = [['Back', 'active'], ['Anna', 'idle'], ['Pix', 'active'], ['Ren', 'active'], ['Cron', 'idle'], ['CTO', 'idle'], ['Spast', 'idle'], ['Release', 'idle'],
  ['CEO', 'idle'], ['E2E', 'idle'], ['Scrum', 'idle'], ['SEO', 'idle'], ['JobScout', 'idle']].map(x => ag(x[0], x[1]));
const names = l => l.map(a => a.n);
out.feed13 = names(M.orderFeed(FEED));
out.feedAllIdle = names(M.orderFeed(FEED.map(a => ag(a.n, 'idle'))));
out.feedAllActive = names(M.orderFeed(FEED.map(a => ag(a.n, 'active'))));
out.feedEmpty = [M.orderFeed([]), M.orderFeed(undefined), M.orderFeed(null), M.orderFeed('x'), M.orderFeed({})].map(x => x.length);
out.feedGrows = names(M.orderFeed(FEED.concat([ag('Newcomer', 'idle'), ag('Eager', 'active')])));
out.feedBig = M.orderFeed(Array.from({ length: 40 }, (_, i) => ag('A' + i, i % 3 ? 'idle' : 'active'))).length;
out.feedNoMutate = (() => { const c = FEED.slice(); M.orderFeed(c); return names(c).join() === names(FEED).join(); })();
const now = Date.parse('2026-11-14T20:00:00Z');
const S = (id, state) => ({ id, state, title: 'T', lastAt: '2026-11-14T19:59:00Z', turnStartedAt: '2026-11-14T19:55:00Z' });
const sess = { Release: [S('r', 'needs_yes')], CEO: [S('c', 'acting')], Anna: [S('a', 'working')], Scrum: [S('s', 'waiting')] };
const rows = FEED.map(a => ({ a, r: M.rowOf(a, sess[a.n], {}, now) }));
out.liveRows = names(M.order(rows).map(x => x.a));
out.liveRanks = M.order(rows).map(x => x.r.rank);
out.liveAllIdle = names(M.order(FEED.map(a => ({ a: ag(a.n, 'idle'), r: M.rowOf(ag(a.n, 'idle'), [], {}, now) }))).map(x => x.a));
out.liveEmpty = [M.order([]).length, M.order(undefined).length, M.order(null).length];
out.rank = { idle: M.rowOf(ag('X', 'idle'), [], {}, now).rank, active: M.rowOf(ag('X', 'active'), [], {}, now).rank, waitingOnly: M.rowOf(ag('X', 'idle'), [S('w', 'waiting')], {}, now).rank };
console.log(JSON.stringify(out));
"""


@unittest.skipUnless(NODE, "node is not installed")
class Model(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        r = subprocess.run([NODE, "-e", RUNNER, REPO_JS, CHAT_MODEL_JS], capture_output=True, text=True, timeout=30)
        assert r.returncode == 0, r.stderr
        cls.o = json.loads(r.stdout)

    # ---- MIN-4569: the tiles ----
    def test_twelve_tiles_in_a_fixed_order_that_cover_every_feed_total(self):
        ids = self.o["ids"]
        self.assertEqual(len(ids), 12)
        self.assertEqual(ids, ["branchesOpen", "branchesMerged", "prsOpen", "prsMerged", "prsTotal", "commitsStaging", "commitsMain", "linesAdded", "linesRemoved",
                               "filesChanged", "codeLines", "codeFiles"])
        # every feed key is shown: either as a tile or as the 24 h line of its total
        self.assertEqual(sorted(set(ids) | {"commitsStaging24h", "commitsMain24h"}), sorted(FEED_REPO_KEYS))

    def test_full_block_shows_every_number_with_group_separators_and_signs(self):
        f = {t[0]: t for t in self.o["fullFlat"]}
        self.assertEqual(self.o["full"]["state"], "ok")
        self.assertEqual((self.o["full"]["reported"], self.o["full"]["total"]), (12, 12))
        self.assertEqual([f[k][1] for k in ("branchesOpen", "branchesMerged", "prsOpen", "prsMerged", "prsTotal")], ["5", "58", "3", "60", "63"])
        self.assertEqual((f["linesAdded"][1], f["linesRemoved"][1]), ("+35,779", "−682"))
        self.assertEqual((f["filesChanged"][1], f["codeLines"][1], f["codeFiles"][1]), ("365", "35,097", "321"))
        self.assertEqual(f["commitsStaging"][2], "+7 in the last 24 h")
        self.assertEqual(f["commitsMain"][2], "+0 in the last 24 h")           # a real zero in 24 h is a number, not a missing field
        self.assertFalse(any(t[3] for t in self.o["fullFlat"]))

    def test_absent_or_malformed_block_is_one_quiet_sentence_and_never_throws(self):
        for x in self.o["absent"] + [self.o["emptyObj"], self.o["allBad"]]:
            self.assertEqual(x["state"], "none")
            self.assertEqual(x["tiles"], [])
            self.assertEqual(x["empty"], "Repo numbers are not reported yet.")

    def test_a_missing_field_is_n_a_never_zero_and_never_hides_the_others(self):
        f = {t[0]: t for t in self.o["partialFlat"]}
        self.assertEqual(self.o["partial"]["state"], "ok")
        self.assertEqual((self.o["partial"]["reported"], self.o["partial"]["total"]), (2, 12))
        self.assertEqual((f["branchesOpen"][1], f["commitsStaging"][1]), ("2", "10"))
        self.assertEqual(len(self.o["partialFlat"]), 12)                         # the grid never reshuffles
        for k in ("prsOpen", "linesAdded", "codeLines", "commitsMain"):
            self.assertEqual(f[k][1:], ["n/a", "not reported yet", True])
        self.assertEqual(f["commitsStaging"][2], "")                              # total read, its 24 h figure not: no invented 24 h line

    def test_zero_is_a_real_number(self):
        self.assertEqual([t[1:] for t in self.o["zero"]], [["0", "pushed, not merged yet", False], ["0", "waiting for review or merge", False]])

    def test_only_non_negative_safe_integers_count(self):
        self.assertEqual(len(self.o["badValues"]), 11)
        for t in self.o["badValues"]:
            self.assertEqual(t[1:], ["n/a", "not reported yet", True], t)

    def test_24h_line_is_attached_only_to_a_readable_total(self):
        self.assertEqual(self.o["pair24"]["badTotal24"][1:], ["n/a", "not reported yet", True])

    def test_number_format(self):
        self.assertEqual(self.o["fmt"], ["0", "7", "999", "1,000", "35,779", "1,234,567"])

    def test_empty_sentence_follows_the_load_state_and_the_feed_reason(self):
        self.assertEqual(self.o["load"], ["Loading the feed…", "The feed could not be read yet.", "Repo numbers are not reported yet.",
                                          "Repo numbers are not reported yet.", "Repo numbers are not reported yet."])
        e = self.o["errMsg"]
        self.assertEqual(e[0], "Repo numbers could not be read: prs: gh not authenticated.")
        self.assertEqual(e[1], "Repo numbers could not be read: a b c.")           # whitespace collapsed, one full stop
        self.assertTrue(e[2].startswith("Repo numbers could not be read: xxx") and len(e[2]) < 220)
        self.assertEqual((e[3], e[4]), ("Repo numbers are not reported yet.", "Repo numbers are not reported yet."))
        self.assertEqual(self.o["errNotUsedWhenData"], "ok")                       # readable numbers are shown, the reason goes to the block's tag

    def test_feed_text_cannot_become_markup_or_a_number(self):
        self.assertEqual(self.o["hijack"][1:], ["n/a", "not reported yet", True])
        self.assertEqual(self.o["extra"], self.o["ids"])                           # names, paths and other keys never reach a tile

    # ---- MIN-4575: every agent is a row ----
    def test_all_thirteen_agents_are_rows_working_first_then_idle_in_feed_order(self):
        self.assertEqual(self.o["feed13"], ["Back", "Pix", "Ren", "Anna", "Cron", "CTO", "Spast", "Release", "CEO", "E2E", "Scrum", "SEO", "JobScout"])
        self.assertEqual(len(self.o["feed13"]), 13)

    def test_all_idle_and_all_active_keep_feed_order(self):
        feed = ["Back", "Anna", "Pix", "Ren", "Cron", "CTO", "Spast", "Release", "CEO", "E2E", "Scrum", "SEO", "JobScout"]
        self.assertEqual(self.o["feedAllIdle"], feed)
        self.assertEqual(self.o["feedAllActive"], feed)

    def test_there_is_no_cap_and_a_new_agent_shows_with_no_code_change(self):
        # two agents the page has never heard of: the active one joins the working group, the idle one joins the end; 15 rows
        self.assertEqual(self.o["feedGrows"], ["Back", "Pix", "Ren", "Eager", "Anna", "Cron", "CTO", "Spast", "Release", "CEO", "E2E", "Scrum", "SEO", "JobScout", "Newcomer"])
        self.assertEqual(self.o["feedBig"], 40)

    def test_empty_missing_or_malformed_agent_list_is_an_empty_list_not_an_error(self):
        self.assertEqual(self.o["feedEmpty"], [0, 0, 0, 0, 0])
        self.assertEqual(self.o["liveEmpty"], [0, 0, 0])

    def test_ordering_does_not_change_the_feed_list(self):
        self.assertTrue(self.o["feedNoMutate"])

    def test_live_card_orders_by_what_needs_him_then_working_then_idle_all_rows_kept(self):
        self.assertEqual(self.o["liveRows"], ["Release", "CEO", "Anna", "Back", "Pix", "Ren", "Cron", "CTO", "Spast", "E2E", "Scrum", "SEO", "JobScout"])
        self.assertEqual(self.o["liveRanks"], [0, 1, 2, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4])
        self.assertEqual(len(self.o["liveRows"]), 13)

    def test_live_card_all_idle_keeps_feed_order(self):
        self.assertEqual(self.o["liveAllIdle"], ["Back", "Anna", "Pix", "Ren", "Cron", "CTO", "Spast", "Release", "CEO", "E2E", "Scrum", "SEO", "JobScout"])

    def test_active_agents_rank_above_idle_ones(self):
        self.assertEqual(self.o["rank"], {"idle": 4, "active": 3, "waitingOnly": 4})


class PageSource(unittest.TestCase):
    def read(self, *p):
        with open(os.path.join(DRAFTS, *p), encoding="utf-8") as f:
            return f.read()

    def test_the_who_card_has_no_collapse_in_either_mode(self):
        chat = self.read("shared", "chat.js")
        for bad in ("slice(0, 5)", "slice(5)", "more, idle", "whoMore", "whoAll", "show all", "show 5", "class=\"muted more\""):
            self.assertNotIn(bad, chat, bad)
        self.assertIn("M.orderFeed(ag).map(H.agentRow)", chat)         # the card without the bridge: every agent
        self.assertIn("all.map(({ a, r })", chat)                       # the live card: every row, each a link into the agent's chat
        self.assertIn('href="#/chat/', chat)

    def test_no_stale_more_style_is_left_behind(self):
        self.assertNotRegex(self.read("direction-A", "a.css"), r"(^|\n)\.more\{")

    def test_the_page_loads_the_model_before_a_js_and_the_card_is_built_from_it(self):
        html = self.read("direction-A", "index.html")
        self.assertLess(html.index("repo-numbers.js"), html.index('src="a.js"'))
        a = self.read("direction-A", "a.js")
        self.assertIn("RepoNumbers.view(DATA.repo", a)
        self.assertEqual(len(re.findall(r"repoCard\(", a)), 3)          # defined once, used on the overview and at the top of the Branches drawer
        self.assertIn("DATA.repo, Live.loaded", a)                      # the card repaints when the block, the load state or the reason changes

    def test_live_layer_reads_the_block_and_keeps_absent_as_null(self):
        live = self.read("shared", "live.js")
        self.assertIn("DATA.repo = null;", live)
        self.assertIn("DATA.repo = (snap.repo && typeof snap.repo==='object' && !Array.isArray(snap.repo)) ? snap.repo : null;", live)
        self.assertIn("repo:'Repo'", live)

    def test_the_repo_card_has_no_loading_shimmer_dependency_on_bb(self):
        a = self.read("direction-A", "a.js")
        card = a[a.index("function repoCard"):a.index("function renderDyn")]
        self.assertNotIn('class="bb"', card)                            # CSS hides .bb while a block has no data; the empty sentence must stay visible
        self.assertNotIn("blkmsg", card)                                 # one sentence, not the same message twice


class Fixture(unittest.TestCase):
    def test_dev_fixture_has_thirteen_agents_and_the_block(self):
        with open(os.path.join(DRAFTS, "dev", "repo-13-agents.json")) as f:
            d = json.load(f)
        self.assertEqual([a["n"] for a in d["agents"]], ["Back", "Anna", "Pix", "Ren", "Cron", "CTO", "Spast", "Release", "CEO", "E2E", "Scrum", "SEO", "JobScout"])
        self.assertEqual(sorted(d["repo"]), sorted(FEED_REPO_KEYS))
        self.assertTrue(all(type(v) is int for v in d["repo"].values()))
        self.assertIn("repo", d["blocks"])

    def test_the_feed_example_and_the_page_agree_on_the_block(self):
        with open(os.path.join(ROOT, "dashboard", "fixtures", "snapshot.example.json")) as f:
            ex = json.load(f)
        self.assertEqual(sorted(ex["repo"]), sorted(FEED_REPO_KEYS))


if __name__ == "__main__":
    unittest.main()
