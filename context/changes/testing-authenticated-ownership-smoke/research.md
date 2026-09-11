---
date: 2026-09-11T20:21:26+02:00
researcher: Codex
git_commit: 1f294c872f1400b7baf1a8ea89543320eafc4e81
branch: main
repository: keep-in-touch
topic: "Ground rollout Phase 1: Authenticated ownership smoke"
tags: [research, codebase, authentication, owner-isolation, indexeddb, browser-testing]
status: complete
last_updated: 2026-09-11
last_updated_by: Codex
---

# Research: Authenticated ownership smoke

**Date**: 2026-09-11T20:21:26+02:00
**Researcher**: Codex
**Git Commit**: `1f294c872f1400b7baf1a8ea89543320eafc4e81`
**Branch**: `main`
**Repository**: `keep-in-touch`

## Research Question

Ground rollout Phase 1 of `context/foundation/test-plan.md`: prove that
authentication and browser-local owner isolation work together. Verify signed-
out denial, owner A/B isolation, reload/account-switch behavior, deletion,
and late-write handling. Do not test general Cloudflare or Supabase
infrastructure; test only KeepInTouch-owned boundaries.

## Summary

Phase 1 is feasible, but it is not one test and should remain narrow. The
repository has strong direct storage-contract coverage: owner namespaces,
collection reads, parent checks, cascade deletion, and several replacement
guards are already tested. It has no middleware, route/session, component, or
browser-level tests, so the server-session → dashboard `ownerId` → local vault
seam remains unproven.

The cheapest useful rollout is a small set of application-boundary and real
IndexedDB integration tests, plus one targeted browser smoke. The browser
smoke should prove the user-visible seam across signed-out denial, owner A
creation/reload, sign-out, owner B in the same browser profile, and return to
owner A. Direct mutation and deletion-race guarantees should stay in storage
integration tests rather than being forced through the browser.

Two concrete lifecycle weaknesses need explicit research-to-plan attention:
generic vault `put()` does not verify parent existence, so a late child write
can recreate an orphan after parent deletion; and owner/person changes can
leave stale React state visible while a new local read is pending. These are
application-owned behaviors, not Cloudflare or Supabase infrastructure
failures.

## Detailed Findings

### Authentication and owner identity propagation

