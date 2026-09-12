# Public Production Entry Release Record

**Status:** Complete; production entry is public and previews remain Access-protected; the real magic-link session and sign-out flow passed.
**Updated:** 2026-09-12

## Target

- Production: `https://keep-in-touch.qstrowy.workers.dev`
- Stable preview: `https://release-candidate-keep-in-touch.qstrowy.workers.dev`
- Intended posture: production entry public; `/dashboard` and extraction remain protected by Supabase authentication; preview URLs remain protected by Cloudflare Access.

## Pre-change Cloudflare state

Capture the live settings before changing Access. The historical first-release record in `context/deployment/deploy-plan.md` says production and preview traffic were protected by Cloudflare Access with a 24-hour session. That historical record does not confirm the current live settings.

- Dashboard verification date: 2026-09-12 (owner-reported from Chrome; not independently visible to the agent)
- Worker Access scope: All traffic
- Account-wide “Protect all Workers” Access: Off
- Production `workers.dev` route: Enabled; dashboard reports that an Access policy applies
- Preview URLs: Enabled; dashboard reports that an Access policy applies
- Current production and preview protection: Both protected by the Worker-level All traffic scope
- Control to separate production and preview protection: Owner confirmed and applied the Worker Access scope Previews only; Cloudflare documents the per-Worker All traffic and Previews only scopes ([Worker Access docs](https://developers.cloudflare.com/workers/configuration/cloudflare-access/))
- Preferred rollback action and control location: Restore Worker Access scope to All traffic on Workers & Pages > `keep-in-touch` > Access; recorded, not yet applied or tested
- Access changes made for this release so far: Owner changed the Worker Access scope from All traffic to Previews only on 2026-09-12; account-wide Access remains Off per owner report
- Access scope save attempt: The initial save was rejected with `access.api.error.invalid_request` because `auto_redirect_to_identity` was true without exactly one `allowed_idps`; no setting changed during that attempt. The owner later applied Previews only successfully.

## Deployment

- Candidate application commit: `97aac00` (local final repository gates passed and deployed 2026-09-12)
- Verified production commit: `97aac00`
- Cloudflare Worker version: `3cc73325-77eb-4d54-9cd4-4421dc98dd7a`
- Deployment performed with the recorded Worker Access scope set to All traffic; Wrangler did not change Access
- Branded production `/auth/signin` checked from an Access-authorized browser and accepted by the owner on 2026-09-12; owner reports the application is working correctly

## Production and preview verification

Record status outcomes only; do not include response bodies containing personal data.

- Clean signed-out production `/`: HTTP 200; branded welcome page loaded in a fresh browser on 2026-09-12
- Clean signed-out production `/auth/signin`: HTTP 200; branded email sign-in form loaded in a fresh browser on 2026-09-12
- Clean signed-out production `/dashboard` redirect: HTTP 302 to `/auth/signin` on 2026-09-12
- Same-origin unauthenticated extraction status: HTTP 401 on 2026-09-12 using a synthetic request; provider was not invoked
- Real production magic-link request, session refresh, and sign-out: Passed by owner on 2026-09-12; the dashboard opened after the link, refreshed successfully, and sign-out returned to the signed-out state.
- Clean signed-out stable preview Access outcome: HTTP 302 to the Cloudflare Access login on 2026-09-12

## Access change and rollback

- Production-only Access change approved: Owner applied Worker Access scope Previews only on 2026-09-12 after explicit approval
- Preview protection confirmed after the change: Yes; signed-out preview request redirected to Cloudflare Access
- Preferred rollback (restore recorded production Access protection): Restore Worker Access scope to All traffic; documented in the project README and confirmed acceptable by the owner; not exercised
- Emergency rollback (`workers.dev` route disable) verified: Pending
- Rollback performed: No

## Cloudflare build follow-up

- Failed Worker Build: `2026-09-11T22:46:04.501Z`; the user build command `npm ci && npm run build` stopped at `npm ci` before Astro ran.
- Cause: `package-lock.json` was out of sync with optional dependency metadata; npm reported missing `@emnapi/runtime@1.11.1` and `@emnapi/core@1.11.3`.
- Repair: regenerated the lockfile with npm `10.9.2`, matching the build environment. A real clean install with `npx --yes npm@10.9.2 ci --no-audit --no-fund` succeeded locally (`added 706 packages`). The next Workers Build after push is the remote confirmation.
- Production application code and Worker version were not changed by this dependency-lock repair.

## Privacy

Do not record email addresses, magic-link URLs, authentication codes, cookies, credentials, secrets, or relationship content. Record only outcomes, commit/version identifiers, Access controls, and rollback confirmation.
