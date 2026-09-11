# Exclusion-Aware Core Topics Implementation Plan

## Overview

Let the owner confirm **Don't suggest** on a current Core Topic, remove that topic from the visible briefing, and retain
its subject as durable owner-local exclusion context for the selected person. Every later manual Core Topics extraction
sends the complete valid exclusion list with the interaction text and asks the configured provider to avoid those
subjects in both topics and follow-up questions on a best-effort basis.

## Current State Analysis

Core Topics are strict `anchors` children in the browser-local relationship vault. **Not now** removes one current topic
without creating durable meaning, and a valid successful extraction atomically replaces the current topic snapshot.
The vault already supports parent-checked single-child replacement and preservation callbacks during collection
replacement, but `AnchorBriefing` currently treats every `anchors` child as replaceable and sends only `{ note }` to the
authenticated extraction route.

The approved private extraction contract therefore conflicts with the new PRD boundary: it permits only raw note text,
while S-03 explicitly permits the complete Excluded Topics text list too. This change must expand that contract
deliberately while preserving all existing ZDR, pinned-provider, no-fallback, timeout, authentication, logging, and
local-persistence guarantees.

## Desired End State

Each visible topic has a **Don't suggest** action beside Edit and **Not now**. The action opens an inline confirmation;
Cancel changes nothing, while Confirm atomically converts the current displayed topic text into a hidden exclusion
record. Successful persistence removes the topic from the visible list and survives reloads, interaction refreshes, and
later successful extractions. A storage failure leaves the topic and prior exclusions unchanged.

Manual extraction loads every valid person-scoped exclusion, sends exactly `{ note, excludedTopics }` within the
existing 20 KB browser budget, and instructs the provider to avoid those subjects in generated topics and questions.
Malformed local exclusion data or an oversized complete request fails locally without a provider call and leaves the
briefing unchanged. Provider compliance remains best-effort: returned topics are not semantically or textually
post-filtered by the application.

### Key Discoveries

- `src/lib/anchors/anchor.ts:4-107` owns strict Core Topic parsing and the shared 500-character text boundary; a distinct
  exact exclusion payload can coexist in `anchors` without appearing as a visible topic.
- `src/lib/relationship-data/local-vault.ts:65-88` can replace a selected child atomically after checking its owner and
  parent, but exact sibling deduplication needs to happen inside that same transaction.
- `src/lib/relationship-data/local-vault.ts:109-172` already supports preserving selected records during successful
  collection replacement, so exclusions need no new object store or database version.
- `src/components/anchors/AnchorBriefing.tsx:51-130` loads heterogeneous person children, constructs the extraction
  request, and commits successful snapshots; it is the integration point for strict exclusion classification.
- `src/lib/extraction/client.ts`, `contract.ts`, and `openrouter.ts` enforce the note-only request and provider message,
  while `src/lib/extraction/endpoint.ts` provides the unchanged same-origin, authentication, and 25 KB relay boundary.
- `context/foundation/private-extraction-contract.md:21-33,44-52,76-84` must be amended from note-only to the narrowly
  approved note-plus-exclusions boundary.

## Decisions

| Decision                | Approved choice                               | Consequence                                                                                                  |
| ----------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Excluded wording        | Current displayed topic text                  | An edited topic excludes the wording the owner actually confirms; no original-text history is added.         |
| Stored subject          | Topic text only                               | Questions, source IDs, positions, dates, and profile metadata are not exclusion context.                     |
| Duplicate identity      | Normalized exact equality                     | Trimmed/collapsed, case-insensitive equivalents share one durable exclusion; semantic matching is not added. |
| Provider noncompliance  | Trust the provider response                   | No exact or semantic post-filtering; a returned conflicting topic remains visible.                           |
| Confirmation            | Inline Confirm/Cancel                         | The warning stays in context and requires no modal or browser dialog.                                        |
| Persistence failure     | Atomic conversion or no change                | The topic never disappears unless a durable exclusion already exists or is saved in the same transaction.    |
| Growth and request size | No count cap; complete request must fit 20 KB | Nothing is silently truncated; an oversized extraction is refused locally.                                   |
| Malformed exclusions    | Fail closed                                   | No provider call occurs when a record explicitly marked as an exclusion is invalid.                          |

## What We're NOT Doing

- No Excluded Topics list, restore, undo, history, editing, bulk management, count cap, or automatic repair/purge UI.
- No semantic matching, embeddings, local classifier, deterministic exclusion guarantee, response rejection, or topic/question
  post-filtering.
