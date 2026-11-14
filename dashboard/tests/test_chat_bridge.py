"""Dashboard chat bridge, answer path (MIN-4497 run 1). `claude` is a stub; nothing here calls a model.

Every refusal test asserts the stub was NOT started (`env.records()` is empty): a 403 that still spawned would be the bug."""
import json
import os
import re
import signal
import socket
import subprocess
import sys
import threading
import time
import unittest

from chat_testkit import ChatCase, Env, KEY, block, good_proposal, wait_for
import chat_bridge as B

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = open(os.path.join(HERE, "chat_bridge.py")).read()


def code_lines(src):
    """The source as code only: comments are gone (ast drops them) and so are docstrings, so a rule written in prose is not a match."""
    import ast
    tree = ast.parse(src)
    for node in ast.walk(tree):
        body = getattr(node, "body", None)
        if isinstance(body, list) and body and isinstance(body[0], ast.Expr) and isinstance(body[0].value, ast.Constant) \
                and isinstance(body[0].value.value, str):
            del body[0]
            if not body:
                body.append(ast.Pass())
    return ast.unparse(tree)


class BindAndSource(ChatCase):
    def test_binds_127_0_0_1_only(self):
        env = self.make()
        self.assertEqual(env.server.server_address[0], "127.0.0.1")
        self.assertEqual(B.BIND, "127.0.0.1")
        code = code_lines(SRC)
        self.assertNotIn("0.0.0.0", code)
        self.assertNotRegex(code, r"HTTPServer\(\s*\(\s*['\"]{2}")
        self.assertNotRegex(code, r"\bINADDR_ANY\b|\bgethostname\b")

    def test_no_bypass_flag_anywhere_in_the_source(self):
        code = code_lines(SRC).replace(" ", "")
        for flag in ("bypassPermissions", "--dangerously-skip-permissions", "--allow-dangerously-skip-permissions"):
            self.assertNotIn(flag, code)

    def test_page_folder_cannot_overlap_the_home_folder(self):
        env = self.make()
        with self.assertRaises(SystemExit):
            B.make_server(env.home, env.home, 0, env.settings, [], key=KEY)
        with self.assertRaises(SystemExit):
            B.make_server(env.home, os.path.join(env.home, "chat"), 0, env.settings, [], key=KEY)


class OriginRules(ChatCase):
    """CTO decision dfe40a71, rule 2. Every refusal is 403 with `{}` and starts nothing."""

    def assert_refused(self, env, st, body, hdrs):
        self.assertEqual((st, body), (403, {}))
        self.assertFalse([h for h in hdrs if h.startswith("access-control")], "a CORS header was sent")
        self.assertEqual(env.records(), [])
        self.assertEqual(env.chat.turns, {})

    def test_post_matrix(self):
        env = self.make()
        body = {"agent": "Pix", "text": "hi"}
        cases = {
            "no key": dict(key=False),
            "wrong key": dict(headers={"x-chat-key": "w" * 40}),
            "empty key": dict(headers={"x-chat-key": ""}),
            "no origin": dict(origin=False),
            "origin null": dict(headers={"Origin": "null"}),
            "other origin": dict(headers={"Origin": "http://evil.example"}),
            "other port": dict(headers={"Origin": "http://127.0.0.1:1"}),
            "localhost origin": dict(headers={"Origin": "http://localhost:%d" % env.port}),
            "wrong host": dict(host="localhost:%d" % env.port),
            "rebound host": dict(host="evil.example"),
            "cross-site fetch": dict(headers={"Sec-Fetch-Site": "cross-site"}),
            "same-site fetch": dict(headers={"Sec-Fetch-Site": "same-site"}),
            "text/plain": dict(headers={"Content-Type": "text/plain"}),
            "form post": dict(headers={"Content-Type": "application/x-www-form-urlencoded"}),
            "no content type": dict(ctype=False),
        }
        for name, kw in cases.items():
            with self.subTest(name):
                self.assert_refused(env, *env.post("/chat/sessions", body, **kw))

    def test_get_rules(self):
        env = self.make()
        st, body, hdrs = env.get("/chat/health", origin=False)                      # a same-origin GET carries no Origin
        self.assertEqual(st, 200)
        self.assertTrue(body["ok"])
        self.assertFalse([h for h in hdrs if h.startswith("access-control")])
        self.assertEqual(env.get("/chat/health", headers={"Sec-Fetch-Site": "same-origin"})[0], 200)
        for name, kw in {"other origin": dict(headers={"Origin": "http://evil.example"}),
                         "origin null": dict(headers={"Origin": "null"}),
                         "cross-site": dict(origin=False, headers={"Sec-Fetch-Site": "cross-site"}),
                         "no key": dict(key=False), "wrong key": dict(headers={"x-chat-key": "w" * 40}),
                         "wrong host": dict(host="localhost:%d" % env.port)}.items():
            with self.subTest(name):
                self.assert_refused(env, *env.get("/chat/sessions?agent=Pix", **kw))

    def test_a_repeated_security_header_is_refused(self):
        """Two copies of Origin, Host or the key: which one a proxy or the server reads is not the caller's to choose."""
        env = self.make()
        good = {"Host": "127.0.0.1:%d" % env.port, "Origin": "http://127.0.0.1:%d" % env.port, "x-chat-key": KEY}
        for dup, extra in (("Origin", "http://evil.example"), ("x-chat-key", "w" * 40), ("Host", "evil.example")):
            with self.subTest(dup):
                lines = ["GET /chat/health HTTP/1.1"] + ["%s: %s" % kv for kv in good.items()] + ["%s: %s" % (dup, extra), "Connection: close", "", ""]
                s = socket.create_connection(("127.0.0.1", env.port), 5)
                s.sendall("\r\n".join(lines).encode())
                head = b""
                while True:
                    chunk = s.recv(4096)
                    if not chunk:
                        break
                    head += chunk
                s.close()
                self.assertIn(b" 403 ", head.split(b"\r\n")[0])
        ok = "\r\n".join(["GET /chat/health HTTP/1.1"] + ["%s: %s" % kv for kv in good.items()] + ["Connection: close", "", ""])
        s = socket.create_connection(("127.0.0.1", env.port), 5)
        s.sendall(ok.encode())
        self.assertIn(b" 200 ", s.recv(4096).split(b"\r\n")[0])      # the same request without the extra header is fine
        s.close()

    def test_options_is_403_everywhere_and_never_cors(self):
        env = self.make()
        for path in ("/chat/sessions", "/chat/health", "/index.html", "/"):
            with self.subTest(path):
                st, body, hdrs = env.call("OPTIONS", path, headers={"Access-Control-Request-Headers": "x-chat-key", "Origin": "http://evil.example"})
                self.assertEqual((st, body), (403, {}))
                self.assertFalse([h for h in hdrs if h.startswith("access-control")])

    def test_a_good_post_is_accepted_and_no_cors_header_is_ever_sent(self):
        env = self.make()
        st, body, hdrs = env.post("/chat/sessions", {"agent": "Pix", "text": "hi"})
        self.assertEqual(st, 202)
        self.assertFalse([h for h in hdrs if h.startswith("access-control")])
        env.wait_idle()

    def test_no_key_configured_answers_503_to_everything(self):
        env = self.make()
        env.server.key = None
        for method, path in (("GET", "/chat/health"), ("POST", "/chat/sessions")):
            st, body, _ = env.call(method, path, {"agent": "Pix", "text": "hi"} if method == "POST" else None)
            self.assertEqual((st, body), (503, {}))
        self.assertEqual(env.records(), [])

    def test_a_short_key_file_counts_as_no_key(self):
        env = self.make()
        with open(os.path.join(env.home, "chat.key"), "w") as f:
            f.write("short")
        self.assertIsNone(B.read_key(env.home))
        with open(os.path.join(env.home, "chat.key"), "w") as f:
            f.write("a" * 32 + "\n")
        self.assertEqual(B.read_key(env.home), "a" * 32)
        os.remove(os.path.join(env.home, "chat.key"))
        self.assertIsNone(B.read_key(env.home))

    def test_static_page_is_served_and_chat_prefix_is_not_static(self):
        env = self.make()
        st, raw, _ = env.call("GET", "/index.html", key=False, origin=False)
        self.assertEqual(st, 200)
        self.assertIn(b"page", json.dumps(raw).encode() if not isinstance(raw, bytes) else raw)
        self.assertEqual(env.get("/chat/nothing")[0], 404)
        self.assertEqual(env.call("GET", "/chat/health", key=False)[0], 403)


