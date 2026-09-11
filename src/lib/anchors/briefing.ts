import type { Interaction } from "../interactions/interaction";
import { classifyAnchorRecord, type CoreTopic } from "./anchor";
import type { RelationshipRecord } from "../relationship-data/types";
import { buildCombinedExtractionRequest, type CombinedExtractionRequest } from "../extraction/client";

export function orderCoreTopics(topics: CoreTopic[]): CoreTopic[] {
  return [...topics].sort((left, right) => left.position - right.position);
}

export interface ExtractionSnapshot {
  personId: string;
  generation: number;
  sourceInteractionIds: string[];
}

export function canStartCoreTopicExtraction(
  state: "loading" | "ready" | "running" | "error",
  interactionCount: number,
  editingTopicId: string | null,
  mutationTopicId: string | null,
  exclusionConfirmationTopicId: string | null = null,
): boolean {
  return (
    state !== "loading" &&
    state !== "running" &&
    interactionCount > 0 &&
    !editingTopicId &&
    !mutationTopicId &&
    !exclusionConfirmationTopicId
  );
}

export interface ClassifiedBriefingRecords {
  topics: CoreTopic[];
  excludedTopics: string[];
  hasMalformedExclusion: boolean;
}

export type CoreTopicExtractionPreparation =
  | { ok: true; request: CombinedExtractionRequest }
  | { ok: false; error: "malformed_exclusion" | "too_large" };

export function prepareCoreTopicExtraction(
  interactions: Interaction[],
  excludedTopics: string[],
  hasMalformedExclusion: boolean,
): CoreTopicExtractionPreparation {
  if (hasMalformedExclusion) return { ok: false, error: "malformed_exclusion" };
  const request = buildCombinedExtractionRequest(interactions, excludedTopics);
  return request ? { ok: true, request } : { ok: false, error: "too_large" };
}

export function classifyBriefingRecords(records: RelationshipRecord[]): ClassifiedBriefingRecords {
  const topics: CoreTopic[] = [];
  const excludedTopics: string[] = [];
  let hasMalformedExclusion = false;

  for (const record of records) {
    const classification = classifyAnchorRecord(record);
    if (classification.kind === "core-topic") {
      topics.push(classification.topic);
    } else if (classification.kind === "exclusion") {
      excludedTopics.push(classification.exclusion.text);
    } else if (classification.kind === "malformed-exclusion") {
      hasMalformedExclusion = true;
    }
  }

  return { topics: orderCoreTopics(topics), excludedTopics, hasMalformedExclusion };
}

export function isExtractionSnapshotCurrent(
  snapshot: Pick<ExtractionSnapshot, "personId" | "generation">,
  current: Pick<ExtractionSnapshot, "personId" | "generation">,
): boolean {
  return snapshot.personId === current.personId && snapshot.generation === current.generation;
}
