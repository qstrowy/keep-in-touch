import { sortInteractionsNewestFirst, type Interaction } from "../interactions/interaction";
import {
  MAX_COMBINED_EXTRACTION_NOTE_LENGTH,
  parseExtractionCandidateResponse,
  type ExtractionCandidateResponse,
} from "./contract";

/** Leaves room below the Worker endpoint's 25 KB serialized-body ceiling. */
export const MAX_COMBINED_EXTRACTION_REQUEST_BYTES = 20_000;

export interface CombinedExtractionRequest {
  note: string;
  sourceInteractionIds: string[];
}

export type ExtractionClientError = "too_large" | "unavailable" | "timeout" | "invalid_response";

export type ExtractionClientResult =
  | { ok: true; response: ExtractionCandidateResponse }
  | { ok: false; error: ExtractionClientError };

export function buildCombinedExtractionRequest(interactions: Interaction[]): CombinedExtractionRequest | null {
  if (!interactions.length) {
    return null;
  }

  const chronological = [...sortInteractionsNewestFirst(interactions)].reverse();
  const note = chronological.map((interaction) => interaction.note.trim()).join("\n\n");
  if (!note || note.length > MAX_COMBINED_EXTRACTION_NOTE_LENGTH) {
    return null;
  }

  const requestBody = JSON.stringify({ note });
  if (serializedByteLength(requestBody) > MAX_COMBINED_EXTRACTION_REQUEST_BYTES) {
    return null;
  }

  return {
    note,
    sourceInteractionIds: chronological.map((interaction) => interaction.id),
  };
}

export async function requestExtraction(
  note: string,
  fetchImpl: typeof fetch = globalThis.fetch,
): Promise<ExtractionClientResult> {
  const body = JSON.stringify({ note });
  if (serializedByteLength(body) > MAX_COMBINED_EXTRACTION_REQUEST_BYTES) {
    return { ok: false, error: "too_large" };
  }

  let response: Response;
  try {
    response = await fetchImpl("/api/extractions/anchors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch {
    return { ok: false, error: "unavailable" };
  }

  if (response.status === 504) {
    return { ok: false, error: "timeout" };
  }
  if (response.status !== 200) {
    return { ok: false, error: response.status === 502 ? "invalid_response" : "unavailable" };
  }

  try {
    const parsed = parseExtractionCandidateResponse(await response.json());
    return parsed ? { ok: true, response: parsed } : { ok: false, error: "invalid_response" };
  } catch {
    return { ok: false, error: "invalid_response" };
  }
}

function serializedByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}