class ChildEnvironment(ChatCase):
    def test_exact_key_set(self):
        self.assertEqual(sorted(B.child_env().keys()), sorted(["HOME", "USER", "LOGNAME", "TMPDIR", "LANG", "PATH"]))
        self.assertEqual(B.CHILD_ENV_KEYS, ("HOME", "USER", "LOGNAME", "TMPDIR", "LANG", "PATH"))

    def test_built_from_nothing_a_poisoned_parent_environment_does_not_reach_the_child(self):
        poison = {"ANTHROPIC_API_KEY": "a", "CLAUDE_CODE_OAUTH_TOKEN": "b", "LINEAR_API_KEY_BACKEND": "c", "FAL_KEY": "d",
                  "SUPABASE_SERVICE_ROLE_KEY": "e", "CLOUDFLARE_API_TOKEN": "f", "MY_SECRET": "g", "AWS_ACCESS_KEY_ID": "h",
                  "ANTHROPIC_BASE_URL": "i", "GEMINI_API_KEY": "j"}
        old = {k: os.environ.get(k) for k in poison}
        os.environ.update(poison)
        self.addCleanup(lambda: [os.environ.pop(k, None) if v is None else os.environ.__setitem__(k, v) for k, v in old.items()])
        env = self.make()
        env.start_chat()
        env.wait_idle()
        seen = env.record()["env"]
        self.assertEqual(sorted(seen), sorted(["HOME", "USER", "LOGNAME", "TMPDIR", "LANG", "PATH"]))
        self.assertFalse(set(poison) & set(seen))
        self.assertTrue(seen["TMPDIR"].startswith(env.home))      # a private folder under the dashboard home, not the host's

    def test_source_never_copies_the_environment(self):
        code = code_lines(SRC)
        self.assertNotIn("environ", code)


