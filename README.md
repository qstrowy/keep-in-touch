# KeepInTouch

KeepInTouch is a private memory aid for preserving meaningful details from conversations and finding a natural anchor before reconnecting with someone. The first MVP is a smartphone-oriented web app for a single primary user.

## MVP scope

The planned core flow is:

1. Sign in with passwordless email.
2. Create a person and record a dated, free-text interaction note.
3. Extract topics and potential follow-ups without sending profile names, birthdays, or account identifiers to the external model.
4. Correct, dismiss, resolve, and later review those items as conversation anchors.

Upcoming birthdays are required for the MVP. Gift suggestions based on interests are optional. See [`context/foundation/prd.md`](context/foundation/prd.md) for the product contract and [`context/foundation/tech-stack.md`](context/foundation/tech-stack.md) for the selected architecture.

> The current scaffold includes reference email/password authentication screens. They must be adapted to the passwordless flow defined in the PRD.

## Technology

- Astro 7 with React 19 and strict TypeScript
- Tailwind CSS 4
- Supabase authentication and data services
- Cloudflare Workers runtime and deployment
- ESLint, Prettier, Husky, and lint-staged

## Local setup

Use Node.js 22.23.2, as declared in `.nvmrc`.

```bash
npm ci
cp .env.example .env
cp .env.example .dev.vars
npm run dev
```

Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in `.env` and `.dev.vars`. To run Supabase locally, Docker and approximately 7 GB of memory are required:

```bash
npx supabase start
npx supabase stop
```

## Commands

```bash
npm run dev       # Start the development server
npm run lint      # Run type-aware lint and formatting checks
npm run lint:fix  # Apply supported lint fixes
npm run format    # Format files with Prettier
npm run build     # Produce the Cloudflare build
npm run preview   # Preview the production build locally
```

No automated test runner is configured yet. Until one is added, `npm run lint` and `npm run build` are the required validation checks.

## Project structure

```text
src/pages/       Routes and API handlers
src/components/  Astro and React components
src/layouts/     Shared page layouts
src/lib/         Utilities and integrations
src/styles/      Global styles
public/          Static assets
supabase/        Local Supabase configuration
context/         Product, stack, and change documentation
```

## Security status

Never commit `.env`, `.env.*`, or `.dev.vars`; `.env.example` contains placeholders only. The historical bootstrap findings remain recorded in [`context/changes/bootstrap-verification/verification.md`](context/changes/bootstrap-verification/verification.md). The first infrastructure release upgraded the affected framework and tooling; `npm audit` is a required release gate.

## Deployment

The application targets Cloudflare Workers. After configuring Cloudflare and Supabase secrets:

```bash
npm run build
npx wrangler deploy
```

GitHub Actions runs synchronization, linting, and the production build for pushes and pull requests targeting `main`.
