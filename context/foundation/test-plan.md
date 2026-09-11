# Test Plan

> Phased test rollout for this project. Strategy is frozen at the top
> (§1–§5); cookbook patterns at the bottom (§6) fill in as phases ship.
> Read before writing any new test.
>
> Refresh: re-run `/10x-test-plan --refresh` when stale (see §8).
>
> Last updated: 2026-09-11

## 1. Strategy

Tests follow three non-negotiable principles for this project:

1. **Cost × signal.** The cheapest test that gives a real signal for the
   risk wins. Do not promote to e2e because e2e "feels safer." Do not put a
   vision model on top of a deterministic visual diff that already catches
   the regression.
2. **User concerns are first-class evidence.** Risks anchored in "the team
   is worried about X, and the failure would surface somewhere in the
   application" carry the same weight as PRD lines or hot-spot data.
3. **Risks are scenarios, not code locations.** This plan documents _what
   could fail_ and _why we believe it is likely_ — drawn from documents,
   interview, and codebase _signal_ (churn, structure, test base). It does
   NOT claim to know which line owns the failure. That knowledge is
   produced by `/10x-research` during each rollout phase. If the plan and
   research disagree about where the failure lives, research is the ground
   truth.

Hot-spot scope used for likelihood weighting: `src` (hand-written
application code; docs, fixtures, archive, and build output excluded).

## 2. Risk Map

The top failure scenarios are ordered by impact × likelihood. Sources cite
evidence that raised each risk, never a code location where the failure is
assumed to live.

| #   | Risk (failure scenario)                                                                                                                                        | Impact | Likelihood | Source (evidence — not anchor)                                                                                                                     |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | An unauthenticated or different owner can access, impersonate, or see another owner's relationship data.                                                       | High   | Medium     | Interview Q1/Q4; PRD lines 122–147; `src/lib/relationship-data` — 11 commits/30d; `src/pages/api` — 8 commits/30d                                  |
| 2   | A failed or timed-out extraction appears successful or replaces a useful briefing, causing loss of trust.                                                      | High   | High       | Interview Q1/Q2; PRD lines 128–130; archived extraction/Core Topics plans; `src/lib/extraction` — 8 commits/30d; `src/lib/anchors` — 9 commits/30d |
| 3   | Account switching, reloads, or deletion leaks local IndexedDB data across owners or permits late data resurrection.                                            | High   | Medium     | Interview Q3/Q4; PRD lines 124–125; archived local-privacy and lifecycle plans; `src/lib/relationship-data` — 11 commits/30d                       |
| 4   | The extraction boundary forwards prohibited metadata or secrets, leaks personal data through errors/logs, or accepts malformed untrusted input.                | High   | Medium     | PRD lines 128–134; archived private-extraction plan; `src/lib/extraction` and `src/pages/api` hot spots                                            |
| 5   | A valid empty or non-empty extraction clobbers owner-managed topics, exclusions, or source history instead of atomically replacing only the intended snapshot. | High   | Medium     | PRD lines 44–46, 73–75, 128–130; archived Core Topics plans; `src/lib/anchors` and `src/lib/relationship-data` hot spots                           |
| 6   | Changes to the new briefing regress preserved people, dated interactions, passwordless auth, or owner-local behavior.                                          | Medium | Medium     | PRD lines 96–102, 122–125; roadmap lines 59–70, 135–147; `src/components/people`, `src/lib/interactions`, and `src/components/auth` hot spots      |

**Impact × likelihood rubric:** High impact means the user loses access or
data, or the failure is publicly visible. Medium impact means the feature
degrades with a workaround. High likelihood means the area changes often or
has already caused problems; Medium means it is touched occasionally or has
been a source of bugs. Low ratings are reserved for stable, cosmetic,
low-blast-radius behavior.

### Risk Response Guidance

