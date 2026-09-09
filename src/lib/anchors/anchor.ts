import type { RelationshipRecord, RelationshipRecordReference } from "../relationship-data/types";
import type { ExtractionCandidate, ExtractionCandidateKind } from "../extraction/contract";

export const ANCHORS_COLLECTION = "anchors";
export const MAX_ANCHOR_TEXT_LENGTH = 500;

export type AnchorKind = ExtractionCandidateKind;

export interface ConversationAnchor {
  id: string;
  kind: AnchorKind;
  text: string;
  createdAt: number;
  sourceInteractionIds: string[];
}

export interface CreateConversationAnchorInput {
  id: string;
  personId: string;
  createdAt: number;
  sourceInteractionIds: string[];
  candidate: ExtractionCandidate;
}

export function createAnchorRecord(input: CreateConversationAnchorInput): RelationshipRecord {
  const sourceInteractionIds = normalizeSourceInteractionIds(input.sourceInteractionIds);
  const text = normalizeAnchorText(input.candidate.text);

  if (!sourceInteractionIds.length) {
    throw new Error("An anchor must reference at least one source interaction.");
  }
  if (!text) {
    throw new Error("An anchor must contain non-empty text.");
  }
  if (!Number.isFinite(input.createdAt) || input.createdAt < 0) {
    throw new Error("An anchor must contain a valid creation timestamp.");
  }

  return {
    id: input.id,
    collection: ANCHORS_COLLECTION,
    parent: { collection: "people", id: input.personId },
    payload: {
      kind: input.candidate.kind,
      text,
      createdAt: input.createdAt,
      sourceInteractionIds,
    },
  };
}

export function anchorFromRecord(record: RelationshipRecord): ConversationAnchor | null {
  if (record.collection !== ANCHORS_COLLECTION || !isPersonReference(record.parent)) {
    return null;
  }

  const payload = record.payload;
  if (!isExactRecord(payload, ["kind", "text", "createdAt", "sourceInteractionIds"])) {
    return null;
  }
  if (!isAnchorKind(payload.kind) || typeof payload.text !== "string" || !Array.isArray(payload.sourceInteractionIds)) {
    return null;
  }

  const text = normalizeAnchorText(payload.text);
  const sourceInteractionIds = normalizeSourceInteractionIds(payload.sourceInteractionIds);
  if (!text || text.length > MAX_ANCHOR_TEXT_LENGTH || !Number.isFinite(payload.createdAt) || payload.createdAt < 0) {
    return null;
  }
  if (sourceInteractionIds.length !== payload.sourceInteractionIds.length || !sourceInteractionIds.length) {
    return null;
  }

  return {
    id: record.id,
    kind: payload.kind,
    text,
    createdAt: payload.createdAt,
    sourceInteractionIds,
  };
}

export function createAnchorRecords(
  personId: string,
  sourceInteractionIds: string[],
  candidates: ExtractionCandidate[],
  createdAt = Date.now(),
): RelationshipRecord[] {
  return candidates.map((candidate, index) =>
    createAnchorRecord({
      id: `anchor-${createdAt}-${index}`,
      personId,
      createdAt,
      sourceInteractionIds,
      candidate,
    }),
  );
}

function normalizeAnchorText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeSourceInteractionIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const ids: string[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !item.trim() || ids.includes(item)) {
      return [];
    }
    ids.push(item);
  }
  return ids;
}

function isPersonReference(value: RelationshipRecordReference | undefined): value is RelationshipRecordReference {
  return Boolean(value?.collection === "people" && value.id.trim());
}

function isExactRecord(value: unknown, keys: string[]): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const actualKeys = Object.keys(value);
  return actualKeys.length === keys.length && actualKeys.every((key) => keys.includes(key));
}

function isAnchorKind(value: unknown): value is AnchorKind {
  return value === "topic" || value === "follow_up" || value === "proposed_interaction";
}
