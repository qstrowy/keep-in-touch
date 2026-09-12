# Public Production Entry — Plan Brief

> Full plan: `context/changes/public-production-entry/plan.md`
> Frame brief: `context/changes/public-production-entry/frame.md`

## What & Why

The production deployment still applies an infrastructure-smoke Access gate in front of the product’s public sign-in route, preventing intended visitors from entering the app. The product needs a production-only public entry point: visitors can reach a branded sign-in page and self-register by email, while unauthenticated visitors remain unable to enter the dashboard or make authenticated extraction requests. Local development remains unchanged; the MVP targets one main remote production environment.

## Starting Point

Cloudflare Access currently sits in front of all production and preview Worker traffic, but Astro and Supabase already provide an independent application boundary for the dashboard and extraction endpoint. The root page still advertises the Astro starter, while the auth pages use the existing cosmic styling without a complete KeepInTouch identity.

## Desired End State

The main production URL publicly serves a small KeepInTouch welcome page and branded passwordless sign-in journey. Supabase continues to create and authenticate accounts, signed-out users remain outside the dashboard and extraction path, and preview URLs remain protected when the live Cloudflare controls support the documented production/preview split.

## Key Decisions Made

| Decision                 | Choice                                                                  | Why                                                                                                     | Source       |
| ------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------ |
| Production audience      | Public self-service email accounts                                      | It is the smallest MVP model and matches the existing `shouldCreateUser` flow.                          | Frame        |
| Root route               | Branded welcome with one sign-in action                                 | Gives new visitors context without building a marketing site or collapsing the form into the root.      | Plan         |
| Auth UI scope            | Welcome, sign-in, check-email, and page titles                          | Creates one coherent entry journey while leaving the dashboard unchanged.                               | Plan         |
| Preview access           | Keep previews behind Cloudflare Access when easily separable            | Prevents accidental exposure while retaining the existing remote diagnostic surface.                    | Frame / Plan |
| Abuse protection         | Rely on current Supabase limits                                         | Keeps the MVP free of CAPTCHA, invite, and throttling work while explicitly accepting quota-abuse risk. | Plan         |
| Rollout order            | Deploy behind Access, then make production public                       | Verifies application code before changing the external visitor gate.                                    | Plan         |
| Rollback                 | Restore production Access; disable the production route in an emergency | Reverses the external change quickly without inventing an application feature flag.                     | Plan         |
| Relationship persistence | Remains browser-local                                                   | Cross-device persistence is deliberately parked as a separate roadmap idea.                             | Frame        |

## Scope

**In scope:**

- Product branding for the public welcome, sign-in, check-email, and document titles.
- Browser regression coverage for public entry and signed-out application boundaries.
- Current operational documentation for public production and protected previews.
- A human-approved production deployment and Cloudflare Access configuration change.
- Clean-browser production magic-link verification and a recorded rollback path.

**Out of scope:**

- Supabase database persistence or cross-device synchronization.
- Roles, invitations, account approval, CAPTCHA, or custom throttling.
- Public previews, a second remote environment, or a custom domain.
- Dashboard redesign, extraction changes, or provider-wide infrastructure testing.

## Architecture / Approach

Cloudflare continues to host the Worker, but the production URL no longer requires Cloudflare identity. Astro serves public entry routes, Supabase establishes the application session, middleware protects the dashboard, and the extraction endpoint validates that session independently. Access remains only around preview URLs if the live per-Worker controls allow the documented split.

## Phases at a Glance

| Phase                 | What it delivers                                          | Key risk                                                                 |
| --------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1. Brand public entry | A coherent KeepInTouch welcome and auth journey           | Accidentally changing established passwordless behavior                  |
| 2. Lock boundaries    | Browser proof of public entry and private app routes      | Mistaking synthetic auth coverage for a real hosted sign-in proof        |
| 3. Release publicly   | Public production, protected preview, and tested rollback | External Access misconfiguration exposing previews or blocking callbacks |

**Prerequisites:** Cloudflare and Supabase owner access, installed Playwright browser, current Worker secrets, exact production callback allowlist, and explicit approval before deployment or Access mutation.

**Estimated effort:** Approximately three focused implementation sessions across three phases, plus one short real-email production verification.

## Open Risks & Assumptions

- The live Cloudflare dashboard exposes a small reversible production/preview protection split as documented; otherwise Phase 3 stops before changing Access.
- Public self-service can consume email quota or attract abuse; CAPTCHA and custom throttling remain deferred until there is evidence they are needed.
- Dashboard route disable is only an emergency control because a later deploy can re-enable it while `workers_dev: true` remains configured.
- Local E2E uses synthetic owners; the hosted magic-link flow must be verified manually after deployment.
- Browser-local relationship data remains unavailable on another device or browser.

## Success Criteria (Summary)

- Signed-out visitors can reach the branded production welcome and sign-in pages without Cloudflare Access.
- `/dashboard` and extraction remain protected by the application session, and the real production magic-link flow reaches a refreshable dashboard session.
- Preview URLs remain Access-protected, and the prior production Access state is recorded as the preferred rollback.
