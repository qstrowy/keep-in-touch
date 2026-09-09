---
project: KeepInTouch
status: approved-for-s05-handoff
created: 2026-09-09
updated: 2026-09-09
---

# Private extraction contract

## Purpose

This contract governs the only permitted external processing of relationship data. It implements FR-004 without changing the rule that relationship records persist only in the owner's browser-local IndexedDB vault.

## Approved processor boundary

- The processor is a product-owned OpenRouter account, reached only through an authenticated KeepInTouch Worker relay.
- The account has private input/output logging disabled. Each request enforces OpenRouter Zero Data Retention (ZDR), uses one explicitly pinned provider/model route, and disables fallback routing.
- The exact provider/model, current ZDR evidence, account settings, region limitations, and synthetic-verification result are recorded before any real note is processed. A provider/model or privacy-setting change requires the same review again.
- The OpenRouter API key is a Worker secret. It is never committed, added to a client bundle, stored in IndexedDB, displayed, logged, or accepted from the owner.

## Permitted data flow

```text
owner-local IndexedDB interaction -> future manual S-05 action -> same-origin Worker relay
  -> fixed extraction instruction + raw note text -> OpenRouter ZDR route
  -> validated candidate response -> future owner-local IndexedDB anchor records
```

The relay receives an authenticated browser request but does not forward browser cookies, authorization headers, account identity, or arbitrary headers to OpenRouter. Its application request body is exactly `{ note: string }`.

OpenRouter may receive only the fixed extraction instruction and the raw note text. It must never receive the owner ID, person ID or name, interaction ID, selected date, creation time, birthday, account identifier, relationship circle, anchor ID, or any other linked profile metadata.

Raw note text may itself contain personal information. The product does not claim that it is anonymous. S-05 will show a short notice beside its manual extraction action before any note is sent.

## Persistence, logging, and failure rules

- The relay has no database, storage bucket, KV, Durable Object, cache, queue, background job, server retry queue, or relationship-data binding.
- Application logs, errors, traces, metrics, and client responses must not include note text, candidate text, provider response bodies, credentials, cookies, authorization headers, or linked relationship metadata. Failures are expressed as neutral public categories only.
- The request is foreground-only and aborts after 90 seconds. It does not stream, use background/batch processing, cache prompts/responses, or retry automatically.
- A configuration, network, timeout, rate-limit, provider, or malformed-response failure never changes or removes the original local interaction. S-05 will offer an explicit user-initiated retry.
- Deleting a person remains immediate. A request already sent to the processor cannot be recalled, but a late response must be discarded if its local source no longer exists; it must not recreate local anchors.

## S-05 handoff

S-05 owns the manual “Extract anchors” control. Each action initially sends all raw note texts for the selected person, without dates or linked metadata; context-size management is a later change. S-05 stores candidate anchors and source provenance only as owner-local descendants, re-checks source existence before writing, and implements the notice, success/error state, and retry UI.

## Verification and operational gate

- Automated tests prove that only a valid note crosses the public boundary, malformed candidate responses are rejected, and protected local modules remain unable to make network calls.
- Synthetic text is the only permitted input until a human records the exact pinned OpenRouter provider/model, ZDR evidence, disabled prompt logging, no-fallback configuration, Worker-secret location, and a successful preview verification.
- Real-note use, production promotion, secret rotation, logging/observability changes, or processor changes require human approval and another verification record.

## Operational verification record

This record is the source of truth for the provider approval gate. Do not replace these fields with secret values or real note content.

| Field                     | Current record                                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| Verification status       | `verified-deployed` on 2026-09-09                                                                    |
| Processor account         | Product-owned OpenRouter account; account identity and region must be confirmed by the owner         |
| OpenRouter model          | Verified: `deepseek/deepseek-v4-flash-0731`                                                          |
| OpenRouter provider       | Verified: `deepinfra/fp8`                                                                            |
| ZDR evidence              | Confirmed by owner on 2026-09-09; evidence reference: https://openrouter.ai/docs/guides/features/zdr |
| Prompt logging            | Confirmed disabled by the owner on 2026-09-09                                                        |
| Fallback routing          | Disabled in every application request with one provider; verified by deployed synthetic success     |
| Worker secret location    | Cloudflare Workers Secrets for `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, and `OPENROUTER_PROVIDER`   |
| Synthetic deployed result | Authenticated same-origin synthetic request returned HTTP 200 with a schema-valid candidate response |

This record retains only the model/provider identifiers, evidence source and date, configuration outcome, and synthetic success/failure category. It never records a key, note text, response body, cookie, or authorization material.

## S-05 handoff checklist

S-05 may proceed only after the operational verification record above is complete:

- Expose extraction only behind an explicit owner action and show the approved short notice before sending any note.
- Send all raw note texts for one selected person initially, but send only the exact `{ note }` payload to this relay; do not include person, interaction, date, birthday, account, or browser metadata.
- Persist candidate anchors and source provenance only in the owner-local IndexedDB vault.
- Re-check local source existence immediately before writing candidates so a delete wins over a late response.
- Keep retry user-initiated and preserve the original local interaction on every neutral failure.
- Keep real-note use blocked if the provider route, account controls, secrets, logging configuration, or preview verification changes.
