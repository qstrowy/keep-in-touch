# Wafer provider switch verification

Date: 2026-11-19. Owner authorization: "Please instruct me how to do it, or do it for me", following the recommendation to switch to Wafer while retaining the model.

## Change

- Production Worker: `keep-in-touch` at https://keep-in-touch.qstrowy.workers.dev/.
- Cloudflare Dashboard: Production > Settings > Runtime variables and secrets > `OPENROUTER_PROVIDER` > Edit > Rotate > value `wafer/us` > Deploy.
- New version: `7d1e613e`, displayed as 100% Ready and receiving 100% production traffic.
- Previous version: `2b72fb67`, based on commit `671e5bc856346dc81590d8133a81f44dd56e0aa3`.
- Model retained: `deepseek/deepseek-v4-flash-0731`.
- Local `.dev.vars` provider changed to `wafer/us`; `.env` contains no provider setting and was left unchanged.
- No application code, authentication credential, automatic retry, fallback, or observability change.

## Before deployment

The actual extractor was invoked with fictional demo notes and temporary in-memory provider overrides. No real relationship records were used. The public ZDR catalog listed both tested routes with `safety_retention: false`; requests retained pinned routing, no fallback, denied data collection, ZDR enforcement, and strict response validation.

| Route        | Fictional record | Result                   | Elapsed  |
| ------------ | ---------------- | ------------------------ | -------- |
| `wafer/us`   | Marta            | Valid response, 3 topics | 3,079 ms |
| `wafer/us`   | Adam             | Valid response, 2 topics | 1,399 ms |
| `nebius/fp8` | Marta            | Valid response, 3 topics | 1,165 ms |
| `nebius/fp8` | Adam             | Valid response, 2 topics | 2,983 ms |

These small samples establish compatibility, not long-term reliability or a latency guarantee.

## Production verification

Using the existing signed-in Google Chrome session after the new version became active:

- Selected Marta and explicitly regenerated Core Topics. Observed a fresh list of three topics covering the fictional interview, puppy, and running notes, without an extraction error.
- Selected Adam and explicitly regenerated Core Topics. Observed two topics covering the fictional office move and tea preference, without an extraction error.
- Left the successful application view open in Chrome.
- No raw request, response, cookie, key, or authorization material was saved.

The production upstream HTTP response was not inspected; this verification uses Cloudflare's deployment confirmation and the application's rendered success states. Existing account logging/privacy settings were not changed or re-certified; the prior owner confirmation remains recorded in the private extraction contract.

## Recovery

If Wafer becomes unavailable, edit the same production provider setting to a verified route and deploy. The previous value was `deepinfra/fp8`, which showed intermittent 429 failures during this investigation. `nebius/fp8` passed the compatibility probes but is not configured as a fallback. A future provider change should repeat current policy checks and a synthetic production test.

Sources: https://openrouter.ai/api/v1/endpoints/zdr and https://developers.cloudflare.com/workers/configuration/secrets/.
