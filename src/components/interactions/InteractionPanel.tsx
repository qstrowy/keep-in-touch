import { useEffect, useState, type SyntheticEvent } from "react";

import {
  MAX_INTERACTION_NOTE_LENGTH,
  createInteractionRecord,
  interactionFromRecord,
  localDateString,
  sortInteractionsNewestFirst,
  type Interaction,
  type InteractionFieldErrors,
  type InteractionFormInput,
  validateInteractionInput,
} from "@/lib/interactions/interaction";
import { createRelationshipVault } from "@/lib/relationship-data/local-vault";

interface InteractionPanelProps {
  ownerId: string;
  personId: string;
  onInteractionSaved?: (interaction: Interaction) => void;
}

function initialForm(): InteractionFormInput {
  return { occurredOn: localDateString(new Date()), note: "" };
}

export default function InteractionPanel({ ownerId, personId, onInteractionSaved }: InteractionPanelProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [form, setForm] = useState<InteractionFormInput>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<InteractionFieldErrors>({});
  const [storageError, setStorageError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const today = localDateString(new Date());

  useEffect(() => {
    let isActive = true;
    async function loadInteractions() {
      try {
        const vault = createRelationshipVault(ownerId);
        const records = await vault.listByParent({ collection: "people", id: personId });
        if (!isActive) return;
        setInteractions(
          sortInteractionsNewestFirst(
            records.map(interactionFromRecord).filter((item): item is Interaction => item !== null),
          ),
        );
      } catch {
        if (!isActive) return;
        setStorageError("Your private browser storage is unavailable. Please try again.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    }
    void loadInteractions();
    return () => {
      isActive = false;
    };
  }, [ownerId, personId]);

  function updateForm<Field extends keyof InteractionFormInput>(field: Field, value: InteractionFormInput[Field]) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setStorageError(null);
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateInteractionInput(form, today);
    if (!validation.interaction) {
      setFieldErrors(validation.errors);
      return;
    }
    setIsSaving(true);
    setStorageError(null);
    try {
      const id = globalThis.crypto.randomUUID();
      const vault = createRelationshipVault(ownerId);
      await vault.put(createInteractionRecord(validation.interaction, id, personId, Date.now()));
      const saved = await vault.get("interactions", id);
      const interaction = saved ? interactionFromRecord(saved) : null;
      if (!interaction) throw new Error("Saved interaction could not be read.");
      setInteractions((current) => sortInteractionsNewestFirst([...current, interaction]));
      onInteractionSaved?.(interaction);
      setForm(initialForm());
    } catch {
      setStorageError(
        "We could not save this interaction to private browser storage. Your entries are still here; please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section
      className="rounded-3xl border border-cyan-100/15 bg-gradient-to-br from-cyan-400/[0.08] via-slate-950/45 to-blue-500/[0.04] p-5 shadow-xl shadow-cyan-950/15 sm:p-6"
      aria-labelledby="interactions-heading"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-2xl border border-cyan-100/15 bg-cyan-200/10 text-lg text-cyan-100"
        >
          ◷
        </span>
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-cyan-100/65 uppercase">The moments in between</p>
          <h3 className="mt-1 text-xl font-semibold" id="interactions-heading">
            Interactions
          </h3>
          <p className="mt-1 text-sm leading-5 text-blue-100/65">
            Keep a dated note close to the conversation it came from.
          </p>
        </div>
      </div>
      <form
        className="mt-5 space-y-4 rounded-2xl border border-white/10 bg-slate-950/25 p-4"
        noValidate
        onSubmit={handleSubmit}
      >
        <div>
          <label className="block text-sm font-medium" htmlFor="interaction-date">
            Date
          </label>
          <input
            aria-describedby={fieldErrors.occurredOn ? "interaction-date-error" : undefined}
            aria-invalid={Boolean(fieldErrors.occurredOn)}
            className="mt-2 w-full rounded-xl border border-white/15 bg-slate-950/50 px-3 py-2.5 text-white focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none"
            disabled={isSaving}
            id="interaction-date"
            max={today}
            onChange={(event) => {
              updateForm("occurredOn", event.target.value);
            }}
            type="date"
            value={form.occurredOn}
          />
          {fieldErrors.occurredOn && (
            <p className="mt-2 text-sm text-red-200" id="interaction-date-error">
              {fieldErrors.occurredOn}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="interaction-note">
            Note
          </label>
          <textarea
            aria-describedby={fieldErrors.note ? "interaction-note-error" : undefined}
            aria-invalid={Boolean(fieldErrors.note)}
            className="mt-2 min-h-28 w-full rounded-xl border border-white/15 bg-slate-950/50 px-3 py-2.5 text-white focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none"
            disabled={isSaving}
            id="interaction-note"
            maxLength={MAX_INTERACTION_NOTE_LENGTH}
            onChange={(event) => {
              updateForm("note", event.target.value);
            }}
            value={form.note}
          />
          {fieldErrors.note && (
            <p className="mt-2 text-sm text-red-200" id="interaction-note-error">
              {fieldErrors.note}
            </p>
          )}
        </div>
        {storageError && (
          <p className="rounded-lg border border-red-200/40 bg-red-950/30 p-3 text-sm text-red-100" role="alert">
            {storageError}
          </p>
        )}
        <button
          className="rounded-xl bg-gradient-to-r from-cyan-100 to-blue-200 px-4 py-2.5 font-semibold text-slate-950 transition-colors hover:from-white hover:to-blue-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? "Saving interaction…" : "Save interaction"}
        </button>
      </form>
      {isLoading ? (
        <p
          className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-blue-100/75"
          role="status"
        >
          Loading interactions…
        </p>
      ) : interactions.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-sm leading-6 text-blue-100/65">
          No interactions saved yet. A few remembered details can make a future catch-up feel more natural.
        </p>
      ) : (
        <ol className="mt-5 space-y-3">
          {interactions.map((interaction) => (
            <li className="relative rounded-xl border border-white/10 bg-slate-950/25 p-4" key={interaction.id}>
              <p className="text-xs font-semibold tracking-wide text-cyan-100/75">{interaction.occurredOn}</p>
              <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-blue-50/90">{interaction.note}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
