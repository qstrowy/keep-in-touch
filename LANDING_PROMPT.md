# Creative commission: KeepInTouch — Little things, held together

Design and build an original, visually exceptional, production-quality landing page for KeepInTouch, an existing private relationship memory application. Use a warm, human, playful collage as the substance of the entire scrolling composition: the typography, fragments, empty space, hierarchy, and changing relationships must belong to one authored experience. Deliver a responsive functioning page, not a conventional feature-card template decorated with torn paper. The central idea is that the small details people tell us are worth holding onto.

Motion is fundamental to the selected rhythmic experience. Notes and illustrated layers occupy different planes, change scale and alignment, and progressively form context for a future conversation. Make that transformation understandable over time; a hero screenshot alone must not capture the whole idea. Use natural scrolling in a bounded sticky sequence, coordinated transforms, and a clear entrance and release. Preserve immediate access to text and actions. Do not substitute generic fade-ins, unrelated loops, or a fake AI demo for the signature sequence.

Treat mobile as an intentional composition of the same material. Reframe notes and original cutouts, alter density and movement distances, and keep important text comfortably readable. Provide semantic structure, visible keyboard focus, accessible error messages, contrast, reserved image dimensions, and a coherent reduced-motion version. Optimize the illustration and use lightweight code-driven animation. No page may require completing an intro before taking action.

Run the page, view its full sequence on desktop and mobile, and fix weak hierarchy, collisions, misplaced layers, palette drift, awkward sticky release, runtime errors, and unclear controls. Finish with a working local implementation, preview/run instructions, actual screenshots and verification findings, and an honest account of email-delivery limitations. The interview decisions are complete; do not reopen design gates.

## Product, location, and boundaries

- Existing repository: `C:\Users\Kamil\Documents\KeepInTouch`; branch `codex/keepintouch-landing`, created from `main`.
- Stack: Astro 7, React, strict TypeScript, Tailwind, Cloudflare Workers, Supabase authentication. Preserve the existing stack and routes.
- Scope: redesign `/`, style `/auth/signin` and `/auth/check-email` to match, establish reusable public design tokens. Dashboard redesign is later work. Preserve all dashboard, relationship storage, ownership, and model-processing logic.
- Use `AGENTS.md`, `LANDING_BRIEF.md`, and `DESIGN.md` supplied with this commission. Preserve the pre-existing startup-guidance edit in AGENTS.md.
- Local-only work: no hosting registration, publication, analytics, new backend, subscription, or production environment changes.
- Language: English throughout the page, documents, and labels.

## Audience, promise, and evidence

Visitors have not necessarily recognized a need for a relationship memory aid. Start with a familiar situation: they remember the person but forget the small details. The primary headline is "The little things are the big things." Supporting copy explains that KeepInTouch is a place to remember what matters between conversations. Offer a concrete habit, not a numerical promise or claim of improved relationships.

The argument is familiar situation -> new approach -> KeepInTouch -> sign-in. The selected evidence is method/process: add someone, capture a dated moment, return to the context, and deliberately request Core Topics when preparing to reconnect. Verify copy against the current application. No customer testimonials, logos, usage statistics, research findings, pricing, guarantees, automatic processing, or future roadmap features may be invented.

The primary CTA "Start remembering" goes to `/auth/signin`; the existing real email-link flow continues through POST `/api/auth/magic-link`, `/auth/check-email`, and its callback. A visible navigation "Sign in" supports returning visitors. Secondary action "See how it works" leads to the process chapter. Use `/dashboard` for an already authenticated visitor's account-navigation link without creating synthetic authentication in product UI.

## Visual mechanism and material rules

Concept: "Little things, held together." Begin with scattered but deliberately placed fragments; regroup them into legible context. Keep the relationship between text and fragments central to the composition. The opening should be a broad editorial scene, not the same two-column layout repeated down the page.

Use warm cream paper `#f6f2e8`, espresso ink `#29251f`, terracotta `#a63f29`, soft sage `#dce1cf`, butter `#eedb96`, pale peach `#e6b7a1`, and a small dusty lilac `#dcd3e7`. Secondary text is `#686155`. Rust is the CTA/emphasis color. Paper dominates; sage supplies a quiet later scene. Avoid cosmic gradients, glow, broad purple fields, or colors outside the defined families. Inspect generated artwork for palette consistency.

Typography is an intentional local editorial pairing: Georgia regular/italic headlines, Arial/Helvetica supporting UI. Large scale contrasts and selective italic rust text create warmth. Headline sizing is fluid; all note copy remains readable. Use a max-width around 1280px with ample margins and distinct density changes between scenes.

Only source types 5 and 4 were authorized: code/SVG graphics and new illustrations/generated imagery. Do not use photography, stock graphics, screenshots, external icon illustrations, or a copied visual reference. Create readable note text as HTML, moving sheets as CSS, brand mark and small companion objects as original SVG. Generate an original transparent cutout illustration of two adult friends at a cafe table in matte cut-paper/gouache style, sparse dark contours, rust/sage/cream/warm skin palette. It provides atmosphere, not evidence about customers. Save selected imagery in `public/landing/`, and record its prompt, path, provenance, dimensions, and role in `artifacts/landing/ASSETS.md`.