class Argv(ChatCase):
    def test_first_and_second_turn(self):
        env = self.make()
        sid = env.start_chat(text="the first message text")
        env.wait_idle()
        first = env.record(0)
        argv = first["argv"]
        self.assertEqual(argv[1:3], ["-p", "--agent"])
        self.assertEqual(argv[3], "design-minhos")
        self.assertIn("--session-id", argv)
        self.assertNotIn("--resume", argv)
        self.assertEqual(first["stdin"], "the first message text")       # the message travels on stdin, never in argv
        self.assertNotIn("the first message text", " ".join(argv))
        self.assertEqual(first["cwd"], env.cwd)
        st, _, _ = env.post("/chat/sessions/%s/messages" % sid, {"text": "second"})
        self.assertEqual(st, 202)
        env.wait_idle()
        second = env.record(1)["argv"]
        self.assertIn("--resume", second)
        self.assertNotIn("--session-id", second)
        self.assertEqual(second[second.index("--resume") + 1], argv[argv.index("--session-id") + 1])   # same Claude session

    def test_a_failed_first_turn_starts_again_with_session_id_and_only_an_answer_makes_it_resumable(self):
        env = self.make()
        env.set_behavior(is_error=True, reply="boom")
        sid = env.start_chat()
        env.wait_idle()
        env.set_behavior(reply="fine")
        self.assertEqual(env.post("/chat/sessions/%s/messages" % sid, {"text": "again"})[0], 202)
        env.wait_idle()
        self.assertEqual(env.post("/chat/sessions/%s/messages" % sid, {"text": "third"})[0], 202)
        env.wait_idle()
        flags = [("--resume" in r["argv"], "--session-id" in r["argv"]) for r in (env.record(i) for i in range(3))]
        self.assertEqual(flags, [(False, True), (False, True), (True, False)])

    def test_read_only_flags_and_no_bypass(self):
        env = self.make()
        env.start_chat()
        env.wait_idle()
        argv = env.record()["argv"]
        joined = " ".join(argv)
        for bad in ("bypassPermissions", "dangerously", "--bare"):
            self.assertNotIn(bad, joined)
        self.assertEqual(argv[argv.index("--permission-mode") + 1], "dontAsk")
        self.assertEqual(argv[argv.index("--max-budget-usd") + 1], "2")
        self.assertEqual(argv[argv.index("--model") + 1], "sonnet")
        self.assertEqual(argv[argv.index("--effort") + 1], "medium")
        self.assertEqual(argv[argv.index("--output-format") + 1], "stream-json")
        allowed = argv[argv.index("--allowedTools") + 1:argv.index("--disallowedTools")]
        disallowed = argv[argv.index("--disallowedTools") + 1:argv.index("--max-budget-usd")]
        for t in ("Read", "Grep", "Glob"):
            self.assertIn(t, allowed)
        for t in ("Edit", "Write", "NotebookEdit", "Bash", "Agent", "WebFetch", "mcp__linear__save_issue", "mcp__linear__save_comment",
                  "mcp__linear__delete_comment", "mcp__linear__merge_diff", "mcp__supabase"):
            self.assertIn(t, disallowed)
            self.assertNotIn(t, allowed)
        self.assertFalse([t for t in allowed if "save_" in t or "delete_" in t or "merge" in t or t in ("Edit", "Write", "Bash")])

    def test_cto_runs_on_fable_and_a_config_row_overrides(self):
        env = self.make()
        env.chat.agents["Ren"]["chat"] = {"row": "x", "model": "opus", "effort": "high"}
        for agent in ("CTO", "Ren"):
            env.start_chat(agent)
            env.wait_idle()
        a, b = env.record(0)["argv"], env.record(1)["argv"]
        by_agent = {x[x.index("--agent") + 1]: x for x in (a, b)}
        self.assertEqual(by_agent["cto-minhos"][by_agent["cto-minhos"].index("--model") + 1], "fable")
        self.assertEqual(by_agent["frontend-minhos"][by_agent["frontend-minhos"].index("--model") + 1], "opus")
        self.assertEqual(by_agent["frontend-minhos"][by_agent["frontend-minhos"].index("--effort") + 1], "high")

    def test_the_guard_hook_is_passed_and_pointed_at_the_two_roots(self):
        env = self.make()
        env.start_chat()
        env.wait_idle()
        argv = env.record()["argv"]
        settings = json.loads(argv[argv.index("--settings") + 1])
        hook = settings["hooks"]["PreToolUse"][0]
        self.assertEqual(hook["matcher"], ".*")
        cmd = hook["hooks"][0]["command"]
        self.assertIn("chat_guard.py", cmd)
        self.assertIn("--mode answer", cmd)
        self.assertIn(env.cwd, cmd)
        self.assertIn(env.conductor, cmd)

    def test_system_prompt_asks_for_one_trailing_block(self):
        self.assertEqual(B.ANSWER_PROMPT.count("<<<PROPOSAL"), 1)
        self.assertIn("nothing after it", B.ANSWER_PROMPT)


class Caps(ChatCase):
    def test_three_running_then_cap_reached(self):
        env = self.make()
        env.set_behavior(sleep=30)
        for agent in ("Pix", "Cron", "Ren"):
            env.start_chat(agent)
        self.assertTrue(wait_for(lambda: len(env.records()) == 3))
        st, body, _ = env.post("/chat/sessions", {"agent": "Back", "text": "fourth"})
        self.assertEqual((st, body["refused"]), (429, "cap_reached"))
        self.assertEqual(body["reason"], "3 agents are already answering. Try again when one finishes.")
        self.assertEqual(len(env.records()), 3)                     # the fourth never started
        self.assertEqual(env.get("/chat/health")[1]["running"], 3)

    def test_one_turn_per_agent_and_per_chat(self):
        env = self.make()
        env.set_behavior(sleep=30)
        sid = env.start_chat("Pix")
        self.assertTrue(wait_for(lambda: len(env.records()) == 1))
        st, body, _ = env.post("/chat/sessions/%s/messages" % sid, {"text": "again"})
        self.assertEqual((st, body["refused"]), (409, "busy_session"))
        st, body, _ = env.post("/chat/sessions", {"agent": "Pix", "text": "another chat"})
        self.assertEqual((st, body["refused"]), (409, "agent_busy"))
        self.assertEqual(body["reason"], "Pix is already working. Wait for it to finish, or stop it.")
        self.assertEqual(len(env.records()), 1)

    def test_message_size(self):
        env = self.make()
        st, body, _ = env.post("/chat/sessions", {"agent": "Pix", "text": "x" * 4001})
        self.assertEqual((st, body["refused"], body["reason"]), (413, "too_long", "Keep it under 4,000 characters."))
        st, body, _ = env.post("/chat/sessions", b'{"agent":"Pix","text":"' + b"y" * 70000 + b'"}')
        self.assertEqual((st, body["refused"]), (413, "too_long"))
        self.assertEqual(env.records(), [])
        st, body, _ = env.post("/chat/sessions", {"agent": "Pix", "text": "é" * 4000})      # exactly 4,000 characters is fine
        self.assertEqual(st, 202)
        env.wait_idle()

    def test_empty_unknown_agent_and_bad_json(self):
        env = self.make()
        self.assertEqual(env.post("/chat/sessions", {"agent": "Pix", "text": "   "})[1]["refused"], "empty")
        self.assertEqual(env.post("/chat/sessions", {"agent": "Nobody", "text": "hi"})[0], 404)
        self.assertEqual(env.post("/chat/sessions", b"{not json")[1]["refused"], "bad_request")
        self.assertEqual(env.post("/chat/sessions", [1, 2])[1]["refused"], "bad_request")
        self.assertEqual(env.post("/chat/sessions", {"agent": 5, "text": "hi"})[1]["refused"], "bad_request")
        self.assertEqual(env.records(), [])

    def test_daily_budget(self):
        env = self.make(dailyUsd=3, perTurnUsd=2)
        env.set_behavior(cost=1.5)
        env.start_chat("Pix")
        env.wait_idle()
        self.assertAlmostEqual(env.chat.spent_today(), 1.5)
        st, body, _ = env.post("/chat/sessions", {"agent": "Cron", "text": "hi"})      # 1.5 + a possible 2 > 3
        self.assertEqual((st, body["refused"]), (429, "budget_reached"))
        self.assertEqual(body["reason"], "Today's chat budget is used up. It resets at midnight.")
        self.assertEqual(len(env.records()), 1)
        self.assertEqual(env.get("/chat/health")[1]["spentTodayUsd"], 1.5)

    def test_budget_is_per_day(self):
        env = self.make(dailyUsd=3, perTurnUsd=2)
        env.chat.ledger.append((time.time() - 2 * 86400, 100.0))      # an old spend does not count
        self.assertEqual(env.chat.spent_today(), 0)
        self.assertEqual(env.post("/chat/sessions", {"agent": "Pix", "text": "hi"})[0], 202)
        env.wait_idle()

    def test_chat_full_by_turns_and_by_context(self):
        env = self.make(maxTurns=2)
        sid = env.start_chat()
        env.wait_idle()
        self.assertEqual(env.post("/chat/sessions/%s/messages" % sid, {"text": "2"})[0], 202)
        env.wait_idle()
        st, body, _ = env.post("/chat/sessions/%s/messages" % sid, {"text": "3"})
        self.assertEqual((st, body["refused"], body["reason"]), (409, "chat_full", "This chat is full. Start a new chat."))
        self.assertTrue(env.get("/chat/sessions/%s" % sid)[1]["session"]["full"])
        self.assertEqual(env.get("/chat/sessions/%s" % sid)[1]["session"]["state"], "finished")
        env2 = self.make(fullAtTokens=500)
        env2.set_behavior(usage={"input_tokens": 100, "cache_creation_input_tokens": 300, "cache_read_input_tokens": 200, "output_tokens": 9})
        sid2 = env2.start_chat()
        env2.wait_idle()
        self.assertEqual(env2.post("/chat/sessions/%s/messages" % sid2, {"text": "2"})[1]["refused"], "chat_full")

    def test_finished_after_idle_hours(self):
        env = self.make(idleHours=12)
        sid = env.start_chat()
        env.wait_idle()
        self.assertEqual(env.get("/chat/sessions/%s" % sid)[1]["session"]["state"], "waiting")
        env.chat.now = lambda: time.time() + 13 * 3600
        st, body, _ = env.post("/chat/sessions/%s/messages" % sid, {"text": "late"})
        self.assertEqual((st, body["refused"]), (409, "finished"))
        self.assertEqual(env.get("/chat/sessions/%s" % sid)[1]["session"]["state"], "finished")

    def test_kill_switch_file_refuses_new_turns(self):
        env = self.make()
        open(os.path.join(env.home, "chat.off"), "w").close()
        st, body, _ = env.post("/chat/sessions", {"agent": "Pix", "text": "hi"})
        self.assertEqual((st, body["refused"], body["reason"]), (503, "chat_off", "Chat is switched off on this Mac."))
        self.assertTrue(env.get("/chat/health")[1]["off"])
        self.assertEqual(env.records(), [])
        os.remove(os.path.join(env.home, "chat.off"))
        self.assertEqual(env.post("/chat/sessions", {"agent": "Pix", "text": "hi"})[0], 202)
        env.wait_idle()


