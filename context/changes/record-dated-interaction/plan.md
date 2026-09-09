# Record dated interaction Implementation Plan

## Overview

Add the first interaction capability to the private dashboard: an owner can save a dated free-text note for the selected person and immediately see that original note in that person's local history. This delivers FR-003 while preserving the browser-only privacy boundary and prepares the parent-child record shape that later extraction and conversation-anchor slices will use.

## Current State Analysis

The dashboard already selects one owner-local person at a time, but only person records exist. The generic relationship vault can persist owner-scoped records, list a person's children by parent reference, and cascade-delete every descendant when that person is removed. No interaction schema, validation, storage integration test, or interaction UI exists yet.

## Desired End State

For any selected person, the owner can enter a required note of up to 5,000 characters and an interaction date that defaults to today but may be backdated. A successful save stores the exact trimmed note and selected local-calendar date only in IndexedDB, then shows it in that person's complete local history, newest date first. Interactions on the same date use an internal, undisplayed creation timestamp as a stable tie-breaker.

### Key Discoveries

- `src/lib/relationship-data/local-vault.ts:31-37,56-63` already upserts owner-local generic records and lists records by an owner-scoped parent reference.
- `src/lib/relationship-data/local-vault.ts:65-103` cascades through parent-linked descendants in one read-write transaction, so interactions parented to `people` inherit immediate deletion.
- `src/components/people/FirstPersonDashboard.tsx:29-39,255-278` owns the selected person and is the single browser-hydrated integration point.
- `src/lib/people/person.ts:33-107` and its focused Vitest tests establish the validation, record-creation, and defensive-decoding pattern to mirror.
- `src/lib/people/person-storage.test.ts:73-104` already proves that a record in the `interactions` collection parented to a person is removed by person cascade deletion.

## What We're NOT Doing

- LLM extraction, classification, future conversation-point proposals, briefing views, anchor correction, dismissal, or resolution; S-05 and S-06 own those capabilities.
- Editing or deleting individual interactions; this slice preserves the original saved interaction immutably.
- Future-dated interactions, time-of-day entry or display, pagination, search, sorting controls, filters, routes, remote persistence, APIs, synchronization, export, or recovery.
- Product Supabase tables, storage buckets, Worker data bindings, or relationship-data network calls.

## Implementation Approach

Introduce a typed `interactions` domain layer that validates form values, encodes a person-parented generic record, and defensively decodes saved records. Keep the selected-person dashboard as the only consumer by mounting a focused interaction panel inside its summary; that panel loads and updates only the active person's owner-local children. The generic vault remains the sole persistence mechanism.

## Critical Implementation Details

Persist the user-selected date as a date-only `YYYY-MM-DD` string rather than constructing a UTC `Date`, so a local-calendar interaction never shifts across time zones. Store an internal creation timestamp solely to order entries sharing the same selected date; do not display it or treat it as the interaction's date.

## Phase 1: Define and prove the local interaction record

### Overview

Create the typed interaction contract and prove it remains a private, owner-scoped descendant of its person.

### Changes Required

#### 1. Typed interaction domain and validation

**Files**: `src/lib/interactions/interaction.ts`, `src/lib/interactions/interaction.test.ts`

**Intent**: Define the interaction collection, form input, validated domain object, and record conversion so UI code never writes arbitrary payloads into the vault.

**Contract**: Interaction records use collection `interactions`, a non-empty generated ID, parent `{ collection: PEOPLE_COLLECTION, id: personId }`, and payload `{ occurredOn, note, createdAt }`. `occurredOn` is a valid local `YYYY-MM-DD` date no later than the supplied local today; `note` is trimmed, non-empty, and at most 5,000 characters; `createdAt` is a finite creation-time timestamp used only for ordering. Defensive decoding ignores malformed, wrong-collection, or invalid stored records.

#### 2. Owner-local interaction persistence coverage

**File**: `src/lib/interactions/interaction-storage.test.ts`

**Intent**: Prove a valid interaction round-trips through the existing vault as a child of the intended person and never appears to another owner.

**Contract**: Use isolated `fake-indexeddb` factories to seed a person and interaction, reopen the same owner's vault with `listByParent`, decode the saved interaction, verify another owner cannot list it, and confirm person `deleteCascade()` removes the interaction with its parent.

#### 3. Interaction privacy lint boundary

**Files**: `eslint.config.js`, `src/lib/relationship-data/relationship-data-boundary.test.ts`

**Intent**: Extend the existing remote-boundary guard from the vault implementation to the new interaction data module.

**Contract**: Apply the existing restricted remote imports and network globals to `src/lib/interactions/**/*.ts`, and verify the interaction module is rejected if it attempts a remote import or network call.

### Success Criteria

#### Automated Verification

- Interaction contract tests cover normalized notes, 5,000-character maximum, invalid/future dates, same-day creation ordering metadata, record parent linkage, and malformed-record rejection.
- Focused storage tests prove same-owner reload, second-owner isolation, and person-cascade deletion.
- `npm test` and `npm run lint` pass while the interaction module remains protected from remote data paths and network calls.

---

## Phase 2: Add the selected-person interaction flow

### Overview

Give the owner a simple, mobile-friendly way to preserve and inspect the selected person's local interaction history.

