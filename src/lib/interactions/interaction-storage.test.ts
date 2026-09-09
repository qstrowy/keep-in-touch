import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";

import { createPersonRecord, validatePersonInput } from "../people/person";
import { createRelationshipVault } from "../relationship-data/local-vault";

import { createInteractionRecord, interactionFromRecord, validateInteractionInput } from "./interaction";

describe("interaction storage", () => {
  it("round-trips a person's interaction for its owner and cascades with that person", async () => {
    const idbFactory = new IDBFactory();
    const ownerVault = createRelationshipVault("owner-a", { idbFactory });
    const otherOwnerVault = createRelationshipVault("owner-b", { idbFactory });
    const person = validatePersonInput({
      displayName: "Marta",
      relationshipCircle: "friend",
      birthdayMonth: "",
      birthdayDay: "",
    });
    const interaction = validateInteractionInput(
      { occurredOn: "2026-09-08", note: "Ask about the new role" },
      "2026-09-09",
    );
    if (!person.person || !interaction.interaction) {
      throw new Error("Expected valid test records.");
    }

    await ownerVault.put(createPersonRecord(person.person, "person-1"));
    await ownerVault.put(createInteractionRecord(interaction.interaction, "interaction-1", "person-1", 100));

    const reopenedOwnerVault = createRelationshipVault("owner-a", { idbFactory });
    const parent = { collection: "people", id: "person-1" };
    await expect(reopenedOwnerVault.listByParent(parent)).resolves.toEqual([
      expect.objectContaining({ id: "interaction-1", ownerId: "owner-a" }),
    ]);
    await expect(otherOwnerVault.listByParent(parent)).resolves.toEqual([]);
    const [storedInteraction] = await reopenedOwnerVault.listByParent(parent);
    expect(interactionFromRecord(storedInteraction)).toEqual({
      id: "interaction-1",
      ...interaction.interaction,
      createdAt: 100,
    });

    await reopenedOwnerVault.deleteCascade(parent);
    await expect(reopenedOwnerVault.listByParent(parent)).resolves.toEqual([]);
  });
});
