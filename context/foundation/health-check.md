---
project: keep-in-touch
checked_at: 2026-09-10T23:26:53.9339614+02:00
health_status: critical-issues
context_type: brownfield
language_family: js
stack_assessment_available: true
checks_run:
  - lockfile
  - dependency_audit
  - outdated_deps
  - test_runner
  - ci_cd
  - configuration
audit_findings:
  critical: 1
  high: 5
  moderate: 0
  low: 1
test_runner_detected: true
ci_provider: GitHub Actions
recommended_fixes: 5
---

## Dependency Health

### Lockfile

Status: present (`package-lock.json`)
Package manager: npm

The lockfile records 882 installed dependency nodes, so clean installs can reproduce the audited tree.

### Security Audit

Tool: `npm audit --json`
Summary: 1 CRITICAL, 5 HIGH, 0 MODERATE, 1 LOW
Direct vs transitive: 1 direct finding (`astro`); 6 transitive findings

The audit completed against the live npm advisory endpoint on 2026-09-10. Its non-zero exit code reflects detected vulnerabilities rather than a failed audit.

#### CRITICAL findings

- **astro 7.2.4** — [GHSA-26w7-cxv4-gfx2](https://github.com/advisories/GHSA-26w7-cxv4-gfx2): remote code execution through AVIF image optimization in Astro versions before 7.2.8 (CVSS 9.8). The advisory states that exploitation requires Astro to process an untrusted AVIF image. Fix: update Astro to at least 7.2.8; npm currently proposes 7.3.2 as a non-major update.

#### HIGH findings

- **js-yaml 4.3.1** — [GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh): crafted YAML with repeated empty merge sources can cause excessive CPU use. This package is transitive through Astro's helpers and ESLint. Fix: resolve js-yaml 4.3.2 or later through compatible parent-package updates.
- **sharp 0.35.2 and 0.35.3** — [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c): vulnerable libheif versions can allow remote code execution under affected image-processing conditions. The two copies are transitive through Astro and Miniflare. Fix: resolve sharp 0.35.4 or later by updating Astro and Wrangler.
- **svgo 4.0.2** — [GHSA-w27v-7q3p-w38r](https://github.com/advisories/GHSA-w27v-7q3p-w38r) and [GHSA-4vpr-x523-8j87](https://github.com/advisories/GHSA-4vpr-x523-8j87): script-removal bypasses can leave executable content in crafted SVG input. This package is transitive through Astro. Fix: resolve svgo 4.1.0 or later through the Astro update.
- **miniflare 5.20260820.0-alpha** — npm aggregates the vulnerable transitive sharp copy into a high-severity Miniflare finding. Fix available: update Wrangler from 4.125.0 to 4.131.0, then verify the resolved sharp version.
- **@cloudflare/vite-plugin 1.53.1** — npm aggregates vulnerable Miniflare and Wrangler paths into a high-severity plugin finding. The package is transitive through `@astrojs/cloudflare` 14.2.3. Fix: update the Cloudflare adapter and Wrangler together, then rerun the audit.

LOW: npm also reports one `postcss-selector-parser` finding through `eslint-plugin-astro`. The installed tree reports 7.1.6 while the audit payload describes an affected range ending at 7.1.2, so this appears internally inconsistent. Treat it as unresolved audit metadata until a refreshed lockfile and audit either clear or reproduce it.

Recommended coordinated remediation—documented only, not executed by this health check:

```powershell
npm install astro@7.3.2 @astrojs/cloudflare@14.3.1 --save-exact
npm install wrangler@4.131.0 --save-dev --save-exact
npm audit
npm test
npm run lint
npm run build
```

### Outdated Dependencies

Packages with major version gaps: 5

- **TypeScript**: 5.9.3 → 7.0.2, two major versions behind. This is the only two-major gap and should be handled as a separate compatibility change after the security update.
- **ESLint and `@eslint/js`**: 9.x → 10.x, one coordinated major-tooling upgrade.
- **lint-staged**: 16.4.0 → 17.5.1, one major version behind.
- **prettier-plugin-astro**: 0.14.1 → 1.0.0, a pre-1.0 to stable-major transition.

All other reported updates are within the installed major versions. Do not combine the TypeScript and lint-tool major upgrades with the urgent security patch; isolating them keeps regressions attributable.

## Test Suite

Test runner: Vitest 5.0.0
Tests found: 72 tests in 14 files
Test execution: passing
Configuration: `package.json` script and standard Vitest/Vite defaults; no dedicated `vitest.config.*`
Framework: Vitest 5.0.0

`npm test` completed successfully with all 14 files and 72 tests passing in 8.79 seconds. An earlier JSON-reporter run briefly overlapped another test process and timed out in `relationship-data-boundary.test.ts`; the affected two-test file passed in isolation, and the subsequent clean full-suite run passed. This indicates contention-sensitive timing rather than a persistent failure, but the 15-second test timeout is worth watching on slower CI runners.

The suite directly covers areas relevant to the Core Topics change: owner-local relationship storage, people, interactions, anchors and briefing behavior, extraction contracts, the extraction client, provider behavior, and the authenticated extraction route.

## CI/CD

Provider: GitHub Actions
Configuration: `.github/workflows/ci.yml`

| Stage      | Status | Notes                                                                        |
| ---------- | ------ | ---------------------------------------------------------------------------- |
| Lint       | ✓      | `npm run lint`                                                               |
| Test       | ✗      | Vitest is configured locally, but CI does not run `npm test`                 |
| Build      | ✓      | `npm run build`                                                              |
| Type check | ✗      | Type-aware ESLint runs, but there is no dedicated `astro check` or `tsc` run |
| Security   | ✗      | No `npm audit`, Dependabot, CodeQL, or equivalent dependency-security stage  |

The workflow uses the locked npm install path and runs on pushes and pull requests to `main`. Its missing test, dedicated type-check, and security stages do not determine this report's health verdict, but they leave regressions and future advisories dependent on manual local checks.

## Configuration

### High severity

None. `tsconfig.json` extends Astro's strict preset, ESLint uses type-aware strict rules, `.gitignore` exists, and environment variables are documented in `.env.example`.

### Medium severity

- **`AGENTS.md` and `CLAUDE.md` contain stale guidance** — `AGENTS.md:25` says no automated test framework exists even though `package.json` configures Vitest and the suite passes. `CLAUDE.md` omits `npm test` and contains auth-route and validation guidance that no longer matches the installed project. Stale instructions can cause an agent to skip verification or edit nonexistent paths. Fix: apply the ready-to-paste replacements in `context/foundation/stack-assessment.md`, then re-read both files against the current repository.

### Low severity

- **`.editorconfig` is missing** — editors that do not automatically honor Prettier may use inconsistent whitespace or line endings. Fix: add a small `.editorconfig` matching the repository's two-space indentation and final-newline rules. Effort: quick (< 5 min).

Formatting and lint configuration are otherwise present: `.prettierrc.json` defines the Astro and Tailwind plugins, `eslint.config.js` supplies type-aware rules, and package scripts expose linting and formatting commands. Deployment configuration is present in `wrangler.jsonc`.

## Stack Assessment Cross-Reference

Stack assessment: `context/foundation/stack-assessment.md`
Agent readiness from the stack assessment: ready

The stack assessment found no failed stack-quality criteria: strict TypeScript, Astro/React conventions, Vite, and Vitest are all suitable for agent-assisted work. This health check does not overturn that technology assessment. It identifies a current dependency-security problem and instruction drift in the project state.

| Stack-assessment observation | Health-check finding                                                                  | Status      |
| ---------------------------- | ------------------------------------------------------------------------------------- | ----------- |
| Strict TypeScript is active  | Strict preset and type-aware ESLint confirmed; dedicated CI type check is absent      | Locally met |
| Vitest is configured         | Clean full run passes 72/72 tests; CI does not run the suite                          | Locally met |
| Instructions have drifted    | Stale testing, auth-route, and validation statements remain in instruction files      | Reinforced  |
| Stack is ready               | Critical Astro advisory is operational debt, not evidence that the stack choice fails | Compatible  |

## Recommended Fixes

### Fix before agent work (Category A)

### 1. Patch the Astro and Cloudflare dependency paths

**Impact**: The direct Astro dependency is affected by a CVSS 9.8 remote-code-execution advisory, and related transitive packages account for all five high findings. Agents should not build new work on a dependency tree with a known critical issue.
**Severity**: critical
**Effort**: moderate (15–30 min)
**Fix**:

```powershell
npm install astro@7.3.2 @astrojs/cloudflare@14.3.1 --save-exact
npm install wrangler@4.131.0 --save-dev --save-exact
npm audit
npm test
npm run lint
npm run build
```

Review the lockfile diff and confirm that Astro is at least 7.2.8, sharp is at least 0.35.4, js-yaml is at least 4.3.2, and svgo is at least 4.1.0. If any high advisory remains, address its surviving parent dependency separately rather than using a forced major update.

### 2. Reconcile the agent instruction files with the live repository

**Impact**: An agent following the current files can omit the working test suite, target obsolete auth paths, or assume an uninstalled validation library. That makes otherwise healthy tooling less reliable.
**Severity**: medium
**Effort**: moderate (15–30 min)
**Fix**:

Apply the testing and auth replacements already drafted under `Recommended Instruction File Additions` in `context/foundation/stack-assessment.md`. Verify every named path with `rg --files src/pages/api/auth src/pages/auth`, and verify every named package against `package.json` before keeping the rule.

### 3. Plan the TypeScript 7 compatibility upgrade separately

**Impact**: TypeScript is two major versions behind. Agents can still work safely today because strict 5.9 checks pass, but examples and dependency guidance will increasingly assume newer compiler behavior.
**Severity**: medium
**Effort**: significant (> 1 hour)
**Fix**:

Create a dedicated compatibility change. Update TypeScript and its lint ecosystem together, refresh Astro-generated types, then run the full verification set:

```powershell
npm install typescript@7.0.2 --save-dev --save-exact
npx astro sync
npm test
npm run lint
npm run build
```

Resolve peer constraints before committing; do not force installation or combine this with the critical security patch.

### 4. Add an EditorConfig baseline

**Impact**: This is a low-risk consistency improvement for editors and agents that do not automatically apply Prettier on every write.
**Severity**: low
**Effort**: quick (< 5 min)
**Fix**:

Add `.editorconfig` with UTF-8, LF line endings, a final newline, trimmed trailing whitespace, and two-space indentation for source and configuration files. Keep Prettier authoritative where the two overlap.

### Addressed in upcoming lessons (Category B)

### 5. Complete CI verification coverage

**What is missing**: GitHub Actions does not run Vitest, a dedicated type check, or a dependency-security check.
**Why it matters**: Local verification works, but automated pull-request evidence is incomplete and new security advisories will not surface automatically.
**Upcoming work**: Extend `.github/workflows/ci.yml` with `npm test`, `npx astro check`, and an agreed dependency-security policy. Decide whether audit findings should block merges by severity and how temporary advisory exceptions are documented.
**Effort**: upcoming infrastructure and CI/CD work

## Summary

Health status: critical-issues

KeepInTouch has a reproducible npm lockfile, strict TypeScript, complete formatter and linter configuration, a working Vitest suite with 72 passing tests, GitHub Actions, and Cloudflare deployment configuration. The project is not currently safe to treat as healthy because Astro 7.2.4 is directly affected by a critical image-processing advisory and the dependency tree carries five high transitive findings; patch and re-audit these packages before starting the Core Topics implementation.

After the dependency patch, reconcile the stale instruction files and rerun tests, lint, and build. Then handle the TypeScript major upgrade as an isolated compatibility change and complete CI verification coverage during the next infrastructure pass.
