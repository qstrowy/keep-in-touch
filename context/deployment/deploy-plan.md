# First Infrastructure Release Plan

## Release decision

- Release the current starter as a protected infrastructure smoke release, not the KeepInTouch MVP.
- Deploy `main` to Cloudflare Workers at `keep-in-touch.<account>.workers.dev`.
- Protect production and preview URLs with Cloudflare Access using one-time PIN and the owner's exact email.
- Use free Cloudflare and Supabase tiers only; require approval before any paid upgrade.
- Create Supabase in Frankfurt (`eu-central-1`).
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

- [ ] Create Cloudflare and Supabase accounts, enable MFA, and store recovery information securely.
- [ ] Create the Supabase project in Frankfurt and retain its project URL and publishable key.
- [ ] Create a placeholder Worker named `keep-in-touch`, then protect all traffic with a 24-hour Access policy allowing only the owner's exact email through one-time PIN.
- [ ] Authenticate Wrangler and Supabase CLI and link the Supabase project.
- [ ] Add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` as Worker runtime secrets.
- [ ] Upload and verify an undeployed `release-candidate` preview.
- [ ] Merge the release branch only after local and GitHub CI gates pass.
- [ ] Connect the existing Worker to `qstrowy/keep-in-touch`: production branch `main`, non-production builds enabled, `SKIP_DEPENDENCY_INSTALL=1`, build `npm ci && npm run build`, production deploy `npx wrangler deploy`, preview deploy `npx wrangler versions upload`.
- [ ] Require explicit human approval before the first production deployment.

## Verification and release

- [x] Pass `npm ci`, `npx astro sync`, `npm run lint`, `npm run build`, and `npm audit`.
- [x] Confirm the generated deployment contains no KV or Images binding.
- [ ] Confirm Access blocks unauthenticated visitors and admits only the configured email.
- [ ] Confirm the landing page and static assets load, Supabase is configured, and `/dashboard` redirects to application sign-in.
- [ ] Inspect deployment history and production error logs.
- [ ] Confirm no secrets appear in Git, HTML, build logs, or GitHub Actions.
- [ ] On failure, roll back to the known-good version and leave the release untagged.
- [ ] After successful verification, create and push annotated tag `v0.0.1-infra.1` at the deployed commit.

## Out of scope

The usable MVP, passwordless authentication, product database schema, LLM integration, custom domain, production email delivery, real relationship data, and paid plans remain out of scope.
