"""A mock of the chat bridge for looking at every state of the page (MIN-4498), including the act states the real bridge does not build yet.
Serves the page folder and /chat/* from dashboard/fixtures/chat.example.json, in memory, on 127.0.0.1. No model, no network, no real data.

    python3 dashboard/tests/chat_mock_server.py [--port 8770] [--key <throw-away key>] [--act]

Open  http://127.0.0.1:<port>/direction-A/index.html?feed=../dev/fresh.json#c=<key>  once. Behaviour:
- a new message: the agent is "working" for 4 s, then answers with a stub text (a message that contains "do it" also gets a proposal);
- Yes on an open proposal: with --act the session is "acting" for 10 s (events appear), then a Done result; without --act it answers act_off;
- No: declined. Stop: a Stopped result. POST /chat/_mock {"act": bool, "off": bool, "running": n} flips the health flags (no key needed, mock only).
"""
import argparse
import http.server
import json
import os
import socketserver
import sys
import threading
import time
import uuid
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
PAGES = os.path.join(ROOT, "docs", "dashboard", "drafts")
FIXTURE = os.path.join(ROOT, "dashboard", "fixtures", "chat.example.json")
ROLES = {"Back": "Product", "Anna": "Marketing", "Pix": "Design", "Ren": "Frontend", "Cron": "Backend", "CTO": "CTO", "Spast": "Sales", "Release": "Release", "CEO": "CEO", "E2E": "E2E"}
REASONS = {"act_off": (409, "Acting is switched off on this Mac. {A} can still answer."), "unknown_session": (404, "No such chat."), "agent_busy": (409, "{A} is already working. Wait for it to finish, or stop it."),
           "busy_session": (409, "{A} is still answering this chat."), "unknown_proposal": (404, "No such request."), "yes_expired": (410, "This request expired. Ask again.")}


