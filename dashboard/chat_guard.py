#!/usr/bin/env python3
"""PreToolUse hook for the dashboard chat (MIN-4497; CTO contract on MIN-4495 and MIN-4497).

The bridge passes it to every chat turn with `--settings` (matcher `.*`). Run 1 is the ANSWER path: read-only, default deny,
fail closed. An act turn is refused here until run 2 builds its rules.

Settings come from the command line, never from the environment: the bridge builds the child's environment from nothing
(HOME, USER, LOGNAME, TMPDIR, LANG, PATH) and a test pins that key set.

    chat_guard.py --mode answer --roots <dir>:<dir> --home <dir> --sid <session id>

stdin is the hook event JSON. Exit 0 allows (an explicit allow decision is printed); exit 2 denies (the reason is on stderr).
Audit: <home>/chat-audit.log, one line per call: time, short session id, tool, allow|deny, the command's first word or a
relative path. No content, no output, no tool input beyond that.
"""
from __future__ import annotations

import argparse
import fnmatch
import json
import os
import re
import sys
import time

# Linear read tools only. Matched by tool name on any server, because the server's name differs between
# machines (`linear`, a connector id). Any other tool name is denied, so a database or Cloudflare connector never matches.
LINEAR_READ = {
    "get_issue", "list_issues", "list_comments", "get_issue_status", "list_issue_statuses", "list_issue_labels",
    "get_team", "list_teams", "get_user", "list_users", "get_milestone", "list_milestones", "list_documents",
    "get_document", "get_status_updates", "list_cycles", "get_workspace", "list_custom_views",
}
BLOCKED_SERVERS = re.compile(r"supabase|cloudflare", re.I)
HARMLESS = {"ToolSearch", "TodoWrite"}
READ_TOOLS = {"Read", "Grep", "Glob"}
DENIED_DIRS = {".git", ".healthapp-dashboard", "playground", ".ssh", ".aws", ".gnupg", ".config"}
DENIED_FILES = [".env", ".env.*", "*.env", "*.pem", "*.key", "*.p12", "id_rsa*", "id_ed25519*", ".npmrc", ".netrc",
                "credentials*", "*.keystore", ".git-credentials", "push.json", "chat.key", "view.key", "push.key"]
GLOB_CHARS = "*?[{"


def deny(reason):
    return False, reason


def allow():
    return True, "dashboard chat: read-only set"


def _real(path, cwd):
    p = os.path.expanduser(str(path))
    if not os.path.isabs(p):
        p = os.path.join(cwd, p)
    return os.path.realpath(p)


def _inside(path, roots):
    for r in roots:
        try:
            if os.path.commonpath([path, r]) == r:
                return True
        except ValueError:
            continue
    return False


def path_problem(path, roots):
    """None when `path` (already resolved) may be read, else the refusal text."""
    if not _inside(path, roots):
        return "Not from the chat: that path is outside the healthapp and conductor folders."
    parts = path.split(os.sep)
    for part in parts:
        if part.lower() in DENIED_DIRS:
            return "Not from the chat: %s is never readable here." % part
    base = parts[-1].lower()
    for pat in DENIED_FILES:
        if fnmatch.fnmatchcase(base, pat):
            return "Not from the chat: env files, keys and credentials are never readable here."
    return None


def _static_prefix(pattern):
    cut = len(pattern)
    for ch in GLOB_CHARS:
        i = pattern.find(ch)
        if i != -1:
            cut = min(cut, i)
    prefix = pattern[:cut]
    return prefix if prefix.endswith("/") or cut == len(pattern) else os.path.dirname(prefix) or "."


