"""Dashboard chat bridge, act path (MIN-4497 run 2). `claude` is a stub and git is real (a temp repo with a local bare `origin`); no model is called.

The stub can write files, run commands in its cwd and sleep, so a test can make an act turn commit and push, or hang until Stop."""
import json
import os
import re
import time
import unittest

from chat_testkit import ChatCase, KEY, RULE_TEXT, block, good_proposal, wait_for
import chat_bridge as B

GIT_ID = ["git", "-c", "user.name=t", "-c", "user.email=t@t"]
COMMIT_PUSH = [GIT_ID + ["add", "-A"], GIT_ID + ["commit", "-q", "-m", "Add a doc (MIN-4497)"], GIT_ID + ["push", "-q", "origin", "HEAD"]]
RESULT_OK = '<<<RESULT {"outcome": "done", "issue": null, "summary": "Added the doc"} RESULT>>>'


def alive(pid):
    try:
        os.kill(pid, 0)
    except OSError:
        return False
    return True


def flag_values(argv, flag):
    """The values after `flag` up to the next `--option`."""
    i = argv.index(flag) + 1
    out = []
    while i < len(argv) and not argv[i].startswith("--"):
        out.append(argv[i])
        i += 1
    return out


class ActCase(ChatCase):
    def make_act(self, **cfg):
        return self.make(act=True, repo=True, **cfg)

    def proposal(self, env, agent="Cron", **over):
        env.set_behavior(reply="ok\n" + block(good_proposal(**over)))
        sid = env.start_chat(agent, "please do it")
        env.wait_idle()
        msgs = env.get("/chat/sessions/%s" % sid)[1]["messages"]
        return sid, msgs[-1]["proposal"]["id"]

    def yes(self, env, sid, pid):
        return env.post("/chat/sessions/%s/proposals/%s/yes" % (sid, pid), {})

    def result(self, env, sid):
        msgs = env.get("/chat/sessions/%s" % sid)[1]["messages"]
        self.assertEqual(msgs[-1]["role"], "result", msgs[-1])
        return msgs[-1]["result"]

    def wt_of(self, env, pid):
        return os.path.join(env.cwd, ".claude", "worktrees", "chat-" + pid[:8])

    def worktrees(self, env):
        return [ln for ln in env.git(env.cwd, "worktree", "list", "--porcelain").splitlines() if ln.startswith("worktree ")]


