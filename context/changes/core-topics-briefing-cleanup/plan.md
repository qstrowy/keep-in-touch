# Core Topics Briefing Cleanup Implementation Plan

## Overview

Remove the unintended Recent context section from the person briefing so Core Topics are the only briefing list shown
below the generation controls. Keep the existing topic snapshot, interaction loading, extraction flow, and topic
management behavior unchanged.

## Current State Analysis

`AnchorBriefing` loads interactions and Core Topics independently. Interactions remain necessary for extraction,
Last contact, and generation availability, while `topics` is classified from stored records and updated separately after
extraction or topic mutations.

The component currently derives `recentInteractions` and renders a Recent context block before the existing Core Topics
branch. `getRecentInteractions` has no production consumer outside that block and only has an obsolete unit test. The
repository has Vitest domain tests but no React component-test harness, so direct rendered visibility remains a manual
browser check for this surgical cleanup.

## Desired End State

The person briefing renders the existing Core Topics list directly after the loading boundary and no longer displays a
Recent context heading, note cards, or empty-state copy. Existing topic text, questions, order, controls, persistence,
and extraction behavior remain unchanged.

The change is verified by the existing briefing/domain test coverage plus lint, build, and whitespace checks. Manual
verification confirms the visible topic snapshot is identical apart from the removed Recent context section.

### Key Discoveries

- `src/components/anchors/AnchorBriefing.tsx:17,354,408-422` is the only production path for Recent context.
- `src/lib/anchors/briefing.ts:6-8` defines the helper, and `src/lib/anchors/briefing.test.ts:8,31-32` contains its only test.
- `src/components/anchors/AnchorBriefing.tsx:38,74-82,94-105,141-159,225-229,256-261,325-330` must remain intact because these paths load, extract, edit, hide, exclude, and refresh topics or interactions.
- The archived Core Topics plan explicitly treated Recent context removal as separate work, while the current frame confirms this is a narrow presentation correction.

## What We're NOT Doing

- No changes to Core Topic records, IndexedDB schema, persistence, ordering, or owner isolation.
- No changes to extraction prompts, request payloads, API routes, provider behavior, or failure handling.
- No changes to interaction history, Last contact, generation availability, editing, **Not now**, or **Don't suggest**.
- No new React component-test harness or UI automation framework.
- No edits to `context/foundation/roadmap.md` or any file under `context/archive/`.

## Implementation Approach

Make one focused cleanup in the existing briefing component: remove the unused helper import and derived value, then
remove only the Recent context JSX block inside the non-loading branch. Delete the helper and its obsolete unit test,
while retaining the existing topic classification assertion as the automated proof that stored topic text, questions,
and order are preserved.

## Critical Implementation Details

Keep `interactions` and the surrounding loading boundary unchanged. The cleanup must remove only the sibling Recent
context presentation; the existing `topics.length` branch must remain the next rendered branch so an empty briefing
still shows `No Core Topics yet.` and a populated briefing shows the same topic records and controls.

## Phase 1: Remove Recent context without changing Core Topics

### Overview

Delete the unused Recent context presentation path and its helper/test, then run the complete existing verification
suite. The phase ends with a manual browser check of the visual and topic-preservation contract.

### Changes Required:

#### 1. Briefing component presentation

**File**: `src/components/anchors/AnchorBriefing.tsx`

**Intent**: Remove the Recent context heading, note-card list, empty-state copy, helper import, and local derived value
so the Core Topics branch becomes the only briefing list after loading.

**Contract**: Preserve the `interactions` state and every use that supports extraction, Last contact, availability,
loading, errors, retry, and refresh. Preserve the `topics` rendering branch and all topic controls byte-for-byte in
behavior: empty state, order, text, questions, disclosure state, edit, **Not now**, and **Don't suggest**.

#### 2. Remove obsolete briefing helper coverage

**Files**: `src/lib/anchors/briefing.ts`, `src/lib/anchors/briefing.test.ts`

**Intent**: Remove the now-unreferenced `getRecentInteractions` helper and its test/import, while keeping the useful
briefing classification and ordering coverage.

**Contract**: `briefing.ts` continues to export the helpers used by `AnchorBriefing`, including
`classifyBriefingRecords`, `orderCoreTopics`, extraction guards, and snapshot preparation. The retained classification
test continues to prove visible topic text, nested questions, exclusion handling, and explicit ordering.

### Success Criteria:

#### Automated Verification:

- Focused briefing tests pass: `npm test -- --run src/lib/anchors/briefing.test.ts`.
- The complete test suite passes: `npm test`.
- Lint and type-aware checks pass: `npm run lint`.
- The production build passes: `npm run build`.
- Whitespace validation passes: `git diff --check`.
- Repository search confirms no executable references remain to `getRecentInteractions`, `recentInteractions`, or the
  `Recent context` UI label outside historical planning documents.

#### Manual Verification:

- Open a person with existing Core Topics and confirm Recent context is absent.
- Confirm every existing topic remains visible with the same text, questions, order, collapsed disclosure state, and
  Edit, **Not now**, and **Don't suggest** controls.
- Confirm the empty state still says `No Core Topics yet.` when no topics exist.
- Confirm interactions remain available for Last contact and manual extraction, and that removing Recent context does
  not alter stored topics after reload.

**Implementation Note**: After automated checks pass, pause for the user's manual browser verification before treating
the phase as complete.

## Testing Strategy

### Unit Tests:

- Remove only the obsolete recent-interaction slicing test.
- Retain the existing `classifyBriefingRecords` and `orderCoreTopics` coverage for topic text, nested questions,
  exclusions, malformed exclusions, and explicit order.

### Integration Tests:

- Use the existing full Vitest suite, lint, and production build to catch import/export, render, and extraction-flow
  regressions.
- No new component harness is introduced for this presentation-only change.

### Manual Testing Steps:

1. Load a person with a populated Core Topics snapshot and record the visible topic text, questions, and order.
2. Confirm the Recent context heading and note cards are gone.
3. Compare the Core Topics snapshot with the recorded baseline, including controls and collapsed disclosures.
4. Reload the person and confirm the same topics persist.
5. Confirm Last contact and manual extraction still operate from the unchanged interaction state.
6. Load a person with no topics and confirm the existing empty state remains intact.

## Performance Considerations

The change removes a small derived list and up to three rendered interaction cards. It introduces no additional reads,
writes, network requests, or provider work.

## Migration Notes

No data or schema migration is required. Existing interaction and Core Topic records remain untouched. Reverting the
component/helper deletion restores the prior presentation without requiring data repair.

## References

- Frame brief: `context/changes/core-topics-briefing-cleanup/frame.md`
- Current briefing UI: `src/components/anchors/AnchorBriefing.tsx:17,38,74-82,354,402-555`
- Briefing helpers and tests: `src/lib/anchors/briefing.ts:6-70`, `src/lib/anchors/briefing.test.ts:1-104`
- Mounted briefing: `src/components/people/FirstPersonDashboard.tsx:509`
- Product roadmap contract: `context/foundation/roadmap.md:44-46,74-107`
- Archived Core Topics plan: `context/archive/2026-09-11-consolidated-core-topics/plan.md:37-40,73`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Remove Recent context without changing Core Topics

#### Automated

- [x] 1.1 Remove the Recent context component path and its obsolete helper/test without changing Core Topics behavior
- [x] 1.2 Pass focused and complete test suites
- [x] 1.3 Pass lint and production build
- [x] 1.4 Pass whitespace and stale-reference verification

#### Manual

- [x] 1.5 Confirm Recent context is absent and the existing Core Topics snapshot remains unchanged
