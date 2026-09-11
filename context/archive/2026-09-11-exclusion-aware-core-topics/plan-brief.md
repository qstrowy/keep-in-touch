# Exclusion-Aware Core Topics — Plan Brief

> Full plan: `context/changes/exclusion-aware-core-topics/plan.md`

## What & Why

This change lets the owner confirm **Don't suggest** on a Core Topic and retain that subject as durable, person-scoped
exclusion context. Later manual Core Topics requests send the complete exclusion list so the provider can avoid those
subjects in both topics and follow-up questions on a best-effort basis.

## Starting Point

Core Topics already live as owner-local `anchors`, support Edit and temporary **Not now**, and are atomically replaced by
valid successful extraction. The extraction boundary currently accepts only `{ note }`, and successful replacement does
not yet distinguish durable exclusions from replaceable topics.

## Desired End State

Inline Confirm converts the current displayed topic into a hidden local exclusion atomically; Cancel and storage failure
change nothing. Every later manual extraction sends all valid exclusion subjects and no linked metadata. Invalid local
exclusion data or an oversized complete request makes no network call and preserves the briefing.

## Key Decisions Made

| Decision             | Choice                                       | Why                                                                              |
| -------------------- | -------------------------------------------- | -------------------------------------------------------------------------------- |
| Excluded wording     | Current displayed topic text only            | Matches what the owner confirms and avoids hidden original-text history.         |
| Duplicate identity   | Normalized exact equality                    | Avoids redundant disclosure without pretending to solve semantic equivalence.    |
| Provider compliance  | Best-effort, no post-filter                  | Preserves the PRD boundary and avoids a hidden deterministic claim.              |
| Confirmation         | Inline Confirm/Cancel                        | Keeps context visible and follows the app's two-step destructive-action pattern. |
| Failure atomicity    | Convert or leave unchanged                   | A topic cannot disappear unless exclusion intent is already durable.             |
| Request growth       | Complete list under the existing 20 KB limit | Nothing is silently truncated and no arbitrary count cap is introduced.          |
| Malformed local data | Fail closed                                  | Prevents an intended exclusion from being silently omitted externally.           |

## Scope

**In scope:** strict exclusion records, atomic conversion/deduplication, replacement preservation, inline confirmation,
complete exclusion request transport, versioned provider instructions, privacy-contract amendment, and focused automated
plus browser verification.

**Out of scope:** exclusion management/restore, semantic matching, response filtering, deterministic guarantees,
automatic extraction, server relationship persistence, profile metadata, and a new UI-test framework.

## Architecture / Approach

Use a distinct strict exclusion payload inside the existing `anchors` collection, avoiding an IndexedDB migration.
Sibling-aware parent-checked mutation makes conversion and normalized deduplication atomic. `AnchorBriefing` classifies
loaded records, preserves all marked exclusions during successful topic replacement, and sends valid subjects through
the exact `{ note, excludedTopics }` request. The provider prompt changes; the response schema does not.

## Phases at a Glance

| Phase                            | What it delivers                                                                       | Key risk                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1. Exclusion domain and storage  | Strict hidden records, atomic conversion/deduplication, replacement and cascade safety | A partial or stale mutation could lose owner intent or create an orphan. |
| 2. Private extraction expansion  | Exact bounded request, provider instructions, and updated privacy contract             | Exclusions or linked metadata could cross the boundary incorrectly.      |
| 3. Confirmation and E2E behavior | Inline UX, fail-closed preparation, reload durability, and regression proof            | UI races could desynchronize visible topics from durable exclusions.     |

**Prerequisites:** S-01 Core Topics snapshot flow and the implemented S-02 current-topic controls.
**Estimated effort:** ~3 focused sessions across 3 phases.

## Open Risks & Assumptions

- Provider compliance is semantic and best-effort; even an exact conflicting result is displayed under the approved no-filter policy.
- Exclusions are snapshotted when Generate starts; a later cross-tab exclusion is preserved locally but does not invalidate the in-flight request.
- With no management UI or count cap, enough note/exclusion text can block generation at 20 KB; the application never truncates silently.
- A malformed marked exclusion blocks extraction but is preserved for a future repair/management change.
- The pre-existing roadmap modification remains outside this change except for the exact S-03 status updates made by planning.

## Success Criteria (Summary)

- Confirmed subjects survive reloads and successful extraction as owner-local person descendants, while **Not now** remains temporary.
- Every provider call carries the complete valid exclusion list and no IDs, questions, dates, or profile/account metadata.
- Invalid/oversized context and every storage/provider failure leave the briefing unchanged; no forbidden request or late write occurs.
- All automated checks pass and the inline confirmation works accessibly on a narrow screen.
