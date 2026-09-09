---
project: KeepInTouch
researched_at: 2026-08-22
recommended_platform: Cloudflare Workers
runner_up: Render
context_type: mvp
tech_stack:
  language: TypeScript
  framework: Astro 7.2.4 with React 19
  runtime: Cloudflare Workers via @astrojs/cloudflare 14.2.3
---

## Recommendation

**Deploy on Cloudflare Workers.**

Cloudflare Workers is the only candidate that runs the repository's existing Astro adapter and Wrangler configuration without a runtime migration. It leads after weighting the current stack, the equal cost-versus-DX preference, the lack of platform familiarity, the single-region requirement, and the uncertainty around future persistent connections. Render is the runner-up because it offers persistent Node processes and predictable pricing, but it requires replacing the Cloudflare adapter and paying for an always-on instance to meet the two-second briefing target.

The target is Workers, not Pages. Astro 7 with `@astrojs/cloudflare` 14 deploys full-stack applications to Workers; Pages support is not available in this adapter generation. Cloudflare recommends Workers Static Assets for new projects. Evidence: [Astro Cloudflare adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/) and [Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/).

## Platform Comparison

Pass = 2, Partial = 1, Fail = 0. CLI maintenance, managed operation, and stable deployment APIs are weighted more heavily than MCP availability.

| Platform           | CLI-first | Managed / serverless | Agent-readable docs | Stable deploy API | MCP / integration | Total |
| ------------------ | --------- | -------------------- | ------------------- | ----------------- | ----------------- | ----: |
| Cloudflare Workers | Pass      | Pass                 | Pass                | Pass              | Pass              |    10 |
| Render             | Pass      | Pass                 | Pass                | Pass              | Pass              |    10 |
| Vercel             | Pass      | Pass                 | Pass                | Pass              | Partial           |     9 |
| Railway            | Partial   | Pass                 | Pass                | Pass              | Pass              |     9 |
| Netlify            | Partial   | Pass                 | Pass                | Pass              | Pass              |     9 |
| Fly.io             | Pass      | Partial              | Pass                | Pass              | Partial           |     8 |

