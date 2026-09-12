# Public Production Entry Implementation Plan

## Overview

Make the production KeepInTouch application reachable without the outer Cloudflare Access login while retaining Supabase passwordless authentication as the application identity boundary. Replace the remaining starter-facing public UI with a small branded welcome, sign-in, and check-email journey experience, prove the unauthenticated application boundaries locally, and release through a reversible production configuration change that keeps Worker preview URLs protected when Cloudflare supports the documented production/preview split.

## Current State Analysis

The production Worker was originally released as a protected infrastructure smoke environment. Its deployment record says Cloudflare Access covers all Worker traffic, so visitors encounter that gate before Astro can serve the public routes (`context/deployment/deploy-plan.md:5-7`, `context/deployment/deploy-plan.md:39-46`). Access is external account configuration; no Access policy is declared in `wrangler.jsonc`.

Inside the application, Supabase authentication already resolves the current user in middleware, redirects signed-out `/dashboard` requests to `/auth/signin`, and authenticates extraction requests independently (`src/middleware.ts:6-24`, `src/lib/auth/route-access.ts:1-5`, `src/pages/api/extractions/anchors.ts:14-40`). The passwordless request creates a user on first use and always derives its callback from the current origin (`src/lib/auth/passwordless.ts:36-60`).

The public root still presents “10x Astro Starter,” framework-oriented feature cards, and a starter default page title (`src/components/Welcome.astro:31-93`, `src/layouts/Layout.astro:9-13`). The sign-in and check-email pages use the application’s cosmic visual language but do not establish a complete KeepInTouch product identity (`src/pages/auth/signin.astro:8-22`, `src/pages/auth/check-email.astro:5-19`). Existing unit and browser tests prove route redirection, synthetic owner sessions, and local owner separation, but no browser test protects the public product entry or the unauthenticated extraction boundary (`src/lib/auth/route-access.test.ts:5-18`, `tests/e2e/harness.spec.ts:5-18`, `tests/e2e/ownership-smoke.spec.ts:8-39`).

## Desired End State

A signed-out visitor can open the production root and see a concise KeepInTouch welcome page, follow its email sign-in call to action, and complete the existing self-service magic-link flow. The sign-in and check-email pages visibly belong to the same product, while the dashboard and extraction endpoint remain unavailable without a valid Supabase session.

The main production `workers.dev` URL is public. Preview URLs remain behind Cloudflare Access if the live dashboard exposes the documented per-Worker production/preview controls; if the split is not straightforward, stop before changing Access and report the exact live configuration rather than broadening exposure. Production can be closed quickly by restoring its previous Access protection, with disabling the production `workers.dev` route retained as an emergency kill switch.

### Key Discoveries:

- Cloudflare documents that Access can protect a Worker's production URL, preview URLs, or both; preview URLs are public when enabled unless Access protects them.
- Cloudflare Access `Bypass` disables Access enforcement and request logging and has limitations when a Worker intercepts the request, so the plan prefers the dedicated production/preview protection controls rather than a permanent broad Bypass rule.
- Disabling a `workers.dev` route in the dashboard is reversible but temporary while `wrangler.jsonc` keeps `workers_dev: true`; a later Wrangler deployment can re-enable the route.
- Supabase Auth supplies provider rate limits, including per-user magic-link windows, but public self-registration still accepts the risk of email-quota abuse for this MVP. CAPTCHA, invite codes, and application throttling are intentionally deferred.
- Relationship data remains browser-local and owner-scoped. Cross-device persistence is a separate parked roadmap idea and is not part of this change (`context/foundation/roadmap.md:124`).

## What We're NOT Doing

- Moving relationship data into Supabase or adding cross-device synchronization.
- Adding roles, invites, account approval, CAPTCHA, custom throttling, or an administrator workflow.
- Treating Cloudflare Access as application authentication or adding Cloudflare identity handling to Astro.
- Making preview URLs public, using preview URLs with real relationship data, or creating another remote environment.
- Reworking the dashboard, relationship-data model, extraction contract, or timeout behavior.
- Performing a general Cloudflare or Supabase infrastructure audit.
- Rewriting the historical first infrastructure release record as if it had originally been public.
- Adding a custom domain in this change.

## Implementation Approach

First finish and verify the public-facing product UI without altering authentication behavior. Then add focused browser regression coverage around the public entry and the existing app-level access boundaries. Finally update the current infrastructure guidance, capture the live Cloudflare state, deploy the verified code while Access still protects production, and request explicit approval before separating production from preview protection. Preserve the observed pre-change policy as the rollback recipe.

