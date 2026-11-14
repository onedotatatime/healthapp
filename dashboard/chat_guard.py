#!/usr/bin/env python3
"""PreToolUse hook for the dashboard chat (MIN-4497; CTO contract on MIN-4495 and MIN-4497).

The bridge passes it to every chat turn with `--settings` (matcher `.*`). Default deny, fail closed. Two modes:
  answer  read-only: Read, Grep, Glob inside the two roots, Linear reads.
  act     an approved proposal (run 2): the same reads, plus Edit and Write only inside the chat's own worktree and the agent's memory folder,
          Bash only as ONE plain command from the allowlist (no `$`, backtick, `<(`, `;`, `&`, `|`, redirect, newline, `cd`, `git -C`, `env`,
          `printenv`, `set`, `export`, `declare`): git, and extract-runs.py --actuals. NO npm, NO pytest, NO unittest (CTO M1, MIN-4497: the agent
          could write a package.json script or a conftest.py and then run it). `git push` only to the stored branch, Linear reads plus
          `save_comment` and `save_issue` (no `linear-as`: it reaches any mutation). No writes to .github, .claude, .mcp.json, .husky, .githooks
          inside the worktree (CTO M2).

Settings come from the command line, never from the environment: the bridge builds the child's environment from nothing
(HOME, USER, LOGNAME, TMPDIR, LANG, PATH) and a test pins that key set.

    chat_guard.py --mode answer --roots <dir>:<dir> --home <dir> --sid <session id>
    chat_guard.py --mode act --kind change|handoff --roots ... --home ... --sid ... --role BACKEND --conductor <dir>
                  [--worktree <dir> --memory <dir> --branch <name>]      (change only)

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
import shlex
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
# CTO finding, MIN-4497 (comment 2cc7efc9, rule 4). ripgrep skips gitignored and hidden files, but a `glob` argument overrides both, so
# `Grep {path: conductor, glob: ".env*"}` would read an ignored env file inside a readable root. Grep's `glob` is therefore allowed only
# as one extension pattern from this list (measured with a real rg: `-g '.env*'`, `-g '*'`, `-g '*.local'` all find a gitignored `.env.local`).
# CTO M4 (MIN-4497, comment 420bf529): the list holds only extensions that carry no ignored config or data file in either root. json, yaml, toml,
# txt, sh and sql are NOT on it: conductor has ignored `.claude/launch.json`, `.local-stack/supabase/config.toml` and `.local-stack/supabase/seed.sql`,
# and a `*.json` glob would read them. For those types the agent uses Grep's `type` (rg `--type`), which filters by type and keeps the ignore rules.
GREP_GLOB_EXTS = ("md", "py", "ts", "tsx", "js", "mjs", "css", "html")
GREP_GLOB_RE = re.compile(r"(?:\*\*/)?\*\.(?:%s)" % "|".join(GREP_GLOB_EXTS))


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


def _dot_segment(pattern):
    """True when any path segment, or any {a,b} alternative or [class] start, begins with a dot: that pattern can name .env and friends."""
    if re.search(r"[\[{,]\.", pattern):
        return True
    return any(seg.startswith(".") and seg != "." for seg in pattern.split("/"))


def _decide_read(tool, tin, cwd, roots):
    candidates = []
    if tool == "Read":
        if not tin.get("file_path"):
            return deny("Not from the chat: Read needs a file_path.")
        candidates.append(_real(tin["file_path"], cwd))
    else:
        base = _real(tin["path"], cwd) if tin.get("path") else os.path.realpath(cwd)
        candidates.append(base)
        if tool == "Grep":
            gl = tin.get("glob")
            if gl is not None and not (isinstance(gl, str) and GREP_GLOB_RE.fullmatch(gl)):
                return deny("Not from the chat: Grep's glob may only be one extension pattern such as *.md or **/*.py. For json, yaml, toml, txt, sh or sql use Grep's type instead.")
        else:
            pat = tin.get("pattern")
            if pat:
                pat = str(pat)
                if ".." in pat.split("/"):
                    return deny("Not from the chat: '..' in a pattern.")
                if _dot_segment(pat):
                    return deny("Not from the chat: a pattern that names a dot file or folder.")
                if pat.startswith(("/", "~")):
                    candidates.append(_real(_static_prefix(pat), cwd))
    for c in candidates:
        why = path_problem(c, roots)
        if why:
            return deny(why)
    return allow()


def _decide_mcp(tool, act=False):
    m = re.match(r"^mcp__(.+?)__(.+)$", tool)
    if not m:
        return deny("Not from the chat: %s." % tool)
    server, name = m.group(1), m.group(2)
    if BLOCKED_SERVERS.search(server):
        return deny("Not from the chat: no database or Cloudflare access.")
    if name in LINEAR_READ:
        return allow()
    if act and name in LINEAR_ACT_WRITE:
        return True, "dashboard chat: Linear comment or issue"
    return deny("Not from the chat: only Linear reads%s are allowed (%s)." % (", comments and issues" if act else "", name))


# ----------------------------------------------------------------------------- act mode (MIN-4497 run 2)

LINEAR_ACT_WRITE = {"save_comment", "save_issue"}
WRITE_TOOLS = {"Edit", "Write", "MultiEdit"}
BASH_RAW_DENY = re.compile(r"[$`\r\n\x00]|<\(|>\(")        # `$` (any expansion), a backtick, a process substitution, a line break
ENV_WORDS = {"env", "printenv", "set", "export", "declare", "typeset", "unset", "compgen"}
GIT_SUBS = {"status", "diff", "log", "show", "add", "commit", "restore", "rm", "mv", "fetch", "push"}
GIT_READ_SUBS = {"status", "diff", "log", "show"}
GIT_NEVER = {"-C", "-c", "--git-dir", "--work-tree", "--exec-path", "--force", "-f", "--force-with-lease", "--no-verify", "-n", "--hard", "-D", "-d",
             "--delete", "--mirror", "--prune", "--no-index", "--upload-pack", "--receive-pack", "--exec", "-o", "--push-option"}
GIT_OPTS = {
    "add": {"-A", "--all", "-u", "--update", "-N", "--intent-to-add", "-v", "--verbose", "--renormalize", "--"},
    "restore": {"--staged", "-S", "--worktree", "-W", "-q", "--quiet", "--"},
    "rm": {"--cached", "-q", "--quiet", "--ignore-unmatch", "--"},
    "mv": {"-v", "--verbose", "--"},
    "fetch": {"-q", "--quiet"},
}
COMMIT_OPTS = {"-a", "--all", "--amend", "--no-edit", "-s", "--signoff", "--allow-empty", "-q", "--quiet"}
REF_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._/-]*$")
LINEAR_AS = "~/.claude/bin/linear-as"          # never allowed in an act turn (CTO, MIN-4497); the constant stays so the bridge can deny it by name
# CTO M2: inside the worktree these are never written. A workflow edit runs in CI before anyone reads it, `.claude/` and `.mcp.json` change what
# a later agent session loads (and a `.claude/agents/*-minhos.md` breaks the one-source rule), and a hooks folder runs code at commit time.
# Folders match on any path segment, files on the name, both case-insensitively (the Mac's disk is case-insensitive).
WRITE_NEVER_DIRS = (".github", ".claude", ".husky", ".githooks")
WRITE_NEVER_FILES = (".mcp.json",)


def _secret_arg(arg):
    """True when a command argument names something the chat may never touch: an env file, a key, a credentials file, a denied folder."""
    low = str(arg).lower().replace("\\", "/")
    if "healthapp-dashboard" in low or "playground" in low:
        return True
    for part in re.split(r"[/:=]", low):
        if part in DENIED_DIRS:
            return True
        for pat in DENIED_FILES:
            if fnmatch.fnmatchcase(part, pat):
                return True
    return False


def _bash_words(cmd):
    """(words, None) for one plain command, or (None, reason). The raw text is screened first, then parsed the way a shell would split it;
    an unquoted operator (`;` `&` `|` `<` `>` `(` `)`) comes back as its own token and is refused, so a quoted one that is a whole word is refused too."""
    if not isinstance(cmd, str) or not cmd.strip():
        return None, "Not from the chat: an empty command."
    if len(cmd) > 4000:
        return None, "Not from the chat: that command is too long."
    if BASH_RAW_DENY.search(cmd):
        return None, "Not from the chat: a command with `$`, a backtick, a process substitution or a line break."
    try:
        lex = shlex.shlex(cmd, posix=True, punctuation_chars=True)
        lex.whitespace_split = True
        lex.commenters = ""
        words = list(lex)
    except ValueError:
        return None, "Not from the chat: the guard could not read that command."
    if not words:
        return None, "Not from the chat: an empty command."
    for w in words:
        if w and all(ch in "();<>|&" for ch in w):
            return None, "Not from the chat: one plain command only (no ;, &, |, redirects or subshells)."
    return words, None


def _inside_dir(path, root):
    try:
        return os.path.commonpath([path, root]) == root
    except ValueError:
        return False


def _arg_in_worktree(arg, ctx):
    wt = ctx.get("worktree")
    if not wt:
        return False
    return _inside_dir(_real(arg, wt), wt)


def allow_act(why="dashboard chat: approved action"):
    return True, why


def _vcs_command(words, ctx):
    """The version-control commands on the list. Every option is checked against a short list, never against a list of bad ones only."""
    if len(words) < 2 or words[1] not in GIT_SUBS:
        return deny("Not from the chat: that command is not on the list (%s)." % (words[1][:20] if len(words) > 1 else "none"))
    sub, args = words[1], words[2:]
    for a in args:
        if a in GIT_NEVER or a.startswith(("--force", "--no-verify", "--hard", "--delete", "--git-dir", "--work-tree", "--output", "--exec", "+")):
            return deny("Not from the chat: that option is never allowed (%s)." % a[:20])
    if sub == "push":
        branch = ctx.get("branch")
        rest = args[:]
        if rest[:1] in (["-u"], ["--set-upstream"]):
            rest = rest[1:]
        if not branch or len(rest) != 2 or rest[0] != "origin" or rest[1] not in (branch, "HEAD"):
            return deny("Not from the chat: a push is only to this chat's own branch, as `push origin %s`." % (branch or "<branch>"))
        return allow_act()
    if sub in GIT_READ_SUBS:
        for a in args:
            if _secret_arg(a):
                return deny("Not from the chat: env files, keys and credentials are never readable here.")
        return allow_act()
    if sub == "commit":
        has_msg, i = False, 0
        while i < len(args):
            a = args[i]
            if a in ("-m", "-am", "-sm", "-asm"):
                if i + 1 >= len(args) or not args[i + 1].strip():
                    return deny("Not from the chat: a commit needs a message.")
                has_msg, i = True, i + 2
                continue
            if a.startswith("--message=") and a[len("--message="):].strip():
                has_msg, i = True, i + 1
                continue
            if a in COMMIT_OPTS:
                has_msg = has_msg or a == "--no-edit"
                i += 1
                continue
            return deny("Not from the chat: that commit option is not allowed (%s)." % a[:20])
        if not has_msg:
            return deny("Not from the chat: a commit needs -m and a message (an editor cannot open here).")
        return allow_act()
    if sub == "fetch":
        names = [a for a in args if not a.startswith("-")]
        opts = [a for a in args if a.startswith("-")]
        if any(o not in GIT_OPTS["fetch"] for o in opts) or len(names) > 2 or (names and names[0] != "origin") \
                or any(not REF_RE.match(n) for n in names):
            return deny("Not from the chat: a fetch is only `fetch [origin [branch]]`.")
        return allow_act()
    # add, restore, rm, mv: options from a short list, every path inside the worktree and never a secret file
    after_dd = False
    for a in args:
        if a == "--":
            after_dd = True
            continue
        if not after_dd and a.startswith("-"):
            if a not in GIT_OPTS[sub]:
                return deny("Not from the chat: that %s option is not allowed (%s)." % (sub, a[:20]))
            continue
        if _secret_arg(a):
            return deny("Not from the chat: env files, keys and credentials are never touched here.")
        if not _arg_in_worktree(a, ctx):
            return deny("Not from the chat: %s only inside this chat's own worktree." % sub)
    return allow_act()


def _decide_bash(tin, ctx):
    if ctx.get("kind") != "change":
        return deny("Not from the chat: this action has no shell.")
    cmd = tin.get("command")
    words, why = _bash_words(cmd)
    if why:
        if isinstance(cmd, str) and re.match(r"^\s*(env|printenv|set|export|declare)\b", cmd):
            return deny("Not from the chat: the environment is never readable.")
        return deny(why)
    first = words[0]
    if first in ENV_WORDS:
        return deny("Not from the chat: the environment is never readable.")
    if first == "git":
        return _vcs_command(words, ctx)
    if any(_secret_arg(w) for w in words):
        return deny("Not from the chat: env files, keys and credentials are never touched here.")
    if first == "python3":
        # CTO M1: no `-m pytest` and no `-m unittest`. Running tests would run code the agent has just written (a conftest.py, a test file),
        # past every rule above. The tests run in the PR's CI and in Release's lane run, after someone has read the code.
        conductor = ctx.get("conductor")
        if conductor and len(words) == 3 and words[2] == "--actuals" \
                and os.path.realpath(os.path.expanduser(words[1])) == os.path.join(conductor, "scripts", "measure", "extract-runs.py"):
            return allow_act()
        return deny("Not from the chat: python3 is only extract-runs.py --actuals.")
    return deny("Not from the chat: %s is not on the command list." % (os.path.basename(first)[:30] or "that"))


def _decide_write(tool, tin, cwd, roots, ctx):
    if ctx.get("kind") != "change" or not ctx.get("worktree"):
        return deny("Not from the chat: this action has no worktree to write in.")
    if not tin.get("file_path"):
        return deny("Not from the chat: %s needs a file_path." % tool)
    path = _real(tin["file_path"], cwd)
    why = path_problem(path, roots)
    if why:
        return deny(why)
    allowed = [ctx["worktree"]] + ([ctx["memory"]] if ctx.get("memory") else [])
    if not any(_inside_dir(path, d) for d in allowed):
        return deny("Not from the chat: writes only inside this chat's own worktree and the agent's memory folder.")
    if _inside_dir(path, ctx["worktree"]):
        parts = [x.lower() for x in os.path.relpath(path, ctx["worktree"]).split(os.sep)]
        if any(x in WRITE_NEVER_DIRS for x in parts) or parts[-1] in WRITE_NEVER_FILES:
            return deny("Not from the chat: workflows, agent settings, MCP config and git hooks are never edited here.")
    return allow_act()


def decide(event, mode, roots, ctx=None):
    """(allowed, reason) for one hook event. `ctx` carries the act settings (kind, worktree, memory, branch, role, conductor)."""
    tool = str(event.get("tool_name") or "")
    tin = event.get("tool_input") or {}
    if not isinstance(tin, dict):
        return deny("Not from the chat: the guard could not read this call.")
    cwd = str(event.get("cwd") or os.getcwd())
    if mode not in ("answer", "act"):
        return deny("Not from the chat: the guard has no mode.")
    if mode == "act" and (not isinstance(ctx, dict) or ctx.get("kind") not in ("change", "handoff")):
        return deny("Not from the chat: an action needs its settings.")
    if not roots:
        return deny("Not from the chat: the guard has no readable folders configured.")
    if tool in READ_TOOLS:
        return _decide_read(tool, tin, cwd, roots)
    if tool in HARMLESS:
        return allow()
    if mode == "act" and tool in WRITE_TOOLS:
        return _decide_write(tool, tin, cwd, roots, ctx)
    if mode == "act" and tool == "Bash":
        return _decide_bash(tin, ctx)
    if tool.startswith("mcp__"):
        return _decide_mcp(tool, act=(mode == "act"))
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
    for name in ("kind", "worktree", "memory", "branch", "role", "conductor"):
        ap.add_argument("--" + name, default="")
    try:
        args, _ = ap.parse_known_args(argv)
    except SystemExit:
        args = argparse.Namespace(mode="", roots="", home="", sid="", kind="", worktree="", memory="", branch="", role="", conductor="")
    roots = [os.path.realpath(r) for r in args.roots.split(os.pathsep) if r]
    ctx = {"kind": args.kind, "worktree": os.path.realpath(args.worktree) if args.worktree else "",
           "memory": os.path.realpath(args.memory) if args.memory else "", "branch": args.branch, "role": args.role,
           "conductor": os.path.realpath(args.conductor) if args.conductor else ""}
    event = {}
    try:
        event = json.load(stdin or sys.stdin)
        if not isinstance(event, dict):
            raise ValueError("event is not an object")
        ok, reason = decide(event, args.mode, roots, ctx)
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
