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
import InteractionPanel from "@/components/interactions/InteractionPanel";
import AnchorBriefing from "@/components/anchors/AnchorBriefing";
import type { Interaction } from "@/lib/interactions/interaction";

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
  const [interactionRevision, setInteractionRevision] = useState(0);

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

  const hasSavedPeople = people.length > 0;

  return (
    <div className={hasSavedPeople ? "grid items-start gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]" : "space-y-6"}>
      {hasSavedPeople && (
        <aside className="rounded-3xl border border-white/10 bg-slate-950/35 p-4 shadow-xl shadow-blue-950/20 backdrop-blur sm:p-5">
          <section aria-labelledby="people-list-heading">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-blue-200/65 uppercase">Your circle</p>
                <h2 className="mt-1 text-lg font-semibold" id="people-list-heading">
                  People
                </h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-blue-100/70">
                {people.length}
              </span>
            </div>
            <button
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200/20 bg-blue-200/10 px-3 py-2.5 text-sm font-semibold text-blue-50 transition-colors hover:border-blue-200/40 hover:bg-blue-200/15 focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isInteractionLocked}
              onClick={startCreatingPerson}
              type="button"
            >
              <span aria-hidden="true" className="text-lg leading-none">
                +
              </span>
              Add person
            </button>
            <ul className="mt-4 space-y-2">
              {people.map((person) => (
                <li key={person.id}>
                  <button
                    aria-pressed={person.id === selectedPersonId && screenState === "summary"}
                    className="flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-left transition-colors hover:border-white/10 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 aria-pressed:border-blue-200/30 aria-pressed:bg-gradient-to-r aria-pressed:from-blue-300/15 aria-pressed:to-purple-300/10"
                    disabled={isInteractionLocked}
                    onClick={() => {
                      selectPerson(person.id);
                    }}
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-10 shrink-0 place-items-center rounded-full border border-blue-100/15 bg-gradient-to-br from-blue-200/20 to-purple-300/20 text-sm font-semibold text-blue-50"
                    >
                      {person.displayName.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">{person.displayName}</span>
                      <span className="mt-0.5 block text-xs text-blue-100/60">
                        {formatCircle(person.relationshipCircle)}
                      </span>
                    </span>
                    <span aria-hidden="true" className="text-blue-100/40">
                      ›
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-blue-100/55">
            Your records stay here unless you choose Generate Core Topics, which sends note text for processing.
          </p>
        </aside>
      )}

      <div className="min-w-0">
        {screenState === "list" ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-blue-100/75" role="status">
            Choose a person to view their saved details.
          </div>
        ) : selectedPerson && (screenState === "summary" || screenState === "deleting") ? (
          <PersonSummary
            isDeleteConfirmationVisible={isDeleteConfirmationVisible}
            isDeleting={isDeleting}
            onCancelDelete={cancelDeleteConfirmation}
            onDelete={handleDelete}
            onEdit={startEditingPerson}
            onShowDeleteConfirmation={showDeleteConfirmation}
            ownerId={ownerId}
            person={selectedPerson}
            interactionRevision={interactionRevision}
            onInteractionSaved={() => {
              setInteractionRevision((current) => current + 1);
            }}
            storageError={storageError}
          />
        ) : (
          <PersonForm
            fieldErrors={fieldErrors}
            form={form}
            formMode={formMode}
            hasSavedPeople={hasSavedPeople}
            isSaving={isSaving}
            onCancel={cancelForm}
            onSubmit={handleSubmit}
            onUpdate={updateForm}
            storageError={storageError}
          />
        )}
      </div>
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
  const isFirstRun = !hasSavedPeople && !isEditing;

  return (
    <section
      aria-labelledby="person-form-heading"
      className={isFirstRun ? "grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.95fr)]" : ""}
    >
      {isFirstRun && (
        <section
          aria-labelledby="workflow-intro-heading"
          className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-slate-950/30 p-5 shadow-2xl shadow-blue-950/25 backdrop-blur sm:p-8"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -right-16 -z-10 size-64 rounded-full bg-purple-400/10 blur-3xl"
          ></div>
          <p className="text-xs font-semibold tracking-[0.2em] text-purple-200/80 uppercase">
            A little context goes a long way
          </p>
          <h2 id="workflow-intro-heading" className="mt-3 max-w-lg text-2xl leading-tight font-semibold sm:mt-4 sm:text-4xl">
            Stay close to the people who matter.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/70 sm:mt-4 sm:text-base">
            Keep the small details and shared moments you want to remember, then return to them when it is time to
            reconnect.
          </p>
          <ol className="mt-5 grid grid-cols-3 gap-2 xl:mt-8 xl:block xl:space-y-3">
            <li className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-2.5 sm:p-3 xl:flex-row xl:gap-4 xl:p-4">
              <span
                aria-hidden="true"
                className="grid size-7 shrink-0 place-items-center rounded-full bg-blue-200/10 text-xs font-semibold text-blue-100 xl:size-9 xl:text-sm"
              >
                01
              </span>
              <span>
                <span className="block text-xs leading-4 font-semibold text-white sm:text-sm">Add someone</span>
                <span className="mt-1 hidden text-sm leading-5 text-blue-100/65 xl:block">
                  Start with a person you want to keep in touch with.
                </span>
              </span>
            </li>
            <li className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-2.5 sm:p-3 xl:flex-row xl:gap-4 xl:p-4">
              <span
                aria-hidden="true"
                className="grid size-7 shrink-0 place-items-center rounded-full bg-purple-200/10 text-xs font-semibold text-purple-100 xl:size-9 xl:text-sm"
              >
                02
              </span>
              <span>
                <span className="block text-xs leading-4 font-semibold text-white sm:text-sm">Capture a moment</span>
                <span className="mt-1 hidden text-sm leading-5 text-blue-100/65 xl:block">
                  Save a dated note while the details are fresh.
                </span>
              </span>
            </li>
            <li className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-2.5 sm:p-3 xl:flex-row xl:gap-4 xl:p-4">
              <span
                aria-hidden="true"
                className="grid size-7 shrink-0 place-items-center rounded-full bg-cyan-200/10 text-xs font-semibold text-cyan-100 xl:size-9 xl:text-sm"
              >
                03
              </span>
              <span>
                <span className="block text-xs leading-4 font-semibold text-white sm:text-sm">Prepare to reconnect</span>
                <span className="mt-1 hidden text-sm leading-5 text-blue-100/65 xl:block">
                  Generate Core Topics when you are ready.
                </span>
              </span>
            </li>
          </ol>
        </section>
      )}

      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.09] to-white/[0.035] p-5 shadow-2xl shadow-blue-950/20 backdrop-blur sm:p-7">
        <p className="text-xs font-semibold tracking-[0.18em] text-blue-200/70 uppercase">
          {isEditing ? "Person details" : hasSavedPeople ? "Grow your circle" : "Your first step"}
        </p>
        <h2 id="person-form-heading" className="mt-2 text-2xl font-semibold">
          {heading}
        </h2>
        <p className="mt-2 text-sm leading-6 text-blue-100/70">This information is stored only in this browser.</p>

        <form className="mt-6 space-y-5" noValidate onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium" htmlFor="person-display-name">
              Name
            </label>
            <input
              aria-describedby={fieldErrors.displayName ? "person-display-name-error" : undefined}
              aria-invalid={Boolean(fieldErrors.displayName)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-slate-950/40 px-3 py-2.5 text-white transition-colors placeholder:text-blue-100/45 focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none"
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
              className="mt-2 w-full rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2.5 text-white focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none"
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
                className="rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2.5 text-white focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none"
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
                className="rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2.5 text-white focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none"
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
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 font-semibold transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSaving}
                onClick={onCancel}
                type="button"
              >
                Cancel
              </button>
            )}
            <button
              className="rounded-xl bg-gradient-to-r from-blue-200 to-purple-200 px-4 py-2.5 font-semibold text-slate-950 shadow-lg shadow-blue-950/20 transition-colors hover:from-blue-100 hover:to-purple-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-40"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? "Saving person…" : isEditing ? "Save changes" : "Save person"}
            </button>
          </div>
        </form>
      </div>
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
  ownerId: string;
  storageError: string | null;
  interactionRevision: number;
  onInteractionSaved: (interaction: Interaction) => void;
}

