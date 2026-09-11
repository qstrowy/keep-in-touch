# Consolidated Core Topics — Plan Brief

> Full plan: `context/changes/consolidated-core-topics/plan.md`

## What & Why

Replace three overlapping conversation-anchor categories with one concise Core Topics briefing. Questions become
optional, read-only details beneath the topic they support, giving the owner a simpler view before a future conversation.

## Starting Point

KeepInTouch already has authenticated note-only extraction, owner-local atomic replacement, and a three-category
briefing. Its flat response cannot associate a follow-up question with one topic, and its lifecycle model is superseded.

## Desired End State

One manual action produces zero to seven usefulness-ordered Core Topics in the dominant language of the submitted notes.
Each topic owns zero to three grounded questions, starts collapsed, expands independently, and persists locally with its
order and source provenance. Valid success replaces the whole legacy briefing; failure leaves it unchanged.

## Key Decisions Made

| Decision            | Choice                                  | Why                                                                                                   |
| ------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Briefing language   | One dominant language                   | Keeps a mixed-language history visually consistent; the latest note breaks an unclear tie.            |
| Topic order         | Expected usefulness                     | Provider order already supplies ranking, so persistence needs only an explicit position.              |
| Duplicate handling  | Trust the model                         | Duplicate risk is low at seven topics and can be addressed later if observed.                         |
| In-flight new notes | Accept the captured snapshot            | A later note participates in the next manual extraction without invalidating useful work.             |
| Question disclosure | All collapsed, independently expandable | Native disclosure behavior is intuitive, accessible, and allows several topics to remain open.        |
| Text limits         | 500 characters per topic or question    | Reuses the defensive ceiling and lowers whole-response rejection risk; the prompt requests concision. |
| Live acceptance     | Authenticated synthetic OpenRouter run  | Proves the configured provider accepts the new nested schema without exposing personal content.       |
| Astro advisory      | Proceed with recorded temporary risk    | No untrusted image-upload flow exists; the isolated dependency patch remains critical follow-up work. |

## Scope

**In scope:**

- Strict nested extraction contract: up to seven ordered topics and three questions per topic.
- Dominant-language, usefulness-ordered, grounded and concise provider instruction and defensive parsing.
- Owner-local Core Topic records with nested questions, position, and source provenance.
- One collapsed, independently expandable Core Topics list.
- Atomic full replacement, valid-empty clearing, neutral failure preservation, and snapshot behavior.

**Out of scope:**

- Edit, **Not now**, **Don't suggest**, exclusions, semantic deduplication, or closed-topic history.
- Automatic/background extraction, external payload expansion, remote persistence, recent-context cleanup, or UI tests.
- Dependency upgrades inside S-01; the security patch remains separate critical follow-up work.

## Architecture / Approach

The browser keeps combining notes and sending exactly `{ note }` through the existing authenticated relay. OpenRouter
returns strict nested `topics`; the browser adds source IDs and response positions, then conditionally replaces the
person's records in the existing `"anchors"` collection. The briefing reads those records into one ordered list and
renders questions with accessible disclosure controls.

## Phases at a Glance

| Phase           | What it delivers                                           | Key risk                                       |
| --------------- | ---------------------------------------------------------- | ---------------------------------------------- |
| 1. Contracts    | Nested provider, transport, and local Core Topic contracts | Schema drift between provider and parser       |
| 2. Briefing     | One expandable list with snapshot-safe atomic replacement  | Accidentally retaining old lifecycle semantics |
| 3. Verification | Full regression evidence and live synthetic acceptance     | Provider variability or boundary regression    |

**Prerequisites:** Existing configured OpenRouter route and authenticated local/deployed test access. Proceed under the
explicitly accepted temporary Astro advisory risk because no untrusted image-upload flow exists.
**Estimated effort:** About three focused implementation sessions across three resumable phases.

## Open Risks & Assumptions

- Model-only duplicate control may allow semantically repeated topics; defer deterministic handling until observed.
- Dominant-language selection is prompt-enforced rather than detected locally; live mixed-language acceptance is required.
- A result may omit a note added after extraction starts by design; the next manual extraction includes it.
- Keep the critical dependency patch visible after S-01; Wrangler may also emit its known nonfatal log-file EPERM.

## Success Criteria (Summary)

- One manual extraction yields at most seven ordered Core Topics with at most three grounded, read-only questions each.
- Dominant-language output, topic/question association, order, and collapsed disclosure behavior survive reload.
- Empty success clears legacy data; failures preserve it, without weakening privacy or relationship workflows.