def iso(t):
    return datetime.fromtimestamp(t, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


class Mock:
    def __init__(self, act):
        self.lock = threading.Lock()
        self.flags = {"act": act, "off": False, "running": 0}
        self.sessions, self.events, self.n = {}, {}, {}
        t0 = time.time()
        for agent, specs in json.load(open(FIXTURE))["agents"].items():
            for sp in specs:
                msgs = []
                for m in sp["messages"]:
                    m = dict(m, at=iso(t0 - m.pop("agoSec", 0)))
                    m.setdefault("costUsd", None)
                    p = m.get("proposal")
                    if p:
                        p["expiresAt"] = iso(t0 + p.pop("expiresInMin", 20) * 60)
                    msgs.append(m)
                self.sessions[sp["id"]] = {"id": sp["id"], "agent": agent, "title": sp["title"], "startedAt": msgs[0]["at"], "lastAt": iso(t0 - sp.get("agoSec", 0)), "state": sp["state"],
                                           "turns": sp["turns"], "costUsd": sp["costUsd"], "full": bool(sp.get("full")), "worktree": bool(sp.get("branch")), "branch": sp.get("branch"), "messages": msgs}
                self.events[sp["id"]] = [dict(e, n=i + 1, at=iso(t0 - 60 + i * 20)) for i, e in enumerate(sp.get("events", []))]
                self.n[sp["id"]] = len(self.events[sp["id"]])

    def view(self, s):
        return {k: v for k, v in s.items() if k != "messages"}

    def refuse(self, code, agent="the agent"):
        st, text = REASONS[code]
        return st, {"refused": code, "reason": text.replace("{A}", agent)}

    def add_event(self, sid, tool, target):
        self.n[sid] += 1
        self.events[sid].append({"n": self.n[sid], "at": iso(time.time()), "tool": tool, "target": target})

    def post_message(self, agent, sid, text):
        with self.lock:
            if sid is None:
                sid = uuid.uuid4().hex[:12]
                self.sessions[sid] = {"id": sid, "agent": agent, "title": text[:60], "startedAt": iso(time.time()), "lastAt": iso(time.time()), "state": "waiting", "turns": 0, "costUsd": 0.0,
                                      "full": False, "worktree": False, "branch": None, "messages": []}
                self.events[sid], self.n[sid] = [], 0
            s = self.sessions.get(sid)
            if not s:
                return self.refuse("unknown_session")
            if any(x["agent"] == s["agent"] and x["state"] in ("working", "acting") for x in self.sessions.values()):
                return self.refuse("agent_busy", s["agent"])
            for m in s["messages"]:
                if m.get("proposal") and m["proposal"]["status"] == "open":
                    m["proposal"]["status"] = "declined"
            s["messages"].append({"role": "you", "text": text, "at": iso(time.time()), "costUsd": None})
            s.update(state="working", lastAt=iso(time.time()))
            self.events[sid] = []
        threading.Thread(target=self._answer, args=(sid, text), daemon=True).start()
        return 202, {"session": self.view(s)}

    def _answer(self, sid, text):
        for i, (tool, target) in enumerate((("Read", "dashboard/chat_bridge.py"), ("Grep", "docs/dashboard/drafts"), ("Read", "conductor/docs/agents/task-routing.md"))):
            time.sleep(1.2)
            with self.lock:
                if self.sessions[sid]["state"] != "working":
                    return
                self.add_event(sid, tool, target)
        with self.lock:
            s = self.sessions[sid]
            if s["state"] != "working":
                return
            m = {"role": "agent", "text": "This is a stub answer from the mock bridge.", "at": iso(time.time()), "costUsd": 0.12}
            if "do it" in text.lower():
                m["proposal"] = {"id": uuid.uuid4().hex[:8], "kind": "change", "summary": "Do the thing you asked for, in a new branch.", "issue": None, "taskType": "Bug", "model": "sonnet", "effort": "medium", "lane": "A",
                                 "branch": None, "estMin": 10, "estUsd": 1.0, "spentTodayUsd": 3.2, "expiresAt": iso(time.time() + 1800), "status": "open"}
                s["state"] = "needs_yes" if self.flags["act"] else "waiting"
            else:
                s["state"] = "waiting"
            s["messages"].append(m)
            s.update(turns=s["turns"] + 1, costUsd=round(s["costUsd"] + 0.12, 2), lastAt=iso(time.time()))

    def answer(self, sid, pid, yes):
        with self.lock:
            s = self.sessions.get(sid)
            if not s:
                return self.refuse("unknown_session")
            p = next((m["proposal"] for m in s["messages"] if m.get("proposal") and m["proposal"]["id"] == pid), None)
            if not p:
                return self.refuse("unknown_proposal")
            if yes:
                if not self.flags["act"]:
                    return self.refuse("act_off", s["agent"])
                if p["status"] != "open" or iso(time.time()) > p["expiresAt"]:
                    return self.refuse("yes_expired")
                p.update(status="accepted", branch="chore/chat-%s-%s" % (s["agent"].lower(), pid[:4]))
                s.update(state="acting", lastAt=iso(time.time()), branch=p["branch"], worktree=True)
                self.events[sid] = []
                threading.Thread(target=self._act, args=(sid,), daemon=True).start()
                return 202, {"session": self.view(s)}
            if p["status"] == "open":
                p["status"] = "declined"
                s["state"] = "waiting"
            return 200, {"session": self.view(s)}

    def _act(self, sid):
        for tool, target in (("Read", "docs/dashboard/drafts/direction-A/a.js"), ("Edit", "docs/dashboard/drafts/direction-A/a.js"), ("Bash", None), ("Edit", "docs/dashboard/drafts/shared/chat.css"), ("Bash", None)):
            time.sleep(2)
            with self.lock:
                if self.sessions[sid]["state"] != "acting":
                    return
                self.add_event(sid, tool, target)
        self.finish(sid, "done", "The mock change is done.")

    def finish(self, sid, outcome, summary):
        with self.lock:
            s = self.sessions[sid]
            s["messages"].append({"role": "result", "text": "", "at": iso(time.time()), "costUsd": 0.9,
                                  "result": {"outcome": outcome, "issue": None, "branch": s["branch"], "commits": 2 if outcome == "done" else 0, "filesChanged": 3 if outcome == "done" else 0,
                                             "summary": summary, "costUsd": 0.9, "minutes": 0.2}})
            s.update(state="waiting", lastAt=iso(time.time()), turns=s["turns"] + 1)

    def stop(self, sid):
        s = self.sessions.get(sid)
        if not s:
            return self.refuse("unknown_session")
        if s["state"] in ("working", "acting"):
            if s["state"] == "acting":
                self.finish(sid, "stopped", "Stopped by you.")
            else:
                with self.lock:
                    s.update(state="waiting")
                    s["messages"].append({"role": "error", "text": "%s did not answer. Nothing was lost. Try again." % s["agent"], "at": iso(time.time()), "costUsd": None})
        return 200, {"session": self.view(s)}


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _json(self, status, body):
        raw = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(raw)

    def _ok(self):
        return self.headers.get("x-chat-key") == self.server.key

    def do_GET(self):
        if not self.path.startswith("/chat"):
            return super().do_GET()
        if not self._ok():
            return self._json(403, {})
        m = self.server.mock
        path, _, q = self.path.partition("?")
        qs = dict(p.split("=", 1) for p in q.split("&") if "=" in p)
        segs = [s for s in path.split("/") if s]
        if segs == ["chat", "health"]:
            acting = sum(1 for s in m.sessions.values() if s["state"] == "acting")
            return self._json(200, {"ok": True, "off": m.flags["off"], "running": max(m.flags["running"], sum(1 for s in m.sessions.values() if s["state"] in ("working", "acting"))), "maxRunning": 3,
                                    "spentTodayUsd": 3.2, "dailyUsd": 40, "act": m.flags["act"], "acting": acting})
        if segs == ["chat", "sessions"]:
            a = qs.get("agent", "")
            if a not in ROLES:
                return self._json(404, {"refused": "unknown_agent", "reason": "No such agent."})
            items = sorted((s for s in m.sessions.values() if s["agent"] == a), key=lambda s: s["lastAt"], reverse=True)
            return self._json(200, {"agent": a, "sessions": [m.view(s) for s in items]})
        if len(segs) >= 3 and segs[1] == "sessions":
            s = m.sessions.get(segs[2])
            if not s:
                return self._json(*m.refuse("unknown_session"))
            if len(segs) == 3:
                msgs = []
                for x in s["messages"]:
                    x = dict(x)
                    p = x.get("proposal")
                    if p and p["status"] == "open" and iso(time.time()) > p["expiresAt"]:
                        x["proposal"] = dict(p, status="expired")
                    msgs.append(x)
                return self._json(200, {"session": m.view(s), "messages": msgs})
            if segs[3] == "events":
                after = int(qs.get("after", "0") or 0)
                return self._json(200, {"state": s["state"], "events": [e for e in m.events[s["id"]] if e["n"] > after]})
        self._json(404, {})

    def do_POST(self):
        if not self.path.startswith("/chat"):
            return self._json(405, {})
        m = self.server.mock
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length") or 0)) or b"{}")
        segs = [s for s in self.path.split("?")[0].split("/") if s]
        if segs == ["chat", "_mock"]:
            m.flags.update({k: v for k, v in body.items() if k in m.flags})
            return self._json(200, m.flags)
        if not self._ok():
            return self._json(403, {})
        if segs == ["chat", "sessions"]:
            return self._json(*m.post_message(body.get("agent"), None, body.get("text", "")))
        if len(segs) == 4 and segs[3] == "messages":
            return self._json(*m.post_message(None, segs[2], body.get("text", "")))
        if len(segs) == 4 and segs[3] == "stop":
            return self._json(*m.stop(segs[2]))
        if len(segs) == 6 and segs[3] == "proposals":
            return self._json(*m.answer(segs[2], segs[4], segs[5] == "yes"))
        self._json(404, {})


class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8770)
    ap.add_argument("--key", default="mockkey" + "x" * 33)
    ap.add_argument("--act", action="store_true")
    ap.add_argument("--pages", default=PAGES)
    a = ap.parse_args()
    srv = Server(("127.0.0.1", a.port), lambda *args, **kw: Handler(*args, directory=a.pages, **kw))
    srv.mock, srv.key = Mock(a.act), a.key
    print("mock bridge on 127.0.0.1:%d, act %s" % (a.port, "on" if a.act else "off"), flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    sys.exit(main())
