# Dashboard Color Coding Implementation Plan

## Overview

Strengthen the blue, purple, and cyan identities of the People, Core Topics, and Interactions areas so they are easier to scan in the existing dark dashboard. Use only the existing Tailwind palette and component styling; preserve layout and behavior.

## Current State Analysis

The saved-person dashboard already uses blue for the People rail and profile, purple for Core Topics, and cyan for Interactions. The associations are currently expressed through small labels, icons, buttons, and faint outer washes; the larger section surfaces and content wells remain close to neutral. The three areas are implemented in independent React components with inline Tailwind class lists. The first-run workflow also uses blue, purple, and cyan markers to show step order, so those markers should remain unchanged.

## Desired End State

In the populated dashboard, People reads as blue, Core Topics as purple, and Interactions as cyan at a glance. Each section has a slightly clearer accent in its existing header or panel edge, while the dark background, neutral body surfaces, readable body text, responsive layout, and current interaction states remain intact. The first-run workflow and application behavior are unchanged.

### Key Discoveries:

- `FirstPersonDashboard.tsx` owns the saved People rail and selected-person profile; both already use blue accents.
- `AnchorBriefing.tsx` owns Core Topics, which already uses a purple outer wash but mostly neutral topic rows.
- `InteractionPanel.tsx` owns Interactions, which already uses cyan in its header and controls but mostly neutral form and timeline surfaces.
- Dashboard appearance is composed with Tailwind classes in these components; there are no semantic dashboard color tokens in `global.css`.
- The approved mock uses stronger section cues; its sample hex values are illustrative and should not be copied into the app.

## What We're NOT Doing

- No layout, typography-scale, content, interaction, data, or state-flow changes.
- No changes to the first-run step markers, the public welcome/sign-in screens, global theme tokens, or the cosmic background.
- No new stylesheet, package, custom color values, visual snapshot suite, or broad E2E coverage.
- No changes to red error or amber exclusion-confirmation states.

## Implementation Approach

Adjust the existing class lists in the three section components. Use slightly clearer existing blue, purple, and cyan border/surface utilities around each section heading or outer edge. Keep the interiors and body text predominantly neutral so the treatment remains restrained. Preserve all current focus rings and state-specific colors. Do not add abstractions for these one-off component styles.

## Critical Implementation Details

- Keep all text contrast and visible keyboard focus at least as clear as the current styling.
- Preserve `aria-labelledby`, headings, `aria-pressed`, form labels, live/error messages, and the existing DOM and responsive order.
- Avoid applying the section accent to destructive actions, errors, exclusions, or first-run workflow step colors.
- Reuse only existing Tailwind blue, purple, cyan, white, and slate utilities; do not copy mock hex codes.

## Phase 1: Add restrained color cues to dashboard sections

### Overview

Make the three populated dashboard areas more distinguishable using their existing accents without changing structure or behavior.

### Changes Required:

#### 1. Strengthen the People identity

**File**: `src/components/people/FirstPersonDashboard.tsx`

**Intent**: Clarify the existing blue identity in the saved-person rail and selected-person profile using a subtle header/surface cue and a slightly more legible panel edge.

**Contract**: Preserve people selection, creation/edit/delete actions, owner-local data behavior, existing focus indicators, and the first-run flow and its step markers.

#### 2. Strengthen the Core Topics identity

**File**: `src/components/anchors/AnchorBriefing.tsx`

**Intent**: Make the existing purple section identity more visible in its heading and panel framing, while leaving generated topic content mostly neutral.

**Contract**: Preserve generation, edit, hide, exclusion, loading, empty, and error states. Keep red error and amber exclusion-confirmation styling distinct.

#### 3. Strengthen the Interactions identity

**File**: `src/components/interactions/InteractionPanel.tsx`

**Intent**: Make the existing cyan identity more visible around the section heading and panel framing, while keeping the form and timeline readable on dark neutral surfaces.

**Contract**: Preserve dated note capture, validation, storage errors, saving/loading states, empty state, and chronological history.

### Success Criteria:

#### Automated Verification:

- Astro/TypeScript validation passes: `npm run typecheck`.
- Lint passes: `npm run lint`.
- Unit and integration tests pass: `npm test`.
- The production Cloudflare build succeeds: `npm run build`.

#### Manual Verification:

- At desktop and mobile widths, the saved-person People, Core Topics, and Interactions sections are easier to distinguish by blue, purple, and cyan cues, with no overflow or layout changes.
- Text, keyboard focus, error/exclusion states, and populated/empty section states remain clear and retain their current behavior.
- The first-run introduction and its blue, purple, and cyan step markers remain visually unchanged.

## Testing Strategy

### Unit Tests:

- Run the existing Vitest suite; the change does not alter business logic or data contracts.

### Integration Tests:

- Covered by the existing full `npm test` suite; no new application behavior or boundary is introduced.

### Manual Testing Steps:

1. Use the local synthetic E2E session and synthetic records only.
2. Inspect the populated dashboard at desktop and mobile widths and compare the three section identities; verify no horizontal overflow or layout shift.
3. Inspect empty and populated Core Topics and Interactions states, error/exclusion cues, and keyboard focus visibility.
4. Inspect the first-run introduction and verify its existing blue, purple, and cyan step markers remain unchanged.

## Performance Considerations

This is a CSS-only visual adjustment using existing utilities. It adds no runtime work, dependencies, or network requests.

## Migration Notes

None. Existing records, user flows, and stored data are unchanged.

## References

- Research: `context/changes/dashboard-color-coding/research.md`
- Existing dashboard layout: `context/changes/dashboard-visual-polish/plan.md`
- Testing boundaries: `context/foundation/test-plan.md`
- People rail and profile: `src/components/people/FirstPersonDashboard.tsx`
- Core Topics: `src/components/anchors/AnchorBriefing.tsx`
- Interactions: `src/components/interactions/InteractionPanel.tsx`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Add restrained color cues to dashboard sections

#### Automated

- [x] 1.1 Astro/TypeScript validation passes — 5f9526e
- [x] 1.2 Lint passes — 5f9526e
- [x] 1.3 Unit and integration tests pass — 5f9526e
- [x] 1.4 Production build succeeds — 5f9526e

#### Manual

- [x] 1.5 Desktop/mobile color distinction and layout review passes — 5f9526e
- [x] 1.6 State, contrast, focus, and existing behavior review passes — 5f9526e
- [x] 1.7 First-run step markers remain visually unchanged — 5f9526e