## Critical Implementation Details

### Timing & lifecycle

Deploy the branded application before changing the external Access policy. The policy change is the last mutating step and requires explicit human approval. If the live Cloudflare controls cannot make production public while leaving previews protected with a small reversible change, stop the release phase rather than applying a broad Bypass or exposing previews.

### User experience spec

Use the existing cosmic visual language and the dashboard’s product promise rather than introducing a new visual system. The root remains a lightweight welcome page with one primary email sign-in action; `/auth/signin` remains the form route. Preserve existing validation, neutral server errors, check-email wording, form semantics, and magic-link behavior.

### Debug & observability

Do not log email addresses, callback URLs containing authentication codes, session cookies, or relationship data. Production verification records only status outcomes, deployment/version identifiers, the Access setting changed, and whether rollback controls were confirmed.

## Phase 1: Brand the public application entry

### Overview

Remove the starter identity from the public route and align the welcome, sign-in, and check-email surfaces with the existing KeepInTouch dashboard without changing route or authentication contracts.

### Changes Required:

#### 1. Application metadata

**File**: `src/layouts/Layout.astro`

**Intent**: Replace the starter default document title with the KeepInTouch product name while preserving explicit per-page titles.

**Contract**: The default layout title identifies KeepInTouch; auth pages use product-aware titles. The favicon and configuration warning behavior remain unchanged.

#### 2. Public welcome page

**Files**: `src/components/Welcome.astro`, `src/components/Topbar.astro`, `src/pages/index.astro`

**Intent**: Replace starter and framework copy with a concise product introduction using the existing dashboard promise and a single primary action to sign in with email.

**Contract**: `/` remains publicly routable, displays “KeepInTouch” as its primary heading, explains that it is a private place for people the user wants to keep in touch with, and links to `/auth/signin`. Authenticated visitors retain a path to `/dashboard`; sign-out behavior remains unchanged. Remove framework/version claims and developer-facing feature cards from the visitor experience.

#### 3. Branded auth continuation

**Files**: `src/pages/auth/signin.astro`, `src/pages/auth/check-email.astro`

**Intent**: Make the sign-in and post-request pages read as one KeepInTouch journey while reusing the existing form and visual primitives.

**Contract**: `/auth/signin` contains the KeepInTouch identity, the existing email form, self-service account explanation, and neutral error surface. `/auth/check-email` continues to avoid account enumeration and links back to sign-in. Form action, callback behavior, field validation, and current-origin redirect construction do not change.

### Success Criteria:

#### Automated Verification:

- Formatting and lint checks pass for the changed UI: `npx prettier --check src/layouts/Layout.astro src/components/Welcome.astro src/components/Topbar.astro src/pages/index.astro src/pages/auth/signin.astro src/pages/auth/check-email.astro && npm run lint`
- Production build completes with the Cloudflare adapter: `npm run build`
- Existing auth unit tests remain green: `npm test -- src/lib/auth/passwordless.test.ts src/lib/auth/route-access.test.ts`

**Implementation Note**: Do not pause for visual acceptance in this phase. Complete Phase 2 coverage first so the user can review the finished local behavior once.

---

## Phase 2: Lock the public and private application boundaries

### Overview

Add focused browser coverage for the newly branded public entry while preserving the established signed-out, owner-session, and extraction access behavior.

### Changes Required:

#### 1. Public-entry browser specification

**File**: `tests/e2e/public-entry.spec.ts`

**Intent**: Protect the visitor journey and application-level access boundary from regression without attempting to simulate Cloudflare Access locally.

**Contract**: The browser test proves that a signed-out visitor can load `/`, sees the KeepInTouch heading, reaches `/auth/signin` through the primary action, and sees an accessible email form. It also proves that direct signed-out navigation to `/dashboard` redirects to `/auth/signin` and that a valid same-origin extraction request without an authenticated test owner receives `401` without invoking a real provider.

#### 2. Existing auth and ownership regression suite

**Files**: `tests/e2e/harness.spec.ts`, `tests/e2e/ownership-smoke.spec.ts`, `src/lib/auth/route-access.test.ts`, `src/lib/auth/passwordless.test.ts`

**Intent**: Reuse the existing synthetic auth seam and owner-local smoke test; adjust selectors only where approved branding changes make that necessary.

