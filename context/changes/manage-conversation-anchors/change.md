---
change_id: manage-conversation-anchors
title: Manage conversation anchors
status: implemented
created: 2026-09-10
updated: 2026-09-10
archived_at: null
---

## Notes

<!-- Free-form notes for this change: links, ad-hoc context, decisions that don't belong in research/frame/plan. -->

Phase 1 and Phase 2 automated coverage is complete. The local anchor contract now reads legacy generated records as open, preserves owner-managed lifecycle records during exact-match reconciliation, and keeps closed anchors out of the briefing. Phase 3 verification passed 72 tests, lint, production build, and whitespace checks; the build emitted only the known nonfatal local Wrangler log-file EPERM. Manual browser verification confirmed browser-local persistence, inline lifecycle controls, reload persistence, no model call on interaction save, later manual extraction behavior, and person deletion cascade. No real note, provider response, identifier, or credential is recorded here.

The current contract intentionally covers exact candidate carry-forward only. A later manual full-history extraction may produce a semantically equivalent reworded candidate; durable semantic suppression is deferred to a successor slice with an explicit privacy and reconciliation decision.
