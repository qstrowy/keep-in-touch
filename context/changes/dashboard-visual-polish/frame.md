# Frame Brief: KeepInTouch dashboard visual polish

> Framing step before /10x-plan. This document separates what the user sees from the initial explanation for it.

## Reported Observation

“Now it's flat design” and “seems like simple CRUD with 3 fields.”

## Initial Framing (preserved)

- **User's stated cause or approach**: The app appears flat and limited to a simple three-field CRUD form.
- **User's proposed direction**: Add UI polish to make it more visually appealing and interesting before the 10xBuilder submission.
- **Pre-dispatch narrowing**: The submission calls for screenshots of the post-login home, data-entry form, and main data-display feature; treat the authenticated workflow as the visual surface to assess.

## Dimension Map

The observation could originate at these dimensions:

1. **Feature scope** — the product might truly lack meaningful capabilities beyond recording a person.
2. **First-run state** — the initial form might be the only or dominant experience the user has seen.
3. **Dashboard hierarchy and composition** — richer saved-person features may be hidden in a narrow, linear layout.
4. **Visual differentiation** — sections may look alike even when they represent distinct tasks.

## Hypothesis Investigation

| Hypothesis | Evidence | Verdict |
| --- | --- | --- |
| Feature scope is too narrow | The entry form has a name, relationship circle, and optional birthday (`FirstPersonDashboard.tsx`). After a person is saved, the app also supports Core Topics generation and management, dated interaction capture/history, and person management (`AnchorBriefing.tsx`, `InteractionPanel.tsx`, `FirstPersonDashboard.tsx`). | WEAK |
| First-run state alone causes the impression | Loading selects the form when no saved people exist (`FirstPersonDashboard.tsx`); the form is intentionally short. We could not inspect the deployed authenticated state during investigation. | WEAK |
| Dashboard hierarchy hides the workflow | The authenticated page is centered in a `max-w-lg` card (`dashboard.astro`). Saved-person profile, briefing, and interaction sections render in a single vertical flow (`FirstPersonDashboard.tsx`). | STRONG |
| Sections lack visual distinction | Core Topics and its topic cards use similar translucent card styling; interaction history is presented as plain list rows (`AnchorBriefing.tsx`, `InteractionPanel.tsx`). | STRONG |

## Narrowing Signals

- The user’s submission checklist explicitly needs post-login, entry-form, and data-display screenshots, so the relevant scope is the authenticated workflow rather than only the public landing/sign-in pages.
- Independent code reads found actual feature depth after data entry; the current layout and repeated surface styling obscure it. The form’s brevity is not itself a missing-feature bug.
- A read-only browser check reached the public sign-in gate, so authenticated appearance is grounded in source rather than a live signed-in visual inspection.

## Cross-System Convention

The public welcome and sign-in surfaces already use a consistent cosmic background, layered color, gradient type, and glass-card treatment (`Welcome.astro`, `signin.astro`). The dashboard retains the palette but uses a simpler, narrow composition. Extending the existing visual language into clearer dashboard sections fits the app better than replacing its theme or adding decorative data.

## Reframed (or Confirmed) Problem Statement

> **The actual problem to plan around is**: KeepInTouch’s authenticated workflow does not visually communicate its existing relationship-memory features because the dashboard compresses them into a narrow, weakly differentiated column.

The product already supports more than person entry: it can organize people, prepare Core Topics, and record dated interactions. The polish should make those real capabilities and the path between them easy to recognize, including on the required submission screens, while keeping the concise form, data behavior, and privacy boundary intact.

## Confidence

- **MEDIUM** — source evidence and independent code reads support the hierarchy and differentiation findings, but we could not compare them against a live authenticated session.

## What Changes for /10x-plan

Plan a focused authenticated-dashboard presentation pass across the first-person entry and saved-person views. Preserve the cosmic identity and current behavior; do not add form fields, sample user records, or new product features.

## References

- `src/pages/dashboard.astro`
- `src/components/people/FirstPersonDashboard.tsx`
- `src/components/anchors/AnchorBriefing.tsx`
- `src/components/interactions/InteractionPanel.tsx`
- `src/components/Welcome.astro`
- `src/pages/auth/signin.astro`
