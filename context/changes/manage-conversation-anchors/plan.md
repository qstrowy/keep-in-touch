# Manage conversation anchors Implementation Plan

## Overview

Complete the owner-control loop required by FR-005 and FR-006. An owner can edit the wording of any generated anchor, resolve it, or dismiss it from the briefing. Those choices stay owner-local, take effect immediately, and remain respected when a later manual extraction refreshes generated anchors.

## Current State Analysis

`AnchorBriefing` loads all anchor children of the selected person from the owner-scoped IndexedDB vault, groups them by kind, and renders text-only list items. Each successful extraction currently calls `replaceChildrenIfSourcesExist`, which removes every `anchors` child before writing a new generated set. The existing anchor payload is intentionally strict and has only kind, text, creation time, and source-interaction provenance.

That wholesale replacement is incompatible with durable owner decisions: a correction, resolution, or dismissal would otherwise be lost on the next extraction. The feature remains entirely browser-local; it must not call the extraction route, alter the relay payload, or introduce server persistence.

## Desired End State

The briefing presents only open anchors, grouped as today. Each topic, follow-up, and suggested next step has compact inline controls: Edit changes its text, while Resolve and Dismiss each require a confirmation before persisting the decision. Resolved and dismissed anchors remain local descendants for lifecycle and reconciliation purposes but do not appear in the open briefing.

A later successful extraction atomically replaces only untouched generated anchors. It retains owner-managed anchors and suppresses a newly generated candidate only when its normalized original kind and text exactly match a managed anchor's preserved original candidate key. This is deliberately deterministic; semantically similar but reworded candidates may still appear.

### Key Discoveries

- `src/lib/anchors/anchor.ts:9-79` validates the current strict generated-anchor payload and is the right boundary for any lifecycle record parsing and creation.
- `src/lib/relationship-data/local-vault.ts:65-123` provides the source-existence transaction but currently deletes all anchors; reconciliation must retain managed children in that same owner-scoped transaction.
- `src/components/anchors/AnchorBriefing.tsx:29-130` already owns local anchor state and the foreground extraction lifecycle; it is the natural home for immediate post-mutation UI updates and race prevention.
- `src/lib/anchors/briefing.ts:8-14` only groups by kind, so it must receive or derive the open-only set rather than exposing closed records.
- `context/foundation/private-extraction-contract.md:21-46` forbids relationship-data network persistence, automatic retries, and background work; S-06 is a local lifecycle change only.

## What We're NOT Doing

- No provider, relay, prompt, extraction schema, or external request changes.
- No manual creation of entirely new anchors, kind reclassification, bulk-management mode, or closed-anchor history screen.
- No semantic/AI matching of re-extracted candidates; reconciliation is exact normalized kind-and-original-text matching only.
- No undo/restore interface for dismissed or resolved anchors in this slice.
- No background extraction, server retention, or retry queue.

## Implementation Approach

Extend the local anchor domain with a backward-compatible lifecycle representation. Generated records stay replaceable; a user action turns its record into an owner-managed record, preserving the original generated kind/text as an exact reconciliation key. Extend the existing owner-scoped replacement transaction to retain managed children and exclude matching replacement candidates, so all source validation, deletion safety, reconciliation, and writes happen atomically.

The briefing filters to open anchors before grouping, persists actions through the anchor-domain helpers, and updates local state only after the vault succeeds. It disables conflicting controls while an extraction or anchor mutation is active and uses the existing neutral error pattern if IndexedDB is unavailable.

## Critical Implementation Details

Manual state must not live only in React state: an extraction can occur after a reload, and a person deletion must still cascade it. A successful extraction must reconcile within the same IndexedDB transaction that rechecks the person and source interactions; precomputing preservation outside the transaction would permit a late write to lose an owner action.

## Phase 1: Define durable local lifecycle and atomic reconciliation

### Overview

Make anchors represent generated versus owner-managed lifecycle state without breaking existing locally stored anchors, and make refreshes preserve the owner-managed set safely.

### Changes Required

#### 1. Anchor lifecycle domain

**Files**: `src/lib/anchors/anchor.ts`, `src/lib/anchors/anchor.test.ts`

**Intent**: Add validated local-only lifecycle data and mutation helpers so components do not construct anchor payloads or bypass provenance rules.

**Contract**: New anchor records carry a lifecycle status (`open`, `resolved`, or `dismissed`), a generated/owner-managed marker, and the normalized original generated kind/text reconciliation key. Existing four-field generated records remain readable as open, untouched generated anchors whose original key is their current kind/text. Expose domain helpers to create generated records, convert a selected anchor to a text-only owner correction, and transition it to resolved or dismissed while preserving ID, person parent, creation time, and source provenance. Reject invalid statuses, empty/overlong corrections, malformed parent/provenance, and unexpected payload keys.

