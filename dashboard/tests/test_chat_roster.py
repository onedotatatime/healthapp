"""The chat roster is all 13 agents, from one list (MIN-4574). The bridge and the feed read `config.agents` of hand-set.json; the sample is the source of
that list; the installed file is brought up to it by sync_agents.py. Nothing about an agent widens what a chat may do: the tool lists are the same for
every agent, so these tests compare the new three to the old ten instead of restating the lists."""
import json
import os
import stat
import subprocess
import tempfile
import unittest

from chat_testkit import ChatCase, wait_for
import chat_bridge as B
import sync_agents as S

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAMPLE = os.path.join(HERE, "hand-set.sample.json")
SERVICE = os.path.join(HERE, "chat_service.sh")
NEW = [("Scrum", "scrum-minhos"), ("SEO", "seo-minhos"), ("JobScout", "jobscout-minhos")]


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def sample_agents():
    with open(SAMPLE, encoding="utf-8") as f:
        return json.load(f)["config"]["agents"]


class Sample(unittest.TestCase):
    def test_thirteen_agents_and_the_three_new_ones_have_the_shape_of_the_other_ten(self):
        agents = sample_agents()
        self.assertEqual(len(agents), 13)
        self.assertEqual(len({a["n"] for a in agents}), 13)
        self.assertEqual(len({a["agentType"] for a in agents}), 13)
        by = {a["n"]: a for a in agents}
        for n, f in NEW:
            self.assertEqual(by[n]["agentType"], f)
            self.assertIsNone(by[n]["linear"])                                   # they write as Back, Anna and Spast: no Linear identity of their own
            self.assertNotIn("chat", by[n])                                      # no model or effort of their own: Sonnet at medium like the rest
            self.assertNotIn("agentFile", by[n])
        for a in agents:
            self.assertTrue(a["agentType"].endswith("-minhos"), a)
            self.assertEqual({"n", "role", "agentType", "linear"} - set(a), set(), a)
        self.assertEqual([a["n"] for a in agents[:10]], ["Back", "Anna", "Pix", "Ren", "Cron", "CTO", "Spast", "Release", "CEO", "E2E"])   # the ten keep their order

    def test_the_dev_server_has_no_roster_of_its_own(self):
        with open(os.path.join(HERE, "tests", "chat_dev_server.py"), encoding="utf-8") as f:
            src = f.read()
        self.assertIn("hand-set.sample.json", src)
        self.assertNotIn('-minhos"', src)

    def test_load_config_reads_all_thirteen_from_a_home_holding_the_sample(self):
        home = tempfile.mkdtemp(prefix="roster-")
        self.addCleanup(os.system, "rm -rf %s" % home)
        os.system("cp %s %s/hand-set.json" % (SAMPLE, home))
        settings, agents = B.load_config(home)
        self.assertEqual([a["n"] for a in agents], [a["n"] for a in sample_agents()])
        self.assertFalse(settings["act"])                                         # the roster does not turn act on


class Bridge(ChatCase):
    def test_every_one_of_the_thirteen_can_be_chatted_with_and_runs_its_own_agent_file(self):
        env = self.make(agents=sample_agents())
        for a in sample_agents():
            st, body, _ = env.post("/chat/sessions", {"agent": a["n"], "text": "hello " + a["n"]})
            self.assertEqual(st, 202, (a["n"], body))
            self.assertEqual(body["session"]["agent"], a["n"])
            env.wait_idle()
        self.assertEqual(len(env.records()), 13)
        ran = [env.record(i)["argv"] for i in range(13)]
        self.assertEqual(sorted(x[x.index("--agent") + 1] for x in ran), sorted(a["agentType"] for a in sample_agents()))
        st, body, _ = env.get("/chat/sessions")                                  # the one list call the card makes: all 13 sessions, none refused
        self.assertEqual((st, len(body["sessions"])), (200, 13))

    def test_the_new_three_get_the_same_tools_the_same_guard_and_the_default_model_as_the_old_ten(self):
        env = self.make(agents=sample_agents())
        for a in sample_agents():
            env.start_chat(a["n"])
            env.wait_idle()
        by = {}
        for i in range(13):
            argv = env.record(i)["argv"]
            by[argv[argv.index("--agent") + 1]] = argv
        tools = lambda x: (x[x.index("--allowedTools") + 1:x.index("--disallowedTools")], x[x.index("--disallowedTools") + 1:x.index("--max-budget-usd")])
        ref = tools(by["backend-minhos"])
        for n, f in NEW:
            argv = by[f]
            self.assertEqual(tools(argv), ref, f)                                # answer-only: the same allow and deny lists, character for character
            self.assertEqual(argv[argv.index("--model") + 1], "sonnet")
            self.assertEqual(argv[argv.index("--effort") + 1], "medium")
            self.assertEqual(argv[argv.index("--permission-mode") + 1], "dontAsk")
            hook = json.loads(argv[argv.index("--settings") + 1])["hooks"]["PreToolUse"][0]["hooks"][0]["command"]
            self.assertIn("--mode answer", hook)                                 # the answer-mode guard checks every call of these agents too
        for never in ("Bash", "Edit", "Write", "WebSearch", "WebFetch", "Agent", "Skill"):
            self.assertNotIn(never, ref[0])                                       # whole entries, not substrings ("TodoWrite" is allowed, "Write" is not)
        for tool in ref[0]:
            self.assertNotRegex(tool, r"Browser|supabase|cloudflare|save_|create_|delete_")
        self.assertEqual(by["cto-minhos"][by["cto-minhos"].index("--model") + 1], "fable")      # and the CTO row still holds

    def test_act_stays_off_and_an_act_turn_of_the_new_three_would_be_no_broader_than_back(self):
        env = self.make(agents=sample_agents())
        self.assertFalse(env.get("/chat/health")[1]["act"])
        wt, mem, br, ex = "/w/wt", "/w/mem", "feat/x", "/c/extract-runs.py"
        ref = B.act_tools("change", wt, mem, br, "PRODUCT", ex)
        for role in ("SCRUM", "SEO", "JOB SCOUT"):
            self.assertEqual(B.act_tools("change", wt, mem, br, role, ex), ref, role)
            self.assertEqual(B.act_tools("handoff", wt, mem, br, role, ex), B.act_tools("handoff", wt, mem, br, "PRODUCT", ex), role)

    def test_a_name_that_is_not_in_the_roster_is_still_refused(self):
        env = self.make(agents=sample_agents())
        for name in ("Nobody", "scrum", "SCRUM", "Job scout", ""):
            st, body, _ = env.post("/chat/sessions", {"agent": name, "text": "hi"})
            self.assertEqual((st, body.get("refused")), (404, "unknown_agent"), name)
        self.assertEqual(env.records(), [])


