---
project: KeepInTouch
version: 1
status: draft
created: 2026-09-07
updated: 2026-09-09
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
> Items below are listed in dependency order. The At a glance table is the index.

## Milestone

**M-01: First conversation anchor** — Status: open

- **Intent:** Deliver the shortest private flow in which the owner records an interaction and later sees a useful, unresolved conversation anchor. Include the minimum surrounding capabilities needed to use and trust that flow.
- **Source materials:** `context/foundation/prd.md` (v1), supplemented by `context/foundation/tech-stack.md` and the confirmed codebase baseline.
- **Done when:** every F-NN and S-NN below is `done`, and the owner can complete the primary flow while all relationship data remains owner-only.
- **Scope anchors:** US-01, FR-001–FR-008, Non-Functional Requirements, Access Control.

## Vision recap

KeepInTouch helps its owner preserve meaningful details about friends and professional contacts when memories fade between infrequent conversations. It should provide a natural anchor for reconnecting while remaining a private memory aid rather than making relationships feel monitored or catalogued.

## North star

Here, the north star means the smallest end-to-end result that proves the product's central claim.

**S-05: See an extracted conversation anchor in a briefing** — It directly proves the PRD's primary success criterion and is placed as early as its privacy and interaction prerequisites allow.

## At a glance

| ID | Change ID | Outcome (user can …) | Prerequisites | PRD refs | Status |
| --- | --- | --- | --- | --- | --- |
| F-01 | restore-validation-gates | (foundation) repository validation is trustworthy before feature work begins | — | `tech-stack.md` §Why this stack | done |
| F-02 | local-data-privacy-contract | (foundation) the local relationship-data boundary and privacy checks are explicit | — | Non-Functional Requirements, Access Control | done |
| F-03 | private-extraction-contract | (foundation) an extraction service boundary is approved against the note-processing guardrails | F-02 | Non-Functional Requirements, FR-004 | in-progress |
| S-01 | passwordless-private-access | sign in by passwordless email and reach the private application | F-01 | FR-001 | done |
| S-02 | create-first-person | create and view a person with a relationship circle and birthday | F-01, F-02, S-01 | FR-002 | done |
| S-03 | maintain-and-delete-person | edit a person or delete them with all associated relationship data | S-02 | FR-002, Non-Functional Requirements | done |
| S-04 | record-dated-interaction | save a dated free-text interaction for a person | F-01, F-02, S-02 | US-01, FR-003 | done |
| S-05 | extracted-anchor-briefing | see an extracted open topic or follow-up in the person's later briefing | F-01, F-02, F-03, S-04 | US-01, FR-004, FR-007 | blocked |
| S-06 | manage-conversation-anchors | correct, dismiss, or resolve an extracted conversation anchor | S-05 | US-01, FR-005, FR-006 | proposed |
| S-07 | view-upcoming-birthdays | see upcoming birthdays from saved people | S-02 | FR-008 | blocked |

## Streams

Navigation aid — groups items that share a prerequisites chain. Canonical ordering still lives in the dependency graph below; this table is the proposed reading order across parallel tracks.

| Stream | Theme | Chain | Note |
| --- | --- | --- | --- |
| A | Access and people | `F-01` → `S-01` → `S-02` → `S-03` → `S-07` | Restores a safe delivery path, then establishes the people the core flow needs. |
| B | Private interactions | `F-02` → `S-04` → `S-05` → `S-06` | Carries the shortest route from a saved note to a trustworthy reusable anchor. |
| C | External extraction boundary | `F-03` | Joins Stream B at `S-05` once the provider decision is resolved. |

## Baseline

What's already in place in the codebase as of `2026-09-07` (auto-researched and user-confirmed). Foundations below assume present capabilities are not re-scaffolded.

- **Frontend:** partial — starter landing and auth screens plus a placeholder dashboard are wired (`src/pages/index.astro`, `src/pages/dashboard.astro`).
- **Backend / API:** partial — authentication handlers and protected-route middleware exist, but there are no product APIs (`src/pages/api/auth/`, `src/middleware.ts`).
- **Data:** partial — the data service and local tooling are configured, but no application schema, migrations, or seed data exist (`supabase/config.toml`).
- **Auth:** partial — provider sessions and middleware exist, but the current forms use passwords rather than the required passwordless flow (`src/pages/api/auth/`).
- **Deploy / infra:** present — the Cloudflare deployment, protected production and preview routes, and validation CI are established (`wrangler.jsonc`, `.github/workflows/ci.yml`).
- **Observability:** partial — platform observability is enabled, but application-level error and behavior signals are absent (`wrangler.jsonc`).

## Foundations

### F-01: Restore trustworthy validation

