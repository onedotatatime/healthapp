#!/usr/bin/env python3
"""Dashboard chat bridge (MIN-4497, run 1: the ANSWER path). Stdlib only, Python 3.9+.

One small server on 127.0.0.1 that (a) serves the dashboard page folder and (b) answers `/chat/*` on the same origin, so there
is no CORS and no CORS header, ever. Each message the founder sends runs ONE headless `claude -p --agent <role>-minhos` turn,
read-only (PreToolUse hook `chat_guard.py`, `--permission-mode dontAsk`). The CTO's contract is on MIN-4495 and MIN-4497.

Run 1 builds the answer path only. A proposal is parsed, validated and shown; a Yes always answers `act_off` and runs nothing
(`ACT_BUILT` is False; run 2 builds the act turn).

Start (Terminal or launchd, never from a Claude session):
    python3 chat_bridge.py --home ~/.healthapp-dashboard --page-dir <docs/dashboard/drafts> --port 8765
Needs `<home>/chat.key` (at least 32 characters, mode 600). Without it every /chat call answers 503 and nothing runs.

Never printed or logged: the chat key, message text, agent replies, tool input or output. `chat.log` has one line per turn.
"""
from __future__ import annotations

import argparse
import collections
import functools
import hmac
import http.server
import importlib.machinery
import importlib.util
import json
import math
import os
import pwd
import re
import shlex
import signal
import socketserver
import subprocess
import sys
import threading
import time
import urllib.parse
import uuid
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import chat_guard as G  # noqa: E402
import snapshot as S  # noqa: E402

BIND = "127.0.0.1"                       # the only address this server ever binds
ACT_BUILT = False                        # run 2 builds the act turn; until then a Yes is always `act_off`
CHILD_ENV_KEYS = ("HOME", "USER", "LOGNAME", "TMPDIR", "LANG", "PATH")
MAX_BODY = 64000                         # bytes; 4,000 characters is at most 48 KB as JSON escapes, so this only stops a flood
MAX_EVENTS = 200
PROPOSAL_FIELDS = ("kind", "summary", "issue", "taskType", "lane", "branchType", "estMin", "estUsd")

DEFAULTS = {
    "maxRunning": 3, "maxChars": 4000, "perTurnUsd": 2, "dailyUsd": 40, "idleHours": 12, "maxTurns": 12,
    "fullAtTokens": 400000, "answerMinutes": 15, "yesMinutes": 30, "perActUsd": 10, "act": False,
    "cwd": "~/AppDevelopment/healthapp", "conductorDir": "~/AppDevelopment/conductor", "claudeBin": None,
    "ruleFile": "~/AppDevelopment/conductor/docs/agents/dashboard-chat.md",
}

# code -> (HTTP status, text). The texts are the CTO's final wording (MIN-4496); {Agent} is the display name.
REASONS = {
    "busy_session": (409, "{Agent} is still answering this chat."),
    "agent_busy": (409, "{Agent} is already working. Wait for it to finish, or stop it."),
    "cap_reached": (429, "3 agents are already answering. Try again when one finishes."),
    "chat_full": (409, "This chat is full. Start a new chat."),
    "budget_reached": (429, "Today's chat budget is used up. It resets at midnight."),
    "too_long": (413, "Keep it under 4,000 characters."),
    "chat_off": (503, "Chat is switched off on this Mac."),
    "finished": (409, "This chat is finished. Start a new chat."),
    "unknown_agent": (404, "No such agent."),
    "rate_limited": (503, "{Agent} is rate limited. Try again in a minute."),
    "act_off": (409, "Acting is switched off on this Mac. {Agent} can still answer."),
    "unknown_session": (404, "No such chat."),
    "unknown_proposal": (404, "No such request."),
    "empty": (400, "Write a message first."),
    "bad_request": (400, "Bad request."),
}
ERROR_TEXT = "{Agent} did not answer. Nothing was lost. Try again."

ANSWER_PROMPT = (
    "This is a direct question from the founder in the minhOS dashboard chat (healthapp). Answer it as yourself, briefly, in plain "
    "text. It is Q&A: no Linear issue, no Plan, Estimate, Skills or Actuals comments, and you have no write tools. Never paste or "
    "repeat the founder's exam or medical content. If he asks you to DO something (change code, write an issue, run anything), do "
    "not do it: say in one or two lines what you would do, then end your reply with exactly one block and nothing after it: "
    "<<<PROPOSAL {json} PROPOSAL>>> where json is one object with exactly these fields: kind (\"change\" for code, docs or config "
    "in healthapp, or \"handoff\" for a Linear issue or comment only), summary (at most 500 characters), issue (an existing "
    "\"MIN-1234\" or null), taskType (one row of your section of conductor/docs/agents/task-routing.md, exactly as written), lane "
    "(\"A\", \"B\" or \"C\"), branchType (\"feat\", \"fix\" or \"chore\"), estMin (whole minutes), estUsd (a number). If he only "
    "asks a question, add no block. Never merge, deploy, touch production, delete, spend money, run migrations or touch his exams."
)

