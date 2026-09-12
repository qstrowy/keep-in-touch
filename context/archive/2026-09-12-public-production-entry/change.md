---
change_id: public-production-entry
title: Make production sign-in publicly accessible
status: archived
created: 2026-09-12
updated: 2026-09-12
archived_at: 2026-09-12T17:08:07Z
---

## Notes

Allow visitors to reach the branded sign-in screen on production without Cloudflare Access. Keep the local development setup unchanged; for this MVP, target one main remote production environment. Supabase passwordless authentication continues to protect the dashboard and owner-local data. The intended MVP account model is public self-service sign-up: anyone with a valid email may request a magic link and create an account; there is no invite or approval workflow.
