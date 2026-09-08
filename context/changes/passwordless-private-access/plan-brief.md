# Introduce passwordless private access — Plan Brief

> Full plan: `context/changes/passwordless-private-access/plan.md`

## What & Why

S-01 replaces the starter's password sign-in and sign-up with one self-service email magic-link flow. It satisfies FR-001 while preserving the application's owner-only private access boundary and supplying the stable Supabase user ID needed by later local-data features.

## Starting Point

Supabase SSR cookies, middleware-based `/dashboard` protection, and sign-out already work. The remaining auth screens and API routes are entirely password-based; local Supabase also permits the wrong callback origin for normal Astro development.

## Desired End State

The public experience has one email-only sign-in form and a neutral “check your email” screen. A valid one-click link establishes the SSR session server-side and enters `/dashboard`; an invalid or expired link leads safely back to retry without exposing provider details or account state.

## Key Decisions Made

| Decision | Choice | Why |
| --- | --- | --- |
| Provisioning | Self-service (`shouldCreateUser: true`) | A single owner can access the MVP without an invite workflow. |
| Email experience | One-click magic link | It is the lowest-friction phone experience and directly supports Supabase PKCE. |
| Request feedback | Neutral confirmation | It avoids account-existence disclosure while preserving a simple recovery path. |
| Destination | Fixed `/dashboard` | It matches the existing guard and eliminates open-redirect risk. |
| Invalid links | Generic retry at sign-in | No partial session or raw provider details are exposed. |
| Legacy sign-up | Redirect to sign-in | Old bookmarks keep working without retaining password capability. |
| Verification | Vitest plus manual email flow | Security rules gain regression coverage without adding a browser-test stack. |
| Hosted setup | Documented human checklist | Auth URL and SMTP changes remain explicit external approvals. |

## Scope

**In scope:** email-only magic-link request, server-side PKCE callback, safe errors and redirects, password-flow removal, local callback configuration, focused tests, and hosted-auth runbook.

**Out of scope:** passwords, social/SMS login, MFA, invites, product data, Cloudflare configuration, external account mutations, and browser E2E tooling.

## Architecture / Approach

`email form → server magic-link request → Supabase email → server PKCE callback → SSR cookies → /dashboard`

The existing request-scoped Supabase client owns both calls, so it can write and consume the PKCE/session cookies. Middleware and sign-out remain the private-route enforcement seam.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Request a link | One email-only entry and local callback config | Account-state disclosure or residual password UI |
| 2. Complete sessions | Safe callback, recovery, and unified navigation | Broken PKCE cookie flow or unsafe redirects |
| 3. Verify and prepare | Tests and hosted Auth runbook | Hosted redirect/SMTP setup is not performed or tested deliberately |

**Prerequisites:** F-01's Node 22 validation baseline; current Supabase URL and publishable key; local Supabase/Inbucket for manual testing.
**Estimated effort:** ~2–3 focused sessions across 3 phases.

## Open Risks & Assumptions

- A magic link must be opened in the same browser that requested it so the PKCE verifier cookie is available.
- Hosted Supabase needs manually configured redirect URLs and production SMTP before it can deliver reliable real-user emails.
- Cloudflare Access still applies when users follow a hosted callback, so testing requires an Access-authorized browser.

## Success Criteria (Summary)

- An owner requests a neutral email sign-in link and reaches `/dashboard` through a valid callback.
- Bad or replayed links cannot establish a session, and password capability no longer appears in the app.
- Tests, lint, build, local configuration, and the hosted-auth runbook verify the defined boundary without a new data or Worker resource.
