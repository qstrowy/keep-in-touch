import { IDBFactory } from "fake-indexeddb";
import { beforeEach, describe, expect, it } from "vitest";

import { createRelationshipVault } from "./local-vault";
import { MissingRelationshipOwnerError, type RelationshipRecord } from "./types";

const contactRecord: RelationshipRecord = {
  id: "contact-1",
  collection: "contacts",
  payload: { displayName: "Marek" },
};

describe("relationship local vault", () => {
  let idbFactory: IDBFactory;

  beforeEach(() => {
    idbFactory = new IDBFactory();
  });

  it("rejects an absent owner before it opens a vault", () => {
    expect(() => createRelationshipVault("  ", { idbFactory })).toThrow(MissingRelationshipOwnerError);
  });

  it("keeps records isolated to their owner", async () => {
    const ownerVault = createRelationshipVault("owner-a", { idbFactory });
    const otherOwnerVault = createRelationshipVault("owner-b", { idbFactory });

    await ownerVault.put(contactRecord);

    await expect(ownerVault.get("contacts", "contact-1")).resolves.toMatchObject({
      ...contactRecord,
      ownerId: "owner-a",
    });
    await expect(otherOwnerVault.get("contacts", "contact-1")).resolves.toBeNull();
  });

  it("persists records when the same owner reopens a vault", async () => {
    const originalVault = createRelationshipVault("owner-a", { idbFactory });
    await originalVault.put(contactRecord);

    const reopenedVault = createRelationshipVault("owner-a", { idbFactory });

    await expect(reopenedVault.get("contacts", "contact-1")).resolves.toMatchObject(contactRecord);
  });

  it("lists only the active owner's parent-linked records", async () => {
    const ownerVault = createRelationshipVault("owner-a", { idbFactory });
    const otherOwnerVault = createRelationshipVault("owner-b", { idbFactory });

    await ownerVault.put({
      id: "note-1",
      collection: "notes",
      parentId: "contact-1",
      payload: { body: "Ask about the new role" },
    });
    await otherOwnerVault.put({
      id: "note-1",
      collection: "notes",
      parentId: "contact-1",
      payload: { body: "Private to the second owner" },
    });

    await expect(ownerVault.listByParent("contact-1")).resolves.toMatchObject([{ id: "note-1", ownerId: "owner-a" }]);
  });
});