- No change to **Not now**, current-topic edit durability, generated topic/question limits, or source-provenance rules.
- No automatic extraction, background processing, retries, streaming, provider fallback, server relationship storage, or
  analytics.
- No person, birthday, relationship circle, date, local ID, owner/account identifier, or exclusion-record metadata in the
  external request.
- No IndexedDB object-store migration and no new component/E2E test dependency.

## Implementation Approach

Keep exclusions as a distinct strict payload inside the existing owner-local `anchors` collection. Extend the
parent-checked child replacement transaction with sibling-aware deduplication so Confirm either replaces the selected
topic with one exclusion or removes the selected topic when an equivalent exclusion already exists. During successful
topic snapshot replacement, preserve valid and malformed marked exclusion records; replace only visible Core Topics.

Classify loaded records into Core Topics, valid exclusions, malformed marked exclusions, and unrelated records. Only
valid exclusion subjects may cross the extraction boundary. Build and validate the complete exact public request before
fetching, then serialize the same validated structure as untrusted user data for OpenRouter. Keep the response contract
and successful snapshot semantics unchanged.

## Critical Implementation Details

The exclusion discriminator must distinguish malformed intended exclusions from unrelated or legacy `anchors` records;
unrelated records must not block extraction. Stored display text retains its normalized casing, while duplicate identity
uses deterministic whitespace normalization and case folding without claiming semantic equivalence.

Successful empty and non-empty extraction must preserve every marked exclusion record, including malformed ones, so a
regeneration cannot silently erase owner intent. A malformed marked exclusion blocks only extraction; it does not hide
otherwise valid current topics or trigger cleanup. Exclusions are snapshotted when Generate is invoked. A concurrent
exclusion added after the request starts is preserved locally but does not invalidate or retroactively change that
in-flight provider request.

## Phase 1: Define exclusions and atomic local persistence

### Overview

Add the strict exclusion domain and transactional conversion semantics without changing the external extraction
boundary or visible UI.

### Changes Required

#### 1. Strict exclusion record classification

**Files**: `src/lib/anchors/anchor.ts`, `src/lib/anchors/anchor.test.ts`

**Intent**: Represent durable exclusion intent without making it a generated Core Topic or reviving obsolete anchor
lifecycle fields.

**Contract**: Add an explicit exclusion discriminator and a payload containing only the normalized subject text besides
that discriminator. Provide classification that separates valid exclusions, malformed records carrying the exclusion
discriminator, and unrelated records. Valid subjects are nonblank, at most 500 characters, and preserve normalized
display casing. Expose a deterministic exact-identity key using collapsed whitespace and case-insensitive comparison.
Derive a new exclusion record from an existing strict Core Topic and the selected person while retaining its record ID,
collection, and parent reference; do not copy questions, source IDs, position, creation time, or profile metadata.

#### 2. Atomic conversion with normalized duplicate handling

**Files**: `src/lib/relationship-data/types.ts`, `src/lib/relationship-data/local-vault.ts`,
`src/lib/relationship-data/local-vault.test.ts`

**Intent**: Ensure a confirmed topic cannot disappear without durable exclusion intent and cannot create duplicate
equivalent exclusions under concurrent or repeated actions.

**Contract**: Extend or add a focused parent-checked mutation that reads the active owner's parent, target child, and
siblings inside one read/write transaction. If the parent/target relationship is stale or mismatched, make no change and
report failure. Otherwise replace the target with the proposed exclusion unless a sibling matches the supplied strict
duplicate predicate; when a match exists, retain the sibling and remove only the now-redundant visible target. Preserve
unrelated children, malformed marked exclusions, other people, and other owners.

#### 3. Exclusion-preserving snapshot replacement and cascade proof

**Files**: `src/lib/relationship-data/local-vault.test.ts`, `src/lib/people/person-storage.test.ts`,
`src/lib/relationship-data/relationship-data-boundary.test.ts`

**Intent**: Prove durable exclusions survive all successful topic refreshes but remain within the established local
ownership and deletion boundary.

**Contract**: Exercise the existing preservation callback with current strict exclusion records. Valid empty/non-empty
topic replacement removes replaceable topics while retaining valid and malformed marked exclusions. Failed or
source-invalid replacement changes nothing. Person cascade removes topics and exclusions atomically, owner isolation
holds, and protected relationship-data modules gain no network capability.

### Success Criteria

#### Automated Verification

- Domain tests distinguish visible topics, valid exclusions, malformed marked exclusions, and unrelated legacy records.
- Domain tests prove 500-character boundaries, current-displayed-text conversion, metadata omission, and normalized exact identity.
- Vault tests prove conversion and duplicate handling are atomic, owner/person scoped, and safe against stale child or deleted-parent races.
- Replacement tests prove empty and non-empty successes preserve marked exclusions while failures preserve the entire prior state.
- Cascade and protected-boundary tests pass without an IndexedDB database-version change.

