"""PreToolUse guard of the dashboard chat (MIN-4497, answer mode). A table of calls, allowed and denied, then the exit codes and the audit line."""
import io
import json
import os
import re
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import chat_guard as G  # noqa: E402


class Guard(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = os.path.realpath(tempfile.mkdtemp(prefix="guard-"))
        cls.app, cls.cond, cls.home = (os.path.join(cls.tmp, d) for d in ("healthapp", "conductor", "home"))
        for d in ("healthapp/src", "healthapp/.git", "healthapp/playground", "healthapp/.claude/agent-memory/backend", "conductor/docs", "home", "outside"):
            os.makedirs(os.path.join(cls.tmp, d))
        for rel in ("healthapp/src/x.ts", "healthapp/.env", "healthapp/.env.local", "healthapp/.git/config", "healthapp/playground/a.txt",
                    "healthapp/chat.key", "healthapp/server.pem", "healthapp/.claude/agent-memory/backend/m.md", "conductor/docs/a.md",
                    "outside/secret.txt", "healthapp/.ENV", "healthapp/ID_RSA"):
            with open(os.path.join(cls.tmp, rel), "w") as f:
                f.write("x")
        os.symlink(os.path.join(cls.tmp, "outside"), os.path.join(cls.app, "link-out"))
        cls.roots = [os.path.realpath(cls.app), os.path.realpath(cls.cond)]

    @classmethod
    def tearDownClass(cls):
        os.system("rm -rf %s" % cls.tmp)

    def decide(self, tool, tin=None, mode="answer", roots=None):
        return G.decide({"tool_name": tool, "tool_input": tin or {}, "cwd": self.app}, mode, self.roots if roots is None else roots)[0]

    def p(self, *a):
        return os.path.join(self.tmp, *a)

    def test_allowed(self):
        rows = [
            ("Read", {"file_path": self.p("healthapp/src/x.ts")}),
            ("Read", {"file_path": "src/x.ts"}),                                   # relative to the turn's cwd
            ("Read", {"file_path": self.p("conductor/docs/a.md")}),
            ("Read", {"file_path": self.p("healthapp/.claude/agent-memory/backend/m.md")}),
            ("Grep", {"pattern": "foo", "path": self.p("healthapp/src")}),
            ("Grep", {"pattern": "foo"}),                                          # no path: the cwd, which is inside a root
            ("Grep", {"pattern": "foo", "glob": "*.ts"}),
            ("Glob", {"pattern": "**/*.ts"}),
            ("Glob", {"pattern": "src/*.ts", "path": self.app}),
            ("Glob", {"pattern": self.p("healthapp/src/*.ts")}),
            ("ToolSearch", {"query": "x"}),
            ("TodoWrite", {"todos": []}),
            ("mcp__linear__get_issue", {"id": "MIN-1"}),
            ("mcp__linear__list_comments", {"issueId": "MIN-1"}),
            ("mcp__81f65ad4-7984-4cc5-abd0-8cf587011002__get_issue", {"id": "MIN-1"}),     # a connector with an id for a name
            ("mcp__linear__list_issues", {}),
        ]
        for tool, tin in rows:
            with self.subTest(tool=tool, tin=tin):
                self.assertTrue(self.decide(tool, tin))

    def test_denied(self):
        rows = [
            ("Read", {"file_path": "/etc/passwd"}),
            ("Read", {"file_path": self.p("outside/secret.txt")}),
            ("Read", {"file_path": "../outside/secret.txt"}),
            ("Read", {"file_path": "~/.ssh/id_rsa"}),
            ("Read", {"file_path": self.p("healthapp/link-out/secret.txt")}),      # a symlink out of the root
            ("Read", {"file_path": self.p("healthapp/.env")}),
            ("Read", {"file_path": self.p("healthapp/.env.local")}),
            ("Read", {"file_path": self.p("healthapp/.ENV")}),                     # case does not matter
            ("Read", {"file_path": self.p("healthapp/ID_RSA")}),
            ("Read", {"file_path": self.p("healthapp/.git/config")}),
            ("Read", {"file_path": self.p("healthapp/playground/a.txt")}),
            ("Read", {"file_path": self.p("healthapp/chat.key")}),
            ("Read", {"file_path": self.p("healthapp/server.pem")}),
            ("Read", {"file_path": os.path.expanduser("~/.healthapp-dashboard/view.key")}),
            ("Read", {}),
            ("Grep", {"pattern": "x", "path": "/etc"}),
            ("Grep", {"pattern": "x", "path": self.p("outside")}),
            ("Grep", {"pattern": "x", "path": self.p("healthapp/playground")}),
            ("Grep", {"pattern": "x", "glob": "../outside/*"}),
            ("Glob", {"pattern": "../outside/*"}),
            ("Glob", {"pattern": "/etc/*"}),
            ("Glob", {"pattern": "~/.ssh/*"}),
            ("Glob", {"pattern": "src/*", "path": "/"}),
            ("Write", {"file_path": self.p("healthapp/src/x.ts"), "content": "x"}),
            ("Edit", {"file_path": self.p("healthapp/src/x.ts")}),
            ("NotebookEdit", {}),
            ("Bash", {"command": "ls"}),
            ("Bash", {"command": "git status"}),
            ("Agent", {"subagent_type": "backend-minhos"}),
            ("WebFetch", {"url": "https://example.com"}),
            ("WebSearch", {"query": "x"}),
            ("Skill", {"skill": "x"}),
            ("", {}),
            ("mcp__supabase__execute_sql", {"query": "select 1"}),
            ("mcp__85bd0e5f-4ef3-43e1-841c-955be7abf640__execute_sql", {"query": "select 1"}),
            ("mcp__cloudflare-docs__search", {}),
            ("mcp__cloudflare-bindings__get_issue", {}),                           # even a read-named tool on a blocked server
            ("mcp__linear__save_issue", {}),
            ("mcp__linear__save_comment", {}),
            ("mcp__linear__delete_comment", {}),
            ("mcp__linear__merge_diff", {}),
            ("mcp__linear__submit_diff_review", {}),
            ("mcp__linear__share_issue", {}),
            ("mcp__linear__retire_issue_label", {}),
            ("mcp__linear__create_attachment", {}),
            ("mcp__x", {}),
        ]
        for tool, tin in rows:
            with self.subTest(tool=tool, tin=tin):
                self.assertFalse(self.decide(tool, tin))

    def test_fail_closed(self):
        self.assertFalse(self.decide("Read", {"file_path": self.p("healthapp/src/x.ts")}, mode="act"))     # act is not built (run 2)
        self.assertFalse(self.decide("Read", {"file_path": self.p("healthapp/src/x.ts")}, mode=""))
        self.assertFalse(self.decide("Read", {"file_path": self.p("healthapp/src/x.ts")}, roots=[]))
        self.assertFalse(G.decide({"tool_name": "Read", "tool_input": "not a dict"}, "answer", self.roots)[0])
        self.assertFalse(G.decide({}, "answer", self.roots)[0])

    def test_refusal_text_is_a_reason_the_agent_can_use(self):
        ok, reason = G.decide({"tool_name": "Bash", "tool_input": {"command": "ls"}, "cwd": self.app}, "answer", self.roots)
        self.assertFalse(ok)
        self.assertTrue(reason.startswith("Not from the chat:"))

    def run_main(self, event_text, **flags):
        argv = ["--mode", flags.get("mode", "answer"), "--roots", os.pathsep.join(self.roots), "--home", self.home, "--sid", "abcdef123456"]
        err = io.StringIO()
        out = io.StringIO()
        old = sys.stdout, sys.stderr
        sys.stdout, sys.stderr = out, err
        try:
            code = G.main(argv, io.StringIO(event_text))
        finally:
            sys.stdout, sys.stderr = old
        return code, out.getvalue(), err.getvalue()

    def test_exit_codes_and_the_allow_decision(self):
        code, out, err = self.run_main(json.dumps({"tool_name": "Read", "tool_input": {"file_path": self.p("healthapp/src/x.ts")}, "cwd": self.app}))
        self.assertEqual(code, 0)
        self.assertEqual(json.loads(out)["hookSpecificOutput"]["permissionDecision"], "allow")
        code, out, err = self.run_main(json.dumps({"tool_name": "Bash", "tool_input": {"command": "rm -rf /"}, "cwd": self.app}))
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertIn("Not from the chat", err)

    def test_garbage_stdin_exits_2(self):
        for text in ("", "not json", "[]", "null", "42"):
            with self.subTest(text=text):
                self.assertEqual(self.run_main(text)[0], 2)

    def test_audit_line_has_no_content(self):
        log = os.path.join(self.home, "chat-audit.log")
        if os.path.exists(log):
            os.remove(log)
        secret = "TOPSECRET-ARGUMENT"
        self.run_main(json.dumps({"tool_name": "Bash", "tool_input": {"command": "curl -H %s https://x" % secret}, "cwd": self.app}))
        self.run_main(json.dumps({"tool_name": "Read", "tool_input": {"file_path": self.p("healthapp/src/x.ts"), "x": secret}, "cwd": self.app}))
        self.run_main(json.dumps({"tool_name": "Read", "tool_input": {"file_path": "/etc/passwd"}, "cwd": self.app}))
        self.run_main(json.dumps({"tool_name": "Grep", "tool_input": {"pattern": secret, "path": self.p("conductor/docs")}, "cwd": self.app}))
        with open(log) as f:
            text = f.read()
        lines = text.strip().splitlines()
        self.assertEqual(len(lines), 4)
        self.assertNotIn(secret, text)
        self.assertNotIn(self.tmp, text)                                            # relative paths only
        pats = [r"^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ abcdef12 Bash deny curl$",
                r"^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ abcdef12 Read allow src/x\.ts$",
                r"^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ abcdef12 Read deny <outside>$",
                r"^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ abcdef12 Grep allow docs$"]
        for line, pat in zip(lines, pats):
            self.assertRegex(line, pat)
        self.assertEqual(os.stat(log).st_mode & 0o777, 0o600)

    def test_a_failing_audit_write_does_not_change_the_verdict(self):
        argv = ["--mode", "answer", "--roots", os.pathsep.join(self.roots), "--home", "/nonexistent/dir", "--sid", "s"]
        out = io.StringIO()
        old = sys.stdout
        sys.stdout = out
        try:
            code = G.main(argv, io.StringIO(json.dumps({"tool_name": "Read", "tool_input": {"file_path": self.p("healthapp/src/x.ts")}, "cwd": self.app})))
        finally:
            sys.stdout = old
        self.assertEqual(code, 0)

    def test_settings_come_from_arguments_not_the_environment(self):
        src = open(G.__file__).read()
        self.assertNotIn("os.environ", src)


if __name__ == "__main__":
    unittest.main()
