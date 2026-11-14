# Presentation demo

Run `npm run demo` to start the local app and open a dedicated persistent Edge profile.
The demo uses the existing development-only synthetic owner session on
`http://127.0.0.1:4322`. Use the Edge window opened by the command; another browser
does not have its local data or synthetic authentication.

Playwright creates five entirely fictional people, thirteen dated notes and fifteen
sample Core Topics through the application UI, then reloads and verifies them.
Marta is a running friend, Piotr is family with a woodworking project, Anna is a new
team lead, Julia is a friend abroad, and Tomasz is a neighbour starting a garden.
Each topic has suggested questions, and the profiles have birthdays.

The AI responses are curated presentation fixtures intercepted by Playwright.
They exercise the real UI and browser storage, but do not demonstrate live model
generation, server extraction authentication, or real email sign-in. New notes can
be saved normally; generation returns the matching person's sample topics. An
unknown person's notes return an explicit fixture error. Confirmed exact topic
exclusions are respected. Avoid describing this fixture run as a live AI demo.

The demo opens at 1600 x 900 (16:9). Data persists in `.presentation-demo/profile`; six PNGs are saved in
`.presentation-demo/screenshots`. Re-running the command reuses the same people
and notes without rerunning population when all five profiles are present.
Keep the demo process running for synthetic authentication and generation to work.
Do not run the normal `npm run e2e` command during the presentation: it stops the
repository's dev server. Closing the Edge window ends the browser session; the
local server remains available until stopped with `npx astro dev stop`.

Run `npm run demo:verify` for the independent Playwright verification and an
additional screenshot set. Generated profiles, screenshots and test results are
ignored by Git. Production application code is unchanged.
