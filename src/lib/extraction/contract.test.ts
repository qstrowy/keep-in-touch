import { describe, expect, it } from "vitest";

import {
  EXTRACTION_PROMPT_VERSION,
  MAX_EXTRACTION_CANDIDATES,
  MAX_EXTRACTION_CANDIDATE_TEXT_LENGTH,
  createExtractionProviderInput,
  parseExtractionCandidateResponse,
  parseExtractionRequest,
  persistCandidateResponseIfSourceExists,
} from "./contract";

describe("extraction request contract", () => {
  it("accepts only one trimmed note and produces a fixed provider input", () => {
    const request = parseExtractionRequest({ note: "  Ask about the recital next week.  " });

    expect(request).toEqual({ note: "Ask about the recital next week." });
    if (!request) throw new Error("Expected a valid extraction request.");

    const providerInput = createExtractionProviderInput(request);
    expect(providerInput.promptVersion).toBe(EXTRACTION_PROMPT_VERSION);
    expect(providerInput.instruction).toContain("Extract concise conversation anchors");
    expect(providerInput.note).toBe("Ask about the recital next week.");
  });

  it("rejects missing, blank, oversized, and extra public request fields", () => {
    expect(parseExtractionRequest(null)).toBeNull();
    expect(parseExtractionRequest({})).toBeNull();
    expect(parseExtractionRequest({ note: "   " })).toBeNull();
    expect(parseExtractionRequest({ note: "a".repeat(5_001) })).toBeNull();
    expect(parseExtractionRequest({ note: "Call next week", personId: "private-person-id" })).toBeNull();
  });
});

describe("late extraction result handling", () => {
  it("discards a candidate response when its local source was deleted", async () => {
    const persisted: string[] = [];
    const response = { candidates: [{ kind: "topic" as const, text: "Recital" }] };

    await expect(
      persistCandidateResponseIfSourceExists(
        () => Promise.resolve(false),
        () => Promise.resolve(persisted.push("should not persist")).then(() => undefined),
        response,
      ),
    ).resolves.toBe(false);
    expect(persisted).toEqual([]);
  });
});

describe("extraction candidate response contract", () => {
  it("defensively decodes supported candidate kinds and normalized text", () => {
    expect(
      parseExtractionCandidateResponse({
        candidates: [
          { kind: "topic", text: "  Violin recital  " },
          { kind: "follow_up", text: "Ask how it went" },
          { kind: "proposed_interaction", text: "Check in next week" },
        ],
      }),
    ).toEqual({
      candidates: [
        { kind: "topic", text: "Violin recital" },
        { kind: "follow_up", text: "Ask how it went" },
        { kind: "proposed_interaction", text: "Check in next week" },
      ],
    });
  });

  it("rejects malformed, unexpected, excessive, or unsafe candidate responses", () => {
    expect(parseExtractionCandidateResponse(null)).toBeNull();
    expect(parseExtractionCandidateResponse({ candidates: "not-an-array" })).toBeNull();
    expect(parseExtractionCandidateResponse({ candidates: [{ kind: "topic", text: "Valid", id: "leak" }] })).toBeNull();
    expect(parseExtractionCandidateResponse({ candidates: [{ kind: "unknown", text: "Valid" }] })).toBeNull();
    expect(parseExtractionCandidateResponse({ candidates: [{ kind: "topic", text: "   " }] })).toBeNull();
    expect(
      parseExtractionCandidateResponse({
        candidates: [{ kind: "topic", text: "a".repeat(MAX_EXTRACTION_CANDIDATE_TEXT_LENGTH + 1) }],
      }),
    ).toBeNull();
    expect(
      parseExtractionCandidateResponse({
        candidates: Array.from({ length: MAX_EXTRACTION_CANDIDATES + 1 }, () => ({ kind: "topic", text: "Valid" })),
      }),
    ).toBeNull();
  });
});