class SessionsAndReplies(ChatCase):
    def test_list_get_state_and_cost(self):
        env = self.make()
        env.set_behavior(reply="Hello from Pix", cost=0.18)
        s1 = env.start_chat("Pix", "first   question\nwith lines")
        env.wait_idle()
        s2 = env.start_chat("Pix", "second")
        env.wait_idle()
        st, body, _ = env.get("/chat/sessions?agent=Pix")
        self.assertEqual(st, 200)
        self.assertEqual([s["id"] for s in body["sessions"]], [s2, s1])                 # newest first
        got = body["sessions"][1]
        self.assertEqual((got["title"], got["state"], got["turns"], got["costUsd"], got["full"], got["worktree"], got["branch"]),
                         ("first question with lines", "waiting", 1, 0.18, False, False, None))
        self.assertEqual(sorted(got), sorted(["id", "agent", "title", "startedAt", "lastAt", "state", "turns", "costUsd", "full", "worktree", "branch"]))
        self.assertEqual(env.get("/chat/sessions?agent=Cron")[1]["sessions"], [])
        self.assertEqual(env.get("/chat/sessions?agent=Nobody")[0], 404)
        msgs = env.get("/chat/sessions/%s" % s1)[1]["messages"]
        self.assertEqual([(m["role"], m["text"], m["costUsd"]) for m in msgs], [("you", "first   question\nwith lines", None), ("agent", "Hello from Pix", 0.18)])

    def test_pending_is_reported_and_survives_a_reload(self):
        env = self.make()
        env.set_behavior(sleep=1.5, reply="late answer")
        sid = env.start_chat()
        self.assertEqual(env.get("/chat/sessions/%s" % sid)[1]["session"]["state"], "working")
        self.assertEqual(env.get("/chat/sessions?agent=Pix")[1]["sessions"][0]["state"], "working")
        self.assertEqual(env.get("/chat/sessions/%s/events?after=0" % sid)[1]["state"], "working")
        env.wait_idle()
        st, body, _ = env.get("/chat/sessions/%s" % sid)
        self.assertEqual(body["session"]["state"], "waiting")
        self.assertEqual(body["messages"][-1]["text"], "late answer")

    def test_unknown_session(self):
        env = self.make()
        self.assertEqual(env.get("/chat/sessions/" + "0" * 32)[0], 404)
        self.assertEqual(env.post("/chat/sessions/%s/messages" % ("0" * 32), {"text": "x"})[0], 404)

    def test_files_are_private_and_a_restart_keeps_the_chats(self):
        env = self.make()
        env.set_behavior(reply="kept")
        sid = env.start_chat()
        env.wait_idle()
        path = os.path.join(env.home, "chat", sid + ".json")
        self.assertEqual(os.stat(path).st_mode & 0o777, 0o600)
        self.assertEqual(os.stat(os.path.join(env.home, "chat")).st_mode & 0o777, 0o700)
        again = B.Chat(env.home, env.settings, [{"n": "Pix", "agentType": "design-minhos"}], row_checker=lambda *a: ("s", "m"))
        self.assertEqual(again.get_session(sid)[1]["messages"][-1]["text"], "kept")

    def test_a_restart_during_a_turn_becomes_one_error_message(self):
        env = self.make()
        sid = "ab" * 16
        sess = {"id": sid, "agent": "Pix", "title": "t", "startedAt": "2026-11-14T10:00:00Z", "lastAt": "2026-11-14T10:00:00Z",
                "claudeSession": "x", "resumable": False, "turns": 0, "costUsd": 0.0, "contextTokens": 0, "pending": True,
                "messages": [{"role": "you", "text": "q", "at": "2026-11-14T10:00:00Z", "costUsd": None}]}
        B.write_private(os.path.join(env.home, "chat", sid + ".json"), sess)
        again = B.Chat(env.home, env.settings, [{"n": "Pix", "agentType": "design-minhos"}], row_checker=lambda *a: ("s", "m"))
        msgs = again.get_session(sid)[1]["messages"]
        self.assertEqual([m["role"] for m in msgs], ["you", "error"])
        self.assertFalse(again.sessions[sid]["pending"])

    def test_a_failed_turn_is_one_error_message_and_nothing_is_retried(self):
        for name, beh in {"non-zero exit": dict(exit=1, no_result=True), "no result event": dict(no_result=True),
                          "is_error": dict(is_error=True, reply="Credit balance is too low")}.items():
            with self.subTest(name):
                env = self.make()
                env.set_behavior(**beh)
                sid = env.start_chat()
                env.wait_idle()
                msgs = env.get("/chat/sessions/%s" % sid)[1]["messages"]
                self.assertEqual([m["role"] for m in msgs], ["you", "error"])
                self.assertEqual(msgs[1]["text"], "Pix did not answer. Nothing was lost. Try again.")
                self.assertNotIn("Credit", msgs[1]["text"])
                self.assertEqual(len(env.records()), 1)                        # never retried by the bridge

    def test_rate_limit_text(self):
        env = self.make()
        env.set_behavior(is_error=True, reply="API Error: 429 rate limit")
        sid = env.start_chat()
        env.wait_idle()
        self.assertEqual(env.get("/chat/sessions/%s" % sid)[1]["messages"][-1]["text"], "Pix is rate limited. Try again in a minute.")

    def test_replies_are_scrubbed(self):
        env = self.make()
        fake_key = "lin" + "_api_" + "A" * 30
        env.set_behavior(reply="see /Users/someone/AppDevelopment/x and %s done" % fake_key)
        sid = env.start_chat()
        env.wait_idle()
        text = env.get("/chat/sessions/%s" % sid)[1]["messages"][-1]["text"]
        self.assertNotIn(fake_key, text)
        self.assertNotIn("/Users/someone", text)
        self.assertIn("[redacted]", text)
        self.assertIn("~/AppDevelopment/x", text)


