# Create the first person Implementation Plan

## Overview

Replace the private dashboard placeholder with the smallest owner-scoped flow in which an authenticated user creates and immediately views their first person. The person is stored only in the existing browser IndexedDB vault and contains a display name, one relationship circle, and an optional month-and-day birthday.

## Current State Analysis

Passwordless authentication supplies the stable Supabase user ID through `Astro.locals.user`, and `/dashboard` is already protected by middleware. The dashboard itself is still a static welcome card. The local relationship-data vault can write and retrieve generic owner-scoped records, but it has no collection lookup to rediscover a saved person after a browser reload.

The privacy foundation intentionally leaves product payloads untyped. S-02 is therefore the first change that owns a concrete relationship-data schema. It must use browser-only IndexedDB, never an application API route, Supabase product table, Worker binding, or a default owner identity.

## Desired End State

An authenticated owner arriving at `/dashboard` sees an accessible empty state and can save a person with a required display name, a required choice of Family, Friend, Professional, or Other, and an optional valid birthday month and day. Saving presents a pending state, preserves entered values on a recoverable failure, and then replaces the empty state with that person's private summary card.

Reloading the dashboard retrieves the saved person from the authenticated owner's IndexedDB namespace. The record is never visible to another owner sharing the browser profile, duplicate display names remain valid, and no remote relationship-data path is introduced.

### Key Discoveries

- `src/pages/dashboard.astro:4-24` is the protected but currently placeholder private screen; `src/middleware.ts:7-21` supplies and protects `Astro.locals.user`.
- `src/lib/relationship-data/local-vault.ts:17-92` requires a non-empty owner ID and owns all IndexedDB access, while `context/foundation/local-data-privacy.md:14-24` requires every relationship-data operation to use that boundary.
- `src/lib/relationship-data/types.ts:15-24` exposes write, exact read, parent lookup, and cascade deletion but no same-owner collection lookup; S-02 needs a minimal generic read operation to restore the first person after reload.
- `context/foundation/local-data-privacy.md:42-44` explicitly assigns person fields and creation to S-02; deletion remains S-03 work.

## What We're NOT Doing

- Editing or deleting a person, maintaining a multi-person directory, search, filters, custom relationship circles, avatars, notes, or contact integrations.
- Recording interactions, creating topics or follow-ups, extracting content, briefings, birthdays reminders, synchronization, export, encryption, or recovery.
- Creating Supabase product tables, migrations, storage buckets, product API routes, Worker data bindings, or remote relationship-data requests.
- Using email, a shared default value, or any browser-visible credential as the relationship-data owner identity.

## Implementation Approach

Add a small `people` domain module outside the local-vault boundary to validate and convert the chosen form values into a typed generic vault record. Extend the generic vault only with an owner-scoped collection lookup, implemented through the existing owner index so the IndexedDB schema version does not change.

Hydrate one client-side dashboard island with the non-secret authenticated user ID. On load it finds the owner's saved people; when none exists it renders the creation form, and after a successful save it renders the persisted summary. The first-person screen intentionally stops there; later slices own broader directory and lifecycle behavior.

## Critical Implementation Details

The dashboard must not open the vault during server rendering. It passes `Astro.locals.user.id` into a hydrated client component, which opens the vault only after hydration. A supplied birthday is valid only when both month and day are selected and form a real calendar date; February 29 is accepted, while impossible dates and partial selections are rejected.

## Phase 1: Define person data and local retrieval

### Overview

Create the concrete person contract and the smallest generic vault read needed to restore owner-local people after a reload.

### Changes Required

#### 1. Owner-scoped collection lookup

**Files**: `src/lib/relationship-data/types.ts`, `src/lib/relationship-data/local-vault.ts`, `src/lib/relationship-data/local-vault.test.ts`

**Intent**: Let the first-person screen retrieve records of one collection without bypassing the local vault or adding a new browser storage location.

**Contract**: Add a `listByCollection(collection)` operation to `RelationshipVault`. It returns only records owned by the vault's normalized owner and filters through the existing owner index; it neither changes the IndexedDB database version nor exposes records from another owner.

#### 2. Person domain contract and validation

**Files**: `src/lib/people/person.ts` (new), `src/lib/people/person.test.ts` (new)

