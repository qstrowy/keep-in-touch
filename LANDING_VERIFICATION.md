# Landing verification

Date: 2026-11-17, Europe/Warsaw. Branch: `codex/keepintouch-landing`.

## Delivered

- `/`: warm collage landing page with original illustration, fictional note fragments, a rhythmic scroll sequence, process explanation, privacy details, and real sign-in links.
- `/auth/signin` and `/auth/check-email`: matching presentation using the existing email-link request and callback flow.
- Public styles are scoped through `PublicLayout.astro` and `kit-` classes. No dashboard, vault, ownership, extraction, Supabase, or deployment logic was changed.
- Only new generated illustration and code/SVG graphics are used. No photos, stock assets, screenshots as page content, or external font dependencies.
- Original cutout: `public/landing/friends-v1.webp`, 1200 × 800 with alpha, 217,200 bytes. Prompt and provenance: `artifacts/landing/ASSETS.md`.

## Checks actually run

| Check                        | Actual result                                                                                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                   | 16 files, 91 tests passed. One initial concurrent run timed out in the existing ESLint boundary test; the isolated rerun passed. No timeout settings were relaxed.                                                  |
| `npm run lint`               | Passed. Generated Playwright results/reports are now ignored so ESLint does not traverse directories being replaced by Playwright.                                                                                  |
| `npm run build`              | Passed after the final CSS corrections. Production Cloudflare output generated successfully.                                                                                                                        |
| `npm run typecheck`          | 79 files checked; 0 errors, 0 warnings, 6 existing `tseslint.config` deprecation hints in `eslint.config.js`.                                                                                                       |
| `npm run e2e`                | All 6 browser tests passed on the final full run: signed-out entry/login navigation, protected route/extraction access, synthetic session harness, person creation/deletion, edit persistence, and owner isolation. |
| Formatting and diff          | Changed source files formatted with Prettier; final CSS formatting check and `git diff --check` passed.                                                                                                             |
| Production-preview readiness | HTTP 200 for `/` at `http://127.0.0.1:4322/`. Browser review used the production build rather than a simulated page.                                                                                                |

The browser suite's new text/CTA expectations reflect the intentional redesign. Additional rapid form-validation assertions were tried but not retained: the existing server-rendered form and React hydration can show different valid error states during initial load. Blank and invalid-email validation were instead observed directly in the production preview after the form loaded. Very early typing before hydration is not claimed as audited or fixed by this presentation change.

## Browser and visual evidence

The built-in browser was used for all manual UI checks. Temporary viewport and reduced-motion overrides were restored at the end. The completed landing page was left open as the user-facing preview.

### Desktop

- Requested 1440 × 900 viewport; document content width 1425px with its scrollbar. `scrollWidth` equaled `clientWidth`: no horizontal overflow in the inspected landing state.
- Viewed the opening, method, privacy composition, finale, and matching sign-in screen. The opening retains immediate access to sign-in and the process anchor.
- Watched the signature sequence at entry, intermediate grouping, and resolved context; observed scroll progress approximately 0.575 then 1. Reverse scrolling returned it to approximately 0.630. A faster two-page scroll released the sticky scene into the later content without trapping navigation.
- Saved separate entry, midpoint, resolved, and reverse frames; these are evidence of multiple observed states, not a claim that a static hero proves motion.
- Followed the closing CTA into `/auth/signin`. Empty submission showed `Email is required`; invalid text showed `Enter a valid email address` without sending a valid address or requesting real email delivery.
- Checked keyboard Tab focus on the submit button, visible focus treatment, and the root page's first-tab skip link; Return activated the skip target.
- Browser error-log inspection returned no errors in the reviewed final tab.

### Phone and narrow screens

