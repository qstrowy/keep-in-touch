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

No automated test framework is configured yet. Until one is added, every change must pass `npm run lint` and `npm run build`. When introducing business logic, add a test runner and an explicit `npm test` script in the same change; colocate tests as `*.test.ts` or `*.test.tsx` beside the code under test.

## Commit & Pull Request Guidelines

Use concise Conventional Commit subjects such as `feat: add contact notes` or `fix: protect dashboard route`. Pull requests should explain the change, link relevant work items, list verification commands, include screenshots for UI changes, and call out environment, database, or deployment changes.

## Security & Configuration

Copy `.env.example` into `.env` and `.dev.vars` for local secrets. Never commit real Supabase credentials or expose server-only values to client code. Document any new environment variable in `.env.example` and deployment configuration.

<!-- BEGIN @przeprogramowani/10x-cli -->

## 10xDevs AI Toolkit - Module 2, Lesson 2

Turn one roadmap item into the first implementation cycle with the **change planning chain**:

```
/10x-roadmap -> /10x-new -> /10x-plan -> /10x-plan-review -> /10x-implement
```

`/10x-new`, `/10x-plan`, `/10x-plan-review`, and `/10x-implement` are the lesson focus. `/10x-frame` and `/10x-research` are not required rituals here; they are escalation paths introduced in the next lesson.

### Task Router - Where to start

| Skill | Use it when |
| --- | --- |
| **Change setup (lesson focus)** | |
| `/10x-new <change-id>` | You selected a roadmap item and need a stable change folder. Creates `context/changes/<change-id>/change.md` so planning, implementation, progress, commits, and later review all share one identity. Use AFTER roadmap selection, BEFORE `/10x-plan`. |
| **Planning (lesson focus)** | |
| `/10x-plan <change-id>` | You have a change folder and need a reviewable implementation plan. Reads roadmap context, foundation docs, codebase evidence, and any existing change notes; writes `plan.md` and `plan-brief.md` with phases, file contracts, success criteria, and `## Progress`. |
| **Plan readiness (lesson focus)** | |
| `/10x-plan-review <change-id>` | You have `plan.md` and need a light pre-code readiness check. Use it to catch missing end state, weak contracts, malformed progress, scope drift, or blind spots before code changes begin. |
| **Implementation (lesson focus)** | |
| `/10x-implement <change-id> phase <n>` | You have an approved plan and want to execute one phase with verification, manual gate, commit ritual, and SHA write-back to `## Progress`. |
| **Lifecycle closure** | |
| `/10x-archive <change-id>` | A change is merged or intentionally closed. Move it out of active `context/changes/` into archive state. |

### How the chain hands off

- `/10x-new` creates the durable change identity.
- `/10x-plan` turns that identity into an implementation contract.
- `/10x-plan-review` checks the plan before the agent mutates code.
- `/10x-implement` executes one planned phase, verifies, asks for manual confirmation when needed, commits, and records progress.

### Lesson boundaries

- Plan is the default router after roadmap selection. Start with `/10x-plan` unless the problem is unclear or external evidence is blocking.
- Do not run `/10x-frame + /10x-research` as ceremony for every change.
- Do not turn this lesson into a full end-to-end product build. A checkpoint with a planned and partially or fully implemented stream is valid.
- Code review of the implemented diff belongs to Lesson 3 via `/10x-impl-review`.
- Lifecycle closure via `/10x-archive` after a change is merged or intentionally closed.

### Paths used by this lesson

- `context/foundation/roadmap.md` - upstream roadmap
- `context/changes/<change-id>/change.md` - change identity
- `context/changes/<change-id>/plan.md` - implementation contract
- `context/changes/<change-id>/plan-brief.md` - compressed handoff
- `context/foundation/lessons.md` - recurring rules and pitfalls
- `docs/reference/contract-surfaces.md` - load-bearing names registry

Skills must not write to `context/archive/`. Archived changes are immutable; if a resolved target path starts with `context/archive/`, abort with: "This change is archived. Open a new change with `/10x-new` instead."

<!-- END @przeprogramowani/10x-cli -->
