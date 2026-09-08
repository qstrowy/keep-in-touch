import { describe, expect, it } from "vitest";

import { PEOPLE_COLLECTION, createPersonRecord, personFromRecord, validatePersonInput } from "./person";

const validInput = {
  displayName: "  Marek  ",
  relationshipCircle: "friend",
  birthdayMonth: "",
  birthdayDay: "",
};

describe("person contract", () => {
  it("normalizes valid input without requiring a birthday", () => {
    expect(validatePersonInput(validInput)).toEqual({
      person: { displayName: "Marek", relationshipCircle: "friend" },
      errors: {},
    });
  });

  it("accepts a leap-day birthday and rejects invalid or partial dates", () => {
    expect(validatePersonInput({ ...validInput, birthdayMonth: "2", birthdayDay: "29" }).person).toMatchObject({
      birthday: { month: 2, day: 29 },
    });
    expect(validatePersonInput({ ...validInput, birthdayMonth: "6", birthdayDay: "31" }).errors.birthday).toBeDefined();
    expect(validatePersonInput({ ...validInput, birthdayMonth: "6", birthdayDay: "" }).errors.birthday).toBeDefined();
  });

  it("rejects blank names and unsupported relationship circles", () => {
    expect(validatePersonInput({ ...validInput, displayName: " " }).errors.displayName).toBeDefined();
    expect(
      validatePersonInput({ ...validInput, relationshipCircle: "neighbour" }).errors.relationshipCircle,
    ).toBeDefined();
  });

  it("creates distinct records for duplicate display names", () => {
    const validation = validatePersonInput(validInput);
    if (!validation.person) {
      throw new Error("Expected valid person input.");
    }

    const first = createPersonRecord(validation.person, "person-1");
    const second = createPersonRecord(validation.person, "person-2");

    expect(first).toMatchObject({ collection: PEOPLE_COLLECTION, id: "person-1", payload: { displayName: "Marek" } });
    expect(second).toMatchObject({ collection: PEOPLE_COLLECTION, id: "person-2", payload: { displayName: "Marek" } });
  });

  it("reads valid person records and ignores malformed payloads", () => {
    expect(
      personFromRecord({
        collection: PEOPLE_COLLECTION,
        id: "person-1",
        payload: { displayName: "Marek", relationshipCircle: "friend", birthday: { month: 12, day: 1 } },
      }),
    ).toEqual({
      id: "person-1",
      displayName: "Marek",
      relationshipCircle: "friend",
      birthday: { month: 12, day: 1 },
    });
    expect(
      personFromRecord({
        collection: PEOPLE_COLLECTION,
        id: "person-2",
        payload: { displayName: "Marek", relationshipCircle: "unknown" },
      }),
    ).toBeNull();
  });
});
