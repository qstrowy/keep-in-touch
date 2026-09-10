import { describe, expect, it } from "vitest";

import {
  anchorFromRecord,
  createAnchorRecord,
  createAnchorRecords,
  hasSameOriginalCandidate,
  isManagedAnchorRecord,
  updateAnchorRecord,
} from "./anchor";

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
      status: "open",
      origin: "generated",
      originalKind: "topic",
      originalText: "Garden project",
    });
  });

  it("reads legacy generated records as open anchors", () => {
    expect(
      anchorFromRecord({
        ...validRecord,
        payload: {
          kind: "topic",
          text: "Garden project",
          createdAt: 1_700_000_000_000,
          sourceInteractionIds: ["interaction-1", "interaction-2"],
        },
      }),
    ).toMatchObject({ status: "open", origin: "generated", originalKind: "topic", originalText: "Garden project" });
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

  it("preserves immutable provenance when an owner manages an anchor", () => {
    const anchor = anchorFromRecord(validRecord);
    if (!anchor) throw new Error("Expected valid anchor");

    const managed = updateAnchorRecord({
      anchor,
      personId: "person-1",
      text: "Garden project timing",
      status: "open",
    });

    expect(isManagedAnchorRecord(managed)).toBe(true);
    expect(anchorFromRecord(managed)).toMatchObject({
      id: anchor.id,
      text: "Garden project timing",
      originalKind: "topic",
      originalText: "Garden project",
      sourceInteractionIds: anchor.sourceInteractionIds,
      status: "open",
      origin: "managed",
    });
  });

  it.each(["resolved", "dismissed"] as const)("supports %s lifecycle state", (status) => {
    const anchor = anchorFromRecord(validRecord);
    if (!anchor) throw new Error("Expected valid anchor");
    expect(anchorFromRecord(updateAnchorRecord({ anchor, personId: "person-1", status }))).toMatchObject({
      status,
      origin: "managed",
    });
  });

  it("matches only the preserved original candidate", () => {
    const anchor = anchorFromRecord(validRecord);
    if (!anchor) throw new Error("Expected valid anchor");
    const managed = updateAnchorRecord({ anchor, personId: "person-1", text: "Updated garden wording" });
    const matching = createAnchorRecord({
      id: "replacement",
      personId: "person-1",
      createdAt: 1_700_000_000_001,
      sourceInteractionIds: ["interaction-1"],
      candidate: { kind: "topic", text: "Garden project" },
    });
    const distinct = createAnchorRecord({
      id: "distinct",
      personId: "person-1",
      createdAt: 1_700_000_000_001,
      sourceInteractionIds: ["interaction-1"],
      candidate: { kind: "topic", text: "Different topic" },
    });

    expect(hasSameOriginalCandidate(matching, managed)).toBe(true);
    expect(hasSameOriginalCandidate(distinct, managed)).toBe(false);
  });

  it("rejects invalid managed text", () => {
    const anchor = anchorFromRecord(validRecord);
    if (!anchor) throw new Error("Expected valid anchor");
    expect(() => updateAnchorRecord({ anchor, personId: "person-1", text: "   " })).toThrow(
      "An anchor must contain non-empty text.",
    );
    expect(() => updateAnchorRecord({ anchor, personId: "person-1", text: "a".repeat(501) })).toThrow(
      "An anchor must not exceed 500 characters.",
    );
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
      ["createdAt", "kind", "origin", "originalKind", "originalText", "sourceInteractionIds", "status", "text"],
      ["createdAt", "kind", "origin", "originalKind", "originalText", "sourceInteractionIds", "status", "text"],
    ]);
  });
});