class YesRunsOneActTurn(ActCase):
    def test_no_yes_means_no_act_turn(self):
        env = self.make_act()
        sid, pid = self.proposal(env)
        self.assertEqual(len(env.records()), 1)                                     # only the answer turn
        self.assertEqual(len(self.worktrees(env)), 1)
        self.assertFalse(os.path.exists(self.wt_of(env, pid)))
        self.assertEqual(env.get("/chat/sessions/%s" % sid)[1]["session"]["state"], "needs_yes")
        env.post("/chat/sessions/%s/proposals/%s/no" % (sid, pid), {})
        self.assertEqual(self.yes(env, sid, pid)[1]["refused"], "yes_expired")       # a declined proposal cannot be said Yes to
        self.assertEqual(len(env.records()), 1)

    def test_a_change_runs_in_a_new_worktree_and_the_result_comes_from_git(self):
        env = self.make_act()
        sid, pid = self.proposal(env)
        env.set_behavior(reply="Done.\n" + RESULT_OK, cost=0.5, write={"docs/new.md": "hello\n"}, run=COMMIT_PUSH, sleep=1.0)
        st, body, _ = self.yes(env, sid, pid)
        self.assertEqual(st, 202)
        self.assertEqual(body["session"]["state"], "acting")
        self.assertEqual(env.get("/chat/health")[1]["acting"], 1)
        self.assertTrue(wait_for(lambda: len(env.records()) == 2))
        mid = env.get("/chat/sessions/%s" % sid)[1]["session"]
        self.assertEqual(mid["state"], "acting")
        self.assertRegex(mid["turnStartedAt"], r"^\d{4}-\d\d-\d\dT")                  # Pix's question 2: the act turn's start
        env.wait_idle()
        res = self.result(env, sid)
        branch = "feat/chat-cron-" + pid[:8]
        self.assertEqual(res["branch"], branch)
        self.assertEqual((res["outcome"], res["issue"], res["commits"], res["filesChanged"], res["pushed"], res["summary"], res["costUsd"]),
                         ("done", "MIN-4497", 1, 1, True, "Added the doc", 0.5))
        self.assertEqual(sorted(res), sorted(["outcome", "issue", "branch", "commits", "filesChanged", "pushed", "summary", "costUsd", "minutes"]))
        view = env.get("/chat/sessions/%s" % sid)[1]
        self.assertEqual((view["session"]["state"], view["session"]["worktree"], view["session"]["branch"]), ("waiting", True, branch))
        prop = [m for m in view["messages"] if m["role"] == "proposal"][0]["proposal"]
        self.assertEqual((prop["status"], prop["branch"]), ("accepted", branch))
        self.assertRegex(prop["acceptedAt"], r"^\d{4}-\d\d-")
        self.assertIn(self.wt_of(env, pid), [w[len("worktree "):] for w in self.worktrees(env)])
        self.assertIn(branch, env.git(env.cwd, "branch", "--list"))
        self.assertIn(branch, env.git(env.cwd, "ls-remote", "--heads", "origin"))
        self.assertNotIn(env.tmp, json.dumps(view))                                 # no local path in any response
        self.assertEqual(env.chat.spent_today(), 0.6)                               # the answer turn's 0.1 plus the act turn's 0.5

    def test_the_act_turns_argv_cwd_stdin_and_environment(self):
        env = self.make_act()
        sid, pid = self.proposal(env)
        env.set_behavior(reply="Done.\n" + RESULT_OK)
        self.yes(env, sid, pid)
        env.wait_idle()
        rec, wt = env.record(-1), self.wt_of(env, pid)
        argv = rec["argv"]
        self.assertEqual(rec["cwd"], os.path.realpath(wt))
        self.assertEqual(rec["stdin"], B.ACT_STDIN)
        self.assertEqual(sorted(rec["env"]), sorted(B.CHILD_ENV_KEYS))             # still built from nothing
        self.assertEqual(argv[argv.index("--agent") + 1], "backend-minhos")
        self.assertIn("--resume", argv)                                            # the answer turn answered: its session continues
        for flag, want in (("--model", "sonnet"), ("--effort", "high"), ("--permission-mode", "dontAsk"), ("--max-budget-usd", "10"),
                           ("--output-format", "stream-json")):
            self.assertEqual(argv[argv.index(flag) + 1], want, flag)
        joined = " ".join(argv)
        for bad in ("bypassPermissions", "--dangerously-skip-permissions", "--allow-dangerously-skip-permissions", "--bare"):
            self.assertNotIn(bad, joined)
        allowed, never = flag_values(argv, "--allowedTools"), flag_values(argv, "--disallowedTools")
        self.assertIn("Edit(//%s/**)" % os.path.realpath(wt).lstrip("/"), allowed)
        self.assertIn("Write(//%s/**)" % os.path.realpath(wt).lstrip("/"), allowed)
        self.assertIn("Bash(git push origin feat/chat-cron-%s)" % pid[:8], allowed)
        self.assertIn("Bash(~/.claude/bin/linear-as BACKEND:*)", allowed)
        for want in ("Read", "Grep", "mcp__linear__get_issue", "mcp__linear__save_comment", "mcp__linear__save_issue"):
            self.assertIn(want, allowed)
        for forbidden in ("Bash", "Edit", "Write", "Bash(git push:*)", "Bash(git push origin main)", "mcp__linear__delete_comment", "mcp__linear__merge_diff",
                          "mcp__linear__save_document", "Bash(git branch:*)", "Bash(git reset:*)"):
            self.assertNotIn(forbidden, allowed)
        for want in ("Agent", "WebFetch", "WebSearch", "mcp__supabase", "mcp__cloudflare-docs", "mcp__linear__delete_comment", "mcp__linear__merge_diff",
                     "mcp__linear__submit_diff_review", "mcp__linear__share_issue", "mcp__linear__retire_issue_label", "Bash(curl:*)", "Bash(rm:*)", "Bash(gh:*)"):
            self.assertIn(want, never)
        self.assertNotIn("mcp__linear__save_comment", never)
        hook = json.loads(argv[argv.index("--settings") + 1])["hooks"]["PreToolUse"][0]
        self.assertEqual(hook["matcher"], ".*")
        cmd = hook["hooks"][0]["command"]
        for part in ("--mode act", "--kind change", "--role BACKEND", "--branch feat/chat-cron-" + pid[:8], "--worktree " + wt, "chat_guard.py"):
            self.assertIn(part, cmd)
        prompt = argv[argv.index("--append-system-prompt") + 1]
        self.assertIn("RULE-FILE-MARKER-7731", prompt)                              # the conductor rule, read from the rule file
        self.assertIn("feat/chat-cron-" + pid[:8], prompt)
        self.assertIn('"summary": "Add a footer link"', prompt)                     # the approved proposal
        self.assertIn("<<<RESULT", prompt)

    def test_no_env_file_lands_in_the_worktree_and_nothing_is_copied_in(self):
        env = self.make_act()
        self.assertTrue(os.path.exists(os.path.join(env.cwd, ".env")))              # the main checkout has one (untracked, ignored)
        sid, pid = self.proposal(env)
        env.set_behavior(reply="Done.\n" + RESULT_OK)
        self.yes(env, sid, pid)
        env.wait_idle()
        names = os.listdir(self.wt_of(env, pid))
        self.assertEqual([n for n in names if n.startswith(".env")], [])
        self.assertIn("src", names)                                                 # but the tracked files are there

    def test_the_worktree_is_new_each_time_and_an_existing_branch_or_path_is_refused(self):
        env = self.make_act()
        sid, pid = self.proposal(env)
        env.git(env.cwd, "branch", "feat/chat-cron-" + pid[:8])                      # the branch the bridge would create already exists
        before = len(env.records())
        env.set_behavior(reply="Done.\n" + RESULT_OK)
        self.assertEqual(self.yes(env, sid, pid)[0], 202)
        env.wait_idle()
        res = self.result(env, sid)
        self.assertEqual((res["outcome"], res["summary"], res["branch"], res["commits"]), ("failed", B.PREP_ERROR_TEXT, None, 0))
        self.assertEqual(len(env.records()), before)                                # the agent never started
        self.assertFalse(os.path.exists(self.wt_of(env, pid)))
        # a path that exists
        sid2, pid2 = self.proposal(env, branchType="fix")
        os.makedirs(self.wt_of(env, pid2))
        env.set_behavior(reply="Done.\n" + RESULT_OK)
        self.yes(env, sid2, pid2)
        env.wait_idle()
        self.assertEqual(self.result(env, sid2)["summary"], B.PREP_ERROR_TEXT)
        # and a second approved change is another worktree
        sid3, pid3 = self.proposal(env, branchType="chore")
        env.set_behavior(reply="Done.\n" + RESULT_OK)
        self.yes(env, sid3, pid3)
        env.wait_idle()
        self.assertEqual(self.result(env, sid3)["branch"], "chore/chat-cron-" + pid3[:8])
        self.assertTrue(os.path.isdir(self.wt_of(env, pid3)))

    def test_the_result_branch_commits_and_files_are_never_the_agents(self):
        env = self.make_act()
        sid, pid = self.proposal(env)
        lie = '<<<RESULT {"outcome": "done", "issue": null, "summary": "ok", "branch": "main", "commits": 99, "filesChanged": 99} RESULT>>>'
        env.set_behavior(reply="Done.\n" + lie)
        self.yes(env, sid, pid)
        env.wait_idle()
        res = self.result(env, sid)
        self.assertEqual((res["outcome"], res["summary"], res["commits"], res["filesChanged"], res["pushed"]), ("failed", B.NO_RESULT_TEXT, 0, 0, False))
        self.assertEqual(res["branch"], "feat/chat-cron-" + pid[:8])                 # from the bridge's own record, not the agent's block
        self.assertNotIn("99", json.dumps(res))

    def test_a_missing_or_malformed_result_block_is_failed_with_a_fixed_summary(self):
        env = self.make_act()
        for reply in ("I finished.", "x " + RESULT_OK + " and then more text", RESULT_OK + RESULT_OK, "<<<RESULT {nope RESULT>>>",
                      '<<<RESULT {"outcome": "stopped", "issue": null, "summary": "x"} RESULT>>>', '<<<RESULT {"outcome": "done", "issue": "bad", "summary": "x"} RESULT>>>'):
            with self.subTest(reply=reply):
                sid, pid = self.proposal(env)
                env.set_behavior(reply=reply)
                self.yes(env, sid, pid)
                env.wait_idle()
                res = self.result(env, sid)
                self.assertEqual((res["outcome"], res["summary"]), ("failed", B.NO_RESULT_TEXT))
                self.assertNotIn("RESULT", json.dumps(env.get("/chat/sessions/%s" % sid)[1]))

    def test_the_agents_own_failed_outcome_is_kept_and_its_issue_used(self):
        env = self.make_act()
        sid, pid = self.proposal(env, issue=None)
        env.set_behavior(reply='<<<RESULT {"outcome": "failed", "issue": "MIN-5000", "summary": "the build was red"} RESULT>>>')
        self.yes(env, sid, pid)
        env.wait_idle()
        res = self.result(env, sid)
        self.assertEqual((res["outcome"], res["issue"], res["summary"]), ("failed", "MIN-5000", "the build was red"))

    def test_a_crashed_or_rate_limited_act_turn_is_failed_with_a_fixed_text_and_its_cost_booked(self):
        env = self.make_act()
        sid, pid = self.proposal(env)
        env.set_behavior(is_error=True, reply="Credit balance is too low", cost=0.3, exit=1)
        self.yes(env, sid, pid)
        env.wait_idle()
        res = self.result(env, sid)
        self.assertEqual((res["outcome"], res["summary"], res["costUsd"]), ("failed", "Cron did not finish. Nothing was lost.", 0.3))
        sid2, pid2 = self.proposal(env)
        env.set_behavior(is_error=True, reply="429 rate limit reached", exit=1)
        self.yes(env, sid2, pid2)
        env.wait_idle()
        self.assertEqual(self.result(env, sid2)["summary"], "Cron is rate limited. Try again in a minute.")

    def test_a_handoff_runs_in_the_main_checkout_with_linear_tools_only(self):
        env = self.make_act()
        sid, pid = self.proposal(env, kind="handoff", summary="Write a Q issue for Back")
        env.set_behavior(reply='Done.\n<<<RESULT {"outcome": "done", "issue": "MIN-4600", "summary": "Wrote the Q issue"} RESULT>>>')
        self.assertEqual(self.yes(env, sid, pid)[0], 202)
        env.wait_idle()
        rec = env.record(-1)
        self.assertEqual(rec["cwd"], os.path.realpath(env.cwd))
        never = flag_values(rec["argv"], "--disallowedTools")
        allowed = flag_values(rec["argv"], "--allowedTools")
        for want in ("Edit", "Write", "Bash"):
            self.assertIn(want, never)
        self.assertFalse([a for a in allowed if a.startswith(("Edit", "Write", "Bash"))])
        self.assertIn("mcp__linear__save_comment", allowed)
        self.assertIn("--kind handoff", json.loads(rec["argv"][rec["argv"].index("--settings") + 1])["hooks"]["PreToolUse"][0]["hooks"][0]["command"])
        res = self.result(env, sid)
        self.assertEqual((res["outcome"], res["issue"], res["branch"], res["commits"], res["filesChanged"], res["pushed"]), ("done", "MIN-4600", None, 0, 0, False))
        self.assertEqual(len(self.worktrees(env)), 1)                               # no worktree was made
        self.assertFalse(env.get("/chat/sessions/%s" % sid)[1]["session"]["worktree"])


