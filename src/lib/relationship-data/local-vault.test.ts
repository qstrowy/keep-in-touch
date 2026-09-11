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

  it("updates or removes only the selected child beneath its verified parent", async () => {
    const ownerVault = createRelationshipVault("owner-a", { idbFactory });
    const otherOwnerVault = createRelationshipVault("owner-b", { idbFactory });
    const person = { collection: "people", id: "person-1" };
    const firstTopic = {
      id: "anchor-1",
      collection: "anchors",
      parent: person,
      payload: { text: "Garden", questions: ["Ask"], position: 0, createdAt: 1, sourceInteractionIds: ["note-1"] },
    } satisfies RelationshipRecord;
    const secondTopic = {
      id: "anchor-2",
      collection: "anchors",
      parent: person,
      payload: { text: "Travel", questions: [], position: 1, createdAt: 1, sourceInteractionIds: ["note-1"] },
    } satisfies RelationshipRecord;

    await ownerVault.put({ ...person, payload: { displayName: "Marek" } });
    await ownerVault.put(firstTopic);
    await ownerVault.put(secondTopic);
    await ownerVault.put({
      id: "unrelated-child",
      collection: "notes",
      parent: person,
      payload: { body: "Keep this" },
    });
    await otherOwnerVault.put({ ...person, payload: { displayName: "Other" } });
    await otherOwnerVault.put({ ...firstTopic, payload: { ...firstTopic.payload, text: "Private" } });

    await expect(
      ownerVault.replaceChildIfParentExists(person, firstTopic, {
        ...firstTopic,
        payload: { ...firstTopic.payload, text: "Updated" },
      }),
    ).resolves.toBe(true);
    await expect(ownerVault.get("anchors", firstTopic.id)).resolves.toMatchObject({
      payload: { text: "Updated" },
    });
    await expect(ownerVault.get("anchors", secondTopic.id)).resolves.toMatchObject(secondTopic);
    await expect(ownerVault.get("notes", "unrelated-child")).resolves.toBeTruthy();
    await expect(otherOwnerVault.get("anchors", firstTopic.id)).resolves.toMatchObject({
      payload: { text: "Private" },
    });

    await expect(ownerVault.removeChildIfParentExists(person, secondTopic)).resolves.toBe(true);
    await expect(ownerVault.get("anchors", secondTopic.id)).resolves.toBeNull();
    await expect(ownerVault.get("anchors", firstTopic.id)).resolves.toBeTruthy();
  });

  it("refuses missing, mismatched, or deleted parent-child mutations without resurrection", async () => {
    const ownerVault = createRelationshipVault("owner-a", { idbFactory });
    const otherOwnerVault = createRelationshipVault("owner-b", { idbFactory });
    const person = { collection: "people", id: "person-1" };
    const otherPerson = { collection: "people", id: "person-2" };
    const topic = {
      id: "anchor-1",
      collection: "anchors",
      parent: person,
      payload: { text: "Garden", questions: [], position: 0, createdAt: 1, sourceInteractionIds: ["note-1"] },
    } satisfies RelationshipRecord;
    const replacement = { ...topic, payload: { ...topic.payload, text: "Updated" } };

    await ownerVault.put({ ...person, payload: { displayName: "Marek" } });
    await ownerVault.put({ ...otherPerson, payload: { displayName: "Zofia" } });
    await ownerVault.put(topic);
    await otherOwnerVault.put({ ...person, payload: { displayName: "Other" } });
    await otherOwnerVault.put({ ...topic, payload: { ...topic.payload, text: "Private" } });

    await expect(
      ownerVault.replaceChildIfParentExists(person, { collection: "anchors", id: "missing" }, replacement),
    ).resolves.toBe(false);
    await expect(ownerVault.removeChildIfParentExists(otherPerson, topic)).resolves.toBe(false);
    await expect(otherOwnerVault.replaceChildIfParentExists(person, topic, replacement)).resolves.toBe(true);
    await expect(otherOwnerVault.get("anchors", topic.id)).resolves.toMatchObject({ payload: { text: "Updated" } });
    await expect(ownerVault.get("anchors", topic.id)).resolves.toMatchObject({ payload: { text: "Garden" } });

    await ownerVault.deleteCascade(person);
    await expect(ownerVault.replaceChildIfParentExists(person, topic, replacement)).resolves.toBe(false);
    await expect(ownerVault.removeChildIfParentExists(person, topic)).resolves.toBe(false);
    await expect(ownerVault.get("people", person.id)).resolves.toBeNull();
    await expect(ownerVault.get("anchors", topic.id)).resolves.toBeNull();
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

  it("atomically replaces every target child after rechecking every source", async () => {
    const ownerVault = createRelationshipVault("owner-a", { idbFactory });
    const otherOwnerVault = createRelationshipVault("owner-b", { idbFactory });
    const person = { collection: "people", id: "person-1" };
    const source = { collection: "interactions", id: "interaction-1" };

    await ownerVault.put({ ...person, payload: { displayName: "Marek" } });
    await ownerVault.put({ ...source, parent: person, payload: { note: "Garden" } });
    await ownerVault.put({
      id: "old-anchor",
      collection: "anchors",
      parent: person,
      payload: { kind: "topic", text: "Old", createdAt: 1, sourceInteractionIds: [source.id] },
    });
    await ownerVault.put({
      id: "managed-anchor",
      collection: "anchors",
      parent: person,
      payload: { kind: "topic", text: "Managed old", status: "dismissed", origin: "managed" },
    });
    await ownerVault.put({
      id: "unrelated-child",
      collection: "other",
      parent: person,
      payload: { value: true },
    });
    await otherOwnerVault.put({ ...person, payload: { displayName: "Other" } });
    await otherOwnerVault.put({ ...source, parent: person, payload: { note: "Private" } });
    await otherOwnerVault.put({
      id: "other-anchor",
      collection: "anchors",
      parent: person,
      payload: { kind: "topic", text: "Other", createdAt: 1, sourceInteractionIds: [source.id] },
    });

    await expect(
      ownerVault.replaceChildrenIfSourcesExist(person, [source], "anchors", [
        {
          id: "new-anchor",
          collection: "anchors",
          parent: person,
          payload: { kind: "topic", text: "New", createdAt: 2, sourceInteractionIds: [source.id] },
        },
      ]),
    ).resolves.toBe(true);

    await expect(ownerVault.get("anchors", "old-anchor")).resolves.toBeNull();
    await expect(ownerVault.get("anchors", "managed-anchor")).resolves.toBeNull();
    await expect(ownerVault.get("anchors", "new-anchor")).resolves.toMatchObject({ ownerId: "owner-a" });
    await expect(ownerVault.get("other", "unrelated-child")).resolves.toBeTruthy();
    await expect(otherOwnerVault.get("anchors", "other-anchor")).resolves.toMatchObject({ ownerId: "owner-b" });
  });

  it("clears the target collection on a valid empty replacement", async () => {
    const ownerVault = createRelationshipVault("owner-a", { idbFactory });
    const person = { collection: "people", id: "person-1" };
    const source = { collection: "interactions", id: "interaction-1" };

    await ownerVault.put({ ...person, payload: { displayName: "Marek" } });
    await ownerVault.put({ ...source, parent: person, payload: { note: "Garden" } });
    await ownerVault.put({
      id: "old-anchor",
      collection: "anchors",
      parent: person,
      payload: { kind: "topic", text: "Old", createdAt: 1, sourceInteractionIds: [source.id] },
    });
    await ownerVault.put({
      id: "unrelated-child",
      collection: "other",
      parent: person,
      payload: { value: true },
    });

    await expect(ownerVault.replaceChildrenIfSourcesExist(person, [source], "anchors", [])).resolves.toBe(true);

    await expect(ownerVault.get("anchors", "old-anchor")).resolves.toBeNull();
    await expect(ownerVault.get("other", "unrelated-child")).resolves.toBeTruthy();
  });

  it("preserves current edits and hides on failed replacement, then resets them on valid replacement", async () => {
    const ownerVault = createRelationshipVault("owner-a", { idbFactory });
    const person = { collection: "people", id: "person-1" };
    const source = { collection: "interactions", id: "interaction-1" };
    const currentTopic = {
      id: "current-anchor",
      collection: "anchors",
      parent: person,
      payload: {
        text: "Edited garden",
        questions: ["Ask"],
        position: 0,
        createdAt: 1,
        sourceInteractionIds: [source.id],
      },
    } satisfies RelationshipRecord;
    const hiddenTopic = {
      id: "hidden-anchor",
      collection: "anchors",
      parent: person,
      payload: { text: "Hidden travel", questions: [], position: 1, createdAt: 1, sourceInteractionIds: [source.id] },
    } satisfies RelationshipRecord;
    const freshTopic = {
      id: "fresh-anchor",
      collection: "anchors",
      parent: person,
      payload: { text: "Fresh topic", questions: [], position: 0, createdAt: 2, sourceInteractionIds: [source.id] },
    } satisfies RelationshipRecord;

    await ownerVault.put({ ...person, payload: { displayName: "Marek" } });
    await ownerVault.put({ ...source, parent: person, payload: { note: "Garden" } });
    await ownerVault.put(currentTopic);
    await ownerVault.put(hiddenTopic);
    await ownerVault.removeChildIfParentExists(person, hiddenTopic);

    await expect(
      ownerVault.replaceChildrenIfSourcesExist(person, [{ collection: "interactions", id: "missing" }], "anchors", [
        freshTopic,
      ]),
    ).resolves.toBe(false);
    await expect(ownerVault.get("anchors", currentTopic.id)).resolves.toMatchObject(currentTopic);
    await expect(ownerVault.get("anchors", hiddenTopic.id)).resolves.toBeNull();

    await expect(ownerVault.replaceChildrenIfSourcesExist(person, [source], "anchors", [freshTopic])).resolves.toBe(
      true,
    );
    await expect(ownerVault.get("anchors", currentTopic.id)).resolves.toBeNull();
    await expect(ownerVault.get("anchors", hiddenTopic.id)).resolves.toBeNull();
    await expect(ownerVault.get("anchors", freshTopic.id)).resolves.toMatchObject(freshTopic);
  });

  it("preserves managed children and suppresses matching replacements atomically", async () => {
    const ownerVault = createRelationshipVault("owner-a", { idbFactory });
    const person = { collection: "people", id: "person-1" };
    const source = { collection: "interactions", id: "interaction-1" };
    const managed = {
      id: "managed-anchor",
      collection: "anchors",
      parent: person,
      payload: {
        kind: "topic",
        text: "Corrected wording",
        originalKind: "topic",
        originalText: "Original wording",
        status: "dismissed",
        origin: "managed",
        createdAt: 1,
        sourceInteractionIds: [source.id],
      },
    };
    await ownerVault.put({ ...person, payload: { displayName: "Marek" } });
    await ownerVault.put({ ...source, parent: person, payload: { note: "Original wording" } });
    await ownerVault.put(managed);

    const matching = {
      id: "matching",
      collection: "anchors",
      parent: person,
      payload: {
        kind: "topic",
        text: "Original wording",
        originalKind: "topic",
        originalText: "Original wording",
        status: "open",
        origin: "generated",
        createdAt: 2,
        sourceInteractionIds: [source.id],
      },
    };
    const distinct = { ...matching, id: "distinct", payload: { ...matching.payload, text: "New wording" } };

    await expect(
      ownerVault.replaceChildrenIfSourcesExist(person, [source], "anchors", [matching, distinct], {
        preserveChild: (record) => record.payload.origin === "managed",
        conflictsWithPreservedChild: (replacement, preservedChild) =>
          replacement.payload.kind === preservedChild.payload.originalKind &&
          replacement.payload.text === preservedChild.payload.originalText,
      }),
    ).resolves.toBe(true);

    await expect(ownerVault.get("anchors", managed.id)).resolves.toMatchObject(managed);
    await expect(ownerVault.get("anchors", matching.id)).resolves.toBeNull();
    await expect(ownerVault.get("anchors", distinct.id)).resolves.toMatchObject({ id: "distinct" });
  });

  it("leaves the existing generated set untouched when a source disappeared", async () => {
    const ownerVault = createRelationshipVault("owner-a", { idbFactory });
    const person = { collection: "people", id: "person-1" };
    const source = { collection: "interactions", id: "interaction-1" };

    await ownerVault.put({ ...person, payload: { displayName: "Marek" } });
    await ownerVault.put({
      id: "old-anchor",
      collection: "anchors",
      parent: person,
      payload: { kind: "topic", text: "Old", createdAt: 1, sourceInteractionIds: [source.id] },
    });

    await expect(
      ownerVault.replaceChildrenIfSourcesExist(person, [source], "anchors", [
        {
          id: "new-anchor",
          collection: "anchors",
          parent: person,
          payload: { kind: "topic", text: "New", createdAt: 2, sourceInteractionIds: [source.id] },
        },
      ]),
    ).resolves.toBe(false);
    await expect(ownerVault.get("anchors", "old-anchor")).resolves.toBeTruthy();
    await expect(ownerVault.get("anchors", "new-anchor")).resolves.toBeNull();
  });

  it("discards a replacement after the selected person was deleted", async () => {
    const ownerVault = createRelationshipVault("owner-a", { idbFactory });
    const person = { collection: "people", id: "person-1" };
    const source = { collection: "interactions", id: "interaction-1" };

    await ownerVault.put({ ...person, payload: { displayName: "Marek" } });
    await ownerVault.put({ ...source, parent: person, payload: { note: "Garden" } });
    await ownerVault.put({
      id: "old-anchor",
      collection: "anchors",
      parent: person,
      payload: { kind: "topic", text: "Old", createdAt: 1, sourceInteractionIds: [source.id] },
    });
    await ownerVault.deleteCascade(person);

    await expect(
      ownerVault.replaceChildrenIfSourcesExist(person, [source], "anchors", [
        {
          id: "late-anchor",
          collection: "anchors",
          parent: person,
          payload: { kind: "topic", text: "Late", createdAt: 2, sourceInteractionIds: [source.id] },
        },
      ]),
    ).resolves.toBe(false);
    await expect(ownerVault.get("people", person.id)).resolves.toBeNull();
    await expect(ownerVault.get("interactions", source.id)).resolves.toBeNull();
    await expect(ownerVault.get("anchors", "late-anchor")).resolves.toBeNull();
  });

  it("cascades owner-managed anchors with their person", async () => {
    const ownerVault = createRelationshipVault("owner-a", { idbFactory });
    const person = { collection: "people", id: "person-1" };

    await ownerVault.put({ ...person, payload: { displayName: "Marek" } });
    await ownerVault.put({
      id: "managed-anchor",
      collection: "anchors",
      parent: person,
      payload: {
        kind: "topic",
        text: "Corrected",
        originalKind: "topic",
        originalText: "Generated",
        status: "resolved",
        origin: "managed",
        createdAt: 1,
        sourceInteractionIds: ["interaction-1"],
      },
    });

    await ownerVault.deleteCascade(person);

    await expect(ownerVault.get("people", person.id)).resolves.toBeNull();
    await expect(ownerVault.get("anchors", "managed-anchor")).resolves.toBeNull();
  });
});
