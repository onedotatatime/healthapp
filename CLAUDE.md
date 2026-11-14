# healthapp: project rules (every chat, every agent)

## THE PROJECT GOAL (founder, 2026-11-14, HARD RULE)

Founder, verbatim: "We need to move in parallel in 4 directions" (he then listed five):

1. **Scan, then the AI reads it.**
2. **Storage:** store the extracted data in the same database.
3. **Store and analyse the original files**, from both staging and main.
4. **Real analysis and projection for the patient.**
5. **Real matching analysis, based on the data.**

"This is the whole project goal. Tell to everyone and dont miss this goal. Whatever you do ask yourself 'How close am i to this goal with what i am doing'. ALL AGENTS SHOULD FOLLOW THIS TO THE PROJECT."

**How every chat and every agent applies it:**
- Before you start any task, name which of the five directions it moves. Work that moves none of them needs a stated reason, or it waits.
- When you hand back (Actuals, PR body, chat reply), add one line: `Goal: direction <n>, <how much closer, in one sentence>`.
- The coordinator puts this goal in every role-agent brief.
- "Real" means it runs on real records through the real pipeline, not on a fixed copy in a prototype, a mock or keyword-only coding. Synthetic data is for tests; say so whenever a result comes from it.

**Where things stood when the goal was set (2026-11-14 evening):**
1. The phone test passes on staging: sign in, upload, Gemini reads 9 values, confirm, list, 19 s.
2. The tables exist in `dev` and `demo`; `demo` holds 0 of the founder's documents.
3. The original files are stored, but not analysed beyond the value extraction.
4. No patient analysis or projection yet.
5. Matching runs only against 400 synthetic patients, with keyword coding (`supabase/sql/005_matches.sql`).

Other rules still apply: lean demo (bare minimum), and the conductor rule that no agent reads row content in `healthapp_demo` until MIN-4526 closes.
