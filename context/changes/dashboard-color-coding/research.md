---
date: 2026-09-13T17:56:00+02:00
researcher: Codex
git_commit: a7db4a617ed8dfb0cc995d88915a14fb744c6b21
branch: main
repository: qstrowy/keep-in-touch
topic: "Make the authenticated dashboard sections easier to distinguish using its existing blue, purple, and cyan palette"
tags: [research, dashboard, color-system, accessibility]
status: complete
last_updated: 2026-09-13
last_updated_by: Codex
---

# Research: Dashboard color coding

- **Date**: 2026-09-13T17:56:00+02:00
- **Researcher**: Codex
- **Git Commit**: `a7db4a617ed8dfb0cc995d88915a14fb744c6b21`
- **Branch**: `main`
- **Repository**: `qstrowy/keep-in-touch`

## Research Question

How can the People, Core Topics, and Interactions sections be more distinct while keeping the current restrained dark dashboard and using only its existing colors?

## Summary

The dashboard already has a coherent blue, purple, cyan, and slate palette, implemented through Tailwind utility classes rather than dashboard-specific design tokens. The People rail leans blue, Core Topics purple, and Interactions cyan, but much of each accent is limited to low-opacity edges, kickers, and icon tiles. The standalone mock shows a suitable next step: strengthen those identities in a small header tint and panel edge/top cue, while leaving the layout, dark surfaces, and neutral body text alone.

The mock's custom hex values are illustrative only. The implementation should reuse existing Tailwind blue, purple, cyan, and slate utilities; it does not need a second stylesheet, global token changes, new packages, or changes to application behavior.

## Detailed Findings

### Existing palette and dashboard shell

- `src/styles/global.css:1-2,75-115` imports Tailwind and defines generic monochrome theme variables plus the `bg-cosmic` gradient. It does not define semantic dashboard accent tokens.
- `src/pages/dashboard.astro:13-18` already layers blue, purple, and cyan ambient color into the cosmic background. Its wordmark, title gradient, sign-out styling, and route guard are outside this change.
- Existing utility classes are the established way the affected components style their surfaces. Keep the established palette instead of copying the mock's standalone hex values into app code.

### People section

- `src/components/people/FirstPersonDashboard.tsx:220-285` owns the saved-people rail, add-person action, and selected-person row. Blue appears in the kicker, add action, focus state, and selected row; the selected row already blends blue and purple.
- `src/components/people/FirstPersonDashboard.tsx:375-417` gives first-run workflow steps blue, purple, and cyan markers. These colors communicate step order and should not be changed as part of the saved-person section treatment.
- `src/components/people/FirstPersonDashboard.tsx:598-650` owns the selected-person profile card, whose surface is nearly neutral with a faint blue wash and blue-to-purple avatar. A clearer blue cue can tie the People rail and profile together without changing their structure.

### Core Topics section

- `src/components/anchors/AnchorBriefing.tsx:354-386` already distinguishes Core Topics with a purple outer wash, icon, kicker, inner generation panel, and purple-to-blue action button.
- Topic rows at `src/components/anchors/AnchorBriefing.tsx:419-427` use mostly neutral white/slate surfaces. A purple header tint and slightly clearer panel edge/top cue would make the section identity easier to recognize without recoloring topic content or its controls wholesale.
- The component also contains distinct loading, empty, populated, editing, exclusion-confirmation, running, and error states. Existing red error and amber exclusion-confirmation treatments have separate meanings and should remain intact.

### Interactions section

- `src/components/interactions/InteractionPanel.tsx:94-115` gives the section a cyan outer wash, icon, and kicker. Cyan also appears in input focus rings, the save action, and interaction dates.
- The form well and saved timeline cards at `src/components/interactions/InteractionPanel.tsx:116-118,191-195` use neutral surfaces, which makes the cyan identity less visible. A lightly tinted header and a more consistent cyan panel edge can carry the existing cue through the section.
- Preserve loading, empty, populated, validation, storage-error, and saving behavior and their current text/status semantics.

