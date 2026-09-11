import type { Interaction } from "../interactions/interaction";
import type { CoreTopic } from "./anchor";

export function getRecentInteractions(interactions: Interaction[]): Interaction[] {
  return interactions.slice(0, 3);
}

export function orderCoreTopics(topics: CoreTopic[]): CoreTopic[] {
  return [...topics].sort((left, right) => left.position - right.position);
}