### Changes Required

#### 1. Selected-person interaction panel

**File**: `src/components/interactions/InteractionPanel.tsx`

**Intent**: Provide the interaction form and per-person local history without expanding the dashboard's existing person lifecycle state.

**Contract**: Receive the authenticated `ownerId` and selected person reference. On person change, load valid child records through `listByParent`; display every valid record in descending `occurredOn`, then descending internal `createdAt` order. The date input defaults to local today, disallows future values, and allows backfill; the note textarea enforces the 5,000-character limit. A save validates before I/O, disables relevant form controls while pending, persists through `createRelationshipVault()`, reads and decodes the saved record before adding it to local state, and retains entered values with a retryable inline alert on storage failure.

#### 2. Dashboard summary integration

**File**: `src/components/people/FirstPersonDashboard.tsx`

**Intent**: Surface interactions only for the currently selected person while retaining the existing people selection, editing, and delete behavior.

**Contract**: Pass the authenticated owner ID and selected person reference into `InteractionPanel` from `PersonSummary`. Mount the panel after person metadata and before edit/delete controls; selecting another person replaces its form/history context. Existing delete confirmation still blocks person changes while pending, and unmounting a deleted selected person removes its interaction panel with the parent.

### Success Criteria

#### Automated Verification

- `npm test`, `npm run lint`, and `npm run build` pass without relationship-data remote calls or new product persistence paths.
- `git diff --exit-code -- wrangler.jsonc astro.config.mjs supabase/config.toml src/lib/supabase.ts src/middleware.ts` confirms auth, provider, and deployment boundaries remain unchanged.

#### Manual Verification

- For a selected person, an owner can save a note dated today and a backdated note; both retain their original text and date after reload and appear newest-date-first.
- Empty, whitespace-only, over-limit, malformed, and future-date inputs show inline guidance and do not create a history entry.
- A failed IndexedDB write preserves the date and note for retry, and a different signed-in owner cannot view the first owner's interactions.
- Deleting the person removes its interaction records from IndexedDB, and browser tools show no relationship-data network request, product API route, Supabase product resource, or Worker data binding.

## Testing Strategy

### Unit Tests

- Validate date-only calendar values, including leap days and today versus future-date boundaries using an injected deterministic local today.
- Normalize notes, reject blank or over-limit input, create the exact person-parented record, and ignore malformed stored payloads.
- Verify newest-date-first sorting with `createdAt` resolving equal-date entries.

### Integration Tests

- Use isolated `fake-indexeddb` factories for same-owner reopen, owner isolation, `listByParent`, and person cascade deletion.
- Run `npm test`, `npm run lint`, and `npm run build`.
- Confirm protected auth, provider, and deployment configuration has no diff.

### Manual Testing Steps

1. Sign in, select a person, save a note dated today and another backdated note, then reload and verify full original note text and date order.
2. Enter blank, whitespace-only, over-5,000-character, and future-dated values; verify inline errors and no saved entry.
3. Simulate one unavailable IndexedDB write and verify the form retains the date and note for retry.
4. Sign in as a second owner in the same browser profile and verify they cannot view the first owner's interaction history.
5. Delete the person, inspect IndexedDB for cascade removal, and verify browser tools show no relationship-data network traffic or product persistence resources.

## Performance Considerations

S-04 intentionally renders the active person's complete small local history with no network, polling, pagination, or cache. A later scale-focused slice must revisit this if interaction volume grows beyond the MVP's small-user assumption.

## Migration Notes

No IndexedDB schema migration is required: the generic `records` store and owner-parent index already support child interaction records. Existing people remain unchanged, and interactions are additive owner-local records that disappear with their person through the established cascade transaction.

## References

- Product requirements: `context/foundation/prd.md:47-57,67-72,94-100` — original note and date, FR-003, local storage, and immediate deletion.
- Privacy contract: `context/foundation/local-data-privacy.md:14-24,29-44` — owner-local IndexedDB boundary, parent references, cascade deletion, and S-04 ownership.
- Roadmap slice: `context/foundation/roadmap.md:156-166` — S-04 outcome and separation from later extraction.
- Existing local vault: `src/lib/relationship-data/local-vault.ts:31-37,56-103`.
- Existing person contracts and storage tests: `src/lib/people/person.ts:33-107`, `src/lib/people/person-storage.test.ts:73-104`.
- Existing dashboard integration point: `src/components/people/FirstPersonDashboard.tsx:29-39,255-278,453-550`.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Define and prove the local interaction record

#### Automated

- [x] 1.1 Add validated interaction types, record conversion, and contract tests — eda868a
- [x] 1.2 Add owner-local interaction storage and cascade-deletion tests — eda868a
- [x] 1.3 Extend interaction remote-boundary protection and pass focused validation — eda868a

### Phase 2: Add the selected-person interaction flow

#### Automated

- [x] 2.1 Add the selected-person interaction form, local history, and retry behavior — 63c214a
- [x] 2.2 Pass full tests, lint, build, and protected-boundary checks — 63c214a

#### Manual

- [x] 2.3 Confirm local save, reload, validation, retry, owner isolation, cascade deletion, and IndexedDB-only storage in an authenticated browser — 63c214a
