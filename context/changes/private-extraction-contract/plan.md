# Private extraction contract Implementation Plan

## Overview

Establish and prove the privacy-qualified external extraction boundary required before conversation anchors can be built. The foundation will use a product-owned OpenRouter account behind an authenticated Cloudflare Worker relay, sending only the selected person's raw interaction-note text to a pinned Zero Data Retention (ZDR) route. It does not create or display anchors; S-05 owns that product behavior.

## Current State Analysis

Interactions are validated and retained only in the authenticated owner's IndexedDB vault. The interaction and relationship-data modules are guarded against network calls, while the dashboard is the sole browser entry point. Current API routes are thin Astro handlers and dashboard middleware does not protect API routes, so an extraction endpoint must authenticate independently.

The research established that OpenRouter can enforce ZDR routing and disable prompt logging, but both OpenRouter configuration and its chosen downstream endpoint are part of the privacy boundary. Default provider behavior is not sufficient evidence for the PRD's no-retention promise.

## Desired End State

A developer can call one authenticated, same-origin endpoint with exactly a valid raw note and receive a strictly validated candidate response from a configured OpenRouter ZDR route. The endpoint never persists, logs, or forwards relationship metadata; it sends no browser headers upstream and returns neutral errors. It cancels at 90 seconds.

The durable contract documents the configuration and operational evidence needed before real notes are used. Existing local persistence remains network-free, and an in-flight request can never recreate local data after the person is deleted.

### Key Discoveries

- `src/lib/interactions/interaction.ts:53-70` creates a record containing a person reference and creation metadata; only its validated `note` is allowed to leave the device.
- `eslint.config.js:78-126` and `src/lib/relationship-data/relationship-data-boundary.test.ts:11-23` prohibit remote imports and network APIs in interaction and relationship-data modules. Extraction must remain outside those paths.
- `src/components/interactions/InteractionPanel.tsx:65-89` saves and re-reads an interaction locally before updating the UI; future extraction must preserve that ordering.
- `src/middleware.ts:4-21` protects `/dashboard` only. The API route must verify the Supabase user itself through `src/lib/supabase.ts`.
- `wrangler.jsonc:17-19` enables platform observability, making no-content application logging and logging-configuration verification part of the contract.

## What We're NOT Doing

- A user-facing “Extract anchors” button, processing status, retry UI, consent notice, or display of candidates; S-05 owns those experiences. When it adds the manual button, it will show the approved short notice beside it.
- Local conversation-anchor records, source provenance, classification editing, dismissing, resolving, briefing UI, or proposed interaction-point UI; S-05 and S-06 own them.
- Automatic extraction after saving, background processing, queues, caches, polling, server-side retries, or sending an interaction/person/owner identifier to OpenRouter.
- Client-side or persisted API keys, BYOK, model selection in the app, any fallback routing, prompt/response logging, remote relationship-data persistence, or production use of real notes before the manual operational verification passes.
- Solving indefinitely growing all-history context. S-05 will initially send all of the selected person's note texts on a manual extraction; a future change owns compaction, selection, or context-size policies.

## Implementation Approach

Keep the privacy boundary in three layers. A pure extraction-contract module outside the protected local-data folders owns allowlisted request validation, the fixed extraction prompt/version, and defensive decoding of candidates. A server-only OpenRouter service uses that module and one configured ZDR-only, no-fallback provider/model route. A same-origin API route independently authenticates the owner, validates a body containing exactly `{ note }`, calls the service with a 90-second deadline, and emits only neutral JSON errors.

The local browser will not call this endpoint in F-03. Instead, automated route/service tests and a synthetic developer verification exercise the real relay. This proves the privacy boundary before S-05 owns manual full-history selection, UI notice, local storage of candidates, and deletion-race coordination.

## Critical Implementation Details

The Worker must use a server-only OpenRouter key and must never forward client headers upstream. Every upstream request must enforce OpenRouter ZDR and a single pinned provider/model with no fallback; if the configured route is unavailable, fail neutrally rather than silently changing processors. The selected model/provider is an external deployment configuration, but it is a completion prerequisite: record its exact value and its current ZDR evidence in the foundation contract before any real-note use.