class SingleUseAndExpiry(ActCase):
    def test_a_second_yes_is_refused_and_runs_nothing(self):
        env = self.make_act()
        sid, pid = self.proposal(env)
        env.set_behavior(reply="Done.\n" + RESULT_OK)
        self.assertEqual(self.yes(env, sid, pid)[0], 202)
        env.wait_idle()
        n = len(env.records())
        st, body, _ = self.yes(env, sid, pid)
        self.assertEqual((st, body["refused"], body["reason"]), (410, "yes_expired", "This request expired. Ask again."))
        self.assertEqual(len(env.records()), n)
        self.assertEqual(len(self.worktrees(env)), 2)

    def test_an_expired_yes_is_refused(self):
        env = self.make_act(yesMinutes=30)
        sid, pid = self.proposal(env)
        env.chat.now = lambda: time.time() + 31 * 60
        st, body, _ = self.yes(env, sid, pid)
        self.assertEqual((st, body["refused"]), (410, "yes_expired"))
        self.assertEqual(len(env.records()), 1)
        env.chat.now = time.time
        self.assertEqual(env.get("/chat/sessions/%s" % sid)[1]["messages"][-1]["proposal"]["status"], "expired")

    def test_a_yes_is_tied_to_its_own_session_and_proposal(self):
        env = self.make_act()
        sid, pid = self.proposal(env)
        env.wait_idle()
        other, _ = self.proposal(env, agent="Pix")
        self.assertEqual(self.yes(env, other, pid)[0], 404)                         # another chat's id
        self.assertEqual(self.yes(env, sid, "deadbeef0000")[0], 404)
        self.assertEqual(len(env.records()), 2)

    def test_a_text_message_declines_the_open_proposal_and_a_late_yes_is_refused(self):
        env = self.make_act()
        sid, pid = self.proposal(env)
        env.set_behavior(reply="fine")
        env.post("/chat/sessions/%s/messages" % sid, {"text": "no, just explain"})
        env.wait_idle()
        self.assertEqual(self.yes(env, sid, pid)[1]["refused"], "yes_expired")
        self.assertEqual(env.get("/chat/sessions/%s" % sid)[1]["session"]["state"], "waiting")


