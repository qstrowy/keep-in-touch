# Frame Brief: Core Topics briefing cleanup

> Framing step before /10x-plan. This document separates the observed UI
> problem from the initially proposed direction.

## Reported Observation

The person briefing displays a **Recent context** section above the Core Topics cards. The requested correction is to remove that section and keep the already displayed topics visible and unchanged when the section is removed.

## Initial Framing (preserved)

- **User's stated cause or approach**: Recent context logic and section should be deleted.
- **User's proposed direction**: Topics should remain visible and unchanged when Recent context is removed.
- **Pre-dispatch narrowing**: The leading concern is the presentation cleanup; “topics remain untouched” means the topic display should not change as a side effect.

## Dimension Map

The observation could originate at these dimensions:

1. **Presentation composition** — an extra derived block is rendered in the briefing and competes with the topic cards. ← initial framing
2. **Topic loading and persistence** — removing the block could accidentally remove or reset the topic state if both views share an unsafe lifecycle path.
3. **Product scope and roadmap contract** — the extra block may be a preserved S-01 context requirement rather than accidental UI, changing whether this is a correction or a new slice.

## Hypothesis Investigation

| Hypothesis                         | Evidence                                                                                                                                                                                                                            | Verdict                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Presentation composition           | `AnchorBriefing.tsx:354` derives `recentInteractions`; `AnchorBriefing.tsx:408-422` renders a separate Recent context block before the topic list.                                                                                  | STRONG                                                         |
| Topic loading and persistence      | The same component independently stores `topics` (`AnchorBriefing.tsx:38`), classifies them from anchor records (`AnchorBriefing.tsx:79-82`), and only replaces them after an explicit extraction (`AnchorBriefing.tsx:141-159`).   | NONE for the reported display problem; regression risk remains |
| Product scope and roadmap contract | The active roadmap S-01 outcome is one concise Core Topics list (`roadmap.md:74-84`), and the archived S-01 plan says the briefing displays one ordered list (`context/archive/2026-09-11-consolidated-core-topics/plan.md:37-40`). | STRONG                                                         |

## Narrowing Signals

- The user explicitly confirmed that “untouched” means topics remain visible and unchanged when Recent context is removed.
- The screenshot shows the issue as layout/content hierarchy: Recent context is a sibling section above otherwise functioning topic cards.

## Cross-System Convention

A primary briefing should expose the product's chosen decision-support artifact without duplicating or competing context panels. Here, the current roadmap and archived Core Topics contract both describe the Core Topics list as the briefing result, so the extra Recent context presentation does not appear to be part of the intended final surface.

## Reframed (or Confirmed) Problem Statement

> **The actual problem to plan around is**: The Core Topics briefing contains an unintended Recent context presentation block, and its removal must be regression-safe for the existing topic snapshot.

The initial framing was correct about the location of the problem: the evidence points to a separate rendering block, not to topic persistence or extraction data. The plan should therefore treat this as a narrow briefing-surface correction with explicit proof that the topic list, stored records, extraction behavior, and interaction workflow remain unchanged.

## Confidence

- **HIGH** — strong component evidence, matching product contract, and a decisive user clarification.

## What Changes for /10x-plan

Plan the removal of the Recent context presentation and its now-unneeded presentation helper, with regression coverage that the visible Core Topics remain present and unchanged. Do not expand the scope into topic persistence, extraction replacement semantics, or a new roadmap slice.

## References

- `src/components/anchors/AnchorBriefing.tsx:38,79-82,141-159,354,408-422`
- `src/components/people/FirstPersonDashboard.tsx:509`
- `context/foundation/roadmap.md:74-84`
- `context/archive/2026-09-11-consolidated-core-topics/plan.md:37-40`