## Phase 1: Define the approved boundary and pure contracts

### Overview

Turn the research conclusion into a durable privacy approval record and typed, testable request/result boundary that future S-05 code can consume without exposing local relationship records.

### Changes Required

#### 1. Foundation private-extraction contract

**Files**: `context/foundation/private-extraction-contract.md`, `context/foundation/local-data-privacy.md`

**Intent**: Record the product's approved exception for an ephemeral note-only relay without weakening the owner-local persistence rule.

**Contract**: Name OpenRouter as the processor, require a product-owned account, prompt logging disabled, ZDR per request, pinned provider/model, no fallback, server-side secret, synthetic-data-only verification until setup is approved, and no raw-content logs/queues/caches. Define the allowable outbound body as raw note text only; forbid account, owner, person, interaction, date, birthday, and browser-header metadata. Define the 90-second deadline, neutral failure categories, no automatic retry, and the delete-wins rule. Amend the local contract only to allow this transient route while continuing to prohibit remote relationship-data storage.

#### 2. Pure extraction request and candidate-response contract

**Files**: `src/lib/extraction/contract.ts`, `src/lib/extraction/contract.test.ts`

**Intent**: Make data minimization and defensive provider decoding executable rather than relying on a route author's judgment.

**Contract**: Accept one trimmed interaction note within the existing 5,000-character limit and construct the provider payload from a fixed prompt/version plus that note only. Reject missing, blank, oversized, or additional public request fields. Define a small internal candidate schema sufficient for S-05 to adopt later, reject malformed/unexpected provider output, and provide neutral public error codes that never contain note text or provider response text.

### Success Criteria

#### Automated Verification

- Contract tests prove valid note-only payload construction and reject blank, oversized, malformed, and extra-field inputs.
- Contract tests prove fixed prompt configuration and reject malformed, unexpected, or oversized candidate output without leaking content.
- `npm test` and `npm run lint` pass while `src/lib/interactions/**` and `src/lib/relationship-data/**` remain network-restricted.

#### Manual Verification

- Review `private-extraction-contract.md` against the PRD and confirm it names every processor, prohibited field, logging rule, timeout, failure rule, and deployment evidence requirement.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Implement and test the authenticated no-persistence relay

### Overview

Add the smallest server-only OpenRouter integration and same-origin API surface that can enforce the approved contract without changing how relationship data is stored.

### Changes Required

#### 1. Server-only extraction configuration and OpenRouter service

**Files**: `astro.config.mjs`, `.env.example`, `wrangler.jsonc`, `src/lib/extraction/openrouter.ts`, `src/lib/extraction/openrouter.test.ts`

**Intent**: Keep provider credentials and route choice outside the browser while making privacy-critical provider options testable.

**Contract**: Declare placeholder-only server secrets for the OpenRouter key and the human-approved pinned model/provider route. The service accepts a validated contract request and injectable transport/clock for testing. It sends the fixed prompt and note text only to OpenRouter, uses the server key, enforces ZDR and no fallback, disables streaming/caching features, and aborts at 90 seconds. It never logs request/response content and maps unavailable configuration, timeout, non-success, and malformed responses to neutral service outcomes.

#### 2. Authenticated extraction API route

**Files**: `src/pages/api/extractions/anchors.ts`, `src/pages/api/extractions/anchors.test.ts`, `src/lib/supabase.ts` if a small reusable authentication helper is needed

**Intent**: Provide a narrowly scoped, same-origin interface for S-05 while ensuring dashboard authentication is not mistakenly treated as API authorization.

**Contract**: Implement POST-only JSON handling with an exact `{ note }` body, an origin check, content-type and size validation, and independent Supabase user verification. Reject unauthenticated, cross-origin, malformed, unexpected, or oversized requests before contacting OpenRouter. Return generic JSON errors with appropriate HTTP statuses; never echo a note, provider error, authorization material, model/provider setting, or upstream body. The route has no database, KV, Durable Object, cache, queue, or telemetry write.

#### 3. Relay boundary and failure coverage