**Contract**: Do not weaken the assertions that `/dashboard` rejects signed-out access, two synthetic owners remain distinct, and each owner sees only their browser-local records. Real Supabase sign-in remains a production manual check because the local E2E seam intentionally does not contact Supabase.

### Success Criteria:

#### Automated Verification:

- Public-entry browser checks pass: `npm run e2e -- tests/e2e/public-entry.spec.ts`
- Complete browser suite passes: `npm run e2e`
- Complete unit suite passes: `npm test`
- Repository quality gates pass: `npm run lint && npm run build && git diff --check`

#### Manual Verification:

- In the local app, the welcome, sign-in, and check-email screens form a coherent KeepInTouch journey on desktop and a narrow mobile viewport.
- Keyboard navigation reaches the welcome call to action, email field, and submit button with visible focus and understandable labels.
- The dashboard still looks and behaves as before after entering through the synthetic/local authenticated path.

**Implementation Note**: Pause after all automated checks pass for the user's single local UI acceptance pass. Do not deploy or change Cloudflare settings until that acceptance is recorded.

---

## Phase 3: Release a public production entry with rollback

### Overview

Update current operational guidance, deploy the verified UI behind the existing outer gate, capture the live Access configuration, and then make production public through the smallest reversible Cloudflare setting while keeping previews protected.

### Changes Required:

#### 1. Current infrastructure guidance

**File**: `context/foundation/infrastructure.md`

**Intent**: Replace the now-stale operational assumption that production and preview callbacks are both Access-protected with the approved public-production/protected-preview model.

**Contract**: Production is documented as publicly reachable but application-authenticated; previews remain Access-protected and synthetic-data-only. The hosted passwordless runbook uses the production origin without requiring an Access session, keeps exact Supabase callback allowlisting, and preserves human approval for deployment and external policy changes. Do not alter the historical facts in `context/deployment/deploy-plan.md`.

#### 2. Change-specific release record

**File**: `context/changes/public-production-entry/release.md`

**Intent**: Record a reproducible, secret-free release and rollback trail for this external configuration change.

**Contract**: Capture the pre-change production and preview protection state, deployed commit and Worker version, selected Cloudflare control, signed-out HTTP outcomes, real magic-link outcome, preview protection outcome, and rollback control. Never record email addresses, magic-link URLs, authentication codes, cookies, secrets, or relationship content.

#### 3. Production deployment and Access separation

**External systems**: Cloudflare Workers deployment and Cloudflare Access configuration

**Intent**: Publish the verified application and remove only the outer production visitor gate after the code is known-good.

**Contract**: With explicit human approval, deploy the committed version while production remains Access-protected and verify it from the currently authorized browser. Inspect the live per-Worker access controls and preserve their exact pre-change state. Prefer disabling Access protection for the production Worker URL while leaving preview protection enabled. Do not create a broad permanent Bypass policy. If this separation is not available as a small reversible operation, stop and report the blocker.

#### 4. Production verification and rollback controls

**External systems**: Production and preview `workers.dev` URLs, Supabase hosted passwordless flow

**Intent**: Demonstrate that public entry and app authentication work together before considering the release complete.

**Contract**: From a clean browser with no Cloudflare Access or Supabase session, production `/` and `/auth/signin` load without the Access wall; `/dashboard` redirects to sign-in; a same-origin unauthenticated extraction request returns `401`; a valid real magic link reaches and refreshes `/dashboard`; sign-out restores the signed-out boundary. The protected preview continues to show Cloudflare Access. Preferred rollback is restoring the captured production Access protection. Emergency rollback is disabling the production `workers.dev` route in the Cloudflare dashboard; record that a later Wrangler deploy can re-enable it while `workers_dev: true` remains configured.

### Success Criteria:

#### Automated Verification:

- Final repository verification passes immediately before deployment: `npm test && npm run e2e && npm run lint && npm run build && git diff --check`
- After the approved Access change, signed-out HTTP probes confirm production public routes respond without a Cloudflare Access redirect, `/dashboard` redirects to `/auth/signin`, and unauthenticated extraction returns `401`.
- A signed-out request to the stable preview URL still receives the expected Cloudflare Access challenge or redirect.

#### Manual Verification:

- The deployed branded experience is visually accepted before the Access policy changes.
- The live Cloudflare controls allow production to be made public while previews remain protected; the exact pre-change state and rollback action are recorded.
- A clean browser can request and complete one real production magic link, refresh the dashboard session, and sign out without encountering Cloudflare Access.
- The user explicitly approves the final production Access change and confirms the rollback control is acceptable.

