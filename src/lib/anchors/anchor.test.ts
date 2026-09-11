import { describe, expect, it } from "vitest";

import { coreTopicFromRecord, createCoreTopicRecords, createEditedCoreTopicRecord } from "./anchor";

describe("Core Topic record contract", () => {
  const records = createCoreTopicRecords(
    "person-1",
    ["interaction-1", "interaction-2"],
    [{ text: "  Garden project  ", questions: [" Ask about timing "] }],
    1_700_000_000_000,
  );
  const record = records[0];

  it("creates ordered nested records with browser-local provenance", () => {
    expect(coreTopicFromRecord(record)).toEqual({
      id: record.id,
      text: "Garden project",
      questions: ["Ask about timing"],
      position: 0,
      createdAt: 1_700_000_000_000,
      sourceInteractionIds: ["interaction-1", "interaction-2"],
    });
    expect(Object.keys(record.payload).sort()).toEqual([
      "createdAt",
      "position",
      "questions",
      "sourceInteractionIds",
      "text",
    ]);
  });

  it.each([
    [
      "legacy lifecycle payload",
      { kind: "topic", text: "Garden", createdAt: 1, sourceInteractionIds: ["interaction-1"] },
    ],
    ["duplicate source IDs", { ...record.payload, sourceInteractionIds: ["interaction-1", "interaction-1"] }],
    ["invalid position", { ...record.payload, position: 7 }],
    ["extra field", { ...record.payload, status: "open" }],
    ["invalid nested question", { ...record.payload, questions: [" "] }],
  ])("rejects %s", (_label, payload) => {
    expect(coreTopicFromRecord({ ...record, payload })).toBeNull();
  });

  it("rejects invalid creation input", () => {
    const eightTopics = Array.from({ length: 8 }, () => ({ text: "Topic", questions: [] }));
    expect(() => createCoreTopicRecords("person-1", ["interaction-1"], eightTopics)).toThrow();
    expect(() => createCoreTopicRecords("person-1", ["interaction-1", "interaction-1"], [], 1)).toThrow();
  });

  it("derives an edited record without changing immutable topic fields", () => {
    expect(createEditedCoreTopicRecord(record, "person-1", "  Updated   garden project ")).toEqual({
      ...record,
      payload: {
        text: "Updated garden project",
        questions: ["Ask about timing"],
        position: 0,
        createdAt: 1_700_000_000_000,
        sourceInteractionIds: ["interaction-1", "interaction-2"],
      },
    });
  });

  it.each([
    ["blank text", "  "],
    ["text over the limit", "x".repeat(501)],
  ])("rejects %s when deriving an edited record", (_label, text) => {
    expect(createEditedCoreTopicRecord(record, "person-1", text)).toBeNull();
  });

  it("rejects malformed or differently parented records", () => {
    expect(
      createEditedCoreTopicRecord({ ...record, payload: { ...record.payload, status: "hidden" } }, "person-1", "New"),
    ).toBeNull();
    expect(
      createEditedCoreTopicRecord({ ...record, parent: { collection: "people", id: "person-2" } }, "person-1", "New"),
    ).toBeNull();
  });
});
