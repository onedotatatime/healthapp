---
name: dashboard-mockup-method
description: How the MIN-4661 doctor dashboard mockups were built and checked (generator, 390 iframe, text audit) and where the files live
metadata:
  type: reference
---

MIN-4661 (2026-11-15): mockups are static HTML in `docs/design/min-4659/` of the Release worktree `healthapp-wt-min4659`, on top of the shipped `docs/design/min-4585/reference.css`. Chart SVGs (band, dashed projection, diamonds, 44 px hit circles) came from a throwaway Python generator that computes the least-squares line like the contract does; keep the SVG in the output, not a script in the repo.

Checks that worked without opening screenshots: an audit page that loads the mockup in an iframe and prints overflow, text under 16 px, targets under 44 and blur count as text. In zsh `set -- $t` does not word-split (use explicit calls). Headless Chrome needs the 390 iframe trick (see [[mockup-renders-and-actuals]]). Figma renders go in with `upload_assets` (multipart POST per submitUrl), no `use_figma` image code needed.

Open at hand-back: the CTO's MIN-4660 decision had not landed; "not opted in" matches state conflicts with the server's single empty answer.
