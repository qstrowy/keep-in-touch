import { describe, expect, it } from "vitest";

import {
  EXTRACTION_PROMPT_VERSION,
  MAX_EXTRACTION_CANDIDATE_TEXT_LENGTH,
  MAX_EXTRACTION_QUESTIONS_PER_TOPIC,
  MAX_EXTRACTION_TOPICS,
  createExtractionProviderInput,
  parseExtractionCandidateResponse,
  parseExtractionRequest,
  persistCandidateResponseIfSourceExists,
} from "./contract";

describe("extraction request contract", () => {
  it("accepts a trimmed note and normalized exclusion list", () => {
    const request = parseExtractionRequest({
      note: "  Ask about the recital next week.  ",
      excludedTopics: ["  Garden   project  "],
    });
    expect(request).toEqual({ note: "Ask about the recital next week.", excludedTopics: ["Garden project"] });
    if (!request) throw new Error("Expected a valid extraction request.");
    const providerInput = createExtractionProviderInput(request);
    expect(providerInput.promptVersion).toBe(EXTRACTION_PROMPT_VERSION);
    expect(providerInput.instruction).toContain("Rank topics by expected usefulness");
    expect(providerInput.instruction).toContain("one dominant language");
    expect(providerInput.instruction).toContain("most recent note");
    expect(providerInput.instruction).toContain("broaden perspective without restating");
    expect(providerInput.instruction).toContain("direct, natural conversation starter");
    expect(providerInput.instruction).toContain("owner can ask the selected person");
    expect(providerInput.instruction).toContain("Do not ask the owner to reconstruct, verify, or infer");
    expect(providerInput.instruction).toContain("fewer topics or questions instead of filler");
    expect(providerInput.instruction).toContain("Do not invent details");
    expect(providerInput.instruction).toContain("generic facts, stereotypes");
    expect(providerInput.instruction).toContain("Avoid excluded subjects in both topic text and follow-up questions");
    expect(providerInput.excludedTopics).toEqual(["Garden project"]);
  });

  it("rejects missing, blank, oversized, malformed, duplicate, and extra public request fields", () => {
    expect(parseExtractionRequest(null)).toBeNull();
    expect(parseExtractionRequest({})).toBeNull();
    expect(parseExtractionRequest({ note: "   ", excludedTopics: [] })).toBeNull();
    expect(parseExtractionRequest({ note: "a".repeat(5_001), excludedTopics: [] })).toBeNull();
    expect(
      parseExtractionRequest({ note: "Call next week", excludedTopics: [], personId: "private-person-id" }),
    ).toBeNull();
    expect(parseExtractionRequest({ note: "Call next week", excludedTopics: "Garden" })).toBeNull();
    expect(parseExtractionRequest({ note: "Call next week", excludedTopics: ["  "] })).toBeNull();
    expect(parseExtractionRequest({ note: "Call next week", excludedTopics: ["Garden", " garden "] })).toBeNull();
    expect(parseExtractionRequest({ note: "Call next week", excludedTopics: ["x".repeat(501)] })).toBeNull();
  });
});

describe("late extraction result handling", () => {
  it("discards a topic response when its local source was deleted", async () => {
    const persisted: string[] = [];
    const response = { topics: [{ text: "Recital", questions: [] }] };
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

describe("Core Topics response contract", () => {
  it("defensively decodes nested topics, normalizes text, and preserves order", () => {
    expect(
      parseExtractionCandidateResponse({ topics: [{ text: "  Violin recital  ", questions: [" Ask how it went "] }] }),
    ).toEqual({ topics: [{ text: "Violin recital", questions: ["Ask how it went"] }] });
    expect(parseExtractionCandidateResponse({ topics: [] })).toEqual({ topics: [] });
  });

  it("rejects malformed, detached, excessive, unexpected, and unsafe topic responses", () => {
    expect(parseExtractionCandidateResponse(null)).toBeNull();
    expect(parseExtractionCandidateResponse({ topics: "not-an-array" })).toBeNull();
    expect(parseExtractionCandidateResponse({ topics: [{ text: "Valid", questions: [], id: "leak" }] })).toBeNull();
    expect(parseExtractionCandidateResponse({ topics: [{ text: "   ", questions: [] }] })).toBeNull();
    expect(parseExtractionCandidateResponse({ topics: [{ text: "Valid", questions: ["   "] }] })).toBeNull();
    expect(
      parseExtractionCandidateResponse({ topics: [{ text: "Valid", questions: "detached question" }] }),
    ).toBeNull();
    expect(
      parseExtractionCandidateResponse({
        topics: [{ text: "a".repeat(MAX_EXTRACTION_CANDIDATE_TEXT_LENGTH + 1), questions: [] }],
      }),
    ).toBeNull();
    expect(
      parseExtractionCandidateResponse({
        topics: [{ text: "Valid", questions: ["a".repeat(MAX_EXTRACTION_CANDIDATE_TEXT_LENGTH + 1)] }],
      }),
    ).toBeNull();
    expect(
      parseExtractionCandidateResponse({
        topics: [{ text: "Valid", questions: Array(MAX_EXTRACTION_QUESTIONS_PER_TOPIC + 1).fill("Question") }],
      }),
    ).toBeNull();
    expect(
      parseExtractionCandidateResponse({
        topics: Array.from({ length: MAX_EXTRACTION_TOPICS + 1 }, () => ({ text: "Valid", questions: [] })),
      }),
    ).toBeNull();
  });
});
