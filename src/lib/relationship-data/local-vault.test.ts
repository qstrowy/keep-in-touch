import { IDBFactory } from "fake-indexeddb";
import { beforeEach, describe, expect, it } from "vitest";

import { createRelationshipVault } from "./local-vault";
import { MissingRelationshipOwnerError, RelationshipRecordNotFoundError, type RelationshipRecord } from "./types";

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

  it("lists only records in the requested collection for the active owner", async () => {
    const ownerVault = createRelationshipVault("owner-a", { idbFactory });
    const otherOwnerVault = createRelationshipVault("owner-b", { idbFactory });

    await ownerVault.put(contactRecord);
    await ownerVault.put({
      id: "note-1",
      collection: "notes",
      payload: { body: "Ask about the new role" },
    });
    await otherOwnerVault.put(contactRecord);

    await expect(ownerVault.listByCollection("contacts")).resolves.toMatchObject([
      { id: "contact-1", collection: "contacts", ownerId: "owner-a" },
    ]);
  });

  it("lists only the active owner's parent-linked records", async () => {
    const ownerVault = createRelationshipVault("owner-a", { idbFactory });
    const otherOwnerVault = createRelationshipVault("owner-b", { idbFactory });

    await ownerVault.put({
      id: "note-1",
      collection: "notes",
      parent: { collection: "contacts", id: "contact-1" },
      payload: { body: "Ask about the new role" },
    });
    await otherOwnerVault.put({
      id: "note-1",
      collection: "notes",
      parent: { collection: "contacts", id: "contact-1" },
      payload: { body: "Private to the second owner" },
    });

    await expect(ownerVault.listByParent({ collection: "contacts", id: "contact-1" })).resolves.toMatchObject([
      { id: "note-1", ownerId: "owner-a" },
    ]);
  });

  it("atomically removes a root record and all of its descendants", async () => {
    const ownerVault = createRelationshipVault("owner-a", { idbFactory });
    const otherOwnerVault = createRelationshipVault("owner-b", { idbFactory });

    await ownerVault.put(contactRecord);
    await ownerVault.put({
      id: "note-1",
      collection: "notes",
      parent: { collection: "contacts", id: "contact-1" },
      payload: { body: "Ask about the new role" },
    });
    await ownerVault.put({
      id: "anchor-1",
      collection: "anchors",
      parent: { collection: "notes", id: "note-1" },
      payload: { label: "New role" },
    });
    await otherOwnerVault.put(contactRecord);

    await ownerVault.deleteCascade({ collection: "contacts", id: "contact-1" });

    await expect(ownerVault.get("contacts", "contact-1")).resolves.toBeNull();
    await expect(ownerVault.get("notes", "note-1")).resolves.toBeNull();
    await expect(ownerVault.get("anchors", "anchor-1")).resolves.toBeNull();
    await expect(otherOwnerVault.get("contacts", "contact-1")).resolves.toMatchObject({ ownerId: "owner-b" });
  });

  it("reports a missing root as a failed deletion", async () => {
    const ownerVault = createRelationshipVault("owner-a", { idbFactory });
    await ownerVault.put(contactRecord);

    await expect(ownerVault.deleteCascade({ collection: "contacts", id: "missing" })).rejects.toThrow(
      RelationshipRecordNotFoundError,
    );
    await expect(ownerVault.get("contacts", "contact-1")).resolves.toMatchObject(contactRecord);
  });
});
