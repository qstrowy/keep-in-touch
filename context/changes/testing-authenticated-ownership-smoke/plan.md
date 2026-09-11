# Authenticated Ownership Smoke Implementation Plan

## Overview

Add a narrow application-owned test layer proving that authenticated session
identity reaches the browser-local relationship-data boundary without exposing
one owner's data to another. The rollout adds a deterministic two-owner
browser fixture, real IndexedDB integration coverage for the supported
document-navigation lifecycle, and one browser smoke path.

This change is test-first in scope. It does not test Cloudflare or Supabase
infrastructure, use real email delivery, harden the known late-write race, or
wire CI gates. Those decisions are explicit boundaries from the approved
research and planning interview.

## Current State Analysis

- Middleware resolves the authenticated user, protects `/dashboard`, and the
  dashboard passes `user.id` to the hydrated `FirstPersonDashboard`
  ([`src/middleware.ts:9-20`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/middleware.ts#L9-L20), [`src/pages/dashboard.astro:5-21`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/pages/dashboard.astro#L5-L21)).
- The dashboard constructs the owner-scoped vault and passes the same owner ID
  to child flows ([`src/components/people/FirstPersonDashboard.tsx:45-60`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/components/people/FirstPersonDashboard.tsx#L45-L60), [`src/components/people/FirstPersonDashboard.tsx:509-510`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/components/people/FirstPersonDashboard.tsx#L509-L510)).
- The IndexedDB vault has strong owner-scoped keys, reads, and atomic cascade
  deletion ([`src/lib/relationship-data/local-vault.ts:17-63`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/lib/relationship-data/local-vault.ts#L17-L63), [`src/lib/relationship-data/local-vault.ts:188-225`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/lib/relationship-data/local-vault.ts#L188-L225)).
- Existing tests cover most direct storage invariants: 14 files and 85 tests
  pass, but there are no middleware, dashboard session, component, or browser
  tests. Current CI also omits `npm test` ([`.github/workflows/ci.yml:1-21`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/.github/workflows/ci.yml#L1-L21)).
- The browser-local boundary accepts any non-empty owner string, so the browser
  fixture must prove the normal server-derived path without implying that
  browser storage is an encrypted security boundary.

## Desired End State

The repository has a deterministic local browser-test command that can run
owner A and owner B through the normal application session-to-dashboard path
without real email delivery or provider infrastructure. A signed-out request
is denied, owner A's local data survives reload, owner B in the same browser
profile cannot see it, and returning to A restores only A's data.

Direct `fake-indexeddb` integration tests continue to prove owner namespaces,
reload persistence, and cascade behavior. The plan does not claim protection
against the currently known in-flight late-write resurrection race; that is a
separate implementation decision.

### Key Discoveries:

- `src/middleware.ts:9-20` owns the current protected-route decision, but is not
  directly tested.
- `src/pages/dashboard.astro:5-21` is the session-to-browser owner-ID seam; no
  current test proves its value reaches local storage.
- `src/lib/relationship-data/local-vault.test.ts:21-167, 242-267, 531-620`
  already covers most direct owner and cascade behavior, so new storage tests
  must add signal rather than duplicate existing cases.
- `src/components/people/FirstPersonDashboard.tsx:45-76` can retain stale
  in-memory state during an in-place owner prop change, but the supported
  account-switch behavior for this change is full document navigation.
- Research confirmed the smallest sufficient combination is real storage
  integration plus one browser smoke; a full e2e suite is not justified.

## What We're NOT Doing

- No tests of general Cloudflare Workers, Supabase availability, provider
  internals, deployment infrastructure, or provider claims.
- No real passwordless email delivery, external inbox, or production auth
  credentials in tests.
- No middleware auth-exception branch or sign-out-failure branch; those are
  deferred per the planning decision. Normal signed-out dashboard denial is
  still part of the browser smoke.
- No production hardening for generic late child/root writes, and no test that
  presents the current late-write behavior as protected.
- No in-place `ownerId` switching contract; sign-out/re-login is modeled as a
  full document navigation.
- No CI workflow changes; required test-gate wiring belongs to rollout Phase 4.
- No component-test framework, visual snapshots, accessibility runner, or
  broad browser matrix.
- No arbitrary cross-owner mutation through the UI; storage integration is the
  oracle for direct namespace and cascade invariants.

## Implementation Approach

Build the browser path around explicit deterministic test identities. The test
server must expose a narrowly gated session seam that is unavailable in normal
production execution; it should produce the same server-derived owner ID that
the dashboard already consumes. The browser fixture will arrange signed-out,
owner-A, and owner-B contexts without calling real email or provider services.

Keep storage assertions on the real `fake-indexeddb` adapter. Reuse existing
helpers and extend only the missing cross-owner/document-navigation cases.
Drive one Playwright smoke against the local app and assert user-visible
behavior with accessible roles or stable labels rather than implementation
snapshots. Keep production behavior unchanged except for the minimum explicit
test seam required to make the session-to-owner path deterministic.

## Critical Implementation Details

### Test-mode boundary

Any synthetic session path must require an explicit test-server condition and
must not activate from a request value alone in a normal build. It must create
only fixed non-secret owner identities, must not accept arbitrary owner IDs,
and must fail closed when the test condition is absent.

### Navigation and lifecycle

The browser scenario uses sign-out/re-login as a document transition, matching
the current supported behavior. Do not add an in-place owner-switch contract.
Storage tests may verify existing deletion/cascade outcomes, but late writes
that currently can recreate records remain deferred and must be named as an
accepted risk in the implementation notes.

### Provider boundary

Mock or replace only the application-owned auth/session interface needed for a
deterministic test. Do not start Cloudflare, query Supabase infrastructure,
send real magic links, or assert provider internals.

## Phase 1: Build the deterministic browser test harness

### Overview

Create the smallest browser-test runner and test-only session fixture that can
exercise signed-out, owner-A, and owner-B dashboard states through the normal
application path.

### Changes Required:

#### 1. Browser runner and local test server

**Files**: `package.json`, `package-lock.json`, `playwright.config.ts` (new),
and the chosen e2e fixture directory.

**Intent**: Add the minimal Playwright setup required for one local browser
smoke, using the existing app server and no provider infrastructure.

**Contract**: Provide one explicit local e2e command, a deterministic base URL,
and a test-server lifecycle that can run the existing application with the
test-only session condition enabled. Do not add a browser matrix or unrelated
component-test dependencies.

#### 2. Deterministic owner session fixture

**Files**: the new e2e fixture support file plus the smallest application-owned
session seam identified by the existing middleware/session construction.

**Intent**: Let tests arrange signed-out, owner A, and owner B states without
real email delivery while preserving the normal server-derived `user.id` to
dashboard flow.

**Contract**: The fixture exposes only fixed identities such as `owner-a` and
`owner-b`; it cannot select arbitrary IDs, requires an explicit test-server
condition, and is inactive in production builds. A signed-out context must
still take the normal unauthenticated redirect path.

### Success Criteria:

#### Automated Verification:

- The e2e command starts the local app with the deterministic session fixture and exits cleanly for a placeholder harness check.
- The fixture produces distinct owner-A and owner-B sessions and a signed-out context without real email or provider calls.
- `npm test -- --run`, `npm run lint`, and `npm run build` pass with the harness present.

#### Manual Verification:

- Inspect the test-mode guard and confirm synthetic identities cannot activate in the normal production configuration.

## Phase 2: Add application-owned ownership integration coverage

### Overview

Close the remaining direct integration gaps without duplicating the storage
contract suite or changing the deferred late-write behavior.

### Changes Required:

#### 1. Cross-owner local persistence scenarios

**Files**: `src/lib/relationship-data/local-vault.test.ts`,
`src/lib/people/person-storage.test.ts`, and
`src/lib/interactions/interaction-storage.test.ts` only where an exact gap
remains after the existing tests are reused.

**Intent**: Make the owner-A/owner-B and document-navigation expectations
explicit at the real IndexedDB boundary, including reload persistence and
owner-scoped cascade outcomes.

**Contract**: Use the real `fake-indexeddb` adapter and fixed distinct owners.
Assert that each owner sees only its own records, reopening preserves the same
owner's records, deleting one owner's person removes that owner's descendants,
and another owner's records remain. Do not mock vault methods or transactions,
and do not assert that the currently deferred in-flight late-write race is
safe.

#### 2. Application-boundary ownership oracle

**Files**: the smallest testable middleware/session boundary identified during
implementation, plus its colocated test file if a new seam is required.

**Intent**: Prove the normal application-owned rule that a missing session is
denied and the dashboard receives the authenticated owner identity used to
construct local storage.

**Contract**: Cover only normal signed-out denial and owner-ID propagation. Do
not add auth-provider error semantics, sign-out error semantics, resource APIs,
or provider-infrastructure assertions in this phase.

### Success Criteria:

#### Automated Verification:

- Focused local persistence tests pass for owner separation, reopen persistence, and owner-scoped cascade behavior.
- Application-boundary tests prove a missing session is denied and the authenticated owner ID reaches the dashboard/storage seam.
- The full Vitest suite remains green with `npm test -- --run`, and `npm run lint` passes.

#### Manual Verification:

- Review the focused tests to confirm their expected values come from the owner-isolation contract, not from copied implementation output.

## Phase 3: Add the targeted A/B browser smoke

### Overview

Use the new fixture to prove the single user-visible account-switch scenario
that unit and storage tests cannot establish.

### Changes Required:

#### 1. Authenticated ownership smoke spec

**Files**: the new e2e spec under the repository's chosen browser-test
directory, plus only the application labels/selectors required for stable
accessible assertions.

**Intent**: Verify the complete application-owned seam with one compact
scenario instead of creating a broad browser suite.

**Contract**: The scenario must perform, in order: signed-out `/dashboard`
denial; owner A authentication; creation of uniquely identifiable local data;
reload and persistence assertion; sign-out; owner B authentication in the same
browser profile; absence of A's data and presence of B's separate data; return
to A; and confirmation that A's data is restored while B's data is absent.
Use document navigation for account switching. Do not inspect provider
internals or attempt arbitrary cross-owner mutation through the UI.

#### 2. Local verification recipe

**Files**: `package.json` only if the e2e command needs a script, and the
change's plan/cookbook notes through the implementation workflow.

**Intent**: Make the smoke reproducible for a developer without implying that
CI is already enforcing it.

**Contract**: Document the exact local command, required test-only environment
condition, and cleanup/reset behavior for the browser profile or IndexedDB
database. Keep CI workflow changes for the later quality-gates rollout.

### Success Criteria:

#### Automated Verification:

- The browser smoke passes for signed-out denial, owner A reload persistence, owner B isolation, and return to owner A.
- The browser smoke uses one profile for A/B navigation and leaves no real credentials or provider calls in the test.
- `npm run lint`, `npm test -- --run`, and `npm run build` pass after the e2e spec lands.

#### Manual Verification:

- Run the smoke once from a clean browser profile and confirm the visible UI never shows owner A data while owner B is active.
- Confirm the scenario uses full document navigation and does not claim to verify in-place owner switching or late-write safety.

## Testing Strategy

### Unit Tests:

- Keep existing pure auth-helper and domain tests intact.
- Add only small seam tests where they prove normal signed-out denial or
  server-derived owner-ID propagation.
- Do not add semantic-quality assertions for generated content or provider
  infrastructure checks.

### Integration Tests:

- Use real `fake-indexeddb` for owner namespaces, reload persistence, and
  cascade deletion.
- Use fixed distinct owners and data names so cross-owner visibility is an
  independent oracle.
- Mock only the application-owned auth/session interface needed by boundary
  tests; do not mock local-vault internals.

### Browser Testing:

- Maintain one Playwright smoke flow, not a full browser matrix.
- Prefer accessible role/name assertions and stable labels over CSS structure,
  snapshots, or implementation-specific state.
- Keep account switching as signed-out document navigation.

### Manual Testing Steps:

1. Start the local app using the documented test-only session condition.
2. Visit `/dashboard` signed out and confirm redirect to sign-in.
3. Authenticate as owner A, create a uniquely named person, and reload.
4. Sign out, authenticate as owner B in the same profile, and confirm A's
   person is absent before creating B's uniquely named person.
5. Return to owner A and confirm only A's person is visible.
6. Reset the test profile/database after the run.

## Performance Considerations

The test rollout targets one person and a small number of local records. No
performance benchmark, browser matrix, or production data-volume claim is
needed. Keep the browser smoke deterministic and short; use integration tests
for storage behavior that does not require rendering.

## Migration Notes

No production data migration or IndexedDB schema migration is planned. Test
runs must use isolated or reset local test data so identities from one run do
not affect another. The existing production owner-local storage contract is
unchanged.

## References

- Related research: `context/changes/testing-authenticated-ownership-smoke/research.md`
- Rollout strategy: `context/foundation/test-plan.md`
- Privacy contract: `context/foundation/local-data-privacy.md`
- Existing storage coverage: `src/lib/relationship-data/local-vault.test.ts:21-167, 242-267, 531-620`
- Protected route and owner propagation: `src/middleware.ts:9-20`, `src/pages/dashboard.astro:5-21`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Build the deterministic browser test harness

#### Automated

- [x] 1.1 Add the minimal browser runner, local test-server lifecycle, and explicit e2e command. — 813fbbf
- [x] 1.2 Add the guarded deterministic owner-A/owner-B and signed-out session fixture. — 813fbbf
- [x] 1.3 Run the existing Vitest, lint, and build checks with the harness present. — 813fbbf

#### Manual

- [x] 1.4 Confirm the synthetic session path is unavailable in normal production configuration. — 813fbbf

### Phase 2: Add application-owned ownership integration coverage

#### Automated

- [x] 2.1 Add only the missing real IndexedDB owner-separation, reopen, and cascade scenarios. — 85bcd30
- [x] 2.2 Add normal signed-out denial and authenticated owner-ID propagation coverage at the application boundary. — 85bcd30
- [x] 2.3 Run focused and full Vitest plus lint verification. — 85bcd30

#### Manual

- [x] 2.4 Review integration-test oracles for contract-based expectations and no deferred late-write claim. — 85bcd30

### Phase 3: Add the targeted A/B browser smoke

#### Automated

- [x] 3.1 Add the single-profile signed-out → owner A → reload → owner B → owner A smoke scenario. — a54a735
- [x] 3.2 Add the reproducible local command and test-data/profile reset instructions. — a54a735
- [x] 3.3 Run e2e, Vitest, lint, and build verification locally. — a54a735

#### Manual

- [x] 3.4 Run the smoke from a clean profile and confirm visible owner isolation across document navigation. — a54a735
- [x] 3.5 Confirm the smoke does not claim in-place switching, late-write safety, or provider-infrastructure coverage. — a54a735
