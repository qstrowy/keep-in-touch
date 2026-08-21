# Repository Guidelines

## Project Structure & Module Organization

KeepInTouch is an Astro 6 application using React, strict TypeScript, Tailwind CSS, Supabase, and Cloudflare Workers. Routes and API handlers live in `src/pages/`; shared layouts, UI, authentication components, utilities, and styles belong in `src/layouts/`, `src/components/`, `src/lib/`, and `src/styles/`. Place directly served assets in `public/`. Supabase configuration lives in `supabase/`. Treat `context/foundation/` as the source of truth for product and stack decisions, use `context/changes/` for change-specific notes, and never modify `context/archive/`.

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

No automated test framework is configured yet. Until one is added, every change must pass `npm run lint` and `npm run build`. When introducing business logic, add a test runner and an explicit `npm test` script in the same change; colocate tests as `*.test.ts` or `*.test.tsx` beside the code under test.

## Commit & Pull Request Guidelines

Use concise Conventional Commit subjects such as `feat: add contact notes` or `fix: protect dashboard route`. Pull requests should explain the change, link relevant work items, list verification commands, include screenshots for UI changes, and call out environment, database, or deployment changes.

## Security & Configuration

Copy `.env.example` into `.env` and `.dev.vars` for local secrets. Never commit real Supabase credentials or expose server-only values to client code. Document any new environment variable in `.env.example` and deployment configuration.
