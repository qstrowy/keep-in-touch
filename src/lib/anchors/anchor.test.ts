import { describe, expect, it } from "vitest";

import {
  EXCLUSION_RECORD_KIND,
  classifyAnchorRecord,
  coreTopicFromRecord,
  createCoreTopicRecords,
  createEditedCoreTopicRecord,
  createTopicExclusionRecord,
  exclusionIdentityKey,
  topicExclusionFromRecord,
} from "./anchor";

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

  it("classifies valid, malformed, and unrelated anchor records", () => {
    const exclusion = createTopicExclusionRecord(record, "person-1");
    if (!exclusion) throw new Error("Expected a valid exclusion record.");

    const topicClassification = classifyAnchorRecord(record);
    expect(topicClassification.kind).toBe("core-topic");
    if (topicClassification.kind === "core-topic") {
      expect(topicClassification.topic.text).toBe("Garden project");
    }

    const exclusionClassification = classifyAnchorRecord(exclusion);
    expect(exclusionClassification).toEqual({
      kind: "exclusion",
      exclusion: { id: record.id, text: "Garden project" },
    });

    const malformedClassification = classifyAnchorRecord({
      ...exclusion,
      payload: { kind: EXCLUSION_RECORD_KIND, text: " " },
    });
    expect(malformedClassification.kind).toBe("malformed-exclusion");

    const unrelatedClassification = classifyAnchorRecord({
      ...record,
      payload: { kind: "legacy-topic", text: "Garden project" },
    });
    expect(unrelatedClassification.kind).toBe("unrelated");
  });

  it("enforces the exclusion text boundary and exact normalized identity", () => {
    const maximum = createCoreTopicRecords(
      "person-1",
      ["interaction-1"],
      [{ text: "x".repeat(500), questions: [] }],
      2,
    )[0];
    const exclusion = createTopicExclusionRecord(maximum, "person-1");
    if (!exclusion) throw new Error("Expected a valid exclusion at the text boundary.");

    expect(exclusion).toMatchObject({ payload: { kind: EXCLUSION_RECORD_KIND, text: "x".repeat(500) } });
    expect(topicExclusionFromRecord(exclusion)).toEqual({ id: maximum.id, text: "x".repeat(500) });
    expect(
      createTopicExclusionRecord({ ...maximum, payload: { ...maximum.payload, text: "x".repeat(501) } }, "person-1"),
    ).toBeNull();
    expect(exclusionIdentityKey("  Garden   Project ")).toBe(exclusionIdentityKey("garden project"));
    expect(exclusionIdentityKey("garden project")).not.toBe(exclusionIdentityKey("garden projects"));
  });

  it("converts the current displayed topic without copying topic metadata", () => {
    const edited = createEditedCoreTopicRecord(record, "person-1", "  Updated   garden project ");
    if (!edited) throw new Error("Expected an edited topic.");
    const exclusion = createTopicExclusionRecord(edited, "person-1");
    if (!exclusion) throw new Error("Expected an exclusion from the edited topic.");

    expect(exclusion).toEqual({
      id: record.id,
      collection: "anchors",
      parent: { collection: "people", id: "person-1" },
      payload: { kind: EXCLUSION_RECORD_KIND, text: "Updated garden project" },
    });
    expect(Object.keys(exclusion.payload).sort()).toEqual(["kind", "text"]);
  });
});
