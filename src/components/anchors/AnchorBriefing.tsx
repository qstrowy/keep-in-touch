import { useEffect, useRef, useState } from "react";

import {
  ANCHORS_COLLECTION,
  anchorFromRecord,
  createAnchorRecords,
  hasSameOriginalCandidate,
  isManagedAnchorRecord,
  updateAnchorRecord,
  type AnchorKind,
  type ConversationAnchor,
} from "@/lib/anchors/anchor";
import { interactionFromRecord, sortInteractionsNewestFirst, type Interaction } from "@/lib/interactions/interaction";
import { requestExtraction, buildCombinedExtractionRequest } from "@/lib/extraction/client";
import { createRelationshipVault } from "@/lib/relationship-data/local-vault";
import { getRecentInteractions, groupAnchors } from "@/lib/anchors/briefing";

interface AnchorBriefingProps {
  ownerId: string;
  personId: string;
  refreshToken?: number;
}

type BriefingState = "loading" | "ready" | "running" | "error";
type AnchorAction = "edit" | "resolve" | "dismiss";

interface PendingAnchorAction {
  anchorId: string;
  action: AnchorAction;
}

const GROUPS: { kind: AnchorKind; label: string }[] = [
  { kind: "topic", label: "Topics" },
  { kind: "follow_up", label: "Follow-ups" },
  { kind: "proposed_interaction", label: "Suggested next steps" },
];

