# Consolidated Core Topics Implementation Plan

## Overview

Replace the current three-category conversation-anchor briefing with one ordered Core Topics list. One explicit owner
action continues to send only the selected person's combined interaction text through the existing authenticated
extraction relay; a successful response stores no more than seven owner-local topics, each with up to three grounded,
read-only questions that can be expanded in the briefing.

This slice proves only the replacement briefing. Editing, **Not now**, **Don't suggest**, exclusion-aware extraction,
and removal of duplicated recent context remain separate roadmap work.

## Current State Analysis

The extraction path already combines all interaction notes chronologically, keeps source IDs in the browser, sends
exactly `{ note }`, and maps network, provider, timeout, and malformed-response failures to neutral outcomes. The relay
already enforces same-origin authenticated access, a bounded request, a pinned ZDR/no-fallback provider route, a
90-second deadline, disabled reasoning, and privacy-safe development diagnostics.

The response and local domain are still shaped around a flat `candidates` array whose items have one of three kinds:
`topic`, `follow_up`, or `proposed_interaction`. The UI mirrors that contract as three columns and currently exposes the
old Edit, Resolve, and Dismiss lifecycle. Because flat follow-ups have no parent reference, the current model cannot
render questions underneath the Core Topic they support.

The generic owner-local vault already provides the required atomic boundary. It can verify that the selected person and
every source interaction still exist, remove only that person's records from a target collection, and write a
replacement set in one IndexedDB transaction. The current call preserves managed anchors, which is intentionally wrong
for this replacement: the PRD permits old anchor records to be discarded, and successor slices—not S-01—will define the
new management lifecycle.

## Desired End State

For a person with saved interactions, the owner can manually request Core Topics. The model returns zero to seven topics
in expected-usefulness order and uses the dominant language of the submitted history for the entire briefing. Each topic
owns zero to three concise, grounded questions, and the local record preserves response order plus source provenance.

The briefing displays one ordered list. Every topic starts collapsed, can be expanded independently, and exposes only
read-only questions. A valid response atomically replaces all old records in the existing briefing collection, including
a valid empty response that clears the briefing. Any invalid, unavailable, timed-out, or stale-source result leaves the
stored Core Topics unchanged and offers an owner-initiated retry.

An extraction remains a snapshot of the notes present when it began. A newly saved interaction does not invalidate an
otherwise valid in-flight result; it participates in the next manual extraction. Deleting the person or any interaction
that formed part of the snapshot still prevents the late result from being persisted.

### Key Discoveries

- `src/lib/extraction/contract.ts:3-40,81-114` defines the flat three-kind response, defensive limits, grounding rules,
  empty-response behavior, and original-language instruction that must become a nested Core Topics contract.
- `src/lib/extraction/openrouter.ts:11-37,86-148` mirrors the public contract in strict JSON Schema while already
  preserving the approved pinned-provider, ZDR, no-fallback, no-reasoning, foreground request.
- `src/lib/extraction/client.ts:22-59` already creates one chronological note-only request and retains
  `sourceInteractionIds` locally.
- `src/lib/relationship-data/local-vault.ts:65-128` provides the owner-scoped conditional replacement transaction; its
  optional managed-child preservation must not be used for S-01.
- `src/lib/anchors/anchor.ts:11-29,31-105` stores flat lifecycle anchors and exact-match reconciliation metadata that
  the new topic-with-questions record replaces.
- `src/components/anchors/AnchorBriefing.tsx:49-146,198-398` already owns loading, manual extraction, retry, race guards,
  and persistence, but renders recent context plus three lifecycle-oriented anchor groups.
- `context/foundation/roadmap.md:74-84` limits S-01 to viewing consolidated topics and useful questions; S-02 and S-03
  own editing, temporary hiding, durable exclusions, and exclusion-aware requests.
- `context/foundation/health-check.md` reports a critical Astro AVIF advisory. The owner accepted proceeding because the
  current product has no untrusted image-upload flow; the coordinated dependency patch remains critical follow-up work.

## What We're NOT Doing

