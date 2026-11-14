"""Risk-flag rules in docs/dashboard/drafts/shared/common.js: token-cap flags are opt-in.

Whole-day token totals measured against per-run caps are always red, so H.flags() raises cap flags only when the
feed says its numbers are per-run sizes (tokens.capScope === 'run') and noCapFlags is not set. Runs common.js in
node with a minimal browser stub; skipped when node is not installed. Also guards the alert's own source.
"""
import json
import pathlib
import shutil
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
SHARED = ROOT / "docs" / "dashboard" / "drafts" / "shared"

HARNESS = r"""
const fs = require('fs'), vm = require('vm');
const tokens = JSON.parse(process.argv[2]);
const store = {};
const el = () => ({ dataset:{}, classList:{add(){},remove(){},toggle(){},contains(){return false}}, style:{setProperty(){}}, addEventListener(){}, setAttribute(){}, querySelector(){return null}, querySelectorAll(){return []} });
const win = {
  HD_LIVE:true,
  DATA:{ deadline:'2026-11-15T18:00:00+02:00', buildStart:'2026-11-14T12:00:00+02:00', freeze:'2026-11-15T13:00:00+02:00', submitBy:'2026-11-15T17:00:00+02:00',
    milestones:[], tasks:{done:0,inProgress:0,inReview:0,open:0,blocked:0,total:0,byRole:{}},
    tokens:Object.assign({series:[1]}, tokens), money:{estimateEUR:0,estimateSeries:[],credits:[]}, agents:[], flags:[], demo:{cleanRuns:0,build:{},deploy:{},steps:[]} },
  CONTENT:{exercises:[],decks:{}},
};
const ctx = Object.assign(win, {
  window:win, document:Object.assign(el(), {documentElement:el(), body:el(), hidden:false, title:''}),
  location:{search:''}, localStorage:{getItem:k=>store[k]??null, setItem:(k,v)=>{store[k]=v}},
  matchMedia:()=>({matches:false, addEventListener(){}}), performance, requestAnimationFrame(){}, cancelAnimationFrame(){},
  URLSearchParams, Intl, Date, Math, console, setTimeout(){return 0}, clearTimeout(){}, navigator:{},
});
vm.createContext(ctx);
vm.runInContext('const DATA = window.DATA, CONTENT = window.CONTENT;', ctx);
vm.runInContext(fs.readFileSync(process.argv[1], 'utf8'), ctx);
console.log(JSON.stringify(ctx.window.H.flags().map(f => ({id:f.id, level:f.level, text:f.text, plain:f.plain}))));
"""

DAY_TOTALS = {
    "agentCaps": {"soft": 300000, "hard": 400000},
    "chatCaps": {"soft": 350000, "hard": 400000},
    "perChat": [{"n": "Back project readiness check", "v": 38700000}],
    "perAgent": [{"n": "Ren", "v": 33000000}],
}


def flags(tokens):
    out = subprocess.run(["node", "-e", HARNESS, str(SHARED / "common.js"), json.dumps(tokens)],
                         capture_output=True, text=True, timeout=30)
    if out.returncode:
        raise AssertionError(out.stderr)
    out = out.stdout
    return json.loads(out.strip().splitlines()[-1])


@unittest.skipUnless(shutil.which("node"), "node is not installed")
class CapFlagsAreOptIn(unittest.TestCase):
    def test_whole_day_totals_raise_no_cap_flag(self):
        self.assertEqual([f for f in flags(DAY_TOTALS) if f["id"].startswith(("chat-", "agent-"))], [])

    def test_per_run_feed_raises_hard_cap_flags_that_say_hard(self):
        got = {f["id"]: f for f in flags(dict(DAY_TOTALS, capScope="run"))}
        self.assertEqual(got["chat-Back project readiness check"]["level"], "bad")
        agent = got["agent-Ren"]
        self.assertEqual(agent["level"], "bad")
        self.assertIn("hard cap", agent["text"])
        self.assertNotIn("soft cap", agent["text"])
        self.assertIn("over its token limit", agent["plain"])
        self.assertIn("33M of 400k", agent["plain"])

    def test_per_run_feed_below_hard_cap_is_amber_and_says_soft(self):
        got = {f["id"]: f for f in flags(dict(DAY_TOTALS, capScope="run", perAgent=[{"n": "Ren", "v": 320000}]))}
        self.assertEqual(got["agent-Ren"]["level"], "warn")
        self.assertIn("soft cap", got["agent-Ren"]["text"])
        self.assertIn("near its token limit", got["agent-Ren"]["plain"])

    def test_no_cap_flags_switch_still_wins(self):
        self.assertEqual(flags(dict(DAY_TOTALS, capScope="run", noCapFlags=True)), [])


class AlertSource(unittest.TestCase):
    def setUp(self):
        self.js = (SHARED / "alert.js").read_text()

    def test_entry_point_is_wrapped_and_rows_are_escaped(self):
        self.assertIn("try{", self.js)
        self.assertIn("catch(e)", self.js.rsplit("})();", 1)[0][-200:])
        # every value that reaches innerHTML from a flag goes through esc()
        self.assertIn("esc(f.plain || f.text || '')", self.js)
        self.assertIn("esc(f.act)", self.js)
        self.assertIn("esc(f.id)", self.js)

    def test_only_live_good_data_opens_or_prunes(self):
        self.assertIn("Live.loaded && !Live.feedErr", self.js)
        self.assertIn("Live.state('derived').s==='ok'", self.js)

    def test_pages_load_it_after_common_js(self):
        for d in ("direction-A", "direction-B"):
            html = (ROOT / "docs" / "dashboard" / "drafts" / d / "index.html").read_text()
            self.assertLess(html.index("shared/common.js"), html.index("shared/alert.js"))
            self.assertIn("shared/alert.css", html)


if __name__ == "__main__":
    unittest.main()
