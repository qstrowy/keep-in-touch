# Introduce passwordless private access Implementation Plan

## Overview

Replace the starter's password authentication with self-service, passwordless email magic links. A user requests one link from a single email-only form, Supabase returns through a fixed same-origin callback, and the existing server-side cookie client exchanges the PKCE code before the user enters `/dashboard`.

## Current State Analysis

The application already has a request-scoped Supabase SSR client and middleware that resolves the user and excludes unauthenticated visitors from `/dashboard`. The current sign-in/sign-up pages, React forms, and API routes are all password-based, so they conflict with FR-001 and must not remain as an alternative authentication capability.

Local Supabase has email authentication enabled and an Inbucket instance for testing, but its redirect configuration targets port 3000 rather than Astro's normal 4321 development origin. The hosted project also requires deliberate Supabase Auth URL and SMTP configuration before a real production login can work.

## Desired End State

The public application exposes one “Sign in” action and an email-only form. An acceptable request always receives neutral confirmation, and a magic link sent by Supabase returns to a server callback that exchanges its one-time code for the existing SSR session cookies and redirects to `/dashboard`.

Invalid, expired, or replayed links never create a partial session and return the user to the sign-in page with a generic retry message. The password sign-up surface and password API capability are gone, while middleware and sign-out continue to enforce the existing private session boundary.

### Key Discoveries

- `src/lib/supabase.ts:5-24` already creates the request-scoped server client necessary for PKCE verifier and session cookies.
- `src/middleware.ts:4-24` already resolves the authenticated user and redirects unauthenticated `/dashboard` requests to `/auth/signin`.
- `src/pages/api/auth/signin.ts:4-20` and `src/pages/api/auth/signup.ts:4-19` currently use password methods; `src/components/auth/SignInForm.tsx:12-85` and `SignUpForm.tsx:14-134` expose the same contradictory UI.
- `supabase/config.toml:150-157` has a local redirect allowlist incompatible with Astro's normal `localhost:4321` development server, while `context/deployment/deploy-plan.md:41-46` records the protected production and stable preview URLs.
- `context/foundation/local-data-privacy.md:15-20` requires the authenticated Supabase user ID only as the local vault owner scope; this change must not create remote relationship-data persistence.

## What We're NOT Doing

- Adding passwords, social login, SMS login, MFA, invitation/provisioning workflows, account profiles, or roles.
- Adding browser E2E tooling, CAPTCHA, background jobs, Supabase product-data tables, or Worker data bindings.
- Changing relationship-data storage, Cloudflare Access policy, Worker secrets, deployment promotion, or any hosted Supabase account setting automatically.
- Restoring arbitrary post-login destinations, synchronizing data, or adding account recovery beyond requesting a new magic link.

## Implementation Approach

Keep Supabase authentication server-side. A small pure auth helper owns email validation, safe public messages, and fixed internal destinations so it can be covered by Vitest. The magic-link request route invokes `signInWithOtp` with `shouldCreateUser: true` and a callback URL derived from the current origin; the callback exchanges only its `code` through the existing cookie-aware client and uses a hard-coded `/dashboard` destination.

The local Supabase configuration permits the standard `localhost:4321` and `127.0.0.1:4321` development callback origins. Durable infrastructure documentation records the separate, human-owned hosted allowlist and SMTP preparation, without committing a production URL as a runtime secret or mutating any external account.

## Critical Implementation Details

The magic-link request and callback must use the same browser so the SSR client can persist and later consume the Supabase PKCE verifier cookie. Callback input is restricted to Supabase's `code`; it must never accept a caller-provided redirect URL or display raw provider errors.

## Phase 1: Request a passwordless link

### Overview

Replace the password entry and sign-up choice with one accessible email request flow that creates a user on first use and confirms the request without exposing account state.

### Changes Required

#### 1. Passwordless auth helpers and request endpoint

**Files**: `src/lib/auth/passwordless.ts` (new), `src/pages/api/auth/magic-link.ts` (new)

**Intent**: Centralize the small, security-sensitive rules that the email form and server route share, then request a Supabase magic link through the existing request-scoped client.

**Contract**: Validate and normalize a non-empty email, provide a neutral request result and generic retry result, build only the current-origin `/api/auth/callback` URL, and call `signInWithOtp` with `shouldCreateUser: true`. Configuration failure and provider errors redirect to safe sign-in states without echoing raw error text or account existence.

#### 2. Unified sign-in and sent-link experience