#### Manual Verification

- Inspect synthetic browser-local records to confirm a converted exclusion contains only its discriminator and normalized subject payload, remains a child of the selected person, and does not render as a Core Topic.

**Implementation Note**: After automated verification passes, pause for confirmation of the browser-local record shape before continuing.

---

## Phase 2: Expand the private extraction boundary

### Overview

Carry the complete valid exclusion list through the browser, authenticated endpoint, and pinned OpenRouter request while
keeping the response schema and operational privacy guarantees unchanged.

### Changes Required

#### 1. Exact note-plus-exclusions request contract

**Files**: `src/lib/extraction/contract.ts`, `src/lib/extraction/contract.test.ts`,
`src/lib/extraction/client.ts`, `src/lib/extraction/client.test.ts`

**Intent**: Make the newly permitted disclosure explicit, bounded, and testable at the public request boundary.

**Contract**: Replace the note-only request with the exact shape `{ note: string, excludedTopics: string[] }`; reject
missing or extra keys, invalid notes, non-array lists, invalid subjects, and normalized exact duplicates. Permit an empty
list and impose no arbitrary exclusion count. The client receives only valid local subject strings, serializes the full
request once, measures UTF-8 bytes including JSON overhead, and refuses before `fetch` when the existing 20 KB ceiling
is exceeded. It never trims notes or exclusions and returns local source provenance separately as before.

#### 2. Authenticated endpoint and provider request

**Files**: `src/lib/extraction/endpoint.test.ts`, `src/pages/api/extractions/anchors.test.ts`,
`src/lib/extraction/openrouter.ts`, `src/lib/extraction/openrouter.test.ts`

**Intent**: Forward only validated text fields and make exclusions influence both generated topics and questions without
weakening the verified processor configuration.

**Contract**: Keep POST, JSON, same-origin, independent Supabase authentication, 25 KB body limit, `no-store`, and neutral
error mapping unchanged. Forward the exact validated request without cookies, headers, IDs, or metadata. Increment the
prompt version and send a clearly delimited structured user payload containing only `note` and `excludedTopics`; the
fixed system instruction treats both fields as untrusted data, derives output language from the note, and asks the model
to avoid exclusion subjects in topic text and follow-up questions. Preserve the exact schema, seven/three/500 response
limits, one pinned provider, no fallback, ZDR, denied data collection, disabled reasoning/streaming, 90-second abort,
and content-free diagnostics. Do not filter or invalidate an otherwise valid provider response for exclusion conflicts.

#### 3. Private extraction contract amendment

**Files**: `context/foundation/private-extraction-contract.md`

**Intent**: Keep the documented privacy source of truth aligned with the approved S-03 disclosure instead of silently
expanding production behavior.

**Contract**: Amend the flow, permitted application/provider payload, size rule, verification checklist, and failure
language to allow raw interaction note text plus normalized Excluded Topics text only. Explicitly prohibit questions,
record IDs, timestamps, profile/account data, and all other linked metadata. Record that the complete request fails
locally when oversized, exclusions are best-effort instructions, provider output is not post-filtered, and existing
operational verification remains required and unchanged.

### Success Criteria

#### Automated Verification

- Contract tests accept only normalized exact `{ note, excludedTopics }` requests, including empty and Unicode cases.
- Client tests prove the complete list is serialized, metadata stays local, and oversized UTF-8 payloads make no fetch.
- Endpoint tests reject malformed, extra-field, oversized, cross-origin, and unauthenticated requests before OpenRouter.
- Route/provider tests prove exact forwarding, prompt version/content, note-derived language, and exclusion coverage for topics and questions.
- Provider tests retain exact ZDR, routing, timeout, response-schema, logging, and neutral-failure guarantees.

#### Manual Verification

- Inspect one synthetic local request and its OpenRouter Activity metadata to confirm only note text and exclusion subjects cross the boundary and the verified ZDR route remains in effect.

**Implementation Note**: Use synthetic content only and pause for owner confirmation of the external-boundary inspection before continuing.

---

## Phase 3: Deliver confirmation UX and end-to-end behavior

### Overview

Connect durable exclusions to the current Core Topics controls and manual generation flow, then verify all accepted
success, failure, reload, and concurrency behavior.

### Changes Required

#### 1. Exclusion loading and fail-closed extraction preparation

