# Record dated interaction — Plan Brief

> Full plan: `context/changes/record-dated-interaction/plan.md`

## What & Why

This change lets an owner save a dated free-text interaction for a selected person and immediately see the original note in that person's private local history. It delivers FR-003 and establishes the parent-child record shape that later extraction and conversation-anchor slices will build on.

## Starting Point

The dashboard currently manages only owner-local people. The existing IndexedDB vault already supports owner-scoped generic records, parent-child lookups, and atomic cascade deletion, but there is no interaction contract, storage coverage, or UI.

## Desired End State

For a selected person, the owner can save a required note of up to 5,000 characters with a date that defaults to today and permits backfill only. Every valid local interaction appears with its original date and note in newest-date-first history; equal dates are consistently ordered using undisplayed creation metadata.

## Key Decisions Made

| Decision       | Choice                                            | Why                                                                                              |
| -------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Persistence    | Parent-linked `interactions` records in IndexedDB | Reuses owner isolation and person cascade deletion without a schema change.                      |
| Date model     | Local `YYYY-MM-DD`, today or earlier              | Represents a dated interaction without time-zone shifts or future entries.                       |
| Note policy    | Required trimmed text, 5,000-character maximum    | Preserves meaningful context while establishing a safe future-processing boundary.               |
| History        | All valid local entries, newest date first        | Makes original-note preservation immediately visible in the small MVP.                           |
| Same-day order | Internal creation timestamp, not displayed        | Produces stable order without adding a user-visible time field.                                  |
| Lifecycle      | Save-only, immutable interactions                 | Keeps S-04 focused on preserving original interactions; later slices own derived anchor control. |

## Scope

**In scope:** typed interaction validation and record conversion; owner-local storage and cascade tests; selected-person date/note form; retry-safe saving; and local interaction history.

**Out of scope:** individual interaction editing/deletion, LLM extraction, conversation-anchor proposals, briefing, remote persistence, APIs, sync, search, pagination, and time-of-day entry.

## Architecture / Approach

A typed interaction module creates parent-linked generic vault records. A dedicated interaction panel inside the selected person summary loads those records by parent, validates and saves new entries through the existing vault, and maintains its own local history state.

## Phases at a Glance

| Phase                               | What it delivers                                           | Key risk                                                            |
| ----------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------- |
| 1. Local interaction contract       | Validated, owner-local child records and privacy tests     | Accidentally weakening the browser-only boundary.                   |
| 2. Selected-person interaction flow | Date/note form, retry recovery, and complete local history | Losing entered notes or mixing one person's history with another's. |

**Prerequisites:** The existing F-01/F-02/S-02 local vault and authenticated dashboard path remain available.
**Estimated effort:** ~2 focused implementation sessions across 2 phases.

## Open Risks & Assumptions

- Rendering all local entries is appropriate only for the MVP's intentionally small personal collections.
- The browser's local calendar supplies the default and future-date boundary; the persisted interaction date is deliberately time-zone independent.
- The existing person cascade transaction remains the only deletion path for interactions in this slice.

## Success Criteria (Summary)

- An owner can save and reload date-only, original free-text interactions for the selected person without remote persistence.
- Invalid or failed saves retain actionable inline guidance and preserve form values for retry.
- Owner isolation, parent cascade deletion, and the protected auth/deployment boundaries remain verified.
