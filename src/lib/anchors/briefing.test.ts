import { describe, expect, it } from "vitest";

import type { Interaction } from "../interactions/interaction";
import type { CoreTopic } from "./anchor";
import { getRecentInteractions, orderCoreTopics } from "./briefing";

const interactions: Interaction[] = [
  { id: "one", occurredOn: "2026-09-09", note: "One", createdAt: 3 },
  { id: "two", occurredOn: "2026-09-08", note: "Two", createdAt: 2 },
  { id: "three", occurredOn: "2026-09-07", note: "Three", createdAt: 1 },
  { id: "four", occurredOn: "2026-09-06", note: "Four", createdAt: 0 },
];

const topic = (id: string, position: number): CoreTopic => ({
  id,
  text: id,
  questions: [],
  position,
  createdAt: 1,
  sourceInteractionIds: ["one"],
});

describe("Core Topics briefing helpers", () => {
  it("keeps the three newest interactions for recent context", () => {
    expect(getRecentInteractions(interactions).map((interaction) => interaction.id)).toEqual(["one", "two", "three"]);
  });

  it("orders topics by explicit provider position without deduplication", () => {
    const topics = [topic("second", 1), topic("first", 0), topic("also-first", 0)];
    expect(orderCoreTopics(topics).map((item) => item.id)).toEqual(["first", "also-first", "second"]);
  });
});
