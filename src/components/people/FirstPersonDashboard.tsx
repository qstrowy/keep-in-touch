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

type ScreenState = "loading" | "form" | "saving" | "list" | "summary" | "deleting";
type FormMode = "create" | "edit";

export default function FirstPersonDashboard({ ownerId }: FirstPersonDashboardProps) {
  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [form, setForm] = useState<PersonFormInput>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<PersonFieldErrors>({});
  const [storageError, setStorageError] = useState<string | null>(null);
  const [isDeleteConfirmationVisible, setIsDeleteConfirmationVisible] = useState(false);

  const selectedPerson = people.find((person) => person.id === selectedPersonId) ?? null;

  useEffect(() => {
    let isActive = true;

    async function loadPeople() {
      try {
        const vault = createRelationshipVault(ownerId);
        const records = await vault.listByCollection(PEOPLE_COLLECTION);
        const savedPeople = records.map(personFromRecord).filter((person): person is Person => person !== null);

        if (!isActive) {
          return;
        }

        setPeople(savedPeople);
        setSelectedPersonId(savedPeople[0]?.id ?? null);
        setScreenState(savedPeople.length > 0 ? "summary" : "form");
      } catch {
        if (!isActive) {
          return;
        }

        setStorageError("Your private browser storage is unavailable. Please try again.");
        setScreenState("form");
      }
    }

    void loadPeople();

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

  function startCreatingPerson() {
    setFormMode("create");
    setForm(INITIAL_FORM);
    setFieldErrors({});
    setStorageError(null);
    setScreenState("form");
  }

  function startEditingPerson() {
    if (!selectedPerson) {
      return;
    }

    setFormMode("edit");
    setForm(personToFormInput(selectedPerson));
    setFieldErrors({});
    setStorageError(null);
    setScreenState("form");
  }

  function selectPerson(personId: string) {
    setSelectedPersonId(personId);
    setFieldErrors({});
    setStorageError(null);
    setScreenState("summary");
  }

  function cancelForm() {
    setForm(INITIAL_FORM);
    setFieldErrors({});
    setStorageError(null);
    setScreenState(selectedPerson ? "summary" : "form");
  }

  function showDeleteConfirmation() {
    setStorageError(null);
    setIsDeleteConfirmationVisible(true);
  }

  function cancelDeleteConfirmation() {
    setStorageError(null);
    setIsDeleteConfirmationVisible(false);
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validatePersonInput(form);
    if (!validation.person) {
      setFieldErrors(validation.errors);
      return;
    }

    const personId = formMode === "edit" && selectedPerson ? selectedPerson.id : globalThis.crypto.randomUUID();

    setScreenState("saving");
    setStorageError(null);

    try {
      const vault = createRelationshipVault(ownerId);
      const record = createPersonRecord(validation.person, personId);
      await vault.put(record);

      const savedRecord = await vault.get(PEOPLE_COLLECTION, personId);
      const savedPerson = savedRecord ? personFromRecord(savedRecord) : null;
      if (!savedPerson) {
        throw new Error("The saved person could not be read from private browser storage.");
      }

      setPeople((current) => {
        const existingIndex = current.findIndex((person) => person.id === savedPerson.id);
        if (existingIndex === -1) {
          return [...current, savedPerson];
        }

        return current.map((person) => (person.id === savedPerson.id ? savedPerson : person));
      });
      setSelectedPersonId(savedPerson.id);
      setForm(INITIAL_FORM);
      setFieldErrors({});
      setScreenState("summary");
    } catch {
      setStorageError(
        "We could not save this person to private browser storage. Your entries are still here; please try again.",
      );
      setScreenState("form");
    }
  }

  async function handleDelete() {
    if (!selectedPerson) {
      return;
    }

    const personId = selectedPerson.id;
    setScreenState("deleting");
    setStorageError(null);

    try {
      const vault = createRelationshipVault(ownerId);
      await vault.deleteCascade({ collection: PEOPLE_COLLECTION, id: personId });

      const remainingPeople = people.filter((person) => person.id !== personId);
      setPeople(remainingPeople);
      setSelectedPersonId(null);
      setIsDeleteConfirmationVisible(false);

      if (remainingPeople.length > 0) {
        setScreenState("list");
        return;
      }

      setFormMode("create");
      setForm(INITIAL_FORM);
      setScreenState("form");
    } catch {
      setStorageError(
        "We could not delete this person from private browser storage. Nothing was removed; please try again.",
      );
      setScreenState("summary");
    }
  }

  if (screenState === "loading") {
    return <p role="status">Loading your private people…</p>;
  }

  const isSaving = screenState === "saving";
  const isDeleting = screenState === "deleting";
  const isInteractionLocked = isSaving || isDeleting || isDeleteConfirmationVisible;

  return (
    <div className="space-y-8">
      {people.length > 0 && (
        <section aria-labelledby="people-list-heading">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold" id="people-list-heading">
              Saved people
            </h2>
            <button
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isInteractionLocked}
              onClick={startCreatingPerson}
              type="button"
            >
              Add person
            </button>
          </div>
          <ul className="mt-3 flex flex-wrap gap-2">
            {people.map((person) => (
              <li key={person.id}>
                <button
                  aria-pressed={person.id === selectedPersonId && screenState === "summary"}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60 aria-pressed:border-blue-200 aria-pressed:bg-blue-200 aria-pressed:text-slate-950"
                  disabled={isInteractionLocked}
                  onClick={() => {
                    selectPerson(person.id);
                  }}
                  type="button"
                >
                  {person.displayName}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {screenState === "list" ? (
        <p className="text-sm text-blue-100/75" role="status">
          Choose a person to view their saved details.
        </p>
      ) : selectedPerson && (screenState === "summary" || screenState === "deleting") ? (
        <PersonSummary
          isDeleteConfirmationVisible={isDeleteConfirmationVisible}
          isDeleting={isDeleting}
          onCancelDelete={cancelDeleteConfirmation}
          onDelete={handleDelete}
          onEdit={startEditingPerson}
          onShowDeleteConfirmation={showDeleteConfirmation}
          person={selectedPerson}
          storageError={storageError}
        />
      ) : (
        <PersonForm
          fieldErrors={fieldErrors}
          form={form}
          formMode={formMode}
          hasSavedPeople={people.length > 0}
          isSaving={isSaving}
          onCancel={cancelForm}
          onSubmit={handleSubmit}
          onUpdate={updateForm}
          storageError={storageError}
        />
      )}
    </div>
  );
}

interface PersonFormProps {
  fieldErrors: PersonFieldErrors;
  form: PersonFormInput;
  formMode: FormMode;
  hasSavedPeople: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (event: SyntheticEvent<HTMLFormElement>) => Promise<void>;
  onUpdate: <Field extends keyof PersonFormInput>(field: Field, value: PersonFormInput[Field]) => void;
  storageError: string | null;
}

function PersonForm({
  fieldErrors,
  form,
  formMode,
  hasSavedPeople,
  isSaving,
  onCancel,
  onSubmit,
  onUpdate,
  storageError,
}: PersonFormProps) {
  const isEditing = formMode === "edit";
  const heading = isEditing
    ? `Edit ${form.displayName || "person"}`
    : hasSavedPeople
      ? "Add another person"
      : "Add the first person you want to keep in touch with";

  return (
    <section aria-labelledby="person-form-heading">
      <h2 id="person-form-heading" className="text-2xl font-semibold">
        {heading}
      </h2>
      <p className="mt-2 text-sm text-blue-100/75">This information is stored only in this browser.</p>

      <form className="mt-6 space-y-5" noValidate onSubmit={onSubmit}>
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
              onUpdate("displayName", event.target.value);
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
              onUpdate("relationshipCircle", event.target.value);
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
              aria-label="Birthday month"
              className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-white"
              disabled={isSaving}
              onChange={(event) => {
                onUpdate("birthdayMonth", event.target.value);
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
              aria-label="Birthday day"
              className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-white"
              disabled={isSaving}
              onChange={(event) => {
                onUpdate("birthdayDay", event.target.value);
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

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {hasSavedPeople && (
            <button
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 font-semibold transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              onClick={onCancel}
              type="button"
            >
              Cancel
            </button>
          )}
          <button
            className="rounded-lg bg-blue-200 px-4 py-2 font-semibold text-slate-950 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-40"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? "Saving person…" : isEditing ? "Save changes" : "Save person"}
          </button>
        </div>
      </form>
    </section>
  );
}

interface PersonSummaryProps {
  isDeleteConfirmationVisible: boolean;
  isDeleting: boolean;
  onCancelDelete: () => void;
  onDelete: () => Promise<void>;
  onEdit: () => void;
  onShowDeleteConfirmation: () => void;
  person: Person;
  storageError: string | null;
}

function PersonSummary({
  isDeleteConfirmationVisible,
  isDeleting,
  onCancelDelete,
  onDelete,
  onEdit,
  onShowDeleteConfirmation,
  person,
  storageError,
}: PersonSummaryProps) {
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
      {isDeleteConfirmationVisible ? (
        <section
          className="mt-6 rounded-lg border border-red-200/40 bg-red-950/30 p-4"
          aria-labelledby="delete-person-heading"
        >
          <h3 className="font-semibold" id="delete-person-heading">
            Delete {person.displayName} permanently?
          </h3>
          <p className="mt-2 text-sm text-red-100">
            This permanently removes this person and any associated relationship data stored in this browser.
          </p>
          {storageError && (
            <p className="mt-3 text-sm text-red-100" role="alert">
              {storageError}
            </p>
          )}
          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isDeleting}
              onClick={onCancelDelete}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-lg bg-red-200 px-4 py-2 text-sm font-semibold text-red-950 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isDeleting}
              onClick={() => {
                void onDelete();
              }}
              type="button"
            >
              {isDeleting ? "Deleting person…" : "Delete permanently"}
            </button>
          </div>
        </section>
      ) : (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/20"
            onClick={onEdit}
            type="button"
          >
            Edit person
          </button>
          <button
            className="rounded-lg border border-red-200/50 bg-red-950/30 px-4 py-2 text-sm font-semibold text-red-100 transition-colors hover:bg-red-950/50"
            onClick={onShowDeleteConfirmation}
            type="button"
          >
            Delete person
          </button>
        </div>
      )}
    </section>
  );
}

function personToFormInput(person: Person): PersonFormInput {
  return {
    displayName: person.displayName,
    relationshipCircle: person.relationshipCircle,
    birthdayMonth: person.birthday ? String(person.birthday.month) : "",
    birthdayDay: person.birthday ? String(person.birthday.day) : "",
  };
}

function formatCircle(circle: string): string {
  return `${circle.slice(0, 1).toUpperCase()}${circle.slice(1)}`;
}
