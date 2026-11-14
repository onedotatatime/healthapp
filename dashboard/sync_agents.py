#!/usr/bin/env python3
"""Appends the agents that hand-set.sample.json lists and the installed hand-set.json lacks (MIN-4574). Stdlib, Python 3.9+.

The chat bridge and the feed both read `config.agents` of ~/.healthapp-dashboard/hand-set.json. That file is the founder's own copy of the sample, and
`install` never overwrites it, so an agent added to the sample (Scrum, SEO, JobScout) never reached the installed config: it had no chat and no row.

    python3 dashboard/sync_agents.py [SAMPLE] [INSTALLED]      exit 0 (added or nothing to add), 2 unreadable JSON, 3 no file

Append-only: an agent already there (same `n`, or the same `agentType`) is never changed, so a hand edit (its `chat` row, its `linear` name) stays; nothing is
removed or reordered; every other key stays. Before the first change the file is copied to hand-set.json.before-sync (mode 600). Prints the names added.
No secret is read or printed.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def sync(sample_path, installed_path):
    """The names added to the installed config (a list, possibly empty). Raises OSError / ValueError when a file cannot be read."""
    wanted = [a for a in ((load(sample_path).get("config") or {}).get("agents") or []) if isinstance(a, dict) and a.get("n") and a.get("agentType")]
    doc = load(installed_path)
    if not isinstance(doc, dict):
        raise ValueError("hand-set.json is not an object")
    cfg = doc.setdefault("config", {})
    have = cfg.setdefault("agents", [])
    names = {a.get("n") for a in have if isinstance(a, dict)}
    types = {a.get("agentType") for a in have if isinstance(a, dict)}
    add = [a for a in wanted if a["n"] not in names and a["agentType"] not in types]
    if not add:
        return []
    backup = installed_path + ".before-sync"
    if not os.path.exists(backup):
        fd = os.open(backup, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as f, open(installed_path, encoding="utf-8") as src:
            f.write(src.read())
    have.extend(add)
    tmp = installed_path + ".tmp"
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=2, ensure_ascii=False)
        f.write("\n")
    os.replace(tmp, installed_path)
    return [a["n"] for a in add]


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    home = os.environ.get("HEALTHAPP_DASHBOARD_HOME") or os.path.expanduser("~/.healthapp-dashboard")
    sample = argv[0] if argv else os.path.join(HERE, "hand-set.sample.json")
    installed = argv[1] if len(argv) > 1 else os.path.join(home, "hand-set.json")
    if not os.path.isfile(installed):
        print("no %s: run install first" % installed, file=sys.stderr)
        return 3
    try:
        added = sync(sample, installed)
    except (OSError, ValueError) as e:
        print("sync-agents: %s" % type(e).__name__, file=sys.stderr)         # the exception text could carry file content; the type is enough
        return 2
    print("agents added to %s: %s" % (installed, ", ".join(added)) if added else "agents already complete in %s" % installed)
    return 0


if __name__ == "__main__":
    sys.exit(main())
