# Plan Brief: Dashboard Color Coding

## What & Why

Make the populated dashboard easier to scan by reinforcing the colors already associated with People, Core Topics, and Interactions.

## Starting Point

People uses blue, Core Topics purple, and Interactions cyan, but those accents are mostly limited to labels, icons, buttons, and faint borders. Their larger surfaces are visually close to neutral.

## Desired End State

The three sections are distinguishable at a glance through restrained blue, purple, and cyan header or panel cues. The dark dashboard, neutral content surfaces, responsive layout, and all existing behavior remain the same.

## Key Decisions Made

- Use the existing Tailwind palette; the mock's custom hex values are illustrative only.
- Make styling adjustments in the three owning React components; do not add a stylesheet or global tokens.
- Keep body text and content surfaces mostly neutral and retain red error and amber exclusion meanings.
- Treat this as a presentational change: run existing automated checks and do manual desktop/mobile and state review without adding screenshot tests.

## Scope

In scope: class-list adjustments in `FirstPersonDashboard.tsx`, `AnchorBriefing.tsx`, and `InteractionPanel.tsx`.

Out of scope: layout, behavior, copy, data, first-run step colors, global theme, public auth pages, new dependencies, or a visual regression framework.

## Architecture / Approach

Use the components' existing Tailwind styling to slightly increase accent visibility around their existing headings or panel edges. Keep structure and interaction semantics untouched.

## Phases at a Glance

| Phase | Outcome                                                                                     |
| ----- | ------------------------------------------------------------------------------------------- |
| 1     | Add restrained blue, purple, and cyan cues to the three dashboard sections and verify them. |

## Open Risks & Assumptions

- Opacity should remain low enough to preserve the current elegant dark aesthetic; confirm this during manual desktop/mobile review.
- No interaction or data risk is expected because only utility classes change.

## Success Criteria (Summary)

- `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` pass.
- Desktop/mobile review confirms clearer section identities without overflow or layout changes.
- Text, focus indicators, special states, and existing behavior remain clear.
- The first-run introduction and its step-marker colors remain unchanged.
