import { describe, expect, it, vi } from "vitest";

import type { Interaction } from "../interactions/interaction";
import { MAX_COMBINED_EXTRACTION_REQUEST_BYTES, buildCombinedExtractionRequest, requestExtraction } from "./client";

const interactions: Interaction[] = [
  { id: "new", occurredOn: "2026-09-09", note: "New update", createdAt: 2 },
  { id: "old", occurredOn: "2026-09-01", note: "Older context", createdAt: 1 },
];

describe("combined extraction request", () => {
  it("includes every note in chronological order and keeps provenance local", () => {
    expect(buildCombinedExtractionRequest(interactions)).toEqual({
      note: "Older context\n\nNew update",
      sourceInteractionIds: ["old", "new"],
    });
  });

  it("refuses an over-budget serialized request before fetch", () => {
    const oversized = [
      { id: "large", occurredOn: "2026-09-09", note: "é".repeat(MAX_COMBINED_EXTRACTION_REQUEST_BYTES), createdAt: 1 },
    ];
    expect(buildCombinedExtractionRequest(oversized)).toBeNull();
  });
});

describe("extraction browser client", () => {
  it("sends exactly the note-only request and decodes candidates", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify({ candidates: [{ kind: "topic", text: "Garden" }] }), { status: 200 }),
      );

    await expect(requestExtraction("Older context\n\nNew update", fetchImpl)).resolves.toEqual({
      ok: true,
      response: { candidates: [{ kind: "topic", text: "Garden" }] },
    });
    expect(fetchImpl).toHaveBeenCalledWith("/api/extractions/anchors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: "Older context\n\nNew update" }),
    });
  });

  it("maps failures to neutral outcomes", async () => {
    await expect(
      requestExtraction("note", vi.fn<typeof fetch>().mockRejectedValue(new Error("secret"))),
    ).resolves.toEqual({
      ok: false,
      error: "unavailable",
    });
    await expect(
      requestExtraction("note", vi.fn<typeof fetch>().mockResolvedValue(new Response("", { status: 504 }))),
    ).resolves.toEqual({ ok: false, error: "timeout" });
    await expect(
      requestExtraction("note", vi.fn<typeof fetch>().mockResolvedValue(new Response("{}", { status: 200 }))),
    ).resolves.toEqual({ ok: false, error: "invalid_response" });
  });
});