- **Outcome:** (foundation) the repository's required lint and production-build checks pass again and can verify every downstream slice.
- **Change ID:** restore-validation-gates
- **PRD refs:** `tech-stack.md` §Why this stack
- **Unlocks:** S-01, S-02, S-04, S-05, and the required verification path for every later slice.
- **Prerequisites:** —
- **Parallel with:** F-02, F-03
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Building features on failing checks would hide regressions and slow every later integration, so the smallest repair comes first.
- **Status:** done

### F-02: Establish the local data privacy contract

- **Outcome:** (foundation) the owner-only local relationship-data boundary, deletion guarantee, and verification rules are explicit before personal data is persisted.
- **Change ID:** local-data-privacy-contract
- **PRD refs:** Non-Functional Requirements, Access Control
- **Unlocks:** S-02, S-03, S-04, S-05, S-06, S-07, and their privacy verification paths.
- **Prerequisites:** —
- **Parallel with:** F-01, S-01
- **Blockers:** —
- **Unknowns:** —
- **Risk:** The current cloud-oriented scaffold does not itself satisfy the local-storage and provider-unreadability promises, so this boundary must be fixed before relationship records are designed.
- **Status:** done

### F-03: Approve a private extraction boundary

- **Outcome:** (foundation) the external extraction boundary has evidence-backed rules for data minimization, retention, training use, and failure handling.
- **Change ID:** private-extraction-contract
- **PRD refs:** Non-Functional Requirements, FR-004
- **Unlocks:** S-05 and the privacy verification path for sending note text outside the application.
- **Prerequisites:** F-02
- **Parallel with:** S-01, S-02, S-03, S-04, S-07
- **Blockers:** —
- **Unknowns:**
  - Which external processor demonstrably meets the PRD's no-retention, no-training, and data-minimization requirements? — Owner: user. Block: yes.
- **Risk:** Choosing a processor during implementation without prior evidence could invalidate the privacy promise at the exact point the central product flow is introduced.
- **Status:** in-progress

## Slices

### S-01: Enter the private application without a password

- **Outcome:** the user can sign in by passwordless email and reach the private application while unauthenticated visitors remain excluded.
- **Change ID:** passwordless-private-access
- **PRD refs:** FR-001
- **Prerequisites:** F-01
- **Parallel with:** F-02, F-03
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Reusing the existing password flow would contradict the product contract; adapting the smallest access path first avoids carrying that mismatch into every screen.
- **Status:** done

### S-02: Create the first person

- **Outcome:** the user can create and view a person with a relationship circle and birthday inside the private application.
- **Change ID:** create-first-person
- **PRD refs:** FR-002
- **Prerequisites:** F-01, F-02, S-01
- **Parallel with:** F-03
- **Blockers:** —
- **Unknowns:** —
- **Risk:** The person record anchors every interaction and briefing, so introducing only the fields required by the PRD keeps later slices connected without broad contact-management scope.
- **Status:** done

### S-03: Maintain or remove a person

- **Outcome:** the user can edit a person's details or delete the person and all associated relationship data immediately.
- **Change ID:** maintain-and-delete-person
- **PRD refs:** FR-002, Non-Functional Requirements
- **Prerequisites:** S-02
- **Parallel with:** F-03, S-04, S-07
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Deletion is a privacy guarantee rather than ordinary polish, so it follows the first persisted person before interactions multiply the associated data.
- **Status:** done

### S-04: Preserve a dated interaction

- **Outcome:** the user can save a dated free-text interaction for a person and see that the original note was preserved.
- **Change ID:** record-dated-interaction
- **PRD refs:** US-01, FR-003
- **Prerequisites:** F-01, F-02, S-02
- **Parallel with:** F-03, S-03, S-07
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Separating reliable note preservation from extraction makes the original user-authored record available even when external processing fails.
- **Status:** done

### S-05: See an extracted conversation anchor in a briefing

- **Outcome:** after saving an interaction, the user can see a relevant open topic or potential follow-up in that person's later briefing alongside recent context.
- **Change ID:** extracted-anchor-briefing
- **PRD refs:** US-01, FR-004, FR-007
- **Prerequisites:** F-01, F-02, F-03, S-04
- **Parallel with:** S-03, S-07
- **Blockers:** —
- **Unknowns:**
  - Which external processor demonstrably meets the PRD's no-retention, no-training, and data-minimization requirements? — Owner: user. Block: yes.
- **Risk:** This is the first slice that proves the product is more useful than a manual journal, but shipping it before the privacy boundary is approved would undermine trust.
- **Status:** blocked

### S-06: Correct and close conversation anchors

- **Outcome:** the user can correct or dismiss an inaccurate extracted item and mark an open topic or follow-up as resolved.
- **Change ID:** manage-conversation-anchors
- **PRD refs:** US-01, FR-005, FR-006
- **Prerequisites:** S-05
- **Parallel with:** S-03, S-07
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Extraction without immediate user control makes errors durable and erodes trust, so the correction and resolution loop follows directly after the first generated anchor.
- **Status:** proposed