**Files**: `src/components/anchors/AnchorBriefing.tsx`, `src/lib/anchors/briefing.ts`,
`src/lib/anchors/briefing.test.ts`

**Intent**: Keep current topics usable while guaranteeing that every provider request contains the complete valid
exclusion snapshot.

**Contract**: Classify all selected-person children during load, render only strict Core Topics, retain valid exclusions
for extraction, and remember whether any marked exclusion is malformed. Generate snapshots the complete current valid
list at click time. If any marked exclusion is malformed or the complete serialized request is oversized, make no
network call, preserve topics/exclusions, and show a neutral retry-safe error. Exclusion changes after the request starts
are preserved by the commit transaction but do not invalidate the in-flight response.

#### 2. Inline **Don't suggest** confirmation

**Files**: `src/components/anchors/AnchorBriefing.tsx`

**Intent**: Make durable exclusion deliberate and clearly different from temporary **Not now** without adding another
screen.

**Contract**: Render **Don't suggest** with Edit and **Not now** outside `<summary>`. Selecting it opens one inline warning
with Confirm and Cancel and copy that later avoidance is best-effort. Cancel changes nothing. Confirm uses the atomic
conversion/deduplication operation, does not generate automatically, and removes the visible topic only after success.
On failure or stale parent/child state, retain the topic and prior exclusions and show a neutral error. Reuse the
existing mutation lock so generation, editing, **Not now**, and other exclusion actions cannot compete in the same
component; clear pending confirmation safely on person change or unmount.

#### 3. End-to-end regression and change evidence

**Files**: `src/lib/anchors/anchor.test.ts`, `src/lib/anchors/briefing.test.ts`,
`src/lib/relationship-data/local-vault.test.ts`, `src/lib/extraction/client.test.ts`,
`src/lib/extraction/contract.test.ts`, `src/lib/extraction/endpoint.test.ts`,
`src/lib/extraction/openrouter.test.ts`, `src/pages/api/extractions/anchors.test.ts`,
`context/changes/exclusion-aware-core-topics/change.md`

**Intent**: Prove the full slice without adding a UI-test framework or recording relationship content in verification
artifacts.

**Contract**: Cover edited-text exclusion, cancel, normalized duplicate conversion, reload durability, valid and
malformed records, empty/non-empty replacement, oversize refusal, provider failure, owner/person isolation, cascade
deletion, and no automatic request. Record only verification categories and outcomes in the change record—never notes,
exclusion subjects, generated content, IDs, provider bodies, cookies, or credentials.

### Success Criteria

#### Automated Verification

- Domain, vault, extraction, endpoint, route, and provider tests cover every approved exclusion decision and smallest counterexample.
- Tests prove provider-returned exclusion conflicts remain visible because no response post-filtering is implemented.
- Tests prove valid empty/non-empty success replaces only visible topics and preserves exclusions; every failure leaves the briefing unchanged.
- `npm test`, `npm run lint`, `npm run build`, and `git diff --check` pass.
- A scoped diff confirms there is no management UI, semantic matcher, server persistence, automatic extraction, retry loop, or profile-metadata disclosure.

#### Manual Verification

- Confirm and cancel **Don't suggest** on a narrow screen; verify copy, focus, disclosure behavior, and mutation locking.
- Exclude an edited topic, reload and navigate away/back, then confirm the topic stays absent and the exclusion remains local.
- Verify **Not now** remains temporary and does not add exclusion context.
- Generate with synthetic exclusions and confirm successful replacement preserves them while an accepted provider conflict is displayed.
- Trigger malformed-local-data, oversized-request, storage-failure, provider-failure, and deleted-person cases; confirm no forbidden request or late write occurs.
- Smoke-test people, interactions, editing, **Not now**, owner isolation, chronological history, and cascade deletion.

**Implementation Note**: After automated verification passes, pause for browser acceptance before closing the change.

## Testing Strategy

### Unit Tests

- Exclusion classification, normalization, 500-character boundary, metadata omission, and exact identity.
- Exact request decoding, duplicate rejection, response compatibility, and prompt-version behavior.
- Pure briefing guards for confirmation, mutation/extraction coordination, malformed state, and stale snapshots.

### Storage and Boundary Tests

- Atomic topic-to-exclusion conversion, existing-duplicate removal, owner/person isolation, and stale/deleted records.
- Exclusion preservation across empty/non-empty replacement, failures, source deletion, and cascade deletion.
- Complete request UTF-8 budgeting, strict endpoint forwarding, metadata non-disclosure, and protected local-only modules.
- Exact provider configuration, schema, timeout, diagnostics, and no post-filtering.

