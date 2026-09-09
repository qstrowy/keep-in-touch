import { MAX_INTERACTION_NOTE_LENGTH } from "../interactions/interaction";

export const EXTRACTION_PROMPT_VERSION = "2026-09-09";
export const MAX_EXTRACTION_CANDIDATES = 12;
export const MAX_EXTRACTION_CANDIDATE_TEXT_LENGTH = 500;
export const MAX_COMBINED_EXTRACTION_NOTE_LENGTH = 20_000;

const EXTRACTION_PROMPT = [
  "Extract concise conversation anchors from the supplied interaction note.",
  "Return only JSON with a candidates array.",
  "Each candidate has kind topic, follow_up, or proposed_interaction and a concise text value.",
  "Do not invent details not supported by the note.",
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
