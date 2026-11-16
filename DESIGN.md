# KeepInTouch: Little things, held together

## Concept and scope

The existing public page is a centered title on a cosmic background. Replace that opening with a warm, authored collage in which details occupy the same space as the headline. Preserve Astro, email-link authentication, ownership boundaries, and all dashboard/data behavior. The public landing, sign-in, and check-email pages establish a language for a later dashboard redesign.

Three interpretations considered:

1. A correspondence table: notes and original illustrated people gather on a broad paper surface; the scattered fragments straighten into context while scrolling.
2. A wall of connections: names and fragments occupy a large pinboard; lines reorganize into a timeline, but the device risks implying surveillance and a relationship-management dashboard.
3. An unfolding letter: torn strips reveal a single narrative vertically; strong continuity, but less room for the selected layered collage and human warmth.

Choose the correspondence table. It makes memory tangible, fits warm/playful character, and lets the same few notes change relationships through motion. The thesis: **scattered paper fragments convey the value of remembering through deliberate overlap and subsequent alignment, across recognition, capture, context, and reconnection scenes.**

## Storyboard

| Scene              | Meaning and copy                                                                                             | Composition/material                                                                                                                                                                                                           | Entry, development, exit                                                                                                                                                                                                                   | Action and variants                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Opening            | "The little things are the big things." Recognize the details that matter between conversations.             | Large editorial serif across a warm paper field; tilted note fragments around and partly alongside the text; an original cutout of two friends anchors the lower area. Terracotta italic emphasis provides the focal point.    | All copy and actions exist immediately. Natural scroll changes the relative positions of notes and illustration at different rates. The last note leads into the context sequence.                                                         | "Start remembering" leads to sign-in; "See how it works" anchors to the process. Phone reorganizes notes beneath the headline.                            |
| Signature sequence | "A little note. A lot to come back to." Capture, keep context, reconnect. Evidence is the real process only. | A bounded sticky paper stage; three fictional fragments begin spread out and rotated, then align beside a concise future-conversation prompt. Separate planes, changing scale, and a closing context panel show relationships. | Scroll progress 0-0.25: scattered fragments. 0.25-0.7: notes straighten, group, and align; the context panel moves into place. 0.7-1: the grouped scene holds while the next chapter arrives. Reverse scroll restores the previous states. | Text explains each stage without requiring motion or interaction. Reduced motion displays the resolved composition; mobile uses a compact readable stack. |
| Method             | "A small habit. More to pick up on." Three distinct steps explain what the app does.                         | An open editorial row with oversized step numbers and concise text, with one small original graphic gesture per step; avoid repeating bordered feature cards.                                                                  | Grouped paper from the prior scene hands off to the same paper/sage colors. Density relaxes after the sticky sequence.                                                                                                                     | Clear explanation of manual notes and deliberate Core Topics generation; no automated-processing claim. Phone becomes a vertical sequence.                |
| Boundaries         | "Personal, by design." Say where data lives and when processing happens.                                     | An asymmetric sage inset in the wider page, with large reassuring text and short precise factual copy.                                                                                                                         | A quiet pause before the final action, using substantial space instead of another spectacle.                                                                                                                                               | Anchor links to readable privacy details on the same page. No blanket confidentiality, anonymity, encryption, sync, or no-processing promises.            |
| Finale             | "Pick up where you left off."                                                                                | Oversized serif closing invitation, a small pair of original illustrated coffee cups, terracotta action, and compact footer.                                                                                                   | The opening's conversational objects return in a simpler arrangement, now aligned.                                                                                                                                                         | Sign-in destination remains available immediately. Footer links back to top and the process/privacy anchors.                                              |

## Typography and geometry

- Display: Georgia with Times New Roman fallback, regular/italic; selected intentionally for warm editorial contrast and local availability. Sans: Arial/Helvetica fallback for UI and notes. No external font service or new package dependency.
- Desktop heading: fluid approximately 64-112px, tight but noncolliding line height. Section headings approximately 44-72px. Primary body copy is 16-19px; method/privacy copy is 13-14px, with line height at least 1.5 and limited line length. Small illustrative captions are 9-11px with an accessible narrative equivalent; form and action copy is 12-16px.
- Working max-width 1280px; comfortable 24-64px margins. Hero is a full composition, not a rectangular image beside a copy column.
- Irregular note edges, limited rotations, one broad elliptical stamp, and cutout imagery create material contrast. Do not stamp every scene with the same tape, doodle, numbering, or border.
- Card-like sheets are used only when they represent actual fictional notes; informational method sections remain open compositions.

## Palette

| Token     | Color     | Role                                                          |
| --------- | --------- | ------------------------------------------------------------- |
| Paper     | `#f6f2e8` | Main canvas and quiet surfaces                                |
| Ink       | `#29251f` | Headlines, body, outlines                                     |
| Rust      | `#a63f29` | Main CTA, emphasized headline text; white or paper foreground |
| Sage      | `#dce1cf` | Context/privacy surfaces                                      |
| Butter    | `#eedb96` | One fictional note and small material accents                 |
| Peach     | `#e6b7a1` | Illustration and one note accent                              |
| Lilac     | `#dcd3e7` | A small contrasting note, not an overall purple theme         |
| Muted ink | `#686155` | Secondary text on light paper                                 |

Generated illustration shades may vary within warm skin/rust/sage/cream/ink families. Inspect the output before use. Keep drop shadows subtle and brown/ink-tinted; no gradients or glow. Contrast must be checked on actual surface/text pairs.

