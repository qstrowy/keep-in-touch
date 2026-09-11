---
change_id: extraction-reliability
title: Make anchor extraction failures diagnosable and bounded
status: archived
created: 2026-09-10
updated: 2026-09-11
archived_at: 2026-09-11T14:13:59Z
---

## Notes

This change adds temporary local-development-only diagnostics for the intermittent extraction failure and timeout observation. The diagnostics record only a random request ID, stage, timing, HTTP status, and provider request ID; they never record note text, candidate text, credentials, cookies, headers, or provider response bodies. They add localhost-only OpenRouter Activity attribution and remain disabled in production.

It also disables model reasoning with `reasoning.effort: "none"`. The existing model, pinned provider, strict schema, ZDR, no-fallback routing, and 90-second foreground deadline remain unchanged. An authorized synthetic request proved the pinned route accepted the setting and returned a valid candidate structure.
