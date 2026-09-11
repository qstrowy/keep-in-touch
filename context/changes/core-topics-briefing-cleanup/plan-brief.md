# Core Topics Briefing Cleanup — Plan Brief

> Full plan: `context/changes/core-topics-briefing-cleanup/plan.md`
> Frame brief: `context/changes/core-topics-briefing-cleanup/frame.md`

## What & Why

The Core Topics briefing contains an unintended Recent context presentation block above the topic cards. The actual
problem to plan around is: The Core Topics briefing contains an unintended Recent context presentation block, and its
removal must be regression-safe for the existing topic snapshot.

## Starting Point

`AnchorBriefing` keeps interaction state and Core Topics state separate, but it still derives and renders a three-item
Recent context list. The helper has no consumers beyond this presentation path and its obsolete unit test.

## Desired End State

The person briefing shows the existing Core Topics list directly without a Recent context heading or note-card section.
Topic text, questions, ordering, controls, persistence, extraction, and interaction history remain unchanged.

## Key Decisions Made

| Decision            | Choice                                      | Why (1 sentence)                                       | Source           |
| ------------------- | ------------------------------------------- | ------------------------------------------------------ | ---------------- |
| Helper lifecycle    | Delete helper and obsolete test             | The helper has no remaining production consumer.       | Plan             |
| Regression coverage | Existing unit tests plus manual UI          | The repository has no React component-test harness.    | Plan / Research  |
| Phase structure     | One implementation phase                    | This is a narrow presentation-only change.             | Plan             |
| Topic preservation  | Keep all topic state and behavior untouched | “Untouched” means topics remain visible and unchanged. | Frame            |
| Roadmap treatment   | Standalone change, no roadmap item          | The current roadmap has no matching cleanup Change ID. | Frame / Research |

## Scope

**In scope:**

- Remove the Recent context JSX, derived value, import, helper, and obsolete helper test.
- Retain the topic classification/order test and existing application behavior.
- Run focused tests, full tests, lint, build, whitespace, and stale-reference checks.
- Perform manual browser verification of the rendered result and topic preservation.

**Out of scope:**

- Topic storage, extraction, API, interaction history, or topic-management changes.
- New component-test infrastructure, UI automation, roadmap changes, and archived-file edits.

## Architecture / Approach

Delete one sibling presentation branch inside `AnchorBriefing` while preserving the shared loading boundary and the
existing `topics.length` branch. Remove the now-dead helper from `briefing.ts` and its dedicated test, then rely on
existing domain coverage plus manual visual verification.

## Phases at a Glance

| Phase | What it delivers                                      | Key risk                                      |
| ----- | ----------------------------------------------------- | --------------------------------------------- |
| 1     | Recent context removed; Core Topics behavior retained | Accidental change to topic rendering or state |

**Prerequisites:** Existing Core Topics implementation and the confirmed frame brief.
**Estimated effort:** One small implementation phase.

## Open Risks & Assumptions

- Direct rendered UI regression remains a manual check because no component-test harness exists.
- Historical roadmap and archived-plan references to Recent context are documentation only and remain unchanged.

## Success Criteria (Summary)

- Recent context is absent from the person briefing.
- Existing topics remain visible, ordered, editable/manageable, and persistent without data changes.
- Focused tests, full tests, lint, build, whitespace, and stale-reference checks pass.
