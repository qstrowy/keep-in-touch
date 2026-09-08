<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Introduce passwordless private access

- **Plan**: `context/changes/passwordless-private-access/plan.md`
- **Scope**: Phases 1-3 of 3
- **Date**: 2026-09-08
- **Verdict**: APPROVED
- **Findings**: 0 critical, 1 warning, 1 observation

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Findings

### F1 — Magic-link POST accepts cross-site requests

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped.
- **Dimension**: Safety & Quality
- **Location**: `src/pages/api/auth/magic-link.ts:7`
- **Detail**: The endpoint processes any form POST and immediately requests an OTP through the cookie-aware Supabase client; it does not require the request `Origin` to equal the application's origin. A third-party form can therefore trigger an Access-authorized visitor's browser to request a magic link and receive a PKCE verifier cookie. Provider rate limits reduce volume but do not establish request intent. Cloudflare Access reduces exposure in the hosted deployment, but is not a substitute for same-origin protection at this state-changing endpoint.
- **Fix**: Before reading form data, reject a missing or mismatched `Origin` with the existing generic sign-in error, then add a focused test covering cross-origin POST rejection.
- **Decision**: DEFERRED by user on 2026-09-08 — documented for later hardening.

### F2 — Native submission does not activate the pending button state

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped.
- **Dimension**: Safety & Quality
- **Location**: `src/components/auth/MagicLinkForm.tsx:35`
- **Detail**: The form uses the native string action `/api/auth/magic-link`. `useFormStatus()` in `SubmitButton` tracks React function actions, so it does not mark this native navigation as pending. Rapid valid clicks can therefore submit more than one email request before navigation begins, contrary to the plan's duplicate-submit mitigation.
- **Fix**: Track local submission state after client validation succeeds and pass it to the button's disabled/pending UI; add a focused UI check that only one valid submission is sent.
- **Decision**: DEFERRED by user on 2026-09-08 — documented for later hardening.

## Verification evidence

- `vitest run` under Node 22: PASS — 3 test files, 17 tests.
- ESLint under Node 22: PASS.
- Astro production build under Node 22: PASS. Wrangler emitted a sandbox-only `EPERM` while writing its debug log, but the build completed successfully.
- `git diff --exit-code -- wrangler.jsonc astro.config.mjs src/lib/relationship-data`: PASS.
- Manual local and hosted magic-link tests are marked complete in the plan and were confirmed during implementation.
