import { useEffect, useRef, useState } from "react";

import { ANCHORS_COLLECTION, coreTopicFromRecord, createCoreTopicRecords, type CoreTopic } from "@/lib/anchors/anchor";
import {
  getRecentInteractions,
  isExtractionSnapshotCurrent,
  orderCoreTopics,
  type ExtractionSnapshot,
} from "@/lib/anchors/briefing";
import { buildCombinedExtractionRequest, requestExtraction } from "@/lib/extraction/client";
import { interactionFromRecord, sortInteractionsNewestFirst, type Interaction } from "@/lib/interactions/interaction";
import { createRelationshipVault } from "@/lib/relationship-data/local-vault";

interface AnchorBriefingProps {
  ownerId: string;
  personId: string;
  refreshToken?: number;
}

type BriefingState = "loading" | "ready" | "running" | "error";

export default function AnchorBriefing({ ownerId, personId, refreshToken = 0 }: AnchorBriefingProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [topics, setTopics] = useState<CoreTopic[]>([]);
  const [state, setState] = useState<BriefingState>("loading");
  const [error, setError] = useState<string | null>(null);
  const extractionGeneration = useRef(0);
  const loadGeneration = useRef(0);

  useEffect(() => {
    extractionGeneration.current += 1;
    return () => {
      extractionGeneration.current += 1;
    };
  }, [ownerId, personId]);

  useEffect(() => {
    let isActive = true;
    const currentLoadGeneration = ++loadGeneration.current;
    async function loadBriefing() {
      setState("loading");
      setError(null);
      try {
        const vault = createRelationshipVault(ownerId);
        const records = await vault.listByParent({ collection: "people", id: personId });
        if (!isActive || loadGeneration.current !== currentLoadGeneration) return;
        setInteractions(
          sortInteractionsNewestFirst(
            records.map(interactionFromRecord).filter((item): item is Interaction => item !== null),
          ),
        );
        setTopics(orderCoreTopics(records.map(coreTopicFromRecord).filter((item): item is CoreTopic => item !== null)));
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
    const snapshot: ExtractionSnapshot = {
      personId,
      generation: extractionGeneration.current,
      sourceInteractionIds: combined.sourceInteractionIds,
    };
    const result = await requestExtraction(combined.note);
    if (!isExtractionSnapshotCurrent(snapshot, { personId, generation: extractionGeneration.current })) return;
    if (!result.ok) {
      setError(
        result.error === "too_large"
          ? "These notes are too large to process together. No note was sent."
          : "We could not extract Core Topics. Your existing briefing is unchanged. Try again.",
      );
      setState("error");
      return;
    }
    try {
      const vault = createRelationshipVault(ownerId);
      const replacementRecords = createCoreTopicRecords(
        personId,
        combined.sourceInteractionIds,
        result.response.topics,
      );
      const replaced = await vault.replaceChildrenIfSourcesExist(
        { collection: "people", id: personId },
        combined.sourceInteractionIds.map((id) => ({ collection: "interactions", id })),
        ANCHORS_COLLECTION,
        replacementRecords,
      );
      if (!isExtractionSnapshotCurrent(snapshot, { personId, generation: extractionGeneration.current })) return;
      if (!replaced) {
        setError("The person or one of these notes changed before extraction finished. Try again.");
        setState("error");
        return;
      }
      const records = await vault.listByParent({ collection: "people", id: personId });
      setTopics(orderCoreTopics(records.map(coreTopicFromRecord).filter((item): item is CoreTopic => item !== null)));
      setState("ready");
    } catch {
      setError("We could not save the extracted Core Topics. Your existing briefing is unchanged. Try again.");
      setState("error");
    }
  }

  const isLoading = state === "loading";
  const isRunning = state === "running";
  const recentInteractions = getRecentInteractions(interactions);

  return (
    <section className="mt-8 border-t border-white/10 pt-6" aria-labelledby="core-topics-heading">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-xl font-semibold" id="core-topics-heading">
            Core Topics
          </h3>
          <p className="mt-1 text-sm text-blue-100/75">
            {interactions[0] ? `Last contact: ${interactions[0].occurredOn}` : "No interactions saved yet."}
          </p>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-sm text-blue-100/80">
            <p className="font-medium text-white">Generate Core Topics</p>
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
            {isRunning ? "Generating Core Topics…" : "Generate Core Topics"}
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
            Loading Core Topics…
          </p>
        ) : (
          <>
            <div>
              <h4 className="text-sm font-semibold tracking-wide text-blue-100/75 uppercase">Recent context</h4>
              {recentInteractions.length === 0 ? (
                <p className="mt-2 text-sm text-blue-100/75">Save an interaction to generate Core Topics.</p>
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
            {topics.length === 0 ? (
              <p className="text-sm text-blue-100/75">No Core Topics yet.</p>
            ) : (
              <ol className="space-y-3">
                {topics.map((topic) => (
                  <li className="rounded-lg border border-white/10 bg-white/5 p-4" key={topic.id}>
                    <details>
                      <summary className="cursor-pointer font-semibold">{topic.text}</summary>
                      {topic.questions.length > 0 && (
                        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-blue-100/80">
                          {topic.questions.map((question, index) => (
                            <li key={`${topic.id}-${index}`}>{question}</li>
                          ))}
                        </ul>
                      )}
                    </details>
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </div>
    </section>
  );
}
