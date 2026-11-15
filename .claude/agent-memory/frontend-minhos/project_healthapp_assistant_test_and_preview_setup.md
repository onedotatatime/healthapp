---
name: healthapp-assistant-test-and-preview-setup
description: healthapp src/features/assistant testing and render setup: node-only vitest (no jsdom), case-insensitive file clash, preview route steering, scratch render script
metadata:
  type: project
---

Vitest here runs in node, `src/**/*.test.ts` only, no jsdom and no testing-library: components are tested with `renderToStaticMarkup`, and click paths by calling plain function components and walking the element tree (CitationChip uses a hook, so do not expand it). Logic that needs "one call per press" goes in a pure controller (`diagnoses.state.ts`), not in a hook.

A `Diagnoses.tsx` and a `diagnoses.ts` in one folder break `tsc` on macOS (case-only clash); name the logic file `<name>.state.ts` or `.calc.ts`.

`/preview/doctor-analysis` (dev server only, no backend) takes `?over=` and `?dx=` to steer the mocks; renders for the PR came from a Playwright script on a private port (never 5185/5186), element screenshots converted to webp with PIL, linked from the branch because Linear cannot take files from the shell.

**Why:** MIN-4665 (2026-11-15). **How to apply:** next assistant-feature view or state: follow the same split (pure view, thin panel, controller) and add a `?x=` switch to the preview.