| Risk | What would prove protection                                                                                                                        | Must challenge                                                                      | Context `/10x-research` must ground                                                                              | Likely cheapest layer                                                 | Anti-pattern to avoid                                                      |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| #1   | A signed-out request is denied, and two authenticated owners cannot read or mutate each other's data.                                              | "Authenticated" does not automatically mean "authorized for this resource."         | Auth/session boundary, owner identity propagation, protected routes/API behavior, and browser storage namespace. | Integration plus one browser smoke path                               | Testing only route redirects or only storage helpers                       |
| #2   | Timeout, provider error, malformed response, and cancellation leave the prior briefing unchanged and show a truthful failure state.                | A final HTTP status or caught exception does not prove the local snapshot survived. | Extraction lifecycle, deadline behavior, replacement ordering, and UI pending/error transitions.                 | Contract/integration first; browser only for the user-visible outcome | Happy-path-only extraction or assertions copied from implementation output |
| #3   | Reload, owner switch, person deletion, and late writes never expose or recreate deleted or cross-owner records.                                    | A clean single-owner test does not prove isolation under lifecycle races.           | IndexedDB ownership, deletion transaction, hydration timing, and stale async writes.                             | Storage integration tests, then targeted browser smoke                | Over-mocking IndexedDB or testing only the final rendered list             |
| #4   | Only approved extraction content crosses the boundary; malformed input and provider output produce neutral errors without sensitive leakage.       | A typed client request does not remove the need for server-side validation.         | Outbound payload, headers, logging/error translation, size limits, and provider failure handling.                | Contract tests plus API integration at the network edge               | Testing only valid payloads or asserting provider internals                |
| #5   | Successful empty and non-empty extraction preserves required managed state and source history while replacing only the current generated snapshot. | "Replace all records" is not equivalent to "refresh the current briefing."          | Transaction boundaries, record classification, ordering, empty-result semantics, and deletion races.             | Domain and storage integration tests                                  | Brittle ordering assertions or snapshots that hide data loss               |
| #6   | Existing sign-in, person, interaction, and manual extraction flows still work after briefing changes.                                              | New-feature tests do not protect preserved capabilities automatically.              | Critical user journeys, route/session setup, local persistence contract, and extraction entry point.             | Focused regression integration tests plus a small browser smoke suite | Full browser coverage of every presentational state                        |

## 3. Phased Rollout

Each row is a discrete rollout phase that will open its own change folder
via `/10x-new`. Status moves left-to-right through the fixed vocabulary;
the orchestrator updates Status and Change-folder cells as artifacts land.

| #   | Phase name                         | Goal (one line)                                                                                                                   | Risks covered | Test types                               | Status        | Change folder                                          |
| --- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------- | ------------- | ------------------------------------------------------ |
| 1   | Authenticated ownership smoke      | Prove the critical browser path: session protection plus owner-isolated local data.                                               | #1, #3        | integration + targeted e2e               | change opened | context/changes/testing-authenticated-ownership-smoke/ |
| 2   | Extraction reliability and privacy | Prove truthful failure handling, snapshot preservation, data-minimized requests, and boundary validation.                         | #2, #4        | unit + contract + API integration        | not started   | —                                                      |
| 3   | Atomic local lifecycle regression  | Prove deletion races, managed-topic/exclusion preservation, empty-result replacement, and preserved people/interactions behavior. | #3, #5, #6    | unit + storage integration + focused e2e | not started   | —                                                      |
| 4   | Quality-gate wiring                | Make the proven unit, integration, e2e, lint, and build floor run locally and in CI.                                              | #1–#6         | test/lint/build/CI gates                 | not started   | —                                                      |

AI-native review, visual diffing, and provider-infrastructure testing are not
included. Deterministic behavior tests provide the stronger signal for this
MVP, and Cloudflare/Supabase infrastructure is treated as trusted provider
setup. Only KeepInTouch-owned behavior at those boundaries is in scope.

## 4. Stack

The classic test base is sparse: Vitest is available through `npm test`, 14
focused TypeScript tests exist, and coverage is concentrated in `src/lib`
plus one API test. No dedicated Vitest, Playwright, accessibility, or API
mocking configuration currently exists.

| Layer                   | Tool                   | Version  | Notes                                                                                                    |
| ----------------------- | ---------------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| unit + integration      | Vitest                 | `^5.0.0` | Existing runner and focused domain/API tests; expand by cost × signal.                                   |
| API mocking             | None yet               | —        | Research should mock only the external HTTP edge when needed.                                            |
| e2e                     | None yet — see Phase 1 | —        | Add only the targeted browser path needed for auth plus owner isolation.                                 |
| accessibility           | None yet               | —        | Use semantic assertions in targeted browser tests; no standalone accessibility rollout is justified yet. |
| provider infrastructure | Out of scope           | —        | Cloudflare and Supabase general infrastructure are assumed correctly configured.                         |

