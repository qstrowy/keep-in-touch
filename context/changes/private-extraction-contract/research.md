---
date: 2026-09-09T13:23:43+02:00
researcher: Codex
git_commit: 29070788838589d93c862e3bf16d7ee90cdc4989
branch: main
repository: keep-in-touch
topic: "Assess whether research for F-03 private-extraction-contract changes the roadmap or application approach."
tags: [privacy, extraction, llm, data-minimization, retention, roadmap]
status: complete
last_updated: 2026-09-09
last_updated_by: Codex
---

# F-03 private extraction contract research

## Research Question

Does evidence about the current application and external model-provider controls change the fundamental approach for F-03, the privacy gate before extracted conversation anchors?

## Summary

The roadmap order is right: retain F-03 as a hard prerequisite for S-05, and preserve the original interaction locally before any extraction attempt. The fundamental change is to F-03's scope: it cannot be only a provider selection. It must approve an end-to-end, ephemeral browser-to-relay-to-processor contract and the selected provider account's controls.

No default account/API mode researched demonstrates the PRD's literal no-retention requirement. OpenAI, Anthropic, and Google each document no-training commitments or controls, but their default services can retain content for abuse monitoring or state. A qualifying configuration requires a provider-specific approval, exception, or contract, plus feature restrictions. Therefore, S-05 must remain blocked until the owner selects and verifies either:

1. a provider account with documented zero-data-retention controls for the exact endpoint and features; or
2. an on-device extractor that removes the external-processor question entirely.

The product must not claim "no retention" merely because a provider says API data is not used for training.

## Detailed Findings

### 1. The provider decision is an account-and-configuration gate

OpenAI documents that API data is not used for training, but its default abuse-monitoring logs may contain customer content for up to 30 days. Zero Data Retention (ZDR) and Modified Abuse Monitoring need prior approval and extra requirements. With ZDR, use a synchronous, text-only, stateless eligible endpoint; avoid Conversations, Assistants, Threads, Files, Vector Stores, background mode, `store=true`, and prompt caching. [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data)

