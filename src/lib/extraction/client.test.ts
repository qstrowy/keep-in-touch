import { describe, expect, it, vi } from "vitest";

import type { Interaction } from "../interactions/interaction";
import { MAX_COMBINED_EXTRACTION_REQUEST_BYTES, buildCombinedExtractionRequest, requestExtraction } from "./client";

const interactions: Interaction[] = [
  { id: "new", occurredOn: "2026-09-09", note: "New update", createdAt: 2 },
  { id: "old", occurredOn: "2026-09-01", note: "Older context", createdAt: 1 },
];

describe("combined extraction request", () => {
  it("includes every note in chronological order and keeps provenance local", () => {
    expect(buildCombinedExtractionRequest(interactions, ["Garden project"])).toEqual({
      note: "Older context\n\nNew update",
      excludedTopics: ["Garden project"],
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
  it("sends exactly the note-plus-exclusions request and decodes Core Topics", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ topics: [{ text: "Garden", questions: ["Ask about timing"] }] }), {
        status: 200,
      }),
    );

    await expect(requestExtraction("Older context\n\nNew update", ["Garden project"], fetchImpl)).resolves.toEqual({
      ok: true,
      response: { topics: [{ text: "Garden", questions: ["Ask about timing"] }] },
    });
    expect(fetchImpl).toHaveBeenCalledWith("/api/extractions/anchors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: "Older context\n\nNew update", excludedTopics: ["Garden project"] }),
    });
  });

  it("maps failures to neutral outcomes", async () => {
    await expect(
      requestExtraction("note", [], vi.fn<typeof fetch>().mockRejectedValue(new Error("secret"))),
    ).resolves.toEqual({
      ok: false,
      error: "unavailable",
    });
    await expect(
      requestExtraction("note", [], vi.fn<typeof fetch>().mockResolvedValue(new Response("", { status: 504 }))),
    ).resolves.toEqual({ ok: false, error: "timeout" });
    await expect(
      requestExtraction("note", [], vi.fn<typeof fetch>().mockResolvedValue(new Response("{}", { status: 200 }))),
    ).resolves.toEqual({ ok: false, error: "invalid_response" });
  });

  it("refuses an oversized serialized request without calling fetch", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const note = "é".repeat(MAX_COMBINED_EXTRACTION_REQUEST_BYTES);

    await expect(requestExtraction(note, [], fetchImpl)).resolves.toEqual({ ok: false, error: "too_large" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("refuses an oversized complete exclusion request without calling fetch", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const excludedTopics = ["é".repeat(MAX_COMBINED_EXTRACTION_REQUEST_BYTES)];

    await expect(requestExtraction("note", excludedTopics, fetchImpl)).resolves.toEqual({
      ok: false,
      error: "too_large",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("budgets the complete UTF-8 request and preserves caller-provided text", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ topics: [] }), { status: 200 }));
    const excludedTopics = ["Żółć i rozmowa"];

    await expect(requestExtraction("  Note   with spacing  ", excludedTopics, fetchImpl)).resolves.toEqual({
      ok: true,
      response: { topics: [] },
    });
    expect(fetchImpl.mock.calls[0]?.[1]?.body).toBe(
      JSON.stringify({ note: "  Note   with spacing  ", excludedTopics }),
    );
  });
});
