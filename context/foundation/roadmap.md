---
project: KeepInTouch
version: 1
status: draft
created: 2026-09-07
updated: 2026-09-12
prd_version: 1
main_goal: speed
top_blocker: time
milestone_id: first-conversation-anchor
milestone_seq: 1
milestone_status: open
---

# Roadmap: KeepInTouch

> Derived from `context/foundation/prd.md` (v1), `context/foundation/tech-stack.md`, and the auto-researched codebase baseline.
> Edit in place; archive when superseded.
> Slices below are listed in dependency order. The At a glance table is the index.

## Milestone

**M-01: First conversation anchor** — Status: open

- **Intent:** Replace the overlapping conversation-anchor categories with a concise Core Topics briefing that the owner can understand, adjust, and steer away from unwanted subjects. Preserve the trusted people, interaction, privacy, and manual-extraction behavior around that briefing.
- **Source materials:** `context/foundation/prd.md` (v1), supplemented by `context/foundation/tech-stack.md` and the confirmed codebase baseline.
- **Done when:** every S-NN below is `done`, and the owner can manually produce and manage the Core Topics briefing without regressing the preserved relationship workflow.
- **Scope anchors:** US-01, FR-001–FR-017, Constraints & Compatibility, Access Control Changes.

## Vision recap

KeepInTouch is a private relationship memory aid for capturing imperfect interaction notes and returning to concise context before a later conversation. This milestone simplifies the person screen around one chronological source history and one prominent Core Topics briefing, with optional questions supporting each topic rather than competing as separate categories.

## North star

Here, the north star means the smallest end-to-end result that proves the changed product behavior is useful.

**S-01: See consolidated Core Topics with useful questions** — It directly proves the primary success criterion through the shortest manual extraction-to-briefing flow and is ready to plan against the existing product baseline.

## At a glance

| ID   | Change ID                   | Outcome (user can …)                                                                     | Prerequisites | PRD refs                              | Status |
| ---- | --------------------------- | ---------------------------------------------------------------------------------------- | ------------- | ------------------------------------- | ------ |
| S-01 | consolidated-core-topics    | manually generate one concise Core Topics list and expand grounded follow-up questions   | —             | US-01, FR-002, FR-003, FR-010, FR-011 | done   |
| S-02 | manage-current-core-topics  | edit a Core Topic or hide it from the current briefing with **Not now**                  | S-01          | US-01, FR-004, FR-005, FR-009         | done   |
| S-03 | exclusion-aware-core-topics | confirm **Don't suggest** and regenerate Core Topics with all current exclusions applied | S-01          | US-01, FR-006, FR-008, FR-011         | done   |

## Streams

Navigation aid — groups items that share a Prerequisites chain. Canonical ordering still lives in the dependency graph below; this table is the proposed reading order across parallel tracks.

| Stream | Theme                      | Chain           | Note                                                                 |
| ------ | -------------------------- | --------------- | -------------------------------------------------------------------- |
| A      | Core briefing              | `S-01` → `S-02` | Validates the new briefing first, then adds immediate owner control. |
| B      | Exclusion-aware extraction | `S-03`          | Joins Stream A after `S-01` and can proceed alongside `S-02`.        |

## Baseline

What's already in place in the codebase as of `2026-09-10` (auto-researched and user-confirmed). No new Foundation is needed for the Core Topics slices.

- **Frontend:** present — the declared application frontend and routed person interface are already in place (`context/foundation/tech-stack.md`, `src/pages/dashboard.astro`).
- **Backend / API:** present — authenticated request handling and the manual extraction endpoint are already in place (`src/pages/api/auth/`, `src/pages/api/extractions/anchors.ts`).
- **Data:** partial — owner-local IndexedDB stores people, interactions, and anchors with isolation and cascade tests; no SQL schema or seeded data exists or is required for this owner-local change (`src/lib/relationship-data/local-vault.ts`).
- **Auth:** present — passwordless authentication and protected-route middleware already preserve owner access (`context/foundation/tech-stack.md`, `src/middleware.ts`).
- **Deploy / infra:** present — the declared Cloudflare deployment and GitHub Actions validation path are established (`context/foundation/tech-stack.md`, `.github/workflows/ci.yml`).
- **Observability:** partial — platform observability and development extraction diagnostics exist, without application error tracking, metrics, or analytics (`wrangler.jsonc`, `src/pages/api/extractions/anchors.ts`).

## Foundations

No new Foundation items are justified. The existing product already provides the authenticated manual-extraction path, owner-local relationship storage, privacy boundary, and verification infrastructure required by S-01.

## Slices

### S-01: See consolidated Core Topics with useful questions

- **Outcome:** the user can manually generate one concise list of no more than seven Core Topics and expand each topic to see up to three grounded, non-editable follow-up questions.
- **Change ID:** consolidated-core-topics
- **PRD refs:** US-01, FR-002, FR-003, FR-010, FR-011
- **Prerequisites:** —
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** —
- **Risk:** This slice replaces the current three-category contract while preserving manual extraction, interaction history, owner isolation, and unchanged-briefing failure behavior; validating that coherent end-to-end replacement first gives the fastest product signal.
- **Status:** done

### S-02: Manage topics in the current briefing

