---
project: KeepInTouch
version: 1
status: draft
created: 2026-08-21
context_type: greenfield
product_type: web-app
target_scale:
  users: small
  qps: low
  data_volume: small
timeline_budget:
  mvp_weeks: 3
  hard_deadline: null
  after_hours_only: true
---

## Vision & Problem Statement

The first user wants to remember meaningful details about friends and professional contacts but often retains only fragments from previous conversations. This is especially difficult with people met infrequently: after a long gap, there may be no natural anchor for restarting the discussion, even though remembering the person and their context matters.

KeepInTouch is a private memory aid and personal relationship manager. It preserves useful conversation context and supports genuine attentiveness without making friendships feel monitored or turning people into records to be catalogued.

## User & Persona

The primary persona is the creator of KeepInTouch, using the MVP personally to manage a larger private and professional network. They reach for the product after an interaction to preserve important context and before a later interaction—particularly after a long gap—to find a natural conversational anchor.

## Success Criteria

### Primary

- Within the end-to-end flow, a note containing a meaningful topic or follow-up is classified, and the resulting open item appears as an anchor in that person's later briefing.

### Secondary

- The MVP shows upcoming birthdays.
- Gift suggestions based on recorded interests and conversations may be included if time remains, but they are not required for MVP success.
- A working prototype is targeted for 2026-09-01; the complete MVP retains its three-week after-hours budget.

### Guardrails

- Relationship data remains private to its owner.
- Users can correct or dismiss inaccurate extracted topics and follow-ups.

## User Stories

### US-01: Preserve a conversation anchor

- **Given** I am signed in and have created a person such as Marek
- **When** I save an interaction note containing a meaningful future topic
- **Then** KeepInTouch classifies the topic or follow-up and shows the unresolved item in Marek's later briefing

#### Acceptance Criteria

- The original interaction note and date are saved.
- A relevant topic or potential follow-up is extracted.
- The open item appears as a conversation anchor in the person's briefing.
- I can correct, dismiss, or resolve the extracted item.

## Functional Requirements

### Authentication and privacy

- FR-001: A user can sign in through passwordless email. Priority: must-have
  > Socrates: Counter-arguments considered: a local single-user MVP may not need authentication, and email login adds an external dependency. Resolution: kept as written.

### People and interactions

- FR-002: A user can create, edit, and delete a person with a relationship circle and birthday. Priority: must-have
  > Socrates: Counter-arguments considered: deletion, circles, and birthdays broaden the proof path, and permanent deletion could be deferred. Resolution: kept as written.
- FR-003: A user can record a dated free-text interaction for a person. Priority: must-have
  > Socrates: Counter-arguments considered: requiring a date adds friction, while structured input could be more reliable. Resolution: kept as written.

### Topics and follow-ups

- FR-004: A user can have topics and potential follow-ups extracted and classified from an interaction note. Priority: must-have
  > Socrates: Counter-arguments considered: incorrect extraction may undermine trust, and processing sensitive notes may conflict with the privacy promise. Resolution: kept as written.
- FR-005: A user can correct or dismiss inaccurate extracted topics and follow-ups. Priority: must-have
  > Socrates: Counter-arguments considered: a correction interface adds complexity, and reprocessing could replace manual correction. Resolution: kept as written.
- FR-006: A user can mark open topics or follow-ups as resolved. Priority: must-have
  > Socrates: Counter-arguments considered: explicit status management may feel like task tracking, and automatic expiry could replace manual resolution. Resolution: kept as written.

### Briefing and reminders

- FR-007: A user can view a person's briefing with the last contact, recent context, and unresolved conversation anchors. Priority: must-have
  > Socrates: Counter-arguments considered: the briefing may duplicate stored notes, and a chronological interaction list might be sufficient. Resolution: kept as written.
- FR-008: A user can view upcoming birthdays. Priority: must-have
  > Socrates: Counter-arguments considered: birthdays sit outside the primary proof path and could remain optional until that path works. Resolution: kept as written.
- FR-009: A user can receive a gift suggestion derived from recorded interests and conversations. Priority: nice-to-have
  > Socrates: Counter-arguments considered: suggestions may feel intrusive and add unreliable recommendation scope to a three-week MVP. Resolution: kept as written.

## Non-Functional Requirements

- Relationship data is stored locally on the user's smartphone.
- Any synchronized relationship data is unreadable to the synchronization provider; recovery requires a user-held recovery passphrase. Unprotected synchronization must not be offered.
- External extraction may receive note text but receives no linked profile name, birthday, or account identifier; the processor does not retain the text or use it for training.
- Extraction completes within two minutes of saving an interaction note.
- An existing person briefing appears within two seconds of being requested.
- A user's correction or dismissal of an extracted item takes effect immediately.
- Deleting a person removes all associated relationship data immediately.

## Business Logic

KeepInTouch extracts and classifies meaningful details from an interaction, assesses which topics and follow-ups remain open, and presents those items as anchors for the next conversation.

The rule consumes a user's dated conversation note together with later corrections and status changes. It produces classified topics and follow-ups, including an assessment of which items remain unresolved.

The user encounters the result in the person's briefing, where unresolved items are presented as context for the next contact.

## Access Control

Users sign in through passwordless email authentication. Each user can access only their own private relationship data. The MVP has one flat user role with no admin, guest, shared-access, or collaboration roles.

## Non-Goals

- No external messaging, professional-network, contact-book, or social-media integrations; the MVP proves value through direct user input.
- No automatic message sending or advanced relationship coaching; the product supports the user's judgment rather than acting on their behalf.
- No native mobile app, voice recognition, or location tracking; the MVP is a smartphone-oriented web app.
- No shared or team workspaces, admin roles, or unprotected cloud synchronization; the MVP retains its private single-user model.
- No contact-frequency scoring or neglected-contact recommendations; they are outside the primary conversation-anchor flow.
- Gift suggestions and end-to-end encrypted synchronization are optional and are not required for MVP acceptance.

## Open Questions

None.
