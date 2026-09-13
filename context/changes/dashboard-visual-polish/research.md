---
date: 2026-09-13T13:53:25+02:00
researcher: Codex
git_commit: b847ba20cfe39947b1479c441e932ef6f7d2783e
branch: main
repository: qstrowy/keep-in-touch
topic: "What makes the authenticated app read as flat/simple CRUD, and how can a focused visual pass better show its current workflow?"
tags: [research, dashboard, visual-design, accessibility, e2e]
status: complete
last_updated: 2026-09-13
last_updated_by: Codex
---

# Research: KeepInTouch dashboard visual polish

- **Date**: 2026-09-13T13:53:25+02:00
- **Researcher**: Codex
- **Git Commit**: `b847ba20cfe39947b1479c441e932ef6f7d2783e`
- **Branch**: `main`
- **Repository**: `qstrowy/keep-in-touch`

## Research Question

What makes the authenticated app read as flat/simple CRUD, and where can a focused visual pass make its existing workflow more evident for the 10xBuilder submission?

## Summary

The three-field entry form is intentionally simple, but it is not the whole product. Once a person exists, KeepInTouch offers a people selector, profile details, manual Core Topics generation and management, dated interaction capture, and a chronological interaction list. The dashboard currently presents the form or all saved-person tools in one narrow, centered glass card; its feature sections also share similar borders and translucent fills. This makes the post-login application feel less substantial than its actual capabilities.

The focused opportunity is the authenticated dashboard: keep the public welcome and sign-in screens, concise fields, owner-local storage, and extraction behavior intact; use page width, clearer grouping, and distinct visual emphasis to show the path from person to briefing to interaction history. Preserve a single-column reading order on small screens. Do not add fields or invent sample user data just to create visual volume.

## Detailed Findings

### Authenticated page composition

- `src/pages/dashboard.astro:13-22` centers the dashboard vertically and horizontally inside a `max-w-lg` translucent card. This caps the space available for distinct navigation and feature regions.
- The page heading and one-sentence description communicate the product, while sign-out appears after the complete application content. The shell does not provide a strong app-level header or separate dashboard regions.
- The public welcome and sign-in views already have a more composed visual treatment. The landing page uses layered gradient orbs and a star field (`src/components/Welcome.astro:5-46`); sign-in uses the same cosmic background and glass card (`src/pages/auth/signin.astro:9-33`). Preserve this visual identity and make the authenticated area feel like its intended continuation.

### First-person and saved-person states

- `src/components/people/FirstPersonDashboard.tsx:31-57` loads owner-scoped people from the local relationship vault and starts in the form when none exist; with saved people, it selects the first and shows its summary.
- The entry form has name, relationship circle, and optional birthday (`FirstPersonDashboard.tsx:322-430`). It also discloses browser-local storage. Its small field count fits the product and should not be padded with invented data or speculative profile fields.
- With saved records, people are exposed as wrapping text chips (`FirstPersonDashboard.tsx:221-245`). The selected person’s profile, Core Topics, interaction entry/history, and management actions render in one sequence (`FirstPersonDashboard.tsx:490-555`). The feature depth is present, but the composition does little to distinguish each job.
- The first-run form can dominate the impression when the owner has no saved records. The source can establish this state transition, but the deployed dashboard could not be visually inspected during research because the browser reached the public sign-in gate.

### Core Topics and interaction presentation

- `src/components/anchors/AnchorBriefing.tsx:354-412` exposes Core Topics, explicit generation, loading and empty states, and generated topic cards. Existing topic controls and error messages are meaningful user behavior; visual work must preserve them and keep extraction manual.
- `src/components/interactions/InteractionPanel.tsx:94-174` combines the dated-note form with loading/empty states and the saved chronological list. It is a second primary product axis and should read clearly beside or after the briefing, not disappear beneath one undifferentiated card.
- Current controls already use semantic headings and labels, and dynamic statuses/errors use accessible roles. Keyboard focus treatment is inconsistent across custom controls; any redesigned buttons and fields should make `focus-visible` states easy to see.

