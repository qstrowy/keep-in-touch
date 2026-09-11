# Manage Current Core Topics Implementation Plan

## Overview

Let the owner edit a Core Topic's displayed wording or choose **Not now** to hide it from the current browser-local
briefing. Both choices persist through reloads and person navigation, but the next valid successful manual extraction
replaces the entire snapshot; failed extraction leaves it unchanged.

## Current State Analysis

Core Topics are strict `anchors` children containing text, questions, explicit position, creation time, and source
provenance. `AnchorBriefing` loads those records into independent native disclosures and invokes
`replaceChildrenIfSourcesExist` after a valid manual extraction, replacing the whole collection. The generic vault can
put a record or delete a cascade, but it has no narrow parent-checked child mutation to prevent a late edit from
recreating a topic after its person has been deleted.

The earlier flat-anchor lifecycle design must not return: retaining managed records across extraction conflicts with
S-02's temporary current-briefing semantics. S-03 separately owns durable exclusions and all external-boundary changes.

## Desired End State

Each visible topic has Edit and **Not now** controls outside its disclosure summary. Edit permits one inline editor with
Save and Cancel; it changes only the displayed topic text and retains its read-only questions. **Not now** immediately
removes the topic with no confirmation, undo, history, or exclusion.

Both actions persist only in the owner-local current snapshot. Interaction-list refreshes, reloads, and failed
extractions preserve them. A valid successful non-empty or empty extraction atomically replaces all topics, discarding
the changed snapshot and allowing a previously hidden topic to return naturally.

### Key Discoveries

- `src/lib/anchors/anchor.ts:7-90` is the strict Core Topic boundary and can derive an edited record without a new
  payload shape.
- `src/lib/relationship-data/local-vault.ts:65-128` has source-safe collection replacement, but bare `put()` cannot
  prevent an edit from recreating a deleted person's child.
- `src/components/anchors/AnchorBriefing.tsx:66-118` already owns manual extraction and its current full replacement
  provides the required reset behavior.
- `src/components/anchors/AnchorBriefing.tsx:197-207` uses `<details>`; interactive action buttons must remain outside
  `<summary>` for accessible disclosure behavior.
- `context/foundation/prd.md:87-103` requires edit and **Not now** while preserving people, interactions, owner
  isolation, and manual-only extraction.

## What We're NOT Doing

- No **Don't suggest**, exclusions, provider prompt/route/payload changes, durable wording, history, restore, undo,
  confirmation dialog, topic creation, question editing, or question hiding.
- No interaction/person-model change, server persistence, background processing, automatic extraction, or UI-test
  framework dependency.
- No change to text limits, topic order, questions, source provenance, or the privacy notice.

## Implementation Approach

Keep Core Topics as a replaceable local snapshot. First add domain and IndexedDB operations that can safely edit or
remove one known topic only while its owner, parent person, and child record exist. Then use them in `AnchorBriefing`,
while retaining its current successful full-replacement transaction as the sole reset mechanism.

## Critical Implementation Details

A pending edit must verify the owner-local person and target topic in the same transaction; otherwise person deletion
could leave an orphan record. **Not now** needs the same parent-checked safety boundary and must update the UI only after
the local deletion succeeds. Do not reconcile edits or hides with a fresh extraction: doing so would make this temporary
feature durable.

## Phase 1: Make current-briefing mutations safe and persistent

### Overview

Define safe local operations for editing or hiding one topic without changing the Core Topic snapshot model or external
data boundary.

### Changes Required

#### 1. Edited Core Topic record helper

**Files**: `src/lib/anchors/anchor.ts`, `src/lib/anchors/anchor.test.ts`

**Intent**: Centralize edited-title validation and record construction so the UI cannot bypass Core Topic limits,
questions, ordering, or local provenance.

**Contract**: Add a helper that derives a replacement record for an existing Core Topic and person parent using new topic
text. It normalizes whitespace, requires nonblank text up to 500 characters, and retains the ID, questions, position,
creation time, and ordered source IDs exactly. It adds no lifecycle, hidden, edited-by, or external metadata field.

#### 2. Parent-checked topic update and removal

