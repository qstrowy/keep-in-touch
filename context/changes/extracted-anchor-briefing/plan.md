# Extracted anchor briefing Implementation Plan

## Overview

Deliver the first end-to-end conversation-anchor flow: an owner explicitly extracts anchors from all saved notes for one selected person, sees a compact privacy notice and reliable progress/failure state, and later sees the current open anchors in that person's briefing. The browser remains the only place that knows person, interaction, and provenance identifiers; the existing relay receives one combined note string only.

## Current State Analysis

`FirstPersonDashboard` renders the selected person's details and `InteractionPanel`, which persists and lists dated interaction notes locally. The existing extraction endpoint is authenticated and same-origin, but accepts exactly one `{ note }` request and has no browser caller or local anchor storage. The local vault supports owner-scoped parent/child records and cascade deletion but has no conditional replace operation for a generated anchor set.

## Desired End State

For a selected person with saved interactions, the owner can press one explicit “Extract anchors” control. The browser combines all note texts in chronological order, refuses before sending if the bounded extraction context is too large, and sends no metadata besides the resulting note string. A successful response atomically replaces that person's current generated anchors, retaining local provenance to every included interaction; a failure keeps the previous anchors and offers a retry.

The person's briefing shows last-contact date, three recent notes, and distinct open groups for topics, follow-ups, and suggested next steps. The full interaction history remains below the briefing. No real note is required for acceptance testing; a synthetic note is sufficient.

### Key Discoveries

- `src/components/people/FirstPersonDashboard.tsx:479-498` is the selected-person composition point; its existing person cascade deletion removes every descendant record.
- `src/components/interactions/InteractionPanel.tsx:34-89` already loads and stores local person-child interaction notes, but deliberately makes no remote call after saving.
- `src/lib/extraction/contract.ts:37-48` provides the delete-wins persistence shape, while its public request validator currently shares the single-note 5,000-character limit.
- `src/lib/relationship-data/local-vault.ts:31-103` has the owner-scoped transactions and parent index required for a narrow conditional generated-anchor replacement.
- `context/foundation/private-extraction-contract.md` requires explicit action, a visible short notice, all selected-person note texts, local-only provenance, neutral retry, and source re-check before writing.

## What We're NOT Doing

- Automatic extraction when an interaction is saved, background work, polling, queues, caches, server retries, or client-side provider configuration.
- Sending person names, IDs, interaction IDs, dates, owner/account data, cookies, authorization headers, or browser metadata to OpenRouter.
- Silent context truncation, note summarization, compaction, selection heuristics, multi-request extraction, or an indefinitely growing request body. Those belong to a future extraction-context-management change.
- Editing, dismissing, resolving, or manually correcting anchors; S-06 owns those controls.
- Deleting individual interactions, changing authentication, adding remote relationship-data persistence, or sending real notes as part of acceptance testing.

## Implementation Approach

Introduce a small local anchor domain whose records are direct children of a person and carry a local list of the interaction IDs included in their extraction run. Extend the local vault with one transaction that verifies those source interactions still belong to the person, removes the prior generated anchor children, and writes the replacement set; this creates a delete-wins boundary without remote persistence.

Add a browser-only extraction coordinator outside protected relationship-data modules. It loads all of the selected person's interactions, combines their note texts in chronological order with whitespace-only separation, measures the serialized request against a dedicated combined-context budget, calls the existing same-origin endpoint once, and uses the conditional vault operation only after a valid response. A new briefing component owns the explicit action, compact disclosure, process/error/retry states, and display of current anchors plus recent context.

## Critical Implementation Details

The combined request budget is distinct from the 5,000-character per-interaction limit. S-05 must define a lower, byte-measured safe context budget beneath the endpoint's 25 KB body ceiling and fail before `fetch` if the serialized `{ note }` request exceeds it. It must not silently omit older interactions.

Replacement must happen in one owner-local IndexedDB transaction: verify the person and every source interaction immediately before deleting prior generated anchors and writing the new set. A late response after person deletion, source removal, or person switch is discarded without recreating anything.

## Phase 1: Define local anchors and bounded all-history extraction

### Overview

Create the local anchor/provenance contract and the narrow storage/coordinator primitives that preserve privacy, all-history context, owner isolation, and delete-wins semantics before adding UI.

### Changes Required

#### 1. Local anchor records and owner-local replacement transaction

**Files**: `src/lib/anchors/anchor.ts`, `src/lib/anchors/anchor.test.ts`, `src/lib/relationship-data/types.ts`, `src/lib/relationship-data/local-vault.ts`, `src/lib/relationship-data/local-vault.test.ts`

**Intent**: Define valid generated anchors as person descendants with local-only source interaction provenance, and make replacing the generated set safe against deletion races.

**Contract**: Support the existing `topic`, `follow_up`, and `proposed_interaction` kinds; every stored anchor has normalized text, creation metadata, and a non-empty ordered list of source interaction IDs. Add a narrowly named vault operation that, in one owner-scoped read/write transaction, verifies the person and all interaction sources still exist beneath it, removes only the person's prior generated anchors, and writes the replacement records. It returns a neutral non-persisted outcome when the source set is no longer valid.