class ProposalParsing(unittest.TestCase):
    """CTO decision dfe40a71, rule 1: one block, last; strict; always stripped."""

    def test_table(self):
        good = good_proposal()
        two = "a " + block(good) + " b " + block(good)
        cases = [
            ("no block", "Just an answer.", "Just an answer.", None, False),
            ("one valid block", "I will add it.\n" + block(good), "I will add it.", good, False),
            ("valid block, trailing whitespace", "Ok.\n" + block(good) + "\n  \n", "Ok.", good, False),
            ("two blocks", two, "a  b", None, True),
            ("block not last", block(good) + " and then more text", "and then more text", None, True),
            ("broken json", "Ok " + "<<<PROPOSAL {not json PROPOSAL>>>", "Ok", None, True),
            ("extra field", "Ok " + block(good_proposal(extra=1)), "Ok", None, True),
            ("missing field", "Ok " + block({k: v for k, v in good.items() if k != "lane"}), "Ok", None, True),
            ("bad enum", "Ok " + block(good_proposal(lane="D")), "Ok", None, True),
            ("wrong type estMin", "Ok " + block(good_proposal(estMin="20")), "Ok", None, True),
            ("bool estMin", "Ok " + block(good_proposal(estMin=True)), "Ok", None, True),
            ("float estMin", "Ok " + block(good_proposal(estMin=1.5)), "Ok", None, True),
            ("nan estUsd", "Ok <<<PROPOSAL " + json.dumps(good_proposal(estUsd=float("nan"))) + " PROPOSAL>>>", "Ok", None, True),
            ("summary 501 chars", "Ok " + block(good_proposal(summary="x" * 501)), "Ok", None, True),
            ("summary 500 chars", "Ok " + block(good_proposal(summary="x" * 500)), "Ok", good_proposal(summary="x" * 500), False),
            ("empty summary", "Ok " + block(good_proposal(summary="  ")), "Ok", None, True),
            ("bad issue id", "Ok " + block(good_proposal(issue="not an issue")), "Ok", None, True),
            ("issue null", "Ok " + block(good_proposal(issue=None)), "Ok", good_proposal(issue=None), False),
            ("not an object", "Ok <<<PROPOSAL [1] PROPOSAL>>>", "Ok", None, True),
            ("lone opening marker", "Ok <<<PROPOSAL and nothing else", "Ok  and nothing else".replace("  ", " "), None, True),
            ("lone closing marker", "Ok PROPOSAL>>> more", "Ok  more".replace("  ", " "), None, True),
            ("marker inside the reply text", "Use the <<<PROPOSAL marker like this: " + block(good), "Use the", None, True),
        ]
        for name, text, want_text, want_prop, want_rejected in cases:
            with self.subTest(name):
                got_text, prop, rejected = B.split_proposal(text)
                self.assertEqual(re.sub(r"\s+", " ", got_text), re.sub(r"\s+", " ", want_text))
                self.assertEqual(prop, want_prop)
                self.assertEqual(rejected, want_rejected)
                self.assertNotIn("PROPOSAL", got_text)
                self.assertNotIn("<<<", got_text)


