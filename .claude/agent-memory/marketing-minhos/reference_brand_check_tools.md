---
name: reference-brand-check-tools
description: Which tool answers each part of a brand or name availability check (treg has no trademark or company-register tool; TMview in the browser does trademarks)
metadata:
  type: reference
---

Learned on the Pathien brand check (MIN-4462, 2026-11-14, result in `docs/brand/brand-check-pathien.md`).

- **Trademarks:** treg has no trademark tool (catalog request filed 2026-11-14). Use TMview in the Browser pane: `https://www.tmdn.org/tmview/#/tmview/results?page=1&pageSize=30&criteria=F&basicSearch=<name>` (`criteria=F` fuzzy, `criteria=C` contains). It covers EUIPO, USPTO, UK, Greece (OBI) in one search, loads without a login, and shows dates as day/month/year. It is not an official register: say so.
- **Social handles, SERP, search volume, app stores, company search:** treg has cheap tools; a whole name check cost about $0.015. A profile lookup that misses is not billed.
- **Company registers:** `corpoapi` needs a team key that is not connected; `akta` has a daily limit. Say "not checked" when both refuse.
- **Domains:** `https://rdap.org/domain/<domain>` is free and reliable for .com, .app, .health; not reliable for .gr, .eu, .io.
- The treg team balance was $0.69 after this run: check `treg` before planning a larger job.
