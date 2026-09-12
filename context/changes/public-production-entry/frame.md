# Frame Brief: Public production sign-in entry

> Framing artifact only. No implementation or production configuration changes are authorized by this brief.

## Reported observation

The production deployment presents a Cloudflare Access wall before a visitor can reach the application sign-in page.

## Initial framing

- **User's stated cause:** Cloudflare Access may be redundant because the application already has authentication.
- **User's proposed direction:** “visitors can reach the sign-in page without Cloudflare Access; Supabase login still protects the dashboard and owner data. Include the branded sign-in screen in that product direction. (FOR PROD NOT FOR DEV)”
- **Lead problem selected:** The production Access wall.
- **Account model clarification:** The user considers “let everyone in” the easiest MVP approach. Frame this as public self-service registration: anyone with a valid email can request a magic link; the existing flow has `shouldCreateUser: true` (`src/lib/auth/passwordless.ts:44-59`). No invite or approval flow is in scope.
- **Environment clarification:** Interpret “test locally, and have one main remote environment” as keeping local development behavior unchanged and making the main production deployment the only remote environment in scope. A stable release-candidate URL appears in historical deployment documentation; whether it is still used should be verified during planning, not assumed.

## Hypothesis map

| Hypothesis                                                                                                         | Evidence                                                                                                                                                                                                                                                                                                                      | Assessment                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| An outer Cloudflare Access policy blocks visitors before requests reach Astro.                                     | The deployment record says all Worker traffic was protected by Cloudflare Access (`context/deployment/deploy-plan.md:5-7, 39-46`) and records a check that Access blocks unauthenticated visitors (`context/deployment/deploy-plan.md:48-54`). This policy is account-level and is not declared in `wrangler.jsonc:1-27`.     | **Strong.** Consistent with the reported production wall and historical deployment decision. The current live account policy was not inspected in this framing pass.                                                                      |
| Astro/Supabase authentication cannot protect the app without Cloudflare Access.                                    | Middleware resolves the Supabase user (`src/middleware.ts:6-24`); only `/dashboard` is marked protected (`src/lib/auth/route-access.ts:1-5`). The dashboard requires a user and passes `user.id` to its client UI (`src/pages/dashboard.astro:5-21`).                                                                         | **Contradicted.** There is an independent application authentication boundary.                                                                                                                                                            |
| Authenticated owner data is stored in a server-side per-user database, so Supabase alone guarantees its isolation. | The dashboard passes the authenticated user ID into the UI (`src/pages/dashboard.astro:20-21`); relationship records use browser IndexedDB (`src/lib/relationship-data/local-vault.ts:11-24`).                                                                                                                                | **Contradicted / important boundary.** Data is browser-local and owner-scoped in the application, not stored in a server-side owner database. This brief does not claim to prove browser storage isolation or account-switching behavior. |
| The callback itself depends on a Cloudflare Access session.                                                        | The app builds the callback URL from the current origin (`src/lib/auth/passwordless.ts:36-38, 53-60`); the callback exchanges the Supabase code and redirects (`src/pages/api/auth/callback.ts:5-10`). Historical operations guidance asks for an Access-authorized browser (`context/foundation/infrastructure.md:107-119`). | **Weak.** The runbook assumes Access is present, but no application-level Access-cookie dependency was found. Validate the real hosted sign-in flow in the plan.                                                                          |
| Branding is the root cause of the access problem.                                                                  | The sign-in page currently renders a generic “Sign in” form (`src/pages/auth/signin.astro:8-22`), while the dashboard copy describes the product (`src/pages/dashboard.astro:15-18`).                                                                                                                                         | **Not the root cause.** Branded sign-in is a companion UX requirement, separate from removing the outer gate.                                                                                                                             |

## Cross-system pressure test

Cloudflare Access was deliberately chosen for the initial protected infrastructure release, before the application’s own passwordless auth was ready (`context/deployment/deploy-plan.md:5-7`). That explains why the gate exists; it does not make the gate a prerequisite for the app’s current auth design. The application presents sign-in publicly by route design, gates the dashboard on a Supabase user, and separately authenticates extraction requests (`src/pages/api/extractions/anchors.ts:14-40`).

The current signup flow creates an account when a new email requests a link. Removing the production Access gate therefore makes account creation publicly available, not merely the sign-in form. This matches the user's simplest-MVP preference, but increases exposure to unwanted sign-ups and usage of email/extraction resources. The plan should consider application-level abuse controls and verify the exact production policy change; it should not expand into a general Cloudflare or Supabase infrastructure test.

## Reframed problem

The production deployment still applies an infrastructure-smoke Access gate in front of the product’s public sign-in route, preventing intended visitors from entering the app. The product needs a production-only public entry point: visitors can reach a branded sign-in page and self-register by email, while unauthenticated visitors remain unable to enter the dashboard or make authenticated extraction requests. Local development remains unchanged; the MVP targets one main remote production environment.

## Scope signals and confidence

- **Confirmed direction:** Remove the production visitor-facing Access wall; keep application authentication; include branded sign-in; leave dev unchanged.
- **MVP account assumption:** Public, self-service account creation for anyone with a valid email; no roles, invite queue, or approval workflow.
- **Environment assumption:** One main remote production deployment. Verify whether the historically documented release-candidate URL is still an active target.
- **Out of scope:** General Cloudflare/Supabase provider validation; role-based access; recommendations; voice transcription; background extraction; redesign beyond a branded sign-in screen; claiming that browser-local IndexedDB is a server-enforced security boundary.
- **Confidence: Medium.** Evidence strongly supports an independent app-auth boundary and a historically external Access gate. Live Cloudflare policy and a real hosted Supabase browser sign-in were not inspected in this framing pass; public registration also carries abuse/usage risk that should be addressed proportionately in planning.

## Planning handoff

Plan the smallest production-scoped change that removes the outer visitor gate without changing local development, confirms how the existing production Access policy is owned and applied, checks the live status of the historical preview URL, verifies public self-registration and unauthenticated dashboard/API denial at the application boundary, and brings the sign-in screen into the app's product branding. Keep provider-wide infrastructure testing out of scope.