- No topic editing, **Not now**, **Don't suggest**, Resolve, Dismiss, closed-topic history, or exclusion management.
- No exclusion list in the extraction request; S-03 owns the privacy-contract expansion for excluded subjects.
- No semantic or deterministic duplicate removal. The prompt asks for distinct useful topics, and S-01 trusts the model.
- No automatic extraction after saving an interaction, background work, polling, caching, streaming, or automatic retry.
- No person names, dates, owner/account IDs, relationship metadata, interaction IDs, or other profile fields sent to the
  provider.
- No removal of the duplicated recent-context block; FR-001 remains optional and parked outside this slice.
- No preservation or migration of old three-category anchor records or their lifecycle state.
- No new IndexedDB database version, object store, remote relationship-data persistence, or API route.
- No UI automation framework. Verification stays with colocated domain/storage tests plus manual browser acceptance.
- No dependency upgrade inside this feature. The Astro/Cloudflare/Wrangler security patch remains a separate critical
  follow-up, accepted temporarily because the application has no untrusted image-upload path.

## Implementation Approach

Replace the existing extraction response in place with `topics`, where every item contains `text` and `questions`.
Keep the request payload and endpoint URL unchanged to avoid privacy-boundary and transport churn. Mirror the nested
limits in the provider JSON Schema and in the defensive local parser. The prompt directs the model to use the dominant
language across the combined notes, rank by usefulness, produce fewer items instead of filler, and keep each item
grounded and concise. When no language clearly dominates, use the language of the most recent submitted note for the
whole briefing.

Replace the local anchor-domain payload with one Core Topic record per provider topic while reusing the existing
`"anchors"` collection. Each record contains normalized topic text, nested normalized questions, an explicit zero-based
position derived from provider order, creation time, and the complete snapshot's source interaction IDs. Reusing the
collection allows the existing transaction to delete obsolete three-category records and write the new briefing in one
step without a database migration.

Refactor the existing briefing component rather than introducing a second orchestration path. Retain its load, manual
request, privacy notice, progress, neutral error, retry, and delete-wins behaviors; remove old lifecycle actions and
render one ordered list with accessible independent disclosure controls. A successful response invokes unconditional
replacement within the target collection. Failure exits before replacement.

## Critical Implementation Details

The in-flight generation guard must continue to discard results after person changes or unmounting, but it must not
discard a valid snapshot merely because a new interaction was added after the request started. Persistence still passes
the captured source IDs to the vault, so deletion of the person or any captured source blocks the write while an added
source waits for the next manual run.

Legacy anchor payloads are not Core Topics and should not be rendered through a compatibility parser. They may remain
in IndexedDB until the first successful Core Topics extraction; that success—including `{ topics: [] }`—removes all of
them atomically. A failed first request performs no cleanup.

## Phase 1: Replace extraction and local topic contracts

### Overview

Define the nested provider response and owner-local Core Topic record before changing the interface. Preserve every
request-side privacy, size, authentication, routing, and timeout invariant.

### Changes Required

#### 1. Nested Core Topics extraction response

**Files**: `src/lib/extraction/contract.ts`, `src/lib/extraction/contract.test.ts`

**Intent**: Replace three independent candidate kinds with one strict structure that keeps each question attached to the
topic it supports and encodes the product's count, language, grounding, and concision rules.

**Contract**: The response is exactly `{ topics: CoreTopicCandidate[] }`; a candidate is exactly
`{ text: string, questions: string[] }`. Accept zero to seven topics and zero to three questions per topic. Normalize
outer whitespace, reject blank or longer-than-500-character topic/question text and unexpected fields, preserve provider
order, and do not deduplicate. Bump the prompt version. Instruct the model to rank topics by expected usefulness, use one
dominant language for the complete response, use the most recent note's language as a no-clear-majority tie-breaker,
keep output concise, allow fewer items rather than filler, broaden perspective without restating the topic, and retain
the existing grounding, no-invention, anti-stereotype rules.

#### 2. Provider schema and decoding

**Files**: `src/lib/extraction/openrouter.ts`, `src/lib/extraction/openrouter.test.ts`