export default function AnchorBriefing({ ownerId, personId, refreshToken = 0 }: AnchorBriefingProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [anchors, setAnchors] = useState<ConversationAnchor[]>([]);
  const [state, setState] = useState<BriefingState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [editingAnchorId, setEditingAnchorId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingAnchorAction | null>(null);
  const [mutatingAnchorId, setMutatingAnchorId] = useState<string | null>(null);
  const extractionGeneration = useRef(0);

  useEffect(() => {
    let isActive = true;
    const generation = ++extractionGeneration.current;

    async function loadBriefing() {
      setState("loading");
      setError(null);
      try {
        const vault = createRelationshipVault(ownerId);
        const records = await vault.listByParent({ collection: "people", id: personId });
        const savedInteractions = sortInteractionsNewestFirst(
          records.map(interactionFromRecord).filter((item): item is Interaction => item !== null),
        );
        const savedAnchors = records.map(anchorFromRecord).filter((item): item is ConversationAnchor => item !== null);

        if (!isActive) return;
        setInteractions(savedInteractions);
        setAnchors(savedAnchors);
        setState("ready");
      } catch {
        if (!isActive) return;
        setError("Your private browser storage is unavailable. Please try again.");
        setState("error");
      }
    }

    void loadBriefing();
    return () => {
      isActive = false;
      if (extractionGeneration.current === generation) {
        extractionGeneration.current += 1;
      }
    };
  }, [ownerId, personId, refreshToken]);

  async function handleExtract() {
    if (state === "running" || mutatingAnchorId || interactions.length === 0) return;

    const combined = buildCombinedExtractionRequest(interactions);
    if (!combined) {
      setError("These notes are too large to process together. No note was sent.");
      setState("error");
      return;
    }

    setState("running");
    setError(null);
    const generation = extractionGeneration.current;

    const result = await requestExtraction(combined.note);
    if (generation !== extractionGeneration.current) {
      return;
    }
    if (!result.ok) {
      setError(
        result.error === "too_large"
          ? "These notes are too large to process together. No note was sent."
          : "We could not extract anchors. Your existing briefing is unchanged. Try again.",
      );
      setState("error");
      return;
    }

    try {
      const vault = createRelationshipVault(ownerId);
      const replacementRecords = createAnchorRecords(
        personId,
        combined.sourceInteractionIds,
        result.response.candidates,
      );
      const replaced = await vault.replaceChildrenIfSourcesExist(
        { collection: "people", id: personId },
        combined.sourceInteractionIds.map((id) => ({ collection: "interactions", id })),
        ANCHORS_COLLECTION,
        replacementRecords,
        {
          preserveChild: isManagedAnchorRecord,
          conflictsWithPreservedChild: hasSameOriginalCandidate,
        },
      );

      if (generation !== extractionGeneration.current) {
        return;
      }

      if (!replaced) {
        setError("The person or one of these notes changed before extraction finished. Try again.");
        setState("error");
        return;
      }

      const reconciledRecords = await vault.listByParent({ collection: "people", id: personId });
      setAnchors(reconciledRecords.map(anchorFromRecord).filter((item): item is ConversationAnchor => item !== null));
      setState("ready");
    } catch {
      setError("We could not save the extracted anchors. Your existing briefing is unchanged. Try again.");
      setState("error");
    }
  }

  function beginAnchorAction(anchor: ConversationAnchor, action: AnchorAction) {
    if (state === "running" || mutatingAnchorId) return;
    setError(null);
    if (action === "edit") {
      setEditingAnchorId(anchor.id);
      setEditDraft(anchor.text);
      setPendingConfirmation(null);
      return;
    }
    setPendingConfirmation({ anchorId: anchor.id, action });
    setEditingAnchorId(null);
  }

  async function persistAnchorAction(anchor: ConversationAnchor, action: AnchorAction, text?: string) {
    if (state === "running" || mutatingAnchorId) return;
    setMutatingAnchorId(anchor.id);
    setError(null);
    try {
      const vault = createRelationshipVault(ownerId);
      const record = updateAnchorRecord({
        anchor,
        personId,
        status: action === "resolve" ? "resolved" : action === "dismiss" ? "dismissed" : "open",
        text,
      });
      await vault.put(record);
      const updatedAnchor = anchorFromRecord(record);
      if (!updatedAnchor) {
        throw new Error("The updated anchor was invalid.");
      }
      setAnchors((current) => current.map((item) => (item.id === anchor.id ? updatedAnchor : item)));
      setEditingAnchorId(null);
      setPendingConfirmation(null);
    } catch {
      setError("We could not save that anchor change. Your briefing is unchanged. Try again.");
    } finally {
      setMutatingAnchorId(null);
    }
  }

  const isLoading = state === "loading";
  const isRunning = state === "running";
  const isMutating = mutatingAnchorId !== null;
  const recentInteractions = getRecentInteractions(interactions);
  const groupedAnchors = groupAnchors(anchors);
  const openAnchorCount = Object.values(groupedAnchors).reduce((count, group) => count + group.length, 0);

  return (
    <section className="mt-8 border-t border-white/10 pt-6" aria-labelledby="anchor-briefing-heading">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-xl font-semibold" id="anchor-briefing-heading">
            Briefing
          </h3>
          <p className="mt-1 text-sm text-blue-100/75">
            {interactions[0] ? `Last contact: ${interactions[0].occurredOn}` : "No interactions saved yet."}
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-sm text-blue-100/80">
            <p className="font-medium text-white">Extract conversation anchors</p>
            <p className="mt-1 max-w-xl">
              Saved note text will be sent to the configured processing service. Names, dates, and account data are not
              added by the app.
            </p>
          </div>
          <button
            className="shrink-0 rounded-lg bg-blue-200 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading || isRunning || isMutating || interactions.length === 0}
            onClick={() => {
              void handleExtract();
            }}
            type="button"
          >
            {isRunning ? "Extracting anchors…" : "Extract anchors"}
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200/40 bg-red-950/30 p-3 text-sm text-red-100" role="alert">
            <p>{error}</p>
            {interactions.length > 0 && !isRunning && (
              <button
                className="mt-2 font-semibold underline underline-offset-2"
                onClick={() => {
                  void handleExtract();
                }}
                type="button"
              >
                Try again
              </button>
            )}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-blue-100/75" role="status">
            Loading briefing…
          </p>
        ) : (
          <>
            <div>
              <h4 className="text-sm font-semibold tracking-wide text-blue-100/75 uppercase">Recent context</h4>
              {recentInteractions.length === 0 ? (
                <p className="mt-2 text-sm text-blue-100/75">Save an interaction to build this briefing.</p>
              ) : (
                <ol className="mt-3 space-y-3">
                  {recentInteractions.map((interaction) => (
                    <li className="rounded-lg border border-white/10 bg-white/5 p-3" key={interaction.id}>
                      <p className="text-xs text-blue-100/65">{interaction.occurredOn}</p>
                      <p className="mt-1 text-sm whitespace-pre-wrap">{interaction.note}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {openAnchorCount === 0 && <p className="text-sm text-blue-100/75">No open anchors yet.</p>}
            <div className="grid gap-4 md:grid-cols-3">
              {GROUPS.map((group) => {
                const groupAnchors = groupedAnchors[group.kind];
                return (
                  <section className="rounded-lg border border-white/10 bg-white/5 p-4" key={group.kind}>
                    <h4 className="font-semibold">{group.label}</h4>
                    {groupAnchors.length === 0 ? (
                      <p className="mt-2 text-sm text-blue-100/65">None yet</p>
                    ) : (
                      <ul className="mt-2 space-y-2 text-sm">
                        {groupAnchors.map((anchor) => {
                          const isEditing = editingAnchorId === anchor.id;
                          const confirmation =
                            pendingConfirmation?.anchorId === anchor.id ? pendingConfirmation.action : null;
                          const isThisAnchorBusy = mutatingAnchorId === anchor.id;
                          return (
                            <li className="rounded-md border border-white/10 p-3" key={anchor.id}>
                              {isEditing ? (
                                <div className="space-y-2">
                                  <label className="sr-only" htmlFor={`anchor-edit-${anchor.id}`}>
                                    Edit anchor
                                  </label>
                                  <textarea
                                    className="w-full rounded-md border border-white/20 bg-slate-950/40 p-2 text-sm text-white"
                                    disabled={isThisAnchorBusy || isRunning}
                                    id={`anchor-edit-${anchor.id}`}
                                    onChange={(event) => {
                                      setEditDraft(event.target.value);
                                    }}
                                    value={editDraft}
                                  />
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      className="rounded-md bg-blue-200 px-3 py-1 text-xs font-semibold text-slate-950 disabled:opacity-60"
                                      disabled={isThisAnchorBusy || isRunning}
                                      onClick={() => {
                                        void persistAnchorAction(anchor, "edit", editDraft);
                                      }}
                                      type="button"
                                    >
                                      Save
                                    </button>
                                    <button
                                      className="rounded-md border border-white/20 px-3 py-1 text-xs font-semibold disabled:opacity-60"
                                      disabled={isThisAnchorBusy}
                                      onClick={() => {
                                        setEditingAnchorId(null);
                                      }}
                                      type="button"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p>{anchor.text}</p>
                                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                    <button
                                      className="font-semibold underline underline-offset-2 disabled:opacity-60"
                                      disabled={isRunning || isMutating}
                                      onClick={() => {
                                        beginAnchorAction(anchor, "edit");
                                      }}
                                      type="button"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      className="font-semibold underline underline-offset-2 disabled:opacity-60"
                                      disabled={isRunning || isMutating}
                                      onClick={() => {
                                        beginAnchorAction(anchor, "resolve");
                                      }}
                                      type="button"
                                    >
                                      Resolve
                                    </button>
                                    <button
                                      className="font-semibold underline underline-offset-2 disabled:opacity-60"
                                      disabled={isRunning || isMutating}
                                      onClick={() => {
                                        beginAnchorAction(anchor, "dismiss");
                                      }}
                                      type="button"
                                    >
                                      Dismiss
                                    </button>
                                  </div>
                                </>
                              )}
                              {confirmation && (
                                <div className="mt-3 rounded-md border border-amber-200/30 bg-amber-950/20 p-2 text-xs">
                                  <p>
                                    {confirmation === "resolve"
                                      ? "Mark this anchor as resolved?"
                                      : "Dismiss this anchor from the briefing?"}
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <button
                                      className="rounded-md bg-blue-200 px-3 py-1 font-semibold text-slate-950 disabled:opacity-60"
                                      disabled={isThisAnchorBusy || isRunning}
                                      onClick={() => {
                                        void persistAnchorAction(anchor, confirmation);
                                      }}
                                      type="button"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      className="rounded-md border border-white/20 px-3 py-1 font-semibold disabled:opacity-60"
                                      disabled={isThisAnchorBusy}
                                      onClick={() => {
                                        setPendingConfirmation(null);
                                      }}
                                      type="button"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