LINEAR_WRITE = [
    "save_issue", "save_comment", "save_document", "save_project", "save_milestone", "save_status_update", "save_release",
    "save_release_note", "save_issue_label", "save_project_label", "save_diff_comment", "delete_comment", "delete_attachment",
    "delete_status_update", "delete_diff_comment", "merge_diff", "submit_diff_review", "share_issue", "unshare_issue",
    "retire_issue_label", "retire_project_label", "restore_issue_label", "restore_project_label", "update_diff",
    "create_attachment", "create_attachment_from_upload", "create_issue_label", "prepare_attachment_upload",
    "prepare_file_upload", "mark_notification", "resolve_diff_thread",
]
ALLOWED_TOOLS = ["Read", "Grep", "Glob", "ToolSearch", "TodoWrite"] + ["mcp__linear__" + n for n in sorted(G.LINEAR_READ)]
DISALLOWED_TOOLS = (["Edit", "Write", "NotebookEdit", "Bash", "Agent", "WebFetch", "WebSearch", "Skill",
                     "mcp__supabase", "mcp__cloudflare-docs", "mcp__cloudflare-bindings", "mcp__cloudflare-observability"]
                    + ["mcp__linear__" + n for n in LINEAR_WRITE])
FORBIDDEN_WORDS = re.compile(r"\b(merge[sd]?|merging|deploy\w*|production|delet\w+|drop|migrat\w+|force[- ]push|exams?)\b", re.I)

PROPOSAL_SPAN = re.compile(r"<<<PROPOSAL\b(.*?)PROPOSAL>>>", re.S)
LONE_MARKER = re.compile(r"<<<PROPOSAL|PROPOSAL>>>")
ISSUE_RE = re.compile(r"^[A-Z][A-Z0-9]{1,9}-\d{1,6}$")


# ----------------------------------------------------------------------------- small helpers

