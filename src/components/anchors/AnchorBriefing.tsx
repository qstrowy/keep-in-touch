import { useEffect, useState } from "react";

import {
  ANCHORS_COLLECTION,
  anchorFromRecord,
  createAnchorRecords,
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

  useEffect(() => {
    let isActive = true;

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
    };
  }, [ownerId, personId, refreshToken]);

  async function handleExtract() {
    if (state === "running" || interactions.length === 0) return;

    const combined = buildCombinedExtractionRequest(interactions);
    if (!combined) {
      setError("These notes are too large to process together. No note was sent.");
      setState("error");
      return;
    }

    setState("running");
    setError(null);

    const result = await requestExtraction(combined.note);
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
      );

      if (!replaced) {
        setError("The person or one of these notes changed before extraction finished. Try again.");
        setState("error");
        return;
      }

      setAnchors(replacementRecords.map(anchorFromRecord).filter((item): item is ConversationAnchor => item !== null));
      setState("ready");
    } catch {
      setError("We could not save the extracted anchors. Your existing briefing is unchanged. Try again.");
      setState("error");
    }
  }

  const isLoading = state === "loading";
  const isRunning = state === "running";
  const recentInteractions = getRecentInteractions(interactions);
  const groupedAnchors = groupAnchors(anchors);

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
            disabled={isLoading || isRunning || interactions.length === 0}
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

            {anchors.length === 0 && <p className="text-sm text-blue-100/75">No open anchors yet.</p>}
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
                        {groupAnchors.map((anchor) => (
                          <li key={anchor.id}>{anchor.text}</li>
                        ))}
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