class Sync(unittest.TestCase):
    def setUp(self):
        self.tmp = os.path.realpath(tempfile.mkdtemp(prefix="roster-sync-"))
        self.addCleanup(os.system, "rm -rf %s" % self.tmp)
        self.path = os.path.join(self.tmp, "hand-set.json")

    def install(self, doc, mode=0o600):
        with open(self.path, "w") as f:
            json.dump(doc, f)
        os.chmod(self.path, mode)

    def installed(self):
        with open(self.path) as f:
            return json.load(f)

    def ten(self):
        return {"deadline": "keep me", "milestones": [{"id": "M1"}], "config": {"eurPerUsd": 0.5, "chat": {"act": False, "perTurnUsd": 3},
                "agents": [dict(a) for a in sample_agents()[:10]], "roleLabels": {"X": "Y"}}}

    def test_adds_exactly_the_three_missing_and_changes_nothing_else(self):
        self.install(self.ten())
        self.assertEqual(S.sync(SAMPLE, self.path), ["Scrum", "SEO", "JobScout"])
        doc = self.installed()
        self.assertEqual([a["n"] for a in doc["config"]["agents"]], [a["n"] for a in sample_agents()])
        want = self.ten()
        for k in ("deadline", "milestones"):
            self.assertEqual(doc[k], want[k])
        for k in ("eurPerUsd", "chat", "roleLabels"):
            self.assertEqual(doc["config"][k], want["config"][k])
        self.assertEqual(doc["config"]["agents"][:10], want["config"]["agents"])

    def test_a_hand_edit_of_an_existing_agent_is_never_overwritten(self):
        doc = self.ten()
        doc["config"]["agents"][4]["chat"] = {"row": "x", "model": "opus", "effort": "high"}
        doc["config"]["agents"][0]["linear"] = "Somebody Else"
        self.install(doc)
        S.sync(SAMPLE, self.path)
        out = self.installed()["config"]["agents"]
        self.assertEqual(out[4]["chat"], {"row": "x", "model": "opus", "effort": "high"})
        self.assertEqual(out[0]["linear"], "Somebody Else")

    def test_a_second_run_adds_nothing_and_does_not_rewrite_the_file(self):
        self.install(self.ten())
        S.sync(SAMPLE, self.path)
        before = os.stat(self.path).st_mtime_ns
        with open(self.path) as f:
            text = f.read()
        self.assertEqual(S.sync(SAMPLE, self.path), [])
        self.assertEqual(os.stat(self.path).st_mtime_ns, before)
        with open(self.path) as f:
            self.assertEqual(f.read(), text)

    def test_an_agent_already_there_under_another_name_or_type_is_not_added_twice(self):
        doc = self.ten()
        doc["config"]["agents"].append({"n": "Sam", "role": "Scrum", "agentType": "scrum-minhos", "linear": None})      # same agentType, other display name
        doc["config"]["agents"].append({"n": "SEO", "role": "x", "agentType": "something-else", "linear": None})        # same display name, other type
        self.install(doc)
        self.assertEqual(S.sync(SAMPLE, self.path), ["JobScout"])

    def test_backup_once_modes_600_and_no_temp_file_left(self):
        self.install(self.ten(), mode=0o644)
        original = read(self.path)
        S.sync(SAMPLE, self.path)
        backup = self.path + ".before-sync"
        self.assertEqual(read(backup), original)
        self.assertEqual(stat.S_IMODE(os.stat(backup).st_mode), 0o600)
        self.assertEqual(stat.S_IMODE(os.stat(self.path).st_mode), 0o600)
        self.assertEqual(sorted(os.listdir(self.tmp)), ["hand-set.json", "hand-set.json.before-sync"])
        doc = self.installed()                                                   # a later run (a new agent in the sample) keeps the FIRST backup
        doc["config"]["agents"].pop()
        self.install(doc)
        S.sync(SAMPLE, self.path)
        self.assertEqual(read(backup), original)

    def test_a_file_with_no_agents_key_gets_the_whole_list(self):
        self.install({"config": {}})
        self.assertEqual(len(S.sync(SAMPLE, self.path)), 13)
        self.install({})
        self.assertEqual(len(S.sync(SAMPLE, self.path)), 13)

    def test_unreadable_json_and_a_missing_file_fail_with_the_exit_code_and_write_nothing(self):
        with open(self.path, "w") as f:
            f.write("{not json")
        self.assertEqual(S.main([SAMPLE, self.path]), 2)
        self.assertEqual(read(self.path), "{not json")
        self.assertEqual(os.listdir(self.tmp), ["hand-set.json"])
        self.install([1, 2])
        self.assertEqual(S.main([SAMPLE, self.path]), 2)
        self.assertEqual(S.main([SAMPLE, os.path.join(self.tmp, "nope.json")]), 3)
        self.assertEqual(S.main([os.path.join(self.tmp, "no-sample.json"), self.path]), 2)