**Intent**: Make OpenRouter produce the same nested contract that the application defensively validates.

**Contract**: Replace the `candidates` JSON Schema with strict `topics[].{text,questions}` objects, `maxItems: 7` for
topics, `maxItems: 3` for questions, and the existing 500-character string ceiling. Keep one-choice envelope parsing,
the pinned provider/model, required-parameter enforcement, ZDR, disabled fallback, disabled reasoning, non-streaming
response, privacy-safe diagnostics, and the 90-second abort unchanged.

#### 3. Browser and endpoint response types

**Files**: `src/lib/extraction/client.ts`, `src/lib/extraction/client.test.ts`, `src/lib/extraction/endpoint.ts`,
`src/lib/extraction/endpoint.test.ts`, `src/pages/api/extractions/anchors.test.ts`

**Intent**: Carry the nested response through the existing browser-to-relay path without expanding what crosses the
network.

**Contract**: Update response types, success fixtures, and defensive decoding to the Core Topics shape. Keep the exact
`{ note }` request, chronological note aggregation, local-only source IDs, UTF-8 byte refusal, same-origin/auth checks,
neutral HTTP status mapping, `Cache-Control: no-store`, and `/api/extractions/anchors` route unchanged.

#### 4. Owner-local Core Topic records

**Files**: `src/lib/anchors/anchor.ts`, `src/lib/anchors/anchor.test.ts`,
`src/lib/relationship-data/relationship-data-boundary.test.ts`

**Intent**: Replace lifecycle-oriented flat anchors with strict, ordered topic records whose questions cannot become
detached and whose provenance remains browser-local.

**Contract**: A valid person-child record in the existing `"anchors"` collection contains topic text, a questions array,
an integer position from zero through six, creation time, and a non-empty ordered list of unique source interaction IDs.
Creation derives position from provider response order. Parsing rejects legacy kinds/lifecycle fields, malformed or
duplicate source IDs, invalid positions, unexpected fields, and invalid nested strings. Protected local modules remain
network-free.

### Success Criteria

#### Automated Verification

- Focused extraction-contract tests accept nested valid and empty responses and reject an eighth topic, a fourth
  question, blank/overlong strings, unexpected fields, and questions without a parent topic.
- Prompt tests prove dominant-language output, recent-note tie-breaking, usefulness ordering, concision, grounding,
  no-filler, no-invention, and anti-stereotype instructions are present.
- OpenRouter tests prove the strict nested JSON Schema while retaining ZDR, pinned routing, no fallback, disabled
  reasoning, diagnostics, error mapping, and the 90-second timeout.
- Client, endpoint, and route tests prove the nested success response does not change the exact note-only request or
  expose browser metadata.
- Core Topic domain tests prove nested validation, explicit order, local source provenance, and rejection of legacy or
  malformed records.
- `npm test -- --run src/lib/extraction/contract.test.ts src/lib/extraction/openrouter.test.ts src/lib/extraction/client.test.ts src/lib/extraction/endpoint.test.ts src/pages/api/extractions/anchors.test.ts src/lib/anchors/anchor.test.ts`
  passes.
- `npm run lint` and `git diff --check` pass.

#### Manual Verification

- Review the provider schema, public response, and local record shape to confirm questions belong to one topic and only
  raw combined note text crosses the relay.

**Implementation Note**: After completing this phase and all automated verification passes, pause for human confirmation
of the manual review before proceeding.

**Amendment (2026-09-11):** Questions are direct, natural future-conversation starters for the owner to ask the selected
person. They must not ask the owner to reconstruct, verify, or infer what the person or third parties said or did.

---

## Phase 2: Deliver the consolidated Core Topics briefing

### Overview

Replace the old three-column lifecycle UI with one ordered, expandable Core Topics briefing while preserving the proven
manual extraction and failure-safe local replacement path.

### Changes Required

#### 1. Core Topics presentation helpers

**Files**: `src/lib/anchors/briefing.ts`, `src/lib/anchors/briefing.test.ts`

**Intent**: Give the component one deterministic view of valid topics in usefulness order without reintroducing kinds or
deduplication rules.