**Intent**: Keep display-name, relationship-circle, birthday, ID, and vault-payload rules in one pure client-safe module rather than scattering them across the UI.

**Contract**: Define the canonical `people` collection, the four permitted relationship circles, a typed person payload, and helpers that validate trimmed non-empty display names, a permitted circle, and an optional real month/day birthday. Convert valid input into a generic root `RelationshipRecord` with a generated opaque ID; do not enforce unique display names or include a parent reference.

### Success Criteria

#### Automated Verification

- Focused Vitest tests prove valid person-record conversion, duplicate-name acceptance, invalid/blank name rejection, circle validation, optional birthday handling, partial birthday rejection, and calendar-date validation.
- Focused local-vault tests prove collection lookup returns only the active owner's records and leaves existing owner and cascade behavior intact.
- `npm test` and `npm run lint` pass with no relationship-data remote-boundary violation.

#### Manual Verification

- Inspect the person contract and confirm it stores only the agreed display name, preset circle, optional month/day birthday, and opaque local record ID.

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation before moving to the dashboard flow.

---

## Phase 2: Build the private create-and-view dashboard

### Overview

Turn the authenticated dashboard into an accessible first-person screen that creates a local record, handles recoverable errors, and immediately displays the persisted person.

### Changes Required

#### 1. First-person dashboard island

**File**: `src/components/people/FirstPersonDashboard.tsx` (new)

**Intent**: Provide the complete client-side first-person journey while keeping private data inside the browser and preserving inputs when persistence fails.

**Contract**: Accept a required `ownerId` prop, open `createRelationshipVault(ownerId)` only in client lifecycle or form-event code, and use the person helpers from Phase 1. When the owner's `people` collection is empty, render a labelled form; while saving, disable the submission path; render inline validation/storage errors and retain the entered values for retry. On success, render the persisted person's display name, circle, and optional birthday summary. The form offers only Family, Friend, Professional, and Other; it accepts no remote URL, API response, or account identifier.

#### 2. Protected dashboard shell

**File**: `src/pages/dashboard.astro`

**Intent**: Replace the placeholder content with the first-person island while retaining the existing authentication and sign-out boundary.

**Contract**: Require the already-authenticated `Astro.locals.user` before rendering and pass only `user.id` to `FirstPersonDashboard` using client hydration. Retain a clear private-screen heading and the existing sign-out capability; do not add a product API route or expose the email address as storage identity.

### Success Criteria

#### Automated Verification

- The dashboard and person island compile under strict TypeScript without server-only imports inside browser relationship-data code.
- `npm test`, `npm run lint`, and `npm run build` pass without adding Supabase product persistence, a Worker binding, or a network call from `src/lib/relationship-data`.

#### Manual Verification

- In an authenticated browser, an empty dashboard presents the accessible first-person form with name, circle, and optional birthday controls.
- A valid save disables repeat submission, then displays the saved summary; an invalid name, circle, partial birthday, or impossible date displays a clear inline error.
- Simulating an unavailable or failed IndexedDB operation preserves form values and offers a safe retry without reporting success.

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation before moving to end-to-end verification.

---

## Phase 3: Prove owner-local persistence end to end

### Overview

Add the integration-level proof that person records round-trip through the existing local vault per owner, then verify the whole private path without expanding test tooling.

### Changes Required

#### 1. Person storage integration tests

**File**: `src/lib/people/person-storage.test.ts` (new)

**Intent**: Exercise the real person-to-vault boundary so the first UI consumer cannot accidentally weaken owner isolation or reload behavior.

**Contract**: Use isolated `fake-indexeddb` factories to create person records through the person helpers, save them through an owner vault, reopen that owner's vault, and retrieve them by the `people` collection. Prove a second owner cannot retrieve the first owner's person and that no test contacts a network service or needs Supabase credentials.

#### 2. Boundary regression verification

**Files**: `src/lib/relationship-data/relationship-data-boundary.test.ts` (verify only), `context/foundation/local-data-privacy.md` (verify only)

**Intent**: Confirm that the new user-visible consumer obeys the existing local-data contract without broadening the documented privacy promise.

**Contract**: Keep the relationship-data boundary test effective and leave the local-data contract's explicit exclusions unchanged. The person feature may import the local vault as a browser consumer, but the vault itself must remain free of remote imports and network APIs.

