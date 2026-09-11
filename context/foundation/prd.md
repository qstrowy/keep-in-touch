---
project: KeepInTouch
version: 1
status: draft
created: 2026-09-10
context_type: brownfield
product_type: web-app
target_scale:
  users: small
  qps: low
  data_volume: small
timeline_budget:
  delivery_weeks: 1
  hard_deadline: 2026-09-12
  after_hours_only: false
---

## Current System Overview

KeepInTouch is an existing smartphone-oriented web application that acts as a private relationship memory aid. Its current MVP lets an owner add and store people, record dated free-text interactions, reject future interaction dates, browse interaction history, and manually request generated conversation anchors.

The existing application uses Astro, React, strict TypeScript, Supabase authentication, Cloudflare Workers, and owner-local relationship storage. The infrastructure, people-storage flow, dated-interaction input, chronological timestamps, and on-demand model invocation are preserved by this change. The current user base is the creator or a small handful of owners.

The current person screen duplicates interaction history by showing the five most recent interactions near the top and the complete history farther down. Generated future-conversation context is also divided into three categories whose actions and meanings substantially overlap.

## Problem Statement & Motivation

The person screen should have two clear axes: one chronological stream of dated interaction notes as its input, and a prominent set of consolidated Core Topics as context for a future conversation. Optional generated follow-up questions should support a Core Topic without competing with it as a separate primary category.

The duplicated recent-interaction section should be removed because the owner can reach recent notes at the top of the single scrollable history and continue scrolling for older notes. People management, relationship storage, dated interaction behavior, existing infrastructure, and deliberate on-demand model calls should remain unchanged.

Person Details and Recommendations belong to the broader product direction and should be captured as later roadmap slices rather than included in the first Core Topics implementation. Voice-note transcription is also deferred. The privacy boundary may later expand to support an optional year of birth so an approximate age can be available.

The change is needed now because the implemented anchor-management flow exposed that three overlapping categories and exact-text lifecycle matching do not provide reliable future-conversation context. The current workaround is to interpret the categories manually and repeatedly manage rephrased suggestions, which adds friction and weakens trust in the briefing.

## User & Persona

The primary persona remains the creator of KeepInTouch, using it as a private second brain for personal and professional relationships. They add an imperfect note whenever something worth remembering comes to mind and later return to a person's profile for concise context before another conversation.

## Success Criteria

### Primary

- Manual extraction produces one concise Core Topics list instead of three overlapping primary categories.
- The owner can expand a topic to see non-editable follow-up questions, edit the topic text, hide it temporarily with **Not now**, or exclude it from future suggestions with a confirmed **Don't suggest** action.
- Later manual extractions receive the current exclusion list and are instructed to avoid those topics on a best-effort basis.

### Secondary

- If time remains, the person screen can remove the duplicated five-recent-interactions section and retain only the complete chronological history.
- Later product slices can add Excluded Topics management, individual interaction deletion, background extraction, Person Details, Recommendations, optional age enrichment from year of birth, and voice-note transcription. None is required to ship the Core Topics change.

### Guardrails

- Existing people creation, editing, deletion, and owner-local relationship storage continue to work unchanged.
- Dated interaction capture, chronological history, timestamps, and rejection of future dates continue to work unchanged.
- Authentication and owner isolation remain unchanged, and model extraction runs only after an explicit owner request.

## User Stories

### US-01: Prepare for a future conversation

- **Given** the owner has an existing person with dated interaction notes and may have previously excluded some subjects
- **When** the owner manually requests a new extraction
- **Then** they see one consolidated list of no more than seven useful Core Topics that respects their current Excluded Topics

Before this change, the owner receives three overlapping categories and must manually interpret and manage rephrased suggestions.

#### Acceptance Criteria

- Expanding a Core Topic shows no more than three grounded, non-editable follow-up questions.
- Editing changes the Core Topic text shown to the owner.
- **Not now** removes the topic from the current view while permitting a later extraction to suggest it again.
- After confirmation, **Don't suggest** removes the topic, adds it to the stored exclusion context, and ensures later extraction requests instruct the model not to return that subject as a Core Topic or follow-up question.
- Extraction does not modify or delete the original interaction history.

## Scope of Change

### Core Topics

