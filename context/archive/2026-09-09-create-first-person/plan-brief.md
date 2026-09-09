# Create the first person — Plan Brief

> Full plan: `context/changes/create-first-person/plan.md`

## What & Why

This change gives the authenticated owner the first usable private relationship record: a person with a display name, one relationship circle, and an optional month-and-day birthday. It starts the product's data flow while honoring the existing rule that relationship data stays local to the browser profile and owner.

## Starting Point

Authentication already protects `/dashboard`, but the page is a placeholder. The existing IndexedDB vault provides owner-scoped generic records and cascade deletion, while deliberately leaving person fields and UI to this slice.

## Desired End State

The empty private dashboard lets an owner create a person, then immediately shows that person's summary. Reloading restores the summary from the same owner's browser storage; another signed-in owner cannot see it.

## Key Decisions Made

| Decision | Choice | Why |
| --- | --- | --- |
| Person name | One required display-name field | Supports personal and professional contacts without premature name structure. |
| Relationship circle | Family, Friend, Professional, Other | Fulfils FR-002 with consistent MVP values and no tagging system. |
| Birthday | Optional month and day, no year | Enables later birthday reminders while collecting less personal information. |
| Duplicate names | Allowed | Stable opaque IDs distinguish legitimate people with the same display name. |
| First view | Dashboard form becomes saved-person summary | Completes the create-and-view outcome without premature person routes or a directory. |
| Failure handling | Inline validation, disabled save, retained input | Lets the owner safely fix or retry without losing private text. |
| Verification | Focused Vitest plus manual browser checks | Covers the storage boundary without adding browser-E2E tooling. |

## Scope

**In scope:** typed person data, owner-local IndexedDB persistence, dashboard creation form, saved summary, validation, reload behavior, and owner-isolation tests.

**Out of scope:** editing, deletion, directories, search, interactions, reminders, remote persistence, synchronization, encryption, and product API routes.

## Architecture / Approach

The Astro dashboard passes only the authenticated user ID to a hydrated React island. A pure person module validates form input and creates generic `people` records; the island uses the existing owner-scoped IndexedDB vault to save and restore those records. The generic vault gains only collection lookup through its existing owner index.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Person data and local retrieval | Typed payload, validation, collection lookup | Preserving owner isolation without a schema change. |
| 2. Private dashboard flow | Create form, retry behavior, saved summary | Keeping vault access out of server rendering. |
| 3. End-to-end local proof | Person-to-vault tests and manual verification | Verifying reload and second-owner separation. |

**Prerequisites:** F-01, F-02, and S-01 implementation are complete; their formal roadmap archival remains the next closure task.

## Open Risks & Assumptions

- The browser profile is the MVP trust boundary; clearing it permanently removes person data.
- The first-person screen is intentionally not a multi-person directory; later work owns that broader navigation.

## Success Criteria (Summary)

- An authenticated owner can create and immediately view a valid person with the agreed fields.
- Reloading preserves the person for the same owner but never reveals it to another owner.
- Tests, lint, build, and the local-only privacy boundary remain green with no remote product-data path.