## Detail language and provenance

- Dated/quoted fragments derive from the product's note-taking purpose: fictional text such as a friend's interview, a dog named Olive, and a half-marathon. Use only in the opening and sequence; label illustrative content.
- Linked loops derive from two conversation bubbles/paired connections: the original SVG wordmark mark appears only in shared navigation and footer.
- An elliptical "Little things matter" stamp serves as a counterweight within the opening, not a repeated section badge.
- Short hand-drawn underlines and a single curved arrow guide between the headline and note; omit any instance that crowds text on phones.
- Original cutout illustration: two adult friends at a cafe table. Generated using the built-in image tool, with prompt/provenance saved in `artifacts/landing/ASSETS.md`; copy the selected asset into `public/landing/`. It is illustrative, not a customer photograph or product evidence.
- Companion cup graphic: new code-native SVG illustration, same limited palette. No stock assets or screenshots.

## Motion score

1. **Opening handoff:** natural scroll through the hero -> notes start on distinct rotations/planes -> foreground note moves slightly upward while the friends remain visually grounded -> separation suggests details accumulate -> the process heading enters -> reverse scroll restores the positions. Mobile reduces displacement and removes overlap with the heading; reduced motion is static.
2. **Fragments to context:** natural progress through a roughly 200-240vh container -> three notes scattered across a sticky stage -> interpolate translation, rotation, and scale to form a coherent stack on one side while a summary/context sheet takes its place on the other -> the reader sees a specific future-conversation prompt -> hold the resolved state before normal sticky release -> reverse restores scattering. Mobile uses smaller displacement and an ordered stack, with a shorter container. Reduced motion removes sticky duration and shows the final readable arrangement immediately.
3. **Controls:** links/buttons change color, border/shadow, and at most a small translation; visible focus has a solid outline. No perpetual floating loop, wheel interception, scroll-speed manipulation, intro lockout, or extraction request.

Use passive scroll listeners and one requestAnimationFrame update per requested scroll/resize frame, updating CSS variables on the relevant scene. Do not update React state per frame. No animation library required. Text remains in the DOM, readable without JS. Respect changes to `prefers-reduced-motion`; avoid fixed backgrounds or heavy filters.

## Login and practical behavior

- Retain `/auth/signin`, POST `/api/auth/magic-link`, `/auth/check-email`, and the existing callback destination.
- Present a readable cream login sheet with matching notes/illustration language, labeled Email field, accessible error state, and existing real request behavior. No fake success state or demo login in the public page.
- Use a public-layout wrapper so public styles do not restyle dashboard components. Shared authentication components may receive an explicit appearance variant; their default behavior remains available.
- Real email delivery and magic-link completion depend on configured Supabase settings and mailbox access. Verify validation and navigation locally; do not send an actual email without a destination supplied for that check.

## Verification plan and requirements matrix

Run unit tests, lint, production build, and the existing browser suite. Update the existing public-entry expectation for the intentional new headline while retaining its sign-in and privacy assertions. Browser visual QA uses the built-in browser with desktop 1440x900, mobile 390x844, and a narrow 320px check; inspect sequence entry/middle/end and reverse, reduced motion, footer/anchors, form blank/invalid/server-error states, keyboard focus, and absence of overflow. Capture screenshots. Do not claim live email or model validation from synthetic access.

| Requirement                                                | Source/status                   | Implementation                                                               | QA evidence                                                                                   | Result                                             |
| ---------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Unaware visitors; problem to approach to product to action | User stages 3, 9                | Opening and process narrative                                                | Full page observed; desktop opening/method/finale captures                                    | Verified locally                                   |
| Process as evidence                                        | User stage 5                    | Method section and labeled fictional collage                                 | Copy checked against PRD, local-vault storage, and the manual Core Topics control             | Verified                                           |
| Collage, warm/human, playful, chapters                     | User stages 6-8                 | Whole-page public visual system                                              | Desktop and mobile screenshot set; quieter privacy/finale scenes also viewed                  | Verified locally                                   |
| Rhythmic motion and scroll signature                       | User stages 10A/B               | Multi-plane regrouping sequence                                              | Entry/middle/resolved/reverse desktop frames; mobile sequence observed                        | Verified locally                                   |
| Only code graphics and new illustrations                   | User stage 11                   | HTML/CSS/SVG fragments and generated cutout                                  | ASSETS.md and local asset/source inspection                                                   | Verified                                           |
| Existing auth/data behavior                                | User and repository constraints | Existing endpoints and data logic retained; public presentation changed      | 91 unit tests, 6 E2E tests; production-preview validation observed                            | Local checks pass; real email receipt not tested   |
| Separate branch, local delivery                            | User stages 1/12                | codex/keepintouch-landing; production preview                                | Git branch and successful local HTTP response                                                 | Verified; no publication                           |
| Responsive/accessibility equivalents                       | Skill requirement               | Mobile arrangement, narrow correction, focus/error semantics, reduced motion | 1440/390/320 viewport review, reduced-motion emulation, focus captures, contrast calculations | Verified within listed checks; no exhaustive audit |

## Actual review and corrections

See LANDING_VERIFICATION.md for commands, evidence filenames, observed states, and practical limits. Corrected stylesheet ordering, mobile line breaks, a 320px headline/collage collision, note/illustration overlap, and fictional-example label spacing. The optional stamp was removed only at the narrow breakpoint after comparing its placement with omission. Reduced motion retains the resolved context and normal page flow. No screenshots, stock imagery, external font requests, or simulated product actions were added to the page.