- [modified] FR-001: An owner can view one chronological dated interaction history without a separate duplicate of the five most recent entries. Priority: nice-to-have
  > Socrates: Counter-arguments considered: removing the separate recent section might make the newest context less glanceable, and the cleanup is not required for Core Topics. Resolution: retained as a small if-time-allows cleanup; the same newest entries remain at the top of the complete history, but its omission does not block the MVP.
- [modified] FR-002: An owner can manually generate one consolidated list of no more than seven useful Core Topics from a person's interaction history. Priority: must-have
  > Socrates: Counter-argument considered: one list may blur subjects and concrete follow-up actions. Resolution: kept without visible subtypes; actionable matters can be Core Topics, and the owner can understand them without another classification layer.
- [new] FR-003: An owner can expand a Core Topic to view no more than three grounded, non-editable follow-up questions that offer useful alternative angles rather than restating the topic. Priority: must-have
  > Socrates: Counter-argument considered: generated questions may be generic, repetitive, or less useful than the Core Topic. Resolution: kept as a secondary expandable feature; extraction should seek unusual but context-grounded angles that help the owner view the topic from another perspective.
- [modified] FR-004: An owner can edit the Core Topic text shown in their current private briefing. Priority: must-have
  > Socrates: Counter-argument considered: a later extraction may overwrite the owner's edited wording and make Edit feel unreliable. Resolution: keep current-session topic editing in the MVP; durable owner-authoritative wording across later extractions is deferred as FR-016.
- [modified] FR-005: An owner can choose **Not now** to hide a Core Topic from the current view while allowing the next or any later manual extraction to suggest it again. Priority: must-have
  > Socrates: Counter-argument considered: a topic returning on the next extraction may make Not now ineffective for people contacted frequently. Resolution: kept for the MVP because extraction is expected primarily before a later meeting; duration- or event-based snoozing remains a future consideration.
- [modified] FR-006: An owner can confirm **Don't suggest** to hide a Core Topic and add its subject to the best-effort exclusion context used by future Core Topic and follow-up-question extraction. Priority: must-have
  > Socrates: Counter-argument considered: model instructions cannot deterministically prevent a semantically reworded excluded subject from returning. Resolution: accepted for the MVP; every manual extraction must include the current exclusion list, while semantic compliance remains explicitly best-effort.
- [modified] FR-008: An owner can manually regenerate Core Topics with the complete current exclusion context applied without changing the person's original interaction history. Priority: must-have
  > Socrates: Counter-argument considered: resending accumulated exclusions expands model disclosure and may eventually increase prompt size. Resolution: accepted for the small personal MVP; context-window pressure is not expected in foreseeable use, and compaction can be designed later if needed.

### Preserved capabilities

- [preserved] FR-009: An owner can continue creating, editing, deleting, and storing people with the existing behavior throughout the Core Topics change. Priority: must-have
  > Socrates: Counter-argument considered: freezing the person model prevents adding optional birth year, Person Details navigation, or exclusion management in this slice. Resolution: preserved for this one-week change to reduce delivery risk; those person-profile changes remain eligible for later slices.
- [preserved] FR-010: An owner can continue recording and browsing dated interaction notes with timestamps and rejection of future dates. Priority: must-have
  > Socrates: Counter-argument considered: an incorrect or outdated interaction may keep influencing generated Core Topics when individual notes cannot be removed. Resolution: preserve the current workflow for this MVP and defer individual interaction deletion as FR-017.
- [preserved] FR-011: An owner can continue signing in through the existing access model, keep relationship data owner-local, and invoke model extraction only on demand. Priority: must-have
  > Socrates: Counter-argument considered: automatic or background extraction could keep topics fresher without a manual action. Resolution: preserve explicit on-demand extraction for the MVP; background processing remains future scope.

### Future capabilities

- [new] FR-007: An owner can view their Excluded Topics for a person and restore an excluded subject. Priority: nice-to-have
  > Socrates: Counter-argument considered: a management panel adds UI and lifecycle overhead for something the owner may rarely revisit. Resolution: deferred from the MVP while retained as a future capability; the MVP keeps confirmation before Don't suggest.
- [new] FR-012: An owner can view a concise Person Details summary derived from recorded interaction context, including approximate age when an optional year of birth is available. Priority: nice-to-have
  > Socrates: Counter-argument considered: summarizing sensitive or inaccurate personal facts may feel like surveillance. Resolution: retained for later as a private second-brain capability comparable to personal notes; details must be grounded in recorded interactions, remain owner-private, and be correctable.
