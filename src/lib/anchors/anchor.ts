import type { RelationshipRecord, RelationshipRecordReference } from "../relationship-data/types";
import type { ExtractionCandidate, ExtractionCandidateKind } from "../extraction/contract";

export const ANCHORS_COLLECTION = "anchors";
export const MAX_ANCHOR_TEXT_LENGTH = 500;

export type AnchorKind = ExtractionCandidateKind;
export type AnchorLifecycleStatus = "open" | "resolved" | "dismissed";
export type AnchorOrigin = "generated" | "managed";

export interface ConversationAnchor {
  id: string;
  kind: AnchorKind;
  text: string;
  createdAt: number;
  sourceInteractionIds: string[];
  status: AnchorLifecycleStatus;
  origin: AnchorOrigin;
  originalKind: AnchorKind;
  originalText: string;
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
      status: "open",
      origin: "generated",
      originalKind: input.candidate.kind,
      originalText: text,
    },
  };
}

export function updateAnchorRecord(input: {
  anchor: ConversationAnchor;
  personId: string;
  text?: string;
  status?: AnchorLifecycleStatus;
}): RelationshipRecord {
  const text = normalizeAnchorText(input.text ?? input.anchor.text);
  if (!text) {
    throw new Error("An anchor must contain non-empty text.");
  }
  if (text.length > MAX_ANCHOR_TEXT_LENGTH) {
    throw new Error("An anchor must not exceed 500 characters.");
  }

  return {
    id: input.anchor.id,
    collection: ANCHORS_COLLECTION,
    parent: { collection: "people", id: input.personId },
    payload: {
      kind: input.anchor.kind,
      text,
      createdAt: input.anchor.createdAt,
      sourceInteractionIds: [...input.anchor.sourceInteractionIds],
      status: input.status ?? input.anchor.status,
      origin: "managed",
      originalKind: input.anchor.originalKind,
      originalText: input.anchor.originalText,
    },
  };
}

export function isManagedAnchorRecord(record: RelationshipRecord): boolean {
  return anchorFromRecord(record)?.origin === "managed";
}

export function hasSameOriginalCandidate(left: RelationshipRecord, right: RelationshipRecord): boolean {
  const leftAnchor = anchorFromRecord(left);
  const rightAnchor = anchorFromRecord(right);
  return Boolean(
    leftAnchor?.originalKind &&
    rightAnchor?.originalKind &&
    leftAnchor.originalKind === rightAnchor.originalKind &&
    leftAnchor.originalText === rightAnchor.originalText,
  );
}

export function anchorFromRecord(record: RelationshipRecord): ConversationAnchor | null {
  if (record.collection !== ANCHORS_COLLECTION || !isPersonReference(record.parent)) {
    return null;
  }

  const payload = record.payload;
  const isLegacyRecord = isExactRecord(payload, ["kind", "text", "createdAt", "sourceInteractionIds"]);
  const isCurrentRecord = isExactRecord(payload, [
    "kind",
    "text",
    "createdAt",
    "sourceInteractionIds",
    "status",
    "origin",
    "originalKind",
    "originalText",
  ]);
  if (!isLegacyRecord && !isCurrentRecord) {
    return null;
  }
  const kind = readAnchorKind(payload.kind);
  if (!kind || typeof payload.text !== "string" || !Array.isArray(payload.sourceInteractionIds)) {
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

  const status = isLegacyRecord ? "open" : readAnchorLifecycleStatus(payload.status);
  const origin = isLegacyRecord ? "generated" : readAnchorOrigin(payload.origin);
  const originalKind = isLegacyRecord ? kind : readAnchorKind(payload.originalKind);
  const originalText = isLegacyRecord ? text : readAnchorText(payload.originalText);
  if (
    !isAnchorLifecycleStatus(status) ||
    !isAnchorOrigin(origin) ||
    !isAnchorKind(originalKind) ||
    !originalText ||
    !normalizeAnchorText(originalText) ||
    normalizeAnchorText(originalText).length > MAX_ANCHOR_TEXT_LENGTH
  ) {
    return null;
  }

  return {
    id: record.id,
    kind,
    text,
    createdAt: payload.createdAt,
    sourceInteractionIds,
    status,
    origin,
    originalKind,
    originalText: normalizeAnchorText(originalText),
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
      id: `anchor-${createdAt}-${index}-${globalThis.crypto.randomUUID()}`,
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

function readAnchorKind(value: unknown): AnchorKind | null {
  return isAnchorKind(value) ? value : null;
}

function isAnchorLifecycleStatus(value: unknown): value is AnchorLifecycleStatus {
  return value === "open" || value === "resolved" || value === "dismissed";
}

function readAnchorLifecycleStatus(value: unknown): AnchorLifecycleStatus | null {
  return isAnchorLifecycleStatus(value) ? value : null;
}

function isAnchorOrigin(value: unknown): value is AnchorOrigin {
  return value === "generated" || value === "managed";
}

function readAnchorOrigin(value: unknown): AnchorOrigin | null {
  return isAnchorOrigin(value) ? value : null;
}

function readAnchorText(value: unknown): string | null {
  return typeof value === "string" ? normalizeAnchorText(value) : null;
}
