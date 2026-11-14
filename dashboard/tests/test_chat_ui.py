"""Dashboard chat page (MIN-4498): the pure model run in node, guards on the page source, the fixture and the mock bridge.

The page itself is looked at in a browser (the mock bridge and chat_dev_server.py are for that). Here: what a browser cannot be asked
cheaply twice. `node` is needed for the model tests; without it they are skipped, the rest still runs."""
import json
import os
import re
import shutil
import subprocess
import sys
import threading
import unittest
import http.client

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
DRAFTS = os.path.join(ROOT, "docs", "dashboard", "drafts")
MODEL = os.path.join(DRAFTS, "shared", "chat-model.js")
CHAT_JS = os.path.join(DRAFTS, "shared", "chat.js")
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.dirname(HERE))
import chat_bridge as B  # noqa: E402

NODE = shutil.which("node")

RUNNER = r"""
const vm = require('vm'), fs = require('fs'); const w = {};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), { window: w }); const M = w.ChatModel;
const now = Date.parse('2026-11-14T20:00:00Z');
const S = (id, state, o) => Object.assign({ id, state, title: 'T ' + id, lastAt: '2026-11-14T19:55:48Z' }, o || {});
const A = (state, issue) => ({ n: 'Pix', role: 'Design', state, issue: issue || '-', title: issue ? 'Some title' : '' });
const out = {};
out.page = Object.assign({}, M.PAGE); out.text = { working: M.text('working', { Agent: 'Pix' }), acting: M.text('acting', { Agent: 'Pix', issue: 'MIN-4498' }), act_off: M.text('act_off', { Agent: 'Pix' }) };
out.tone = {}; ['busy_session','agent_busy','cap_reached','chat_full','finished','chat_off','budget_reached','forbidden','bad_row','yes_expired','declined','too_long','rate_limited','whatever'].forEach(c => out.tone[c] = M.toneOf(c));
out.row = {
  needsYes: M.rowOf(A('active','MIN-1'), [S('a','waiting'), S('b','needs_yes')], { b: { summary: 'Do X' } }, now),
  acting: M.rowOf(A('active','MIN-1'), [S('a','acting')], { a: { issue: 'MIN-4498' } }, now),
  working: M.rowOf(A('idle'), [S('a','working')], {}, now),
  active: M.rowOf(A('active','MIN-9'), [], {}, now),
  idleNone: M.rowOf(A('idle'), [], {}, now),
  idleUnknown: M.rowOf(A('idle'), null, {}, now),
  reply: M.rowOf(A('idle'), [S('a','waiting')], {}, now),
  both: M.rowOf(A('idle'), [S('w','working'), S('n','needs_yes')], {}, now),
};
out.summary = {
  all: M.summary([out.row.needsYes, out.row.acting, out.row.working, out.row.active]),
  none: M.summary([out.row.active, out.row.idleNone, out.row.reply]),
};
const P = o => Object.assign({ id: 'p', status: 'open', expiresAt: '2026-11-14T20:10:00Z' }, o || {});
out.prop = { openOn: M.proposalView(P(), true, now), openOff: M.proposalView(P(), false, now), expired: M.proposalView(P({ expiresAt: '2026-11-14T19:00:00Z' }), true, now),
  declined: M.proposalView(P({ status: 'declined' }), true, now), refused: M.proposalView(P({ status: 'refused', refused: 'bad_row' }), true, now), accepted: M.proposalView(P({ status: 'accepted' }), true, now) };
out.result = { done: M.resultView({ outcome: 'done', branch: 'fix/x', summary: 's', minutes: 7 }), failed: M.resultView({ outcome: 'failed', summary: 'no write' }),
  stopped: M.resultView({ outcome: 'stopped' }), timeout: M.resultView({ outcome: 'timeout', minutes: 90 }), unknown: M.resultView({ outcome: 'weird' }), doneNoBranch: M.resultView({ outcome: 'done' }) };
out.fmt = { m0: M.money(0), m1: M.money(0.004), m2: M.money(3.2), m3: M.money(1.495), e0: M.elapsed(0), e1: M.elapsed(252000), e2: M.elapsed(-5), issue: [M.issueOk('MIN-4498'), M.issueOk('min4498'), M.issueOk('<b>'), M.issueOk(null)] };
console.log(JSON.stringify(out));
"""


