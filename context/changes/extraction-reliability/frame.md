# Frame Brief: Anchor extraction reliability

> Framing step before `/10x-plan`. This document separates the observed
> failure from the still-unverified cause.

## Reported Observation

Sometimes extraction shows `We could not extract anchors. Your existing briefing is unchanged. Try again.` Sometimes it takes about one minute and often reaches the timeout limit.

Some failed attempts do not appear in OpenRouter at all. After several retries, a later attempt can succeed and appear there.

On 2026-09-09, a local development attempt returned `504` after 1.5 minutes with the neutral JSON body `{ "error": "timeout" }`, `Cache-Control: no-store`, and an `Access-Control-Allow-Origin` value for `http://localhost:4323`. This is the application's own timeout response, not an HTML edge error.

An authorized direct synthetic request from this machine using the configured model, pinned provider, ZDR, no-fallback, and structured-output settings returned HTTP 200 in 1.47 seconds. It used no personal content and its response was not retained in this record.

An authorized second synthetic request mirrored the application's complete prompt, pinned provider preferences, strict schema, and Node native `fetch` transport. It returned HTTP 200 in 525 ms. It used no personal content and its response was not retained in this record.

Ten sequential exact-payload requests in one persistent Node process all returned HTTP 200 in 261–1,290 ms. This did not reproduce a connection-pool stall outside the Astro development server.

On 2026-09-10, an authorized direct synthetic request using the current exact fixed instruction, model, pinned provider, ZDR/no-fallback settings, and strict schema returned HTTP 200. Its headers arrived in 784 ms and its complete valid JSON body arrived in 10.436 seconds. The body was 5,572 bytes; neither its prompt nor response content is retained here.

On the same day, the freshly restarted local development relay logged authentication success, provider handoff, and OpenRouter HTTP 200 response headers in 523 ms, then logged its 90-second abort. In the current implementation, the only awaited operation between those two points is `response.text()`. The body did not complete for the local Worker before the abort, so parsing never ran.

The local-only diagnostic stream now separately records response-body-read start and finish, including only the completed byte count. An abort after `provider_body_read_started` without `provider_body_read_finished` conclusively attributes an attempt to body delivery/reading rather than parsing.

On 2026-09-10, a real local development request authenticated immediately, received OpenRouter HTTP 200 headers in 542 ms, and finished body delivery in 80.291 seconds at 19,872 bytes. It parsed successfully. No request or response content is retained. This disproves a permanently stuck local response reader for that attempt, but establishes that the current provider configuration can consume nearly the full 90-second foreground deadline after headers have arrived.

The active terminal then reported `Another astro dev server is already running` for port 4323 (PID 9808), so the browser request was hitting an existing development process rather than a freshly started one. A later process check found that PID and listener gone; the port is currently free.

## Initial Framing (preserved)

- **User's stated cause or approach**: No cause stated yet.
- **User's proposed direction**: No implementation direction stated yet.
- **Pre-dispatch narrowing**: The user reports both quick neutral failures and slow attempts that often time out.

## Dimension Map

The observation could originate at any of these dimensions:

1. **Provider/model latency or availability** — the pinned model/provider may be slow, overloaded, or intermittently unavailable.
2. **Relay/runtime deadline** — an upstream request or deployment path may terminate before the application's 90-second provider deadline.
3. **Response compatibility** — a provider response may arrive but fail the strict response parser or schema contract.
4. **Client error presentation** — distinct network, provider, timeout, and malformed-response outcomes may be collapsed into one user-visible message.

## Hypothesis Investigation

| Hypothesis | Evidence | Verdict |
| --- | --- | --- |
| Provider/model latency or availability | The unbounded reasoning-capable request returned a 19,872-byte body after 80.291 seconds. After `reasoning.effort: "none"` was added, five manual real-note requests completed consistently in roughly 10–12 seconds, with a representative 2,354-byte body delivered in 11.717 seconds. | CONFIRMED root cause |
| Long-lived local development runtime | The earlier stale server could have confounded initial reproduction, but a clean local process still demonstrated 80-second provider-body latency before the reasoning change. Repeated fast runs after the change rule it out as the primary cause. | NOT PRIMARY |
| Pre-provider authentication or browser/relay transport | `src/lib/extraction/endpoint.ts:21-59` can reject method, origin, content type, request shape/size, or authentication before `extract()` is invoked. `src/pages/api/extractions/anchors.ts:17-29` performs a separate Supabase `getUser()` call for every extraction. An absent OpenRouter generation is consistent with these exits, a missing server configuration, or a browser-to-Worker fetch rejection. | STRONG for the class; un-attributed within the class |
| Relay/runtime deadline | `src/lib/extraction/openrouter.ts:9` sets a 90-second deadline. `src/lib/extraction/endpoint.ts:61-69` maps it to HTTP 504. Current Cloudflare documentation says HTTP-triggered Workers have no hard wall-time limit while the client remains connected, so a generic Worker wall-time cap is not supported by evidence. | WEAK |
| Response compatibility | `src/lib/extraction/openrouter.ts:108-116` rejects missing/changed response content, and `src/lib/extraction/client.ts:67-75` maps HTTP 502 or malformed JSON to `invalid_response`. OpenRouter's documented non-streaming Chat Completions shape uses `choices[0].message.content`, so the parser matches the standard shape. The observed 90-second attempt did not reach this parser because `response.text()` never completed. | WEAK for the observed timeout |
| Client error presentation | `src/components/anchors/AnchorBriefing.tsx:89-96` renders every result except `too_large` as the same sentence. `src/lib/extraction/client.ts:60-75` collapses network failure, non-502 service failure, timeout, and malformed response into a small neutral union. This directly explains why quick failures are not distinguishable. | STRONG |

