import { describe, expect, it } from "vitest";

import { anchorFromRecord, createAnchorRecord, createAnchorRecords } from "./anchor";

const validRecord = createAnchorRecord({
  id: "anchor-1",
  personId: "person-1",
  createdAt: 1_700_000_000_000,
  sourceInteractionIds: ["interaction-1", "interaction-2"],
  candidate: { kind: "topic", text: "  Garden project  " },
});

describe("conversation anchor contract", () => {
  it("normalizes valid local anchor records", () => {
    expect(anchorFromRecord(validRecord)).toEqual({
      id: "anchor-1",
      kind: "topic",
      text: "Garden project",
      createdAt: 1_700_000_000_000,
      sourceInteractionIds: ["interaction-1", "interaction-2"],
    });
  });

  it.each([
    ["kind", { kind: "unknown" }],
    ["text", { text: "   " }],
    ["timestamp", { createdAt: -1 }],
    ["parent", { parent: { collection: "interactions", id: "interaction-1" } }],
    ["provenance", { sourceInteractionIds: ["interaction-1", "interaction-1"] }],
  ])("rejects malformed %s", (_label, override) => {
    const record = {
      ...validRecord,
      ...override,
      payload: { ...validRecord.payload, ...override },
    };
    if ("parent" in override) {
      record.parent = override.parent;
    }
    expect(anchorFromRecord(record)).toBeNull();
  });

  it("rejects extra payload fields and overlong text", () => {
    expect(anchorFromRecord({ ...validRecord, payload: { ...validRecord.payload, personId: "leak" } })).toBeNull();
    expect(
      anchorFromRecord({
        ...validRecord,
        payload: { ...validRecord.payload, text: "a".repeat(501) },
      }),
    ).toBeNull();
  });

  it("keeps source provenance local to every generated anchor record", () => {
    const records = createAnchorRecords(
      "person-1",
      ["interaction-1", "interaction-2"],
      [
        { kind: "topic", text: "Garden" },
        { kind: "follow_up", text: "Ask about timing" },
      ],
      1_700_000_000_000,
    );

    expect(records).toHaveLength(2);
    expect(records.every((record) => record.parent?.collection === "people" && record.parent.id === "person-1")).toBe(
      true,
    );
    expect(records.map((record) => record.payload.sourceInteractionIds)).toEqual([
      ["interaction-1", "interaction-2"],
      ["interaction-1", "interaction-2"],
    ]);
    expect(records.map((record) => Object.keys(record.payload).sort())).toEqual([
      ["createdAt", "kind", "sourceInteractionIds", "text"],
      ["createdAt", "kind", "sourceInteractionIds", "text"],
    ]);
  });
});