#### 2. Combined extraction request boundary

**Files**: `src/lib/extraction/contract.ts`, `src/lib/extraction/contract.test.ts`, `src/lib/extraction/client.ts`, `src/lib/extraction/client.test.ts`, `context/foundation/private-extraction-contract.md`

**Intent**: Separate single-note validation from the bounded combined-history request used only by the explicit S-05 action, while ensuring no local metadata can cross the network boundary.

**Contract**: Keep the existing 5,000-character interaction validation unchanged. Define a dedicated UTF-8 serialized-request context budget below the endpoint's 25 KB limit; combine all saved note texts chronologically using only whitespace separation, reject an over-budget history before any request, and call `/api/extractions/anchors` with exactly `{ note }`. Map endpoint failures to neutral browser outcomes without provider details or note content. Record the full-history, bounded-refusal policy in the private extraction contract.

### Success Criteria

#### Automated Verification

- Unit tests prove anchor parsing rejects malformed kind, text, timestamp, parent, and source-provenance records.
- Vault tests prove owner isolation, person cascade deletion, atomic replacement, and discard of a late result when the person or any source interaction no longer exists.
- Client tests prove chronological all-history composition, byte-budget refusal without `fetch`, exact note-only requests, and neutral failure decoding.
- `npm test` and `npm run lint` pass with the local relationship-data network boundary intact.

#### Manual Verification

- Review the local anchor payload and browser request shape to confirm provenance stays in IndexedDB and only the combined raw note text crosses the relay.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Add the explicit extraction and briefing interface

### Overview

Give the selected person a compact briefing and an explicit, disclosure-backed extraction action that stores only a successful valid result locally.

### Changes Required

#### 1. Person briefing and extraction state component

**Files**: `src/components/anchors/AnchorBriefing.tsx`, `src/components/people/FirstPersonDashboard.tsx`

**Intent**: Add the first user-visible briefing without turning the interaction save flow into automatic processing.

**Contract**: Render last-contact date, the three newest saved notes as recent context, and separate groups for topics, follow-ups, and suggested next steps. Show a compact secondary notice directly beside the manual “Extract anchors” control explaining that saved note text is sent to the configured processing service and that the application does not add names, dates, or account data. Disable the control until at least one interaction exists and while extraction is running; retain the full interaction list below the briefing.

#### 2. Explicit run, replacement, and retry lifecycle

**Files**: `src/components/anchors/AnchorBriefing.tsx`, `src/lib/anchors/anchor.ts`, `src/lib/extraction/client.ts`

**Intent**: Turn one owner action into one bounded combined-history request whose successful result replaces the current generated set and whose failures preserve it.

**Contract**: On action, load the selected person's current local interactions, build the bounded request, show “Extracting anchors…”, and send exactly one authenticated same-origin request. On success, conditionally replace the local set; an empty valid candidate response clears prior generated anchors and shows the no-open-anchors state. On an unavailable, timeout, malformed, too-large, or delete-wins outcome, preserve existing anchors and show neutral guidance with a user-initiated retry. Do not display provider errors or note contents in errors.

### Success Criteria

#### Automated Verification

- Focused tests prove briefing grouping, last-contact/recent-context ordering, disabled/running/retry states, successful replacement, and preservation after neutral failures.
- Tests prove repeated action cannot create concurrent requests or duplicate generated anchor sets.
- `npm test`, `npm run lint`, and `npm run build` pass without client-side secrets or new remote relationship-data persistence.

#### Manual Verification

- In an authenticated browser with a synthetic saved interaction, confirm the compact notice, disabled-before-notes state, running state, valid result, grouped briefing, and full interaction history are understandable.
- Confirm a synthetic empty response clears current generated anchors, while a simulated neutral failure keeps them and exposes a retry action.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Prove end-to-end safety and prepare real use

### Overview

Verify the complete browser-to-relay-to-local-vault path with synthetic content and document the explicit gate that remains before real personal notes are used.

### Changes Required

#### 1. End-to-end boundary, lifecycle, and regression coverage

**Files**: `src/lib/extraction/client.test.ts`, `src/lib/anchors/anchor.test.ts`, `src/lib/relationship-data/relationship-data-boundary.test.ts`, `src/pages/api/extractions/anchors.test.ts`

**Intent**: Prove that S-05 has not weakened the approved processor boundary or the local deletion guarantee.

**Contract**: Cover the exact combined request body, no forwarded browser metadata upstream, over-budget refusal before the network call, owner isolation, person deletion during an in-flight request, source-provenance re-check before replacement, and no persistence after a discarded response. Keep existing endpoint authentication/origin/error tests intact and verify no protected local module gains a network API.

#### 2. Operational handoff and real-note gate

**Files**: `context/foundation/private-extraction-contract.md`, `context/changes/extracted-anchor-briefing/change.md`

**Intent**: Make the synthetic-only acceptance result auditable and preserve the owner's explicit choice before real private content is processed.

