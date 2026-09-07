# Restore Validation Gates Implementation Plan

## Overview

Restore trustworthy local and CI validation by reconciling the developer environment with the repository's pinned Node and dependency versions, then removing the remaining Astro parser compatibility noise. The change preserves application behavior, dependency selections, Cloudflare resources, and the deployed Worker.

## Current State Analysis

The tracked manifest and lockfile target Node 22.23.2, Astro 7.2.4, the Cloudflare adapter 14.2.3, and Supabase SSR 0.12.4. The current local shell instead runs Node 24.11.1 with an invalid, stale dependency tree containing Astro 6.3.1, the Cloudflare adapter 13.5.0, and Supabase SSR 0.10.3. Those stale packages reject the valid Astro 7 `session: false` configuration and expose older Supabase cookie types, producing misleading build and lint failures.

The locked `astro-eslint-parser` still does not support TypeScript's `projectService` option. Once the environment is reconciled, lint is expected to pass but continue printing one compatibility notice per Astro file unless the Astro-specific flat configuration explicitly selects the parser's supported project mode.

## Desired End State

A developer using Node 22.23.2 can install exactly from `package-lock.json`, regenerate Astro types, and run lint and production build successfully. Lint output is free of the repeated `projectService` compatibility notices, and a freshly generated Worker configuration contains the expected Assets binding but no KV, `SESSION`, or Images binding. No deployment occurs and no product behavior changes.

### Key Discoveries

- `.nvmrc:1` pins Node 22.23.2, and `.github/workflows/ci.yml:13-21` already installs from the lockfile and runs sync, lint, and build under that version.
- `package.json:15-25` and matching lockfile entries pin the upgraded Astro, adapter, and Supabase packages, while `npm ls` reports the current installation as invalid against those requirements.
- `astro.config.mjs:15-16` intentionally combines compile-time images with `session: false`; under Astro 7 and the Cloudflare adapter 14 this prevents automatic Images and session KV bindings.
- `src/lib/supabase.ts:9-22` already uses the modern `getAll` and `setAll` cookie contract; the observed lint errors come from stale Supabase types and stale generated environment declarations.
- `eslint.config.js:14-20` applies `projectService: true` globally, while the Astro-specific override at `eslint.config.js:62-69` currently does not replace that unsupported parser option.
- `.astro/`, `dist/`, and `node_modules/` are ignored, so a clean Git status does not prove that local generated artifacts or installed packages match the tracked configuration.

## What We're NOT Doing

- Upgrading, downgrading, or repinning Node, npm packages, or the lockfile.
- Removing `session: false`, changing the image service, adding Cloudflare bindings, or modifying Worker configuration.
- Changing `src/lib/supabase.ts`, suppressing lint rules, adding casts, or redesigning authentication.
- Adding a test framework, `astro check`, new package scripts, or new CI jobs.
- Running `npm audit` remediation as part of this non-release change.
- Uploading a preview, deploying, rolling back, or otherwise changing Cloudflare production state.
- Committing ignored `node_modules`, `.astro`, `dist`, or `.wrangler` output.

## Implementation Approach

Treat the lockfile and `.nvmrc` as the source of truth. Establish the exact runtime and clean dependency baseline before interpreting any diagnostic. After regenerated types prove that the stale Supabase errors are gone, make one narrow Astro-only ESLint configuration adjustment to select the parser mode it already falls back to. Finish by rerunning the repository gates and parsing a fresh generated Worker configuration to protect the no-KV/no-Images deployment contract.

## Critical Implementation Details

### Configuration ordering

Keep the Astro-specific override after the Astro recommended and accessibility presets in the exported flat-config array so its parser options win. Retain type-aware linting for Astro files; do not exclude them from the shared strict TypeScript configuration.

### Generated-artifact freshness

The current ignored `dist/server/wrangler.json` is stale and contains obsolete `SESSION` and Images bindings. Record the build start time and require the inspected file to have been generated at or after that time; otherwise the binding assertion could validate an unrelated old build.

### Failure boundary

If clean install and type generation leave either Supabase lint error or the Astro configuration error, stop and capture the new locked-environment diagnostic as fresh scope. Do not remove `session: false`, normalize cookie values, cast types, or disable rules as speculative workarounds.

## Phase 1: Reconcile the Pinned Environment

### Overview

Make the documented Node runtime available, replace the invalid installed dependency tree from the lockfile, and regenerate framework types before changing tracked source.

### Changes Required

#### 1. Local runtime prerequisite

**File**: `.nvmrc`

**Intent**: Use the repository's existing Node version as an execution prerequisite without changing the pin or adding a version-manager policy to the repository.