**Files**: `src/lib/relationship-data/relationship-data-boundary.test.ts`, `src/pages/api/extractions/anchors.test.ts`, `src/lib/extraction/openrouter.test.ts`

**Intent**: Prove the essential privacy and lifecycle properties, including the smallest counterexamples that could accidentally expose metadata or violate the deadline.

**Contract**: Assert that the local-data lint boundary remains intact; upstream payload inspection proves it contains only the fixed instruction and note text, with no owner/person/interaction/date/account data or forwarded client headers. Cover unauthenticated and cross-origin calls, missing secret/configuration, provider timeout at 90 seconds, rate limit/non-success, malformed output, and neutral error responses. Add a contract-level delete-wins test that models a late candidate being discarded when the local source is no longer available; S-05 will connect that rule to anchor persistence.

### Success Criteria

#### Automated Verification

- Unit and route tests prove independent authentication, exact request allowlisting, server-only credentials, no-fallback ZDR upstream settings, and absence of forwarded browser headers.
- Tests prove 90-second abort behavior and neutral handling of configuration, network, provider, malformed-output, and rate-limit failures.
- Tests prove that a late candidate is discarded when its local source no longer exists, and that existing local modules still reject network APIs.
- `npm test`, `npm run lint`, and `npm run build` pass.

#### Manual Verification

- Review the relay source, browser bundle configuration, and Worker declarations to confirm no client-side OpenRouter key, application content logging, or relationship-data persistence resource was introduced. The credentialed synthetic preview request is deferred to Phase 3, where provider approval and secret provisioning are verified.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Complete operational approval and hand off to S-05

### Overview

Verify the selected OpenRouter route and deployment configuration against the written contract, then document the precise constraints S-05 must respect when it adds the manual full-history flow.

### Changes Required

#### 1. Operational verification record and S-05 handoff

**Files**: `context/foundation/private-extraction-contract.md`, `context/changes/private-extraction-contract/change.md`

**Intent**: Make the provider-control decision auditable and prevent a later UI slice from quietly broadening the external data flow.

**Contract**: Record the exact approved OpenRouter model/provider route, the date and source of its ZDR evidence, disabled prompt logging, no-fallback setting, region/account limitations, secret-provisioning location, and synthetic test outcome. Add a handoff checklist: S-05 sends all of one selected person's raw note texts only after explicit user action; shows the approved notice; persists candidates and source provenance only in IndexedDB; re-checks local existence before writing; and provides a user-initiated retry after a neutral failure. Do not record secret values or real note content.

#### 2. Deployment configuration documentation

**Files**: `.env.example`, `wrangler.jsonc`, `context/foundation/infrastructure.md`

**Intent**: Ensure the only remaining human operation—setting the declared Worker secrets—is explicit and cannot accidentally expose an API key.

**Contract**: Document preview-first secret provisioning through Cloudflare Workers secrets, with real values excluded from the repository and browser bundle. State that production promotion, secret rotation, provider changes, logging/observability changes, or use of real notes require human approval and a repeat of the contract verification.

### Success Criteria

#### Automated Verification

- `git diff --exit-code -- src/lib/interactions src/lib/relationship-data` confirms F-03 did not introduce network calls or alter local relationship persistence.
- `npm test`, `npm run lint`, and `npm run build` pass after the operational documentation and configuration declarations are added.

#### Manual Verification

- The human verifies the selected OpenRouter route is currently ZDR-compatible, pinned, and configured with prompt logging off and no fallback before any real note is sent.
- The human deploys a preview with secrets through the approved Worker-secret process, verifies one synthetic request end-to-end, and confirms no secret or content appears in source, browser tools, or application logs.
- The human confirms that real-note use remains blocked until this verification record is complete, and that S-05's scope is limited to the documented manual full-history behavior.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before marking the foundation ready for S-05.

## Testing Strategy

### Unit Tests

- Note validation, exact request allowlist, fixed prompt/version, and strict candidate decoding.
- OpenRouter request construction: ZDR required, pinned provider/model, no fallback, no stream/cache, only server authorization, no forwarded browser headers.
- Deadline, abort, unavailable secret, rate-limit, network, non-success, and malformed-response mapping to neutral outcomes.
- Delete-wins coordinator behavior using a local-source existence check before a future S-05 write.