**Files**: `src/lib/relationship-data/types.ts`, `src/lib/relationship-data/local-vault.ts`,
`src/lib/relationship-data/local-vault.test.ts`

**Intent**: Persist one owner action only while the selected person and its target `anchors` child still exist, preventing
cross-owner writes or late resurrection after deletion.

**Contract**: Add focused vault operations that replace or remove one known child beneath one known parent. In one
read/write transaction, verify the active owner's parent record and target child-parent reference, then write or delete
that child. Return false when either record is absent or mismatched; preserve unrelated children, collections, and all
other owners' records.

#### 3. Snapshot-reset and local-boundary coverage

**Files**: `src/lib/anchors/anchor.test.ts`, `src/lib/relationship-data/local-vault.test.ts`,
`src/lib/relationship-data/relationship-data-boundary.test.ts`

**Intent**: Prove edits and hides remain local until a valid manual extraction resets the snapshot, without reintroducing
managed-anchor lifecycle behavior or network scope.

**Contract**: Cover invalid edits, reload-readable edited records, selected-topic-only removal, owner isolation,
unrelated-child preservation, deletion races, successful full-replacement reset, and failed/missing-source preservation.
Protected relationship-data modules remain unable to call network APIs or import remote persistence.

### Success Criteria

#### Automated Verification

- Core Topic tests prove an edit retains questions, position, creation time, and source provenance while rejecting invalid text.
- Vault tests prove owner-scoped update and **Not now** affect only the selected child.
- Vault tests prove missing parent/child, person deletion, and owner mismatch cannot persist or resurrect a topic.
- Replacement tests prove valid successful extraction resets edits/hides while failed or source-invalid extraction preserves them.
- Focused Core Topic, vault, and protected-boundary tests pass.

#### Manual Verification

- Inspect browser-local records after an edit and **Not now** action to confirm only the selected Core Topic changed and interactions did not.

**Implementation Note**: After automated verification passes, pause for confirmation that the local-storage inspection succeeded.

---

## Phase 2: Deliver inline controls and regression proof

### Overview

Expose the temporary controls in the mobile briefing, coordinate them with manual extraction, and prove preserved product
workflows still behave correctly.

### Changes Required

#### 1. Inline Edit and **Not now** controls

**Files**: `src/components/anchors/AnchorBriefing.tsx`

**Intent**: Make current-topic control quick, readable, and accessible without another screen or any external action.

**Contract**: Render Edit and **Not now** outside each `<summary>`. Permit one inline editor at a time with a labelled
input, Save, and Cancel; questions stay read-only. **Not now** requests guarded local removal immediately, with no
confirmation, undo, closed-items view, or network call. Update the visible list only after persistence succeeds; retain
the visible topic and show a privacy-safe error on a neutral failure.

#### 2. Mutation, refresh, and extraction coordination

**Files**: `src/components/anchors/AnchorBriefing.tsx`, `src/lib/anchors/briefing.ts`,
`src/lib/anchors/briefing.test.ts`

**Intent**: Prevent competing actions from overwriting each other while retaining the chosen snapshot behavior for
interaction saves, person changes, and manual extraction.

**Contract**: Disable Generate and competing topic controls while an edit save or hide is pending; disable topic controls
while extraction runs. Keep interaction refreshes from invalidating a valid extraction, retain edits/hides after refresh
and failed extraction, and keep the generation/person guard so person changes or unmount cannot update an old briefing.
Valid successful extraction reloads its fresh replacement set and intentionally clears all temporary local changes.

#### 3. Full behavior and regression verification

**Files**: `src/lib/anchors/briefing.test.ts`, `src/lib/anchors/anchor.test.ts`,
`src/lib/relationship-data/local-vault.test.ts`, `context/changes/manage-current-core-topics/change.md`

**Intent**: Lock in the owner-local guarantees without adding a UI test framework.

**Contract**: Add pure-helper tests only where they capture coordination semantics; otherwise use domain/vault coverage and
targeted browser acceptance. Record only verification categories/outcomes in the change record—never note text, topic
text, owner IDs, provider responses, cookies, or credentials.

### Success Criteria

#### Automated Verification