@unittest.skipUnless(NODE, "node is not installed")
class Model(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        r = subprocess.run([NODE, "-e", RUNNER, MODEL], capture_output=True, text=True, timeout=30)
        assert r.returncode == 0, r.stderr
        cls.o = json.loads(r.stdout)

    def test_the_page_holds_only_the_texts_no_bridge_answer_stands_behind(self):
        """CTO decision 2cc7efc9: the bridge is the one source of words. The page's own table is these six and nothing per refusal code."""
        self.assertEqual(set(self.o["page"]), {"working", "acting", "not_local", "down", "act_off", "refused"})
        self.assertEqual(self.o["text"]["working"], "Waiting for Pix's answer. You can write again when it arrives.")
        self.assertEqual(self.o["text"]["acting"], "Pix is working on MIN-4498 in its own branch.")

    def test_no_bridge_text_is_copied_into_the_page(self):
        """Every refusal text in chat_bridge.REASONS stays out of the page's two files, except act_off, which state 15 shows without a refusal."""
        src = open(MODEL).read() + open(CHAT_JS).read()
        for code, (_, text) in B.REASONS.items():
            if code == "act_off":
                continue
            plain = text.replace("{Agent}", "").strip()
            sentences = [x.strip() for x in re.split(r"(?<=[.!?])\s+", plain) if len(x.strip()) >= 15] or [plain]
            self.assertTrue(all(len(x) >= 10 for x in sentences), code)
            for sent in sentences:                      # a sentence of the bridge's wording, not the whole string, so a pasted half is caught too
                self.assertNotIn(sent, src, code)
        self.assertEqual(B.REASONS["act_off"][1].replace("{Agent}", "Pix"), self.o["text"]["act_off"])      # the one copied text equals the bridge's

    def test_tone_per_code(self):
        t = self.o["tone"]
        for code in ("budget_reached", "forbidden", "bad_row"):
            self.assertEqual(t[code], "bad", code)
        for code in ("busy_session", "chat_full", "finished", "yes_expired", "declined"):
            self.assertEqual(t[code], "neutral", code)
        for code in ("agent_busy", "cap_reached", "chat_off", "too_long", "rate_limited", "whatever"):
            self.assertEqual(t[code], "warn", code)

    def test_one_word_per_agent_first_match_wins(self):
        r = self.o["row"]
        self.assertEqual((r["needsYes"]["word"], r["needsYes"]["tone"], r["needsYes"]["detail"]), ("Needs your yes", "warn", "Do X"))
        self.assertEqual((r["acting"]["word"], r["acting"]["tone"], r["acting"]["ring"], r["acting"]["detail"]), ("Acting on MIN-4498", "brand", True, "04:12"))
        self.assertEqual((r["working"]["word"], r["working"]["detail"]), ("Answering you", "T a"))
        self.assertEqual((r["active"]["word"], r["active"]["tone"], r["active"]["detail"]), ("Active", "ok", "MIN-9 Some title"))
        self.assertEqual((r["idleNone"]["word"], r["idleNone"]["detail"]), ("Idle", "no chat yet"))
        self.assertEqual((r["idleUnknown"]["word"], r["idleUnknown"]["detail"]), ("Idle", ""))      # sessions not read yet: do not claim "no chat yet"
        self.assertEqual(r["both"]["word"], "Needs your yes")
        self.assertEqual([x["rank"] for x in (r["needsYes"], r["acting"], r["working"], r["active"])], [0, 1, 2, 3])

    def test_only_needs_your_yes_is_amber_and_a_waiting_chat_is_a_quiet_chip(self):
        r = self.o["row"]
        self.assertTrue(r["reply"]["reply"])
        self.assertEqual(r["reply"]["tone"], "idle")
        self.assertFalse(r["active"]["reply"])
        tones = {x["text"]: x["tone"] for x in self.o["summary"]["all"]}
        self.assertEqual(tones, {"▲ 1 needs your yes": "warn", "1 acting": "brand", "1 answering": "brand"})
        self.assertEqual(self.o["summary"]["none"], [])             # parts with 0 are left out, and a Reply chip is not counted

    def test_proposal_view(self):
        p = self.o["prop"]
        self.assertEqual(p["openOn"], {"status": "open", "buttons": True})
        self.assertEqual(p["openOff"], {"status": "open", "buttons": False, "line": ["warn", "act_off"]})
        self.assertEqual((p["expired"]["status"], p["expired"]["buttons"], p["expired"]["line"][1]), ("expired", False, "yes_expired"))
        self.assertEqual(p["declined"]["line"][1], "declined")
        self.assertEqual(p["refused"], {"status": "refused", "buttons": False, "line": ["bad", "bad_row"]})
        self.assertFalse(p["accepted"]["buttons"])

    def test_result_view(self):
        r = self.o["result"]
        self.assertEqual((r["done"]["word"], r["done"]["tone"], r["done"]["release"]), ("Done", "ok", True))
        self.assertFalse(r["doneNoBranch"]["release"])              # "Release opens the PR" only when there is a branch
        self.assertEqual((r["failed"]["word"], r["failed"]["note"]), ("Did not finish", "Did not finish: no write"))
        self.assertEqual((r["stopped"]["word"], r["stopped"]["tone"]), ("Stopped by you", "warn"))
        self.assertEqual(r["timeout"]["word"], "Stopped after 90 minutes")
        self.assertEqual(r["unknown"]["word"], "Did not finish")    # an outcome the page does not know reads as not finished, never as Done

    def test_money_time_and_issue_formats(self):
        f = self.o["fmt"]
        self.assertEqual((f["m0"], f["m1"], f["m2"], f["m3"]), ("$0.00", "<$0.01", "$3.20", "$1.50"))
        self.assertEqual((f["e0"], f["e1"], f["e2"]), ("00:00", "04:12", "00:00"))
        self.assertEqual(f["issue"], [True, False, False, False])


class PageSource(unittest.TestCase):
    src = open(CHAT_JS).read()

    def test_the_key_never_leaves_memory(self):
        for bad in ("localStorage", "sessionStorage", "document.cookie", "indexedDB"):
            self.assertNotIn(bad, self.src)

    def test_one_fetch_and_it_goes_to_this_origin(self):
        self.assertEqual(len(re.findall(r"\bfetch\(", self.src)), 1)
        self.assertNotRegex(self.src, r"https?://(?!linear\.app/minhos/issue/)[a-z0-9.-]+")
        self.assertNotIn("XMLHttpRequest", self.src)
        self.assertNotIn("WebSocket", self.src)

    def test_chat_only_talks_on_127_0_0_1(self):
        self.assertIn("location.hostname === '127.0.0.1'", self.src)

    def test_nothing_is_written_with_innerHTML_from_a_message_unescaped(self):
        """Every message and agent field goes through esc() before it joins markup: the strings below are the only ones built raw."""
        self.assertNotRegex(self.src, r"innerHTML\s*=\s*[a-z]*\.text\b")
        self.assertNotRegex(self.src, r"\+\s*m\.text\s*\+")

    def test_the_act_flags_are_not_in_the_page(self):
        for bad in ("bypassPermissions", "dangerously", "x-chat-key:' +"):
            self.assertNotIn(bad, self.src)


class Fixture(unittest.TestCase):
    def test_one_chat_per_state_and_one_proposal_per_status(self):
        fx = json.load(open(os.path.join(ROOT, "dashboard", "fixtures", "chat.example.json")))
        sess = [s for ss in fx["agents"].values() for s in ss]
        self.assertEqual({s["state"] for s in sess}, {"needs_yes", "acting", "working", "waiting", "finished"})
        props = [m["proposal"] for s in sess for m in s["messages"] if m.get("proposal")]
        self.assertEqual({p["status"] for p in props}, {"open", "accepted", "declined", "refused"})
        self.assertTrue(any(p["status"] == "open" and p["expiresInMin"] < 0 for p in props), "an expired proposal")
        outcomes = {m["result"]["outcome"] for s in sess for m in s["messages"] if m.get("result")}
        self.assertTrue({"done", "failed"} <= outcomes)
        self.assertTrue(any(m["role"] == "error" for s in sess for m in s["messages"]))
        self.assertTrue(set(fx["agents"]) <= set(__import__("chat_mock_server").ROLES))


class MockBridge(unittest.TestCase):
    """The mock is a review tool, so it is tested lightly: it must keep the contract's shapes the page reads."""

    @classmethod
    def setUpClass(cls):
        import chat_mock_server as C
        cls.C = C
        cls.srv = C.Server(("127.0.0.1", 0), lambda *a, **kw: C.Handler(*a, directory=C.PAGES, **kw))
        cls.srv.mock, cls.srv.key = C.Mock(True), "k" * 40
        cls.port = cls.srv.server_address[1]
        threading.Thread(target=cls.srv.serve_forever, kwargs={"poll_interval": 0.05}, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()
        cls.srv.server_close()

    def call(self, method, path, body=None, key=True):
        c = http.client.HTTPConnection("127.0.0.1", self.port, timeout=10)
        h = {"x-chat-key": "k" * 40} if key else {}
        data = json.dumps(body).encode() if body is not None else None
        if data:
            h["Content-Type"] = "application/json"
        c.request(method, path, data, h)
        r = c.getresponse()
        raw = r.read()
        c.close()
        return r.status, json.loads(raw or b"{}")

    def test_no_key_is_403_and_health_has_the_contract_fields(self):
        self.assertEqual(self.call("GET", "/chat/health", key=False), (403, {}))
        st, h = self.call("GET", "/chat/health")
        self.assertEqual(st, 200)
        self.assertEqual(set(h), {"ok", "off", "running", "maxRunning", "spentTodayUsd", "dailyUsd", "act", "acting"})

    def test_session_and_message_shapes_match_the_bridge(self):
        st, body = self.call("GET", "/chat/sessions?agent=Back")
        s = body["sessions"][0]
        self.assertEqual(set(s), {"id", "agent", "title", "startedAt", "lastAt", "state", "turns", "costUsd", "full", "worktree", "branch"})
        st, body = self.call("GET", "/chat/sessions/" + s["id"])
        p = [m["proposal"] for m in body["messages"] if m.get("proposal")][0]
        for k in ("id", "kind", "summary", "issue", "taskType", "model", "effort", "lane", "branch", "estMin", "estUsd", "spentTodayUsd", "expiresAt", "status"):
            self.assertIn(k, p)

    def test_the_mock_has_the_real_bridges_fields(self):
        """The mock is checked against the real bridge (stub claude): same session keys, same proposal keys. If the bridge adds a field, this goes red."""
        from chat_testkit import Env, block, good_proposal
        env = Env()
        try:
            env.set_behavior(reply="I would do it.\n" + block(good_proposal()))
            sid = env.start_chat("Pix", "do it")
            env.wait_idle()
            _, real = env.get("/chat/sessions/" + sid)[:2]
            real_prop = [m["proposal"] for m in real["messages"] if m.get("proposal")][0]
            st, body = self.call("GET", "/chat/sessions?agent=Back")
            mock_session = body["sessions"][0]
            _, mb = self.call("GET", "/chat/sessions/" + mock_session["id"])
            mock_prop = [m["proposal"] for m in mb["messages"] if m.get("proposal")][0]
            # the real session carries what the mock does; the mock may add `reason` and `acceptedAt` ideas only when the bridge does
            self.assertEqual(set(real["session"]), set(mock_session))
            self.assertLessEqual(set(real_prop) - {"branchType"}, set(mock_prop))      # branchType is the bridge's own and unused by the page
            self.assertLessEqual(set(mock_prop) - {"reason"}, set(real_prop))
        finally:
            env.close()

    def test_yes_with_act_off_is_act_off_and_runs_nothing(self):
        m = self.srv.mock
        m.flags["act"] = False
        try:
            st, body = self.call("POST", "/chat/sessions/s-needs-yes/proposals/p-open/yes")
            self.assertEqual((st, body["refused"]), (409, "act_off"))
            self.assertEqual(m.sessions["s-needs-yes"]["state"], "needs_yes")
        finally:
            m.flags["act"] = True


if __name__ == "__main__":
    unittest.main()
