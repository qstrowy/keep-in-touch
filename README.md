# KeepInTouch

KeepInTouch is a private memory aid for preserving meaningful details from conversations and finding a natural anchor before reconnecting with someone. The first MVP is a smartphone-oriented web app for a single primary user.

## MVP scope

The planned core flow is:

1. Sign in with passwordless email.
2. Create a person and record a dated, free-text interaction note.
3. Extract topics and potential follow-ups without sending profile names, birthdays, or account identifiers to the external model.
4. Correct, dismiss, resolve, and later review those items as conversation anchors.

Upcoming birthdays are required for the MVP. Gift suggestions based on interests are optional. See [`context/foundation/prd.md`](context/foundation/prd.md) for the product contract and [`context/foundation/tech-stack.md`](context/foundation/tech-stack.md) for the selected architecture.

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
npm test          # Run the Vitest unit and component suite
npm run e2e       # Run the Playwright browser suite
npm run typecheck # Check TypeScript and Astro diagnostics
npm run lint      # Run type-aware lint and formatting checks
npm run lint:fix  # Apply supported lint fixes
npm run format    # Format files with Prettier
npm run build     # Produce the Cloudflare build
npm run preview   # Preview the production build locally
```

The browser suite uses a fixed synthetic session seam and does not call hosted Supabase or send real sign-in emails. Verify production passwordless sign-in manually after deployment.

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

Never commit `.env`, `.env.*`, or `.dev.vars`; `.env.example` contains placeholders only. The historical bootstrap findings remain recorded in [`context/archive/2026-08-21-bootstrap-verification/verification.md`](context/archive/2026-08-21-bootstrap-verification/verification.md). The first infrastructure release upgraded the affected framework and tooling; `npm audit` is a required release gate.

## Deployment

The application targets Cloudflare Workers. After configuring Cloudflare and Supabase secrets:

```bash
npm run build
npx wrangler deploy
```

GitHub Actions runs typechecking, linting, Vitest, the production build, and the Playwright smoke suite for pushes and
pull requests targeting `main`.

Project-local Codex hooks run lint and typecheck after edits. Review and trust `.codex/hooks.json` with `/hooks` before
the hooks can run for the first time; Codex records trust against the exact hook definition.

### Restore Cloudflare Access on production

To put the Cloudflare Access login gate back in front of the production Worker, sign in at [dash.cloudflare.com](https://dash.cloudflare.com), then open **Workers & Pages → keep-in-touch → Access**. Change the Worker access scope from **Previews only** to **All traffic** and apply the change. This re-protects production and previews with the existing authentication policies; leave the account-wide Access setting unchanged.

The preferred rollback is this Access-scope change. For the emergency option of disabling the production `workers.dev` route, see the [infrastructure guide](context/foundation/infrastructure.md); a later Wrangler deployment can re-enable the route while `workers_dev: true` remains configured.