## Narrowing Signals

- The user observes two timing classes: quick failure and slow timeout; this rules out treating every failure as one timeout-only defect.
- A successful later retry rules out a permanently missing secret, permanently invalid model/provider route, or permanently invalid response schema as the sole cause.
- No OpenRouter generation on some failures rules in a pre-provider path: browser-to-Worker transport, endpoint validation, authentication, or unavailable server configuration.
- The exact local endpoint JSON and 90-second duration rule out a generic browser timeout. The local server reached `openrouter.ts` and its outbound `fetch()` remained unresolved until the application aborted it.
- A direct synthetic request using the same account route returned HTTP 200 in 1.47 seconds, ruling out a persistent credential, DNS, or general provider-route failure.
- A Node native-fetch request that mirrored the complete application payload returned HTTP 200 in 525 ms, ruling out the prompt, schema, and configured provider preferences as the primary cause of the observed timeout.
- Ten sequential exact-payload requests in one persistent Node process all succeeded within 1.29 seconds, so the intermittent stall is not reproduced by a generic long-lived Node fetch pool.
- A later direct synthetic run received its full valid body in 10.436 seconds. This confirms that body delivery can be materially slower than header delivery, but still leaves a large margin below 90 seconds for that sample.
- The fresh local relay received HTTP 200 headers in 523 ms but could not finish `response.text()` before its 90-second abort. The current failure is therefore a stalled or exceptionally delayed response body, not an output structure mismatch.
- A subsequent successful local run took 80.291 seconds to finish a 19,872-byte body after receiving HTTP 200 headers in 542 ms. The provider body is the dominant latency source; a slow body can therefore reach the foreground deadline without a local runtime fault.
- The request currently has no `max_completion_tokens` and does not specify a reasoning configuration. The selected model supports reasoning and an extremely large completion ceiling, so an output/reasoning budget is the next targeted variable to test synthetically before changing the provider route or timeout.
- Astro explicitly reported an existing server on port 4323, and the process/listener later disappeared; a clean single-server restart is now the highest-value next check.
- The UI exposes no status category, request ID, or timing, so the quick-failure branch cannot currently be attributed to provider availability versus malformed output from the browser.
- The provider route is pinned with `allow_fallbacks: false` in `src/lib/extraction/openrouter.ts:91-97`, making transient provider availability a plausible independent source of failures.

## Cross-System Convention

Cloudflare documents unlimited wall-clock duration for an HTTP Worker request while the client remains connected, while OpenRouter documents multiple distinct timeout, overload, gateway, and rate-limit classes. The current implementation intentionally hides those distinctions for privacy, but it also removes the evidence needed to separate reliability causes.

## Reframed (or Confirmed) Problem Statement

> **The actual problem was**: the pinned reasoning-capable model could generate a large reasoning response for a simple extraction, keeping the non-streaming response body open close to the 90-second deadline. Disabling reasoning bounded the observed response body and restored repeatable roughly 10–12 second completion.

The initial observation is not evidence that the local vault or briefing replacement is corrupting data; those paths preserve the existing briefing on neutral failures. The first reliability change should therefore establish bounded, distinguishable failure outcomes and deployed evidence before choosing whether to change the model/provider route or response contract.

## Confidence

- **HIGH** — repeated manual runs after disabling reasoning confirmed the provider-output explanation.

## What Changes for `/10x-plan`

The completed reliability adjustment preserves privacy, uses a single foreground request, and keeps the 90-second deadline as a guardrail. Development-only timing diagnostics remain available for any future regression.

## Follow-up decision

The owner approved disabling reasoning with `reasoning.effort: "none"` on 2026-09-10. A synthetic request using the pinned provider accepted it, returned HTTP 200 in 934 ms with an 841-byte body, and produced a valid candidate structure. Five subsequent manual real-note requests completed consistently in approximately 10–12 seconds. A completion-token cap was not applied because the same pinned provider rejected `max_completion_tokens` with HTTP 404 while `require_parameters` is enabled.

## References

- `src/lib/extraction/openrouter.ts:9,72-116`
- `src/lib/extraction/endpoint.ts:61-69`
- `src/lib/extraction/client.ts:44-75`
- `src/components/anchors/AnchorBriefing.tsx:85-96`
- `context/foundation/private-extraction-contract.md:35-41,47-52`
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [OpenRouter provider routing](https://openrouter.ai/docs/guides/routing/provider-selection)
- [DeepSeek V4 Flash 0731 model/provider page](https://openrouter.ai/deepseek/deepseek-v4-flash-0731)
