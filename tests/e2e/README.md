# Browser ownership smoke

Run the smoke locally with:

```powershell
npm run e2e
```

The command stops any Astro dev server already registered for this repository,
starts a local test server with `KEEP_IN_TOUCH_E2E=1`, and runs Playwright
against `http://127.0.0.1:4322`. The synthetic session accepts only the fixed
owner A and owner B selectors used by the fixtures; normal production mode
does not enable it.

Each Playwright test receives a fresh browser context, so its IndexedDB data is
isolated and discarded when the test finishes. For a manual run, use a fresh
browser profile or clear the `keep-in-touch-relationship-data` IndexedDB
database before repeating the scenario. The smoke uses the application-owned
session seam and does not require real credentials, email, or provider calls.
