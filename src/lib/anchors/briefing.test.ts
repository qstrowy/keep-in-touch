import { describe, expect, it } from "vitest";

import type { ConversationAnchor } from "./anchor";
import type { Interaction } from "../interactions/interaction";
import { getRecentInteractions, groupAnchors } from "./briefing";

const interactions: Interaction[] = [
  { id: "one", occurredOn: "2026-09-09", note: "One", createdAt: 3 },
  { id: "two", occurredOn: "2026-09-08", note: "Two", createdAt: 2 },
  { id: "three", occurredOn: "2026-09-07", note: "Three", createdAt: 1 },
  { id: "four", occurredOn: "2026-09-06", note: "Four", createdAt: 0 },
];

const anchors: ConversationAnchor[] = [
  { id: "topic", kind: "topic", text: "Garden", createdAt: 1, sourceInteractionIds: ["one"] },
  { id: "follow-up", kind: "follow_up", text: "Ask later", createdAt: 1, sourceInteractionIds: ["one"] },
  {
    id: "suggestion",
    kind: "proposed_interaction",
    text: "Offer help",
    createdAt: 1,
    sourceInteractionIds: ["one"],
  },
];

describe("anchor briefing presentation helpers", () => {
  it("keeps the three newest interactions for recent context", () => {
    expect(getRecentInteractions(interactions).map((interaction) => interaction.id)).toEqual(["one", "two", "three"]);
  });

  it("groups each anchor kind independently", () => {
    expect(groupAnchors(anchors)).toEqual({
      topic: [anchors[0]],
      follow_up: [anchors[1]],
      proposed_interaction: [anchors[2]],
    });
  });
});
