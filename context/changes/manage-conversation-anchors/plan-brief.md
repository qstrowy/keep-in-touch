# Manage conversation anchors — Plan Brief

> Full plan: `context/changes/manage-conversation-anchors/plan.md`

## What & Why

This change gives the owner control over generated conversation anchors: edit their wording, resolve them, or dismiss them. It completes the trust loop required by the product: an extraction is useful only when an owner can correct it and that decision remains meaningful later.

## Starting Point

The current local briefing groups generated anchors and offers manual extraction, but its next successful extraction replaces every anchor. The anchor model has no lifecycle state, so corrections and closures cannot persist yet.

## Desired End State

Every topic, follow-up, and suggested next step has compact inline Edit, Resolve, and Dismiss controls. Only open anchors appear in the briefing; the owner’s corrected, resolved, and dismissed choices persist in browser-local IndexedDB and survive a later extraction when its original candidate matches exactly.

## Key Decisions Made

| Decision | Choice | Why |
| --- | --- | --- |
| Owner choices after refresh | Preserve them | Re-extraction must not silently discard an explicit correction, dismissal, or resolution. |
| Managed types | All three anchor kinds | Keeps controls consistent for topics, follow-ups, and suggested next steps. |
| Dismissal | Durable hidden local state | It remains distinct from resolution and does not reappear after reload or an exact later match. |
| Correction | Text only | Repairs wording without adding reclassification scope. |
| Confirmation | Confirm Resolve and Dismiss | Avoids accidental lifecycle changes without adding a separate management surface. |
| Reconciliation | Exact original kind/text match | A deterministic private rule prevents known repeats without semantic or provider-based matching. |
| UI | Compact inline controls | Keeps management in the context of the briefing and fits the existing mobile-first component. |

## Scope

**In scope:** local anchor lifecycle data; atomic generated-anchor reconciliation; inline edit/resolve/dismiss controls; local persistence; targeted safety tests and browser acceptance.

**Out of scope:** network/API changes, manual anchor creation, kind changes, bulk mode, history/restore UI, semantic matching, background extraction, or server retention.

## Architecture / Approach

The anchor domain gains backward-compatible lifecycle and original-candidate metadata. A single owner-scoped IndexedDB reconciliation transaction preserves owner-managed records, removes untouched generated records, and filters exact repeat candidates. `AnchorBriefing` persists inline actions through that domain, displays open records only, and remains the sole UI integration point.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Local lifecycle | Valid lifecycle records and atomic reconciliation | Losing manual decisions during a refresh |
| 2. Inline briefing controls | Edit, resolve, dismiss, and safe extraction integration | Storage/action race behavior |
| 3. Safety verification | Local-boundary, deletion, and end-to-end proof | Regressing S-05 privacy guarantees |

**Prerequisites:** S-05 is complete; existing browser-local anchor and vault tests are available.

**Estimated effort:** ~2–3 focused sessions across three phases.

## Open Risks & Assumptions

- Exact matching deliberately cannot detect substantially reworded duplicates; that is a future semantic-quality concern, not a reason to send more data externally.
- Resolved and dismissed items have no restore/history interface in this scope, so confirmations are required before either action.

## Success Criteria (Summary)

- Owner actions take effect immediately, survive reload, and stay private to the active browser owner.
- A later manual extraction preserves managed choices and does not revive an exact original candidate.
- Full test, lint, and production build verification pass; deleting a person still removes all anchor variants.
