import { MAX_INTERACTION_NOTE_LENGTH } from "../interactions/interaction";

export const EXTRACTION_PROMPT_VERSION = "2026-09-09";
export const MAX_EXTRACTION_CANDIDATES = 12;
export const MAX_EXTRACTION_CANDIDATE_TEXT_LENGTH = 500;
export const MAX_COMBINED_EXTRACTION_NOTE_LENGTH = 20_000;

const EXTRACTION_PROMPT = [
  "Extract useful conversation anchors from the supplied interaction note.",
  "Return only JSON with a candidates array.",
  "Use topic for a concrete subject or situation worth remembering.",
  "Use follow_up for an unresolved detail or a concise question that would deepen understanding of the topic.",
  "Use proposed_interaction for a practical, grounded way to reconnect or offer help based on the note.",
  "Prefer specific detail-seeking questions when the note leaves an important detail open.",
  "Do not invent details not supported by the note.",
  "Do not add generic facts, stereotypes, or unrelated advice about a named person, product, place, or brand.",
  "It is valid to return no candidates when the note contains no useful anchor.",
  "Write every candidate in the same language as the supplied note; do not translate it.",
].join(" ");

export type ExtractionCandidateKind = "topic" | "follow_up" | "proposed_interaction";

export interface ExtractionRequest {
  note: string;
}

export interface ExtractionProviderInput {
  promptVersion: typeof EXTRACTION_PROMPT_VERSION;
  instruction: string;
  note: string;
}

export interface ExtractionCandidate {
  kind: ExtractionCandidateKind;
  text: string;
}

export interface ExtractionCandidateResponse {
  candidates: ExtractionCandidate[];
}

export type ExtractionPublicError = "invalid_request" | "unavailable" | "timeout" | "invalid_response";

export async function persistCandidateResponseIfSourceExists(
  sourceExists: () => Promise<boolean>,
  persist: (response: ExtractionCandidateResponse) => Promise<void>,
  response: ExtractionCandidateResponse,
): Promise<boolean> {
  if (!(await sourceExists())) {
    return false;
  }

  await persist(response);
  return true;
}

export function parseExtractionRequest(
  value: unknown,
  maxNoteLength = MAX_INTERACTION_NOTE_LENGTH,
): ExtractionRequest | null {
  if (!isExactRecord(value, ["note"]) || typeof value.note !== "string") {
    return null;
  }

  const note = value.note.trim();
  if (!note || note.length > maxNoteLength) {
    return null;
  }

  return { note };
}

export function createExtractionProviderInput(request: ExtractionRequest): ExtractionProviderInput {
  return {
    promptVersion: EXTRACTION_PROMPT_VERSION,
    instruction: EXTRACTION_PROMPT,
    note: request.note,
  };
}

export function parseExtractionCandidateResponse(value: unknown): ExtractionCandidateResponse | null {
  if (!isExactRecord(value, ["candidates"]) || !Array.isArray(value.candidates)) {
    return null;
  }
  if (value.candidates.length > MAX_EXTRACTION_CANDIDATES) {
    return null;
  }

  const candidates: ExtractionCandidate[] = [];
  for (const item of value.candidates) {
    if (!isExactRecord(item, ["kind", "text"]) || !isCandidateKind(item.kind) || typeof item.text !== "string") {
      return null;
    }

    const text = item.text.trim();
    if (!text || text.length > MAX_EXTRACTION_CANDIDATE_TEXT_LENGTH) {
      return null;
    }
    candidates.push({ kind: item.kind, text });
  }

  return { candidates };
}

function isExactRecord(value: unknown, keys: string[]): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const actualKeys = Object.keys(value);
  return actualKeys.length === keys.length && actualKeys.every((key) => keys.includes(key));
}

function isCandidateKind(value: unknown): value is ExtractionCandidateKind {
  return value === "topic" || value === "follow_up" || value === "proposed_interaction";
}
