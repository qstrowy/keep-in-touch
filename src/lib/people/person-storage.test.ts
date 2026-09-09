import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";

import { createRelationshipVault } from "../relationship-data/local-vault";

import { PEOPLE_COLLECTION, createPersonRecord, personFromRecord, validatePersonInput } from "./person";

describe("person storage", () => {
  it("round-trips a person for its owner without exposing it to another owner", async () => {
    const idbFactory = new IDBFactory();
    const validation = validatePersonInput({
      displayName: "Marta",
      relationshipCircle: "family",
      birthdayMonth: "2",
      birthdayDay: "29",
    });

    if (!validation.person) {
      throw new Error("Expected valid person input.");
    }

    const ownerVault = createRelationshipVault("owner-a", { idbFactory });
    await ownerVault.put(createPersonRecord(validation.person, "person-1"));

    const reopenedOwnerVault = createRelationshipVault("owner-a", { idbFactory });
    const storedPeople = await reopenedOwnerVault.listByCollection(PEOPLE_COLLECTION);

    expect(storedPeople.map(personFromRecord)).toEqual([
      {
        id: "person-1",
        displayName: "Marta",
        relationshipCircle: "family",
        birthday: { month: 2, day: 29 },
      },
    ]);

    const otherOwnerVault = createRelationshipVault("owner-b", { idbFactory });
    await expect(otherOwnerVault.listByCollection(PEOPLE_COLLECTION)).resolves.toEqual([]);
  });
});