**Files**: `src/components/auth/MagicLinkForm.tsx` (new), `src/pages/auth/signin.astro`, `src/pages/auth/check-email.astro` (new), `src/components/auth/SignInForm.tsx` (delete), `src/components/auth/SignUpForm.tsx` (delete), `src/components/auth/PasswordToggle.tsx` (delete), `src/pages/api/auth/signin.ts` (delete), `src/pages/api/auth/signup.ts` (delete), `src/pages/auth/confirm-email.astro` (delete)

**Intent**: Present a single mobile-friendly entry point that requests a link and a neutral follow-up page explaining the next action, with no password or separate registration capability remaining.

**Contract**: The React form contains only an email field, client-side email feedback, a pending request state, and safe server-error rendering. It posts to `/api/auth/magic-link`; successful requests redirect to `/auth/check-email` without an email address in the URL. All product copy refers to a sign-in link rather than a password, account creation, or email confirmation.

#### 3. Local callback configuration

**File**: `supabase/config.toml`

**Intent**: Make the committed local Supabase setup accept the callback generated by the default Astro development server.

**Contract**: Set the local site URL to `http://localhost:4321` and allow both `http://localhost:4321/api/auth/callback` and `http://127.0.0.1:4321/api/auth/callback`. Keep email sign-up enabled for self-service provisioning; do not add SMTP credentials or hosted values to the repository.

### Success Criteria

#### Automated Verification

- The passwordless request helper and email-only form compile without password imports or password API routes.
- `npm run lint` and `npm run build` pass after the UI and local configuration replacement.

#### Manual Verification

- A blank or malformed email is rejected in the form, and a valid request reaches the neutral check-email screen without revealing whether the address is new or existing.
- The signed-out navigation and landing page expose only the unified sign-in path.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to Phase 2.

---

## Phase 2: Exchange links into private sessions

### Overview

Complete the server-side PKCE callback and unify all public navigation around the one passwordless route while preserving existing middleware and sign-out behavior.

### Changes Required

#### 1. Callback exchange and safe recovery

**Files**: `src/pages/api/auth/callback.ts` (new), `src/lib/auth/passwordless.ts`

**Intent**: Convert a valid Supabase magic-link callback into the same SSR cookie session that middleware already recognizes, and fail safely when a link cannot be exchanged.

**Contract**: Read only the callback `code`, call `exchangeCodeForSession` through `createClient(context.request.headers, context.cookies)`, and redirect success only to `/dashboard`. Missing configuration, a missing code, or an exchange error redirects to `/auth/signin?error=...` using the generic retry message; no arbitrary `next` parameter or raw provider error is accepted or emitted.

#### 2. Navigation and legacy compatibility

**Files**: `src/pages/auth/signup.astro`, `src/components/Topbar.astro`, `src/components/Welcome.astro`, `src/pages/dashboard.astro` (verify only), `src/middleware.ts` (verify only), `src/pages/api/auth/signout.ts` (verify only)

**Intent**: Preserve old sign-up bookmarks without retaining the old authentication model, and make the public/private journey coherent after session completion.

**Contract**: `/auth/signup` permanently redirects to `/auth/signin`; signed-out navigation and landing content contain one sign-in action. Keep `/dashboard` as the authenticated landing route, retain the existing middleware protection and sign-out endpoint, and leave the authenticated user's stable ID available through `Astro.locals.user` for later local-vault callers.

### Success Criteria

#### Automated Verification

- Focused tests cover the callback's fixed destination and generic retry handling for missing or failed codes.
- `npm run lint` and `npm run build` pass without a new Worker binding, secret, or relationship-data network path.

#### Manual Verification

- Following a valid local Inbucket magic link in the same browser reaches `/dashboard`, and a refresh retains the session.
- A missing, expired, or already-used link returns to sign-in with retry guidance and no authenticated session.
- `/dashboard` redirects to sign-in before authentication, and sign-out returns the user to the public experience.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to Phase 3.

---

## Phase 3: Verify and prepare hosted authentication

### Overview

Make the security-relevant behavior executable where practical and record the human-owned Supabase setup that must be completed before hosted magic links are relied upon.

### Changes Required

#### 1. Passwordless behavior tests

**Files**: `src/lib/auth/passwordless.test.ts` (new), `src/lib/auth/passwordless.ts`

**Intent**: Prevent regressions in the validation, redirect, and neutral-message rules without expanding the repository into a browser E2E stack.

**Contract**: Vitest covers email normalization/invalid input, construction of only the callback and `/dashboard` destinations, and generic handling of configuration, provider, missing-code, and exchange-failure states. Tests must not contact Supabase or require secrets.

#### 2. Hosted Supabase authentication runbook

