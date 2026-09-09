# Establish the local data privacy contract — Plan Brief

> Full plan: `context/changes/local-data-privacy-contract/plan.md`

## What & Why

F-02 establishes the product-data boundary before any relationship record is persisted. It keeps those records in the owner's browser through native IndexedDB, while retaining the existing Supabase integration strictly for authentication.

This is the foundation for later people, interactions, and conversation-anchor slices. It turns the PRD's local-only, owner-only, immediate-deletion promise into code, tests, and a durable team contract.

## Starting Point

The application has Supabase authentication and protected routes but no product schema, browser storage, product API, or remote-data binding. The repository also has no test runner, so the contract currently cannot be verified automatically.

## Desired End State

Later slices receive a small generic local-vault API that requires an authenticated owner ID and never uses a network or Supabase path. Related data can be deleted atomically, and the same privacy guarantees are documented and enforced by tests and lint rules.

## Key Decisions Made

| Decision | Choice | Why |
| --- | --- | --- |
| Local store | Native IndexedDB | Browser-native transactions satisfy local persistence and cascade deletion without a production dependency. |
| Protection model | Browser/device profile | Keeps the MVP lean; app-level encryption and recovery are deferred. |
| Ownership | Stable authenticated user ID | Prevents another account on the same browser from reading a prior owner's records. |
| Schema scope | Generic storage primitives | Person, interaction, and anchor fields stay with the slices that introduce their user flows. |
| Deletion | Atomic transaction | Success is reported only after the root and every dependent record are removed together. |
| Verification | Vitest with `fake-indexeddb` | Adds deterministic contract tests without a full browser test stack. |
| Remote boundary | Prohibited for relationship data | Supabase remains authentication-only; no sync or unprotected data path is introduced. |

## Scope

**In scope:** local owner-scoped vault, generic record contract, atomic cascade deletion, contract documentation, test tooling, and narrow static enforcement.

**Out of scope:** product screens and schemas, passwordless auth, encryption, sync, export, recovery, PWA behavior, Supabase tables, Worker data bindings, and deployment.

## Architecture / Approach

`future feature → owner-scoped local-vault module → IndexedDB`

The vault receives a user ID from the existing authentication layer, stores only generic local records, and enforces its transaction and isolation rules internally. A scoped lint rule prevents modules in this boundary from bypassing it with server or network access.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Boundary and harness | Test command, privacy contract, and generic interface | Accidentally broadening the MVP into sync or encryption work |
| 2. Local vault | Owner-scoped IndexedDB adapter with behavioral tests | Isolation or browser-only assumptions leaking into server code |
| 3. Guarantees | Atomic deletion and static no-remote enforcement | Claiming deletion or privacy guarantees without executable proof |

**Prerequisites:** an authenticated user ID supplied by the existing auth layer; Node 22 validation baseline from F-01.

## Open Risks & Assumptions

- Browser-profile clearing permanently removes relationship data by design for this MVP.
- Browser-profile protection is sufficient for a single-owner MVP; a future encryption/recovery design must replace or extend it before sync is considered.
- Future private screens need client-side hydration to access IndexedDB.

## Success Criteria (Summary)

- Relationship-data code can store and retrieve generic records locally for one owner without a remote path.
- Tests prove owner isolation and atomic removal of parent-linked records.
- Lint and build pass without changing Supabase, Worker, or deployment configuration.