### Testing and verification constraints

- `context/foundation/test-plan.md` records six Playwright tests across five spec files, 91 unit/integration tests, and required typecheck, lint, unit, build, and E2E gates.
- The test plan explicitly excludes visual-diff snapshots and exhaustive browser coverage of presentational states. For this UI-only change, retain existing semantic journey coverage and perform a targeted manual check at narrow/mobile and desktop widths instead of adding brittle class-based assertions or a new visual testing system.
- `tests/e2e/seed.spec.ts` is the project’s representative browser flow, using accessible selectors, unique data, and cleanup. If the changed structure affects its flow, update only the necessary assertions.
- CI runs `npm ci`, Astro sync, typecheck, lint, Vitest, production build, Playwright browser install, and E2E (`.github/workflows/ci.yml`).

## Code References

- [Dashboard shell](https://github.com/qstrowy/keep-in-touch/blob/b847ba20cfe39947b1479c441e932ef6f7d2783e/src/pages/dashboard.astro#L13-L22) — narrow, centered authenticated layout.
- [People state and selection](https://github.com/qstrowy/keep-in-touch/blob/b847ba20cfe39947b1479c441e932ef6f7d2783e/src/components/people/FirstPersonDashboard.tsx#L31-L57) — owner-local load and first-run/selected-person state.
- [Entry form](https://github.com/qstrowy/keep-in-touch/blob/b847ba20cfe39947b1479c441e932ef6f7d2783e/src/components/people/FirstPersonDashboard.tsx#L322-L430) — concise person setup and browser-local disclosure.
- [Saved person composition](https://github.com/qstrowy/keep-in-touch/blob/b847ba20cfe39947b1479c441e932ef6f7d2783e/src/components/people/FirstPersonDashboard.tsx#L490-L555) — profile, Core Topics, interactions, and actions.
- [Core Topics](https://github.com/qstrowy/keep-in-touch/blob/b847ba20cfe39947b1479c441e932ef6f7d2783e/src/components/anchors/AnchorBriefing.tsx#L354-L412) — manual briefing and topic-card states.
- [Interaction workflow](https://github.com/qstrowy/keep-in-touch/blob/b847ba20cfe39947b1479c441e932ef6f7d2783e/src/components/interactions/InteractionPanel.tsx#L94-L174) — dated note capture and history.
- [Test plan](https://github.com/qstrowy/keep-in-touch/blob/b847ba20cfe39947b1479c441e932ef6f7d2783e/context/foundation/test-plan.md) — required gates and presentation-test boundaries.

## Architecture Insights

- Keep relationship data in the browser’s owner-scoped vault; this request does not justify persistence, schema, or extraction changes.
- Keep model extraction an explicit owner action. A redesigned empty state or Core Topics panel must not imply automatic generation.
- Treat the interaction list as source history and the Core Topics panel as generated context. Their visual grouping can differ without changing their underlying contract.
- Use responsive CSS/layout only for the presentation change: desktop can expose clearer parallel regions, while mobile must retain meaningful reading order and usable actions.
- Use existing icon dependency (`lucide-react`) only if an icon materially improves recognition; no new packages are required.

## Historical Context (from prior changes)

- `context/archive/2026-09-09-create-first-person/plan.md` kept first-person creation minimal to validate the local storage path.
- `context/archive/2026-09-11-consolidated-core-topics/plan.md` and `context/foundation/roadmap.md` establish Core Topics as the main conversation-preparation feature, with the people/interaction workflow preserved.
- The roadmap marks current functional slices complete; this is a presentation change rather than a new product slice.

## Related Research

- `context/changes/dashboard-visual-polish/frame.md` — separates the user’s observation from the implementation framing.

## Open Questions

- Exact visual emphasis is a design choice for planning. The evidence supports a more spacious dashboard with clearer people/profile, Core Topics, and interaction regions, while retaining the existing cosmic palette.
- A signed-in manual visual comparison is still needed during implementation review; use the local synthetic E2E owner/data path rather than exposing real relationship content.
