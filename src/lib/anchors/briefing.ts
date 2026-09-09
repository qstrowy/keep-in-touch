import type { Interaction } from "../interactions/interaction";
import type { AnchorKind, ConversationAnchor } from "./anchor";

export function getRecentInteractions(interactions: Interaction[]): Interaction[] {
  return interactions.slice(0, 3);
}

export function groupAnchors(anchors: ConversationAnchor[]): Record<AnchorKind, ConversationAnchor[]> {
  return {
    topic: anchors.filter((anchor) => anchor.kind === "topic"),
    follow_up: anchors.filter((anchor) => anchor.kind === "follow_up"),
    proposed_interaction: anchors.filter((anchor) => anchor.kind === "proposed_interaction"),
  };
}
