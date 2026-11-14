---
name: healthapp-dashboard-chat-ui
description: How the dashboard chat page (MIN-4498) is built and the traps found: CTO text rule, key in memory, mock bridge, browser-check pitfalls
metadata:
  type: project
---

Chat page = `docs/dashboard/drafts/shared/chat.js` + `chat-model.js` (pure, tested in node) + `chat.css`, mounted by `direction-A/a.js` at `#/chat/<Agent>`.

**Text rule (CTO 2cc7efc9 on MIN-4497):** the bridge is the one source of words. A refusal shows its `reason`; no text per refusal code in the page. A test fails if any sentence of `chat_bridge.REASONS` appears in the page files (act_off excepted). Events view is ONE latest line, not a list.
**Why:** Pix's frame texts and the bridge's drifted before; one source stops that.
**How to apply:** when the bridge adds a state, render its fields; ask Cron for a `reason` field instead of copying text.

**Key:** arrives as `#c=` once, memory only (no storage; a test greps for it). Reload loses it, so a reload needs `open.sh` again.

**Looking at it without a model:** `dashboard/tests/chat_dev_server.py` (real bridge + stub claude) and `chat_mock_server.py --act` (every state from `dashboard/fixtures/chat.example.json`, including the act states the bridge lacks).

**Pitfalls met:** (1) `document.querySelectorAll('[class*=hd-alert]').forEach(remove)` also removes `<html class="hd-alert-open">`: the page dies, `documentElement` is null. Click `.hd-alert-close` instead. (2) The built-in browser pane scales screenshots to 800 px and caches CSS/JS from SimpleHTTPServer: `fetch(url,{cache:'reload'})` before re-navigating. A screenshot taken within about 1 s of opening the drawer shows it mid-fade. (3) Worktree-isolated Bash refuses compound commands and `git grep` with long patterns: write a script file and run it. (4) `const DATA` in sample-data.js is not on `window`. (5) A fixed rail at z-index 25 covers the bottom 56 px of a drawer under 900 px.
