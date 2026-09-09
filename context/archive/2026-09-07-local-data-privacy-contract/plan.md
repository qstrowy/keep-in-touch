# Establish the local data privacy contract Implementation Plan

## Overview

Create the technical boundary that keeps relationship data in the owner's browser profile rather than in Supabase, Cloudflare, or any other remote store. The change provides a small, owner-scoped IndexedDB vault, a precise deletion contract, automated verification, and a durable foundation document that later people, interaction, and conversation-anchor slices must follow.

## Current State Analysis

The application has authentication scaffolding but no product-data persistence. `src/lib/supabase.ts:1-23` constructs a server-side Supabase client only for auth cookies, and `src/middleware.ts:4-22` uses it to protect `/dashboard`. There are no application tables, migrations, product API routes, browser-storage calls, or Worker data bindings. `wrangler.jsonc:9-16` has only required Supabase auth secrets and the `ASSETS` binding.

That scaffold conflicts with the product boundary if it becomes the default data layer: the PRD requires relationship data to remain on the user's smartphone, requires immediate removal of all related records when a person is deleted, and forbids unprotected synchronization. The current dependency graph has no test runner or IndexedDB helper.

## Desired End State

Relationship-data code has one browser-only, native IndexedDB boundary that is scoped to a signed-in owner's stable ID. It exposes generic primitives rather than predefining person, interaction, or anchor fields; later slices own those domain schemas and UI flows.

The boundary guarantees that a cascade deletion is committed atomically before success is returned, cannot read another owner's records, and cannot import Supabase or call remote APIs. Automated tests run through `npm test`, while lint and production build remain green. There is no sync, export, recovery, PWA, Cloudflare binding, or deployment in this change.

### Key Discoveries

- `context/foundation/prd.md:94-100` requires smartphone-local relationship data, forbids unprotected sync, and requires immediate associated-data removal on deletion.
- `context/foundation/prd.md:110-112` defines a flat owner-only access model; `src/middleware.ts:4-22` already supplies the authenticated user context but product-data access does not exist yet.
- `package.json:3-55` has no test script, test runner, IndexedDB library, or PWA dependency.
- `astro.config.mjs:9-21` disables Astro sessions, and `wrangler.jsonc:9-16` has no KV, D1, R2, or Images binding, so the local-vault boundary must stay independent of Worker persistence.

## What We're NOT Doing

- Building person, interaction, topic, follow-up, or briefing schemas and UI.
- Changing the password-based authentication flow; S-01 owns the passwordless migration.
- Adding synchronization, encryption, recovery passphrases, exports, backups, service workers, installability, or offline asset caching.
- Persisting relationship data through Supabase, Cloudflare, a Worker API, or another remote service.
- Creating Supabase tables, migrations, RLS policies, buckets, or new deployment bindings.

## Implementation Approach

Introduce a `src/lib/relationship-data/` browser-only module boundary backed by native IndexedDB. The module receives an already-authenticated owner ID from future callers, uses composite owner-scoped keys and parent references, and provides generic record and atomic cascade-deletion operations without selecting product fields.

Add Vitest and `fake-indexeddb` as development-only dependencies so the storage contract can be exercised under Node. Keep the privacy rules durable in a foundation document and enforce the no-remote rule with a narrow ESLint override applied only to relationship-data modules.

## Critical Implementation Details

The local vault must not silently fall back to a global or anonymous owner when an owner ID is missing. It must reject initialization instead, because a default namespace would defeat isolation when multiple accounts use one browser profile. Cascade deletion must run in a single read-write IndexedDB transaction and only resolve after that transaction completes.

## Phase 1: Define the boundary and test harness

### Overview

Add the minimum test tooling and publish the durable privacy contract before any relationship-data implementation is introduced.

### Changes Required

#### 1. Test tooling

**Files**: `package.json`, `package-lock.json`

**Intent**: Add a standard automated entry point for privacy-critical local-store behavior without introducing a browser test stack or runtime production dependency.

**Contract**: `npm test` runs Vitest once. Vitest and `fake-indexeddb` are development dependencies only; no production package, Worker configuration, or CI workflow is changed in this phase.

#### 2. Local-data privacy contract

**File**: `context/foundation/local-data-privacy.md`

**Intent**: Make the owner-only local-data boundary explicit for all later slices instead of leaving it implicit in the PRD.