class Service(unittest.TestCase):
    """The real chat_service.sh with a fake HOME and a fake launchctl: install and sync-agents bring the installed config up to the sample."""

    def setUp(self):
        self.tmp = os.path.realpath(tempfile.mkdtemp(prefix="roster-svc-"))
        self.addCleanup(os.system, "rm -rf %s" % self.tmp)
        j = lambda *p: os.path.join(self.tmp, *p)
        for d in ("bin", "home", "pages", "dash"):
            os.makedirs(j(d))
        self.log = j("launchctl.log")
        for name, body in (("launchctl", '#!/bin/sh\necho "$@" >> "%s"\nexit ${FAKE_LAUNCHCTL_PRINT:-0}\n' % self.log), ("lsof", "#!/bin/sh\nexit 1\n")):
            with open(j("bin", name), "w") as f:
                f.write(body)
            os.chmod(j("bin", name), 0o755)
        self.env = {"PATH": "%s:/usr/bin:/bin" % j("bin"), "HOME": j("home"), "HEALTHAPP_DASHBOARD_HOME": j("dash")}
        self.hand = j("dash", "hand-set.json")
        with open(self.hand, "w") as f:
            json.dump({"config": {"agents": sample_agents()[:10]}}, f)

    def run_cmd(self, *args, **env):
        return subprocess.run(["/bin/bash", SERVICE] + list(args), env=dict(self.env, **env), capture_output=True, text=True, timeout=60)

    def names(self):
        with open(self.hand) as f:
            return [a["n"] for a in json.load(f)["config"]["agents"]]

    def test_sync_agents_adds_the_three_and_restarts_the_loaded_bridge(self):
        r = self.run_cmd("sync-agents")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(self.names()[10:], ["Scrum", "SEO", "JobScout"])
        self.assertIn("agents added", r.stdout)
        log = read(self.log)
        self.assertIn("kill SIGTERM", log)                                          # SIGTERM: the bridge ends its turns, KeepAlive starts it again with the new list
        self.assertNotIn("SIGKILL", log)

    def test_sync_agents_twice_restarts_nothing_the_second_time(self):
        self.run_cmd("sync-agents")
        os.remove(self.log)
        r = self.run_cmd("sync-agents")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("already complete", r.stdout)
        self.assertFalse(os.path.exists(self.log) and "kill" in read(self.log))

    def test_sync_agents_with_the_job_not_loaded_says_to_restart_by_hand(self):
        r = self.run_cmd("sync-agents", FAKE_LAUNCHCTL_PRINT="1")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("restart it by hand", r.stdout)
        self.assertFalse(os.path.exists(self.log) and "kill" in read(self.log))

    def test_install_brings_an_existing_hand_set_up_to_the_sample(self):
        r = self.run_cmd("install", "--page-dir", os.path.join(self.tmp, "pages"), "--port", "9999")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(len(self.names()), 13)
        self.assertNotRegex(r.stdout + r.stderr, r"[0-9a-f]{64}")

    def test_sync_agents_without_an_install_is_refused(self):
        os.remove(self.hand)
        os.rmdir(os.path.dirname(self.hand))
        r = self.run_cmd("sync-agents")
        self.assertEqual(r.returncode, 3)

    def test_sync_agents_with_a_broken_file_fails_and_does_not_restart(self):
        with open(self.hand, "w") as f:
            f.write("{broken")
        r = self.run_cmd("sync-agents")
        self.assertEqual(r.returncode, 2)
        self.assertFalse(os.path.exists(self.log) and "kill" in read(self.log))
        self.assertEqual(read(self.hand), "{broken")


if __name__ == "__main__":
    unittest.main()
