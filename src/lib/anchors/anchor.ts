import type { CoreTopicCandidate } from "../extraction/contract";
import type { RelationshipRecord, RelationshipRecordReference } from "../relationship-data/types";

export const ANCHORS_COLLECTION = "anchors";
export const MAX_ANCHOR_TEXT_LENGTH = 500;
export const EXCLUSION_RECORD_KIND = "excluded-topic";

export interface CoreTopic {
  id: string;
  text: string;
  questions: string[];
  position: number;
  createdAt: number;
  sourceInteractionIds: string[];
}

export interface TopicExclusion {
  id: string;
  text: string;
}

export type AnchorRecordClassification =
  | { kind: "core-topic"; topic: CoreTopic }
  | { kind: "exclusion"; exclusion: TopicExclusion }
  | { kind: "malformed-exclusion"; record: RelationshipRecord }
  | { kind: "unrelated"; record: RelationshipRecord };

export function coreTopicFromRecord(record: RelationshipRecord): CoreTopic | null {
  if (record.collection !== ANCHORS_COLLECTION || !isPersonReference(record.parent)) return null;
  const payload = record.payload;
  if (!isExactRecord(payload, ["text", "questions", "position", "createdAt", "sourceInteractionIds"])) return null;
  if (
    typeof payload.text !== "string" ||
    !Array.isArray(payload.questions) ||
    !Array.isArray(payload.sourceInteractionIds)
  ) {
    return null;
  }
  const text = normalizeText(payload.text);
  const questions = normalizeTextList(payload.questions, 3);
  const sourceInteractionIds = normalizeSourceInteractionIds(payload.sourceInteractionIds);
  if (typeof payload.position !== "number" || typeof payload.createdAt !== "number") return null;
  if (
    !text ||
    !questions ||
    !sourceInteractionIds.length ||
    sourceInteractionIds.length !== payload.sourceInteractionIds.length ||
    !Number.isInteger(payload.position) ||
    payload.position < 0 ||
    payload.position > 6 ||
    !Number.isFinite(payload.createdAt) ||
    payload.createdAt < 0
  )
    return null;
  return {
    id: record.id,
    text,
    questions,
    position: payload.position,
    createdAt: payload.createdAt,
    sourceInteractionIds,
  };
}

export function topicExclusionFromRecord(record: RelationshipRecord): TopicExclusion | null {
  if (
    record.collection !== ANCHORS_COLLECTION ||
    !isPersonReference(record.parent) ||
    !isMarkedExclusionRecord(record)
  ) {
    return null;
  }

  const payload = record.payload;
  if (!isExactRecord(payload, ["kind", "text"])) return null;
  const text = normalizeText(payload.text);
  return text ? { id: record.id, text } : null;
}

export function isMarkedExclusionRecord(record: RelationshipRecord): boolean {
  return isRecord(record.payload) && record.payload.kind === EXCLUSION_RECORD_KIND;
}

export function classifyAnchorRecord(record: RelationshipRecord): AnchorRecordClassification {
  const topic = coreTopicFromRecord(record);
  if (topic) return { kind: "core-topic", topic };

  if (isMarkedExclusionRecord(record)) {
    const exclusion = topicExclusionFromRecord(record);
    return exclusion ? { kind: "exclusion", exclusion } : { kind: "malformed-exclusion", record };
  }

  return { kind: "unrelated", record };
}

export function createTopicExclusionRecord(record: RelationshipRecord, personId: string): RelationshipRecord | null {
  const normalizedPersonId = personId.trim();
  const topic = coreTopicFromRecord(record);
  if (!topic || !normalizedPersonId || !samePersonParent(record.parent, normalizedPersonId)) return null;

  return {
    id: record.id,
    collection: ANCHORS_COLLECTION,
    parent: { collection: "people", id: normalizedPersonId },
    payload: { kind: EXCLUSION_RECORD_KIND, text: topic.text },
  };
}

export function exclusionIdentityKey(text: string): string | null {
  const normalizedText = normalizeText(text);
  return normalizedText ? normalizedText.toLocaleLowerCase() : null;
}

export function createCoreTopicRecords(
  personId: string,
  sourceInteractionIds: string[],
  topics: CoreTopicCandidate[],
  createdAt = Date.now(),
): RelationshipRecord[] {
  const sources = normalizeSourceInteractionIds(sourceInteractionIds);
  if (!personId.trim() || !sources.length || topics.length > 7 || !Number.isFinite(createdAt) || createdAt < 0) {
    throw new Error("Core Topics require a person, valid sources, bounded topics, and a valid timestamp.");
  }
  return topics.map((topic, position) => {
    const text = normalizeText(topic.text);
    const questions = normalizeTextList(topic.questions, 3);
    if (!text || !questions) throw new Error("A Core Topic contains invalid text or questions.");
    return {
      id: `core-topic-${createdAt}-${position}-${globalThis.crypto.randomUUID()}`,
      collection: ANCHORS_COLLECTION,
      parent: { collection: "people", id: personId },
      payload: { text, questions, position, createdAt, sourceInteractionIds: sources },
    };
  });
}

export function createEditedCoreTopicRecord(
  record: RelationshipRecord,
  personId: string,
  text: string,
): RelationshipRecord | null {
  const normalizedPersonId = personId.trim();
  const topic = coreTopicFromRecord(record);
  const normalizedText = normalizeText(text);
  if (!topic || !normalizedPersonId || !samePersonParent(record.parent, normalizedPersonId) || !normalizedText) {
    return null;
  }

  return {
    id: record.id,
    collection: ANCHORS_COLLECTION,
    parent: { collection: "people", id: normalizedPersonId },
    payload: {
      text: normalizedText,
      questions: [...topic.questions],
      position: topic.position,
      createdAt: topic.createdAt,
      sourceInteractionIds: [...topic.sourceInteractionIds],
    },
  };
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim().replace(/\s+/g, " ");
  return !text || text.length > MAX_ANCHOR_TEXT_LENGTH ? null : text;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeTextList(value: unknown[], maxLength: number): string[] | null {
  if (value.length > maxLength) return null;
  const result: string[] = [];
  for (const item of value) {
    const text = normalizeText(item);
    if (!text) return null;
    result.push(text);
  }
  return result;
}

function normalizeSourceInteractionIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids: string[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !item.trim() || ids.includes(item)) return [];
    ids.push(item);
  }
  return ids;
}

function isPersonReference(value: RelationshipRecordReference | undefined): value is RelationshipRecordReference {
  return Boolean(value?.collection === "people" && value.id.trim());
}

function samePersonParent(value: RelationshipRecordReference | undefined, personId: string): boolean {
  return value?.collection === "people" && value.id === personId;
}

function isExactRecord(value: unknown, keys: string[]): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actualKeys = Object.keys(value);
  return actualKeys.length === keys.length && actualKeys.every((key) => keys.includes(key));
}
