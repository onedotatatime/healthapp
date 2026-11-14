---
name: healthapp-chat-act-path
description: Non-obvious facts from MIN-4497 run 2 (dashboard chat act path): measured ripgrep glob behaviour, CI key grep trap, what a mutation sweep found
metadata:
  type: project
---

Measured with a real ripgrep (the claude binary answers as rg with `ARGV0=rg`): a `-g` glob overrides BOTH gitignore and hidden-file rules. `-g '.env*'`, `-g '*'`, `-g '*.local'` find a gitignored `.env.local`; `-g '*.json'` also finds an ignored `secret.json` and a hidden `.hidden.json`. So the guard allows Grep `glob` only as one `*.ext` pattern, and the extension list (`GREP_GLOB_EXTS` in `dashboard/chat_guard.py`) still has a residue for json, yaml, toml, txt, sh, sql. **Why:** CTO finding 2cc7efc9. **How to apply:** any new Grep/Glob allowance gets a canary test with a real rg, and the premise (the leaking call) is asserted as a control.

The Dashboard workflow's key-pattern grep runs over tracked files and matches the bare Supabase secret prefix, even in a comment or the README. Write such a prefix split (`"sb" + "_secret_"`) in code and describe it in words in prose. **How to apply:** run the grep (copy the command from `.github/workflows/dashboard.yml`) before the first push, not after.

Mutation sweep of the act path (62 mutants): everything killed except four defence-in-depth rows that are redundant by design (env words, `-f`/`--no-verify` in the git never-list, `<(` in the raw deny), plus one real gap: the "rule file present at the merged commit" check was masked by the "commit is an ancestor of HEAD" check, because every test commit lacking the file was also a non-ancestor. A commit that is an ancestor but lacks the file kills it. **How to apply:** when two guards stack, build the fixture that passes the first and fails only the second.
