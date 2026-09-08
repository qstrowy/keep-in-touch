import type { RelationshipRecord } from "@/lib/relationship-data/types";

export const PEOPLE_COLLECTION = "people";

export const RELATIONSHIP_CIRCLES = ["family", "friend", "professional", "other"] as const;

export type RelationshipCircle = (typeof RELATIONSHIP_CIRCLES)[number];

export interface PersonBirthday {
  month: number;
  day: number;
}

export interface Person {
  id: string;
  displayName: string;
  relationshipCircle: RelationshipCircle;
  birthday?: PersonBirthday;
}

export interface PersonFormInput {
  displayName: string;
  relationshipCircle: string;
  birthdayMonth: string;
  birthdayDay: string;
}

export interface PersonFieldErrors {
  displayName?: string;
  relationshipCircle?: string;
  birthday?: string;
}

export interface PersonValidationResult {
  person: Omit<Person, "id"> | null;
  errors: PersonFieldErrors;
}

export function validatePersonInput(input: PersonFormInput): PersonValidationResult {
  const errors: PersonFieldErrors = {};
  const displayName = input.displayName.trim();
  const relationshipCircle = parseRelationshipCircle(input.relationshipCircle);
  const birthday = parseBirthday(input.birthdayMonth, input.birthdayDay);

  if (!displayName) {
    errors.displayName = "Enter a name.";
  }
  if (!relationshipCircle) {
    errors.relationshipCircle = "Choose a relationship circle.";
  }
  if (birthday === "invalid") {
    errors.birthday = "Choose a valid month and day.";
  }

  if (Object.keys(errors).length > 0 || !relationshipCircle || birthday === "invalid") {
    return { person: null, errors };
  }

  return {
    person: {
      displayName,
      relationshipCircle,
      ...(birthday ? { birthday } : {}),
    },
    errors,
  };
}

export function createPersonRecord(person: Omit<Person, "id">, id: string): RelationshipRecord {
  const normalizedId = id.trim();
  if (!normalizedId) {
    throw new Error("A person record ID is required.");
  }

  return {
    collection: PEOPLE_COLLECTION,
    id: normalizedId,
    payload: {
      displayName: person.displayName,
      relationshipCircle: person.relationshipCircle,
      ...(person.birthday ? { birthday: person.birthday } : {}),
    },
  };
}

export function personFromRecord(record: RelationshipRecord): Person | null {
  if (record.collection !== PEOPLE_COLLECTION || !record.id) {
    return null;
  }

  const payload = record.payload;
  const displayName = typeof payload.displayName === "string" ? payload.displayName.trim() : "";
  const relationshipCircle =
    typeof payload.relationshipCircle === "string" ? parseRelationshipCircle(payload.relationshipCircle) : null;
  const birthday = parseStoredBirthday(payload.birthday);

  if (!displayName || !relationshipCircle || birthday === "invalid") {
    return null;
  }

  return {
    id: record.id,
    displayName,
    relationshipCircle,
    ...(birthday ? { birthday } : {}),
  };
}

function parseRelationshipCircle(value: string): RelationshipCircle | null {
  return RELATIONSHIP_CIRCLES.includes(value as RelationshipCircle) ? (value as RelationshipCircle) : null;
}

function parseBirthday(monthValue: string, dayValue: string): PersonBirthday | "invalid" | null {
  if (!monthValue && !dayValue) {
    return null;
  }
  if (!monthValue || !dayValue) {
    return "invalid";
  }

  const month = Number(monthValue);
  const day = Number(dayValue);
  return isValidBirthday(month, day) ? { month, day } : "invalid";
}

function parseStoredBirthday(value: unknown): PersonBirthday | "invalid" | null {
  if (value === undefined) {
    return null;
  }
  if (!isRecord(value) || typeof value.month !== "number" || typeof value.day !== "number") {
    return "invalid";
  }

  return isValidBirthday(value.month, value.day) ? { month: value.month, day: value.day } : "invalid";
}

function isValidBirthday(month: number, day: number): boolean {
  return (
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth(month)
  );
}

function daysInMonth(month: number): number {
  return new Date(2000, month, 0).getDate();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