function PersonSummary({
  isDeleteConfirmationVisible,
  isDeleting,
  onCancelDelete,
  onDelete,
  onEdit,
  onShowDeleteConfirmation,
  ownerId,
  person,
  interactionRevision,
  onInteractionSaved,
  storageError,
}: PersonSummaryProps) {
  return (
    <div className="space-y-5">
      <section
        aria-labelledby="saved-person-heading"
        className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] via-slate-950/35 to-blue-500/[0.05] p-5 shadow-xl shadow-blue-950/20 backdrop-blur sm:p-6"
      >
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span
              aria-hidden="true"
              className="grid size-14 shrink-0 place-items-center rounded-2xl border border-blue-100/15 bg-gradient-to-br from-blue-200/20 to-purple-300/20 text-xl font-semibold text-white shadow-inner shadow-white/5"
            >
              {person.displayName.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.18em] text-blue-200/70 uppercase">
                Your relationship memory
              </p>
              <h2 className="mt-1 truncate text-3xl font-semibold" id="saved-person-heading">
                {person.displayName}
              </h2>
              <p className="mt-1 text-sm text-blue-100/60">Saved privately in this browser</p>
            </div>
          </div>
          {!isDeleteConfirmationVisible && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-blue-50 transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none"
                onClick={onEdit}
                type="button"
              >
                Edit person
              </button>
              <button
                className="rounded-xl border border-red-200/25 bg-red-950/20 px-4 py-2.5 text-sm font-semibold text-red-100 transition-colors hover:border-red-200/50 hover:bg-red-950/35 focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none"
                onClick={onShowDeleteConfirmation}
                type="button"
              >
                Delete person
              </button>
            </div>
          )}
        </header>
        <dl className="mt-5 flex flex-wrap gap-2 text-sm">
          <div className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
            <dt className="text-xs text-blue-100/55">Relationship circle</dt>
            <dd className="mt-0.5 font-medium text-blue-50">{formatCircle(person.relationshipCircle)}</dd>
          </div>
          {person.birthday && (
            <div className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
              <dt className="text-xs text-blue-100/55">Birthday</dt>
              <dd className="mt-0.5 font-medium text-blue-50">
                {person.birthday.month}/{person.birthday.day}
              </dd>
            </div>
          )}
        </dl>
        {isDeleteConfirmationVisible && (
          <section
            className="mt-5 rounded-2xl border border-red-200/25 bg-red-950/30 p-4"
            aria-labelledby="delete-person-heading"
          >
            <h3 className="font-semibold" id="delete-person-heading">
              Delete {person.displayName} permanently?
            </h3>
            <p className="mt-2 text-sm leading-6 text-red-100/85">
              This permanently removes this person and any associated relationship data stored in this browser.
            </p>
            {storageError && (
              <p className="mt-3 text-sm text-red-100" role="alert">
                {storageError}
              </p>
            )}
            <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isDeleting}
                onClick={onCancelDelete}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-xl bg-red-200 px-4 py-2.5 text-sm font-semibold text-red-950 transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
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
        )}
      </section>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <AnchorBriefing ownerId={ownerId} personId={person.id} refreshToken={interactionRevision} />
        <InteractionPanel ownerId={ownerId} personId={person.id} onInteractionSaved={onInteractionSaved} />
      </div>
    </div>
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