**Contract**: Document the allowed local store, owner-ID scope, no-remote rule, cascade-deletion invariant, threat boundary (browser/device profile), and the explicit MVP exclusions: encryption, sync, export, recovery, and PWA behavior. Reference the PRD's Non-Functional Requirements and Access Control sections.

#### 3. Relationship-data module boundary

**Files**: `src/lib/relationship-data/types.ts`, `src/lib/relationship-data/local-vault.ts`

**Intent**: Define the browser-only generic storage interface that later vertical slices will use, without deciding their product fields or UI behavior.

**Contract**: The public API requires a non-empty owner ID, models generic records with a stable record ID, collection name, and optional parent record ID, and exposes only local read/write/list and cascade-delete operations. It has no import of `@/lib/supabase`, `@supabase/*`, `astro:env/server`, or server-only modules.

### Success Criteria

#### Automated Verification

- `npm test` starts successfully and can execute a TypeScript test file.
- `npm run lint` and `npm run build` pass after adding the test tooling and empty module boundary.
- The local-data contract explicitly records all selected MVP boundaries and prohibited remote persistence paths.

#### Manual Verification

- Review the contract to confirm its browser/device-profile protection model is intentional and no encryption, sync, export, recovery, or PWA promise was accidentally introduced.

**Implementation Note**: Pause for manual confirmation after automated checks pass before continuing to Phase 2.

---

## Phase 2: Implement the owner-scoped local vault

### Overview

Implement the generic IndexedDB adapter and its behavioral tests so future slices can persist relationship records without a remote path.

### Changes Required

#### 1. IndexedDB vault implementation

**File**: `src/lib/relationship-data/local-vault.ts`

**Intent**: Persist generic relationship records locally, with one owner namespace and deterministic lookup/delete behavior.

**Contract**: Open a versioned IndexedDB database through the injected or browser-provided `IDBFactory`; key every record by owner scope plus its local identity; index records for owner and parent lookup; reject an absent owner ID; and never make a request, fetch, or Supabase call. The adapter remains browser-only and does not create a database schema for future user-facing entities.

#### 2. Storage types and errors

**File**: `src/lib/relationship-data/types.ts`

**Intent**: Give later slices a strict, reusable contract instead of allowing untyped payloads or ad-hoc owner handling.

**Contract**: Export the generic record, collection, parent-reference, vault interface, and actionable errors needed by callers and tests. Payloads are opaque `Record<string, unknown>` values; concrete person and interaction field types remain out of scope.

#### 3. Vault behavior tests

**File**: `src/lib/relationship-data/local-vault.test.ts`

**Intent**: Prove the local-store behavior under an IndexedDB-compatible test environment before product slices depend on it.

**Contract**: Use `fake-indexeddb` only in tests. Cover owner isolation, owner-ID rejection, stable retrieval, parent-linked record lookup, and persistence across a vault re-open for the same owner. Tests do not require a network, Supabase credentials, or a running browser.

### Success Criteria

#### Automated Verification

- `npm test` passes the owner-isolation, missing-owner, and local re-open scenarios.
- Test execution succeeds with no network request, Supabase credential, or local Supabase service.
- `npm run lint` and `npm run build` pass with strict TypeScript checks intact.

#### Manual Verification

- Inspect browser developer tools during a local run to confirm sample relationship records appear only in IndexedDB and not in network requests, Worker bindings, or Supabase resources.

**Implementation Note**: Pause for manual confirmation after automated checks pass before continuing to Phase 3.

---

## Phase 3: Enforce deletion and remote-boundary guarantees

### Overview

Complete the privacy contract by making cascade deletion atomic and preventing future relationship-data modules from bypassing the local vault.

### Changes Required

#### 1. Atomic cascade deletion

**Files**: `src/lib/relationship-data/local-vault.ts`, `src/lib/relationship-data/local-vault.test.ts`

**Intent**: Make the PRD's immediate associated-data removal guarantee concrete before later slices persist people and related records.

**Contract**: A cascade delete removes a selected parent record and every record indexed to that parent inside one read-write transaction. The operation reports success only after the transaction completes; a failed transaction reports an error and does not claim deletion completed.

#### 2. Static no-remote enforcement

**File**: `eslint.config.js`

**Intent**: Prevent accidental product-data leakage when later contributors add modules under the relationship-data boundary.

**Contract**: Add a narrowly scoped override for `src/lib/relationship-data/**` that rejects Supabase/server imports and browser network APIs. It must not weaken the existing type-aware rules or affect auth, pages, or unrelated modules.

