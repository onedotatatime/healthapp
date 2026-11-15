---
name: feedback-seed-through-connector
description: Any seed or rollback that must go through the Supabase connector's execute_sql: size it for one call, make it check its own result, and replay it the way the connector sends it (CTO must-fix, MIN-4649)
metadata:
  type: feedback
---

A generated seed is only shippable when the seat that applies it can carry it: on healthapp that is one
`execute_sql` call (no database URL on this Mac). My first 019 was 450 KB of VALUES with no self-check; the CTO
sent it back (MIN-4649, comment a590828a): about 150k tokens, beyond one call and one run's budget, and a copying
error would have committed wrong rows silently.

**Why:** the applier transcribes the file into a tool call. Anything that is not checked inside the statement
can arrive changed, and a partly loaded cohort is visible to the founder in between.

**How to apply:**
- Write the rows as ONE DO block with a compact payload (base-62 index per field, one word per row, ids by
  ordinality, lines wrapped at about 110 characters so chunked reads carry it). 5,000 rows = 49 KB.
- Before it commits, the block recomputes the same fingerprint the counts check (`hdb matches`) shows and raises
  "... nothing was changed" if it differs. Check every table it writes (the lab thresholds got their own md5).
- An order guard checks the live object, not only `_applied`: re-running an older file can leave the newer
  `_applied` row in place while restoring the old body.
- The rollback is a generated file too, in a folder `hdb render` refuses (`supabase/sql/rollback/`, rendered by
  `hdb down`), restores only the objects the change touched (never re-runs a whole earlier file), and checks
  itself the same way.
- Replay it as the connector sends it: `psql -c "$(cat rendered.sql)"` is one simple-query message, one implicit
  transaction. Force red: one payload character, one list entry, a dropped word, one threshold, and the guard
  removed as a control so you know the guard is what refused.
- Python fingerprints computed from the source files matched every value the CTO measured on Postgres before I
  ran a database: compute expected md5s in the generator and pin the independently measured ones in the test.

Related: [[project-healthapp-matches-replay]], [[project-healthapp-matches-rpc]].
