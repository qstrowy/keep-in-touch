# Extracted anchor briefing — Plan Brief

> Full plan: `context/changes/extracted-anchor-briefing/plan.md`

## What & Why

This change completes KeepInTouch's first useful conversation-anchor loop. An owner will explicitly extract a consolidated set of topics, follow-ups, and suggested next steps from one person's saved notes, then see those open anchors in a compact briefing before the full history.

## Starting Point

People and dated notes already persist only in the authenticated owner's IndexedDB vault. The approved extraction relay accepts one note-only request and returns validated candidates, but no browser flow calls it and no local anchor model exists.

## Desired End State

One manual action processes all saved notes for the selected person as a bounded combined context. The current generated anchor set is replaced only after a valid response and an owner-local source check; failures retain the last good result and offer retry.

## Key Decisions Made

| Decision | Choice | Why |
| --- | --- | --- |
| Extraction scope | All selected-person notes in one request | Later notes can qualify or enrich earlier context. |
| Size limit | Dedicated bounded extraction context; explicit refusal | Never silently drops older context while staying below the Worker request ceiling. |
| Provenance | Store every contributing interaction ID locally | Keeps the source trail without sending identifiers externally. |
| Refresh behavior | Replace the generated set on success | Prevents an indefinitely growing list of stale duplicate anchors. |
| Failure behavior | Preserve prior anchors and offer retry | A transient provider failure must not erase a useful briefing. |
| Disclosure | One compact visible line beside the action | Makes the external-processing boundary clear without obstructing the view. |
| Acceptance data | Synthetic notes only | Real-note use remains an explicit later owner approval. |

## Scope

**In scope:** local anchor records and provenance; bounded full-history construction; explicit extraction, notice, progress/error/retry states; briefing with last contact, three recent notes, and three candidate groups; delete-wins tests.

**Out of scope:** automatic extraction, silent truncation, history compaction, anchor editing/resolution, remote relationship-data storage, and real-note testing.

## Architecture / Approach

```text
owner-local interactions -> combined note text -> same-origin relay -> candidates
        ^                                                     |
        +-- local provenance + atomic generated-anchor replacement <---+
```

The browser knows the person and interaction IDs; the relay receives only the bounded combined note string. Anchors are stored as local person descendants and list their contributing interaction IDs.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Local boundary | Anchor model, atomic replacement, bounded client | Late result recreating deleted data or oversized context reaching the network |
| 2. Manual flow | Briefing, disclosure, action, result and retry states | Duplicate runs or replacing useful anchors after a failure |
| 3. Acceptance gate | Full safety coverage and deployed synthetic verification | Privacy drift when crossing browser, Worker, and local storage boundaries |

**Prerequisites:** archived F-01/F-02/F-03/S-04 work and the verified pinned extraction route.

## Open Risks & Assumptions

- All-history context will eventually outgrow the bounded request budget; a future change must own compaction or selection.
- The model may produce no candidates; a valid empty response intentionally clears the generated set.
- Real personal-note use remains disabled by policy until an explicit post-implementation approval.

## Success Criteria (Summary)

- The owner can use synthetic notes to extract and view a current, grouped anchor briefing without duplicate accumulation.
- Only combined note text crosses the relay; provenance and all linked metadata remain local.
- Oversized, failed, and stale/deleted-source attempts leave original notes and prior valid anchors safe.