def iso(ts):
    return datetime.fromtimestamp(ts, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def parse_iso(s):
    try:
        return datetime.strptime(s, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc).timestamp()
    except (TypeError, ValueError):
        return 0.0


def last_ts(sess):
    return sess.get("lastTs") or parse_iso(sess.get("lastAt"))


def scrub(text):
    """Reply-safe text: key-shaped strings redacted, local paths shortened, nothing truncated (S.clean() is for one-line errors)."""
    text = S.SECRET_RE.sub("[redacted]", str(text))
    home = os.path.expanduser("~")
    if len(home) > 1:
        text = text.replace(home, "~")
    return re.sub(r"/(?:Users|home)/[^/\s:]+", "~", text)


def child_env(home_dir=None):
    """The child's environment, built from nothing (CTO decision on MIN-4497). Never copies os.environ: no ANTHROPIC_*, CLAUDE*,
    LINEAR_API_KEY_*, FAL_KEY, SUPABASE_*, CLOUDFLARE_*, *_KEY, *_TOKEN or *_SECRET can reach a child."""
    pw = pwd.getpwuid(os.getuid())
    home = pw.pw_dir
    tmp = os.path.join(home_dir or os.path.join(home, ".healthapp-dashboard"), "chat", "tmp")
    path = ":".join([os.path.join(home, ".local", "bin"), "/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin", "/usr/sbin", "/sbin"])
    return {"HOME": home, "USER": pw.pw_name, "LOGNAME": pw.pw_name, "TMPDIR": tmp, "LANG": "en_US.UTF-8", "PATH": path}


def find_claude(env):
    for d in env["PATH"].split(":"):
        p = os.path.join(d, "claude")
        if os.access(p, os.X_OK) and os.path.isfile(p):
            return p
    return None


def write_private(path, obj):
    tmp = "%s.%d.tmp" % (path, os.getpid())
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as f:
        json.dump(obj, f)
    os.replace(tmp, path)


# ----------------------------------------------------------------------------- proposal parsing (CTO decision dfe40a71, rule 1)

def validate_proposal_fields(obj):
    """The agent's proposal object, exactly as the schema says, or None. Strict: unknown or missing field, wrong type, wrong enum."""
    if not isinstance(obj, dict) or set(obj) != set(PROPOSAL_FIELDS):
        return None
    if obj["kind"] not in ("change", "handoff") or obj["lane"] not in ("A", "B", "C") or obj["branchType"] not in ("feat", "fix", "chore"):
        return None
    summary, task = obj["summary"], obj["taskType"]
    if not isinstance(summary, str) or not summary.strip() or len(summary) > 500:
        return None
    if not isinstance(task, str) or not task.strip() or len(task) > 200:
        return None
    issue = obj["issue"]
    if issue is not None and not (isinstance(issue, str) and ISSUE_RE.match(issue)):
        return None
    est_min, est_usd = obj["estMin"], obj["estUsd"]
    if isinstance(est_min, bool) or not isinstance(est_min, int) or not 1 <= est_min <= 1000:
        return None
    if isinstance(est_usd, bool) or not isinstance(est_usd, (int, float)) or not math.isfinite(est_usd) or not 0 <= est_usd <= 1000:
        return None
    return dict(obj)


def split_proposal(text):
    """(text with every proposal marker removed, proposal dict or None, rejected: bool). Only the agent's final text goes in.
    One block, last: exactly one span and nothing but whitespace after it. Anything else that carries a block is `rejected`."""
    text = str(text)
    spans = list(PROPOSAL_SPAN.finditer(text))
    stripped = LONE_MARKER.sub("", PROPOSAL_SPAN.sub("", text)).strip()
    if not spans:
        return stripped, None, bool(LONE_MARKER.search(text))
    # "Two blocks" is also caught by the trailing-text test (the first block is followed by the second); both are kept so each reads true alone.
    if len(spans) > 1 or text[spans[0].end():].strip():
        return stripped, None, True
    try:
        obj = json.loads(spans[0].group(1).strip())
    except ValueError:
        return stripped, None, True
    fields = validate_proposal_fields(obj)
    return stripped, fields, fields is None


# ----------------------------------------------------------------------------- routing table, through conductor's own code

class RowError(Exception):
    pass


def make_row_checker(conductor_dir):
    """(agent_file, task_type) -> (model, effort). Reads the row through conductor's `rows_by_role` and then asks
    `bin/require-agent-model` itself whether that dispatch passes, so there is no second copy of the table here."""
    conductor_dir = os.path.expanduser(conductor_dir)
    script = os.path.join(conductor_dir, "bin", "require-agent-model")

    def check(agent_file, task_type):
        try:
            loader = importlib.machinery.SourceFileLoader("conductor_require_agent_model", script)
            spec = importlib.util.spec_from_loader("conductor_require_agent_model", loader)
            mod = importlib.util.module_from_spec(spec)
            loader.exec_module(mod)
            with open(mod.TABLE, encoding="utf-8") as f:
                rows = mod.rows_by_role(f.read())
        except Exception:
            raise RowError("the routing table could not be read")
        row = (rows.get(agent_file) or {}).get(task_type.strip().strip("`*").lower())
        if not row:
            raise RowError("not a row of this agent")
        _task, models, efforts, _notes = row
        if not models or not efforts or "ultracode" in efforts:
            raise RowError("an ultracode or empty row")
        event = {"tool_name": "Agent", "tool_input": {"subagent_type": agent_file, "prompt": "task type: " + _task,
                                                      "model": models[0], "effort": efforts[0]}}
        try:
            r = subprocess.run([sys.executable, script], input=json.dumps(event), capture_output=True, text=True, timeout=15, env=child_env())
        except (OSError, subprocess.SubprocessError):
            raise RowError("require-agent-model did not run")
        if r.returncode != 0:
            raise RowError("require-agent-model refused the row")
        return models[0], efforts[0]
    return check


# ----------------------------------------------------------------------------- events (what the agent is doing; no text, ever)

def short_tool(name):
    m = re.match(r"^mcp__.+?__(.+)$", str(name))
    return re.sub(r"[^A-Za-z0-9_.-]", "_", (m.group(1) if m else str(name)))[:60] or "?"


def event_target(tool, tin, roots, labels):
    """A path relative to healthapp (or `conductor/<path>`), the first word of a Bash command, or None. Never the tool's input."""
    try:
        if not isinstance(tin, dict):
            return None
        if tool == "Bash":
            words = str(tin.get("command") or "").split()
            word = os.path.basename(words[0]) if words else ""
            return word[:40] if re.fullmatch(r"[A-Za-z0-9_.-]+", word) else None
        p = tin.get("file_path") or tin.get("path") or tin.get("notebook_path")
        if not p:
            return None
        real = G._real(p, roots[0] if roots else os.getcwd())
        if G.path_problem(real, roots):
            return None
        for r, label in zip(roots, labels):
            if G._inside(real, [r]):
                rel = os.path.relpath(real, r)
                target = (label + ("" if rel == "." else rel)) if label else rel
                target = S.clean(target)
                S.assert_clean(target)
                return target
    except Exception:
        return None
    return None


# ----------------------------------------------------------------------------- config

def load_config(home):
    """(settings dict, agents list) from <home>/hand-set.json (`config.chat`, `config.agents`); defaults when absent. No secret in it."""
    cfg = {}
    try:
        with open(os.path.join(home, "hand-set.json"), encoding="utf-8") as f:
            cfg = (json.load(f) or {}).get("config") or {}
    except (OSError, ValueError):
        pass
    settings = dict(DEFAULTS)
    settings.update({k: v for k, v in (cfg.get("chat") or {}).items() if k in DEFAULTS})
    return settings, list(cfg.get("agents") or [])


def read_key(home):
    try:
        with open(os.path.join(home, "chat.key"), encoding="utf-8") as f:
            key = f.read().strip()
    except OSError:
        return None
    return key if len(key) >= 32 else None


# ----------------------------------------------------------------------------- the service (state and rules; no HTTP in here)

class Turn:
    def __init__(self, sid, agent):
        self.sid, self.agent = sid, agent
        self.proc = None
        self.stopped = False
        self.timed_out = False
        self.started = time.time()


class Chat:
    def __init__(self, home, settings, agents, row_checker=None, now=time.time):
        self.home = home
        self.s = settings
        self.agents = {a["n"]: a for a in agents if isinstance(a, dict) and a.get("n")}
        self.now = now
        self.row_checker = row_checker or make_row_checker(settings["conductorDir"])
        self.dir = os.path.join(home, "chat")
        os.makedirs(os.path.join(self.dir, "tmp"), mode=0o700, exist_ok=True)
        os.chmod(self.dir, 0o700)
        self.lock = threading.RLock()
        self.sessions = {}
        self.turns = {}
        self.events = {}
        self.ledger = []
        self.closing = False
        self._load()

    # --- config helpers
    def act_enabled(self):
        return bool(self.s.get("act")) and ACT_BUILT

    def is_off(self):
        return os.path.exists(os.path.join(self.home, "chat.off"))

    def roots(self):
        return [os.path.realpath(os.path.expanduser(self.s["cwd"])), os.path.realpath(os.path.expanduser(self.s["conductorDir"]))]

    def agent_file(self, a):
        return a.get("agentFile") or a.get("agentType")

    def agent_chat(self, a):
        c = a.get("chat") or {}
        cto = self.agent_file(a) == "cto-minhos"
        return {"model": c.get("model") or ("fable" if cto else "sonnet"), "effort": c.get("effort") or "medium"}

    def reason(self, code, agent=""):
        status, text = REASONS[code]
        return status, {"refused": code, "reason": text.replace("{Agent}", agent or "The agent")}

    # --- storage
    def _path(self, sid):
        return os.path.join(self.dir, sid + ".json")

    def _save(self, sess):
        write_private(self._path(sess["id"]), sess)

    def _load(self):
        for name in sorted(os.listdir(self.dir)):
            if not re.fullmatch(r"[0-9a-f]{32}\.json", name):
                continue
            try:
                with open(os.path.join(self.dir, name), encoding="utf-8") as f:
                    sess = json.load(f)
                if sess.get("id") != name[:-5] or not isinstance(sess.get("messages"), list):
                    continue
            except (OSError, ValueError):
                continue
            if sess.get("pending"):      # the bridge restarted during a turn: it becomes one error message
                sess["pending"] = False
                sess["messages"].append({"role": "error", "text": "The bridge restarted while %s was answering. Try again." % sess.get("agent", "the agent"),
                                         "at": iso(self.now()), "costUsd": None})
                self._save(sess)
            self.sessions[sess["id"]] = sess
            for m in sess["messages"]:
                if isinstance(m.get("costUsd"), (int, float)) and m["costUsd"] > 0:
                    self.ledger.append((parse_iso(m.get("at")), float(m["costUsd"])))

    def _log(self, line):
        try:
            fd = os.open(os.path.join(self.home, "chat.log"), os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o600)
            with os.fdopen(fd, "a") as f:
                f.write("%s %s\n" % (iso(self.now()), line))
        except OSError:
            pass

    # --- views
    def spent_today(self):
        today = datetime.fromtimestamp(self.now()).date()
        return round(sum(c for ts, c in self.ledger if datetime.fromtimestamp(ts).date() == today), 4)

    def state_of(self, sess):
        if sess["id"] in self.turns:
            return "working"
        if self.is_full(sess) or self.now() - last_ts(sess) > self.s["idleHours"] * 3600:
            return "finished"
        return "waiting"

    def is_full(self, sess):
        return sess["turns"] >= self.s["maxTurns"] or sess.get("contextTokens", 0) >= self.s["fullAtTokens"]

    def session_view(self, sess):
        return {"id": sess["id"], "agent": sess["agent"], "title": scrub(sess["title"]), "startedAt": sess["startedAt"],
                "lastAt": sess["lastAt"], "state": self.state_of(sess), "turns": sess["turns"], "costUsd": round(sess["costUsd"], 4),
                "full": self.is_full(sess), "worktree": False, "branch": None}

    def message_view(self, m):
        out = {"role": m["role"], "text": scrub(m.get("text", "")), "at": m["at"], "costUsd": m.get("costUsd")}
        if m.get("proposal"):
            p = dict(m["proposal"])
            if p["status"] == "open" and self.now() > parse_iso(p["expiresAt"]):
                p["status"] = "expired"
            p["summary"] = scrub(p["summary"])
            out["proposal"] = p
        return out

    def health(self):
        with self.lock:
            return {"ok": True, "off": self.is_off(), "running": len(self.turns), "maxRunning": self.s["maxRunning"],
                    "spentTodayUsd": self.spent_today(), "dailyUsd": self.s["dailyUsd"], "act": self.act_enabled(), "acting": 0}

    def list_sessions(self, agent):
        if agent not in self.agents:
            return self.reason("unknown_agent")
        with self.lock:
            items = sorted((s for s in self.sessions.values() if s["agent"] == agent), key=last_ts, reverse=True)
            return 200, {"agent": agent, "sessions": [self.session_view(s) for s in items]}

    def get_session(self, sid):
        with self.lock:
            sess = self.sessions.get(sid)
            if not sess:
                return self.reason("unknown_session")
            return 200, {"session": self.session_view(sess), "messages": [self.message_view(m) for m in sess["messages"]]}

    def get_events(self, sid, after):
        with self.lock:
            sess = self.sessions.get(sid)
            if not sess:
                return self.reason("unknown_session")
            ev = self.events.get(sid)
            items = [e for e in (ev["items"] if ev else []) if e["n"] > after]
            return 200, {"state": self.state_of(sess), "events": items}

    # --- admission (the caps; every one has a test)
    def _admit(self, agent_name, sess, text):
        if self.is_off() or self.closing:
            return self.reason("chat_off", agent_name)
        if not isinstance(text, str) or not text.strip():
            return self.reason("empty", agent_name)
        if len(text) > self.s["maxChars"]:
            return self.reason("too_long", agent_name)
        if sess is not None:
            state = self.state_of(sess)
            if state == "working":
                return self.reason("busy_session", agent_name)
            if state == "finished":
                return self.reason("chat_full" if self.is_full(sess) else "finished", agent_name)
        if any(t.agent == agent_name for t in self.turns.values()):
            return self.reason("agent_busy", agent_name)
        if len(self.turns) >= self.s["maxRunning"]:
            return self.reason("cap_reached", agent_name)
        # a turn is admitted only when today's spend plus the per-turn cap fits the day's budget
        if self.spent_today() + self.s["perTurnUsd"] > self.s["dailyUsd"]:
            return self.reason("budget_reached", agent_name)
        return None

    def create(self, agent_name, text):
        with self.lock:
            if agent_name not in self.agents:
                return self.reason("unknown_agent")
            refused = self._admit(agent_name, None, text)
            if refused:
                return refused
            now = self.now()
            sid = uuid.uuid4().hex
            title = re.sub(r"\s+", " ", text).strip()[:60]
            sess = {"id": sid, "agent": agent_name, "title": title, "startedAt": iso(now), "lastAt": iso(now), "lastTs": now,
                    "claudeSession": str(uuid.UUID(sid)), "resumable": False, "turns": 0, "costUsd": 0.0, "contextTokens": 0,
                    "pending": False, "messages": []}
            self.sessions[sid] = sess
            return self._begin_turn(sess, text)

    def send(self, sid, text):
        with self.lock:
            sess = self.sessions.get(sid)
            if not sess:
                return self.reason("unknown_session")
            refused = self._admit(sess["agent"], sess, text)
            if refused:
                return refused
            for m in sess["messages"]:      # a text message declines an open proposal
                if m.get("proposal") and m["proposal"]["status"] == "open":
                    m["proposal"]["status"] = "declined"
            return self._begin_turn(sess, text)

    def _begin_turn(self, sess, text):
        now = self.now()
        sess["messages"].append({"role": "you", "text": text, "at": iso(now), "costUsd": None})
        sess["lastAt"], sess["lastTs"] = iso(now), now
        sess["pending"] = True
        self._save(sess)
        turn = Turn(sess["id"], sess["agent"])
        self.turns[sess["id"]] = turn
        ev = self.events.setdefault(sess["id"], {"n": 0, "items": collections.deque(maxlen=MAX_EVENTS)})
        ev["items"].clear()                  # cleared when the next turn starts; `n` keeps counting so a poller never misses
        threading.Thread(target=self._run_turn, args=(turn, text), daemon=True).start()
        return 202, {"session": self.session_view(sess)}

    # --- the turn
    def build_argv(self, sess, a, claude_bin):
        c = self.agent_chat(a)
        short = sess["id"][:8]
        guard = os.path.join(HERE, "chat_guard.py")
        cmd = shlex.join([sys.executable, guard, "--mode", "answer", "--roots", os.pathsep.join(self.roots()), "--home", self.home, "--sid", short])
        settings = {"hooks": {"PreToolUse": [{"matcher": ".*", "hooks": [{"type": "command", "command": cmd}]}]}}
        argv = [claude_bin, "-p", "--agent", self.agent_file(a)]
        argv += ["--resume" if sess["resumable"] else "--session-id", sess["claudeSession"]]
        argv += ["--output-format", "stream-json", "--verbose", "--model", str(c["model"]), "--effort", str(c["effort"]),
                 "--permission-mode", "dontAsk", "--allowedTools"] + ALLOWED_TOOLS + ["--disallowedTools"] + DISALLOWED_TOOLS
        argv += ["--max-budget-usd", "%g" % self.s["perTurnUsd"], "--settings", json.dumps(settings), "--append-system-prompt", ANSWER_PROMPT]
        return argv

    def _run_turn(self, turn, text):
        sid = turn.sid
        started = time.time()
        result, error = None, None
        try:
            with self.lock:
                sess = self.sessions[sid]
                a = self.agents[sess["agent"]]
                env = child_env(self.home)
                os.makedirs(env["TMPDIR"], mode=0o700, exist_ok=True)
                claude_bin = self.s.get("claudeBin") or find_claude(env)
                argv = self.build_argv(sess, a, claude_bin) if claude_bin else None
            if not argv:
                raise OSError("claude not found")
            cwd = os.path.expanduser(self.s["cwd"])
            proc = subprocess.Popen(argv, cwd=cwd, env=env, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                                    start_new_session=True, close_fds=True, text=True, encoding="utf-8", errors="replace")
            turn.proc = proc
            if turn.stopped or self.closing:          # a Stop or a shutdown that came before the process existed
                self._kill(turn, None)
            timer = threading.Timer(self.s["answerMinutes"] * 60, self._kill, args=(turn, "timed_out"))
            timer.daemon = True
            timer.start()
            try:
                proc.stdin.write(text)
                proc.stdin.close()
            except (OSError, ValueError):
                pass
            roots, labels = self.roots(), ["", "conductor/"]
            for line in proc.stdout:                                  # read line by line; the raw stream is never written to disk
                try:
                    obj = json.loads(line)
                except ValueError:
                    continue
                if not isinstance(obj, dict):
                    continue
                if obj.get("type") == "assistant":
                    content = (obj.get("message") or {}).get("content")
                    for block in content if isinstance(content, list) else []:
                        if isinstance(block, dict) and block.get("type") == "tool_use":
                            self._add_event(sid, block.get("name"), event_target(block.get("name"), block.get("input"), roots, labels))
                elif obj.get("type") == "result":
                    result = obj
            try:
                proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                self._kill(turn, None)
            timer.cancel()
            code = proc.returncode
        except Exception as exc:                                       # a failure to even start is one error message too
            error, code = "start", None
            if turn.proc is not None:
                self._kill(turn, None)
            self._log("turn error agent=%s sid=%s kind=%s" % (turn.agent, sid[:8], type(exc).__name__))
        self._finish(turn, result, code, error, time.time() - started, self._prepare(turn, result))

    def _prepare(self, turn, result):
        """Parse the final text and check the proposal's row with NO lock held: the row check runs conductor's hook (a subprocess)."""
        if result is None:
            return None
        text, proposal, rejected = split_proposal(str(result.get("result") or ""))
        row = None
        if proposal:
            try:
                row = self.row_checker(self.agent_file(self.agents[turn.agent]), proposal["taskType"])
            except RowError:
                row = RowError()
        return text, proposal, rejected, row

    def _add_event(self, sid, tool, target):
        with self.lock:
            ev = self.events.setdefault(sid, {"n": 0, "items": collections.deque(maxlen=MAX_EVENTS)})
            ev["n"] += 1
            ev["items"].append({"n": ev["n"], "at": iso(self.now()), "tool": short_tool(tool), "target": target})

    def _finish(self, turn, result, code, start_error, seconds, prepared):
        sid = turn.sid
        with self.lock:
            sess = self.sessions[sid]
            agent = sess["agent"]
            cost, tokens = 0.0, None
            msg, msg_proposal, cost_booked = None, None, False
            outcome = "ok"
            if result is not None:
                c = result.get("total_cost_usd")
                cost = max(0.0, min(float(c), 1000.0)) if isinstance(c, (int, float)) and not isinstance(c, bool) and math.isfinite(c) else 0.0
                u = result.get("usage") or {}
                if isinstance(u, dict):
                    tokens = sum(int(u.get(k) or 0) for k in ("input_tokens", "cache_creation_input_tokens", "cache_read_input_tokens"))
            if turn.stopped:
                outcome, msg = "stopped", ("error", "Stopped by you.")
            elif turn.timed_out:
                outcome, msg = "timeout", ("error", "%s took more than %g minutes and was stopped." % (agent, self.s["answerMinutes"]))
            elif start_error or result is None or result.get("is_error") or code not in (0, None):
                outcome = "error"
                blob = str((result or {}).get("result") or "").lower()
                msg = ("error", REASONS["rate_limited"][1].replace("{Agent}", agent) if re.search(r"rate.?limit|overloaded|\b429\b", blob)
                       else ERROR_TEXT.replace("{Agent}", agent))
            else:
                if cost:
                    self.ledger.append((self.now(), cost))          # before the proposal, so its "spent today" includes this turn
                    cost_booked = True
                text, proposal, rejected, row = prepared
                if rejected:
                    self._log("proposal_rejected sid=%s" % sid[:8])
                msg = ("agent", text)
                if proposal:
                    msg_proposal = self._make_proposal(proposal, row)
            at = iso(self.now())
            role, body = msg
            sess["messages"].append({"role": role, "text": body, "at": at, "costUsd": round(cost, 4) if cost else None})
            if msg_proposal:
                sess["messages"].append({"role": "proposal", "text": "", "at": at, "costUsd": None, "proposal": msg_proposal})
            if result is not None and not result.get("is_error"):
                sess["resumable"] = True          # only a turn that answered is resumed; a failed first turn starts again with --session-id
            sess["turns"] += 1
            sess["costUsd"] += cost
            if tokens is not None:
                sess["contextTokens"] = tokens
            sess["lastAt"], sess["lastTs"] = at, self.now()
            sess["pending"] = False
            if cost and not cost_booked:
                self.ledger.append((self.now(), cost))
            self._save(sess)
            self._log("turn kind=answer agent=%s sid=%s result=%s seconds=%d cost=%.4f" % (agent, sid[:8], outcome, seconds, cost))
            self.turns.pop(sid, None)            # last: "no turn running" is only true once the transcript and the log line are written

    def _make_proposal(self, raw, row):
        """Validate the agent's proposal before the founder sees it (run 1 only shows it; a Yes is `act_off`). `row` is the row check's
        (model, effort), or a RowError instance."""
        refused, model, effort = None, None, None
        if isinstance(row, RowError):
            refused = "bad_row"
        else:
            model, effort = row
        if FORBIDDEN_WORDS.search(raw["summary"]) or raw["estUsd"] > self.s["perActUsd"]:
            refused = "forbidden"
        elif refused is None and self.spent_today() + raw["estUsd"] > self.s["dailyUsd"]:
            refused = "budget_reached"
        p = dict(raw)
        p.update({"id": uuid.uuid4().hex[:12], "model": model, "effort": effort, "branch": None, "spentTodayUsd": self.spent_today(),
                  "expiresAt": iso(self.now() + self.s["yesMinutes"] * 60), "status": "refused" if refused else "open"})
        if refused:
            p["refused"] = refused
        return p

    # --- Yes / No / Stop
    def answer_proposal(self, sid, pid, yes):
        with self.lock:
            sess = self.sessions.get(sid)
            if not sess:
                return self.reason("unknown_session")
            prop = next((m["proposal"] for m in sess["messages"] if m.get("proposal") and m["proposal"]["id"] == pid), None)
            if not prop:
                return self.reason("unknown_proposal")
            if yes:
                # Run 1: nothing acts. With `act` false, or while the act turn is not built, a Yes runs nothing.
                return self.reason("act_off", sess["agent"])
            if prop["status"] == "open":
                prop["status"] = "declined"
                self._save(sess)
            return 200, {"session": self.session_view(sess)}

    def stop(self, sid):
        with self.lock:
            sess = self.sessions.get(sid)
            if not sess:
                return self.reason("unknown_session")
            turn = self.turns.get(sid)
        if turn:
            self._kill(turn, "stopped")
        return 200, {"session": self.session_view(sess)}

    def _kill(self, turn, why):
        """SIGTERM the turn's whole process group, SIGKILL three seconds later. Never our own group."""
        if why == "stopped":
            turn.stopped = True
        elif why == "timed_out":
            turn.timed_out = True
        proc = turn.proc
        if proc is None or proc.poll() is not None:
            return
        try:
            pgid = os.getpgid(proc.pid)
            if pgid != proc.pid or pgid == os.getpgrp() or pgid <= 1:
                proc.terminate()
                return
            os.killpg(pgid, signal.SIGTERM)
        except (ProcessLookupError, PermissionError):
            return

        def hard():
            time.sleep(3)
            try:
                os.killpg(pgid, signal.SIGKILL)
            except (ProcessLookupError, PermissionError):
                pass
        threading.Thread(target=hard, daemon=True).start()

    def shutdown(self):
        """SIGTERM or the kill switch: no new turns, and every process group the bridge started ends."""
        with self.lock:
            self.closing = True
            turns = list(self.turns.values())
        for t in turns:
            self._kill(t, "stopped")
        deadline = time.time() + 5
        while time.time() < deadline and self.turns:
            time.sleep(0.05)


# ----------------------------------------------------------------------------- HTTP

def request_ok(headers, method, port, key):
    """Host, Origin, Sec-Fetch-Site and the key (CTO decision dfe40a71, rule 2). False means 403 with an empty body."""
    for name in ("Host", "Origin", "Sec-Fetch-Site", "x-chat-key", "Content-Type"):
        if len(headers.get_all(name) or []) > 1:
            return False
    if headers.get("Host") != "%s:%d" % (BIND, port):
        return False
    origin, expected = headers.get("Origin"), "http://%s:%d" % (BIND, port)
    if method == "POST":
        if origin != expected:                      # required on POST; `null` and a missing header both fail here
            return False
    elif origin is not None and origin != expected:
        return False
    sfs = headers.get("Sec-Fetch-Site")
    if sfs is not None and sfs != "same-origin":
        return False
    supplied = headers.get("x-chat-key")
    if not key or not supplied:
        return False
    return hmac.compare_digest(supplied.encode("utf-8", "replace"), key.encode("utf-8"))


class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

    def __init__(self, port, handler, chat, key):
        super().__init__((BIND, port), handler)       # the only bind: 127.0.0.1
        self.chat, self.key = chat, key
        self.port = self.server_address[1]


class Handler(http.server.SimpleHTTPRequestHandler):
    server_version = "HealthappChat/1"
    timeout = 20

    def log_message(self, *args):                    # the default log has the request line; chat.log has what we want
        pass

    def _json(self, status, body):
        try:
            data = json.dumps(body)
            S.assert_clean(data)
        except Exception:
            status, data = 500, "{}"
        raw = data.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(raw)

    def _is_chat(self):
        p = urllib.parse.urlsplit(self.path).path
        return p == "/chat" or p.startswith("/chat/")

    def _refuse(self, status=403):
        self._json(status, {})

    def do_OPTIONS(self):                            # no preflight is ever answered: a page on another origin cannot send the key header
        self._refuse(403)

    def do_PUT(self):
        self._refuse(403 if self._is_chat() else 405)

    do_DELETE = do_PATCH = do_PUT

    def do_HEAD(self):
        if self._is_chat():
            return self._refuse(403)
        super().do_HEAD()

    def do_GET(self):
        if not self._is_chat():
            return super().do_GET()
        srv = self.server
        if srv.key is None:
            return self._refuse(503)
        if not request_ok(self.headers, "GET", srv.port, srv.key):
            return self._refuse(403)
        parts = urllib.parse.urlsplit(self.path)
        q = urllib.parse.parse_qs(parts.query)
        segs = [s for s in parts.path.split("/") if s]            # ["chat", ...]
        chat = srv.chat
        if segs == ["chat", "health"]:
            return self._json(200, chat.health())
        if segs == ["chat", "sessions"]:
            return self._json(*chat.list_sessions((q.get("agent") or [""])[0]))
        if len(segs) == 3 and segs[:2] == ["chat", "sessions"]:
            return self._json(*chat.get_session(segs[2]))
        if len(segs) == 4 and segs[:2] == ["chat", "sessions"] and segs[3] == "events":
            try:
                after = int((q.get("after") or ["0"])[0])
            except ValueError:
                return self._json(*chat.reason("bad_request"))
            return self._json(*chat.get_events(segs[2], after))
        self._json(404, {})

    def do_POST(self):
        if not self._is_chat():
            return self._refuse(405)
        srv = self.server
        if srv.key is None:
            return self._refuse(503)
        if not request_ok(self.headers, "POST", srv.port, srv.key):
            return self._refuse(403)
        ctype = (self.headers.get("Content-Type") or "").split(";")[0].strip().lower()
        if ctype != "application/json":
            return self._refuse(403)
        chat = srv.chat
        if self.headers.get("Transfer-Encoding"):
            return self._json(*chat.reason("bad_request"))
        try:
            n = int(self.headers.get("Content-Length") or "")
        except ValueError:
            return self._json(*chat.reason("bad_request"))
        if n < 0:
            return self._json(*chat.reason("bad_request"))
        if n > MAX_BODY:
            return self._json(*chat.reason("too_long"))
        try:
            body = json.loads(self.rfile.read(n) or b"{}")
        except ValueError:
            return self._json(*chat.reason("bad_request"))
        if not isinstance(body, dict):
            return self._json(*chat.reason("bad_request"))
        segs = [s for s in urllib.parse.urlsplit(self.path).path.split("/") if s]
        text = body.get("text")
        if segs == ["chat", "sessions"]:
            if not isinstance(body.get("agent"), str) or not isinstance(text, str):
                return self._json(*chat.reason("bad_request"))
            return self._json(*chat.create(body["agent"], text))
        if len(segs) == 4 and segs[:2] == ["chat", "sessions"] and segs[3] == "messages":
            if not isinstance(text, str):
                return self._json(*chat.reason("bad_request"))
            return self._json(*chat.send(segs[2], text))
        if len(segs) == 4 and segs[:2] == ["chat", "sessions"] and segs[3] == "stop":
            return self._json(*chat.stop(segs[2]))
        if len(segs) == 6 and segs[:2] == ["chat", "sessions"] and segs[3] == "proposals" and segs[5] in ("yes", "no"):
            return self._json(*chat.answer_proposal(segs[2], segs[4], segs[5] == "yes"))
        self._json(404, {})


def make_server(home, page_dir, port, settings=None, agents=None, key="unset", row_checker=None):
    """A ready server. `key="unset"` reads <home>/chat.key; None means /chat answers 503 to everything."""
    home = os.path.abspath(os.path.expanduser(home))
    page_dir = os.path.realpath(os.path.expanduser(page_dir))
    h = os.path.realpath(home)
    if page_dir == h or page_dir.startswith(h + os.sep) or h.startswith(page_dir + os.sep):
        raise SystemExit("refusing to start: the page folder and the dashboard home folder overlap (the keys would be served)")
    if settings is None:
        settings, agents = load_config(home)
    if key == "unset":
        key = read_key(home)
    chat = Chat(home, settings, agents or [], row_checker=row_checker)
    return Server(port, functools.partial(Handler, directory=page_dir), chat, key)


def main(argv=None):
    ap = argparse.ArgumentParser(description="Dashboard chat bridge (binds 127.0.0.1 only).")
    ap.add_argument("--home", default=os.path.expanduser("~/.healthapp-dashboard"))
    ap.add_argument("--page-dir", required=True, help="the dashboard page folder to serve (docs/dashboard/drafts)")
    ap.add_argument("--port", type=int, default=8765)
    args = ap.parse_args(argv)
    srv = make_server(args.home, args.page_dir, args.port)

    def stop(*_):
        threading.Thread(target=srv.shutdown, daemon=True).start()
    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    print("chat bridge on %s:%d, page folder %s, chat %s, act %s" % (BIND, srv.port, os.path.realpath(args.page_dir),
          "on" if srv.key else "OFF (no chat.key of 32+ characters)", "on" if srv.chat.act_enabled() else "off"), flush=True)
    try:
        srv.serve_forever()
    finally:
        srv.chat.shutdown()          # no process group the bridge started outlives it
        srv.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
