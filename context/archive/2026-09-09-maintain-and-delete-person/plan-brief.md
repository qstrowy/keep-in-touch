# Maintain or remove a person — Plan Brief

> Full plan: `context/changes/maintain-and-delete-person/plan.md`

## What & Why

This change completes the private person lifecycle: the owner can select a saved person, add another, edit approved details, and permanently remove a person with associated relationship data. It fulfils FR-002 and the local privacy contract before interactions create more linked records.

## Starting Point

The dashboard can create and show only the first owner-local person. The browser-local vault already supports same-ID replacement and owner-scoped cascade deletion, but the dashboard does not expose either capability.

## Desired End State

The owner sees a small list of locally stored people by display name and can select one to edit or delete. Edits preserve record identity; deletion is explicitly confirmed and removes the selected root plus linked records immediately, returning to an unselected list or empty creation state.

## Key Decisions Made

| Decision | Choice | Why |
| --- | --- | --- |
| Person scope | Small local list plus add-person action | Makes selection useful without routes, search, or a full directory. |
| List labels | Display name only | Keeps the MVP simple; the owner may use descriptive names when needed. |
| Edit UI | Replace summary with a prefilled existing form | Reuses established validation and error recovery. |
| Birthday edits | Change or clear both fields | Keeps the optional field genuinely optional. |
| Delete UX | Inline two-step permanent-delete confirmation | Prevents accidental loss without browser-modal complexity. |
| Post-delete state | Unselected list; creation form if none remain | Makes deletion explicit and keeps next actions clear. |
| Verification | Vault integration tests plus browser checks | Matches the existing lean Vitest setup. |

## Scope

**In scope:** owner-local people list, add another person, selection, edit, birthday removal, confirmed cascade deletion, storage tests, and browser verification.

**Out of scope:** search, sorting controls, routes, profiles, avatars, remote persistence, APIs, encryption, recovery, and the deferred birthday-selector accessibility fix.

## Architecture / Approach

The existing hydrated dashboard island remains the only person-data consumer. It reads the active owner's `people` collection, uses the person module for validation/record conversion, replaces records through the existing vault key, and deletes the selected root through the established cascade transaction.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Storage lifecycle proof | Update and cascade owner-isolation tests | Regressing the privacy/deletion guarantee. |
| 2. Selection and editing | Small people list, add, and prefilled edit form | Keeping form state and selected record ID correct. |
| 3. Confirmed removal | Explicit destructive action and browser proof | Never reporting success before deletion completes. |

**Prerequisites:** S-02 implementation is complete; the existing local vault remains the only relationship-data boundary.

## Open Risks & Assumptions

- The existing local collection is intentionally small; a future directory slice must revisit list scale and navigation.
- Deletion is permanent when browser-local data is removed; no recovery path exists by MVP design.

## Success Criteria (Summary)

- The owner can add, select, and update private people without duplicate records or remote persistence.
- Confirmed deletion immediately removes the selected person and linked records only for that owner.
- Tests, lint, build, and authenticated browser checks pass without changing auth or deployment configuration.
