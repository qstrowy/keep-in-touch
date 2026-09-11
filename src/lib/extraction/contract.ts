import { MAX_INTERACTION_NOTE_LENGTH } from "../interactions/interaction";

export const EXTRACTION_PROMPT_VERSION = "2026-09-11.1";
export const MAX_EXTRACTION_TOPICS = 7;
export const MAX_EXTRACTION_QUESTIONS_PER_TOPIC = 3;
export const MAX_EXTRACTION_CANDIDATE_TEXT_LENGTH = 500;
export const MAX_COMBINED_EXTRACTION_NOTE_LENGTH = 20_000;

const EXTRACTION_PROMPT = [
  "Extract useful Core Topics from the supplied interaction notes.",
  "Return only JSON with a topics array.",
  "Rank topics by expected usefulness for a future conversation.",
  "Write the entire response in one dominant language from the supplied notes; when no language clearly dominates, use the language of the most recent note.",
  "For each topic, include zero to three concise, grounded questions that broaden perspective without restating the topic.",
  "Write every question as a direct, natural conversation starter the owner can ask the selected person in a future conversation.",
  "Do not ask the owner to reconstruct, verify, or infer what the selected person or third parties said, did, recommended, or experienced.",
  "Prefer fewer topics or questions instead of filler.",
  "Do not invent details not supported by the notes.",
  "Do not add generic facts, stereotypes, or unrelated advice about a named person, product, place, or brand.",
  "It is valid to return no topics when the notes contain no useful topic.",
].join(" ");

export interface ExtractionRequest {
  note: string;
}

export interface ExtractionProviderInput {
  promptVersion: typeof EXTRACTION_PROMPT_VERSION;
  instruction: string;
  note: string;
}

export interface CoreTopicCandidate {
  text: string;
  questions: string[];
}

export interface ExtractionCandidateResponse {
  topics: CoreTopicCandidate[];
}

export type ExtractionPublicError = "invalid_request" | "unavailable" | "timeout" | "invalid_response";

export async function persistCandidateResponseIfSourceExists(
  sourceExists: () => Promise<boolean>,
  persist: (response: ExtractionCandidateResponse) => Promise<void>,
  response: ExtractionCandidateResponse,
): Promise<boolean> {
  if (!(await sourceExists())) return false;
  await persist(response);
  return true;
}

export function parseExtractionRequest(
  value: unknown,
  maxNoteLength = MAX_INTERACTION_NOTE_LENGTH,
): ExtractionRequest | null {
  if (!isExactRecord(value, ["note"]) || typeof value.note !== "string") return null;
  const note = value.note.trim();
  return !note || note.length > maxNoteLength ? null : { note };
}

export function createExtractionProviderInput(request: ExtractionRequest): ExtractionProviderInput {
  return { promptVersion: EXTRACTION_PROMPT_VERSION, instruction: EXTRACTION_PROMPT, note: request.note };
}

export function parseExtractionCandidateResponse(value: unknown): ExtractionCandidateResponse | null {
  if (
    !isExactRecord(value, ["topics"]) ||
    !Array.isArray(value.topics) ||
    value.topics.length > MAX_EXTRACTION_TOPICS
  ) {
    return null;
  }

  const topics: CoreTopicCandidate[] = [];
  for (const item of value.topics) {
    if (
      !isExactRecord(item, ["text", "questions"]) ||
      typeof item.text !== "string" ||
      !Array.isArray(item.questions)
    ) {
      return null;
    }
    const text = normalizeCandidateText(item.text);
    if (!text || item.questions.length > MAX_EXTRACTION_QUESTIONS_PER_TOPIC) return null;

    const questions: string[] = [];
    for (const question of item.questions) {
      if (typeof question !== "string") return null;
      const normalizedQuestion = normalizeCandidateText(question);
      if (!normalizedQuestion) return null;
      questions.push(normalizedQuestion);
    }
    topics.push({ text, questions });
  }
  return { topics };
}

function normalizeCandidateText(value: string): string | null {
  const text = value.trim();
  return !text || text.length > MAX_EXTRACTION_CANDIDATE_TEXT_LENGTH ? null : text;
}

function isExactRecord(value: unknown, keys: string[]): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actualKeys = Object.keys(value);
  return actualKeys.length === keys.length && actualKeys.every((key) => keys.includes(key));
}
