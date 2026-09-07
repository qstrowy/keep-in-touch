# Restore Validation Gates — Plan Brief

> Full plan: `context/changes/restore-validation-gates/plan.md`

## What & Why

Restore trustworthy validation before product work begins. The failure is primarily local environment drift: tracked files expect the upgraded stack, while ignored installed and generated artifacts still reflect older Astro and Supabase versions.

## Starting Point

The active shell runs Node 24 with an invalid dependency tree containing Astro 6 and Supabase SSR 0.10, despite `.nvmrc`, `package.json`, and the lockfile targeting Node 22.23.2, Astro 7.2.4, and Supabase SSR 0.12.4. Lint also emits ten non-gating Astro parser compatibility notices.

## Desired End State

A clean Node 22.23.2 installation reproduces CI locally: Astro types synchronize, lint is quiet and green, and the production build succeeds. Fresh Worker metadata contains Assets but no KV, `SESSION`, or Images binding, and nothing is deployed.

## Key Decisions Made

| Decision | Choice | Why |
| --- | --- | --- |
| Diagnostic order | Clean install before source edits | Prevents stale package APIs from driving incorrect code changes. |
| Source scope | Change only failures reproduced under the locked graph | Keeps the repair evidence-based and minimal. |
| Lint notices | Remove persistent Astro parser notices | Trustworthy lint output should be high-signal, not merely exit zero. |
| Runtime contract | Node 22.23.2 locally and in CI | Matches `.nvmrc` and the established deployment toolchain. |
| Resource verification | Parse fresh generated Worker metadata | Protects the no-KV/no-Images infrastructure contract without deploying. |
| Deployment | None | Production state is outside this validation repair. |

## Scope

**In scope:**

- Make Node 22.23.2 available as a local prerequisite.
- Replace stale ignored dependencies with `npm ci`.
- Regenerate Astro environment types.
- Add a narrow Astro-only ESLint parser override if the notices persist.
- Run the complete local validation sequence and verify generated bindings.
- Require existing GitHub CI to pass.

**Out of scope:**

- Dependency, lockfile, runtime-pin, CI, or Worker configuration changes.
- Astro session or image-service changes.
- Supabase source work, auth redesign, or product features.
- New tests, scripts, audit remediation, preview upload, or deployment.

## Architecture / Approach

The plan uses a strict evidence funnel: align the runtime, reinstall from the immutable lockfile, regenerate framework types, and reproduce diagnostics. Only the parser notice that remains under the correct graph receives a tracked configuration change; final build metadata is then inspected structurally.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Reconcile environment | Correct runtime, packages, and generated types | Mistaking ignored local drift for a tracked defect |
| 2. Restore clean lint | Quiet typed linting across TypeScript and Astro | Weakening lint coverage while removing noise |
| 3. Verify contracts | Green gates and correct generated Worker bindings | Accidentally validating stale build output |

**Prerequisites:** Node 22.23.2 must be made available on the Windows host; no supported version manager is currently installed.

**Estimated effort:** One focused implementation cycle across three gated phases.

## Open Risks & Assumptions

- The locked dependency graph is assumed to remove the Supabase errors and accept `session: false`, as confirmed by the pinned package contracts.
- The Astro parser notices are expected to remain until the narrow override is applied.
- GitHub CI verification requires the implementation commit to be pushed, but no deployment authorization is required or implied.
- Ignored generated files must be proven fresh before their contents are trusted.

## Success Criteria (Summary)

- Node 22.23.2 clean install, Astro sync, lint, and production build all pass.
- Lint produces no errors, lint findings, or Astro `projectService` compatibility notices.
- Fresh Worker output contains Assets and no KV/`SESSION` or Images binding, while production remains untouched.