## Architecture Insights

- The three relevant surfaces are owned by existing React components: `FirstPersonDashboard.tsx`, `AnchorBriefing.tsx`, and `InteractionPanel.tsx`. Inline Tailwind utilities already define the presentation, so this change can stay within those component class lists.
- Preserve the desktop/mobile composition and DOM order established by the previous dashboard polish. Do not alter person selection, owner-local storage, extraction, interaction capture, validation, or state transitions.
- Keep body-copy contrast, visible focus rings, and semantic color meanings. Blue is the People accent, purple the briefing accent, cyan the interaction accent; red remains for errors and amber for exclusion confirmation.

## Testing and Verification Constraints

- `context/foundation/test-plan.md` prioritizes application-owned behavior and explicitly avoids full browser coverage of every presentational state. This is a presentation change, so use direct desktop/mobile visual review with synthetic data rather than adding screenshot snapshots or class-based tests.
- Run the established quality checks: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`. No new test framework or dependency is warranted.
- Review first-run and populated dashboard states, confirm mobile stacking/no overflow, and check that text and focus indicators remain readable.

## Code References

- [Global theme and cosmic utility](https://github.com/qstrowy/keep-in-touch/blob/a7db4a617ed8dfb0cc995d88915a14fb744c6b21/src/styles/global.css#L1-L2) — generic Tailwind theme; dashboard colors are utility classes.
- [Dashboard background and header](https://github.com/qstrowy/keep-in-touch/blob/a7db4a617ed8dfb0cc995d88915a14fb744c6b21/src/pages/dashboard.astro#L13-L35) — existing ambient color and branded title treatment.
- [People rail and selection](https://github.com/qstrowy/keep-in-touch/blob/a7db4a617ed8dfb0cc995d88915a14fb744c6b21/src/components/people/FirstPersonDashboard.tsx#L220-L285) — blue rail, selected state, and people actions.
- [First-run color sequence](https://github.com/qstrowy/keep-in-touch/blob/a7db4a617ed8dfb0cc995d88915a14fb744c6b21/src/components/people/FirstPersonDashboard.tsx#L375-L417) — blue, purple, and cyan markers already communicate steps.
- [Selected-person profile](https://github.com/qstrowy/keep-in-touch/blob/a7db4a617ed8dfb0cc995d88915a14fb744c6b21/src/components/people/FirstPersonDashboard.tsx#L598-L650) — profile surface and avatar accents.
- [Core Topics panel](https://github.com/qstrowy/keep-in-touch/blob/a7db4a617ed8dfb0cc995d88915a14fb744c6b21/src/components/anchors/AnchorBriefing.tsx#L354-L427) — purple panel and mostly neutral topic cards.
- [Interactions panel](https://github.com/qstrowy/keep-in-touch/blob/a7db4a617ed8dfb0cc995d88915a14fb744c6b21/src/components/interactions/InteractionPanel.tsx#L94-L198) — cyan panel, controls, statuses, and neutral timeline cards.
- [Testing strategy](https://github.com/qstrowy/keep-in-touch/blob/a7db4a617ed8dfb0cc995d88915a14fb744c6b21/context/foundation/test-plan.md#L15-L18) — risk-first testing and no visual diff when deterministic checks do not justify it.

## Historical Context

- `context/changes/dashboard-visual-polish/plan.md` established the responsive workspace layout and kept the authenticated dashboard's existing cosmic identity. That change is complete and pushed; this follow-up is only about making its existing section accents more legible.
- The accepted mock `keepintouch-color-accents-mock.html` in the Codex visualization directory demonstrates the agreed intensity and section mapping. Its hard-coded colors are not app tokens and must not be copied into the implementation.

## Related Research

- `context/changes/dashboard-visual-polish/research.md` — dashboard structure, feature states, and visual testing boundaries.

## Open Questions

- None. The user approved the restrained color-coded direction: blue for People, purple for Core Topics, cyan for Interactions, with the current dark surfaces retained.
