# 10xBuilder Certification Evidence

> Submission evidence for the KeepInTouch MVP after completing Modules 1–3.
>
> Last verified: 2026-09-12

## Builder Criteria

| Criterion | Evidence |
| --- | --- |
| Access control | Supabase passwordless email sign-in, protected `/dashboard`, independently authenticated extraction API, and signed-out browser coverage. |
| Meaningful CRUD | People can be created, read, updated, and cascade-deleted from the owner-local relationship vault. Interactions can be created and read. |
| Business logic | Owner isolation, relationship lifecycle rules, Core Topics extraction, exclusion handling, bounded provider contracts, and failure-safe snapshot replacement. |
| Context documents | `context/foundation/` contains the PRD, stack assessment, health check, infrastructure decision, roadmap, and test plan; change plans and reviews are retained in `context/archive/`. |
| User-perspective test | Playwright covers public sign-in entry, protected routes and API, authenticated owner isolation, and a representative create/delete flow. |
| Optional public URL | `https://keep-in-touch.qstrowy.workers.dev/`; production is public while preview deployments remain behind Cloudflare Access. |

## Module 1 Evidence

- Product shaping and requirements: `context/foundation/shape-notes.md` and `context/foundation/prd.md`.
- Stack and project health: `context/foundation/stack-assessment.md`, `context/foundation/health-check.md`, and the archived bootstrap verification.
- Agent onboarding: `AGENTS.md` plus the repository-specific import rule experiment below.
- Infrastructure and deployment: `context/foundation/infrastructure.md`, `context/deployment/deploy-plan.md`, and the live Worker URL.

### AGENTS.md A/B Experiment

On 2026-09-12, six fresh ephemeral Codex CLI sessions received the same read-only import task in isolated copies of a
minimal TypeScript project. Three copies omitted the import rule; three included only: `Use the @/* alias for imports
from src/`.

| Condition | Runs | Correct alias result | Correction iterations implied |
| --- | ---: | ---: | ---: |
| Without rule | 3 | 0/3; every run chose `../relationship-data/local-vault` | 3 |
| With minimal rule | 3 | 3/3; every run chose `@/lib/relationship-data/local-vault` | 0 |

The rule materially improves convention adherence and remains in `AGENTS.md`. The with-rule group completed in about
25 seconds total. Baseline timing is not comparable because the installed CLI emitted model-cache compatibility errors
during the first batch; convention accuracy and required corrections are the reliable measurements.

## Module 2 Evidence

- `context/foundation/roadmap.md` records the MVP slices and completed milestone history.
- Archived changes retain research, phase plans, progress, implementation reviews, and explicit triage decisions.
- Git history uses phase-specific implementation, review, release, and archive commits.

## Module 3 Evidence

- `context/foundation/test-plan.md` maps six product risks to the cheapest useful test layers and records four completed rollout phases.
- Sixteen Vitest files contain 91 unit and integration tests.
- Four Playwright spec files contain five browser tests, including `tests/e2e/seed.spec.ts` as the convention seed.
- `.codex/hooks.json` defines post-edit lint and typecheck checks. `.husky/pre-commit` runs lint-staged for manual edits.
- `.github/workflows/ci.yml` runs typecheck, lint, Vitest, build, installs Chromium, and runs Playwright.

### E2E Review Evidence

- Seed conventions: role and label locators, state-based assertions, unique data, explicit cleanup, and a risk-linked test name.
- Authentication adaptation: the passwordless production flow cannot safely persist real email credentials in test artifacts, so E2E uses the fixed, production-disabled synthetic owner seam instead of `storageState`.
- Deliberate red: returning `false` from protected-route evaluation caused the signed-out privacy test to fail because `/dashboard` remained visible. The change was immediately reverted; the restored test passed.
- Isolation: the full Playwright suite was run twice consecutively after restoration, with a fresh browser context and passing results both times.

### Swallowed-Error Audit

All `try/catch` paths under `src/` were reviewed on 2026-09-12. No API path catches a failed durable write and then
returns success. Catches either map failures to non-success HTTP responses or typed failure results, or display a
user-visible error while preserving existing local data. The authentication adapter maps provider unavailability to
unauthorized access, which remains fail-closed. No production fix was required.

## Verification Commands

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run e2e
```

The E2E wrapper stops Astro before and after Playwright, including failed runs. Locally, Wrangler needs permission to
write its development-server registry under Windows AppData. The GitHub Actions runner uses Linux and installs Chromium
before running the same suite.

## Private Repository Submission

If the repository remains private, grant the course reviewers collaborator access or attach screenshots of this file,
`context/foundation/`, the Playwright and Vitest results, and the successful GitHub Actions run.
