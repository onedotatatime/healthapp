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

    def test_grep_glob_is_one_extension_pattern_only(self):
        """CTO finding (2cc7efc9 rule 4): a Grep `glob` overrides ripgrep's ignore rules, so only `*.ext` or `**/*.ext` from the list passes."""
        denied = [".env*", "*.local", "*", "**/*", ".e*", "*.key", "{.env.local,a.md}", "*.pem", "**/.env*", "*.md *.env", "*.md,*.env",
                  "*.mdx", "*.Md", "*.md\n", "src/*.md", "/etc/*.md", "~/x/*.md", "../*.md", "**/**/*.md", "*.m?", "*.{md,env}", "", "!*.md",
                  "*.ts/.env", ".*", "**/.*", "*.env.local", "*.jsonl"]
        for gl in denied:
            with self.subTest(glob=gl):
                self.assertFalse(self.decide("Grep", {"pattern": "x", "glob": gl}))
        for gl in ("*.md", "**/*.py", "*.ts", "**/*.tsx", "*.js", "*.mjs", "*.css", "*.html", "*.sh", "*.sql", "*.yml", "**/*.yaml", "*.toml",
                   "*.txt", "*.json"):
            with self.subTest(glob=gl):
                self.assertTrue(self.decide("Grep", {"pattern": "x", "glob": gl}))
        self.assertFalse(self.decide("Grep", {"pattern": "x", "glob": 5}))
        self.assertFalse(self.decide("Grep", {"pattern": "x", "glob": ["*.md"]}))
        self.assertTrue(self.decide("Grep", {"pattern": "x", "glob": None}))             # no glob: ripgrep keeps its own ignore rules
        self.assertFalse(self.decide("Grep", {"pattern": "x", "glob": "*.md", "path": self.p("healthapp/.env")}))   # a path that is a file
        self.assertFalse(self.decide("Grep", {"pattern": "x", "path": self.p("healthapp/server.pem")}))

    def test_glob_denies_a_pattern_with_a_dot_segment(self):
        denied = [".env*", "**/.env*", "src/.env", ".git/*", "**/.git/**", "{.env.local,a.md}", "[.]env", "a/{b,.env}", "src/.hidden/*", ".*"]
        for pat in denied:
            with self.subTest(pattern=pat):
                self.assertFalse(self.decide("Glob", {"pattern": pat}))
        for pat in ("**/*.ts", "src/*.ts", "*.md", "./src/*.ts", "docs/**/*.md", "{a,b}/*.ts"):
            with self.subTest(pattern=pat):
                self.assertTrue(self.decide("Glob", {"pattern": pat}))

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


def find_rg():
    """A real ripgrep: `rg` on PATH, else the one built into the claude binary (it answers as rg when ARGV0=rg). None skips the canary test."""
    import shutil
    import subprocess
    found = shutil.which("rg")
    for cand, env in ((found, None), (os.path.expanduser("~/.local/bin/claude"), {"ARGV0": "rg"})):
        if not cand or not os.access(cand, os.X_OK):
            continue
        try:
            r = subprocess.run([cand, "--version"], capture_output=True, text=True, timeout=10, env=dict(os.environ, **(env or {})))
        except (OSError, subprocess.SubprocessError):
            continue
        if r.returncode == 0 and r.stdout.lower().startswith("ripgrep"):
            return cand, env or {}
    return None


@unittest.skipUnless(find_rg(), "no real ripgrep found (rg on PATH, or ARGV0=rg ~/.local/bin/claude)")
class GrepCanary(unittest.TestCase):
    """The CTO's canary (2cc7efc9 rule 4): a gitignored .env-style file under a readable root must not be found through any Grep the guard allows.
    The control proves the premise: the same file IS found by `-g '.env*'`, the call the guard now refuses."""

    def setUp(self):
        self.tmp = os.path.realpath(tempfile.mkdtemp(prefix="canary-"))
        self.addCleanup(os.system, "rm -rf %s" % self.tmp)
        os.makedirs(os.path.join(self.tmp, "conductor", "." + "git"))       # an empty repo marker is enough for ripgrep's ignore rules
        os.makedirs(os.path.join(self.tmp, "healthapp"))
        self.root = os.path.join(self.tmp, "conductor")
        for name, text in (("." + "gitignore", ".env*\n"), (".env.local", "CANARY-VALUE\n"), (".env", "CANARY-VALUE\n"), ("notes.md", "hello\n"),
                           ("tool.py", "print(1)\n")):
            with open(os.path.join(self.root, name), "w") as f:
                f.write(text)
        self.roots = [os.path.join(self.tmp, "healthapp"), self.root]
        self.rg, self.env = find_rg()

    def rg_files(self, glob):
        import subprocess
        argv = [self.rg, "-l"] + (["-g", glob] if glob else []) + ["CANARY-VALUE", self.root]
        r = subprocess.run(argv, capture_output=True, text=True, timeout=20, env=dict(os.environ, **self.env))
        return sorted(os.path.basename(p) for p in r.stdout.split())

    def test_the_premise_a_glob_overrides_the_ignore_rules(self):
        self.assertEqual(self.rg_files(None), [])                              # no glob: the ignored files are skipped
        self.assertIn(".env.local", self.rg_files(".env*"))                    # the leak the finding describes
        self.assertIn(".env.local", self.rg_files("*"))

    def test_no_glob_the_guard_allows_finds_the_canary(self):
        for gl in (None, "*.md", "**/*.py", "*.ts", "*.tsx", "*.js", "*.mjs", "*.css", "*.html", "*.sh", "*.sql", "*.yml", "*.yaml", "*.toml",
                   "*.txt", "*.json"):
            with self.subTest(glob=gl):
                allowed, _ = G.decide({"tool_name": "Grep", "tool_input": dict({"pattern": "CANARY-VALUE", "path": self.root}, **({"glob": gl} if gl else {})),
                                       "cwd": self.root}, "answer", self.roots)
                self.assertTrue(allowed)
                self.assertEqual([f for f in self.rg_files(gl) if f.startswith(".env")], [])

    def test_the_calls_that_would_find_it_are_refused(self):
        for gl in (".env*", "*", "*.local", ".e*", "**/*", "{.env.local,a.md}"):
            with self.subTest(glob=gl):
                self.assertFalse(G.decide({"tool_name": "Grep", "tool_input": {"pattern": "CANARY-VALUE", "path": self.root, "glob": gl}, "cwd": self.root},
                                          "answer", self.roots)[0])
        self.assertFalse(G.decide({"tool_name": "Read", "tool_input": {"file_path": os.path.join(self.root, ".env.local")}, "cwd": self.root},
                                  "answer", self.roots)[0])


if __name__ == "__main__":
    unittest.main()