### Success Criteria

#### Automated Verification

- Person-storage tests prove local round-trip persistence and owner isolation.
- `npm test`, `npm run lint`, and `npm run build` pass under Node 22.
- `git diff --exit-code -- wrangler.jsonc astro.config.mjs supabase/config.toml src/lib/supabase.ts src/middleware.ts` confirms authentication, provider, and deployment configuration boundaries are unchanged.

#### Manual Verification

- Create a person locally while authenticated, reload `/dashboard`, and confirm the same summary remains visible only for that signed-in owner.
- Sign out and confirm `/dashboard` remains protected; sign in as another owner in the same browser profile and confirm the first owner's person is absent.
- Inspect browser developer tools to confirm person data appears in IndexedDB and no relationship-data network request, Supabase product resource, or Worker data binding was added.

**Implementation Note**: After completing this final phase and all automated verification passes, pause for final manual confirmation before closing the change.

## Testing Strategy

### Unit Tests

- Person input normalization and validation for all four circle values.
- Optional birthday acceptance, partial birthday rejection, and real calendar-date validation.
- Stable record creation with an opaque ID and no display-name uniqueness constraint.
- Collection lookup, same-owner re-open, and cross-owner isolation through `fake-indexeddb`.

### Integration Tests

- Run `npm test`, `npm run lint`, and `npm run build` with Node 22.
- Verify the no-remote ESLint boundary remains active for relationship-data modules.
- Verify protected auth, Supabase, and deployment files have no diff.

### Manual Testing Steps

1. Start local Supabase and the Astro app, sign in, and open `/dashboard`.
2. Save a person with each required field and, separately, with an optional valid birthday; confirm the summary replaces the form.
3. Try a blank name, no circle, a partial birthday, and an impossible date; confirm inline guidance and no saved summary.
4. Reload the dashboard, sign out, and use a second account in the same browser profile to confirm owner isolation and route protection.
5. Inspect IndexedDB and the browser network panel to confirm local-only relationship-data persistence.

## Performance Considerations

The MVP reads the active owner's small `people` collection through the existing owner index and filters it locally. This avoids an IndexedDB schema upgrade while keeping reload behavior bounded for the project's small private data volume. No polling, cache, remote query, or background work is introduced.

## Migration Notes

There is no existing person data to migrate. Person fields are stored as a typed payload inside the already-versioned generic record store, so this change does not alter its key or index schema. Browser-profile clearing remains permanent data loss under the established MVP contract.

## References

- Product requirement: `context/foundation/prd.md:62-65` — FR-002 person creation, circle, and birthday.
- Privacy contract: `context/foundation/local-data-privacy.md:14-24,42-44` — owner-only browser storage and S-02 ownership.
- Roadmap slice: `context/foundation/roadmap.md:130-140` — S-02.
- Vault implementation: `src/lib/relationship-data/local-vault.ts:17-92`.
- Existing protected page: `src/pages/dashboard.astro:4-24`; authentication guard: `src/middleware.ts:7-21`.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Define person data and local retrieval

#### Automated

- [x] 1.1 Add the owner-scoped collection lookup to the generic local vault — dd01e69
- [x] 1.2 Add typed person validation and generic-record conversion tests — dd01e69
- [x] 1.3 Pass focused vault/person tests and lint without a remote-boundary regression — dd01e69

#### Manual

- [x] 1.4 Confirm the person data contract stores only the agreed MVP fields — dd01e69

### Phase 2: Build the private create-and-view dashboard

#### Automated

- [x] 2.1 Add the client-side first-person form, save state, error recovery, and summary view
- [x] 2.2 Replace the protected dashboard placeholder with the owner-ID island handoff
- [x] 2.3 Pass test, lint, and production-build checks without a remote product-data path

#### Manual

- [x] 2.4 Confirm create, validation, pending, retry, and saved-summary behavior in an authenticated browser

### Phase 3: Prove owner-local persistence end to end

#### Automated

- [x] 3.1 Add person-to-vault round-trip and cross-owner isolation integration tests
- [x] 3.2 Pass complete validation and protected-boundary checks under Node 22

#### Manual

- [x] 3.3 Confirm reload persistence, signed-out protection, second-owner isolation, and IndexedDB-only storage
