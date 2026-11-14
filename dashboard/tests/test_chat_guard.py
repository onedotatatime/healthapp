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


class ActGuard(unittest.TestCase):
    """Act mode (MIN-4497 run 2). Every row of the CTO's never-list is here, and every allowed command is one the agent needs."""
    BRANCH = "feat/chat-cron-ab12cd34"

    @classmethod
    def setUpClass(cls):
        cls.tmp = os.path.realpath(tempfile.mkdtemp(prefix="actguard-"))
        j = lambda *p: os.path.join(cls.tmp, *p)
        cls.app, cls.cond, cls.wt, cls.mem, cls.other_mem = (j("healthapp"), j("conductor"), j("healthapp", ".claude", "worktrees", "chat-ab12cd34"),
                                                              j("healthapp", ".claude", "agent-memory", "backend-minhos"),
                                                              j("healthapp", ".claude", "agent-memory", "design-minhos"))
        for d in (cls.wt + "/src", cls.mem, cls.other_mem, cls.cond + "/scripts/measure", j("outside"), j("healthapp", "src")):
            os.makedirs(d)
        for rel in ("healthapp/src/x.ts", "outside/s.txt", "conductor/scripts/measure/extract-runs.py"):
            with open(j(*rel.split("/")), "w") as f:
                f.write("x")
        with open(os.path.join(cls.wt, "src", "a.ts"), "w") as f:
            f.write("x")
        os.symlink(j("outside"), os.path.join(cls.wt, "link-out"))
        cls.roots = [os.path.realpath(cls.app), os.path.realpath(cls.cond)]
        cls.ctx = {"kind": "change", "worktree": cls.wt, "memory": cls.mem, "branch": cls.BRANCH, "role": "BACKEND", "conductor": os.path.realpath(cls.cond)}

    @classmethod
    def tearDownClass(cls):
        os.system("rm -rf %s" % cls.tmp)

    def ok(self, tool, tin=None, ctx=None):
        return G.decide({"tool_name": tool, "tool_input": tin or {}, "cwd": self.wt}, "act", self.roots, self.ctx if ctx is None else ctx)[0]

    def bash(self, cmd, ctx=None):
        return self.ok("Bash", {"command": cmd}, ctx)

    def test_allowed_commands(self):
        extract = "python3 %s --actuals" % os.path.join(self.cond, "scripts", "measure", "extract-runs.py")
        for cmd in ["git status", "git diff", "git diff --stat", "git log --oneline -5", "git show HEAD", "git add .", "git add -A", "git add src/a.ts",
                    "git add -- src/a.ts", 'git commit -m "fix(dashboard): a thing (MIN-4497)"', 'git commit -am "msg"', "git commit --amend --no-edit",
                    "git commit --message=msg", "git restore src/a.ts", "git restore --staged src/a.ts", "git rm src/a.ts", "git mv src/a.ts src/b.ts",
                    "git fetch", "git fetch origin", "git fetch origin staging", "git push origin " + self.BRANCH, "git push -u origin " + self.BRANCH,
                    "git push --set-upstream origin " + self.BRANCH, "git push origin HEAD", "npm ci", "npm ci --ignore-scripts", "npm test", "npm test -- --run",
                    "npm run build", "npm run test:unit -- --run", "python3 -m unittest discover -s dashboard/tests", "python3 -m pytest -q",
                    "~/.claude/bin/linear-as BACKEND 'query { viewer { id } }'", extract, "git status # a comment", "git  status", 'git "status"']:
            with self.subTest(cmd=cmd):
                self.assertTrue(self.bash(cmd))

    def test_denied_environment_reads_and_expansion(self):
        for cmd in ["env", "env | grep KEY", "printenv", "printenv HOME", "set", "export FOO=1", "declare -p", "echo $HOME", "echo ${HOME}", "git status $HOME",
                    'git commit -m "$(cat x)"', "git commit -m `id`", "git commit -m '$x'", "cat <(echo x)", "diff <(a) <(b)", "tee >(cat)", "FOO=1 git status",
                    "typeset -x", "unset FOO", "compgen -v"]:
            with self.subTest(cmd=cmd):
                self.assertFalse(self.bash(cmd))

    def test_denied_compound_commands(self):
        for cmd in ["git status; rm -rf /", "git status && ls", "git status || ls", "git status | cat", "git status > out", "git status >> out", "git status < in",
                    "git status &", "git status\nls", "git status\r\nls", "(git status)", "git status ;", "git status 2>&1", "git status <<< x", "{ git status; }",
                    "git status ';'", 'git status ";"', "cd .. && git status", "git status\\\nls"]:
            with self.subTest(cmd=cmd):
                self.assertFalse(self.bash(cmd))

    def test_denied_directory_and_network_tools(self):
        for cmd in ["cd ..", "cd /", "git -C /x status", "git -C . status", "git -c core.hooksPath=/x status", "git --git-dir=/x status", "curl https://example.com",
                    "wget https://example.com", "ssh host", "scp a b", "nc host 1", "gh pr merge 1", "gh pr create", "gh api x", "open x", "sudo ls", "bash -c x", "sh x",
                    "node x.js", "python3 -c 'print(1)'", "python3 x.py", "python3 -m http.server", "sed -i x f", "cat file", "ls", "echo hi", "xargs ls", "find .",
                    "kill 1", "launchctl list", "osascript -e x", "chmod +x f", "supabase db push", "wrangler deploy", "psql x", "docker ps", "pip install x"]:
            with self.subTest(cmd=cmd):
                self.assertFalse(self.bash(cmd))

    def test_denied_pushes(self):
        for cmd in ["git push", "git push origin main", "git push origin staging", "git push origin master", "git push origin HEAD:main", "git push origin HEAD:" + self.BRANCH,
                    "git push --force origin " + self.BRANCH, "git push -f origin " + self.BRANCH, "git push origin +" + self.BRANCH, "git push --force-with-lease origin " + self.BRANCH,
                    "git push --delete origin " + self.BRANCH, "git push origin --delete " + self.BRANCH, "git push origin " + self.BRANCH + " main", "git push origin --all",
                    "git push origin --tags", "git push upstream " + self.BRANCH, "git push origin feat/chat-pix-00000000", "git push --mirror", "git push origin :" + self.BRANCH,
                    "git push --no-verify origin " + self.BRANCH, "git push -o x origin " + self.BRANCH, "git push origin " + self.BRANCH + " --force"]:
            with self.subTest(cmd=cmd):
                self.assertFalse(self.bash(cmd))
        self.assertFalse(self.bash("git push origin " + self.BRANCH, ctx=dict(self.ctx, branch="")))          # no stored branch: no push at all

    def test_denied_git_and_shell_commands_on_the_never_list(self):
        for cmd in ["git commit --no-verify -m x", "git commit -n -m x", "git commit", 'git commit -m ""', "git commit -F msg.txt", "git commit --template=x -m y",
                    "git commit -m x --author=x", "git branch", "git branch -D x", "git branch -d x", "git worktree remove x", "git worktree add x", "git reset --hard", "git reset",
                    "git clean -fd", "git checkout main", "git switch main", "git merge x", "git rebase x", "git stash", "git config x y", "git remote add x y", "git tag x",
                    "git pull", "git clone x", "git cherry-pick x", "git gc", "git filter-branch", "git submodule update", "git rm -r src", "git rm -f src/a.ts",
                    "git add -f src/a.ts", "git add --force src/a.ts", "git add -p", "git add -i", "git add -e", "git add --patch", "git restore --source=main src/a.ts",
                    "git diff --output=/tmp/x", "git diff --no-index a b", "git fetch --all", "git fetch -p", "git fetch origin staging:staging", "git fetch upstream",
                    "git fetch origin +staging", "git fetch --prune", "git fetch origin --force", "git",
                    "rm x", "rm -r x", "rm -rf /", "rmdir x", "mv a b", "cp a b", "git mv a ../b"]:
            with self.subTest(cmd=cmd):
                self.assertFalse(self.bash(cmd))

    def test_denied_secret_and_outside_paths_in_commands(self):
        for cmd in ["git add .env", "git add .env.local", "git add src/.env", "git add chat.key", "git add server.pem", "git add ../x", "git add /etc/passwd",
                    "git add link-out/s.txt", "git restore .env", "git rm .env", "git mv a ../b", "git show HEAD:.env", "git diff -- .env.local", "git log -p -- chat.key",
                    "git show HEAD:playground/x", "git add playground/x", "git diff ~/.healthapp-dashboard/chat.key", "npm test -- .env", "npm run test -- --file chat.key",
                    "python3 -m pytest .env", "git status healthapp-dashboard"]:
            with self.subTest(cmd=cmd):
                self.assertFalse(self.bash(cmd))

    def test_denied_package_and_deploy_commands(self):
        for cmd in ["npm install lodash", "npm install", "npm i x", "npm add x", "npm update", "npm exec x", "npx x", "npm publish", "npm run deploy", "npm run migrate",
                    "npm run db:reset", "npm run release", "npm run build -- --deploy", "npm run", "npm run -- x", "npm run ../x", "npm run 'a b'", "npm ci lodash", "npm test -- --migrate",
                    "npm", "npm exec -- supabase", "npm run supabase:push", "npm run push", "npm run publish", "npm run prod", "npm run ship"]:
            with self.subTest(cmd=cmd):
                self.assertFalse(self.bash(cmd))

    def test_linear_as_only_for_the_agents_own_role_and_extract_runs_only_from_conductor(self):
        for cmd in ["~/.claude/bin/linear-as PRODUCT '{}'", "~/.claude/bin/linear-as backend '{}'", "~/.claude/bin/linear-as BACKEND", "~/.claude/bin/linear-as",
                    "/tmp/linear-as BACKEND x", "python3 /tmp/extract-runs.py --actuals", "python3 %s" % os.path.join(self.cond, "scripts", "measure", "extract-runs.py"),
                    "python3 %s --actuals --x" % os.path.join(self.cond, "scripts", "measure", "extract-runs.py"), "python3 %s --all" % os.path.join(self.cond, "scripts", "measure", "extract-runs.py")]:
            with self.subTest(cmd=cmd):
                self.assertFalse(self.bash(cmd))
        self.assertFalse(self.bash("~/.claude/bin/linear-as BACKEND x", ctx=dict(self.ctx, role="")))

    def test_writes_only_in_the_worktree_and_the_agents_memory(self):
        for tool in ("Edit", "Write", "MultiEdit"):
            for path, want in [(self.wt + "/src/a.ts", True), (self.wt + "/src/new/deep/file.ts", True), (self.mem + "/note.md", True), ("src/a.ts", True),
                               (self.app + "/src/x.ts", False), (self.other_mem + "/m.md", False), (self.cond + "/docs/x.md", False), ("/etc/hosts", False),
                               (self.wt + "/link-out/s.txt", False), (self.wt + "/../chat-other/x", False), (self.wt + "/.env", False), (self.wt + "/.env.local", False),
                               (self.wt + "/.git", False), (self.wt + "/key.pem", False), (self.wt + "/chat.key", False), (self.wt + "/playground/x", False),
                               (self.tmp + "/outside/s.txt", False), ("~/.zshrc", False), (self.wt + "/..", False)]:
                with self.subTest(tool=tool, path=path):
                    self.assertEqual(self.ok(tool, {"file_path": path}), want)
        self.assertFalse(self.ok("Edit", {}))
        self.assertFalse(self.ok("NotebookEdit", {"notebook_path": self.wt + "/n.ipynb"}))

    def test_reads_work_as_in_answer_mode(self):
        self.assertTrue(self.ok("Read", {"file_path": self.wt + "/src/a.ts"}))
        self.assertTrue(self.ok("Read", {"file_path": self.app + "/src/x.ts"}))
        self.assertTrue(self.ok("Grep", {"pattern": "x", "glob": "*.ts"}))
        for tool, tin in [("Read", {"file_path": self.wt + "/.env"}), ("Read", {"file_path": "/etc/passwd"}), ("Grep", {"pattern": "x", "glob": ".env*"}),
                          ("Glob", {"pattern": "**/.env*"}), ("Read", {"file_path": os.path.expanduser("~/.healthapp-dashboard/chat.key")})]:
            with self.subTest(tool=tool, tin=tin):
                self.assertFalse(self.ok(tool, tin))

    def test_tools_that_are_never_available(self):
        for tool, tin in [("Agent", {"subagent_type": "x"}), ("WebFetch", {"url": "https://x"}), ("WebSearch", {"query": "x"}), ("Skill", {"skill": "x"}), ("", {}),
                          ("mcp__supabase__execute_sql", {}), ("mcp__85bd0e5f-4ef3-43e1-841c-955be7abf640__execute_sql", {}), ("mcp__cloudflare-docs__search", {}),
                          ("mcp__cloudflare-bindings__save_comment", {}), ("mcp__linear__delete_comment", {}), ("mcp__linear__merge_diff", {}),
                          ("mcp__linear__submit_diff_review", {}), ("mcp__linear__share_issue", {}), ("mcp__linear__retire_issue_label", {}), ("mcp__linear__save_document", {}),
                          ("mcp__linear__save_project", {}), ("mcp__linear__create_attachment", {}), ("mcp__linear__save_status_update", {}), ("mcp__x", {})]:
            with self.subTest(tool=tool):
                self.assertFalse(self.ok(tool, tin))
        for tool in ("mcp__linear__get_issue", "mcp__linear__list_comments", "mcp__linear__save_comment", "mcp__linear__save_issue",
                     "mcp__81f65ad4-7984-4cc5-abd0-8cf587011002__save_comment", "ToolSearch", "TodoWrite"):
            with self.subTest(tool=tool):
                self.assertTrue(self.ok(tool, {}))

    def test_a_handoff_has_linear_and_reads_only(self):
        ho = {"kind": "handoff", "worktree": "", "memory": "", "branch": "", "role": "BACKEND", "conductor": os.path.realpath(self.cond)}
        for tool, tin in [("Bash", {"command": "git status"}), ("Edit", {"file_path": self.wt + "/src/a.ts"}), ("Write", {"file_path": self.mem + "/n.md"})]:
            with self.subTest(tool=tool):
                self.assertFalse(self.ok(tool, tin, ctx=ho))
        for tool, tin in [("Read", {"file_path": self.app + "/src/x.ts"}), ("mcp__linear__save_comment", {}), ("mcp__linear__save_issue", {}), ("mcp__linear__get_issue", {})]:
            with self.subTest(tool=tool):
                self.assertTrue(self.ok(tool, tin, ctx=ho))

    def test_act_without_settings_fails_closed(self):
        for ctx in (None, {}, {"kind": ""}, {"kind": "nope"}, "x"):
            with self.subTest(ctx=ctx):
                self.assertFalse(G.decide({"tool_name": "Read", "tool_input": {"file_path": self.wt + "/src/a.ts"}, "cwd": self.wt}, "act", self.roots, ctx)[0])
        self.assertFalse(self.ok("Edit", {"file_path": self.wt + "/src/a.ts"}, ctx=dict(self.ctx, worktree="")))
        self.assertFalse(G.decide({"tool_name": "Bash", "tool_input": {"command": "git status"}, "cwd": self.wt}, "answer", self.roots, self.ctx)[0])   # answer mode: no shell
        self.assertFalse(G.decide({"tool_name": "Edit", "tool_input": {"file_path": self.wt + "/src/a.ts"}, "cwd": self.wt}, "answer", self.roots, self.ctx)[0])

    def test_main_in_act_mode_exit_codes_and_the_audit_line(self):
        home = os.path.join(self.tmp, "home")
        os.makedirs(home, exist_ok=True)
        argv = ["--mode", "act", "--kind", "change", "--roots", os.pathsep.join(self.roots), "--home", home, "--sid", "abcdef123456", "--role", "BACKEND",
                "--worktree", self.wt, "--memory", self.mem, "--branch", self.BRANCH, "--conductor", self.cond]
        results = []
        for event in ({"tool_name": "Bash", "tool_input": {"command": "git status"}, "cwd": self.wt},
                      {"tool_name": "Bash", "tool_input": {"command": "env | grep TOKEN-SECRET"}, "cwd": self.wt},
                      {"tool_name": "Write", "tool_input": {"file_path": self.wt + "/src/new.ts", "content": "TOPSECRET"}, "cwd": self.wt}):
            out, old, old_err = io.StringIO(), sys.stdout, sys.stderr
            sys.stdout, sys.stderr = out, io.StringIO()
            try:
                code = G.main(argv, io.StringIO(json.dumps(event)))
            finally:
                sys.stdout, sys.stderr = old, old_err
            results.append(code)
        self.assertEqual(results, [0, 2, 0])
        with open(os.path.join(home, "chat-audit.log")) as f:
            text = f.read()
        self.assertEqual([ln.split()[2:5] for ln in text.strip().splitlines()], [["Bash", "allow", "git"], ["Bash", "deny", "env"], ["Write", "allow", ".claude/worktrees/chat-ab12cd34/src/new.ts"]])
        self.assertNotIn("TOPSECRET", text)
        self.assertNotIn("TOKEN-SECRET", text)


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