- [new] FR-013: An owner can view recommendations extracted from a person's interaction context in a collection separate from Core Topics. Priority: nice-to-have
  > Socrates: Counter-argument considered: the model may confuse something a person liked or disliked with an explicit recommendation. Resolution: accept the low-impact mistake for this future feature; the resulting suggestion may still be useful or become a light conversation story.
- [new] FR-014: An owner can browse recommendations aggregated across people, mark one as experienced, and save a comment as a passive interaction associated with the recommending person. Priority: nice-to-have
  > Socrates: Counter-argument considered: the history would contain an experience completed independently rather than a direct conversation. Resolution: intentional; a recommendation reaction is a passive interaction connected to the person and may become useful context for a later conversation.
- [new] FR-015: An owner can record a voice note, transcribe it, and save the transcription as an interaction. Priority: nice-to-have
  > Socrates: Counter-argument considered: transcription errors could pollute interaction history. Resolution: the current preference is owner review and editing before save, but this capability is distant future scope and its workflow must be reshaped before implementation.
- [modified] FR-016: An owner can keep their edited Core Topic wording authoritative across later extractions until they deliberately change the topic's lifecycle state. Priority: nice-to-have
  > Socrates: Counter-argument considered: permanent owner wording may preserve a stale interpretation after later interactions change the subject. Resolution: retain only as a future question and redesign the reconciliation behavior before implementation.
- [new] FR-017: An owner can delete an individual interaction so it no longer appears in history or influences later extraction. Priority: nice-to-have
  > Socrates: Counter-argument considered: deleting a source interaction can leave previously derived topics or future summaries stale. Resolution: deletion removes the source record only; extraction remains a separate deliberate action, and the owner reruns it when they want derived context refreshed.

## Constraints & Compatibility

- Existing authentication, flat owner access, and owner-local relationship storage behavior must not change.
- Existing people-management and dated-interaction behavior must continue to work after the change, but current local test records do not require preservation.
- Old generated anchor records and the three-category anchor contract may be discarded.
- Extraction remains an explicit owner action. Automatic or background processing is outside this MVP.
- The existing external processing privacy boundary remains, with Excluded Topics added to the permitted manual extraction content.
- A manual extraction either completes successfully or reports failure within 90 seconds.
- A failed extraction leaves the existing Core Topics briefing unchanged.
- Saving an interaction does not invoke external processing.
- Relationship data remains owner-local except for content deliberately submitted during a manual extraction request.
- A manual Core Topics request may contain interaction text and Excluded Topics but contains no person name, birthday, account identifier, or other profile fields.
- Submitted extraction content is not retained by the processor or used for training.
- Semantic compliance with Excluded Topics is best-effort and is not presented as a deterministic guarantee.

## Business Logic Changes

KeepInTouch turns a person's recorded interactions into no more than seven useful Core Topics, attaches up to three perspective-broadening questions to each topic, and uses the owner's exclusions to discourage unwanted subjects in later manual extractions.

The current rule produces three overlapping categories of conversation context. This change replaces those categories with one primary Core Topics list; questions are subordinate prompts revealed only when the owner expands a topic.

The rule consumes the person's recorded interaction text together with the owner's Excluded Topics. **Not now** hides a topic from the current view but leaves it eligible for a later extraction. After confirmation, **Don't suggest** stores the subject as exclusion context for later extraction on a best-effort basis. Editing changes only the topic displayed in the current managed briefing; durable owner-authoritative wording remains future scope.

## Access Control Changes

Users continue to sign in through passwordless email authentication. Each owner can access only their own relationship data. Core Topics, optional follow-up questions, future Person Details, future Recommendations, and an optional year of birth introduce no new roles, sharing, collaboration, or access-control behavior.

No access control changes are planned; the current model is preserved.

## Non-Goals

- No Person Details or optional birth-year and age enrichment; those require a separate profile-context slice.
- No Recommendations, aggregate recommendation view, or passive-interaction workflow; those remain a later product axis.
- No voice capture or transcription; the workflow must be reshaped when it becomes active.
- No Excluded Topics management, interaction deletion, permanent edited wording, or advanced snooze timing; these lifecycle refinements remain future work.
- No automatic or background extraction and no deterministic semantic-exclusion guarantee; extraction stays explicit and exclusions remain best-effort.

## Open Questions

None blocking the Core Topics change. Future slices must revisit their own deferred lifecycle, profile, recommendation, and voice-workflow decisions before implementation.