class ProposalFlow(ChatCase):
    def run_turn(self, env, reply):
        env.set_behavior(reply=reply)
        sid = env.start_chat("Cron", "please add the footer link")
        env.wait_idle()
        return sid, env.get("/chat/sessions/%s" % sid)[1]["messages"]

    def test_a_valid_block_becomes_a_proposal_and_is_stripped_from_the_reply(self):
        env = self.make()
        sid, msgs = self.run_turn(env, "I would add the link.\n" + block(good_proposal()))
        self.assertEqual([m["role"] for m in msgs], ["you", "agent", "proposal"])
        self.assertEqual(msgs[1]["text"], "I would add the link.")
        p = msgs[2]["proposal"]
        self.assertEqual((p["status"], p["kind"], p["model"], p["effort"], p["lane"], p["branch"], p["issue"]),
                         ("open", "change", "sonnet", "high", "A", None, "MIN-4497"))
        self.assertEqual(p["spentTodayUsd"], 0.1)
        self.assertRegex(p["expiresAt"], r"^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$")
        self.assertNotIn("<<<", json.dumps(msgs))

    def test_malformed_and_double_blocks_show_the_reply_and_no_proposal_and_log_a_line_without_text(self):
        env = self.make()
        for reply in ("Answer.\n" + block(good_proposal()) + "\n" + block(good_proposal()), "Answer.\n<<<PROPOSAL {broken PROPOSAL>>>"):
            sid, msgs = self.run_turn(env, reply)
            self.assertEqual([m["role"] for m in msgs], ["you", "agent"])
            self.assertEqual(msgs[1]["text"], "Answer.")
        log = open(os.path.join(env.home, "chat.log")).read()
        self.assertEqual(log.count("proposal_rejected"), 2)
        self.assertNotIn("Answer", log)
        self.assertNotIn("broken", log)

    def test_the_row_check_runs_without_the_lock(self):
        """The row check starts conductor's hook (a subprocess); while it runs, the bridge must keep answering."""
        env = self.make()
        entered, release = threading.Event(), threading.Event()

        def slow(agent_file, task):
            entered.set()
            release.wait(10)
            return "sonnet", "high"
        env.chat.row_checker = slow
        env.set_behavior(reply="ok\n" + block(good_proposal()))
        env.start_chat("Cron")
        self.assertTrue(entered.wait(10))
        t0 = time.time()
        st, body, _ = env.get("/chat/health")
        self.assertEqual(st, 200)
        self.assertLess(time.time() - t0, 1.0)
        self.assertEqual(body["running"], 1)
        release.set()
        env.wait_idle()

    def test_the_founders_own_message_is_never_parsed(self):
        env = self.make()
        env.set_behavior(reply="plain answer")
        sid = env.start_chat("Pix", block(good_proposal()))
        env.wait_idle()
        self.assertEqual([m["role"] for m in env.get("/chat/sessions/%s" % sid)[1]["messages"]], ["you", "agent"])

    def test_refusals_are_shown_with_their_code(self):
        env = self.make()
        cases = [("bad_row", good_proposal(taskType="nope")), ("bad_row", good_proposal(taskType="ultracode row")),
                 ("forbidden", good_proposal(summary="Merge the PR to main")), ("forbidden", good_proposal(summary="Deploy it")),
                 ("forbidden", good_proposal(estUsd=10.5)), ("forbidden", good_proposal(summary="Run a migration"))]
        for code, prop in cases:
            with self.subTest(code=code, summary=prop["summary"], usd=prop["estUsd"]):
                _, msgs = self.run_turn(env, "ok\n" + block(prop))
                p = msgs[-1]["proposal"]
                self.assertEqual((p["status"], p.get("refused")), ("refused", code))
        env.chat.ledger.append((time.time(), 39.0))
        env.chat.s["perTurnUsd"] = 0.01
        _, msgs = self.run_turn(env, "ok\n" + block(good_proposal(estUsd=2)))
        self.assertEqual((msgs[-1]["proposal"]["status"], msgs[-1]["proposal"].get("refused")), ("refused", "budget_reached"))

    def test_open_proposal_expires_and_a_text_message_declines_it(self):
        env = self.make(yesMinutes=30)
        sid, msgs = self.run_turn(env, "ok\n" + block(good_proposal()))
        pid = msgs[-1]["proposal"]["id"]
        env.chat.now = lambda: time.time() + 31 * 60
        self.assertEqual(env.get("/chat/sessions/%s" % sid)[1]["messages"][-1]["proposal"]["status"], "expired")
        env.chat.now = time.time
        env.set_behavior(reply="fine")
        env.post("/chat/sessions/%s/messages" % sid, {"text": "actually no, just explain"})
        env.wait_idle()
        self.assertEqual(env.get("/chat/sessions/%s" % sid)[1]["messages"][2]["proposal"]["status"], "declined")


class ActOff(ChatCase):
    """Run 1: a Yes never acts. `act` false returns act_off; so does `act` true, because the act turn is not built yet."""

    def prepare(self, **cfg):
        env = self.make(**cfg)
        env.set_behavior(reply="ok\n" + block(good_proposal()))
        sid = env.start_chat("Cron")
        env.wait_idle()
        pid = env.get("/chat/sessions/%s" % sid)[1]["messages"][-1]["proposal"]["id"]
        env.set_behavior(reply="should never be asked")
        return env, sid, pid

    def test_yes_with_act_false(self):
        env, sid, pid = self.prepare()
        self.assertFalse(env.get("/chat/health")[1]["act"])
        before = len(env.records())
        st, body, _ = env.post("/chat/sessions/%s/proposals/%s/yes" % (sid, pid), {})
        self.assertEqual((st, body["refused"]), (409, "act_off"))
        self.assertEqual(body["reason"], "Acting is switched off on this Mac. Cron can still answer.")
        self.assertEqual(len(env.records()), before)                      # nothing ran
        self.assertEqual(env.chat.turns, {})
        self.assertEqual(env.get("/chat/sessions/%s" % sid)[1]["session"]["worktree"], False)

    def test_yes_with_act_true_is_still_act_off_in_run_1(self):
        env, sid, pid = self.prepare(act=True)
        self.assertFalse(env.get("/chat/health")[1]["act"])
        before = len(env.records())
        self.assertEqual(env.post("/chat/sessions/%s/proposals/%s/yes" % (sid, pid), {})[1]["refused"], "act_off")
        self.assertEqual(len(env.records()), before)

    def test_unknown_proposal_and_no(self):
        env, sid, pid = self.prepare()
        self.assertEqual(env.post("/chat/sessions/%s/proposals/nope/yes" % sid, {})[0], 404)
        self.assertEqual(env.post("/chat/sessions/%s/proposals/%s/no" % (sid, pid), {})[0], 200)
        self.assertEqual(env.get("/chat/sessions/%s" % sid)[1]["messages"][-1]["proposal"]["status"], "declined")

    def test_act_flag_defaults_false(self):
        self.assertIs(B.DEFAULTS["act"], False)
        self.assertIs(B.ACT_BUILT, False)


