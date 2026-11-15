---
name: reference-logging-a-founder-decision
description: How a ceo-minhos subagent adds an entry to conductor's founder-decisions log without a worktree, and what "logged" means
metadata:
  type: reference
---

- The log (`~/AppDevelopment/conductor/docs/founder-decisions.md`) changes only through a PR to conductor `main`, label `lane:A`, title `docs(decisions): ...`. Branch protection blocks the merge; Release merges. Until then the entry is not in the log, so say "PR open, not merged".
- No worktree is needed (and the seat may not delete one): build the commit with a temporary index. `git show origin/main:docs/founder-decisions.md` to a scratch file, append the entry, then `GIT_INDEX_FILE=<tmp> git read-tree origin/main`, `git hash-object -w`, `git update-index --cacheinfo`, `git write-tree`, `git commit-tree -p origin/main`, and push the commit to `refs/heads/docs/founder-decisions-<date>-<topic>`.
- In zsh write `"${C}:refs/heads/..."`. `"$C:refs"` drops characters (the `:r` modifier) and the push fails.
- An override of a CTO decision is not a "Supersedes" of a log entry: write "none in this log" and name the Linear issue that was overridden.
- See [[founder-wants-results-not-wording-questions]] for when the seat decides demo wording itself.