### Manual Testing Steps

1. Generate synthetic Core Topics, edit one, and cancel then confirm **Don't suggest**.
2. Reload and navigate between people; verify only the selected person's excluded topic stays absent.
3. Inspect IndexedDB and the synthetic request to confirm local record shape and external data minimization.
4. Generate again and verify exclusions survive both empty and non-empty successful snapshots.
5. Exercise duplicate, malformed, oversized, storage/provider failure, and person-deletion counterexamples.
6. Confirm **Not now** still permits the subject to return and no exclusion-management surface appears.

## Performance Considerations

The UI still renders at most seven topics. Exclusion conversion performs one small parent-scoped IndexedDB transaction,
and extraction loads the already-required person children once. The full exclusion list is bounded by the existing 20 KB
serialized request ceiling rather than an additional count. No polling, cache, background task, semantic computation, or
extra provider call is added.

## Migration Notes

No IndexedDB database version or object-store migration is required. Existing strict Core Topics and unrelated legacy
records remain readable under their current behavior. The new discriminator applies only to exclusions created after
this change. Malformed marked exclusions are preserved and fail closed rather than being silently migrated or deleted.

## References

- Product requirements: `context/foundation/prd.md:61-75,83-107,122-157`
- Roadmap slice: `context/foundation/roadmap.md:98-108`
- Private extraction boundary: `context/foundation/private-extraction-contract.md:14-54,76-84`
- Archived Core Topics contract: `context/archive/2026-09-11-consolidated-core-topics/plan.md:100-269`
- Current topic controls: `context/changes/manage-current-core-topics/plan.md:20-253`
- Obsolete lifecycle design not to restore: `context/changes/manage-conversation-anchors/plan.md:33-165`
- Current Core Topic domain: `src/lib/anchors/anchor.ts`
- Current owner-local vault: `src/lib/relationship-data/local-vault.ts`
- Current extraction boundary: `src/lib/extraction/contract.ts`, `src/lib/extraction/client.ts`, `src/lib/extraction/openrouter.ts`
- Current briefing integration: `src/components/anchors/AnchorBriefing.tsx`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Define exclusions and atomic local persistence

#### Automated

- [x] 1.1 Prove strict exclusion classification, normalization, limits, and metadata omission — 6f8bcad
- [x] 1.2 Prove atomic topic conversion and normalized exact duplicate handling — 6f8bcad
- [x] 1.3 Prove owner/person isolation and stale or deleted record safety — 6f8bcad
- [x] 1.4 Prove successful replacement preserves marked exclusions while failures preserve all state — 6f8bcad
- [x] 1.5 Pass focused domain, vault, cascade, and protected-boundary tests — 6f8bcad

#### Manual

- [x] 1.6 Confirm the synthetic browser-local exclusion record is hidden, minimal, and person scoped — 6f8bcad

### Phase 2: Expand the private extraction boundary

#### Automated

- [x] 2.1 Prove the exact note-plus-exclusions request contract and 20 KB UTF-8 preflight — 6f8bcad
- [x] 2.2 Prove strict endpoint rejection and metadata-free forwarding — 6f8bcad
- [x] 2.3 Prove versioned exclusion prompting for topics/questions with no response post-filtering — 6f8bcad
- [x] 2.4 Prove ZDR, pinned routing, no fallback, timeout, schema, and diagnostics remain unchanged — 6f8bcad
- [x] 2.5 Pass focused contract, client, endpoint, route, provider, and documentation checks — 6f8bcad

#### Manual

- [x] 2.6 Confirm a synthetic request exposes only note text and exclusion subjects through the verified ZDR route — 6f8bcad

### Phase 3: Deliver confirmation UX and end-to-end behavior

#### Automated

- [x] 3.1 Prove malformed and oversized exclusion context fails locally without changing the briefing — 6f8bcad
- [x] 3.2 Prove confirmation, mutation, extraction, and stale-snapshot guards — 6f8bcad
- [x] 3.3 Prove valid successes preserve exclusions and all failures preserve the existing briefing — 6f8bcad
- [x] 3.4 Pass full test, lint, build, whitespace, and scoped-boundary verification — 6f8bcad

#### Manual

- [x] 3.5 Confirm inline **Don't suggest**, Cancel, best-effort copy, reload durability, and narrow-screen accessibility — 6f8bcad
- [x] 3.6 Confirm edited-text exclusion, duplicate handling, and the distinct temporary **Not now** behavior — 6f8bcad
- [x] 3.7 Confirm synthetic regeneration, provider noncompliance behavior, failure safety, and preserved people/interaction workflows — 6f8bcad