- Every request enters middleware, which resolves the current user and stores
  it on `context.locals.user`; dashboard routes are redirected when no user is
  present ([`src/middleware.ts:9-20`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/middleware.ts#L9-L20)).
- The dashboard fails closed when no user exists and passes the server-derived
  `user.id` into the hydrated React island ([`src/pages/dashboard.astro:5-21`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/pages/dashboard.astro#L5-L21)).
- `FirstPersonDashboard` constructs the vault from that owner ID and passes
  the same value to the interaction and anchor children ([`src/components/people/FirstPersonDashboard.tsx:45-60`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/components/people/FirstPersonDashboard.tsx#L45-L60), [`src/components/people/FirstPersonDashboard.tsx:509-510`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/components/people/FirstPersonDashboard.tsx#L509-L510)).
- The extraction route independently checks authentication, but it currently
  handles no relationship-data resource and therefore proves authentication,
  not resource ownership ([`src/pages/api/extractions/anchors.ts:20-40`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/pages/api/extractions/anchors.ts#L20-L40)).
- Middleware authentication errors are not caught. An auth-client exception
  aborts the request instead of being normalized to a fail-closed unauthenticated
  outcome ([`src/middleware.ts:9-13`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/middleware.ts#L9-L13)).
- Sign-out awaits the auth call but ignores its error and always redirects,
  which can make a failed sign-out appear successful ([`src/pages/api/auth/signout.ts:5-9`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/pages/api/auth/signout.ts#L5-L9)).

The normal dashboard path is owner-scoped, but the browser `ownerId` is a
caller-supplied string at the vault boundary, not a session-bound capability.
The browser-local privacy contract explicitly excludes encryption or an
application passcode ([`context/foundation/local-data-privacy.md:25-27`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/context/foundation/local-data-privacy.md#L25-L27)).
This is a residual threat of the chosen MVP boundary, not evidence of a normal
UI cross-owner bypass.

### Browser-local IndexedDB isolation and lifecycle

- The vault trims and rejects blank owner IDs, closes over the normalized owner,
  scopes reads and writes to that owner, and uses a composite key containing
  `ownerId`, collection, and record ID ([`src/lib/relationship-data/local-vault.ts:17-63`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/lib/relationship-data/local-vault.ts#L17-L63), [`src/lib/relationship-data/local-vault.ts:230-251`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/lib/relationship-data/local-vault.ts#L230-L251)).
- Cascade deletion verifies the owner-scoped root and removes descendants in
  one read-write transaction ([`src/lib/relationship-data/local-vault.ts:188-225`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/lib/relationship-data/local-vault.ts#L188-L225)).
- Generic `put()` writes under the vault owner but does not verify that a
  referenced parent still exists ([`src/lib/relationship-data/local-vault.ts:32-36`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/lib/relationship-data/local-vault.ts#L32-L36)). An interaction save can therefore commit after its person is deleted and recreate an orphaned child ([`src/components/interactions/InteractionPanel.tsx:66-91`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/components/interactions/InteractionPanel.tsx#L66-L91), [`src/components/people/FirstPersonDashboard.tsx:176-207`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/components/people/FirstPersonDashboard.tsx#L176-L207)).
- Person saves also use unconditional `put()`, so a delayed root save can
  recreate a deleted person ([`src/components/people/FirstPersonDashboard.tsx:131-174`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/components/people/FirstPersonDashboard.tsx#L131-L174)).
- On an `ownerId` change, the dashboard starts a new read but does not
  synchronously clear the previous people, selected person, or screen state
  ([`src/components/people/FirstPersonDashboard.tsx:45-76`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/components/people/FirstPersonDashboard.tsx#L45-L76)). Normal account switching appears to use document navigation, reducing
  exposure, but the component has no hard isolation boundary for an in-place
  owner change.
- `InteractionPanel` guards a late load response but does not clear old
  interactions before a new person/owner read; its save path also lacks a
  final owner/person snapshot guard ([`src/components/interactions/InteractionPanel.tsx:35-58`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/components/interactions/InteractionPanel.tsx#L35-L58), [`src/components/interactions/InteractionPanel.tsx:66-91`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/components/interactions/InteractionPanel.tsx#L66-L91)).
- Anchor extraction and topic mutations have generation checks, but the
  extraction follow-up local read is not followed by another snapshot check,
  so a changed owner/person can receive stale topic state ([`src/components/anchors/AnchorBriefing.tsx:117-160`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/components/anchors/AnchorBriefing.tsx#L117-L160)).

### Existing tests and uncovered seam

Current verification is healthy: `npm test -- --run` passes 14 files and 85
tests; `npm run lint` passes.

Already covered directly:

- Vault blank-owner rejection, owner isolation, reopen persistence, collection
  and parent reads, guarded mutations, cascade deletion, and replacement
  revalidation ([`src/lib/relationship-data/local-vault.test.ts:21-167`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/lib/relationship-data/local-vault.test.ts#L21-L167), [`src/lib/relationship-data/local-vault.test.ts:242-267`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/lib/relationship-data/local-vault.test.ts#L242-L267), [`src/lib/relationship-data/local-vault.test.ts:531-620`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/lib/relationship-data/local-vault.test.ts#L531-L620)).
- Person reload, same-ID update, owner isolation, and descendant deletion
  ([`src/lib/people/person-storage.test.ts:9-110`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/lib/people/person-storage.test.ts#L9-L110)).
- Interaction reload, second-owner invisibility, and cascade behavior
  ([`src/lib/interactions/interaction-storage.test.ts:10-46`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/lib/interactions/interaction-storage.test.ts#L10-L46)).
- Passwordless helper behavior and generic extraction endpoint authentication
  rejection ([`src/lib/auth/passwordless.test.ts:40-126`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/lib/auth/passwordless.test.ts#L40-L126), [`src/lib/extraction/endpoint.test.ts:31-88`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/src/lib/extraction/endpoint.test.ts#L31-L88)).

Not covered:

- Middleware, dashboard route/session propagation, sign-out error behavior,
  and cookie-backed authenticated request behavior.
- A browser path from signed-out denial through owner A, reload, sign-out,
  owner B in the same profile, and return to owner A.
- React behavior during in-place owner/person changes, unmounts, hydration,
  and late saves.
- An in-flight write interleaved with cascade deletion; current “late” tests
  reject replacement after deletion but do not hold a write open and race it.

### CI and browser feasibility

- The repository has Vitest 5 but no Vitest config, Playwright config, browser
  test directory, browser script, component harness, or deterministic
  authenticated-session fixture.
- The CI workflow runs `npm ci`, Astro sync, lint, and build, but not `npm test`
  ([`.github/workflows/ci.yml:1-21`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/.github/workflows/ci.yml#L1-L21)).
- One browser smoke remains proportionate, but it requires a minimal browser
  harness and deterministic session setup. It should not attempt arbitrary
  cross-owner mutation through the UI; direct storage integration tests are
  the right layer for that guarantee.

## Cheapest Useful Test Design

1. Add application-boundary integration tests for middleware and sign-out,
   mocking the auth client interface only. Assert denial/redirect behavior and
   truthful sign-out outcomes; do not test Supabase internals or Cloudflare
   infrastructure.
2. Add real `fake-indexeddb` integration tests for owner namespaces, same-owner
   reopen, owner A/B visibility, cascade deletion, late child writes, and late
   root saves. Do not mock vault methods or transactions.
3. Add one targeted browser smoke covering:
   - signed-out `/dashboard` denial;
   - owner A creates uniquely identifiable local data and sees it after reload;
   - sign-out and owner B authentication in the same browser profile;
   - owner B cannot see A's data and can create separate data;
   - returning to A restores A's data without showing B's data.
4. If the harness can change `ownerId` without a full document remount, add a
   focused stale-state assertion. Otherwise keep that concern in deterministic
   component/integration coverage rather than expanding the browser suite.

## Architecture Insights

- Authentication is server-derived, while relationship data is browser-local;
  the critical trust seam is the `user.id` value passed into the hydrated
  dashboard, not provider infrastructure.
- The vault provides strong namespace and cascade primitives, but generic
  writes do not enforce parent existence. Parent-checked operations are needed
  wherever deletion races are in scope.
- Full document navigation currently masks some in-place account-switch
  hazards. That lowers current likelihood but does not make the React island
  safe if a future session listener or router reuses it across owners.
- The UI cannot prove arbitrary cross-owner mutation because it cannot address
  records it cannot see. Split the oracle: storage tests prove the invariant;
  browser smoke proves session-to-owner propagation and visible isolation.

## Historical Context (from prior changes)

- The local privacy contract requires browser-only IndexedDB, a non-empty
  authenticated owner ID, owner isolation, atomic parent/descendant deletion,
  and no relationship-data sync or remote persistence ([`context/archive/2026-09-07-local-data-privacy-contract/plan.md:15-17`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/context/archive/2026-09-07-local-data-privacy-contract/plan.md#L15-L17)).
- The first-person slice explicitly required reload persistence, second-owner
  invisibility, and manual sign-out/re-login verification ([`context/archive/2026-09-09-create-first-person/plan.md:130-160`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/context/archive/2026-09-09-create-first-person/plan.md#L130-L160)).
- The maintain/delete and interaction slices added storage-focused owner and
  cascade tests while leaving full different-owner UI verification manual
  ([`context/archive/2026-09-09-maintain-and-delete-person/plan.md:37-58`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/context/archive/2026-09-09-maintain-and-delete-person/plan.md#L37-L58), [`context/archive/2026-09-09-record-dated-interaction/plan.md:38-76`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/context/archive/2026-09-09-record-dated-interaction/plan.md#L38-L76)).
- A prior auth review noted a cross-origin magic-link POST concern. It is
  separate from this local owner-isolation rollout and should become its own
  auth-hardening change unless scope is explicitly expanded ([`context/archive/2026-09-07-passwordless-private-access/reviews/impl-review.md:23-31`](https://github.com/qstrowy/keep-in-touch/blob/1f294c872f1400b7baf1a8ea89543320eafc4e81/context/archive/2026-09-07-passwordless-private-access/reviews/impl-review.md#L23-L31)).

## Code References

- `src/middleware.ts:9-20` — resolves the authenticated user and redirects protected routes when no user exists.
- `src/pages/dashboard.astro:5-21` — fails closed without a user and passes the server-derived owner ID to the hydrated dashboard.
- `src/components/people/FirstPersonDashboard.tsx:45-76, 131-207, 509-510` — owns dashboard hydration, person lifecycle, and child owner-ID propagation.
- `src/lib/relationship-data/local-vault.ts:17-63, 188-225, 230-251` — enforces owner-scoped reads/writes and atomic cascade deletion.
- `src/components/interactions/InteractionPanel.tsx:35-58, 66-91` — loads interaction state with an active guard but saves without a final owner/person snapshot check.
- `src/components/anchors/AnchorBriefing.tsx:117-160` — guards extraction generations but applies a follow-up local read without another snapshot check.
- `src/lib/relationship-data/local-vault.test.ts:21-167, 242-267, 531-620` — existing owner, lifecycle, cascade, and replacement coverage.
- `.github/workflows/ci.yml:1-21` — current CI steps; tests are not included.

## Related Research

- `context/foundation/test-plan.md` — rollout strategy and risk response guidance.
- `context/foundation/local-data-privacy.md` — current browser-local privacy contract.
- `context/archive/2026-09-07-local-data-privacy-contract/plan.md` — original storage boundary and verification contract.

## Open Questions

- Should the plan harden generic child writes with a parent-checked operation,
  or should Phase 1 test only the current behavior and leave the fix to a
  separate implementation decision?
- What is the smallest deterministic session fixture for the passwordless
  browser smoke without depending on real email delivery?
- Should middleware auth exceptions and sign-out failures be included in this
  rollout, or split into a separate auth-hardening change? The current risk
  scope supports including them as application-owned boundary cases, while the
  prior cross-origin magic-link concern remains out of scope.
