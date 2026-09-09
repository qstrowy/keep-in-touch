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

## 10xDevs AI Toolkit - Module 2, Lesson 4

Prepare for a harder implementation stream with the **research-backed planning chain**:

```
internal research (/10x-research) + external research (exa.ai, Context7) -> /10x-plan -> /10x-implement -> success
```

The lesson focus is distinguishing internal from external research and using evidence to back planning decisions.

### Task Router - Where to start

| Skill | Use it when |
| --- | --- |
| **Internal research (lesson focus)** | |
| `/10x-research <change-id>` | You need evidence from the existing codebase — patterns, conventions, integration points, or existing implementations. Runs parallel sub-agents over the repo and writes structured findings to `research.md`. |
| **External research (lesson focus)** | |
| exa.ai | You need AI-native web search for library comparisons, best practices, or ecosystem context that the codebase cannot answer. |
| Context7 (`resolve-library-id` → `get-library-docs`) | You need live, current documentation for a specific library or framework. Resolves a library ID first, then fetches relevant doc pages. |
| **Framing spare wheel** | |
| `/10x-frame <change-id>` | The plan won't converge, the plan doesn't deliver expected results, or persistent drift keeps breaking the implementation. Use as an escape hatch on a separate problem (demonstrated on Space Explorers example), not as pre-research ritual. |
| **Planning and execution** | |
| `/10x-plan <change-id>` / `/10x-implement <change-id> phase <n>` | Use the same planning and execution chain from Lesson 2, now with upstream research evidence feeding the plan. |

### Research discipline

- Internal research (`/10x-research`) answers "what does our codebase already do?" — patterns, schemas, conventions, integration points.
- External research (exa.ai, Context7) answers "what should we do?" — library capabilities, API docs, ecosystem best practices.
- Combine both as evidence-backed input to `/10x-plan`. A plan without research evidence on a non-trivial stream is a guess.
- Agent-friendly docs (`llms.txt`, markdown-for-agents, `/md` endpoints) are a quality signal for library selection — libraries that publish agent-readable docs integrate faster.

### `/10x-frame` as spare wheel

Three triggers for reaching for `/10x-frame`:
1. The plan won't converge — research keeps opening more questions instead of narrowing to a contract.
2. The plan doesn't deliver — implementation repeatedly fails to meet success criteria.
3. Persistent drift — the implementation keeps diverging from the plan in ways that suggest the problem was mis-framed.

Demonstrated on a Space Explorers example, not the SRS path. It is an escape hatch, not a mandatory step.

### Paths used by this lesson

- `context/changes/<change-id>/research.md` - internal research output
- `context/changes/<change-id>/frame.md` - framing output when needed
- `context/changes/<change-id>/plan.md` - evidence-backed implementation contract
- `context/foundation/lessons.md` - recurring rules and pitfalls

Skills must not write to `context/archive/`. Archived changes are immutable; if a resolved target path starts with `context/archive/`, abort with: "This change is archived. Open a new change with `/10x-new` instead."

<!-- END @przeprogramowani/10x-cli -->
