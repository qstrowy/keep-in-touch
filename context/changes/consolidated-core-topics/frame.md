# Frame Brief: Future conversation-starter questions

> Framing step before follow-up planning. This document separates the observed
> wording problem from assumptions about its cause.

## Reported Observation

A generated question asks the owner to determine what friends discussed, such
as whether _8 Mile_ was the only film they recommended. The owner expects each
question to be something they can ask that person in a later conversation.

## Initial Framing (preserved)

- **User's stated cause or approach:** the question is for the owner rather than the friend.
- **User's proposed direction:** questions shall be future conversation starters.
- **Pre-dispatch narrowing:** every question should be phrased as a prompt the owner can ask the person.

## Dimension Map

The observation could originate at any of these dimensions:

1. **Provider instruction** — the generation prompt might not define the question's audience or point of view.
2. **Response contract** — parsing or persistence might rewrite, lose, or permit a detached question.
3. **Briefing presentation** — the UI might transform a provider question into owner-facing wording.

## Hypothesis Investigation

| Hypothesis                                         | Evidence                                                                                                                                                         | Verdict |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| Provider instruction lacks addressee               | `src/lib/extraction/contract.ts:12-15` says only future usefulness and perspective broadening; it does not require direct owner-to-person conversation starters. | STRONG  |
| Response contract changes question perspective     | `src/lib/extraction/contract.ts:65-95` and `src/lib/anchors/anchor.ts:62-89` only validate and normalize strings.                                                | NONE    |
| Briefing presentation changes question perspective | `src/components/anchors/AnchorBriefing.tsx:183-188` renders each stored question verbatim.                                                                       | NONE    |

## Narrowing Signals

- The owner confirmed the desired behavior: every question should be a future conversation starter directed to the person.
- The existing prompt permits a grounded question about what "they" discussed, so the observed wording is compatible with the current instruction.

## Cross-System Convention

The PRD frames the feature as preparation for a future conversation
(`context/foundation/prd.md:28,61-71`), and the existing test example “Ask how
it went” (`src/lib/extraction/contract.test.ts:57`) already follows the desired
conversational shape. Neither the schema nor UI needs semantic rewriting.

## Reframed Problem Statement

> **The actual problem to plan around is**: the extraction prompt and its tests
> do not define questions as direct, natural conversation starters that the
> owner can ask the selected person.

This is semantic prompt drift, not a presentation or persistence defect. The
contract must make the intended addressee explicit while retaining grounding,
language, count, and privacy guarantees.

## Confidence

- **HIGH** — the provider prompt is the only stage that can introduce the
  wording, and the user-confirmed intent matches the PRD's future-conversation
  purpose.

## What Changes for /10x-plan

Plan a narrow extraction-prompt and prompt-test update that requires direct,
owner-to-person conversation starters and rejects owner-facing reconstruction
questions as desired output. No UI, persistence, or request-boundary redesign
is indicated.

## References

- `src/lib/extraction/contract.ts:10-18,65-95`
- `src/lib/extraction/contract.test.ts:15-28,55-59`
- `src/components/anchors/AnchorBriefing.tsx:183-188`
- `src/lib/anchors/anchor.ts:62-89`
- `context/foundation/prd.md:28,61-71,85-86`
- Investigation tasks: `/root/prompt_perspective`, `/root/ui_perspective`