class Refusals(ActCase):
    def test_act_false_is_act_off(self):
        env = self.make(repo=True)                                                  # act defaults to false
        sid, pid = self.proposal(env)
        st, body, _ = self.yes(env, sid, pid)
        self.assertEqual((st, body["refused"]), (409, "act_off"))
        self.assertEqual(env.get("/chat/sessions/%s" % sid)[1]["session"]["state"], "waiting")     # no "needs your yes" while acting is off
        self.assertEqual(len(env.records()), 1)

    def test_the_rule_file_missing_or_not_at_the_merged_commit_is_act_off(self):
        env = self.make_act()
        sid, pid = self.proposal(env)
        c = env.conductor
        env.git(c, "init", "-q", "-b", "main")
        env.git(c, "add", "-A")
        env.git(c, "commit", "-q", "-m", "rule")
        good = env.git(c, "rev-parse", "HEAD").strip()
        with open(os.path.join(c, "docs", "other.md"), "w") as f:
            f.write("x")
        env.git(c, "add", "-A")
        env.git(c, "commit", "-q", "-m", "second")
        env.git(c, "checkout", "-q", "-b", "side")
        os.remove(os.path.join(c, "docs", "agents", "dashboard-chat.md"))
        env.git(c, "add", "-A")
        env.git(c, "commit", "-q", "-m", "side removes the rule")
        norule = env.git(c, "rev-parse", "HEAD").strip()
        env.git(c, "checkout", "-q", "main")
        for name, commit, want in (("no such commit", "1234567", False), ("not a hex string", "main; ls", False), ("present and an ancestor", good, True),
                                   ("commit without the file", norule, False)):
            with self.subTest(name):
                env.chat.s["ruleCommit"] = commit
                self.assertEqual(env.chat.rule_text() is not None, want)
        env.chat.s["ruleCommit"] = norule
        before = len(env.records())
        self.assertEqual(self.yes(env, sid, pid)[1]["refused"], "act_off")
        self.assertEqual(len(env.records()), before)
        env.chat.s["ruleCommit"] = good
        env.set_behavior(reply="Done.\n" + RESULT_OK)
        self.assertEqual(self.yes(env, sid, pid)[0], 202)
        env.wait_idle()

    def test_the_rule_file_must_be_inside_conductor_and_not_empty(self):
        env = self.make_act()
        out = os.path.join(env.tmp, "outside.md")
        with open(out, "w") as f:
            f.write("a rule outside conductor")
        env.chat.s["ruleFile"] = out
        self.assertIsNone(env.chat.rule_text())
        env.chat.s["ruleFile"] = os.path.join(env.conductor, "docs", "agents", "dashboard-chat.md")
        self.assertEqual(env.chat.rule_text(), RULE_TEXT)
        with open(env.chat.s["ruleFile"], "w") as f:
            f.write("   \n")
        self.assertIsNone(env.chat.rule_text())

    def test_a_wrong_or_ultracode_row_is_bad_row_and_cannot_be_run(self):
        env = self.make_act()
        for task in ("nope", "ultracode row"):
            sid, pid = self.proposal(env, taskType=task)
            p = env.get("/chat/sessions/%s" % sid)[1]["messages"][-1]["proposal"]
            self.assertEqual((p["status"], p["refused"], p["reason"]), ("refused", "bad_row", "Cron cannot run this from the chat. Ask the coordinator."))
            st, body, _ = self.yes(env, sid, pid)
            self.assertEqual((st, body["refused"], body["reason"]), (422, "bad_row", "Cron cannot run this from the chat. Ask the coordinator."))
        self.assertEqual(len(env.records()), 2)                                      # the two answer turns only
        self.assertEqual(len(self.worktrees(env)), 1)

    def test_forbidden_is_only_for_the_never_allowed_words(self):
        env = self.make_act()
        for summary in ("Merge the PR to main", "Deploy it to production", "Delete the old branches", "Run a migration", "Force push it", "Drop the table"):
            sid, pid = self.proposal(env, summary=summary)
            p = env.get("/chat/sessions/%s" % sid)[1]["messages"][-1]["proposal"]
            self.assertEqual((p["status"], p["refused"]), ("refused", "forbidden"), summary)
            st, body, _ = self.yes(env, sid, pid)
            self.assertEqual((st, body["refused"], body["reason"]),
                             (422, "forbidden", "Not from the chat: merges, production, deletes, money, databases and your exams. Ask the coordinator."))
        self.assertEqual(len(self.worktrees(env)), 1)

    def test_an_estimate_over_the_per_action_cap_is_budget_reached_with_its_own_words(self):
        env = self.make_act()
        sid, pid = self.proposal(env, estUsd=10.5)
        p = env.get("/chat/sessions/%s" % sid)[1]["messages"][-1]["proposal"]
        self.assertEqual((p["status"], p["refused"]), ("refused", "budget_reached"))
        self.assertEqual(p["reason"], "This would cost more than $10 for one action. Ask for a smaller step.")
        self.assertNotIn("merges", p["reason"])                                      # not the `forbidden` text
        st, body, _ = self.yes(env, sid, pid)
        self.assertEqual((st, body["refused"], body["reason"]), (429, "budget_reached", p["reason"]))
        self.assertEqual(len(env.records()), 1)
        sid2, _pid2 = self.proposal(env, estUsd=10)                                  # exactly the cap is allowed
        self.assertEqual(env.get("/chat/sessions/%s" % sid2)[1]["messages"][-1]["proposal"]["status"], "open")
        env.chat.s["perActUsd"] = 5                                                  # the number in the text is the configured one
        sid3, _ = self.proposal(env, estUsd=6)
        self.assertEqual(env.get("/chat/sessions/%s" % sid3)[1]["messages"][-1]["proposal"]["reason"], "This would cost more than $5 for one action. Ask for a smaller step.")

    def test_over_the_days_budget_is_budget_reached_at_the_proposal_and_at_the_yes(self):
        env = self.make_act()
        sid, pid = self.proposal(env)
        env.chat.ledger.append((time.time(), 35.0))                                  # 35 + the per-action cap of 10 passes 40
        st, body, _ = self.yes(env, sid, pid)
        self.assertEqual((st, body["refused"], body["reason"]), (429, "budget_reached", "This would pass today's chat budget. It resets at midnight."))
        self.assertEqual(len(env.records()), 1)
        self.assertEqual(env.get("/chat/sessions/%s" % sid)[1]["messages"][-1]["proposal"]["status"], "open")   # not consumed: the Yes can be tried again
        env.chat.ledger[:] = [(time.time(), 39.0)]
        env.chat.s["perTurnUsd"] = 0.01
        sid2, _ = self.proposal(env, estUsd=2)
        p = env.get("/chat/sessions/%s" % sid2)[1]["messages"][-1]["proposal"]
        self.assertEqual((p["status"], p["refused"], p["reason"]), ("refused", "budget_reached", "This would pass today's chat budget. It resets at midnight."))

    def test_agent_busy_and_the_cap_and_the_yes_is_not_consumed(self):
        env = self.make_act()
        a, pa = self.proposal(env)
        b, pb = self.proposal(env)
        env.set_behavior(sleep=60, child=True)
        self.assertEqual(self.yes(env, a, pa)[0], 202)
        self.assertTrue(wait_for(lambda: len(env.records()) == 3))
        st, body, _ = self.yes(env, b, pb)
        self.assertEqual((st, body["refused"], body["reason"]), (409, "agent_busy", "Cron is already working. Wait for it to finish, or stop it."))
        self.assertEqual(env.get("/chat/sessions/%s" % b)[1]["messages"][-1]["proposal"]["status"], "open")
        self.assertEqual(env.get("/chat/health")[1]["acting"], 1)
        env.post("/chat/sessions/%s/stop" % a, {})
        env.wait_idle(10)
        env.set_behavior(reply="Done.\n" + RESULT_OK)
        self.assertEqual(self.yes(env, b, pb)[0], 202)                               # the refused Yes is still good once the agent is free
        env.wait_idle()
        # the running-turn cap
        sid, pid = self.proposal(env, agent="Pix")
        env.chat.s["maxRunning"] = 0
        self.assertEqual(self.yes(env, sid, pid)[1]["refused"], "cap_reached")
        self.assertEqual(env.get("/chat/sessions/%s" % sid)[1]["messages"][-1]["proposal"]["status"], "open")

    def test_chat_off_and_a_busy_session_refuse_a_yes(self):
        env = self.make_act()
        sid, pid = self.proposal(env)
        open(os.path.join(env.home, "chat.off"), "w").close()
        self.assertEqual(self.yes(env, sid, pid)[1]["refused"], "chat_off")
        os.remove(os.path.join(env.home, "chat.off"))
        self.assertEqual(len(env.records()), 1)