**Contract**: Replace three-kind grouping with position-based ordering of Core Topic records. Retain the existing helper
for the parked recent-context block until FR-001 is implemented separately.

#### 2. Single-list briefing and disclosures

**Files**: `src/components/anchors/AnchorBriefing.tsx`

**Intent**: Present Core Topics as the primary future-conversation context and keep questions subordinate, readable, and
easy to scan on a smartphone.

**Contract**: Rename user-visible anchor terminology to Core Topics; render one ordered list with every topic collapsed
by default and independently expandable so multiple disclosures can remain open. Use accessible disclosure semantics
and render zero to three questions as plain, non-editable text. Remove Edit, Resolve, Dismiss, confirmations, managed
state, and three-category empty states. Preserve the compact processing notice, no-interactions state, loading/running
state, disabled action, neutral errors, and explicit retry.

#### 3. Snapshot-safe atomic replacement

**Files**: `src/components/anchors/AnchorBriefing.tsx`, `src/lib/anchors/anchor.ts`,
`src/lib/relationship-data/local-vault.test.ts`

**Intent**: Replace the whole obsolete briefing only after a valid response while retaining deletion safety and the
owner's chosen snapshot semantics.

**Contract**: Build records from the captured response order and source IDs, then call
`replaceChildrenIfSourcesExist` without managed-child preservation or conflict suppression. A valid empty response writes
an empty replacement and clears all legacy records. Any request, parse, storage, missing-person, or missing-captured-source
failure keeps the prior stored set. Person switch and unmount invalidate a response; a newly added interaction does not
invalidate a request already in flight and is included only on the next run.

### Success Criteria

#### Automated Verification

- Briefing-helper tests prove stable position ordering without category grouping or application-side deduplication.
- Domain/vault tests prove a successful non-empty response replaces all old generated and managed anchor records while
  preserving unrelated children and every other owner's records.
- Domain/vault tests prove a successful empty response clears the target collection and source/person deletion leaves
  the old set untouched without resurrecting data.
- Coordinator tests or extracted pure-function tests prove an added interaction does not invalidate the captured
  snapshot while a person change or deleted captured source still prevents a late write.
- `npm test`, `npm run lint`, `npm run build`, and `git diff --check` pass.

#### Manual Verification

- In an authenticated browser, confirm no-notes, running, success, empty, failure, and retry states use Core Topics
  terminology and leave the full interaction history unchanged.
- Confirm all topics start collapsed, multiple topics can remain expanded, questions are read-only, and usefulness order
  persists after reload.
- Save a synthetic interaction during an in-flight extraction; confirm the completed snapshot may land and the new note
  participates after the next manual extraction.

**Implementation Note**: After completing this phase and all automated verification passes, pause for human browser
confirmation before proceeding.

---

## Phase 3: Prove privacy, compatibility, and live provider behavior

### Overview

Close S-01 with complete automated regression evidence and one authenticated live provider run using synthetic content.

### Changes Required

#### 1. Boundary and regression coverage

**Files**: `src/lib/extraction/contract.test.ts`, `src/lib/extraction/openrouter.test.ts`,
`src/lib/extraction/client.test.ts`, `src/lib/extraction/endpoint.test.ts`,
`src/pages/api/extractions/anchors.test.ts`, `src/lib/anchors/anchor.test.ts`,
`src/lib/anchors/briefing.test.ts`, `src/lib/relationship-data/local-vault.test.ts`,
`src/lib/relationship-data/relationship-data-boundary.test.ts`

**Intent**: Prove the product-language replacement has not weakened privacy, owner isolation, failure preservation,
deletion guarantees, or existing people and interaction behavior.

**Contract**: Cover the exact request allowlist, nested response limits, provider schema, valid-empty replacement,
malformed/failure non-replacement, usefulness position, local-only provenance, owner isolation, unrelated-child
preservation, person cascade, and late person/source deletion. Keep protected relationship-data modules unable to import
remote persistence or call network APIs.

#### 2. Live synthetic acceptance record