- Reviewed 390 × 844 and 320 × 844. Landing/sign-in content widths were 375px and 305px with scrollbars, respectively, and measured `scrollWidth` equaled `clientWidth`. The short check-email page had no scrollbar and measured 320px for both.
- At 390px, note layers and illustration are intentionally rearranged below the opening copy. Notes do not cover the characters' faces. The mobile signature progresses from scattered notes to a larger central context sheet rather than shrinking the desktop composition.
- At 320px, reduced the opening type size, separated notes from the illustration, and removed the optional stamp to keep faces/text clear. Reviewed the corrected opening and narrow sign-in, server-error, privacy, and check-email screens.
- Kept the login welcome's intentional line break so words do not concatenate when rearranged for phones.
- Gave the mobile sequence more room so the fictional-example label remains visible beneath its fragments.
- Verified the retry link from check-email returns to sign-in, the sign-in privacy link reaches `/#your-space`, and footer back-to-top navigation works.

### Reduced motion

- Emulated `prefers-reduced-motion: reduce` through the browser's development capability and observed the real resulting page.
- The scene displayed its resolved context immediately in normal document flow, with `--gather: 1`; its mobile height measured approximately 823px instead of the 205vh scrolling sequence. The full explanation and fictional-example label remained available.
- Restored normal motion before leaving the preview. No persistent browser-state override was left in place.

### Contrast and material

Calculated actual token pairs with the standard sRGB relative-luminance formula:

| Pair                       | Ratio   |
| -------------------------- | ------- |
| Ink / paper                | 13.62:1 |
| Muted text / paper         | 5.48:1  |
| Paper / rust button        | 5.58:1  |
| Ink / sage                 | 11.40:1 |
| Error text / error surface | 6.45:1  |

Inspected the generated cutout against the real paper surface; transparency, palette, and silhouettes fit the composition. Compared the optional stamp's actual narrow-screen placement with its omission and removed it only at the narrow breakpoint. The process row uses open typography rather than generic feature cards. The privacy pause and coffee-cup finale maintain the same material language with less density.

## Corrections from review

- Reordered public CSS so shared resets and generic typography do not override later scene spacing/type roles.
- Corrected mobile login line breaks, narrow headline wrapping, note/illustration collisions, and fictional-label spacing.
- Added `aria-invalid`, error descriptions, and alert roles to the existing authentication error presentation.
- Added generated Playwright output paths to `.gitignore`; no test runner, authentication endpoint, privacy boundary, or validation rule was replaced.

## Screenshots

All files are in `artifacts/landing/screenshots/`:

- `desktop-opening.jpg`, `desktop-sequence-entry.jpg`, `desktop-sequence-middle.jpg`, `desktop-sequence-resolved.jpg`, `desktop-sequence-reverse.jpg`
- `desktop-method-privacy.jpg`, `desktop-finale.jpg`, `desktop-signin.jpg`, `desktop-signin-validation.jpg`
- `desktop-keyboard-focus.jpg`, `desktop-skip-focus.jpg`
- `mobile-opening.jpg`, `mobile-sequence-entry.jpg`, `mobile-sequence-resolved.jpg`, `mobile-reduced-motion.jpg`, `mobile-signin.jpg`
- `narrow-opening.jpg`, `narrow-signin.jpg`, `narrow-signin-error.jpg`, `narrow-privacy.jpg`, `narrow-check-email.jpg`

These are viewport captures from actual browser states. A matching pre-change screenshot set was not saved; the old dark public page was inspected before implementation.

## Practical limits and next step

- Real email receipt, callback allowlisting, and a complete production magic-link login were not exercised. The existing synthetic E2E suite does not replace that manual check. The check-email page was viewed directly for presentation QA, not reached through a claimed email delivery.
- No live model generation, real relationship notes, production deployment, or hosted-site registration occurred. Fictional collage fragments explain the process without simulating saved data or AI output.
- No measured Core Web Vitals or exhaustive assistive-technology audit is claimed. Observed layout, motion, focus, error, and contrast checks are listed above.
- This delivery establishes the public/login design language. Applying it to the dashboard and relationship-management screens is a subsequent change.

## Run instructions

The production preview is left running at `http://127.0.0.1:4322/`.

To rebuild and start it later, run `npm run build`, then `npm run preview -- --host 127.0.0.1 --port 4322`. Check an existing preview with `npx astro preview status`; stop it with `npx astro preview stop`. For source editing use the repository's development-server guidance in `AGENTS.md`.