**Cloudflare Workers.** Exact stack fit breaks the scoring tie with Render. Wrangler 4.125.0 provides deterministic deploy, version listing, rollback, secrets, and log-tail commands. Static asset requests are free; dynamic requests may fit the free tier, but SSR/auth commonly makes the $5/month paid plan a safer budget. Workers cannot host an arbitrary always-on process, but GA Queues, Workflows, Durable Objects, and WebSockets cover likely future async or realtime needs. Official docs expose Markdown and `llms.txt`, and Cloudflare provides managed MCP servers whose maturity is not explicitly labelled. Evidence: [pricing](https://developers.cloudflare.com/workers/platform/pricing/), [limits](https://developers.cloudflare.com/workers/platform/limits/), and [agent-readable docs](https://developers.cloudflare.com/docs-for-agents/).

**Render.** Render scores well operationally and supports long-lived Node processes, WebSockets, workers, managed Postgres, and a GA MCP server. KeepInTouch would need to migrate to an Astro 7-compatible Node adapter and add a standalone start command. The free service sleeps and can take roughly one minute to wake, so the two-second briefing requirement implies the approximately $7/month Starter service. Evidence: [web services](https://render.com/docs/web-services), [free services](https://render.com/docs/free), and [MCP GA](https://render.com/changelog/render-mcp-server-is-now-generally-available).

**Vercel.** Vercel offers excellent CLI, preview, rollback, and documentation support, and its function duration can accommodate the 15–120-second extraction window. It requires replacing and revalidating the Cloudflare adapter with the Astro 7-compatible Vercel adapter. The official MCP server remains Beta, WebSocket serving is Public Beta, and first-party Postgres and KV products were sunset. Evidence: [deployment CLI](https://vercel.com/docs/projects/deploy-from-cli) and [MCP](https://vercel.com/docs/agent-resources/vercel-mcp).

**Railway.** Railway supports persistent processes and long HTTP requests, publishes agent-readable docs, and offers official MCP and Codex integrations. It requires migration to the Node adapter. Rollback has no dedicated CLI command and currently uses a raw GraphQL mutation, while database templates are hosted containers rather than fully managed DBaaS. Its Hobby plan starts at $5/month. Evidence: [pricing](https://docs.railway.com/pricing), [deployment API](https://docs.railway.com/integrations/api/manage-deployments), and [MCP](https://docs.railway.com/ai/mcp-server).

**Netlify.** Netlify supports Astro SSR through Netlify Functions and has official MCP and readable docs. Its immutable 60-second synchronous function limit conflicts with the allowed 120-second extraction time; the long path would require a background function and status polling. Runtime-log CLI works, but the current deploy-log command has a known issue. Migration to the Netlify adapter is otherwise small. Evidence: [function configuration](https://docs.netlify.com/build/functions/configuration/), [pricing](https://www.netlify.com/pricing/), and [MCP](https://github.com/netlify/netlify-mcp).

**Fly.io.** Fly.io provides persistent Machines, WebSockets, strong CLI operations, and readable documentation. It requires a Node adapter, checked-in container configuration, explicit port/host handling, and more operational ownership than the serverless alternatives. There is no continuing free tier, Tigris object storage is Beta, and the official MCP path retains experimental sharp edges. Evidence: [Astro deployment](https://fly.io/docs/js/frameworks/astro/), [pricing](https://fly.io/docs/about/pricing/), and [MCP](https://fly.io/docs/mcp/flyctl-server/).

### Shortlisted Platforms

#### 1. Cloudflare Workers (Recommended)

It preserves the chosen runtime and adapter, provides the best agent-operable toolchain, and offers the lowest migration and operational burden. The current long LLM request can be awaited synchronously because network waiting does not consume Worker CPU, while Queues or Workflows remain available if reliable background completion becomes necessary.

#### 2. Render

Render is the best escape hatch if KeepInTouch later requires an ordinary persistent Node process. It has predictable monthly pricing and strong operations, but the Node-adapter migration and always-on service make it slower and more expensive for this MVP.

#### 3. Vercel

Vercel is the strongest alternative serverless experience. It trails because it adds an adapter migration and its MCP and WebSocket capabilities are not GA.

## Anti-Bias Cross-Check: Cloudflare Workers

### Devil's Advocate — Weaknesses

1. The free plan's 10 ms CPU allowance is easy to exceed with SSR, authentication, encryption, JSON processing, or LLM-response parsing, even though waiting on the network does not consume CPU.
2. A synchronous 15–120-second extraction remains attached to the client request. Mobile network changes, navigation, or tab closure can cancel unfinished work, while `waitUntil()` extends execution by only 30 seconds.
3. Workers is not an ordinary Node server. A future LLM or encryption dependency may rely on native binaries, unsupported Node behavior, or process-level state that `nodejs_compat` does not reproduce.
4. Supabase remains an external operational and regional dependency. A poor region choice can dominate the two-second briefing latency regardless of Workers' edge execution.
5. Adding D1, Durable Objects, Queues, Workflows, or other bindings later increases platform coupling and makes a future migration more expensive.

### Pre-Mortem — How This Could Fail

Six months after launch, the team realized that having the Cloudflare adapter already installed was not the same as validating the architecture. Dynamic SSR requests exceeded the free CPU allowance because authentication, encryption, and note processing consumed more CPU than expected. Long LLM requests appeared reliable during development, but mobile users changed networks or closed the page, cancelling extraction before results were stored. Retries created duplicate topics because idempotency had not been designed.

Supabase was provisioned in a region poorly aligned with application traffic, so briefings sometimes missed the two-second target. A Node-oriented LLM SDK later relied on behavior that `nodejs_compat` did not fully reproduce, forcing an urgent replacement. Preview, staging, and production secrets drifted because environment handling was undocumented. Finally, a Worker rollback restored application code but not an incompatible Supabase migration. The platform remained available; the failure came from treating serverless execution, external data, and deployment rollback as one atomic system when they were separate operational surfaces.

### Unknown Unknowns

- `@astrojs/cloudflare` 14 targets Workers. `wrangler pages deploy` is the wrong path for this repository.
- Astro development and preview use `workerd`; a separate `wrangler dev` loop is unnecessary. `CLOUDFLARE_ENV` is selected at build time and must be handled consistently.
- Versioned and aliased preview URLs are public by default. They need Cloudflare Access before previews contain real relationship data, and runtime logs are not currently available for preview URLs. Evidence: [Preview URLs](https://developers.cloudflare.com/workers/versions-and-deployments/preview-urls/).
- The adapter can automatically provision a Cloudflare Images binding. Image behavior and cost should be made explicit before contact photos are introduced.
- `wrangler secret put` immediately creates and deploys a new Worker version. Safer staged rotation uses `wrangler versions secret put` followed by an approved deployment. Evidence: [Workers secrets](https://developers.cloudflare.com/workers/configuration/secrets/).

## Operational Story

- **Preview deploys**: Connect `qstrowy/keep-in-touch` to Workers Builds, use `main` as the production branch, and enable non-production branch builds. Production uses `npm run build` then `npx wrangler deploy`; preview branches use `npx wrangler versions upload`, which creates stable branch and version preview URLs without promoting them. Protect preview URLs with Cloudflare Access before using real personal data. Preview URL runtime logs are currently unavailable. Evidence: [build branches](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/) and [build configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).
- **Secrets**: Store `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and future LLM credentials as Workers Secrets, never as committed Wrangler variables. Declare required secret names in `wrangler.jsonc`, use `.dev.vars` only locally, and scope the deployment API token to this Worker/account without DNS or billing permissions. Rotate with `npx wrangler versions secret put <KEY>`, validate the preview version, and then deploy it; secret values remain hidden from Wrangler and the dashboard.
- **Rollback**: Run `npx wrangler deployments list --json`, select a known-good version, then execute `npx wrangler rollback <VERSION_ID> --message "reason"`. The code rollback is immediate across routes, but it cannot restore deleted/modified Cloudflare resources, Supabase schema, or data. Evidence: [Workers rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/).
- **Approval**: An agent may build, lint, upload preview versions, and inspect logs unattended. Production promotion, secret rotation, custom-domain changes, database migrations, resource deletion, and rollback require explicit human approval. Dropping a database or deleting a Worker remains human-only.
- **Logs**: Read GitHub pipeline state with `gh run list` and `gh run view <RUN_ID> --log-failed`. Read production runtime logs with `npx wrangler tail keep-in-touch --format json`, optionally filtering by `--status error`. Use the official Cloudflare observability MCP only for scoped, read-only discovery; do not grant it destructive permissions.

### Private extraction secret provisioning

Keep the three OpenRouter values out of Git, Wrangler configuration, Astro client variables, and browser storage. `.env.example` contains names only; `.dev.vars` is for local synthetic development and must not be committed.

For a human-approved preview, provision each value as a Cloudflare Worker Secret using the tested Wrangler version. These commands prompt for values and create a new version; run them only with synthetic data and record the resulting version for review:

```text
npx wrangler versions secret put OPENROUTER_API_KEY
npx wrangler versions secret put OPENROUTER_MODEL
npx wrangler versions secret put OPENROUTER_PROVIDER
npx wrangler versions upload
```

Before provisioning, confirm the exact OpenRouter model/provider route is ZDR-compatible, pinned, and configured with prompt logging disabled and no fallback. After the first human-approved deployment, make one authenticated same-origin request containing only a synthetic `note`, then inspect the response and available logs for neutral failure behavior and absence of key or note content. Do not send real notes until the private-extraction contract records the route, evidence source/date, secret location, and synthetic outcome. Repeat this review after provider changes, secret rotation, logging/observability changes, or production promotion.

## Passwordless authentication operation

Before relying on hosted magic links, a human owner completes these external Supabase and Cloudflare steps. They are configuration changes, not repository changes, and require explicit approval.

1. In Supabase Dashboard **Authentication → URL Configuration**, set the Site URL to `https://keep-in-touch.qstrowy.workers.dev` and allow these exact callback URLs:
   - `https://keep-in-touch.qstrowy.workers.dev/api/auth/callback`
   - `https://release-candidate-keep-in-touch.qstrowy.workers.dev/api/auth/callback`
     Keep the allowlist limited to known, Cloudflare-Access-protected application origins; do not add wildcard or user-provided destinations.
2. In Supabase Dashboard **Authentication → SMTP Settings**, configure and verify a production SMTP provider and sender identity. Keep SMTP credentials only in Supabase; do not place them in this repository, Worker configuration, or browser-accessible environment values.
3. In an Access-authorized browser, request a sign-in link from the protected production URL or the stable preview URL. Open the received link in that same browser and confirm it reaches `/dashboard`; refresh once to confirm the session persists.
4. Sign out, then retry a missing, expired, or already-used callback link. It must return to sign-in with generic retry guidance and no authenticated session. Record only the outcome in deployment notes—never a magic-link URL, session cookie, or email contents.

Treat Site URL, redirect allowlist, SMTP, and Cloudflare Access policy changes as separate human-approved operational actions. The application deliberately has no caller-controlled post-login redirect.

## Risk Register

| Risk                                                           | Source           | Likelihood | Impact | Mitigation                                                                                                          |
| -------------------------------------------------------------- | ---------------- | ---------: | -----: | ------------------------------------------------------------------------------------------------------------------- |
| Free-plan CPU allowance is insufficient for SSR/auth           | Research finding |          M |      M | Load-test representative authenticated routes; budget for the $5 Workers paid plan before launch.                   |
| Mobile disconnect cancels long extraction                      | Pre-mortem       |          M |      H | Make extraction requests idempotent; if failures appear, move completion to GA Queues or Workflows and poll status. |
| Retry creates duplicate topics or follow-ups                   | Pre-mortem       |          M |      H | Attach an interaction/extraction idempotency key and enforce a unique persistence constraint.                       |
| Node-oriented dependency fails under `workerd`                 | Devil's advocate |          M |      H | Test each LLM/encryption SDK with `npm run dev` and a deployed preview before adopting it.                          |
| Supabase region causes briefing latency                        | Devil's advocate |          M |      H | Choose the nearest appropriate Supabase region and measure the complete authenticated briefing path.                |
| Code rollback is incompatible with database state              | Pre-mortem       |          M |      H | Use backward-compatible, expand-and-contract migrations and document a separate database recovery procedure.        |
| Preview exposes private relationship data                      | Unknown unknowns |          M |      H | Protect all preview URLs with Cloudflare Access and use synthetic data outside production.                          |
| Preview URL has no runtime logs                                | Research finding |          H |      M | Keep a protected staging Worker for reproducible diagnostics and avoid relying solely on ephemeral previews.        |
| Pages commands are used with a Workers adapter                 | Unknown unknowns |          M |      M | Standardize `wrangler deploy` and `wrangler versions upload`; remove Pages wording from future deployment plans.    |
| Secret rotation deploys unexpectedly                           | Research finding |          M |      H | Use `wrangler versions secret put`, preview the version, and require human approval before promotion.               |
| Images binding is provisioned unexpectedly                     | Unknown unknowns |          L |      M | Decide whether Cloudflare Images is needed and configure image service behavior explicitly before adding photos.    |
| Workers-specific bindings create lock-in                       | Devil's advocate |          L |      M | Keep domain logic independent of bindings and isolate platform adapters behind small integration modules.           |
| Smart Placement or experimental placement is treated as stable | Research finding |          L |      M | Do not rely on Smart Placement (Beta) or host-based placement (Experimental) for MVP acceptance criteria.           |

## Getting Started

1. Authenticate the pinned Wrangler CLI: `npx wrangler login`. Keep `wrangler` at the repository's tested 4.125.0 version until an explicit dependency update.
2. Confirm `wrangler.jsonc` names the Worker `keep-in-touch`, targets `@astrojs/cloudflare/entrypoints/server`, and enables preview URLs. Declare required secret names without placing their values in source control.
3. Add deployment secrets with `npx wrangler secret put SUPABASE_URL` and `npx wrangler secret put SUPABASE_PUBLISHABLE_KEY`; add the LLM key the same way when its provider is selected. These commands deploy a new version, so perform them behind the human approval gate.
4. Develop with `npm run dev`, which already runs the Astro 7 Cloudflare adapter through `workerd`. Validate with `npm run lint` and `npm run build`; do not introduce a redundant legacy `wrangler dev` workflow.
5. Deploy with `npx wrangler deploy`, verify with `npx wrangler deployments list --json`, and inspect runtime behavior with `npx wrangler tail keep-in-touch --format json`.

## Out of Scope

The following were not evaluated in this research:

- Docker image configuration
- CI/CD pipeline setup
- Production-scale architecture (multi-region, HA, DR)