**Files**: `context/changes/consolidated-core-topics/change.md`

**Intent**: Record enough evidence to show the configured provider accepts the new schema and language instruction
without persisting synthetic note content, response content, credentials, cookies, or identifiers.

**Contract**: Record only the verification date, authenticated live-route success/failure category, observed timing,
schema-validity outcome, dominant-language outcome, browser behavior, and automated command results. Use synthetic notes
containing more than one language; do not copy the prompt, request text, or provider response into the repository.

### Success Criteria

#### Automated Verification

- `npm test` passes all domain, storage, extraction, route, and regression tests.
- `npm run lint` passes.
- `npm run build` completes; the known nonfatal Wrangler log-file EPERM may be documented but is not a build failure.
- `git diff --check` passes.
- A scoped diff confirms no new server persistence, background processing, profile metadata, or exclusion payload was
  introduced.

#### Manual Verification

- An authenticated live OpenRouter request using only synthetic mixed-language interactions returns a schema-valid
  Core Topics response within the existing 90-second foreground deadline.
- The entire returned briefing uses the dominant interaction language, keeps expected-usefulness order, contains no more
  than seven topics and three questions per topic, and avoids obvious filler or duplicate subjects without local
  deduplication.
- Reload preserves topic/question association and order; a simulated 502, 503, or 504 preserves the previous briefing
  and exposes an owner-initiated retry.
- Existing people creation/edit/delete, dated interaction capture, future-date rejection, chronological history, owner
  isolation, and person cascade behavior remain intact.
- The accepted temporary Astro advisory risk is recorded, and the coordinated dependency patch remains clearly marked
  as critical follow-up work immediately after S-01.

**Implementation Note**: After all automated verification passes, pause for human acceptance of the live synthetic and
regression checks before marking the change implemented.

## Testing Strategy

### Unit Tests

- Strict nested response parsing, normalization, limits, unexpected fields, empty arrays, dominant-language prompt,
  usefulness order, no-filler instruction, and trusted-model duplicate policy.
- Core Topic local-record parsing, nested question association, explicit position, creation, source-provenance
  validation, and legacy-record rejection.
- Position-based briefing presentation and retained recent-interaction helper behavior.

### Storage and Integration Tests

- Atomic full replacement of old generated and managed anchors using the existing collection.
- Valid empty success versus invalid/unavailable/timeout non-replacement.
- Owner isolation, unrelated-child preservation, person cascade, and deletion of a captured source before persistence.
- Exact `{ note }` client/endpoint boundary, request byte limits, same-origin authentication, neutral errors, no-store
  responses, and strict OpenRouter response compatibility.
- Snapshot behavior when a new interaction is saved after a request begins.

### Manual Testing Steps

1. Create synthetic interaction histories with a clear dominant language and a minority-language note.
2. Run manual extraction and inspect the browser request to confirm the application sends note text but no profile or
   local provenance metadata.
3. Confirm one usefulness-ordered list appears with no more than seven topics; expand multiple topics and verify each has
   no more than three read-only questions in the dominant language.
4. Reload and confirm topic/question association and order persist.
5. Repeat with a mocked valid empty response and confirm all Core Topics and legacy anchors clear.
6. Repeat with mocked malformed, 502, 503, and 504 outcomes and confirm the stored briefing remains with retry available.
7. Save another synthetic interaction while extraction is pending; accept the snapshot result, then extract again and
   confirm the new note participates.
8. Delete the selected person or a captured source while a request is pending and confirm no late topic is persisted.
9. Smoke-test people management and dated interaction behavior, including future-date rejection and full chronological
   history.

## Performance Considerations

The normal briefing remains one owner-local parent lookup and renders at most seven topic records plus twenty-one
questions. Explicit positions avoid client-side ranking work. Extraction remains one bounded, non-streaming foreground
request with the existing 20 KB client body budget, 25 KB endpoint ceiling, and 90-second abort. No additional provider
call, background process, or semantic comparison is introduced.

## Migration Notes

