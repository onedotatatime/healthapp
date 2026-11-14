"""Shared test kit for the dashboard chat tests (MIN-4497): a stub `claude`, a throw-away home, a running bridge on port 0."""
import http.client
import json
import os
import sys
import tempfile
import threading
import time
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import chat_bridge as B  # noqa: E402

KEY = "k" * 40

STUB = '''#!%(python)s
import json, os, subprocess, sys, time
d = %(dir)r
beh = {}
try:
    beh = json.load(open(os.path.join(d, "behavior.json")))
except Exception:
    pass
stdin = sys.stdin.read()
env = {k: v for k, v in os.environ.items() if k != "__CF_USER_TEXT_ENCODING"}
json.dump({"argv": sys.argv, "env": env, "cwd": os.getcwd(), "stdin": stdin, "pid": os.getpid()}, open(os.path.join(d, "rec-%%017.5f-%%d.json" %% (time.time(), os.getpid())), "w"))
if beh.get("child"):
    c = subprocess.Popen(["sleep", "120"])
    open(os.path.join(d, "child.pid"), "w").write(str(c.pid))
out = sys.stdout
def emit(o):
    out.write(json.dumps(o) + "\\n"); out.flush()
emit({"type": "system", "subtype": "init"})
for e in beh.get("events", []):
    emit({"type": "assistant", "message": {"content": [{"type": "tool_use", "name": e["name"], "input": e.get("input", {})}]}})
if beh.get("sleep"):
    time.sleep(beh["sleep"])
if not beh.get("no_result"):
    emit({"type": "result", "subtype": "success", "is_error": bool(beh.get("is_error")), "result": beh.get("reply", "ok"),
          "total_cost_usd": beh.get("cost", 0.1), "usage": beh.get("usage", {"input_tokens": 10, "cache_creation_input_tokens": 100, "cache_read_input_tokens": 0, "output_tokens": 5}),
          "session_id": "x"})
sys.exit(beh.get("exit", 0))
'''


def wait_for(cond, timeout=10.0, step=0.02):
    end = time.time() + timeout
    while time.time() < end:
        if cond():
            return True
        time.sleep(step)
    return False


def good_proposal(**over):
    p = {"kind": "change", "summary": "Add a footer link", "issue": "MIN-4497", "taskType": "API and edge functions", "lane": "A",
         "branchType": "feat", "estMin": 20, "estUsd": 1.5}
    p.update(over)
    return p


def block(p):
    return "<<<PROPOSAL " + json.dumps(p) + " PROPOSAL>>>"


def fake_rows(agent_file, task):
    if task.strip().lower() in ("nope", "ultracode row"):
        raise B.RowError("not a row")
    return "sonnet", "high"


AGENTS = [{"n": n, "role": r, "agentType": f} for n, r, f in [
    ("Pix", "Design", "design-minhos"), ("Cron", "Backend", "backend-minhos"), ("Ren", "Frontend", "frontend-minhos"),
    ("Back", "Product", "product-minhos"), ("CTO", "CTO", "cto-minhos")]]


class Env:
    """A temp dashboard home, a fake healthapp and conductor, a stub claude, and a bridge listening on 127.0.0.1 port 0."""

    def __init__(self, **cfg):
        self.tmp = tempfile.mkdtemp(prefix="chatkit-")
        self.tmp = os.path.realpath(self.tmp)
        j = lambda *p: os.path.join(self.tmp, *p)
        for d in ("home", "pages", "healthapp/src", "conductor/docs", "stub"):
            os.makedirs(j(d))
        for rel, body in (("pages/index.html", "<h1>page</h1>"), ("healthapp/src/x.ts", "x"), ("healthapp/.env", "SECRET=1"),
                          ("conductor/docs/a.md", "a")):
            with open(j(*rel.split("/")), "w") as f:
                f.write(body)
        self.stub = j("stub", "claude")
        with open(self.stub, "w") as f:
            f.write(STUB % {"python": sys.executable, "dir": j("stub")})
        os.chmod(self.stub, 0o755)
        self.dir = j("stub")
        self.home, self.pages, self.cwd, self.conductor = j("home"), j("pages"), j("healthapp"), j("conductor")
        self.settings = dict(B.DEFAULTS)
        self.settings.update({"cwd": self.cwd, "conductorDir": self.conductor, "claudeBin": self.stub})
        self.settings.update(cfg)
        self.set_behavior()
        self.server = B.make_server(self.home, self.pages, 0, self.settings, [dict(a) for a in AGENTS], key=KEY, row_checker=fake_rows)
        self.chat, self.port = self.server.chat, self.server.port
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def set_behavior(self, **beh):
        with open(os.path.join(self.dir, "behavior.json"), "w") as f:
            json.dump(beh, f)

    def records(self):
        return sorted(f for f in os.listdir(self.dir) if f.startswith("rec-"))

    def record(self, i=-1):
        with open(os.path.join(self.dir, self.records()[i])) as f:
            return json.load(f)

    def call(self, method, path, body=None, headers=None, origin=True, key=True, ctype=True, host=None):
        h = {}
        if origin:
            h["Origin"] = "http://127.0.0.1:%d" % self.port
        if key:
            h["x-chat-key"] = KEY
        data = None
        if body is not None:
            data = body if isinstance(body, bytes) else json.dumps(body).encode()
            if ctype:
                h["Content-Type"] = "application/json"
        h.update(headers or {})
        h = {k: v for k, v in h.items() if v is not None}
        c = http.client.HTTPConnection("127.0.0.1", self.port, timeout=15)
        c.putrequest(method, path, skip_host=True)
        c.putheader("Host", host or "127.0.0.1:%d" % self.port)
        for k, v in h.items():
            c.putheader(k, v)
        if data is not None:
            c.putheader("Content-Length", str(len(data)))
        c.endheaders(data)
        r = c.getresponse()
        raw = r.read()
        hdrs = {k.lower(): v for k, v in r.getheaders()}
        c.close()
        try:
            return r.status, json.loads(raw or b"{}"), hdrs
        except ValueError:
            return r.status, raw, hdrs

    def post(self, path, body, **kw):
        return self.call("POST", path, body, **kw)

    def get(self, path, **kw):
        return self.call("GET", path, **kw)

    def start_chat(self, agent="Pix", text="hello"):
        st, body, _ = self.post("/chat/sessions", {"agent": agent, "text": text})
        assert st == 202, (st, body)
        return body["session"]["id"]

    def wait_idle(self, timeout=10.0):
        assert wait_for(lambda: not self.chat.turns, timeout), "a turn is still running"

    def close(self):
        self.chat.shutdown()
        self.server.shutdown()
        self.server.server_close()
        os.system("rm -rf %s" % self.tmp)


class ChatCase(unittest.TestCase):
    def make(self, **cfg):
        env = Env(**cfg)
        self.addCleanup(env.close)
        return env
