---
change_id: testing-authenticated-ownership-smoke
title: Prove authenticated ownership and local data isolation
status: implementing
created: 2026-09-11
updated: 2026-09-11
archived_at: null
---

## Notes

Open a change folder for rollout Phase 1 of context/foundation/test-plan.md: "Authenticated ownership smoke".
Risks covered: Risk #1 (unauthenticated or different-owner access) and Risk #3 (account switching, reload, deletion, and late-write isolation failures).
Test types planned: integration plus a targeted browser end-to-end smoke path.
Risk response intent: prove signed-out requests are denied; two authenticated owners cannot read or mutate each other's data; reload, owner switch, person deletion, and late writes never expose or recreate deleted or cross-owner records.
Scope constraint: do not test general Cloudflare or Supabase infrastructure. Test only KeepInTouch-owned authorization, owner-scoping, session behavior, and browser-local persistence boundaries.