No IndexedDB database version or object-store migration is required. Core Topic records reuse the existing `"anchors"`
collection but use a strict new payload, so legacy records are ignored by the Core Topics parser. The first successful
new extraction atomically removes every legacy record for that person before writing the new set; a valid empty response
performs the same cleanup. Failed extraction performs no deletion. Existing people and interaction records are unchanged.

Rollback can restore the prior application code without migrating people or interactions. Core Topic payloads will be
ignored by the old strict anchor parser; a later old-format successful extraction can replace them through the same
collection-level operation.

## References

- Product requirements: `context/foundation/prd.md:18-32,63-86,122-160`
- Roadmap slice: `context/foundation/roadmap.md:38-46,74-107`
- Local privacy boundary: `context/foundation/local-data-privacy.md`
- External extraction boundary: `context/foundation/private-extraction-contract.md`
- Reliability frame: `context/changes/extraction-reliability/frame.md`
- Prior extraction plan: `context/archive/2026-09-09-extracted-anchor-briefing/plan.md`
- Prior lifecycle plan: `context/changes/manage-conversation-anchors/plan.md`
- Current extraction contract: `src/lib/extraction/contract.ts`
- Current local domain and vault: `src/lib/anchors/anchor.ts`, `src/lib/relationship-data/local-vault.ts`
- Current briefing UI: `src/components/anchors/AnchorBriefing.tsx`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Replace extraction and local topic contracts

#### Automated

- [x] 1.1 Accept valid nested and empty responses and reject every structural and count-limit counterexample — d9706eb
- [x] 1.2 Prove the prompt carries dominant-language, usefulness, concision, grounding, and no-filler rules — d9706eb
- [x] 1.3 Prove the provider schema retains routing, privacy, diagnostic, failure, and timeout safeguards — d9706eb
- [x] 1.4 Prove nested responses do not change the exact note-only browser and endpoint request — d9706eb
- [x] 1.5 Prove ordered Core Topic records validate nested questions and local source provenance — d9706eb
- [x] 1.6 Pass focused extraction, provider, client, endpoint, route, and Core Topic tests — d9706eb
- [x] 1.7 Pass lint and whitespace verification — d9706eb
- [x] 1.9 Prove questions are direct owner-to-person future conversation starters — d9706eb

#### Manual

- [x] 1.8 Confirm topic/question association and the exact note-only external boundary — d9706eb

### Phase 2: Deliver the consolidated Core Topics briefing

#### Automated

- [x] 2.1 Prove briefing helpers retain stable usefulness-position ordering without local deduplication
- [x] 2.2 Prove successful extraction replaces all old anchors without crossing owner or collection boundaries
- [x] 2.3 Prove empty success clears the briefing while captured-source deletion preserves the old set
- [x] 2.4 Prove added interactions preserve an in-flight snapshot while person changes invalidate it
- [x] 2.5 Pass full test, lint, build, and whitespace verification

#### Manual

- [ ] 2.6 Confirm Core Topics terminology, UI states, retry, and unchanged full interaction history
- [ ] 2.7 Confirm collapsed disclosures, multiple open topics, read-only questions, order, and reload persistence
- [ ] 2.8 Confirm an in-flight snapshot can land and a newly saved note participates in the next extraction

### Phase 3: Prove privacy, compatibility, and live provider behavior

#### Automated

- [ ] 3.1 Pass the complete test suite
- [ ] 3.2 Pass lint verification
- [ ] 3.3 Complete the production build with only documented nonfatal diagnostics
- [ ] 3.4 Pass whitespace verification
- [ ] 3.5 Confirm the scoped diff adds no persistence, background processing, profile metadata, or exclusions

#### Manual

- [ ] 3.6 Verify authenticated mixed-language extraction through the configured live provider
- [ ] 3.7 Confirm dominant-language output, usefulness order, limits, grounding, and no obvious filler
- [ ] 3.8 Confirm reload persistence and simulated 502, 503, and 504 failure preservation
- [ ] 3.9 Confirm existing people, interactions, owner isolation, and person cascade remain intact
- [ ] 3.10 Preserve the accepted temporary Astro risk and critical dependency-patch follow-up