**Stack grounding tools (current session):**

- Docs: Context7 unavailable; official Astro testing documentation checked via Exa; checked: 2026-09-11
- Search: Exa.ai available and used for official documentation; checked: 2026-09-11
- Runtime/browser: CUA browser available; Playwright MCP not available in current session; checked: 2026-09-11
- Provider/platform: GitHub tools exposed for future CI inspection; Cloudflare/Supabase provider tools not available in current session; checked: 2026-09-11

## 5. Quality Gates

The application-owned gates below become required through named rollout
phases. Provider infrastructure health and internals are deliberately not
part of these gates.

| Gate                       | Where             | Required?                 | Catches                                                                  |
| -------------------------- | ----------------- | ------------------------- | ------------------------------------------------------------------------ |
| lint + production build    | local + CI        | required now              | syntax, type, framework, and production-build drift                      |
| unit + integration tests   | local + CI        | required after §3 Phase 2 | domain, storage, API-contract, and extraction regressions                |
| critical-flow e2e smoke    | CI on PR          | required after §3 Phase 1 | broken application-owned auth, ownership, and user journeys              |
| application pre-prod smoke | before production | optional after §3 Phase 4 | environment-specific application wiring failures, not provider internals |

## 6. Cookbook Patterns

How to add new tests in this project. Each sub-section is filled in once
the relevant rollout phase ships.

### 6.1 Adding a unit test

- **Location**: next to the domain unit under test in `src/lib/`.
- **Naming**: `<module>.test.ts`.
- **Reference test**: TBD — see §3 Phase 2 for extraction contract behavior.
- **Run locally**: `npm test -- --run <test-file>`.

### 6.2 Adding an integration test

- **Location**: next to the relevant storage or API behavior in `src/`.
- **Mocking policy**: mock only external boundaries; do not mock internal ownership, transaction, or replacement logic.
- **Reference test**: TBD — see §3 Phase 1 for authenticated ownership and §3 Phase 3 for local lifecycle behavior.
- **Run locally**: `npm test -- --run <test-file>`.

### 6.3 Adding an e2e test

- TBD — see §3 Phase 1 for the authenticated owner-isolation smoke pattern.

### 6.4 Adding a test for a new API endpoint

- **Test type**: integration at the application boundary, with contract coverage for input and output.
- **Pattern**: assert request authorization, validation, response shape, and application-owned side effects; mock only external HTTP.
- **Reference test**: TBD — see §3 Phase 2 for extraction boundary coverage.
- **When to add e2e instead**: only when the failure requires the full application path across browser session, route, and handler.

### 6.5 Adding a test for a new content-build rule

- TBD — no active content-build risk is in the current roadmap.

### 6.6 Per-rollout-phase notes

- TBD — each completed phase should record the reusable behavior pattern and any surprising fixture or boundary requirement.

## 7. What We Deliberately Don't Test

These exclusions were agreed during the Phase 2 interview. Re-evaluate them
only if the underlying product scope changes.

- **Deferred features** — do not test roles, recommendations, voice transcription, or background extraction before they enter the active roadmap. (Source: Phase 2 interview Q5.)
- **General Cloudflare/Supabase infrastructure** — trust provider setup and claims; test only KeepInTouch-owned behavior at the integration boundary. (Source: user scope clarification.)
- **Broad semantic-quality scoring for generated wording** — deterministic contract and behavior checks are the cheaper signal for this MVP. (Source: challenger pass and cost × signal principle.)
- **Full browser coverage of every presentational state** — prioritize the authenticated ownership and extraction trust paths. (Source: Phase 2 interview Q5.)

## 8. Freshness Ledger

- Strategy (§1–§5) last reviewed: 2026-09-11
- Stack versions last verified: 2026-09-11
- AI-native tool references last verified: 2026-09-11

Refresh (`/10x-test-plan --refresh`) when:

- a new top-3 risk surfaces from the roadmap or archive,
- a recommended tool's `checked:` date is older than three months,
- the project's tech stack changes, including a new test runner,
- §7 negative space no longer matches what the team believes.
