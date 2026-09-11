# Authenticated Ownership Smoke — Plan Brief

> Full plan: `context/changes/testing-authenticated-ownership-smoke/plan.md`
> Research: `context/changes/testing-authenticated-ownership-smoke/research.md`

## What & Why

This change proves that the authenticated owner identity reaches the
browser-local relationship-data boundary correctly. It closes the current
gap between strong direct IndexedDB tests and the real session → dashboard →
local-storage path, using one compact owner A/B browser scenario.

## Starting Point

Middleware protects `/dashboard`, the dashboard passes `user.id` to the React
island, and the vault already scopes records by owner. The suite has 14 files
and 85 passing tests, but no middleware, component, or browser tests.

## Desired End State

A deterministic local browser command can arrange signed-out, owner A, and
owner B states without real email delivery or provider infrastructure. Owner A
data survives reload, owner B cannot see it in the same browser profile, and
returning to A restores only A’s data.

## Key Decisions Made

| Decision                | Choice                               | Why                                                                                    | Source           |
| ----------------------- | ------------------------------------ | -------------------------------------------------------------------------------------- | ---------------- |
| Browser authentication  | Deterministic test identities        | Avoids real email/provider dependencies while preserving the application session seam. | Plan             |
| Browser scenario        | One core A/B isolation flow          | Provides the missing user-visible signal without a broad e2e suite.                    | Research / Plan  |
| Account switching       | Full document navigation             | Matches current supported behavior; in-place owner changes remain out of scope.        | Research / Plan  |
| Late writes             | Test current supported behavior only | Avoids encoding an unsafe race as protected; hardening is separate work.               | Plan             |
| CI                      | Local first; CI later                | Keeps quality-gate wiring in rollout Phase 4.                                          | Test plan / Plan |
| Provider infrastructure | Excluded                             | Cloudflare and Supabase infrastructure are treated as trusted provider setup.          | User decision    |

## Scope

**In scope:**

- Minimal Playwright runner and explicitly guarded deterministic session fixture.
- Normal signed-out dashboard denial and owner-ID propagation coverage.
- Real `fake-indexeddb` owner separation, reload, and cascade integration cases.
- One signed-out → owner A → reload → owner B → owner A browser smoke.
- Local test commands and clean test-profile reset instructions.

**Out of scope:**

- Cloudflare/Supabase infrastructure, provider internals, or real email delivery.
- Auth exceptions, sign-out failure semantics, CI workflow changes, and broad browser coverage.
- In-place owner switching, late-write hardening, and arbitrary UI cross-owner mutation.

## Architecture / Approach

Use a narrowly gated test-server session seam to produce fixed owner A/B
identities through the existing server-derived owner-ID path. Keep persistence
assertions on real `fake-indexeddb`, where namespace and cascade behavior are
cheapest to verify. Use Playwright only for the browser-visible seam that unit
and storage tests cannot prove.

## Phases at a Glance

| Phase                             | What it delivers                                          | Key risk                                                      |
| --------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| 1. Deterministic browser harness  | Local runner and fixed signed-out/A/B session contexts.   | Test seam bypasses or changes production auth behavior.       |
| 2. Ownership integration coverage | Direct application-owned owner/reload/cascade invariants. | Tests duplicate existing coverage or claim late-write safety. |
| 3. Targeted browser smoke         | One same-profile A/B isolation journey.                   | Browser path does not reflect session-derived owner identity. |

**Prerequisites:** Existing Astro app, Vitest suite, `fake-indexeddb`, and the
approved research artifact. No provider credentials or inbox are required.

**Estimated effort:** Approximately 2–3 implementation sessions across three
phases, with one manual browser verification pass.

## Open Risks & Assumptions

- Late child/root writes can still recreate stale data; this plan records but
  does not fix that known risk.
- The browser-local owner ID is not an encryption boundary; the smoke proves
  normal application propagation and isolation, not protection from a user who
  deliberately manipulates local browser state.
- CI will not enforce these tests until the separate quality-gates rollout.

## Success Criteria (Summary)

- Signed-out users are denied, and the real dashboard path uses deterministic
  owner identities without real provider calls.
- Owner A and owner B remain isolated across reload and document navigation.
- The test suite adds meaningful application-owned signal without expanding
  into provider infrastructure or deferred lifecycle hardening.