- Helper tests prove control/extraction guards preserve current snapshot semantics.
- Domain/vault tests prove reload persistence, owner isolation, failure preservation, and successful-replacement reset.
- `npm test`, `npm run lint`, `npm run build`, and `git diff --check` pass.
- A scoped diff confirms no route, provider, external payload, server persistence, background work, or exclusion behavior was added.

#### Manual Verification

- In an authenticated browser, edit one topic, cancel another edit, reload, and confirm saved wording plus read-only questions.
- Choose **Not now**, reload, and confirm only that topic stays absent until a valid successful extraction.
- Confirm failed extraction retains changes and valid success replaces them.
- Confirm controls work on a narrow screen, stay outside disclosure summaries, and lock while a save/hide/extraction is pending.
- Smoke-test people creation/edit/deletion, interactions, future-date rejection, chronological history, owner isolation, and cascade deletion.

**Implementation Note**: After automated verification passes, pause for browser acceptance before closing the change.

## Testing Strategy

### Unit Tests

- Edited-text normalization and limits, plus immutable topic-field retention.
- Questions and position remain unchanged when only topic wording changes.
- Pure action/extraction guard behavior where it is meaningful without a UI harness.

### Storage and Boundary Tests

- Owner-scoped single-child update/delete with parent and child existence checks.
- Person deletion, missing child, owner isolation, and unrelated-child counterexamples.
- Valid replacement versus failed/missing-source preservation of edited/hidden snapshots.
- Relationship-data lint boundary remains local-only.

### Manual Testing Steps

1. Create synthetic interactions and generate Core Topics.
2. Edit a topic, reload, and confirm only wording changed while questions, order, and interaction history remain.
3. Choose **Not now**, reload, and confirm it stays hidden with no undo or exclusion UI.
4. Exercise a failed extraction and a valid successful extraction; only valid success resets the snapshot.
5. Delete the person while an action is pending and confirm no late topic write returns.

## Performance Considerations

At most seven topics render and each action performs one small IndexedDB transaction. No new provider call, polling loop,
cache, sync task, or collection-wide operation is added.

## Migration Notes

No database version or object-store migration is required. Existing Core Topic records remain readable; edited records
preserve the same payload shape, and **Not now** removes one current record. The next existing successful replacement is
the intentional reset and rollback point.

## References

- Product requirements: `context/foundation/prd.md:61-75,83-103,122-147`
- Roadmap slice: `context/foundation/roadmap.md:86-96`
- Archived Core Topics contract: `context/archive/2026-09-11-consolidated-core-topics/plan.md:100-269`
- Earlier lifecycle design to avoid carrying forward: `context/changes/manage-conversation-anchors/plan.md:33-165`
- Current Core Topic domain: `src/lib/anchors/anchor.ts`
- Current owner-local vault: `src/lib/relationship-data/local-vault.ts`
- Current briefing: `src/components/anchors/AnchorBriefing.tsx`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Make current-briefing mutations safe and persistent

#### Automated

- [x] 1.1 Prove edited topic records preserve immutable topic fields and reject invalid text
- [x] 1.2 Prove owner-scoped topic update and **Not now** removal only affect the selected child
- [x] 1.3 Prove late parent/child deletion and owner mismatch do not persist or resurrect a topic
- [x] 1.4 Prove valid replacement resets current edits/hides while failed replacement preserves them
- [x] 1.5 Pass focused Core Topic, vault, and protected-boundary tests

#### Manual

- [ ] 1.6 Confirm browser-local topic mutations leave interactions unchanged

### Phase 2: Deliver inline controls and regression proof

#### Automated

- [ ] 2.1 Prove control and extraction guards preserve the current snapshot semantics
- [ ] 2.2 Prove persistence, reset, owner isolation, and failed-extraction behavior across the complete suite
- [ ] 2.3 Pass full test, lint, build, whitespace, and scoped-boundary verification

#### Manual

- [ ] 2.4 Confirm inline edit, cancel, reload persistence, and read-only questions
- [ ] 2.5 Confirm **Not now** stays hidden until valid successful extraction and has no exclusion behavior
- [ ] 2.6 Confirm narrow-screen accessibility, action locking, and preserved people/interaction workflow
