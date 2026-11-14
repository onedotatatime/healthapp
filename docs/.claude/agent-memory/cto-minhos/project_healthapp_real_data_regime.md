---
name: healthapp-real-data-regime
description: CTO decisions of 2026-11-13 (MIN-4426) for the hackathon health app — founder's real exams, two Supabase envs, Vertex EU endpoint, wipe-by-project-deletion, real-data gate
metadata:
  type: project
---

The founder's own real exams are the role-play test data (overrides "synthetic only"). The CTO gate on 2026-11-13 was GO WITH CHANGES (docs/reviews/cto-review.md).

- Two Supabase EU projects: `dev` (synthetic, agents free) and `demo` (real; agents deploy only and never read rows, objects or screens with his data).
- AI: Gemini on Vertex AI at an EU regional endpoint, paid credit billing, caching off, inline only (no Files API, context cache, batch or request logging). No name or ID in the assistant context. Radiology images never go to the model.
- Wipe = delete the `demo` project, revoke the keys, clean the devices. Release builds `wipe-demo` and dry-runs it before the first real upload. The CTO verifies with counts and HTTP codes only. `demo-reset` never touches the founder's account.
- A real-data gate at H6–H8 comes before his first real upload.

**Why:** agent transcripts, memory and Linear are the likeliest leak routes for real health data. Deleting the container is the only wipe we can verify.

**How to apply:** at the post-build review, check that the gate was passed before any real upload. Check that no fixture, test table or Linear comment holds his name, ID or values. Check that the wipe report quotes counts and HTTP codes, and states plainly that Google's abuse-monitoring logs are out of our reach.