#### 3. Contract and regression tests

**Files**: `src/lib/relationship-data/local-vault.test.ts`, `context/foundation/local-data-privacy.md`

**Intent**: Keep the documented guarantees and executable tests aligned.

**Contract**: Tests demonstrate that a parent and all dependent generic records disappear after a successful cascade deletion, another owner remains unaffected, and an aborted/failed operation cannot be represented as success. The foundation document links each guarantee to its verification command and carries no promise beyond the agreed MVP scope.

### Success Criteria

#### Automated Verification

- `npm test` proves atomic cascade deletion, owner isolation after deletion, and failed-operation reporting.
- Lint rejects a fixture or targeted check that introduces a forbidden remote import or network call under `src/lib/relationship-data/`.
- `npm run lint` and `npm run build` pass, and `git diff --exit-code -- wrangler.jsonc astro.config.mjs supabase/config.toml src/lib/supabase.ts src/middleware.ts` confirms the existing auth and deployment boundary is unchanged.

#### Manual Verification

- Review the local-data contract and a browser IndexedDB inspection to confirm the implemented behavior matches the selected MVP boundary.
- Confirm no deployment, remote data write, Supabase schema change, or Cloudflare resource mutation was initiated.

## Testing Strategy

### Unit Tests

- Missing or blank owner IDs are rejected before a vault is opened.
- A record written for one owner is never returned for another owner.
- Re-opening the same owner vault retrieves its local records without network access.
- Cascade deletion removes the root and all parent-linked records atomically while leaving another owner's records intact.
- Failed transactions never resolve as completed deletion.

### Integration Tests

- Run `npm test`, `npm run lint`, and `npm run build` under the pinned Node runtime.
- Run a targeted lint check confirming the relationship-data directory cannot introduce a forbidden remote dependency.

### Manual Testing Steps

1. Run the application locally while authenticated and inspect browser developer tools after creating test data through the local-vault test harness or future consumer.
2. Confirm relationship records are visible only in IndexedDB for the active browser profile and no relationship-data request is present in the network panel.
3. Inspect the generated Worker configuration after a build to confirm no data binding was added.

## Performance Considerations

The MVP target is a single owner with small data volume. IndexedDB indexes are limited to owner and parent traversal so later person deletion remains bounded by its own related records. No caching, synchronization queue, or background worker is introduced.

## Migration Notes

There is no existing relationship data to migrate. The IndexedDB schema starts versioned so a future vertical slice can add its own collection through an explicit upgrade path. Browser-profile clearing is permanent data loss by the agreed MVP boundary; no export or recovery path is supplied.

## References

- Product requirements: `context/foundation/prd.md` — Non-Functional Requirements and Access Control
- Roadmap item: `context/foundation/roadmap.md` — F-02
- Existing auth boundary: `src/lib/supabase.ts:1-23`, `src/middleware.ts:4-22`
- Deployment boundary: `wrangler.jsonc:9-16`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Define the boundary and test harness

#### Automated

- [x] 1.1 Add the local-store test command and development-only test dependencies — 88bcb8c
- [x] 1.2 Publish the local-data privacy contract and generic relationship-data interface — 88bcb8c
- [x] 1.3 Pass test setup, lint, and production build checks — 88bcb8c

#### Manual

- [x] 1.4 Confirm the agreed MVP privacy boundary is documented without expanding scope — 88bcb8c

### Phase 2: Implement the owner-scoped local vault

#### Automated

- [x] 2.1 Implement native IndexedDB owner scope and generic local record operations — bd65110
- [x] 2.2 Prove owner isolation, input validation, local re-open, and parent lookup with tests — bd65110
- [x] 2.3 Pass the test, lint, and build suite without network or Supabase requirements — bd65110

#### Manual

- [x] 2.4 Confirm browser inspection shows relationship data only in local IndexedDB — bd65110

### Phase 3: Enforce deletion and remote-boundary guarantees

#### Automated

- [x] 3.1 Implement and prove atomic cascade deletion — 9187685
- [x] 3.2 Enforce the no-remote relationship-data module boundary — 9187685
- [x] 3.3 Pass full validation and confirm auth, Supabase, and Worker configuration are unchanged — 9187685

#### Manual

- [x] 3.4 Confirm the final privacy boundary and absence of remote mutations — 9187685
