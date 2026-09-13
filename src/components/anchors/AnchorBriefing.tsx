import { useEffect, useRef, useState } from "react";

import {
  ANCHORS_COLLECTION,
  coreTopicFromRecord,
  createCoreTopicRecords,
  createEditedCoreTopicRecord,
  createTopicExclusionRecord,
  exclusionIdentityKey,
  isMarkedExclusionRecord,
  topicExclusionFromRecord,
  type CoreTopic,
} from "@/lib/anchors/anchor";
import {
  canStartCoreTopicExtraction,
  classifyBriefingRecords,
  isExtractionSnapshotCurrent,
  orderCoreTopics,
  prepareCoreTopicExtraction,
  type ExtractionSnapshot,
} from "@/lib/anchors/briefing";
import { requestExtraction } from "@/lib/extraction/client";
import { interactionFromRecord, sortInteractionsNewestFirst, type Interaction } from "@/lib/interactions/interaction";
import { createRelationshipVault } from "@/lib/relationship-data/local-vault";
import type { RelationshipRecord } from "@/lib/relationship-data/types";

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
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [mutationTopicId, setMutationTopicId] = useState<string | null>(null);
  const [pendingExclusionTopicId, setPendingExclusionTopicId] = useState<string | null>(null);
  const [excludedTopics, setExcludedTopics] = useState<string[]>([]);
  const [hasMalformedExclusion, setHasMalformedExclusion] = useState(false);
  const extractionGeneration = useRef(0);
  const loadGeneration = useRef(0);

  // These resets intentionally synchronize transient controls with a changed person selection.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    extractionGeneration.current += 1;
    setEditingTopicId(null);
    setEditText("");
    setMutationTopicId(null);
    setPendingExclusionTopicId(null);
    return () => {
      extractionGeneration.current += 1;
    };
  }, [ownerId, personId]);
  /* eslint-enable react-hooks/set-state-in-effect */

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
        const briefing = classifyBriefingRecords(records);
        setTopics(briefing.topics);
        setExcludedTopics(briefing.excludedTopics);
        setHasMalformedExclusion(briefing.hasMalformedExclusion);
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
    if (
      state === "running" ||
      interactions.length === 0 ||
      editingTopicId !== null ||
      mutationTopicId !== null ||
      pendingExclusionTopicId !== null
    )
      return;
    const preparation = prepareCoreTopicExtraction(interactions, excludedTopics, hasMalformedExclusion);
    if (!preparation.ok) {
      setError(
        preparation.error === "malformed_exclusion"
          ? "A saved exclusion is invalid. No note was sent. Try again after repairing local data."
          : "These notes are too large to process together. No note was sent.",
      );
      setState("error");
      return;
    }
    const combined = preparation.request;
    setState("running");
    setError(null);
    const snapshot: ExtractionSnapshot = {
      personId,
      generation: extractionGeneration.current,
      sourceInteractionIds: combined.sourceInteractionIds,
    };
    const result = await requestExtraction(combined.note, combined.excludedTopics);
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
        { preserveChild: isMarkedExclusionRecord },
      );
      if (!isExtractionSnapshotCurrent(snapshot, { personId, generation: extractionGeneration.current })) return;
      if (!replaced) {
        setError("The person or one of these notes changed before extraction finished. Try again.");
        setState("error");
        return;
      }
      const records = await vault.listByParent({ collection: "people", id: personId });
      const briefing = classifyBriefingRecords(records);
      setTopics(briefing.topics);
      setExcludedTopics(briefing.excludedTopics);
      setHasMalformedExclusion(briefing.hasMalformedExclusion);
      setState("ready");
    } catch {
      setError("We could not save the extracted Core Topics. Your existing briefing is unchanged. Try again.");
      setState("error");
    }
  }

  function topicRecord(topic: CoreTopic): RelationshipRecord {
    return {
      id: topic.id,
      collection: ANCHORS_COLLECTION,
      parent: { collection: "people", id: personId },
      payload: {
        text: topic.text,
        questions: topic.questions,
        position: topic.position,
        createdAt: topic.createdAt,
        sourceInteractionIds: topic.sourceInteractionIds,
      },
    };
  }

  function startEditing(topic: CoreTopic) {
    if (state === "running" || editingTopicId !== null || mutationTopicId !== null || pendingExclusionTopicId !== null)
      return;
    setError(null);
    setEditingTopicId(topic.id);
    setEditText(topic.text);
  }

  function cancelEditing() {
    if (mutationTopicId !== null) return;
    setEditingTopicId(null);
    setEditText("");
  }

  async function handleSaveEdit(topic: CoreTopic) {
    if (
      state === "running" ||
      mutationTopicId !== null ||
      pendingExclusionTopicId !== null ||
      editingTopicId !== topic.id
    )
      return;
    const replacementRecord = createEditedCoreTopicRecord(topicRecord(topic), personId, editText);
    if (!replacementRecord) {
      setError("Enter a Core Topic between 1 and 500 characters.");
      return;
    }

    const snapshot = { personId, generation: extractionGeneration.current };
    setMutationTopicId(topic.id);
    setError(null);
    try {
      const vault = createRelationshipVault(ownerId);
      const replaced = await vault.replaceChildIfParentExists(
        { collection: "people", id: personId },
        { collection: ANCHORS_COLLECTION, id: topic.id },
        replacementRecord,
      );
      if (!isExtractionSnapshotCurrent(snapshot, { personId, generation: extractionGeneration.current })) return;
      if (!replaced) {
        setError("We could not update this Core Topic. Your current briefing is unchanged. Try again.");
        return;
      }
      const updatedTopic = coreTopicFromRecord(replacementRecord);
      if (!updatedTopic) {
        setError("We could not update this Core Topic. Your current briefing is unchanged. Try again.");
        return;
      }
      setTopics((current) => orderCoreTopics(current.map((item) => (item.id === topic.id ? updatedTopic : item))));
      setEditingTopicId(null);
      setEditText("");
    } catch {
      if (isExtractionSnapshotCurrent(snapshot, { personId, generation: extractionGeneration.current })) {
        setError("We could not update this Core Topic. Your current briefing is unchanged. Try again.");
      }
    } finally {
      if (isExtractionSnapshotCurrent(snapshot, { personId, generation: extractionGeneration.current })) {
        setMutationTopicId(null);
      }
    }
  }

  async function handleHideTopic(topic: CoreTopic) {
    if (state === "running" || editingTopicId !== null || mutationTopicId !== null || pendingExclusionTopicId !== null)
      return;

    const snapshot = { personId, generation: extractionGeneration.current };
    setMutationTopicId(topic.id);
    setError(null);
    try {
      const vault = createRelationshipVault(ownerId);
      const removed = await vault.removeChildIfParentExists(
        { collection: "people", id: personId },
        { collection: ANCHORS_COLLECTION, id: topic.id },
      );
      if (!isExtractionSnapshotCurrent(snapshot, { personId, generation: extractionGeneration.current })) return;
      if (!removed) {
        setError("We could not hide this Core Topic. Your current briefing is unchanged. Try again.");
        return;
      }
      setTopics((current) => current.filter((item) => item.id !== topic.id));
    } catch {
      if (isExtractionSnapshotCurrent(snapshot, { personId, generation: extractionGeneration.current })) {
        setError("We could not hide this Core Topic. Your current briefing is unchanged. Try again.");
      }
    } finally {
      if (isExtractionSnapshotCurrent(snapshot, { personId, generation: extractionGeneration.current })) {
        setMutationTopicId(null);
      }
    }
  }

  function startExclusionConfirmation(topic: CoreTopic) {
    if (state === "running" || editingTopicId !== null || mutationTopicId !== null || pendingExclusionTopicId !== null)
      return;
    setError(null);
    setPendingExclusionTopicId(topic.id);
  }

  function cancelExclusionConfirmation() {
    if (mutationTopicId !== null) return;
    setPendingExclusionTopicId(null);
  }

  async function handleConfirmExclusion(topic: CoreTopic) {
    if (
      state === "running" ||
      editingTopicId !== null ||
      mutationTopicId !== null ||
      pendingExclusionTopicId !== topic.id
    )
      return;
    const replacementRecord = createTopicExclusionRecord(topicRecord(topic), personId);
    if (!replacementRecord) {
      setError("We could not exclude this Core Topic. Your current briefing is unchanged. Try again.");
      return;
    }

    const snapshot = { personId, generation: extractionGeneration.current };
    setMutationTopicId(topic.id);
    setError(null);
    try {
      const vault = createRelationshipVault(ownerId);
      const replaced = await vault.replaceChildIfParentExists(
        { collection: "people", id: personId },
        { collection: ANCHORS_COLLECTION, id: topic.id },
        replacementRecord,
        {
          conflictsWithSibling: (candidate, sibling) => {
            const candidateExclusion = topicExclusionFromRecord(candidate);
            const siblingExclusion = topicExclusionFromRecord(sibling);
            return Boolean(
              candidateExclusion &&
              siblingExclusion &&
              exclusionIdentityKey(candidateExclusion.text) === exclusionIdentityKey(siblingExclusion.text),
            );
          },
        },
      );
      if (!isExtractionSnapshotCurrent(snapshot, { personId, generation: extractionGeneration.current })) return;
      if (!replaced) {
        setError("We could not exclude this Core Topic. Your current briefing is unchanged. Try again.");
        return;
      }
      const records = await vault.listByParent({ collection: "people", id: personId });
      if (!isExtractionSnapshotCurrent(snapshot, { personId, generation: extractionGeneration.current })) return;
      const briefing = classifyBriefingRecords(records);
      setTopics(briefing.topics);
      setExcludedTopics(briefing.excludedTopics);
      setHasMalformedExclusion(briefing.hasMalformedExclusion);
      setPendingExclusionTopicId(null);
    } catch {
      if (isExtractionSnapshotCurrent(snapshot, { personId, generation: extractionGeneration.current })) {
        setError("We could not exclude this Core Topic. Your current briefing is unchanged. Try again.");
      }
    } finally {
      if (isExtractionSnapshotCurrent(snapshot, { personId, generation: extractionGeneration.current })) {
        setMutationTopicId(null);
      }
    }
  }

  const isLoading = state === "loading";
  const isRunning = state === "running";
  const canGenerate = canStartCoreTopicExtraction(
    state,
    interactions.length,
    editingTopicId,
    mutationTopicId,
    pendingExclusionTopicId,
  );
  const topicControlsDisabled =
    isLoading || isRunning || editingTopicId !== null || mutationTopicId !== null || pendingExclusionTopicId !== null;

  return (
    <section
      className="rounded-3xl border border-purple-100/15 bg-gradient-to-br from-purple-400/[0.09] via-slate-950/35 to-blue-500/[0.06] p-5 shadow-xl shadow-purple-950/20 sm:p-6"
      aria-labelledby="core-topics-heading"
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-2xl border border-purple-100/15 bg-purple-200/10 text-lg text-purple-100"
          >
            ✦
          </span>
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-purple-100/65 uppercase">Conversation prep</p>
            <h3 className="mt-1 text-xl font-semibold" id="core-topics-heading">
              Core Topics
            </h3>
            <p className="mt-1 text-sm text-blue-100/70">
              {interactions[0] ? `Last contact: ${interactions[0].occurredOn}` : "No interactions saved yet."}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl border border-purple-100/10 bg-slate-950/35 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-sm text-blue-100/80">
            <p className="font-medium text-white">Generate Core Topics</p>
            <p className="mt-1 max-w-xl leading-6">
              Saved note text and confirmed exclusion subjects will be sent to the configured processing service. Names,
              dates, and account data are not added by the app.
            </p>
          </div>
          <button
            className="shrink-0 rounded-xl bg-gradient-to-r from-purple-200 to-blue-200 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:from-white hover:to-blue-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canGenerate}
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
            {interactions.length > 0 && canGenerate && (
              <button
                className="mt-2 rounded-sm font-semibold underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:outline-none"
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
            {topics.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-purple-100/15 bg-white/[0.02] p-4 text-sm leading-6 text-blue-100/70">
                {interactions.length === 0
                  ? "Save a dated interaction first, then generate Core Topics when you are ready."
                  : "Generate Core Topics when you are ready to prepare for a conversation."}
              </p>
            ) : (
              <ol className="space-y-3">
                {topics.map((topic) => (
                  <li className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 sm:p-5" key={topic.id}>
                    <div className="mb-3 flex flex-wrap items-center gap-2" aria-label={`Actions for ${topic.text}`}>
                      {editingTopicId === topic.id ? (
                        <form
                          className="flex w-full flex-col gap-2 sm:flex-row sm:items-end"
                          onSubmit={(event) => {
                            event.preventDefault();
                            void handleSaveEdit(topic);
                          }}
                        >
                          <label
                            className="flex-1 text-sm font-medium text-blue-100"
                            htmlFor={`edit-topic-${topic.id}`}
                          >
                            Edit Core Topic
                            <input
                              className="mt-1 w-full rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2.5 font-normal text-white focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none"
                              id={`edit-topic-${topic.id}`}
                              maxLength={500}
                              onChange={(event) => {
                                setEditText(event.target.value);
                              }}
                              value={editText}
                            />
                          </label>
                          <div className="flex gap-2">
                            <button
                              className="rounded-lg bg-blue-200 px-3 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={mutationTopicId !== null}
                              type="submit"
                            >
                              Save
                            </button>
                            <button
                              className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={mutationTopicId !== null}
                              onClick={() => {
                                cancelEditing();
                              }}
                              type="button"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : pendingExclusionTopicId === topic.id ? (
                        <div
                          className="w-full rounded-lg border border-amber-200/40 bg-amber-950/30 p-3 text-sm text-amber-100"
                          role="alert"
                        >
                          <p>
                            Don&apos;t suggest this subject again? Future extraction will avoid it on a best-effort
                            basis.
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              autoFocus
                              className="rounded-lg bg-amber-200 px-3 py-2 text-sm font-semibold text-amber-950 transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={mutationTopicId !== null}
                              onClick={() => {
                                void handleConfirmExclusion(topic);
                              }}
                              type="button"
                            >
                              Confirm
                            </button>
                            <button
                              className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={mutationTopicId !== null}
                              onClick={() => {
                                cancelExclusionConfirmation();
                              }}
                              type="button"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={topicControlsDisabled}
                            onClick={() => {
                              startEditing(topic);
                            }}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={topicControlsDisabled}
                            onClick={() => {
                              void handleHideTopic(topic);
                            }}
                            type="button"
                          >
                            Not now
                          </button>
                          <button
                            className="rounded-lg border border-amber-200/40 px-3 py-2 text-sm font-semibold text-amber-100 transition-colors hover:bg-amber-950/40 focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={topicControlsDisabled}
                            onClick={() => {
                              startExclusionConfirmation(topic);
                            }}
                            type="button"
                          >
                            Don&apos;t suggest
                          </button>
                        </>
                      )}
                    </div>
                    <details>
                      <summary className="cursor-pointer rounded-sm font-semibold focus-visible:ring-2 focus-visible:ring-purple-200 focus-visible:outline-none">
                        {topic.text}
                      </summary>
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