Fictional fragments can refer to a friend's upcoming interview, a dog named Olive, and a half-marathon. Mark illustrative content clearly. Do not represent the regrouping animation as live model generation or saved data. A paired-loop SVG mark can appear in brand navigation/footer. Use one elliptical stamp as an opening counterweight, not recurring decorative filler. Every arrow, underline, caption, or irregular edge must contribute to hierarchy, a relationship, or the product-specific voice.

## Whole-page storyboard

1. **Recognition:** show the oversized headline within the collage, with a short plain-language explanation and immediately available primary/secondary CTAs. Notes are at distinct scales and slight rotations. Original illustrated friends anchor the lower foreground. Keep navigation simple and the logo clear. The opening should be recognizable at first paint.
2. **Context sequence:** headline "A little note. A lot to come back to." Explain why keeping a detail helps later. In a bounded sticky stage, three notes move from scattered planes to aligned context. A final conversation prompt becomes readable as the grouping completes. Keep captions describing the process readable throughout; illustrative content remains labeled. The scene's exit hands attention to the method section without trapping scrolling.
3. **Method:** headline "A small habit. More to pick up on." Use an open editorial sequence of three steps: add someone you care about, save an imperfect note after a conversation, return before the next conversation and optionally request Core Topics. Distinguish manual capture from deliberate processing. Do not turn these into three generic shadowed feature cards.
4. **Privacy and boundaries:** headline "Personal, by design." A quieter sage composition explains that people and notes are stored in the current browser and are not synced across devices. Core Topics sends note text and excluded subjects for external processing only after a deliberate request. Do not claim encryption, anonymity, no external processing, or guaranteed confidentiality. Verify the exact details in owning implementation and foundation contracts.
5. **Reconnection:** headline "Pick up where you left off." Return to the conversational material with a small original cup illustration, a concise invitation, the real sign-in CTA, and a compact footer. This scene is spacious and resolved, not a repeat of the crowded opening.

## Motion and behavior score

- Opening: natural scroll -> distinct note rotations and grounded figures -> foreground notes travel a different small distance from background/figures -> separation suggests details accumulate -> process chapter enters -> reverse restores initial offsets. No perpetual floating loop.
- Signature: progress through approximately 200-240vh of normal page scroll -> notes begin spread apart and rotated -> from early to middle progress they translate, straighten, and change scale while a context panel joins them -> by later progress the notes read as connected context -> hold briefly and release the sticky stage into the next chapter -> reverse precisely retraces the sequence. Never intercept wheel/touch or modify scroll speed.
- Mobile: smaller note set/geometry with the same fictional details and grouping meaning; shorten the scroll range, keep headline and explanatory text clear, and prevent horizontal overflow. Do not shrink a desktop miniature.
- Reduced motion: remove parallax and long sticky progression, show a readable resolved grouping and complete explanation in normal document flow. Content remains available without JS.
- Technique: one passive scroll listener, visibility-aware requestAnimationFrame updates, CSS custom properties, transform/opacity-only changes where possible. No React render loop per scroll frame or unnecessary animation dependency.
- Controls: clear hover/focus states, accessible anchors, no hover-only information. Every CTA reaches an actual route/anchor.

## Login presentation

Keep the login as a separate matching cream/paper scene. A welcoming sheet contains the real labeled Email field, validation, existing server error text, and "Email me a sign-in link" action. Add a short explanation that the first link creates a private account. Reuse the existing request/callback logic; if an appearance prop is needed, keep shared defaults intact. Style check-email consistently and retain the retry link and deliberately noncommittal delivery wording. Do not send a real email during visual QA or display synthetic login controls in the public experience.

## Implementation and completion

Write/update the three design documents before coding. Build and view an opening plus the signature sequence with real motion before completing later scenes. Then finish the method/privacy/finale and auth presentation. Keep public CSS within a public wrapper so dashboard styles are not changed.

Use the repository's startup guidance: check status, reuse the matching healthy server, start a single instance, read actual failure logs before retrying, and verify HTTP readiness before opening the built-in browser. Permission failures in the Windows Cloudflare runtime need the approved escalation route, not repeated launches.

Run `npm test`, `npm run lint`, `npm run build`, and the existing Playwright browser suite, updating the existing public-entry assertion for the intentional new headline. View desktop 1440x900, mobile 390x844, and narrow 320px composition. Observe signature entry/middle/end, reverse and faster scroll, reduced motion, anchors, navigation, blank/invalid form state, server errors, and focus. Verify dashboard ownership behavior through the existing checks. Save screenshots and fill the requirement matrix in DESIGN.md with actual findings; write `LANDING_VERIFICATION.md` separating observed passes from unperformed checks. Real email receipt/login remains a manual check unless explicitly exercised with a supplied mailbox.

The task is complete when the selected collage material organizes the full page, the rhythmic regrouping is observed working across relevant states, the allowed assets are present locally, the auth route/validation remain functional, mobile and accessibility equivalents work, and required checks pass or material blockers are honestly reported. Deliver the local preview, branch, screenshots, document links, and remaining limits. No additional concept approval is required.
