import { describe, expect, it } from "vitest";

import {
  INTERACTIONS_COLLECTION,
  MAX_INTERACTION_NOTE_LENGTH,
  createInteractionRecord,
  interactionFromRecord,
  sortInteractionsNewestFirst,
  validateInteractionInput,
} from "./interaction";

describe("interaction contract", () => {
  const today = "2026-09-09";

  it("normalizes a valid dated note", () => {
    expect(validateInteractionInput({ occurredOn: "2026-09-08", note: "  Ask about the new role.  " }, today)).toEqual({
      interaction: { occurredOn: "2026-09-08", note: "Ask about the new role." },
      errors: {},
    });
  });

  it("rejects invalid or future dates and invalid notes", () => {
    expect(validateInteractionInput({ occurredOn: "2026-09-10", note: "Note" }, today).errors.occurredOn).toBeDefined();
    expect(validateInteractionInput({ occurredOn: "2026-02-29", note: "Note" }, today).errors.occurredOn).toBeDefined();
    expect(validateInteractionInput({ occurredOn: today, note: " " }, today).errors.note).toBeDefined();
    expect(
      validateInteractionInput({ occurredOn: today, note: "a".repeat(MAX_INTERACTION_NOTE_LENGTH + 1) }, today).errors
        .note,
    ).toBeDefined();
  });

  it("creates a person-parented record and ignores malformed stored records", () => {
    const validation = validateInteractionInput({ occurredOn: today, note: "Catch up" }, today);
    if (!validation.interaction) {
      throw new Error("Expected valid interaction input.");
    }

    const record = createInteractionRecord(validation.interaction, "interaction-1", "person-1", 100);
    expect(record).toMatchObject({
      collection: INTERACTIONS_COLLECTION,
      id: "interaction-1",
      parent: { collection: "people", id: "person-1" },
      payload: { occurredOn: today, note: "Catch up", createdAt: 100 },
    });
    expect(interactionFromRecord(record)).toEqual({ id: "interaction-1", ...validation.interaction, createdAt: 100 });
    expect(interactionFromRecord({ ...record, payload: { occurredOn: today, note: "Catch up" } })).toBeNull();
  });

  it("sorts later dates first and uses creation time for same-day interactions", () => {
    expect(
      sortInteractionsNewestFirst([
        { id: "first", occurredOn: "2026-09-08", note: "First", createdAt: 1 },
        { id: "second", occurredOn: "2026-09-09", note: "Second", createdAt: 2 },
        { id: "third", occurredOn: "2026-09-09", note: "Third", createdAt: 3 },
      ]).map(({ id }) => id),
    ).toEqual(["third", "second", "first"]);
  });
});
