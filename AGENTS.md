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

## 10xDevs AI Toolkit - Module 2, Lesson 3

Review AI-generated code before merge with the **implementation review chain**:

```
/10x-implement -> /10x-impl-review -> triage -> (/10x-lesson | fix | skip | disagree)
```

`/10x-impl-review` is the lesson focus. Review is a quality gate, not an instruction to fix every finding.

### Task Router - Where to start

| Skill                          | Use it when                                                                                                                                                                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Code review (lesson focus)** |                                                                                                                                                                                                                                         |
| `/10x-impl-review <change-id>` | You have implemented code and want a structured review before merge. The skill checks plan adherence, scope discipline, safety and quality, architecture, pattern consistency, and success criteria, then presents findings for triage. |
| **Recurring lesson outcome**   |                                                                                                                                                                                                                                         |
| `/10x-lesson`                  | A finding reveals a recurring project rule or agent failure pattern. Record it in `context/foundation/lessons.md` instead of treating it as a one-off note.                                                                             |

### Triage discipline

- Severity says how bad the finding is. Impact says how much the decision matters now.
- Valid outcomes: fix now, fix differently, skip, accept as risk, record as recurring rule (`/10x-lesson`), disagree.
- Fix critical findings. Do not burn hours on low-impact observations just because the agent found them.
- Conscious skipping of low-impact findings is a valid review outcome, not negligence.
- If you disagree with a finding, record why. Wrong agent reasoning is also signal.

### Review boundaries

- This lesson reviews implemented code. It does not create the plan, execute new phases, or teach CI review.
- Testing strategy and quality gates are introduced in Module 3.
- Do not use `/10x-contract` as a triage outcome in this lesson.

### Paths used by this lesson

- `context/changes/<change-id>/plan.md` - expected implementation contract
- `context/changes/<change-id>/reviews/` - review output
- `context/foundation/lessons.md` - recurring lessons

Skills must not write to `context/archive/`. Archived changes are immutable; if a resolved target path starts with `context/archive/`, abort with: "This change is archived. Open a new change with `/10x-new` instead."

<!-- END @przeprogramowani/10x-cli -->
