---
project: KeepInTouch
status: active
created: 2026-09-07
updated: 2026-09-07
---

# Local relationship-data privacy contract

## Purpose

This contract governs every feature that persists relationship data. It implements the PRD's local-storage, owner-only access, and immediate-deletion requirements before person, interaction, or conversation-anchor features are introduced.

## Allowed boundary

- Relationship data is stored only in the active browser profile through the native IndexedDB API.
- Every local vault operation requires the stable ID of the authenticated owner. A missing or blank owner ID is an error; an anonymous or shared default vault is prohibited.
- The relationship-data module is browser-only. It does not import Supabase, server environment values, or server-only modules, and it does not call network APIs.

## Deletion guarantee

When a future feature deletes a parent relationship record, the parent and every record linked to it must be removed in one read-write IndexedDB transaction. The operation reports success only after the transaction completes.

## Threat boundary

For this MVP, protection comes from the user's device and browser profile. The application does not add an app-level passcode or encryption layer. Another signed-in owner using the same browser profile must not be able to read a prior owner's relationship records.

## Explicit MVP exclusions

- No synchronization, including unprotected synchronization.
- No encryption, recovery passphrase, export, backup, or recovery flow.
- No service worker, installability, or offline asset-caching promise.
- No Supabase relationship-data table, storage bucket, API route, or Cloudflare data binding.

## Verification

- `npm test` verifies owner scope and, once implemented, local-vault behavior and cascade deletion.
- `npm run lint` prevents relationship-data modules from importing remote persistence paths or calling network APIs.
- `npm run build` confirms the application and generated Worker configuration remain valid without a data binding.

## Follow-on ownership

S-02 owns person fields and creation. S-04 owns interaction fields. S-05 and S-06 own extracted-anchor fields and behavior. Any future synchronization or recovery work requires a new, explicit privacy design.
