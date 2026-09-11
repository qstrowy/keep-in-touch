import type { Interaction } from "../interactions/interaction";
import type { CoreTopic } from "./anchor";

export function getRecentInteractions(interactions: Interaction[]): Interaction[] {
  return interactions.slice(0, 3);
}

export function orderCoreTopics(topics: CoreTopic[]): CoreTopic[] {
  return [...topics].sort((left, right) => left.position - right.position);
}

export interface ExtractionSnapshot {
  personId: string;
  generation: number;
  sourceInteractionIds: string[];
}

export function isExtractionSnapshotCurrent(
  snapshot: Pick<ExtractionSnapshot, "personId" | "generation">,
  current: Pick<ExtractionSnapshot, "personId" | "generation">,
): boolean {
  return snapshot.personId === current.personId && snapshot.generation === current.generation;
}
