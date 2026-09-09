# Private extraction contract — Plan Brief

> Full plan: `context/changes/private-extraction-contract/plan.md`
> Research: `context/changes/private-extraction-contract/research.md`

## What & Why

This foundation establishes the only permitted route for external AI extraction: a product-owned OpenRouter account behind an authenticated Worker relay. It allows raw interaction-note text to be processed without sending person, account, date, or interaction metadata, while keeping every persisted relationship record in the browser.

It is necessary because no default provider mode proves the PRD's no-retention promise. The provider configuration, routing controls, application behavior, and operational evidence must therefore be explicit before S-05 builds conversation anchors.

## Starting Point

Interactions are already saved and re-read in owner-scoped IndexedDB. Lint prevents the interaction and local-vault modules from making network calls; dashboard authentication does not automatically secure a new API endpoint.

## Desired End State

An authenticated same-origin endpoint accepts exactly one valid note, calls a pinned OpenRouter ZDR route with a server-only secret, and returns a strictly validated candidate result or a neutral failure within 90 seconds. It has no relationship-data persistence, queue, cache, automatic retry, or raw-content logging.

S-05 can then safely add the user-facing manual full-history extraction action, notice, local anchor records, and briefing behavior on top of that boundary.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Extraction model | External raw-note extraction through OpenRouter | On-device inference is too heavy for the MVP. | Plan |
| Data minimization | Fixed instruction plus raw note text only | The PRD permits note text but forbids linked profile/account metadata. | Research |
| Privacy routing | ZDR enforced, one pinned provider/model, no fallback, prompt logging off | Prevents silent routing to a different or retaining processor. | Plan |
| Trigger | Manual after the owner decides context is sufficient | Several notes may need to accumulate before extraction is useful. | Plan |
| Context policy | Initially all notes for the selected person | Maximizes context now; growth management is deliberately deferred. | Plan |
| Failure deadline | Abort at 90 seconds with no automatic retry | Preserves margin below the two-minute PRD requirement. | Plan |
| Deletion race | Delete locally; discard late candidate | Keeps the existing immediate-deletion guarantee. | Plan |

## Scope

**In scope:** durable privacy contract, pure request/result contracts, Worker secret declarations, authenticated relay, ZDR/no-fallback OpenRouter request, test coverage, and synthetic operational verification.

**Out of scope:** user-facing extraction UI, notice, candidate storage, anchor/briefing UX, BYOK, background extraction, and context compaction.

## Architecture / Approach

```text
future S-05 local notes -> exact { note } -> authenticated Worker relay
  -> OpenRouter: fixed prompt + ZDR + pinned route + no fallback
  -> validated candidates -> future S-05 local IndexedDB storage
```

F-03 implements and proves the middle boundary. It does not alter the existing browser-local vault or make it network-capable.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Contracts | Durable privacy rules and testable payload/result contracts | Accidentally broadening the allowed data shape |
| 2. Relay | Authenticated, no-persistence OpenRouter relay | Secrets, API authorization, and sensitive error leakage |
| 3. Approval | Verified provider configuration and S-05 handoff | Treating dynamic provider claims as permanent proof |

**Prerequisites:** F-02's local-data contract; a human-provisioned OpenRouter account and verified ZDR-compatible pinned route before real-note use.
**Estimated effort:** ~2–3 focused sessions across 3 phases, plus a short human configuration/preview-verification session.

## Open Risks & Assumptions

- ZDR status is provider/endpoint-specific and may change, so route changes require renewed verification.
- Raw notes can contain sensitive content even without app metadata; S-05 must show the approved notice at the manual trigger.
- All-history extraction will grow with usage; this MVP accepts that cost/size trade-off until a later context-management change.

## Success Criteria (Summary)

- Tests prove only note text crosses the product boundary and no credentials or relationship metadata reach the browser or processor.
- The relay is independently authenticated, enforces ZDR/no-fallback routing, fails neutrally within 90 seconds, and does not persist content.
- A human verifies a synthetic preview request and records the exact approved configuration before real notes are used.
