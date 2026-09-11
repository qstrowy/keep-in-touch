<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Authenticated Ownership Smoke

- **Plan**: `context/changes/testing-authenticated-ownership-smoke/plan.md`
- **Scope**: Phases 1–3 of 3
- **Date**: 2026-09-12
- **Verdict**: NEEDS ATTENTION
- **Findings**: 0 critical, 1 warning, 1 observation

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | WARNING |
| Scope Discipline | PASS |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Verification Evidence

- `npm run e2e`: 2 tests passed, including the complete A/B ownership smoke.
- `npm test -- --run`: 16 files and 91 tests passed.
- `npm run lint`: passed.
- `npm run build`: passed; the known Wrangler log-permission warning was emitted but did not fail the build.
- All Progress rows for Phases 1–3 are checked and carry their phase commit SHA.
- Manual checks were confirmed during the implementation run.

## Findings

### F1 — E2E server remains running after the suite

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: `scripts/e2e-server.mjs:4-14`, `package.json:11`
- **Detail**: `npm run e2e` stops any existing Astro server before starting the test server, but the Astro process is a background daemon and remains running after Playwright exits. The next e2e run cleans it up, but a successful test command does not leave the local environment clean and can interfere with a developer's subsequent `npm run dev` workflow. This is a lifecycle gap against the plan's deterministic local test-server contract.
- **Fix**: Wrap the Playwright command in a Node runner with a `finally` cleanup that invokes `astro dev stop` after Playwright exits.
  - Strength: Makes the command self-contained and prevents stale test servers or unexpected port ownership after both passing and failing runs.
  - Tradeoff: Adds a small wrapper script and another process boundary around the existing Playwright command.
  - Confidence: HIGH — the current repository behavior and `astro dev status` confirm the background daemon persists after a passing run.
  - Blind spot: Cleanup behavior when the Astro daemon crashes before registration should be verified after the change.
- **Decision**: PENDING

### F2 — Test sign-out is header removal, not endpoint sign-out

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: `tests/e2e/fixtures/auth.ts:19-20`, `tests/e2e/ownership-smoke.spec.ts:20-25`
- **Detail**: The `signOut` fixture clears the synthetic owner header and then navigates to `/dashboard`; it does not submit the application's `/api/auth/signout` form. The smoke therefore proves document-level owner switching and local isolation through the deterministic application seam, but not sign-out endpoint behavior or session invalidation. This is consistent with the approved no-provider and deferred sign-out-failure scope, but the helper name can imply broader coverage.
- **Fix**: Rename the helper to `clearTestSession` and document that provider-backed sign-out is intentionally outside this rollout.
- **Decision**: PENDING
