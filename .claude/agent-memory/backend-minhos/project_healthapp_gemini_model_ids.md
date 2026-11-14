---
name: healthapp-gemini-model-ids
description: The agents' GEMINI_API_KEY cannot use gemini-2.5-flash (404 "no longer available to new users"); gemini-3.8-flash and 3.5-flash work with responseJsonSchema
metadata:
  type: project
---

With the `GEMINI_API_KEY` in `~/.claude/.env.agents` (set on conductor as `HEALTHAPP_GEMINI_API_KEY`), `models/gemini-2.5-flash:generateContent` answers 404 "no longer available to new users" even though `models.list` still lists it. `gemini-3.8-flash` (Google's suggested replacement) and `gemini-3.5-flash` both returned schema-valid JSON on a synthetic lab image in about 5.5 s (2026-11-14). `generationConfig.responseJsonSchema` (plain JSON Schema from `z.toJSONSchema`, `$schema` key removed) is accepted.

**Why:** `models.list` is not proof a model is callable; only a generateContent call is.

**How to apply:** probe a model id with one real call before making it a default. In zsh, write `${m}:generateContent`, never `$m:generateContent` — `:g` is a zsh modifier and the URL is silently mangled into a 404 with an empty body. See [[healthapp-data-api-exposure]].