def _decide_read(tool, tin, cwd, roots):
    candidates = []
    if tool == "Read":
        if not tin.get("file_path"):
            return deny("Not from the chat: Read needs a file_path.")
        candidates.append(_real(tin["file_path"], cwd))
    else:
        base = _real(tin["path"], cwd) if tin.get("path") else os.path.realpath(cwd)
        candidates.append(base)
        pat = tin.get("pattern") if tool == "Glob" else tin.get("glob")
        if pat:
            pat = str(pat)
            if ".." in pat.split("/"):
                return deny("Not from the chat: '..' in a pattern.")
            if pat.startswith(("/", "~")):
                candidates.append(_real(_static_prefix(pat), cwd))
    for c in candidates:
        why = path_problem(c, roots)
        if why:
            return deny(why)
    return allow()


def _decide_mcp(tool):
    m = re.match(r"^mcp__(.+?)__(.+)$", tool)
    if not m:
        return deny("Not from the chat: %s." % tool)
    server, name = m.group(1), m.group(2)
    if BLOCKED_SERVERS.search(server):
        return deny("Not from the chat: no database or Cloudflare access.")
    if name in LINEAR_READ:
        return allow()
    return deny("Not from the chat: only Linear reads are allowed (%s)." % name)


def decide(event, mode, roots):
    """(allowed, reason) for one hook event."""
    tool = str(event.get("tool_name") or "")
    tin = event.get("tool_input") or {}
    if not isinstance(tin, dict):
        return deny("Not from the chat: the guard could not read this call.")
    cwd = str(event.get("cwd") or os.getcwd())
    if mode != "answer":
        return deny("Not from the chat: acting is not built yet (MIN-4497 run 2).")
    if not roots:
        return deny("Not from the chat: the guard has no readable folders configured.")
    if tool in READ_TOOLS:
        return _decide_read(tool, tin, cwd, roots)
    if tool in HARMLESS:
        return allow()
    if tool.startswith("mcp__"):
        return _decide_mcp(tool)
    return deny("Not from the chat: %s is not available in a dashboard chat." % (tool or "that tool"))


def audit_target(event, roots):
    tool = str(event.get("tool_name") or "")
    tin = event.get("tool_input")
    if not isinstance(tin, dict):
        return "-"
    if tool == "Bash":
        words = str(tin.get("command") or "").split()
        return words[0][:40] if words else "-"
    p = tin.get("file_path") or tin.get("path") or ""
    if p:
        try:
            real = _real(p, str(event.get("cwd") or os.getcwd()))
        except (OSError, ValueError):
            return "<unresolved>"
        for r in roots:
            if _inside(real, [r]):
                return os.path.relpath(real, r)[:120]
        return "<outside>"
    return "-"


def write_audit(home, sid, tool, verdict, target):
    if not home:
        return
    line = "%s %s %s %s %s\n" % (time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), (sid or "-")[:8],
                                 re.sub(r"[^A-Za-z0-9_.-]", "_", tool)[:80] or "-", verdict,
                                 re.sub(r"\s", "_", target) or "-")
    fd = os.open(os.path.join(home, "chat-audit.log"), os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o600)
    with os.fdopen(fd, "a") as f:
        f.write(line)


def main(argv=None, stdin=None):
    ap = argparse.ArgumentParser(add_help=False)
    ap.add_argument("--mode", default="")
    ap.add_argument("--roots", default="")
    ap.add_argument("--home", default="")
    ap.add_argument("--sid", default="")
    try:
        args, _ = ap.parse_known_args(argv)
    except SystemExit:
        args = argparse.Namespace(mode="", roots="", home="", sid="")
    roots = [os.path.realpath(r) for r in args.roots.split(os.pathsep) if r]
    event = {}
    try:
        event = json.load(stdin or sys.stdin)
        if not isinstance(event, dict):
            raise ValueError("event is not an object")
        ok, reason = decide(event, args.mode, roots)
    except Exception:
        event = event if isinstance(event, dict) else {}
        ok, reason = False, "Not from the chat: the guard could not read this call."
    try:
        write_audit(args.home, args.sid, str(event.get("tool_name") or "-"), "allow" if ok else "deny",
                    audit_target(event, roots))
    except Exception:
        pass
    if ok:
        print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "allow",
                                                 "permissionDecisionReason": reason}}))
        return 0
    print(reason, file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
