import { useEffect, useState, type SyntheticEvent } from "react";

import {
  PEOPLE_COLLECTION,
  RELATIONSHIP_CIRCLES,
  createPersonRecord,
  personFromRecord,
  type Person,
  type PersonFieldErrors,
  type PersonFormInput,
  validatePersonInput,
} from "@/lib/people/person";
import { createRelationshipVault } from "@/lib/relationship-data/local-vault";

interface FirstPersonDashboardProps {
  ownerId: string;
}

const INITIAL_FORM: PersonFormInput = {
  displayName: "",
  relationshipCircle: "",
  birthdayMonth: "",
  birthdayDay: "",
};

type ScreenState = "loading" | "form" | "saving" | "summary";

export default function FirstPersonDashboard({ ownerId }: FirstPersonDashboardProps) {
  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [person, setPerson] = useState<Person | null>(null);
  const [form, setForm] = useState<PersonFormInput>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<PersonFieldErrors>({});
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadPerson() {
      try {
        const vault = createRelationshipVault(ownerId);
        const records = await vault.listByCollection(PEOPLE_COLLECTION);
        const savedPerson = records.map(personFromRecord).find((record): record is Person => record !== null) ?? null;

        if (!isActive) {
          return;
        }

        setPerson(savedPerson);
        setScreenState(savedPerson ? "summary" : "form");
      } catch {
        if (!isActive) {
          return;
        }

        setStorageError("Your private browser storage is unavailable. Please try again.");
        setScreenState("form");
      }
    }

    void loadPerson();

    return () => {
      isActive = false;
    };
  }, [ownerId]);

  function updateForm<Field extends keyof PersonFormInput>(field: Field, value: PersonFormInput[Field]) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({
      ...current,
      [field === "birthdayMonth" || field === "birthdayDay" ? "birthday" : field]: undefined,
    }));
    setStorageError(null);
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validatePersonInput(form);
    if (!validation.person) {
      setFieldErrors(validation.errors);
      return;
    }

    setScreenState("saving");
    setStorageError(null);

    try {
      const vault = createRelationshipVault(ownerId);
      const id = globalThis.crypto.randomUUID();
      const record = createPersonRecord(validation.person, id);
      await vault.put(record);

      const savedRecord = await vault.get(PEOPLE_COLLECTION, id);
      const savedPerson = savedRecord ? personFromRecord(savedRecord) : null;
      if (!savedPerson) {
        throw new Error("The saved person could not be read from private browser storage.");
      }

      setPerson(savedPerson);
      setScreenState("summary");
    } catch {
      setStorageError(
        "We could not save this person to private browser storage. Your entries are still here; please try again.",
      );
      setScreenState("form");
    }
  }

  if (screenState === "loading") {
    return <p role="status">Loading your private people…</p>;
  }

  if (person) {
    return <PersonSummary person={person} />;
  }

  const isSaving = screenState === "saving";

  return (
    <section aria-labelledby="first-person-heading">
      <h2 id="first-person-heading" className="text-2xl font-semibold">
        Add the first person you want to keep in touch with
      </h2>
      <p className="mt-2 text-sm text-blue-100/75">This information is stored only in this browser.</p>

      <form className="mt-6 space-y-5" noValidate onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium" htmlFor="person-display-name">
            Name
          </label>
          <input
            aria-describedby={fieldErrors.displayName ? "person-display-name-error" : undefined}
            aria-invalid={Boolean(fieldErrors.displayName)}
            className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-blue-100/45"
            disabled={isSaving}
            id="person-display-name"
            onChange={(event) => {
              updateForm("displayName", event.target.value);
            }}
            placeholder="For example, Marta"
            type="text"
            value={form.displayName}
          />
          {fieldErrors.displayName && (
            <p className="mt-2 text-sm text-red-200" id="person-display-name-error">
              {fieldErrors.displayName}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium" htmlFor="person-relationship-circle">
            Relationship circle
          </label>
          <select
            aria-describedby={fieldErrors.relationshipCircle ? "person-relationship-circle-error" : undefined}
            aria-invalid={Boolean(fieldErrors.relationshipCircle)}
            className="mt-2 w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-white"
            disabled={isSaving}
            id="person-relationship-circle"
            onChange={(event) => {
              updateForm("relationshipCircle", event.target.value);
            }}
            value={form.relationshipCircle}
          >
            <option value="">Choose one</option>
            {RELATIONSHIP_CIRCLES.map((circle) => (
              <option key={circle} value={circle}>
                {formatCircle(circle)}
              </option>
            ))}
          </select>
          {fieldErrors.relationshipCircle && (
            <p className="mt-2 text-sm text-red-200" id="person-relationship-circle-error">
              {fieldErrors.relationshipCircle}
            </p>
          )}
        </div>

        <fieldset>
          <legend className="text-sm font-medium">
            Birthday <span className="text-blue-100/65">(optional)</span>
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <select
              aria-describedby={fieldErrors.birthday ? "person-birthday-error" : undefined}
              aria-invalid={Boolean(fieldErrors.birthday)}
              className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-white"
              disabled={isSaving}
              onChange={(event) => {
                updateForm("birthdayMonth", event.target.value);
              }}
              value={form.birthdayMonth}
            >
              <option value="">Month</option>
              {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
            <select
              aria-describedby={fieldErrors.birthday ? "person-birthday-error" : undefined}
              aria-invalid={Boolean(fieldErrors.birthday)}
              className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-white"
              disabled={isSaving}
              onChange={(event) => {
                updateForm("birthdayDay", event.target.value);
              }}
              value={form.birthdayDay}
            >
              <option value="">Day</option>
              {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>
          {fieldErrors.birthday && (
            <p className="mt-2 text-sm text-red-200" id="person-birthday-error">
              {fieldErrors.birthday}
            </p>
          )}
        </fieldset>

        {storageError && (
          <p className="rounded-lg border border-red-200/40 bg-red-950/30 p-3 text-sm text-red-100" role="alert">
            {storageError}
          </p>
        )}

        <button
          className="w-full rounded-lg bg-blue-200 px-4 py-2 font-semibold text-slate-950 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? "Saving person…" : "Save person"}
        </button>
      </form>
    </section>
  );
}

function PersonSummary({ person }: { person: Person }) {
  return (
    <section aria-labelledby="saved-person-heading">
      <p className="text-sm font-medium text-blue-100/75">Saved privately in this browser</p>
      <h2 className="mt-2 text-3xl font-semibold" id="saved-person-heading">
        {person.displayName}
      </h2>
      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
          <dt className="text-blue-100/75">Relationship circle</dt>
          <dd className="font-medium">{formatCircle(person.relationshipCircle)}</dd>
        </div>
        {person.birthday && (
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
            <dt className="text-blue-100/75">Birthday</dt>
            <dd className="font-medium">
              {person.birthday.month}/{person.birthday.day}
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}

function formatCircle(circle: string): string {
  return `${circle.slice(0, 1).toUpperCase()}${circle.slice(1)}`;
}