**Contract**: Record only the synthetic acceptance outcome and the combined-context refusal policy; never add a key, cookie, note, response body, or provider diagnostic. State that using real notes requires a new explicit owner approval after the implemented UI and deployed route are inspected.

### Success Criteria

#### Automated Verification

- `git diff --exit-code -- src/lib/interactions src/lib/relationship-data` confirms protected local modules retain their network restriction.
- `npm test`, `npm run lint`, and `npm run build` pass.
- Tests prove no request is made for over-budget context, invalid local source, unauthenticated endpoint access, or a stale/deleted selected person.

#### Manual Verification

- In the deployed authenticated application, use only a made-up synthetic note to complete one extraction and confirm no secrets, raw content, or local identifiers appear in browser-visible requests, errors, or application logs.
- Confirm the owner can read the briefing within two seconds after it is loaded and can see the original interaction history unchanged.
- Explicitly confirm whether to authorize real-note use; leave it blocked if no affirmative approval is given.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before marking S-05 ready for S-06.

## Testing Strategy

### Unit Tests

- Anchor record validation, grouping, source-provenance normalization, and current-set replacement.
- Combined note construction in chronological order, serialized byte budget, exact request allowlist, and neutral browser error mapping.
- Conditional vault replacement with owner isolation and person/source deletion counterexamples.

### Integration Tests

- Same-origin authenticated relay invocation receives only `{ note }` and preserves the existing no-fallback, ZDR service contract.
- Browser coordinator receives valid/empty/neutral results and updates only owner-local anchor records.
- Existing relationship-data boundary tests continue to reject remote dependencies in protected modules.

### Manual Testing Steps

1. Save one or more made-up interactions for a selected person; confirm the full history remains available below the briefing.
2. Confirm the disclosure is compact and visible, then extract anchors and inspect the grouped result, last-contact date, and three-note context.
3. Repeat the action; confirm the valid new result replaces rather than duplicates the prior anchors.
4. Use an over-limit synthetic history and a neutral failure path; confirm no request/previous-anchor loss occurs and retry remains user initiated.
5. Delete the person while an extraction is pending; confirm no anchor is recreated and all associated local data remains deleted.
6. Do not use a real note unless the owner explicitly approves after the deployed synthetic acceptance check.

## Performance Considerations

The briefing reads local records only and renders a fixed three-note context, keeping the normal view within the PRD's two-second target. Extraction remains one foreground request with the existing 90-second service deadline. The combined-context budget prevents a request body from reaching the Worker ceiling; no silent truncation or background processing is introduced.

## Migration Notes

No IndexedDB schema migration is required because anchors use the existing generic record store and parent index. Existing people and interactions remain unchanged. Removing the generated-anchor records or disabling the extraction route leaves original interaction notes intact.

## References

- Product outcome: `context/foundation/prd.md:47-58,76-86,94-108`
- Roadmap slice: `context/foundation/roadmap.md:167-177`
- Privacy contract: `context/foundation/private-extraction-contract.md`
- Local vault: `src/lib/relationship-data/local-vault.ts:17-104`
- Interaction contract and UI: `src/lib/interactions/interaction.ts:4-96`, `src/components/interactions/InteractionPanel.tsx:34-171`
- Extraction contract and route: `src/lib/extraction/contract.ts:1-104`, `src/lib/extraction/endpoint.ts:16-64`, `src/pages/api/extractions/anchors.ts:1-33`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Define local anchors and bounded all-history extraction

#### Automated

- [x] 1.1 Add validated local anchors and atomic owner-local replacement — 6c56763
- [x] 1.2 Add bounded combined-history request construction and browser client coverage — 6c56763
- [x] 1.3 Pass focused anchor, vault, extraction, lint, and protected-boundary verification — 6c56763

#### Manual

- [x] 1.4 Review local-only provenance and exact note-only browser request shape — cdbde0d

### Phase 2: Add the explicit extraction and briefing interface

#### Automated

- [x] 2.1 Add the person briefing, compact disclosure, and explicit extraction control — d695976
- [x] 2.2 Implement replacement, empty-result, neutral-failure, and retry UI lifecycle — d695976
- [x] 2.3 Pass focused UI/coordinator, full test, lint, and build verification — d695976

#### Manual

- [x] 2.4 Confirm synthetic extraction, grouped briefing, retained history, and retry behavior in an authenticated browser — cdbde0d

### Phase 3: Prove end-to-end safety and prepare real use

#### Automated

- [x] 3.1 Add end-to-end boundary, delete-wins, and no-request counterexample coverage — cdbde0d
- [x] 3.2 Record synthetic-only acceptance and preserve the explicit real-note gate — cdbde0d
- [x] 3.3 Pass full boundary diff, test, lint, and production-build verification — cdbde0d

#### Manual

- [x] 3.4 Verify deployed synthetic extraction, privacy visibility, performance, and deletion behavior — cdbde0d
- [x] 3.5 Confirm or explicitly defer real-note authorization after deployed inspection — cdbde0d
