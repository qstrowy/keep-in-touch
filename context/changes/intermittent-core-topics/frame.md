# Frame Brief: Intermittent Core Topics failures

## Reported Observation

"We could not extract Core Topics. Try Again. It worked yesterday."

## Initial Framing (preserved)

- **User's stated cause or approach:** Issue generating Core Topics on the Cloudflare workers.dev environment; no confirmed cause.
- **User's proposed direction:** Try the deployed application.
- **Pre-dispatch narrowing:** The user subsequently reported that fictional Marta Kowalska failed while Adam Nowak worked, and authorized Google Chrome use.

## Dimension Map

1. **Authentication and Worker configuration:** A rejected session or missing secret could prevent extraction.
2. **Input and response contract:** Specific notes could exceed limits or produce an invalid model response.
3. **Upstream availability and rate limiting:** A pinned provider may reject some requests and accept others.
4. **Error presentation:** Several different failures appear as the same generic message.

## Hypothesis Investigation

| Hypothesis                                  | Evidence                                                                                                                                                                 | Verdict |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| Global authentication/configuration failure | Deployed extraction returned 503 rather than 401/403; successful configured direct requests followed. Current deployed secrets were not inspected.                       | WEAK    |
| Marta's notes are intrinsically invalid     | Identical fictional Marta notes succeeded through the current extractor and returned three validated topics.                                                             | NONE    |
| Intermittent upstream rate limiting         | Direct request using local configured credentials returned HTTP 429, `Provider returned error`, provider `DeepInfra`; later Adam and identical Marta requests succeeded. | STRONG  |
| Generic error obscures the cause            | Non-2xx upstream responses become `unavailable`, relay 503, and the same UI message.                                                                                     | STRONG  |

## Narrowing Signals

- Observed the existing error in signed-in Chrome on the production dashboard.
- Reproduced Marta's deployed request: HTTP 503, JSON `error: unavailable`, approximately 653 ms.
- A fresh deployed Adam attempt also failed, weakening the person-specific hypothesis.
- A direct synthetic Marta request through the actual current extractor returned upstream HTTP 429 from DeepInfra in approximately 521 ms.
- A subsequent direct Adam request succeeded in approximately 2,974 ms.
- Identical synthetic Marta input subsequently succeeded with three validated topics in approximately 2,761 ms.
- Direct probes used local configuration, not an inspection of production secrets; the production response intentionally hides the upstream status.
- No production observability, routing, security controls, or data were changed.

## Cross-System Convention

OpenRouter documents HTTP 429 as rate limiting and describes honoring an upstream Retry-After header when supplied. The current extractor deliberately does not retry automatically and restricts requests to one approved provider with fallback disabled.

Source: https://openrouter.ai/docs/api/reference/errors-and-debugging

## Reframed Problem Statement

The strongest explanation is intermittent rate limiting on the configured upstream provider route, hidden by a generic application error. Evidence does not support corrupt Marta demo data or a consistent failure for particular people.

The production upstream status was not directly visible, so attributing every deployed 503 to the same 429 remains an inference.

## Confidence

**HIGH** that the configured upstream route intermittently rejected requests with 429 and that the same Marta input is valid. **MEDIUM** that this accounts for each observed production 503.

## What Changes for Further Work

If a follow-up change is requested, investigate preserving a neutral rate-limit category and useful manual-retry guidance. Any automatic retries or processor/routing changes must be reconciled with the existing extraction contract; they were not implemented during this diagnosis.

## References

- `src/lib/extraction/openrouter.ts:163` — upstream non-success handling.
- `src/lib/extraction/endpoint.ts:68` — neutral public status mapping.
- `src/lib/extraction/client.ts:76` — client failure mapping.
- `src/components/anchors/AnchorBriefing.tsx:128` — generic error message.
- `src/lib/demo-data.ts` — fictional inputs used for comparison.
- `context/foundation/private-extraction-contract.md` — pinned routing and user-initiated retry policy.
- Read-only investigation agents: `/root/provider_path`, `/root/deployment_path`.
- Extraction provider, contract, endpoint, and client suites: 20 tests passed during the read-only investigation.