- **Outcome:** the user can edit a Core Topic's displayed text or choose **Not now** to remove it from the current view without preventing a later extraction from suggesting it again.
- **Change ID:** manage-current-core-topics
- **PRD refs:** US-01, FR-004, FR-005, FR-009
- **Prerequisites:** S-01
- **Parallel with:** S-03
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Editing and temporary hiding have intentionally session-scoped meaning; keeping them separate from durable exclusion avoids accidentally making owner wording permanent or turning **Not now** into a hidden exclusion.
- **Status:** done

### S-03: Exclude subjects from later Core Topics

- **Outcome:** the user can confirm **Don't suggest**, remove that subject from the briefing, and manually regenerate Core Topics with the complete current exclusion context applied on a best-effort basis.
- **Change ID:** exclusion-aware-core-topics
- **PRD refs:** US-01, FR-006, FR-008, FR-011
- **Prerequisites:** S-01
- **Parallel with:** S-02
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Semantic exclusions cannot be deterministic, so the product must preserve the privacy boundary, set the right expectation, and keep the existing briefing unchanged when regeneration fails.
- **Status:** done

## Backlog Handoff

| Roadmap ID | Change ID                   | Suggested issue title                                            | Ready for `/10x-plan` | Notes                                    |
| ---------- | --------------------------- | ---------------------------------------------------------------- | --------------------- | ---------------------------------------- |
| S-01       | consolidated-core-topics    | Show one consolidated Core Topics briefing with useful questions | yes                   | Run `/10x-plan consolidated-core-topics` |
| S-02       | manage-current-core-topics  | Let the owner edit or temporarily hide a Core Topic              | no                    | Requires S-01                            |
| S-03       | exclusion-aware-core-topics | Keep excluded subjects out of later Core Topics requests         | no                    | Requires S-01                            |

## Open Roadmap Questions

None. The PRD records no question that blocks the Core Topics milestone.

## Parked

- **Cross-device relationship data sync** — Why parked: the MVP intentionally keeps relationship data in the current browser, so signing in on another device or browser does not restore it. Revisit when multi-device continuity becomes a priority; the future outcome is authenticated, owner-only cloud persistence with a safe path for existing local data.
- **Single chronological interaction history (FR-001)** — Why parked: it is explicitly optional under the hard delivery target and does not block the Core Topics proof.
- **Excluded Topics management, interaction deletion, permanent edited wording, and advanced snooze timing (FR-007, FR-016, FR-017)** — Why parked: the PRD defers these lifecycle refinements beyond the first Core Topics implementation.
- **Person Details and optional birth-year enrichment (FR-012)** — Why parked: the PRD assigns profile context to a later product slice with its own grounding and correction decisions.
- **Recommendations and passive recommendation interactions (FR-013, FR-014)** — Why parked: they form a separate product axis and are not required to validate the briefing.
- **Voice capture and transcription (FR-015)** — Why parked: the workflow and owner-review boundary must be reshaped before implementation.
- **Automatic extraction and deterministic semantic exclusion** — Why parked: the PRD preserves deliberate manual extraction and explicitly treats exclusion compliance as best-effort.

## Milestone History

(Empty — M-01 is the first milestone.)

## Done

- **F-01: (foundation) the repository's required lint and production-build checks pass again and can verify every downstream slice.** — Archived 2026-09-09 → `context/archive/2026-09-07-restore-validation-gates/`. Lesson: —.
- **F-02: (foundation) the owner-only local relationship-data boundary, deletion guarantee, and verification rules are explicit before personal data is persisted.** — Archived 2026-09-09 → `context/archive/2026-09-07-local-data-privacy-contract/`. Lesson: —.
- **S-01: the user can sign in by passwordless email and reach the private application while unauthenticated visitors remain excluded.** — Archived 2026-09-09 → `context/archive/2026-09-07-passwordless-private-access/`. Lesson: —.
- **S-02: the user can create and view a person with a relationship circle and birthday inside the private application.** — Archived 2026-09-09 → `context/archive/2026-09-09-create-first-person/`. Lesson: —.
- **S-03: the user can edit a person's details or delete the person and all associated relationship data immediately.** — Archived 2026-09-09 → `context/archive/2026-09-09-maintain-and-delete-person/`. Lesson: —.
- **S-04: the user can save a dated free-text interaction for a person and see that the original note was preserved.** — Archived 2026-09-09 → `context/archive/2026-09-09-record-dated-interaction/`. Lesson: —.
- **F-03: (foundation) the external extraction boundary has evidence-backed rules for data minimization, retention, training use, and failure handling.** — Archived 2026-09-09 → `context/archive/2026-09-09-private-extraction-contract/`. Lesson: —.
- **S-05: after saving an interaction, the user can see a relevant open topic or potential follow-up in that person's later briefing alongside recent context.** — Archived 2026-09-10 → `context/archive/2026-09-09-extracted-anchor-briefing/`. Lesson: —.
- **S-01: the user can manually generate one concise list of no more than seven Core Topics and expand each topic to see up to three grounded, non-editable follow-up questions.** — Archived 2026-09-11 → `context/archive/2026-09-11-consolidated-core-topics/`. Lesson: —.
- **S-02: the user can edit a Core Topic's displayed text or choose Not now to remove it from the current view without preventing a later extraction from suggesting it again.** — Archived 2026-09-11 → `context/archive/2026-09-11-manage-current-core-topics/`. Lesson: —.
- **S-03: the user can confirm Don't suggest, remove that subject from the briefing, and manually regenerate Core Topics with the complete current exclusion context applied on a best-effort basis.** — Archived 2026-09-11 → `context/archive/2026-09-11-exclusion-aware-core-topics/`. Lesson: —.
