# Dashboard visual polish — plan brief

**Full plan:** [`plan.md`](plan.md)

## What & Why

The app looks like a basic form because its authenticated experience is narrow and its real features are stacked with little visual distinction. The plan makes the first-run and saved-person screens feel like one intentional relationship workspace, without expanding product scope.

## Starting Point

The app already supports people, Core Topics, and dated interaction history. A concise first-person form is followed by a single-column saved-person view inside a centered `max-w-lg` card.

## Desired End State

The first-run screen places a short workflow introduction beside the existing form. On desktop, the populated dashboard uses a people rail, a profile/actions header, and Core Topics beside interaction history. Mobile stacks these in the same DOM and keyboard order: people, profile/actions, Core Topics, interactions.

## Key Decisions Made

| Decision | Rationale |
| --- | --- |
| Polish the authenticated dashboard only | The public welcome and sign-in screens already have a coherent cosmic identity. |
| Keep all current fields and behavior | Visual complexity should come from revealing real workflow depth, not extra data collection or features. |
| Use only synthetic test data for visual review | Relationship records are private and browser-local. |
| Use responsive layouts and semantic focus states | The current workflow is smartphone-oriented and must remain accessible. |
| Skip visual snapshots and new dependencies | Existing semantic E2E coverage plus a targeted manual visual check provides proportionate signal. |

## Scope

- **In:** dashboard shell; first-run and saved-person layouts; differentiated Core Topics and interaction panels; keyboard focus visibility.
- **Out:** public/auth redesign, product features, data contracts, authentication, storage, API, and generated wording.

## Phases at a Glance

| Phase | Outcome |
| --- | --- |
| 1. Make the authenticated workflow visually legible | Wider dashboard with intentional first-run and distinct saved-person areas. |

## Open Risks & Assumptions

- The authenticated dashboard could not be directly inspected in the deployed browser; review the implementation locally at desktop and mobile sizes.
- The existing cosmic style and concise entry form remain the right product identity.

## Success Criteria (Summary)

- Typecheck, lint, unit/integration, build, and existing E2E pass.
- The first-run and populated layouts read clearly at mobile and desktop widths, with no horizontal overflow.
- Keyboard focus and existing product behaviors remain intact.