**File**: `context/foundation/infrastructure.md`

**Intent**: Record the explicit manual configuration and verification procedure for the already-deployed protected Worker and hosted Supabase Auth project.

**Contract**: Add a concise passwordless-auth operation note: allow production and the stable protected preview callback URLs in Supabase Auth URL Configuration; configure a production SMTP provider before relying on hosted delivery; verify in an Access-authorized browser; treat URL, SMTP, and Access changes as human-approved external actions. Do not include secrets, change Worker configuration, or perform the external setup.

### Success Criteria

#### Automated Verification

- `npm test` passes the passwordless helper tests alongside the existing local-data tests.
- `npm run lint` and `npm run build` pass, and `git diff --exit-code -- wrangler.jsonc astro.config.mjs src/lib/relationship-data` confirms the deployment and local-data boundaries are unchanged.

#### Manual Verification

- Review the hosted Auth runbook and confirm its URL, SMTP, and Cloudflare Access steps are intentional before performing them outside the repository.
- With Supabase URL Configuration and SMTP prepared by a human, request a link through the protected production or stable preview URL and confirm the callback enters `/dashboard` without disclosing account state.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for final manual confirmation before closing the change.

---

## Testing Strategy

### Unit Tests

- Valid, blank, malformed, and whitespace-padded email input.
- Fixed callback and post-login destinations; no caller-controlled redirect destination.
- Neutral provider/configuration response and generic callback retry response.
- No network call or Supabase credentials required by tests.

### Integration Tests

- Run `npm test`, `npm run lint`, and `npm run build` under Node 22.
- Confirm protected configuration and relationship-data modules have no diff after the implementation.

### Manual Testing Steps

1. Start local Supabase and the Astro app; open the public sign-in form, request a link, and inspect it in Inbucket.
2. Open the link in the same browser, confirm `/dashboard` loads, refresh it, then sign out and confirm `/dashboard` is protected again.
3. Reuse, alter, or remove the callback code and confirm the retry path does not establish a session.
4. Before a hosted test, apply the documented Supabase Auth redirect and SMTP settings through the provider dashboard with human approval, then repeat the protected production or stable-preview flow.

## Performance Considerations

The request and callback each make one Supabase Auth call; no polling, background worker, or product-data query is introduced. The email form disables its submit button while a request is in flight to avoid duplicate browser submissions; provider rate limiting remains the source of truth.

## Migration Notes

Existing password-created Supabase users can request a magic link to the same email because self-service passwordless sign-in uses the existing account when it exists. Password credentials are no longer collected or used by the application, and old `/auth/signup` bookmarks redirect to the unified sign-in route. No relationship data or database schema is migrated.

## References

- Product requirement: `context/foundation/prd.md:62-65,110-112` — passwordless email and owner-only access.
- Roadmap slice: `context/foundation/roadmap.md:120-130` — S-01.
- Existing cookie client: `src/lib/supabase.ts:5-24`.
- Existing access guard: `src/middleware.ts:4-24`.
- Local auth configuration: `supabase/config.toml:150-217`.
- Deployment and hosted URLs: `context/deployment/deploy-plan.md:1-46`.
- Supabase passwordless Auth: <https://supabase.com/docs/guides/auth/auth-email-passwordless>.
- Supabase PKCE flow: <https://supabase.com/docs/guides/auth/sessions/pkce-flow>.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Request a passwordless link

#### Automated

- [x] 1.1 Replace password routes and forms with the email-only magic-link request flow — c861365
- [x] 1.2 Align local Supabase callback configuration with the Astro development origin — c861365
- [x] 1.3 Pass lint and production build checks after the request-flow replacement — c861365

#### Manual

- [x] 1.4 Confirm neutral request feedback and one signed-out entry path — c861365

### Phase 2: Exchange links into private sessions

#### Automated

- [x] 2.1 Add the safe PKCE callback exchange and fixed dashboard destination
- [x] 2.2 Redirect legacy sign-up and unify public navigation around sign-in
- [x] 2.3 Pass lint and production build checks without changing deployment or local-data boundaries

#### Manual

- [x] 2.4 Confirm valid, invalid, protected, refreshed, and signed-out session behavior locally

### Phase 3: Verify and prepare hosted authentication

#### Automated

- [ ] 3.1 Add focused passwordless validation and safe-redirect tests
- [ ] 3.2 Document the hosted Supabase Auth setup without mutating external configuration
- [ ] 3.3 Pass the complete test, lint, build, and protected-boundary validation suite

#### Manual

- [ ] 3.4 Confirm the hosted Auth runbook and production-or-preview magic-link flow
