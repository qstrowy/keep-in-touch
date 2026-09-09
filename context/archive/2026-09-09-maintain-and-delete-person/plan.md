# Maintain or remove a person Implementation Plan

## Overview

Extend the private dashboard so the owner can manage locally stored people: select an existing person, add another, edit the selected person's approved fields, and permanently remove that person with every linked relationship record. This completes FR-002's edit/delete requirement and the privacy contract's immediate-deletion guarantee without adding remote data or a broader contact-management system.

## Current State Analysis

S-02 stores typed `people` records in the browser-local relationship vault and shows only the first valid saved person in a single dashboard summary. The vault already provides owner-scoped `put()` for record replacement and `deleteCascade()` for one-transaction root-and-descendant deletion, but the current island exposes neither to the owner after creation.

## Desired End State

An authenticated owner can see a small local list of saved people by display name, select one, add another person, and edit the selected person's name, relationship circle, or optional birthday. Saving an edit preserves the person ID. Deleting requires an inline confirmation and removes that owner’s person plus all current and future child records immediately; after deletion the dashboard returns to the unselected list, or the creation form when no people remain.

### Key Discoveries

- `src/lib/relationship-data/local-vault.ts:31-36` upserts a record using the owner's composite key, so an edit can reuse the existing person ID without a schema change.
- `src/lib/relationship-data/local-vault.ts:65-103` deletes an owner-scoped root and all descendants in a single read-write transaction; this is the required deletion mechanism.
- `src/components/people/FirstPersonDashboard.tsx:28-116` already owns client-only vault access, form validation, storage-error recovery, and the initial summary state.
- `src/lib/people/person-storage.test.ts:8-39` provides the focused `fake-indexeddb` pattern for owner-local person integration tests.

## What We're NOT Doing

- Search, filters, sorting controls, routes per person, a contact directory beyond the small dashboard list, avatars, notes, or custom relationship circles.
- New remote persistence, Supabase product tables, API routes, Worker bindings, synchronization, export, encryption, or recovery.
- Extra identity fields to disambiguate duplicate display names; the owner may choose a more descriptive display name when needed.
- The deferred birthday-dropdown accessibility cleanup recorded in `context/changes/create-first-person/reviews/impl-review.md`.

## Implementation Approach

Keep `FirstPersonDashboard` as the only hydrated browser consumer. It will load all valid owner-local people, render their display names as selectable controls, and reuse the existing person validation and record conversion for creation and in-place updates. It will call the established `deleteCascade()` operation only after an explicit in-page confirmation, preserving the selected person and retry path on a storage failure.

## Critical Implementation Details

The UI must preserve the selected person and the confirmation state until a delete transaction completes successfully. Child records must be created with the person as their parent reference in later slices; the S-03 integration proof will seed such a child now to demonstrate that the existing cascade contract already covers it.

## Phase 1: Prove owner-local updates and deletion cascades

### Overview

Extend the existing person-to-vault integration coverage so the edit and deletion UI can rely on stable local persistence behavior.

### Changes Required

#### 1. Person storage lifecycle tests

**File**: `src/lib/people/person-storage.test.ts`

**Intent**: Prove that updating a person is an owner-local replacement and that deleting a person removes a linked record without touching another owner's data.

**Contract**: Save an initial person, overwrite it through `put()` using the same person ID, then verify the reopened owner's `people` collection exposes the edited payload. Seed a descendant record with `parent: { collection: PEOPLE_COLLECTION, id: person.id }`, call `deleteCascade()`, and verify both records are absent for that owner while another owner's person remains intact.

### Success Criteria

#### Automated Verification

- Focused person-storage tests prove same-ID update, cascaded deletion, reload behavior, and cross-owner isolation.
- `npm test` and `npm run lint` pass without a relationship-data remote-boundary regression.

---

## Phase 2: Build local people selection and editing

### Overview

Replace the one-person-only dashboard state with a small, local people list and an edit flow that reuses the proven creation form.

### Changes Required

#### 1. Multi-person local dashboard state

**File**: `src/components/people/FirstPersonDashboard.tsx`

**Intent**: Let the owner see each saved person by display name, choose a person to manage, add another, and retain the simple first-person creation experience when the list is empty.

**Contract**: Load all valid `people` records through the existing vault collection lookup. Keep selected-person identity in client state, render accessible name-only selection controls, retain the selected summary after normal load or save, and expose an `Add person` action that opens an empty form. The view may keep the vault's existing local return order; it must not introduce sorting, search, routes, or remote state.

#### 2. In-place person edit form

**File**: `src/components/people/FirstPersonDashboard.tsx`

**Intent**: Allow correction of the selected person's approved fields without creating a second record or weakening existing validation.

**Contract**: An `Edit person` action replaces the selected summary with the existing form prefilled from that person's name, circle, and optional birthday. Reuse `validatePersonInput()` and write a new generic record with the selected person's original ID. Clearing both birthday controls removes the optional birthday; partial or impossible dates remain invalid. During a write, disable the relevant controls; on a storage failure preserve the populated edit form and show a retryable inline error.

### Success Criteria