### S-07: See upcoming birthdays

- **Outcome:** the user can see which saved people have upcoming birthdays.
- **Change ID:** view-upcoming-birthdays
- **PRD refs:** FR-008
- **Prerequisites:** S-02
- **Parallel with:** F-03, S-03, S-04, S-05, S-06
- **Blockers:** —
- **Unknowns:**
  - What future window counts as "upcoming" for the MVP birthday view? — Owner: user. Block: yes.
- **Risk:** Birthday visibility is required but independent of the main interaction loop; leaving the window undefined would produce arbitrary reminder behavior.
- **Status:** blocked

## Backlog Handoff

| Roadmap ID | Change ID | Suggested issue title | Ready for `/10x-plan` | Notes |
| --- | --- | --- | --- | --- |
| F-01 | restore-validation-gates | Restore trustworthy lint and build validation | yes | Run `/10x-plan restore-validation-gates` |
| F-02 | local-data-privacy-contract | Establish the local relationship-data privacy contract | yes | Run `/10x-plan local-data-privacy-contract` |
| F-03 | private-extraction-contract | Approve a privacy-qualified extraction boundary | no | Resolve the extraction-provider question first |
| S-01 | passwordless-private-access | Let the owner enter the private app without a password | no | Requires F-01 |
| S-02 | create-first-person | Let the owner create the first person | no | Requires F-01, F-02, S-01 |
| S-03 | maintain-and-delete-person | Let the owner maintain or remove a person | no | Requires S-02 |
| S-04 | record-dated-interaction | Let the owner preserve a dated interaction | no | Requires F-01, F-02, S-02 |
| S-05 | extracted-anchor-briefing | Show an extracted conversation anchor in the briefing | no | Requires F-01, F-02, F-03, S-04 and the provider decision |
| S-06 | manage-conversation-anchors | Let the owner correct and close conversation anchors | no | Requires S-05 |
| S-07 | view-upcoming-birthdays | Show upcoming birthdays | no | Requires S-02 and a defined birthday window |

## Open Roadmap Questions

1. **Which external processor demonstrably meets the PRD's no-retention, no-training, and data-minimization requirements?** — Owner: user. Block: F-03, S-05.
2. **What future window counts as "upcoming" for the MVP birthday view?** — Owner: user. Block: S-07.

## Parked

- **Gift suggestions (FR-009)** — Why parked: nice-to-have in the PRD and not required to prove the first conversation-anchor outcome.
- **Encrypted synchronization** — Why parked: the PRD makes synchronized storage optional; this milestone keeps relationship data local and offers no unprotected synchronization.
- **External messaging, professional-network, contact-book, and social-media integrations** — Why parked: explicitly excluded by the PRD's Non-Goals.
- **Automatic messages and advanced relationship coaching** — Why parked: explicitly excluded so the product supports rather than replaces the user's judgment.
- **Native mobile capabilities, voice recognition, and location tracking** — Why parked: the PRD specifies a smartphone-oriented web application instead.
- **Shared workspaces, team roles, and collaboration** — Why parked: the PRD defines one flat, owner-only user role.
- **Contact-frequency scoring and neglected-contact recommendations** — Why parked: outside the primary conversation-anchor flow.

## Milestone History

(Empty — M-01 is the first milestone.)

## Done

- **F-01: (foundation) the repository's required lint and production-build checks pass again and can verify every downstream slice.** — Archived 2026-09-09 → `context/archive/2026-09-07-restore-validation-gates/`. Lesson: —.
- **F-02: (foundation) the owner-only local relationship-data boundary, deletion guarantee, and verification rules are explicit before personal data is persisted.** — Archived 2026-09-09 → `context/archive/2026-09-07-local-data-privacy-contract/`. Lesson: —.
- **S-01: the user can sign in by passwordless email and reach the private application while unauthenticated visitors remain excluded.** — Archived 2026-09-09 → `context/archive/2026-09-07-passwordless-private-access/`. Lesson: —.
- **S-02: the user can create and view a person with a relationship circle and birthday inside the private application.** — Archived 2026-09-09 → `context/archive/2026-09-09-create-first-person/`. Lesson: —.
- **S-03: the user can edit a person's details or delete the person and all associated relationship data immediately.** — Archived 2026-09-09 → `context/archive/2026-09-09-maintain-and-delete-person/`. Lesson: —.
- **S-04: the user can save a dated free-text interaction for a person and see that the original note was preserved.** — Archived 2026-09-09 → `context/archive/2026-09-09-record-dated-interaction/`. Lesson: —.