**Contract**: The active terminal reports exactly `v22.23.2` before dependency installation. Because no supported version manager is currently installed, making that runtime available is a human/system prerequisite rather than a repository change.

#### 2. Locked dependency installation

**Files**: `package.json`, `package-lock.json`, `node_modules/`

**Intent**: Replace the stale ignored installation with the exact locked graph used by CI while proving that the manifests themselves remain unchanged.

**Contract**: Use `npm ci`, never `npm install`. The direct versions of Astro, its adapters/checker, Supabase SSR/client, and Wrangler must match the manifest and `npm ls --depth=0` must report no invalid or extraneous direct dependencies. `package.json` and `package-lock.json` remain byte-for-byte unchanged.

#### 3. Generated Astro environment types

**Files**: `astro.config.mjs`, `.astro/env.d.ts`

**Intent**: Regenerate ignored framework types using the correct Astro version so lint evaluates the current secret names and configuration contract.

**Contract**: Run `npx astro sync` only after `npm ci`. The generated server environment module exports `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`; it must not retain the obsolete `SUPABASE_KEY` name.

### Success Criteria

#### Automated Verification

- `node --version` prints exactly `v22.23.2`, and `npm --version` exits successfully.
- `npm ci` and the direct-package `npm ls --depth=0` check exit successfully with versions matching `package.json` and `package-lock.json`.
- `npx astro sync` exits successfully, generated environment types expose both current Supabase names, and `git diff -- package.json package-lock.json` is empty.

#### Manual Verification

- Confirm the active terminal was restarted or refreshed after making Node 22.23.2 available and that no tracked source/configuration workaround was made before the clean baseline.

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation before proceeding to Phase 2.

---

## Phase 2: Restore Clean Lint Output

### Overview

Prove that the stale Supabase diagnostics disappear under the locked graph, then remove only the persistent Astro parser compatibility notices without weakening typed lint coverage.

### Changes Required

#### 1. Clean-baseline lint diagnosis

**Files**: `src/lib/supabase.ts`, `.astro/env.d.ts`

**Intent**: Re-run lint before editing configuration and distinguish resolved stale-type failures from any genuine locked-environment defect.

**Contract**: The prior `no-deprecated` and `no-unsafe-argument` failures at `src/lib/supabase.ts:9` must disappear with the locked Supabase types and regenerated environment module. If either remains, stop this phase and revalidate installed versions and generated names; do not change this source file within the approved scope.

#### 2. Astro-specific parser mode

**File**: `eslint.config.js`

**Intent**: Eliminate repeated compatibility notices by explicitly selecting the project mode supported by `astro-eslint-parser`, while retaining project-service behavior for ordinary TypeScript and React files.

**Contract**: Extend the existing `files: ["**/*.astro"]` configuration with parser options `project: true`, `projectService: false`, and the repository root as `tsconfigRootDir`. Preserve its position after the Astro recommended/accessibility presets and leave shared rules and other file types unchanged.

### Success Criteria

#### Automated Verification

- The clean-baseline lint run has no Supabase source errors, and `git diff -- src/lib/supabase.ts` remains empty.
- `npx eslint --print-config src/pages/index.astro` reflects the supported Astro parser project settings without removing the TypeScript parser delegate or typed rules.
- `npm run lint` exits zero with no ESLint findings and no `astro-eslint-parser ... projectService` compatibility notices in its output.

#### Manual Verification

- Review the lint output once to confirm it is quiet and high-signal rather than filtered, suppressed, or made green by disabling rules.

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation before proceeding to Phase 3.

---

## Phase 3: Verify the Validation and Worker Contracts

### Overview

Run the complete local gate sequence, verify fresh Cloudflare output structurally, and hand the change to existing CI without uploading or deploying anything.

### Changes Required

#### 1. Repository validation sequence

**Files**: `.github/workflows/ci.yml`, repository source and configuration

**Intent**: Exercise the same sync, lint, and build sequence that protects `main`, under the same Node version and locked dependency graph.

**Contract**: Existing CI configuration remains unchanged. Locally run `npx astro sync`, `npm run lint`, and `npm run build` in that order after the clean install; every command exits zero.

#### 2. Generated Worker binding assertion

**Files**: `astro.config.mjs`, `wrangler.jsonc`, `dist/server/wrangler.json`

**Intent**: Prove that the newly generated Worker preserves the infrastructure release's Assets-only resource contract.

**Contract**: Capture the build start time, require `dist/server/wrangler.json` to be newer, parse it as JSON, and assert that top-level and preview KV namespace collections are absent or empty and top-level and preview Images bindings are absent. The Assets binding remains present. This is an inspection of ignored output, not a tracked-file change.