class StopTimeoutAndLogs(ActCase):
    def test_stop_kills_the_act_turns_process_group_and_reports_stopped(self):
        env = self.make_act()
        sid, pid = self.proposal(env)
        env.set_behavior(sleep=60, child=True, write={"docs/partial.md": "x"}, run=[GIT_ID + ["add", "-A"], GIT_ID + ["commit", "-q", "-m", "partial"]])
        self.yes(env, sid, pid)
        self.assertTrue(wait_for(lambda: os.path.exists(os.path.join(env.dir, "child.pid")) and len(env.records()) == 2))
        branch = "feat/chat-cron-" + pid[:8]
        self.assertTrue(wait_for(lambda: env.git(env.cwd, "rev-list", "--count", "origin/staging.." + branch).strip() == "1"), "the stub never committed")
        stub_pid, child_pid = env.record(-1)["pid"], int(open(os.path.join(env.dir, "child.pid")).read())
        self.assertEqual(env.get("/chat/sessions/%s" % sid)[1]["session"]["state"], "acting")
        st, body, _ = env.post("/chat/sessions/%s/stop" % sid, {})
        self.assertEqual(st, 200)
        self.assertTrue(wait_for(lambda: not alive(child_pid), 2.0), "the child of the act turn survived the stop")
        self.assertTrue(wait_for(lambda: not alive(stub_pid), 2.0))
        env.wait_idle(8)
        res = self.result(env, sid)
        self.assertEqual((res["outcome"], res["summary"], res["commits"], res["filesChanged"]), ("stopped", "Stopped by you.", 1, 1))   # git still tells the truth
        self.assertEqual(env.get("/chat/sessions/%s" % sid)[1]["session"]["state"], "waiting")

    def test_the_act_timeout_is_its_own_setting_and_reports_timeout(self):
        env = self.make_act(actMinutes=0.1, answerMinutes=15)                        # 6 s
        sid, pid = self.proposal(env)
        env.set_behavior(sleep=60)
        self.yes(env, sid, pid)
        self.assertTrue(wait_for(lambda: len(env.records()) == 2))
        pid_stub = env.record(-1)["pid"]
        env.wait_idle(12)
        self.assertTrue(wait_for(lambda: not alive(pid_stub), 8))
        res = self.result(env, sid)
        self.assertEqual((res["outcome"], res["summary"]), ("timeout", "Stopped after 0.1 minutes."))

    def test_the_log_has_no_text_and_the_audit_fields_only(self):
        env = self.make_act()
        secret_say = "PRIVATE-FOUNDER-WORDS-91"
        env.set_behavior(reply="ok\n" + block(good_proposal(summary="Add the " + secret_say + " link")))
        sid = env.start_chat("Cron", "please " + secret_say)
        env.wait_idle()
        pid = env.get("/chat/sessions/%s" % sid)[1]["messages"][-1]["proposal"]["id"]
        env.set_behavior(reply="Wrote " + secret_say + "\n" + RESULT_OK.replace("Added the doc", "Added " + secret_say), cost=0.25,
                         write={"docs/a.md": "x"}, run=COMMIT_PUSH)
        self.yes(env, sid, pid)
        env.wait_idle()
        log = open(os.path.join(env.home, "chat.log")).read()
        self.assertNotIn(secret_say, log)
        self.assertNotIn(KEY, log)
        self.assertNotIn(env.tmp, log)
        lines = log.strip().splitlines()
        self.assertRegex(lines[-2], r"^\S+ yes agent=Cron sid=%s proposal=%s kind=change issue=MIN-4497$" % (sid[:8], pid))
        self.assertRegex(lines[-1], r"^\S+ turn kind=act agent=Cron sid=%s proposal=%s issue=MIN-4497 branch=feat/chat-cron-%s result=done seconds=\d+ cost=0\.2500 "
                                    r"commits=1 files=1 pushed=yes$" % (sid[:8], pid, pid[:8]))
        for name in os.listdir(os.path.join(env.home, "chat")):
            if name.endswith(".json"):
                self.assertEqual(os.stat(os.path.join(env.home, "chat", name)).st_mode & 0o777, 0o600)

    def test_events_show_tool_and_target_during_an_act_turn(self):
        env = self.make_act()
        sid, pid = self.proposal(env)
        env.set_behavior(reply="Done.\n" + RESULT_OK, events=[{"name": "Edit", "input": {"file_path": os.path.join(env.cwd, ".claude/worktrees/chat-%s/docs/a.md" % pid[:8])}},
                                                             {"name": "Bash", "input": {"command": "git status"}}])
        self.yes(env, sid, pid)
        env.wait_idle()
        ev = env.get("/chat/sessions/%s/events?after=0" % sid)[1]["events"]
        self.assertEqual([(e["tool"], e["target"]) for e in ev], [("Edit", ".claude/worktrees/chat-%s/docs/a.md" % pid[:8]), ("Bash", "git")])