### Integration Tests

- Route tests with mocked Supabase user and transport for POST-only, same-origin, authenticated JSON requests.
- Assert rejected requests never call the provider and valid requests never send linked relationship metadata.
- Retain the ESLint relationship-data boundary test and run the complete Vitest suite, lint, and build.

### Manual Testing Steps

1. Configure a preview-only OpenRouter key and one documented ZDR-compatible, no-fallback model/provider route using Worker secrets; use synthetic text only.
2. Make an authenticated same-origin POST with only a synthetic `note`; confirm a valid candidate response or neutral failure within 90 seconds.
3. Try missing authentication, another origin, an extra request key, an oversized note, an unavailable key, and a simulated provider failure; confirm no upstream call where invalid and no sensitive error text where valid-but-failed.
4. Inspect the browser bundle, source repository, application logs, and configured observability path for the key or request/response contents; none may appear.
5. Verify the F-03 handoff record before allowing S-05 to expose manual full-history extraction to the owner.

## Performance Considerations

F-03 has one foreground request budget of 90 seconds, preserving margin under the PRD's two-minute requirement. It intentionally provides no background work, caching, or retries. S-05's initial all-history policy can increase request size over time; it is accepted for the small MVP and must be revisited in a later context-management change before it becomes a reliability or cost issue.

## Migration Notes

No relationship-data migration or remote persistence resource is introduced. New server secrets are declared by name only, must be provisioned in preview before production, and are independently rotatable. Removing the route or its secrets disables external extraction without affecting existing owner-local notes.

## References

- Related research: `context/changes/private-extraction-contract/research.md`
- Product guardrails: `context/foundation/prd.md:94-100`, `context/foundation/local-data-privacy.md`
- Existing note record: `src/lib/interactions/interaction.ts:5-16,53-90`
- Local persistence and deletion: `src/lib/relationship-data/local-vault.ts:17-104`
- Existing interaction save boundary: `src/components/interactions/InteractionPanel.tsx:65-89`
- API auth pattern: `src/lib/supabase.ts:5-23`, `src/middleware.ts:4-21`
- Network guardrail: `eslint.config.js:78-126`, `src/lib/relationship-data/relationship-data-boundary.test.ts:11-23`
- Worker configuration: `astro.config.mjs:14-23`, `wrangler.jsonc:9-19`, `context/foundation/infrastructure.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Define the approved boundary and pure contracts

#### Automated

- [x] 1.1 Add the durable private-extraction contract and narrow local-data exception — 411ef57
- [x] 1.2 Add and test the note-only request and candidate-response contracts — 411ef57
- [x] 1.3 Pass contract, local-boundary, lint, and full test verification — 411ef57

#### Manual

- [x] 1.4 Review the approved contract against the PRD and privacy requirements — 411ef57

### Phase 2: Implement and test the authenticated no-persistence relay

#### Automated

- [x] 2.1 Add server-only OpenRouter configuration and the ZDR no-fallback service — a304c4f
- [x] 2.2 Add the independently authenticated same-origin extraction route — a304c4f
- [x] 2.3 Prove metadata exclusion, neutral failures, deadline, and delete-wins behavior — a304c4f
- [x] 2.4 Pass complete tests, lint, and production build — a304c4f

#### Manual

- [x] 2.5 Review the server-only relay boundary and absence of client secrets or application content logging — a304c4f

### Phase 3: Complete operational approval and hand off to S-05

#### Automated

- [x] 3.1 Record the verified processor configuration and S-05 handoff constraints
- [x] 3.2 Document preview-first Worker secret provisioning and preserve local-data boundaries
- [x] 3.3 Pass protected-boundary diff, full tests, lint, and production build

#### Manual

- [x] 3.4 Verify ZDR/no-log/no-fallback provider configuration and preview deployment with synthetic data
- [x] 3.5 Confirm real-note use is gated on this verification and S-05 owns the manual full-history UI