#### 2. Owner-scoped generated-child reconciliation

**Files**: `src/lib/relationship-data/types.ts`, `src/lib/relationship-data/local-vault.ts`, `src/lib/relationship-data/local-vault.test.ts`

**Intent**: Replace only untouched generated anchor children after revalidating the selected person and every source interaction; retain owner-managed descendants and avoid reintroducing an exact original candidate the owner already handled.

**Contract**: Extend the narrow replacement operation (or replace it with an equivalently narrow reconciliation operation) so one read/write transaction: verifies the root and all source records; reads current matching children; retains owner-managed anchor records; deletes only replaceable generated anchors; skips an incoming candidate record when its normalized original kind/text exactly matches a retained managed anchor; and writes the remaining generated set. It returns a neutral non-persisted outcome if the parent or a source no longer belongs to the owner. Unrelated children and every other owner's records remain untouched.

### Success Criteria

#### Automated Verification

- Anchor-domain tests prove legacy generated records read as open, newly generated records validate lifecycle metadata, and corrected/resolved/dismissed transitions preserve immutable local provenance.
- Anchor-domain tests reject malformed lifecycle fields, extra payload fields, invalid exact-match keys, blank edits, and text over the existing 500-character limit.
- Vault tests prove one owner’s reconciliation preserves managed anchors, replaces only untouched generated anchors, suppresses exact original matches, retains distinct candidates, and never affects another owner or unrelated child.
- Vault tests prove source disappearance and person deletion still prevent a late reconciliation write.

#### Manual Verification

- Inspect browser-local records after each lifecycle action to confirm only local relationship data changes and the original interaction records remain intact.

**Implementation Note**: After completing this phase and its automated verification, pause for manual confirmation before proceeding.

---

## Phase 2: Add compact owner controls to the briefing

### Overview

Expose the lifecycle safely in the existing briefing without adding a new route, modal, or automatic extraction behavior.

### Changes Required

#### 1. Open-only briefing presentation helpers

**Files**: `src/lib/anchors/briefing.ts`, `src/lib/anchors/briefing.test.ts`

**Intent**: Ensure group counts and the empty briefing state reflect only unresolved, open anchors.

**Contract**: Presentation helpers filter resolved and dismissed records before grouping all three existing kinds. Preserve current newest-first recent interaction behavior and group labels.

#### 2. Inline lifecycle controls and local state handling

**Files**: `src/components/anchors/AnchorBriefing.tsx`

**Intent**: Let the owner manage every visible anchor in context, while keeping storage failures neutral and preventing races with a foreground extraction.

**Contract**: Render compact Edit, Resolve, and Dismiss controls for every anchor kind. Edit reveals a controlled text field with Save/Cancel and does not allow kind changes. Resolve and Dismiss each reveal an inline confirm/cancel step before persistence. Persist via the owner-scoped vault and anchor-domain helpers, then update the component’s local anchor state only after success. While any anchor mutation is pending, disable Extract and competing anchor controls; while extraction is running, disable anchor controls. On a vault failure, retain the rendered anchor and show a generic `role="alert"` message without record, owner, note, or provider details. Resolved and dismissed anchors disappear immediately after their confirmed write; no closed-items UI is added.

#### 3. Re-extraction integration

**Files**: `src/components/anchors/AnchorBriefing.tsx`, `src/lib/anchors/anchor.ts`, `src/lib/relationship-data/local-vault.ts`

**Intent**: Route the existing manual Extract action through reconciliation instead of destructive full replacement.

**Contract**: Keep the existing same-origin `{ note }` request, context-size refusal, and neutral error handling unchanged. After a valid response, build generated records and invoke the Phase 1 owner-local reconciliation operation. Refresh local briefing state from its returned/loaded reconciled records so retained corrections and hidden resolved/dismissed records are handled correctly. No lifecycle action triggers an extraction request.

### Success Criteria

#### Automated Verification

- Briefing helper tests prove resolved and dismissed anchors are excluded while open topics, follow-ups, and suggested next steps retain their groups.
- Focused domain/vault tests prove a corrected open anchor remains visible after a matching later extraction, while matching resolved/dismissed anchors remain hidden.
- Protected-boundary tests prove S-06 introduces no fetch, API, Supabase, or provider dependency into local relationship-data modules.

#### Manual Verification

- In an authenticated browser, edit text for each anchor kind and confirm save/cancel behavior, reload persistence, and unchanged grouping.
- Confirm Resolve and Dismiss each require confirmation; after confirmation, the item immediately leaves the briefing and remains absent after reload.
- Start a manual extraction only when no mutation is pending; verify controls lock during the request and that a later successful refresh preserves corrected items and hides exactly matching resolved/dismissed items.
- Simulate unavailable browser storage and confirm the visible item remains unchanged with a neutral error message.

