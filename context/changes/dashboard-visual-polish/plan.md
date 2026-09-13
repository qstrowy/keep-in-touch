# KeepInTouch dashboard visual polish Implementation Plan

## Overview

Refine the authenticated dashboard so its first-run form and saved-person workspace communicate the real KeepInTouch workflow. Keep the cosmic look and existing product behavior; use layout, hierarchy, and distinct section treatments rather than extra fields or invented data.

## Current State Analysis

The authenticated page is a narrow, centered `max-w-lg` glass card. First-time users see a concise person form. After a person is saved, the people chips, profile, Core Topics, interaction form/history, and management actions render in one vertical flow. The product already has substantial workflow depth, but the current composition does not make it easy to scan.

## Desired End State

The first-run state explains the product path beside the existing entry form. On desktop, the saved-person state uses a people rail on the left and a selected-person workspace on the right; the profile header and actions sit above a two-column content area, with Core Topics as the primary panel and interaction capture/history beside it. On mobile, preserve the reading order: people selector, profile/actions, Core Topics, then interactions. DOM order, visual order, and keyboard order remain aligned. Existing semantics, behavior, data handling, and public/auth pages remain intact.

### Key Discoveries:

- `src/pages/dashboard.astro` constrains the app to a centered `max-w-lg` card.
- `src/components/people/FirstPersonDashboard.tsx` owns the owner-local first-run and saved-person states and composes the feature panels.
- Core Topics and interaction capture/history are independent, real workflows in `AnchorBriefing.tsx` and `InteractionPanel.tsx`.
- The public welcome and sign-in screens already establish the cosmic color language; no new theme or package is needed.
- The test strategy prioritizes semantic journeys and explicitly avoids brittle visual snapshots for presentational states.

## What We're NOT Doing

- No new profile fields, capabilities, sample relationship records, or fabricated content.
- No auth, storage, extraction, API, or roadmap changes.
- No redesign of the public landing or sign-in screens.
- No new package or visual-diff testing framework.

## Implementation Approach

Use the existing Tailwind and React composition to create a wider dashboard shell, a two-column first-run introduction/form, and a desktop saved-person layout with a people rail and main workspace. Keep the profile/actions above a larger Core Topics panel and a narrower interaction panel; at mobile widths stack these in the same DOM and keyboard order. Give each area a distinct but related surface, and add clear keyboard focus styling to controls touched by the redesign.

## Phase 1: Make the authenticated workflow visually legible

### Overview

Recompose the dashboard entry and saved-person states so the current workflow feels like a relationship workspace, while preserving all behavior and the existing visual identity.

### Changes Required:

#### 1. Expand and organize the dashboard shell

**File**: `src/pages/dashboard.astro`

**Intent**: Replace the narrow, vertically centered card with a responsive page shell that has a clearer app header and enough space for the authenticated workflow. Keep sign-out accessible and visually secondary.

**Contract**: Keep the authenticated route guard, page title, React owner ID, and sign-out action unchanged. Retain the current cosmic background and responsive padding.

#### 2. Distinguish first-run and saved-person composition

**File**: `src/components/people/FirstPersonDashboard.tsx`

**Intent**: Place a short, accurate three-step explanation beside the concise first-run form. When people exist, present the actual saved people in a left-side desktop rail and the selected person as the workspace content; put profile/actions above Core Topics and interaction panels.

**Contract**: Preserve state transitions, owner-local reads/writes, people selection, create/edit/delete behavior, form validation, statuses, and privacy disclosure. Do not add persistent fields or fake records. Keep desktop visual order aligned with DOM/keyboard order; on mobile retain the sequence people selector → profile/actions → Core Topics → interactions.

#### 3. Differentiate the briefing and interaction areas

**Files**: `src/components/anchors/AnchorBriefing.tsx`, `src/components/interactions/InteractionPanel.tsx`

**Intent**: Establish visually distinct, related panels for generated Core Topics and dated interaction capture/history, so the two core product activities are recognizable at a glance.

**Contract**: Preserve manual extraction, empty/loading/error states, edit/hide/exclusion actions, dated note behavior, and chronological history. Retain accessible headings, labels, live messages, keyboard operation, and visible focus indicators.

### Success Criteria:

#### Automated Verification:

- Astro/TypeScript validation passes: `npm run typecheck`.
- Lint passes: `npm run lint`.
- Unit and integration tests pass: `npm test`.
- The production Cloudflare build succeeds: `npm run build`.
- Existing browser journeys pass: `npm run e2e`.

#### Manual Verification:

- At desktop width, the first-run introduction sits beside the form; the populated view has a people rail, profile/actions header, and primary Core Topics panel beside the interaction panel. At mobile width these areas stack in people selector → profile/actions → Core Topics → interactions order, with no horizontal overflow.
- Tab through the people selector, form, Core Topics actions, interaction form, and sign-out; focus remains visible and headings/reading order remain clear.
- Confirm sign-in, person CRUD, manual extraction, interaction capture/history, and sign-out retain their current behavior.

## Testing Strategy

### Unit Tests:

- Run the existing suite; no domain behavior or storage contracts change.

### Integration Tests:

- Run the existing suite; no API or owner-boundary behavior changes.

### Manual Testing Steps:

1. Use the local synthetic E2E session and a fresh browser context; do not use real relationship records.
2. Inspect first-run and populated states at a narrow mobile viewport and a wide desktop viewport.
3. Keyboard-navigate all changed controls and verify focus, labels, statuses, error states, and page reading order.

## Performance Considerations

The change is presentational and uses existing dependencies; it adds no network calls, client-side data, or new runtime package.

## Migration Notes

None. Existing records and browser-local storage are unchanged.

## References

- Frame: `context/changes/dashboard-visual-polish/frame.md`
- Research: `context/changes/dashboard-visual-polish/research.md`
- Similar visual language: `src/components/Welcome.astro`, `src/pages/auth/signin.astro`
- Test boundaries: `context/foundation/test-plan.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Make the authenticated workflow visually legible

#### Automated

- [x] 1.1 Astro/TypeScript validation passes
- [x] 1.2 Lint passes
- [x] 1.3 Unit and integration tests pass
- [x] 1.4 Production build succeeds
- [x] 1.5 Existing browser journeys pass

#### Manual

- [x] 1.6 Desktop/mobile and keyboard review passes with synthetic data
- [x] 1.7 Existing sign-in, person, topic, interaction, and sign-out behavior remains intact