class Events(ChatCase):
    def test_tool_and_target_only(self):
        env = self.make()
        secret_text = "THE-AGENTS-PRIVATE-REASONING"
        env.set_behavior(events=[
            {"name": "Read", "input": {"file_path": os.path.join(env.cwd, "src", "x.ts"), "note": secret_text}},
            {"name": "Read", "input": {"file_path": os.path.join(env.cwd, ".env")}},
            {"name": "Read", "input": {"file_path": os.path.join(env.conductor, "docs", "a.md")}},
            {"name": "Read", "input": {"file_path": "/etc/passwd"}},
            {"name": "Grep", "input": {"pattern": secret_text, "path": os.path.join(env.cwd, "src")}},
            {"name": "Read", "input": {"file_path": os.path.join(env.home, "view.key")}},
            {"name": "Read", "input": {"file_path": os.path.join(env.cwd, "playground", "a.txt")}},
            {"name": "Bash", "input": {"command": "git status --short; rm -rf /"}},
            {"name": "mcp__linear__get_issue", "input": {"id": "MIN-4497"}},
            {"name": "TodoWrite", "input": {"todos": [secret_text]}},
        ])
        sid = env.start_chat()
        env.wait_idle()
        st, body, _ = env.get("/chat/sessions/%s/events?after=0" % sid)
        self.assertEqual(st, 200)
        self.assertEqual(body["state"], "waiting")
        ev = body["events"]
        self.assertEqual([(e["tool"], e["target"]) for e in ev], [
            ("Read", "src/x.ts"), ("Read", None), ("Read", "conductor/docs/a.md"), ("Read", None), ("Grep", "src"),
            ("Read", None), ("Read", None), ("Bash", "git"), ("get_issue", None), ("TodoWrite", None)])
        for e in ev:
            self.assertEqual(sorted(e), ["at", "n", "target", "tool"])
        self.assertEqual([e["n"] for e in ev], list(range(1, 11)))
        self.assertNotIn(secret_text, json.dumps(ev))
        self.assertNotIn(secret_text, json.dumps(env.get("/chat/sessions/%s" % sid)[1]))     # not in the transcript either
        self.assertEqual(len(env.get("/chat/sessions/%s/events?after=4" % sid)[1]["events"]), 6)
        self.assertEqual(env.get("/chat/sessions/%s/events?after=10" % sid)[1]["events"], [])
        self.assertEqual(env.get("/chat/sessions/%s/events?after=x" % sid)[0], 400)
        for path in files_under(os.path.join(env.home, "chat")):                               # the raw stream is never on disk
            self.assertNotIn(secret_text, read(path))

    def test_last_200_cleared_on_the_next_turn_and_n_keeps_counting(self):
        env = self.make()
        env.set_behavior(events=[{"name": "Read", "input": {"file_path": os.path.join(env.cwd, "src", "x.ts")}}] * 250)
        sid = env.start_chat()
        env.wait_idle()
        ev = env.get("/chat/sessions/%s/events?after=0" % sid)[1]["events"]
        self.assertEqual((len(ev), ev[0]["n"], ev[-1]["n"]), (200, 51, 250))
        env.set_behavior(events=[{"name": "Grep", "input": {"path": env.cwd}}])
        env.post("/chat/sessions/%s/messages" % sid, {"text": "again"})
        env.wait_idle()
        ev = env.get("/chat/sessions/%s/events?after=0" % sid)[1]["events"]
        self.assertEqual([(e["n"], e["tool"]) for e in ev], [(251, "Grep")])

    def test_unknown_session_events(self):
        env = self.make()
        self.assertEqual(env.get("/chat/sessions/%s/events" % ("0" * 32))[0], 404)

    def test_events_need_the_same_auth(self):
        env = self.make()
        sid = env.start_chat()
        env.wait_idle()
        self.assertEqual(env.get("/chat/sessions/%s/events" % sid, key=False)[0], 403)
        self.assertEqual(env.get("/chat/sessions/%s/events" % sid, headers={"Origin": "http://evil.example"})[0], 403)


def files_under(top):
    return [os.path.join(r, f) for r, _, fs in os.walk(top) for f in fs]


def read(path):
    with open(path) as f:
        return f.read()


def alive(pid):
    try:
        os.kill(pid, 0)
        return True
    except ProcessLookupError:
        return False


