---
name: healthapp-real-data-regime
description: Healthapp (hackathon 14–15 Nov 2026) keeps the founder's real exams inside the shared conductor Supabase project — two schemas, wipe by drop schema, backups cannot be wiped, ten-point real-data gate (MIN-4426, amended by MIN-4449)
metadata:
  type: project
---

The founder's own real exams are the role-play test data (overrides "synthetic only"). CTO gate of 2026-11-13: GO WITH CHANGES (`docs/reviews/cto-review.md`, MIN-4426).

**Amended 2026-11-14 (MIN-4449).** The founder chose the existing conductor Supabase project (`fnbnhvgrnkrbsrwhgcgc`, eu-west-1, Conductor's production database) for both environments, real exams included: "Supabase we can use the onedotatatime db", "the conductor project", "Conductor too". The coordinator had recommended a separate project for the real exams; he declined. No new project, no new Supabase spend.

- `dev` and `demo` are two schemas (`healthapp_dev`, `healthapp_demo`) and two private buckets (`healthapp-dev`, `healthapp-demo`) inside conductor. One set of Edge Functions (`healthapp-*`) and secrets (`HEALTHAPP_*`). Healthapp auth users are new users with the marker `app_metadata {"app":"healthapp","env":…}`; the founder's account is an alias address, never his Conductor console login.
- "Signed in" proves nothing in healthapp's policies: Conductor's users share `auth.users`. Every policy ties the caller to a healthapp profile. No credential ships in the bundle; persona login goes through a passcode-checked function.
- Nothing technical stops an agent with SQL access from reading `healthapp_demo`. The control is the schema name as a bright line plus the wipe scan.
- Wipe = drop the `healthapp_demo` schema, empty and delete the bucket through the Storage API, hard-delete the marked users, unset the Vertex secret. **Never delete the project: it is Conductor.** Review section 2.7 rows 2–5 and section 2.1 are superseded (banner added to the review).
- Cannot be wiped: Google's abuse-monitoring logs; conductor's database backups and platform logs (they age out by plan; the live plan and retention were NOT verified by me on 2026-11-14, Cron's step 0 on MIN-4452 does it); a restore inside the window brings the rows back.
- AI side unchanged: Gemini on Vertex AI at an EU regional endpoint, paid credit billing, caching off, inline only, no name or ID in the assistant context, radiology images never go to the model.
- The real-data gate (H6–H8) is now the ten points in decision 2 on MIN-4449.

**Why:** agent transcripts, memory and Linear are the likeliest leak routes for real health data; in a shared project the container we can delete and verify is the schema, the bucket and the marked users.

**How to apply:** at the post-build review (MIN-4453) check, with counts and codes only: the commands used against conductor (none of the forbidden list in decision 1 point 2), `hdb check` zeros for both schemas, the restrictive storage policy, the service-role key name in one file only, no password in the bundle, and that the gate passed before any real upload. Check that no fixture, test table or Linear comment holds his name, ID or values. The wipe report must name the date the last backup holding his rows expires, and say plainly what could not be wiped.
