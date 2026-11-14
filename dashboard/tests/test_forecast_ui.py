"""Forecast verdict, forecast line, late-window colour and the alert's reasons (MIN-4566).
Runs common.js in node with the same browser stub as test_flag_rules.py; skipped when node is not installed.
Expected values are written by hand from the shape Cron posted on MIN-4566, never taken from the function."""
import json
import pathlib
import shutil
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
SHARED = ROOT / "docs" / "dashboard" / "drafts" / "shared"
HARNESS = r"""
const fs = require('fs'), vm = require('vm');
const over = JSON.parse(process.argv[2]); const tokens = over.tokens || {series:[1], perAgent:[], perChat:[], agentCaps:{soft:1,hard:2}, chatCaps:{soft:1,hard:2}};
const store = {};
const el = () => ({ dataset:{}, classList:{add(){},remove(){},toggle(){},contains(){return false}}, style:{setProperty(){}}, addEventListener(){}, setAttribute(){}, querySelector(){return null}, querySelectorAll(){return []} });
const win = {
  HD_LIVE:true,
  DATA:{ deadline:'2026-11-15T18:00:00+02:00', buildStart:'2026-11-14T12:00:00+02:00', freeze:'2026-11-15T13:00:00+02:00', submitBy:'2026-11-15T17:00:00+02:00',
    milestones:over.milestones||[], forecast:over.forecast||null, tasks:{done:0,inProgress:0,inReview:0,open:0,blocked:0,total:0,byRole:{}},
    tokens:Object.assign({series:[1]}, tokens), money:{estimateEUR:0,estimateSeries:[],credits:over.credits||[]}, agents:[], flags:[], demo:{cleanRuns:0,build:{},deploy:{},steps:[]} },
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
console.log(JSON.stringify({ verdict:ctx.window.H.verdict(), line:ctx.window.H.fcLine(), flags:ctx.window.H.flags().map(f=>({id:f.id,level:f.level})),
  alert:ctx.window.H.alertReasons().map(f=>({id:f.id,plain:f.plain,act:f.act})), cut:ctx.window.H.fcCut().length }));
"""

FC = {"tz": "Europe/Athens", "freeze": "2026-11-15T13:00:00+02:00", "submit": "2026-11-15T17:00:00+02:00",
      "verdict": "on", "early_pace": False, "finish_label": "Sun 00:23", "finish_at": "2026-11-15T00:23:47+02:00",
      "ready_label": "Sun 13:27", "ready_at": "2026-11-15T13:27:35+02:00", "build_start": "2026-11-14T12:00:00+02:00", "pace_min_per_hour": 228.3,
      "done": {"issues": 28, "minutes": 2330, "no_estimate": ["MIN-4527"]}, "remaining": {"issues": 14, "minutes": 605, "in_review": 0, "no_estimate": []}, "blocked": [], "cut": [], "cut_reaches_freeze": True}
LATE = [{"id": "M1", "name": "x", "gate": "g", "start": "Sat 12:00", "end": "Sat 14:00", "done": 0, "total": 3}]
CRED = [{"n": "Acme", "granted": 100, "used": 90}]


def run(**over):
    out = subprocess.run(["node", "-e", HARNESS, str(SHARED / "common.js"), json.dumps(over)], capture_output=True, text=True, timeout=30)
    if out.returncode:
        raise AssertionError(out.stderr)
    return json.loads(out.stdout.strip().splitlines()[-1])


@unittest.skipUnless(shutil.which("node"), "node is not installed")
class ForecastUi(unittest.TestCase):
    def test_verdict_comes_from_the_forecast(self):
        for v in ("on", "risk", "off"):
            self.assertEqual(run(forecast=dict(FC, verdict=v))["verdict"], v)

    def test_no_forecast_falls_back_to_the_flag_rule(self):
        self.assertEqual(run()["verdict"], "on")
        self.assertEqual(run(credits=CRED)["verdict"], "off")      # 90% used: red, as before

    def test_late_window_is_amber_and_does_not_move_a_forecast_verdict(self):
        r = run(milestones=LATE, forecast=FC)
        self.assertEqual([(f["id"], f["level"]) for f in r["flags"]], [("late-M1", "warn")])
        self.assertEqual(r["verdict"], "on")
        self.assertEqual(r["alert"], [])

    def test_late_window_alone_is_at_risk_without_a_forecast(self):
        self.assertEqual(run(milestones=LATE)["verdict"], "risk")

    def test_credit_flag_still_red_and_still_off_under_an_on_forecast(self):
        r = run(credits=CRED, forecast=FC)
        self.assertEqual(r["verdict"], "off")
        self.assertEqual([a["id"] for a in r["alert"]], ["cr-Acme"])

    def test_forecast_line_text(self):
        head = "Done since 12:00: 28 issues, 2,330 min (228 min/h). Left: 14 issues, 605 min (0 with no estimate, 0 in review). "
        self.assertEqual(run(forecast=FC)["line"], head + "Build done ~00:23 \u00b7 Full plan ready ~13:27 \u00b7 Submit 17:00 (freeze 13:00).")
        self.assertIn("Early pace (fewer than 3 done). Build done", run(forecast=dict(FC, early_pace=True))["line"])
        old = {k: v for k, v in FC.items() if k not in ("ready_label", "ready_at")}   # an old feed: the single finish time
        self.assertEqual(run(forecast=old)["line"], head + "Must-haves finish Sun 00:23. Submit 17:00 (freeze 13:00).")
        self.assertTrue(run(forecast=dict(FC, finish_label=None, verdict="off"))["line"].endswith(
            "No must-have is done yet, so no finish time can be projected. Submit 17:00 (freeze 13:00)."))

    def test_off_forecast_opens_the_alert_with_the_cut_order(self):
        cut = [{"id": "MIN-7", "title": "t", "minutes": 60, "finish_after_label": "Sun 14:10"},
               {"id": "MIN-8", "title": "u", "minutes": 30, "finish_after_label": "Sun 12:40"}]
        r = run(forecast=dict(FC, verdict="off", finish_label="Sun 15:00", finish_at="2026-11-15T15:00:00+02:00", ready_label="Sun 16:00", ready_at="2026-11-15T16:00:00+02:00", cut=cut))
        self.assertEqual(r["alert"][0]["id"], "forecast-off")
        self.assertIn("Build done ~15:00", r["alert"][0]["plain"])
        self.assertEqual(r["alert"][0]["act"], "Cut, in this order: MIN-7 (Sun 14:10), MIN-8 (Sun 12:40).")
        self.assertEqual(r["cut"], 2)

    def test_cut_list_is_empty_unless_off(self):
        self.assertEqual(run(forecast=dict(FC, verdict="risk", cut=[{"id": "MIN-7"}]))["cut"], 0)


if __name__ == "__main__":
    unittest.main()