class SessionViewsAndRedaction(ActCase):
    def test_needs_yes_only_while_the_proposal_is_open_and_acting_is_on(self):
        env = self.make_act(yesMinutes=30)
        sid, pid = self.proposal(env)
        self.assertEqual(env.get("/chat/sessions/%s" % sid)[1]["session"]["state"], "needs_yes")
        env.chat.now = lambda: time.time() + 31 * 60
        self.assertEqual(env.get("/chat/sessions/%s" % sid)[1]["session"]["state"], "waiting")
        env.chat.now = time.time
        env.chat.s["act"] = False
        self.assertEqual(env.get("/chat/sessions/%s" % sid)[1]["session"]["state"], "waiting")

    def test_sessions_without_an_agent_list_every_agent(self):
        env = self.make_act()
        env.set_behavior(reply="hello")
        a = env.start_chat("Pix")
        env.wait_idle()
        b = env.start_chat("Cron")
        env.wait_idle()
        st, body, _ = env.get("/chat/sessions")
        self.assertEqual(st, 200)
        self.assertIsNone(body["agent"])
        self.assertEqual([(s["id"], s["agent"]) for s in body["sessions"]], [(b, "Cron"), (a, "Pix")])              # newest first, with the agent on each
        self.assertEqual(env.get("/chat/sessions?agent=Pix")[1]["agent"], "Pix")
        self.assertEqual(env.get("/chat/sessions?agent=Nobody")[0], 404)
        self.assertEqual(env.get("/chat/sessions", key=False)[0], 403)

    def test_key_shaped_strings_are_redacted_before_they_are_stored_and_logged_once(self):
        env = self.make_act()
        keys = ["sk" + "-ant-api03-" + "Ab1" * 12, "12345678-1234-1234-1234-123456789abc:" + "0123456789abcdef" * 2, "lin" + "_api_" + "Z" * 30, "fal" + "_" + "q" * 24,
                "FAL" + "_KEY=" + "9" * 20]
        env.set_behavior(reply="Here you go: " + " and ".join(keys) + " /Users/someone/x")
        sid = env.start_chat("Pix")
        env.wait_idle()
        text = env.get("/chat/sessions/%s" % sid)[1]["messages"][-1]["text"]
        for k in keys:
            self.assertNotIn(k, text)
            self.assertNotIn(k[10:], text)                                           # nor its tail
        self.assertEqual(text.count("[redacted]"), len(keys))
        self.assertIn("~/x", text)
        stored = open(os.path.join(env.home, "chat", sid + ".json")).read()
        for k in keys:
            self.assertNotIn(k[8:], stored)                                          # never written to the chat file either
        log = open(os.path.join(env.home, "chat.log")).read()
        self.assertEqual(log.count("reply_redacted sid=%s" % sid[:8]), 1)
        self.assertNotIn("sk-ant", log)
        env.set_behavior(reply="nothing secret here")
        env.post("/chat/sessions/%s/messages" % sid, {"text": "again"})
        env.wait_idle()
        self.assertEqual(open(os.path.join(env.home, "chat.log")).read().count("reply_redacted"), 1)    # no line when nothing was redacted

    def test_scrub_table(self):
        sk = "sk" + "-ant-"
        rows = [(sk + "api03-abcdefghij", "[redacted]"), ("see " + sk + "abcdefg-hij_k here", "see [redacted] here"), ("sk-learn is a library", "sk-learn is a library"),
                ("task-ant-farm", "task-ant-farm"), ("fal_" + "a" * 16, "[redacted]"), ("fal_short", "fal_short"), ("lin" + "_api_" + "Q" * 10 + " tail", "[redacted] tail"),
                ("/Users/bob/app", "~/app"), ("plain text", "plain text"), ("sb" + "_secret_abc123XYZ", "[redacted]"), ("ghp_" + "a" * 25, "[redacted]")]
        for text, want in rows:
            with self.subTest(text=text):
                self.assertEqual(B.scrub(text), want)
        self.assertEqual(B.redact("plain")[1], False)
        self.assertEqual(B.redact(sk + "abcdefgh")[1], True)

    def test_result_summaries_are_redacted_too(self):
        env = self.make_act()
        sid, pid = self.proposal(env)
        key = "sk" + "-ant-api03-" + "Xy9" * 10
        env.set_behavior(reply='<<<RESULT {"outcome": "done", "issue": null, "summary": "I found %s in a file"} RESULT>>>' % key)
        self.yes(env, sid, pid)
        env.wait_idle()
        res = self.result(env, sid)
        self.assertNotIn(key[10:], res["summary"])
        self.assertIn("[redacted]", res["summary"])
        self.assertIn("reply_redacted", open(os.path.join(env.home, "chat.log")).read())


