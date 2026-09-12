# Repository Guidelines

## Project Structure & Module Organization

KeepInTouch is an Astro 7 application using React, strict TypeScript, Tailwind CSS, Supabase, and Cloudflare Workers. Routes and API handlers live in `src/pages/`; shared layouts, UI, authentication components, utilities, and styles belong in `src/layouts/`, `src/components/`, `src/lib/`, and `src/styles/`. Place directly served assets in `public/`. Supabase configuration lives in `supabase/`. Treat `context/foundation/` as the source of truth for product and stack decisions, use `context/changes/` for change-specific notes, and never modify `context/archive/`.

## Build, Test, and Development Commands

- `npm ci`: install the exact locked dependency set.
- `npm run dev`: start the local Astro server using the Cloudflare runtime.
- `npm run lint`: run type-aware ESLint, React, Astro, accessibility, and Prettier checks.
- `npm run lint:fix`: automatically fix supported lint violations.
- `npm run format`: format the repository with Prettier.
- `npm run build`: create the production Cloudflare build.
- `npm run preview`: serve the production build locally.
- `npx astro sync`: refresh generated Astro types after configuration changes.
- `npx supabase start` / `npx supabase stop`: manage the optional local Supabase stack.

## Coding Style & Naming Conventions

Use strict TypeScript and the `@/*` alias for imports from `src/`. Prettier enforces two-space indentation, semicolons, double quotes, trailing commas, and a 120-character line width. Name React and Astro components in `PascalCase`, functions and variables in `camelCase`, and route files in lowercase. Prefer Astro for server-rendered markup and React only where client interaction is needed. Never bypass type or lint errors without documenting why.

## Testing Guidelines

Run `npm test` for the Vitest unit and component suite and `npm run e2e` for the Playwright browser suite. Code changes must also pass `npm run lint` and `npm run build`. Colocate business-logic tests as `*.test.ts` or `*.test.tsx`; place browser-flow coverage in `tests/e2e/`. The E2E suite uses synthetic sessions and does not replace a manual production magic-link check.

## Commit & Pull Request Guidelines

Use concise Conventional Commit subjects such as `feat: add contact notes` or `fix: protect dashboard route`. Pull requests should explain the change, link relevant work items, list verification commands, include screenshots for UI changes, and call out environment, database, or deployment changes.

## Security & Configuration

Copy `.env.example` into `.env` and `.dev.vars` for local secrets. Never commit real Supabase credentials or expose server-only values to client code. Document any new environment variable in `.env.example` and deployment configuration.

<!-- BEGIN @przeprogramowani/10x-cli -->

## 10xDevs AI Toolkit - Module 3, Lesson 4 (E2E Tests)

**For E2E tests, use the `/10x-e2e` skill.** It is the single source of truth
for the workflow — risk → seed test + rules → generate → review against the five
anti-patterns → re-prompt → verify. The skill's `references/` carry the full
rules, anti-patterns, seed pattern, and prompt-template.

A few hard rules that hold even before you invoke the skill:

- **Locators:** `getByRole` / `getByLabel` / `getByText` first; `getByTestId`
  only when accessibility attributes are ambiguous. Never CSS selectors, XPath,
  or DOM structure.
- **Never `page.waitForTimeout()`.** Wait for state: `toBeVisible()`,
  `waitForURL()`, `waitForResponse()`.
- **Test independence + cleanup.** Each test runs standalone — its own setup,
  action, assertion, and cleanup; unique ids (timestamp suffix) so parallel runs
  and re-runs don't collide.

Two boundaries to keep straight:

- **DOM (snapshot) is the default.** Vision (`--caps=vision`) is a supplement for
  visual-only risks (layout, z-index, animation); for pixel regression prefer
  deterministic tools (`toMatchSnapshot`, Argos, Lost Pixel). VLM model
  selection/cost is a debugging topic (Lesson 5), not testing.
- **Healer helps on selectors, harms on logic.** A changed selector → healer
  re-finds it (route through PR review). A changed business behavior → healer
  masks the bug; that failing-test-to-fix case is Lesson 5.

<!-- END @przeprogramowani/10x-cli -->
