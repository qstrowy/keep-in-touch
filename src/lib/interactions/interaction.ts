import { PEOPLE_COLLECTION } from "../people/person";
import type { RelationshipRecord } from "../relationship-data/types";

export const INTERACTIONS_COLLECTION = "interactions";
export const MAX_INTERACTION_NOTE_LENGTH = 5_000;

export interface Interaction {
  id: string;
  occurredOn: string;
  note: string;
  createdAt: number;
}

export interface InteractionFormInput {
  occurredOn: string;
  note: string;
}

export interface InteractionFieldErrors {
  occurredOn?: string;
  note?: string;
}

export interface InteractionValidationResult {
  interaction: Omit<Interaction, "id" | "createdAt"> | null;
  errors: InteractionFieldErrors;
}

export function validateInteractionInput(
  input: InteractionFormInput,
  today = localDateString(new Date()),
): InteractionValidationResult {
  const errors: InteractionFieldErrors = {};
  const occurredOn = parseLocalDate(input.occurredOn);
  const note = input.note.trim();

  if (!occurredOn || occurredOn > today) {
    errors.occurredOn = "Choose today or an earlier date.";
  }
  if (!note) {
    errors.note = "Enter a note.";
  } else if (note.length > MAX_INTERACTION_NOTE_LENGTH) {
    errors.note = `Keep the note to ${MAX_INTERACTION_NOTE_LENGTH} characters or fewer.`;
  }

  if (Object.keys(errors).length > 0 || !occurredOn) {
    return { interaction: null, errors };
  }

  return { interaction: { occurredOn, note }, errors };
}

export function createInteractionRecord(
  interaction: Omit<Interaction, "id" | "createdAt">,
  id: string,
  personId: string,
  createdAt: number,
): RelationshipRecord {
  const normalizedId = id.trim();
  const normalizedPersonId = personId.trim();
  if (!normalizedId || !normalizedPersonId || !Number.isFinite(createdAt)) {
    throw new Error("A valid interaction ID, person ID, and creation timestamp are required.");
  }

  return {
    collection: INTERACTIONS_COLLECTION,
    id: normalizedId,
    parent: { collection: PEOPLE_COLLECTION, id: normalizedPersonId },
    payload: { ...interaction, createdAt },
  };
}

export function interactionFromRecord(record: RelationshipRecord): Interaction | null {
  if (
    record.collection !== INTERACTIONS_COLLECTION ||
    !record.id ||
    record.parent?.collection !== PEOPLE_COLLECTION ||
    !record.parent.id
  ) {
    return null;
  }

  const occurredOn = typeof record.payload.occurredOn === "string" ? parseLocalDate(record.payload.occurredOn) : null;
  const note = typeof record.payload.note === "string" ? record.payload.note.trim() : "";
  const createdAt = record.payload.createdAt;
  if (!occurredOn || !note || note.length > MAX_INTERACTION_NOTE_LENGTH || !isValidCreatedAt(createdAt)) {
    return null;
  }

  return { id: record.id, occurredOn, note, createdAt };
}

export function sortInteractionsNewestFirst(interactions: Interaction[]): Interaction[] {
  return [...interactions].sort(
    (first, second) => second.occurredOn.localeCompare(first.occurredOn) || second.createdAt - first.createdAt,
  );
}

export function localDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseLocalDate(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || year < 1 || month < 1 || month > 12 || day < 1) {
    return null;
  }

  return day <= new Date(year, month, 0).getDate() ? value : null;
}

function isValidCreatedAt(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