**Implementation Note**: Production deployment and Cloudflare Access mutation are separate human-approved operations. If any post-change criterion fails, restore production Access immediately; if that is not available, disable the production `workers.dev` route and stop.

---

## Testing Strategy

### Unit Tests:

- Preserve email normalization, current-origin callback construction, self-service account creation, neutral request errors, and callback failure behavior.
- Preserve the route-access rule that `/dashboard` requires a user while `/auth/signin` remains public.
- Preserve extraction endpoint authentication and its `401` response for a valid unauthenticated request.

### Integration Tests:

- Browser-test the root-to-sign-in visitor path and accessible form surface.
- Browser-test signed-out dashboard redirection and unauthenticated extraction denial using the existing local E2E server.
- Keep the synthetic two-owner browser smoke as the regression proof for browser-local owner separation.
- Keep Cloudflare Access outside local E2E; verify it against the real production and preview hosts only after explicit approval.

### Manual Testing Steps:

1. Review the completed local welcome, sign-in, and check-email flow at desktop and narrow mobile widths.
2. Deploy the approved commit while production Access is still enabled and verify the branded pages from an Access-authorized browser.
3. Capture the live production and preview Access configuration and its rollback action without secrets.
4. After explicit approval, make only production public and open it in a clean browser.
5. Confirm root and sign-in load, direct dashboard access redirects, and unauthenticated extraction is rejected.
6. Request one real magic link, open it in the same clean browser, refresh `/dashboard`, and sign out.
7. Confirm the preview URL remains Access-protected.
8. If any check fails, restore production Access; use production-route disable only as the emergency fallback.

## Performance Considerations

The UI changes add no new network dependencies or persistent client work. Public traffic can increase SSR and authentication requests, but this MVP deliberately relies on existing Supabase Auth limits rather than adding CAPTCHA or custom throttling. Monitor actual email and authentication limits after release and open a separate change only if misuse or quota pressure appears.

## Migration Notes

No application data or schema migration is required. Existing browser-local relationship data remains keyed by the authenticated Supabase user ID. The only operational migration is the reversible Cloudflare Access scope change; capture its prior state before mutation. Do not change the Supabase production Site URL or exact callback allowlist unless live verification shows they are incorrect, in which case stop and obtain separate approval.

## References

- Frame brief: `context/changes/public-production-entry/frame.md`
- Existing infrastructure release: `context/deployment/deploy-plan.md`
- Current infrastructure guidance: `context/foundation/infrastructure.md`
- Cloudflare `workers.dev` production and preview access controls: https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
- Cloudflare preview URL access and toggles: https://developers.cloudflare.com/workers/versions-and-deployments/preview-urls/
- Cloudflare Access policy behavior: https://developers.cloudflare.com/cloudflare-one/access-controls/policies/
- Supabase Auth rate limits: https://supabase.com/docs/guides/auth/rate-limits

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Brand the public application entry

#### Automated

- [x] 1.1 Changed public UI passes formatting and lint checks — f4196a6
- [x] 1.2 Production build completes with the Cloudflare adapter — f4196a6
- [x] 1.3 Existing auth unit tests remain green — f4196a6

### Phase 2: Lock the public and private application boundaries

#### Automated

- [x] 2.1 Public-entry browser checks pass — 97aac00
- [x] 2.2 Complete browser suite passes — 97aac00
- [x] 2.3 Complete unit suite passes — 97aac00
- [x] 2.4 Repository quality gates pass — 97aac00

#### Manual

- [x] 2.5 Local public experience is visually accepted at desktop and mobile widths — 97aac00
- [x] 2.6 Keyboard navigation and accessible labels are accepted — 97aac00
- [x] 2.7 Existing dashboard behavior is accepted after local authenticated entry — 97aac00

### Phase 3: Release a public production entry with rollback

#### Automated

- [x] 3.1 Final repository verification passes immediately before deployment — 86d0314
- [x] 3.2 Signed-out production HTTP probes confirm application-level boundaries — 86d0314
- [x] 3.3 Signed-out preview probe confirms Cloudflare Access remains active — 86d0314

#### Manual

- [x] 3.4 Deployed branded experience is accepted before changing Access — 86d0314
- [x] 3.5 Live production and preview protection split and rollback action are recorded — 86d0314
- [x] 3.6 Real production magic-link session and sign-out flow pass in a clean browser — 86d0314
- [x] 3.7 Final production Access change and rollback control are approved — 86d0314