Anthropic documents that commercial/API data is not used for training without opt-in, while default input/output retention is up to 30 days. Its ZDR option is restricted to approved enterprise API customers and still has narrowly defined safety/legal exceptions. Its own ZDR guidance excludes or limits features such as prompt caching, Files, Batch, web search, beta products, and Claude for Work. [Anthropic retention policy](https://privacy.anthropic.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data), [Anthropic ZDR scope](https://privacy.anthropic.com/en/articles/8956058-i-have-a-zero-data-retention-agreement-with-anthropic-what-products-does-it-apply-to)

Google Vertex AI states that it will not use managed-model customer data to train or fine-tune models without permission, but abuse prompt logging can apply unless an exception is granted. Achieving its documented ZDR posture also requires disabling request-response logging and in-memory caching where the stricter interpretation demands it, and avoiding grounded/search/session features that retain content. [Google Vertex AI zero data retention](https://cloud.google.com/vertex-ai/generative-ai/docs/vertex-ai-zero-data-retention)

Conclusion: a standard API key is insufficient evidence. F-03 acceptance must name the provider, agreement or approval, project/account setting, model, endpoint, region, and forbidden features. It must re-check those controls when the provider changes them.

### 2. The current local-data contract needs a narrow transient-relay exception

The local vault and interaction modules intentionally cannot call network APIs or import remote paths. That is correct and must remain true. The existing interaction record contains a person parent reference and creation metadata, so sending that record would violate the PRD even if the note field is allowed.

The approved design is:

1. Persist and verify the interaction in owner-scoped IndexedDB first.
2. A separate browser transport, outside the protected relationship-data and interaction modules, constructs exactly `{ note }` from the validated local note.
3. An authenticated product relay validates that allowlisted body, uses a server-only processor credential, applies a fixed extraction instruction, and forwards only the note text and fixed prompt to the processor.
4. The relay persists neither request nor response, logs no bodies or identifiers, and returns a structured candidate result.
5. The browser alone correlates the response to its local interaction and stores any anchors as local descendants, preserving owner scope and cascade deletion.

The authenticated browser-to-relay request is inside the product trust boundary; the processor must receive no owner ID, person/interaction ID, name, birthday, date, account identifier, cookie, authorization header, or arbitrary metadata. The relay must not forward browser headers upstream.

This is a clarification, not remote relationship-data persistence: F-03 may allow one ephemeral processing relay under its contract while `local-data-privacy.md` continues to prohibit remote storage, queues, caches, and data bindings for relationship records.

### 3. The note-only rule has an unavoidable content caveat

Field-level minimization can exclude linked profile and account fields, but a free-text note may itself contain names or other personal data. The current 5,000-character limit does not change that fact. F-03 must decide whether the MVP uses a clear informed notice/consent before external processing, client-side redaction with its extraction-quality trade-off, or the on-device alternative. It must not promise that raw note text is anonymous.

### 4. Failure and deletion semantics belong in the contract

The PRD's two-minute target is a product deadline, not evidence of a provider's contractual service-level guarantee. Use a bounded foreground request with an under-two-minute timeout. Do not use batch/background/queued processing. A provider, network, timeout, malformed-response, or local-result-write failure leaves the original local note intact and presents a user-initiated retry. Do not place note text in server retry queues, background jobs, telemetry, or durable logs.

Person deletion must win over an in-flight extraction: a late response cannot recreate an anchor after local cascade deletion. The client must verify the local parent/interaction still exists immediately before storing its result. Deduplication and retry state, if needed, remain local and do not require an interaction identifier to be sent to the processor.

### 5. S-05 must define the local output contract, but F-03 reserves its safety constraints

F-03 should not create production anchor records. It should reserve that S-05 stores candidate anchors locally, with source-interaction provenance held locally and parent links that inherit existing cascade deletion. S-05 needs a small typed schema for topic/follow-up/proposed-interaction-point classification, status, source reference, and safe malformed-output handling. S-06 then owns corrections, dismissal, and resolution.

## Code References

- [Local relationship-data privacy contract](../../foundation/local-data-privacy.md): the browser-only vault rule and the current no-API-route exclusion require the explicit transient-relay clarification.
- [PRD](../../foundation/prd.md): permits note-only external extraction while prohibiting linked name, birthday, and account identifier; it also requires no retention/no training and completion within two minutes.
- [Roadmap](../../foundation/roadmap.md): F-03 correctly precedes S-05 but presently describes only the provider unknown; its acceptance decision needs the wider transport and control evidence above.
- [`interaction.ts` at this research revision](https://github.com/qstrowy/keep-in-touch/blob/29070788838589d93c862e3bf16d7ee90cdc4989/src/lib/interactions/interaction.ts): an interaction payload includes note, date, and creation time, while its stored record also carries a person parent reference; only the note is eligible for the external request.
- [`local-vault.ts` at this research revision](https://github.com/qstrowy/keep-in-touch/blob/29070788838589d93c862e3bf16d7ee90cdc4989/src/lib/relationship-data/local-vault.ts): owner-scoped storage and recursive transaction-based cascade deletion are the boundary for all persisted relationship records.
- [`eslint.config.js` at this research revision](https://github.com/qstrowy/keep-in-touch/blob/29070788838589d93c862e3bf16d7ee90cdc4989/eslint.config.js#L78-L126): blocks network APIs in the interaction and relationship-data modules; extraction transport must be outside them.
- [`InteractionPanel.tsx` at this research revision](https://github.com/qstrowy/keep-in-touch/blob/29070788838589d93c862e3bf16d7ee90cdc4989/src/components/interactions/InteractionPanel.tsx#L65-L90): persists and re-reads the interaction before updating the UI; this is the required ordering for extraction attempts.
- [`wrangler.jsonc` at this research revision](https://github.com/qstrowy/keep-in-touch/blob/29070788838589d93c862e3bf16d7ee90cdc4989/wrangler.jsonc#L17-L19): platform observability is enabled, so F-03 must explicitly verify body redaction and the absence of application logging of sensitive content.

## Architecture Insights

The extraction boundary must be deliberately asymmetric:

```text
IndexedDB (owner-local full interaction) -> browser allowlist { note }
  -> authenticated ephemeral relay -> provider (fixed prompt + note only)
  -> structured candidate result -> browser local correlation -> IndexedDB anchors
```

The relay is a secret-management and minimization boundary, never a relationship-data store. Its only durable configuration is a provider credential and non-sensitive policy/configuration; it has no database, queue, cache, or raw-content telemetry. The provider selection includes all other processors that can observe content, including hosting observability and third-party features.

## Historical Context

S-04 intentionally separated reliable original-note preservation from later extraction. Its implemented plan keeps interaction records owner-local and explicitly excludes LLM extraction, APIs, and remote persistence. This research confirms that separation was the correct foundation: extraction failure must never alter or invalidate the saved note.

The roadmap was created before this provider-control research. Its dependency graph remains sound, but F-03's one provider-question blocker is not enough to approve the boundary.

## Related Research

No prior F-03 research record exists in this repository.

## Open Questions

1. Which route will the owner select: a provider with an approved documented ZDR configuration, or on-device extraction?
2. If an external provider is selected, what exact provider, account agreement/approval, project settings, model, endpoint, region, and feature exclusions will be verified before implementation?
3. Will the MVP use informed consent/notice for free-text note processing, client-side redaction, or both?
4. Is extraction automatic after a successful note save, or explicitly user-triggered? What does the retry UI say after the two-minute deadline?
5. What is the minimum local anchor schema and taxonomy, including the newly discussed proposed future interaction points?
6. Which product/hosting logs, traces, and error reports are enabled, and how will their body-redaction/no-content configuration be verified?
7. Does the privacy promise require an absolute interpretation with no safety/legal exception? If so, a negotiated external service may still be insufficient and on-device processing becomes the viable direction.