**Implementation Note**: After completing this phase and its automated verification, pause for manual confirmation before proceeding.

---

## Phase 3: Verify privacy, lifecycle, and full regression safety

### Overview

Prove the new user-control loop does not weaken the owner-local boundary or deletion guarantees established by S-05.

### Changes Required

#### 1. Cross-boundary verification and change records

**Files**: `src/lib/relationship-data/relationship-data-boundary.test.ts`, `src/lib/anchors/anchor.test.ts`, `src/lib/relationship-data/local-vault.test.ts`, `context/changes/manage-conversation-anchors/change.md`

**Intent**: Lock in the absence of new external data flow and record completion evidence without storing private interaction content.

**Contract**: Extend protected-boundary coverage as needed to reject network-capable local modules, and add lifecycle/delete-wins counterexamples where they belong. Record only verification categories and outcomes in the change record; never add a real note, anchor text, owner ID, provider response, or credential.

### Success Criteria

#### Automated Verification

- `npm test` passes, including lifecycle, reconciliation, vault isolation/cascade, extraction, and protected-boundary coverage.
- `npm run lint` passes.
- `npm run build` passes.
- `git diff --check` passes.

#### Manual Verification

- Confirm a real local workflow for one person: extract, edit one item, resolve another, dismiss a third, reload, and extract again without losing the owner decisions.
- Confirm deleting that person removes every generated and owner-managed anchor immediately and that no UI control or error reveals sensitive local data.

**Implementation Note**: After completing this phase and its automated verification, pause for manual confirmation before closing the change.

---

## Testing Strategy

### Unit Tests

- Backward-compatible anchor parsing, lifecycle validation, text normalization, and immutable provenance retention.
- Open-only grouping across all three anchor kinds.
- Exact normalized reconciliation matching and non-matching candidate behavior.

### Storage and Boundary Tests

- Owner isolation for every lifecycle transition and reconciliation.
- Cascade deletion of generated and managed anchor descendants.
- Deleted source/person counterexamples for a late extraction result.
- No network-capable imports in protected relationship-data modules.

### Manual Testing Steps

1. Create synthetic interactions, extract anchors, and check each group’s inline controls.
2. Edit an anchor, cancel a different edit, resolve one, and dismiss one; reload the page after each completed action.
3. Extract again and confirm corrections persist, exact matches for resolved/dismissed anchors stay absent, and genuinely distinct candidates can appear.
4. Delete the person and confirm all local descendants disappear.

## Performance Considerations

The normal briefing remains one owner-local parent lookup and lightweight filtering. Reconciliation runs only after the existing explicit extraction action and reuses its single IndexedDB transaction, so it does not add a request or background process to the normal briefing path.

## Migration Notes

No IndexedDB schema migration is needed because the generic record store remains unchanged. Backward-compatible parsing treats existing generated anchor payloads as open and untouched until their next reconciliation or owner action writes the new lifecycle representation.

## References

- Product requirements: `context/foundation/prd.md` — US-01; FR-005, FR-006; Non-Functional Requirements.
- Roadmap slice: `context/foundation/roadmap.md` — S-06.
- Prior extraction implementation: `context/archive/2026-09-09-extracted-anchor-briefing/plan.md`.
- Local extraction boundary: `context/foundation/private-extraction-contract.md`.
- Existing anchor domain: `src/lib/anchors/anchor.ts`.
- Existing briefing UI: `src/components/anchors/AnchorBriefing.tsx`.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Define durable local lifecycle and atomic reconciliation

#### Automated

- [x] 1.1 Add backward-compatible anchor lifecycle parsing and mutation helpers — f31fff3
- [x] 1.2 Reconcile generated children atomically while preserving managed anchors — f31fff3
- [x] 1.3 Pass focused anchor and owner-local vault lifecycle coverage — f31fff3

#### Manual

- [x] 1.4 Confirm lifecycle records and original interactions remain browser-local — f31fff3

### Phase 2: Add compact owner controls to the briefing

#### Automated

- [x] 2.1 Filter and group only open anchors across all three kinds — f31fff3
- [x] 2.2 Add inline edit, resolve, dismiss, confirmation, and race-safe briefing behavior — f31fff3
- [x] 2.3 Route manual extraction through managed-anchor reconciliation and retain protected-boundary coverage — f31fff3

#### Manual

- [x] 2.4 Confirm inline controls, confirmations, reload persistence, neutral storage errors, and later extraction behavior — f31fff3

### Phase 3: Verify privacy, lifecycle, and full regression safety

#### Automated

- [x] 3.1 Add lifecycle delete-wins and no-network counterexample coverage — f31fff3
- [x] 3.2 Pass full test, lint, production-build, and whitespace verification — f31fff3

#### Manual

- [x] 3.3 Confirm the end-to-end owner-control and person-deletion workflow in an authenticated browser — f31fff3
