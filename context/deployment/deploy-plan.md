# First Infrastructure Release Plan

## Release decision

- Release the current starter as a protected infrastructure smoke release, not the KeepInTouch MVP.
- Deploy `main` to Cloudflare Workers at `keep-in-touch.qstrowy.workers.dev`.
- Protect production and preview URLs with Cloudflare Access using the owner's Cloudflare account and a 24-hour session.
- Use free Cloudflare and Supabase tiers only; require approval before any paid upgrade.
- Use the existing Supabase project in Paris (`eu-west-3`); the dashboard's Europe Central selection resolved there.
- Let Cloudflare Workers Builds deploy `main`; keep GitHub Actions validation-only.
- Tag the verified deployment as `v0.0.1-infra.1`.

## Repository preparation

- [x] Upgrade the vulnerable scaffold to Node 22.23.2, Astro 7.2.4, Cloudflare adapter 14.2.3, React adapter 6.0.4, Wrangler 4.125.0, Supabase JS 2.112.3, Supabase SSR 0.12.4, Supabase CLI 2.115.0, Astro Check 0.9.10, and Node types 22.20.1.
- [x] Remove the obsolete Vite 7 override, apply non-forced transitive fixes, and require a zero-finding `npm audit`.
- [x] Disable Astro sessions and use compile-time image processing so no Cloudflare KV or Images resources are provisioned.
- [x] Remove the sitemap integration for this protected shell.
- [x] Rename `SUPABASE_KEY` to `SUPABASE_PUBLISHABLE_KEY`; never use a Supabase secret or service-role key.
- [x] Declare required Worker secrets and explicitly enable `workers_dev` and preview URLs.
- [x] Remove Supabase values from GitHub Actions, align CI with `.nvmrc`, and update Node-24-based GitHub actions.
- [x] Align the stack and infrastructure foundation documents with Astro 7 and Cloudflare Workers.
- [x] Set the package version to `0.0.1-infra.1`.

## Accounts and deployment

- [x] Create Cloudflare and Supabase accounts on their free tiers.
- [ ] Confirm MFA is enabled and recovery information is stored securely for both provider accounts.
- [x] Select the existing `KeepInTouch` Supabase project in Paris and retain its project URL and publishable key.
- [x] Create an inactive Worker named `keep-in-touch`, then protect preview and production traffic with a 24-hour Access policy for the owner's Cloudflare account.
- [x] Authenticate Wrangler and Supabase CLI and link the Supabase project without exposing the database password.
- [x] Add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` as Worker runtime secrets.
- [x] Upload and verify the undeployed `release-candidate` preview.
- [x] Merge the release branch only after local and GitHub CI gates pass.
- [x] Connect the existing Worker to `qstrowy/keep-in-touch`: production branch `main`, non-production builds enabled, `SKIP_DEPENDENCY_INSTALL=1`, build `npm ci && npm run build`, production deploy `npx wrangler deploy`, preview deploy `npx wrangler versions upload`.
- [x] Receive explicit human approval before the first production deployment.
- [x] Promote Worker version `3fbd3ed4-dfa9-4702-94db-5bf07422b679` to 100% and enable the protected `workers.dev` production route.

## Deployment result

- Production: `https://keep-in-touch.qstrowy.workers.dev`
- Protected preview: `https://release-candidate-keep-in-touch.qstrowy.workers.dev`
- Active Worker version: `3fbd3ed4-dfa9-4702-94db-5bf07422b679` at 100%
- Rollback Worker version: `06f21921-9b99-4a26-afe6-eb9dd984c98e`
- Supabase region: Paris (`eu-west-3`)
- Access: all Worker traffic, Cloudflare account identity, 24-hour session

## Verification and release

- [x] Pass `npm ci`, `npx astro sync`, `npm run lint`, `npm run build`, and `npm audit`.
- [x] Confirm the generated deployment contains no KV or Images binding.
- [x] Confirm Access blocks unauthenticated visitors and admits the owner's configured Cloudflare account.
- [x] Confirm the landing page and static assets load and that both Supabase runtime bindings are present.
- [x] Confirm `/dashboard` redirects to application sign-in from an authenticated Access session.
- [x] Inspect deployment history and record rollback version `06f21921-9b99-4a26-afe6-eb9dd984c98e`.
- [x] Monitor production error-only logs during authenticated traffic; no Worker errors were emitted.
- [x] Confirm no secret or service-role credentials appear in Git, HTML, build output, or GitHub Actions; only the intended publishable client key is used at runtime.
- [x] Retain the inactive bootstrap version as the known rollback target; no release failure required rollback.
- [ ] After successful verification, create and push annotated tag `v0.0.1-infra.1` at the deployed commit.

## Out of scope

The usable MVP, passwordless authentication, product database schema, LLM integration, custom domain, production email delivery, real relationship data, and paid plans remain out of scope.