class ResultParsing(unittest.TestCase):
    def test_table(self):
        good = {"outcome": "done", "issue": None, "summary": "Added it"}
        blk = lambda o: "<<<RESULT " + json.dumps(o) + " RESULT>>>"
        two = "a " + blk(good) + " b " + blk(good)
        cases = [
            ("no block", "Plain.", "Plain.", None, False),
            ("one valid block", "Done.\n" + blk(good), "Done.", good, False),
            ("trailing whitespace", "Done.\n" + blk(good) + "\n  ", "Done.", good, False),
            ("failed outcome", "x " + blk(dict(good, outcome="failed")), "x", dict(good, outcome="failed"), False),
            ("issue id", "x " + blk(dict(good, issue="MIN-4497")), "x", dict(good, issue="MIN-4497"), False),
            ("two blocks", two, "a  b", None, True),
            ("block not last", blk(good) + " and more", "and more", None, True),
            ("broken json", "x <<<RESULT {nope RESULT>>>", "x", None, True),
            ("extra field", "x " + blk(dict(good, branch="main")), "x", None, True),
            ("missing field", "x " + blk({"outcome": "done", "summary": "s"}), "x", None, True),
            ("stopped is not the agent's to say", "x " + blk(dict(good, outcome="stopped")), "x", None, True),
            ("bad issue", "x " + blk(dict(good, issue="nope")), "x", None, True),
            ("empty summary", "x " + blk(dict(good, summary=" ")), "x", None, True),
            ("summary 501", "x " + blk(dict(good, summary="y" * 501)), "x", None, True),
            ("lone marker", "x <<<RESULT and then", "x and then", None, True),
            ("marker inside the text", "Use <<<RESULT like this " + blk(good), "Use", None, True),
        ]
        for name, text, want_text, want_obj, want_rejected in cases:
            with self.subTest(name):
                got_text, obj, rejected = B.split_result(text)
                self.assertEqual(re.sub(r"\s+", " ", got_text), re.sub(r"\s+", " ", want_text))
                self.assertEqual((obj, rejected), (want_obj, want_rejected))
                self.assertNotIn("RESULT", got_text)

    def test_a_result_block_in_an_answer_is_not_a_proposal_and_the_other_way_round(self):
        text, prop, rejected = B.split_proposal('hi <<<RESULT {"outcome": "done", "issue": null, "summary": "x"} RESULT>>>')
        self.assertEqual((prop, rejected), (None, False))
        text, res, rejected = B.split_result("hi " + block(good_proposal()))
        self.assertEqual((res, rejected), (None, False))


class ActSourceRules(unittest.TestCase):
    def test_the_act_set_has_no_open_bash_edit_or_write(self):
        allowed, never = B.act_tools("change", "/wt", "/mem", "feat/chat-cron-abcd1234", "BACKEND", "/c/extract-runs.py")
        self.assertFalse({"Bash", "Edit", "Write", "Agent", "WebFetch", "WebSearch"} & set(allowed))
        self.assertTrue({"Agent", "WebFetch", "WebSearch", "Skill", "NotebookEdit", "mcp__supabase"} <= set(never))
        allowed, never = B.act_tools("handoff", "", "", None, "BACKEND", "/c/extract-runs.py")
        self.assertTrue({"Edit", "Write", "Bash"} <= set(never))
        self.assertFalse([a for a in allowed if a.startswith(("Edit", "Write", "Bash"))])

    def test_act_never_set_covers_every_linear_write_except_comment_and_issue(self):
        for name in B.LINEAR_WRITE:
            tool = "mcp__linear__" + name
            if name in B.LINEAR_ACT_WRITE:
                self.assertNotIn(tool, B.ACT_NEVER)
            else:
                self.assertIn(tool, B.ACT_NEVER)


if __name__ == "__main__":
    unittest.main()
