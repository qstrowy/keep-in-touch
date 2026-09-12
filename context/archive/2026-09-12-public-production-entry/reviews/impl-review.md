<!-- IMPL-REVIEW-REPORT -->

# Implementation Review: Make production sign-in publicly accessible

- **Plan**: `context/changes/public-production-entry/plan.md`
- **Scope**: All 3 completed phases
- **Date**: 2026-09-12
- **Verdict**: APPROVED
- **Findings**: 0 critical, 1 warning, 1 observation

## Verdicts

| Dimension           | Verdict |
| ------------------- | ------- |
| Plan Adherence      | PASS    |
| Scope Discipline    | PASS    |
| Safety & Quality    | PASS    |
| Architecture        | PASS    |
| Pattern Consistency | PASS    |
| Success Criteria    | WARNING |

## Findings

### F1 — Provider non-invocation is covered by the handler tests

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `tests/e2e/public-entry.spec.ts:20-30`
- **Detail**: The browser spec checks that a valid signed-out extraction request returns 401. It does not observe provider invocation directly. The delegated route-handler tests assert both the 401 and that `extract` was not called (`src/pages/api/extractions/anchors.test.ts:50-60`); the endpoint contract tests do the same (`src/lib/extraction/endpoint.test.ts:82-87`). Together, the browser and unit layers cover the planned boundary without invoking a real provider.
- **Fix**: None required; retain the split between browser-level route behavior and handler-level dependency assertions.
- **Decision**: DISMISSED — layered tests provide the planned assurance.

### F2 — Windows E2E wrapper stays alive after passing tests

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `scripts/e2e-server.mjs:24-49`
- **Detail**: All four browser specs passed, but the normal `npm run e2e` process did not exit after reporting success and had to be interrupted. The same specs passed with a separately managed Astro server and a temporary Playwright config without `webServer`, which isolates the remaining issue to local server-wrapper teardown on Windows rather than login-page selectors or assertions.
- **Fix**: Investigate and repair the Windows E2E server teardown in a separate focused change; keep the current auth and public-entry assertions.
- **Decision**: ACCEPTED AS RISK — the browser assertions passed independently; track the wrapper shutdown behavior separately.