class KillSwitches(ChatCase):
    def test_stop_kills_the_whole_process_group(self):
        env = self.make()
        env.set_behavior(sleep=60, child=True)
        sid = env.start_chat()
        self.assertTrue(wait_for(lambda: os.path.exists(os.path.join(env.dir, "child.pid")) and env.records()))
        stub_pid, child_pid = env.record(0)["pid"], int(open(os.path.join(env.dir, "child.pid")).read())
        self.assertTrue(alive(stub_pid) and alive(child_pid))
        st, body, _ = env.post("/chat/sessions/%s/stop" % sid, {})
        self.assertEqual(st, 200)
        env.wait_idle(8)
        # inside the 3 s grace: the group got SIGTERM. A kill of the stub alone would leave the child for the later SIGKILL.
        self.assertTrue(wait_for(lambda: not alive(child_pid), 2.0), "the child of the turn survived the stop")
        self.assertTrue(wait_for(lambda: not alive(stub_pid), 2.0))
        last = env.get("/chat/sessions/%s" % sid)[1]["messages"][-1]
        self.assertEqual((last["role"], last["text"]), ("error", "Stopped by you."))

    def test_a_turn_that_ignores_sigterm_is_killed_after_the_grace_period(self):
        env = self.make()
        env.set_behavior(sleep=60, child=True, ignore_term=True)
        sid = env.start_chat()
        self.assertTrue(wait_for(lambda: os.path.exists(os.path.join(env.dir, "child.pid")) and env.records()))
        stub_pid, child_pid = env.record(0)["pid"], int(read(os.path.join(env.dir, "child.pid")))
        env.post("/chat/sessions/%s/stop" % sid, {})
        time.sleep(1.0)
        self.assertTrue(alive(stub_pid) and alive(child_pid), "SIGTERM alone should not have ended these")
        self.assertTrue(wait_for(lambda: not alive(stub_pid) and not alive(child_pid), 8), "SIGKILL after the grace period did not happen")
        env.wait_idle(8)

    def test_stop_needs_auth_and_unknown_session_404(self):
        env = self.make()
        self.assertEqual(env.post("/chat/sessions/%s/stop" % ("0" * 32), {}, key=False)[0], 403)
        self.assertEqual(env.post("/chat/sessions/%s/stop" % ("0" * 32), {})[0], 404)

    def test_shutdown_ends_every_turn_it_started(self):
        env = self.make()
        env.set_behavior(sleep=60, child=True)
        env.start_chat("Pix")
        env.start_chat("Cron")
        self.assertTrue(wait_for(lambda: len(env.records()) == 2))
        pids = [json.load(open(os.path.join(env.dir, f)))["pid"] for f in env.records()]
        env.chat.shutdown()
        for pid in pids:
            self.assertTrue(wait_for(lambda: not alive(pid), 8), "a turn outlived shutdown")
        self.assertEqual(env.chat.turns, {})
        st, body, _ = env.post("/chat/sessions", {"agent": "Ren", "text": "after shutdown"})     # no new turn after the switch
        self.assertEqual((st, body["refused"]), (503, "chat_off"))

    def test_timeout_kills_and_marks_an_error(self):
        env = self.make(answerMinutes=0.1)            # 6 s
        env.set_behavior(sleep=60)
        sid = env.start_chat()
        self.assertTrue(wait_for(lambda: env.records()))
        pid = env.record(0)["pid"]
        env.wait_idle(10)
        self.assertTrue(wait_for(lambda: not alive(pid), 8))
        last = env.get("/chat/sessions/%s" % sid)[1]["messages"][-1]
        self.assertEqual(last["role"], "error")
        self.assertIn("was stopped", last["text"])

    def test_sigterm_ends_the_real_server_process(self):
        tmp = os.path.realpath(__import__("tempfile").mkdtemp())
        self.addCleanup(lambda: os.system("rm -rf %s" % tmp))
        home, pages = os.path.join(tmp, "home"), os.path.join(tmp, "pages")
        os.makedirs(home)
        os.makedirs(pages)
        open(os.path.join(pages, "index.html"), "w").write("page")
        open(os.path.join(home, "chat.key"), "w").write(KEY)
        s = socket.socket()
        s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]
        s.close()
        p = subprocess.Popen([sys.executable, os.path.join(HERE, "chat_bridge.py"), "--home", home, "--page-dir", pages, "--port", str(port)],
                             stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env={"PATH": "/usr/bin:/bin", "HOME": tmp})
        self.assertTrue(wait_for(lambda: self._up(port), 8))
        import http.client
        c = http.client.HTTPConnection("127.0.0.1", port)
        c.request("GET", "/chat/health", headers={"x-chat-key": KEY})
        self.assertEqual(c.getresponse().status, 200)
        p.send_signal(signal.SIGTERM)
        out, err = p.communicate(timeout=10)
        self.assertEqual(p.returncode, 0)
        self.assertIn("127.0.0.1:%d" % port, out)
        self.assertNotIn(KEY, out + err)                         # the key is never printed
        for root, _, files in os.walk(home):
            for f in files:
                if f != "chat.key":
                    self.assertNotIn(KEY, open(os.path.join(root, f)).read())

    @staticmethod
    def _up(port):
        try:
            socket.create_connection(("127.0.0.1", port), 0.2).close()
            return True
        except OSError:
            return False

    def test_lsof_shows_loopback_only(self):
        env = self.make()
        if not shutil_which("lsof"):
            self.skipTest("no lsof")
        out = subprocess.run(["lsof", "-a", "-p", str(os.getpid()), "-iTCP", "-sTCP:LISTEN", "-n", "-P"], capture_output=True, text=True).stdout
        mine = [l for l in out.splitlines() if ":%d" % env.port in l]
        self.assertTrue(mine)
        for l in mine:
            self.assertIn("127.0.0.1:%d" % env.port, l)
            self.assertNotIn("*:%d" % env.port, l)


def shutil_which(x):
    import shutil
    return shutil.which(x)


class Logs(ChatCase):
    def test_chat_log_has_no_text_no_key_and_one_line_per_turn(self):
        env = self.make()
        env.set_behavior(reply="THE-REPLY-TEXT", cost=0.21)
        sid = env.start_chat("Pix", "THE-QUESTION-TEXT")
        env.wait_idle()
        env.post("/chat/sessions/%s/messages" % sid, {"text": "ANOTHER-QUESTION"})
        env.wait_idle()
        log = open(os.path.join(env.home, "chat.log")).read()
        self.assertEqual(len(log.strip().splitlines()), 2)
        for needle in ("THE-REPLY-TEXT", "THE-QUESTION-TEXT", "ANOTHER-QUESTION", KEY):
            self.assertNotIn(needle, log)
        self.assertRegex(log.splitlines()[0], r"^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ turn kind=answer agent=Pix sid=[0-9a-f]{8} result=ok seconds=\d+ cost=0\.2100$")
        self.assertEqual(os.stat(os.path.join(env.home, "chat.log")).st_mode & 0o777, 0o600)

    def test_the_key_is_in_no_response_and_no_file(self):
        env = self.make()
        sid = env.start_chat()
        env.wait_idle()
        for path in ("/chat/health", "/chat/sessions?agent=Pix", "/chat/sessions/%s" % sid, "/chat/sessions/%s/events" % sid):
            st, body, hdrs = env.get(path)
            self.assertNotIn(KEY, json.dumps(body) + json.dumps(hdrs))
        for path in files_under(os.path.join(env.home, "chat")):
            self.assertNotIn(KEY, read(path))


@unittest.skipUnless(os.path.exists(os.path.expanduser("~/AppDevelopment/conductor/bin/require-agent-model")), "needs the conductor checkout")
class RealRoutingTable(unittest.TestCase):
    """The row check reads conductor's own table and runs conductor's own hook; there is no second copy to drift."""

    def test_rows(self):
        check = B.make_row_checker("~/AppDevelopment/conductor")
        model, effort = check("backend-minhos", "API and edge functions")
        self.assertEqual((model, effort), ("sonnet", "high"))
        with self.assertRaises(B.RowError):
            check("backend-minhos", "Not a row of the table")
        with self.assertRaises(B.RowError):
            check("nobody-minhos", "API and edge functions")
        with self.assertRaises(B.RowError):
            check("backend-minhos", "RLS, auth, secrets, security")          # an ultracode row is refused
        with self.assertRaises(B.RowError):
            B.make_row_checker("/nonexistent/conductor")("backend-minhos", "API and edge functions")


if __name__ == "__main__":
    unittest.main()
