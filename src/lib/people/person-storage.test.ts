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

  it("replaces a person's payload when the owner saves the same ID again", async () => {
    const idbFactory = new IDBFactory();
    const ownerVault = createRelationshipVault("owner-a", { idbFactory });
    const initialPerson = validatePersonInput({
      displayName: "Marta",
      relationshipCircle: "family",
      birthdayMonth: "2",
      birthdayDay: "29",
    });
    const editedPerson = validatePersonInput({
      displayName: "Marta Nowak",
      relationshipCircle: "professional",
      birthdayMonth: "",
      birthdayDay: "",
    });

    if (!initialPerson.person || !editedPerson.person) {
      throw new Error("Expected valid person input.");
    }

    await ownerVault.put(createPersonRecord(initialPerson.person, "person-1"));
    await ownerVault.put(createPersonRecord(editedPerson.person, "person-1"));

    const reopenedOwnerVault = createRelationshipVault("owner-a", { idbFactory });
    await expect(reopenedOwnerVault.listByCollection(PEOPLE_COLLECTION)).resolves.toEqual([
      expect.objectContaining({
        id: "person-1",
        payload: { displayName: "Marta Nowak", relationshipCircle: "professional" },
      }),
    ]);
  });

  it("cascades a person's linked records without deleting another owner's person", async () => {
    const idbFactory = new IDBFactory();
    const ownerVault = createRelationshipVault("owner-a", { idbFactory });
    const otherOwnerVault = createRelationshipVault("owner-b", { idbFactory });
    const validation = validatePersonInput({
      displayName: "Marta",
      relationshipCircle: "family",
      birthdayMonth: "",
      birthdayDay: "",
    });

    if (!validation.person) {
      throw new Error("Expected valid person input.");
    }

    await ownerVault.put(createPersonRecord(validation.person, "person-1"));
    await ownerVault.put({
      collection: "interactions",
      id: "interaction-1",
      parent: { collection: PEOPLE_COLLECTION, id: "person-1" },
      payload: { body: "Ask about the new role" },
    });
    await ownerVault.put({
      collection: "anchors",
      id: "excluded-anchor",
      parent: { collection: PEOPLE_COLLECTION, id: "person-1" },
      payload: { kind: "excluded-topic", text: "The new role" },
    });
    await otherOwnerVault.put(createPersonRecord(validation.person, "person-1"));

    await ownerVault.deleteCascade({ collection: PEOPLE_COLLECTION, id: "person-1" });

    await expect(ownerVault.listByCollection(PEOPLE_COLLECTION)).resolves.toEqual([]);
    await expect(ownerVault.listByCollection("interactions")).resolves.toEqual([]);
    await expect(ownerVault.listByCollection("anchors")).resolves.toEqual([]);
    await expect(otherOwnerVault.listByCollection(PEOPLE_COLLECTION)).resolves.toEqual([
      expect.objectContaining({ id: "person-1", ownerId: "owner-b" }),
    ]);
  });
});
