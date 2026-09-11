# Manage Current Core Topics — Plan Brief

> Full plan: `context/changes/manage-current-core-topics/plan.md`

## What & Why

This change gives the owner lightweight control over the current Core Topics briefing: revise a topic's wording or hide it with **Not now**. Both actions are browser-local and last until the next valid successful manual extraction creates a fresh briefing snapshot.

## Starting Point

Core Topics already render as independent collapsed disclosures and persist in the owner-local `anchors` collection. Successful extraction replaces that collection atomically, but the current vault lacks safe single-topic mutations and the UI has no edit or hide controls.

## Desired End State

An owner can edit one topic inline or remove it with **Not now**, reload, and see the current briefing unchanged. Failed extraction retains those choices; a valid later extraction deliberately replaces them, so no permanent edit, exclusion, or history is created.

## Key Decisions Made

| Decision             | Choice                                                  | Why                                                                                    |
| -------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Persistence horizon  | Until valid successful extraction                       | Makes actions useful across reloads without turning them into durable lifecycle state. |
| **Not now** behavior | Immediate local hide, no confirmation or undo           | Keeps the control lightweight and distinct from S-03 exclusion.                        |
| Edit scope           | Topic wording only                                      | Questions, order, and provenance remain generated, read-only context.                  |
| Concurrent actions   | One editor; lock controls and Generate during mutations | Prevents competing local writes and extraction races in a small mobile UI.             |
| Late deletion safety | Parent-checked local mutations                          | Prevents an edit from recreating a topic after its person is deleted.                  |
| Reset                | Existing successful full replacement                    | Preserves the proven snapshot model and needs no special reconciliation.               |

## Scope

**In scope:** owner-local edit/hide operations, inline mobile controls, reload persistence, extraction reset behavior, and targeted storage/boundary tests.

**Out of scope:** exclusions, provider changes, durable wording, restoration/history, question editing, interaction deletion, automatic work, server persistence, and a new UI-test framework.

## Architecture / Approach

The Core Topic record shape stays stable. A narrow IndexedDB mutation API verifies the owner, person, and target child before updating its text or removing it; `AnchorBriefing` uses it for inline controls. The existing successful collection replacement remains the sole reset mechanism.

## Phases at a Glance

| Phase                                   | What it delivers                                        | Key risk                                                                 |
| --------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1. Safe local mutations                 | Valid edit/hide storage operations and deletion safety  | A late action could resurrect an orphaned topic.                         |
| 2. Inline controls and regression proof | Accessible controls, locking, and complete verification | Temporary state could accidentally become durable or externally visible. |

**Prerequisites:** Archived S-01 Core Topics snapshot flow and the existing owner-local vault.
**Estimated effort:** ~2 focused sessions across 2 phases.

## Open Risks & Assumptions

- **Not now** cannot be undone before the next successful extraction; that is intentional for this lean slice.
- The existing manual browser acceptance flow remains the UI verification method; no test dependency is added.
- The pre-existing uncommitted roadmap edit remains outside this change's staging set.

## Success Criteria (Summary)

- Edits and **Not now** persist privately through reloads and failed extraction, then reset only on valid successful extraction.
- People, interactions, owner isolation, deletion cascade, and the note-only extraction boundary remain unchanged.
- All automated checks pass and browser controls work accessibly on a narrow screen.