```powershell
$generated = Get-Content -LiteralPath "dist/server/wrangler.json" -Raw | ConvertFrom-Json
$kvBindings = @($generated.kv_namespaces) + @($generated.previews.kv_namespaces)
if ($kvBindings.Count -gt 0) { throw "Generated Worker config contains a KV binding." }
if ($generated.images -or $generated.previews.images) { throw "Generated Worker config contains an Images binding." }
if (-not $generated.assets) { throw "Generated Worker config is missing the Assets binding." }
```

#### 3. Scope and CI handoff

**Files**: `package.json`, `package-lock.json`, `.nvmrc`, `.github/workflows/ci.yml`, `wrangler.jsonc`

**Intent**: Confirm the repair did not drift the pinned toolchain or deployment contract and let existing GitHub CI provide the independent Node 22 run.

**Contract**: These files remain unchanged. Do not run Wrangler upload/deploy commands. After the implementation commit is pushed, the existing GitHub Actions job must pass.

### Success Criteria

#### Automated Verification

- `npx astro sync`, `npm run lint`, and `npm run build` all exit zero under Node 22.23.2 after `npm ci`.
- A freshly generated `dist/server/wrangler.json` contains Assets and contains no top-level or preview KV/`SESSION` or Images binding.
- `git diff --exit-code -- package.json package-lock.json .nvmrc .github/workflows/ci.yml wrangler.jsonc astro.config.mjs src/lib/supabase.ts` exits zero.

#### Manual Verification

- Confirm the GitHub Actions CI job passes after push and that no preview upload, production deployment, rollback, or Cloudflare resource mutation occurred.

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation before considering the change implemented.

## Testing Strategy

### Unit Tests

- No unit-test framework is introduced because this change alters no product logic.
- Use the effective ESLint configuration inspection as the focused configuration test for the Astro parser override.

### Integration Tests

- Treat the clean-install `astro sync` → lint → production-build sequence as the repository integration test.
- Parse the generated Worker metadata to verify the adapter/configuration interaction rather than relying on source inspection alone.
- Require existing GitHub CI to repeat the locked sequence independently.

### Manual Testing Steps

1. Activate Node 22.23.2 in a fresh terminal and confirm its version.
2. Review the clean lint output for absence of both errors and parser notices.
3. Confirm the GitHub Actions result after push.
4. Confirm no Cloudflare deployment activity was initiated for this change.

## Performance Considerations

The change does not alter runtime code or request handling. Validation may take longer because it intentionally performs a clean dependency install and production build; no optimization should bypass those reproducibility checks.

## Migration Notes

There is no data, API, resource, or deployment migration. Rollback before merge is limited to the ESLint configuration diff; after merge, use `git revert` on the implementation commit. Reverting restores noisy validation but does not require a Worker rollback because this plan performs no deployment.

## References

- Roadmap item: `context/foundation/roadmap.md` — F-01 / `restore-validation-gates`
- Change identity: `context/changes/restore-validation-gates/change.md`
- Runtime pin: `.nvmrc:1`
- CI sequence: `.github/workflows/ci.yml:13-21`
- Validation configuration: `eslint.config.js:14-20`, `eslint.config.js:62-69`
- Astro resource contract: `astro.config.mjs:15-16`, `wrangler.jsonc:1-20`
- Supabase server-client contract: `src/lib/supabase.ts:1-23`
- Infrastructure verification record: `context/deployment/deploy-plan.md:13-23`, `context/deployment/deploy-plan.md:48-58`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Reconcile the Pinned Environment

#### Automated

- [x] 1.1 Confirm the active Node and npm runtime — fb84863
- [x] 1.2 Install and verify the exact locked dependency graph — fb84863
- [x] 1.3 Regenerate Astro environment types without manifest drift — fb84863

#### Manual

- [x] 1.4 Confirm the clean baseline preceded any tracked workaround — fb84863

### Phase 2: Restore Clean Lint Output

#### Automated

- [x] 2.1 Confirm the stale Supabase lint diagnostics disappear without source changes
- [x] 2.2 Verify the effective Astro parser configuration retains typed linting
- [x] 2.3 Run lint with no findings or parser compatibility notices

#### Manual

- [x] 2.4 Confirm lint cleanliness comes from configuration rather than suppression

### Phase 3: Verify the Validation and Worker Contracts

#### Automated

- [ ] 3.1 Pass the complete local sync, lint, and production-build sequence
- [ ] 3.2 Verify the fresh Worker output has Assets and no KV or Images bindings
- [ ] 3.3 Confirm pinned toolchain, deployment configuration, and protected source files remain unchanged

#### Manual

- [ ] 3.4 Confirm GitHub CI passes and no deployment or Cloudflare mutation occurred