#### Automated Verification

- `npm test`, `npm run lint`, and `npm run build` pass with no Supabase product persistence, Worker binding, or relationship-data network call.

#### Manual Verification

- An authenticated owner can add two locally stored people, see their names in the list, select either one, and return to that person's summary.
- Editing name, circle, birthday, and clearing an optional birthday updates only the selected person after reload; invalid values show inline guidance and preserve the edit form.
- A failed IndexedDB write keeps entered values available for a safe retry.

---

## Phase 3: Confirm irreversible removal

### Overview

Add a deliberate, retry-safe delete interaction that uses the existing cascade guarantee and leaves the dashboard in a clear state.

### Changes Required

#### 1. Inline deletion confirmation and recovery

**File**: `src/components/people/FirstPersonDashboard.tsx`

**Intent**: Make permanent removal explicit while ensuring no UI reports success until the owner-local cascade transaction actually completes.

**Contract**: The selected summary exposes `Delete person`, which reveals an inline warning that associated local relationship data will be removed and offers Cancel and `Delete permanently`. A confirmed delete calls `deleteCascade()` with the selected `people` reference. On success remove that person from local state and return to an unselected list when others remain, or the empty creation form when none remain. On failure retain the person, confirmation, and a retryable alert; disable destructive controls while the transaction is pending.

### Success Criteria

#### Automated Verification

- The full test suite, lint, and production build pass.
- `git diff --exit-code -- wrangler.jsonc astro.config.mjs supabase/config.toml src/lib/supabase.ts src/middleware.ts` confirms auth, provider, and deployment boundaries remain unchanged.

#### Manual Verification

- Canceling the delete confirmation preserves the selected person; confirming it removes the person after reload and removes linked records from IndexedDB.
- Deleting one selected person returns to the unselected local list when others remain; deleting the last person returns to the create form.
- A different signed-in owner in the same browser profile cannot edit or delete another owner's person or linked records.
- Browser developer tools show no relationship-data network request, product API route, Supabase product resource, or Worker data binding.

## Testing Strategy

### Unit Tests

- Update an existing person by reusing its ID and verify the old payload is replaced.
- Delete a person root with a linked child record and confirm the cascade is owner-scoped.
- Preserve existing validation tests for blank names, permitted circles, and optional birthday rules.

### Integration Tests

- Use isolated `fake-indexeddb` factories for same-owner reopen and second-owner isolation.
- Run `npm test`, `npm run lint`, and `npm run build`.
- Confirm protected auth and deployment configuration have no diff.

### Manual Testing Steps

1. Sign in locally, add two people, and select each from the name-only list.
2. Edit a selected person, including clearing a saved birthday; reload and confirm the same record reflects the changes.
3. Try blank, partial, and impossible values; simulate one unavailable IndexedDB write and confirm the form retains values for retry.
4. Cancel a delete confirmation, then confirm deletion; reload and inspect IndexedDB for removal of the person and any linked test data.
5. Sign in as a second owner in the same browser profile and confirm owner-local selection, update, and deletion boundaries.

## Performance Considerations

The MVP loads the active owner's small local people collection once per dashboard session and updates in-memory state after writes. There is no polling, remote query, cache, or pagination; a later directory slice must revisit this approach if the local collection becomes large.

## Migration Notes

No database or IndexedDB schema migration is required. Existing generic people records keep their composite key and payload shape; edits overwrite the same key. Deletion is permanent under the established browser-profile privacy model.

## References

- Product requirement: `context/foundation/prd.md:69-70,94-100` — FR-002 and immediate deletion of associated data.
- Privacy contract: `context/foundation/local-data-privacy.md:14-24,42-44` — owner-local vault boundary and S-03 ownership.
- Roadmap slice: `context/foundation/roadmap.md:144-154` — S-03 outcome and risk.
- Existing vault behavior: `src/lib/relationship-data/local-vault.ts:31-36,65-103`.
- Existing person dashboard: `src/components/people/FirstPersonDashboard.tsx:28-116,246-268`.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Prove owner-local updates and deletion cascades

#### Automated

- [x] 1.1 Add same-ID update, cascade deletion, reload, and owner-isolation person-storage tests — d01b34d
- [x] 1.2 Pass focused storage tests and lint without a remote-boundary regression — d01b34d

### Phase 2: Build local people selection and editing

#### Automated

- [x] 2.1 Add local people-list selection, add-person, and in-place edit behavior — 09ae67b
- [x] 2.2 Pass full tests, lint, and build without a remote product-data path — 09ae67b

#### Manual

- [x] 2.3 Confirm adding, selecting, editing, validation, birthday removal, and retry behavior in an authenticated browser — 09ae67b

### Phase 3: Confirm irreversible removal

#### Automated

- [x] 3.1 Add inline confirmed deletion with retry-safe failure behavior — 5277fc8
- [x] 3.2 Pass complete validation and protected-boundary checks — 5277fc8

#### Manual

- [x] 3.3 Confirm cancellation, cascaded deletion, post-delete list behavior, owner isolation, and IndexedDB-only storage — 5277fc8
