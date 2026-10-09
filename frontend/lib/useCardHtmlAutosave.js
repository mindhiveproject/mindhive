import { useCallback, useEffect, useRef, useState } from "react";
import { useApolloClient } from "@apollo/client";
import { UPDATE_CARD_EDIT } from "../components/Mutations/Proposal";

// Save the HTML columns this long after the last keystroke.
const AUTOSAVE_DELAY_MS = 2000;

export const CARD_TEXT_FIELDS = ["content", "revisedContent", "comment"];

// An empty editor serializes to "<p></p>"; treat that like an empty column.
const isEmptyHtml = (html) =>
  !html ||
  String(html)
    .replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "")
    .replace(/\s/g, "") === "";
const sameHtml = (a, b) => a === b || (isEmptyHtml(a) && isEmptyHtml(b));

const savedValuesFrom = (card) => ({
  content: card?.content || "",
  revisedContent: card?.revisedContent || "",
  comment: card?.comment || "",
});

// The revised entry starts as a copy of the original until it is edited.
const displayValuesFrom = (card) => ({
  content: card?.content || "",
  revisedContent: card?.revisedContent || card?.content || "",
  comment: card?.comment || "",
});

/**
 * Keeps a proposal card's HTML columns (content, revisedContent, comment) in
 * step with its editors. The collab server only persists the Yjs document, so
 * the browser mirrors the HTML that PDF export and read-only views use.
 *
 * - `collabLive`: the editors are bound to a connected Yjs document. When they
 *   aren't, saves also clear `yjsState` so every editor re-seeds from this HTML.
 * - `bound`: the editors are bound to Yjs at all; while they are, incoming
 *   card props are ignored because the shared document is the source of truth.
 *
 * saveState: idle | pending | saving | saved | error
 */
export function useCardHtmlAutosave({ card, cardId, collabLive, bound }) {
  const client = useApolloClient();
  const [values, setValues] = useState(() => displayValuesFrom(card));
  const [saveState, setSaveState] = useState("idle");

  const valuesRef = useRef(values);
  // What we believe the HTML columns currently hold, per field.
  const lastSavedRef = useRef(savedValuesFrom(card));
  const dirtyRef = useRef(new Set());
  const saveTimerRef = useRef(null);
  const inFlightRef = useRef(null);
  const saveQueuedRef = useRef(false);
  const failedExtraSaveRef = useRef(null);
  const extraSavesRef = useRef(new Set());
  const mountedRef = useRef(true);
  const collabLiveRef = useRef(collabLive);
  collabLiveRef.current = collabLive;

  const flushSave = useCallback(() => {
    clearTimeout(saveTimerRef.current);
    if (inFlightRef.current) {
      saveQueuedRef.current = true;
      return inFlightRef.current;
    }
    const fields = [...dirtyRef.current];
    if (!fields.length || !cardId) return Promise.resolve();

    const input = {};
    fields.forEach((field) => {
      input[field] = valuesRef.current[field];
    });
    if (!collabLiveRef.current) {
      input.yjsState = "";
    }
    dirtyRef.current = new Set();
    if (mountedRef.current) setSaveState("saving");

    // client.mutate (not useMutation) so a save started on unmount still lands.
    const request = client
      .mutate({
        mutation: UPDATE_CARD_EDIT,
        variables: { id: cardId, input },
        update(cache) {
          cache.modify({
            id: cache.identify({ __typename: "ProposalCard", id: cardId }),
            fields: Object.fromEntries(fields.map((field) => [field, () => input[field]])),
          });
        },
      })
      .then(() => {
        fields.forEach((field) => {
          lastSavedRef.current[field] = input[field];
        });
        if (mountedRef.current) {
          setSaveState(dirtyRef.current.size ? "pending" : "saved");
        }
      })
      .catch((error) => {
        console.error("Failed to save card:", error);
        fields.forEach((field) => dirtyRef.current.add(field));
        if (mountedRef.current) setSaveState("error");
      })
      .finally(() => {
        inFlightRef.current = null;
        if (saveQueuedRef.current) {
          saveQueuedRef.current = false;
          flushSave();
        }
      });
    inFlightRef.current = request;
    return request;
  }, [client, cardId]);

  // Pass the `{ origin }` TipTap reports with each update.
  const handleFieldUpdate = useCallback(
    (field, html, { origin = "local" } = {}) => {
      valuesRef.current = { ...valuesRef.current, [field]: html };
      setValues(valuesRef.current);

      // A peer's edit is mirrored to HTML by that peer.
      if (origin === "remote") return;
      // "sync" is the shared document as loaded: if it differs from the HTML
      // columns they had drifted apart, and saving realigns them.
      if (sameHtml(html, lastSavedRef.current[field])) return;

      dirtyRef.current.add(field);
      setSaveState((state) => (state === "saving" ? state : "pending"));
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(flushSave, AUTOSAVE_DELAY_MS);
    },
    [flushSave]
  );

  /**
   * Report another save of this card (status, assignees…) through the same
   * indicator. `run` is retried by `retry()` if it fails.
   */
  const trackSave = useCallback((run) => {
    if (mountedRef.current) setSaveState("saving");
    const request = run()
      .then(() => {
        failedExtraSaveRef.current = null;
        if (mountedRef.current) {
          setSaveState(dirtyRef.current.size ? "pending" : "saved");
        }
      })
      .catch((error) => {
        console.error("Failed to save card:", error);
        failedExtraSaveRef.current = run;
        if (mountedRef.current) setSaveState("error");
      })
      .finally(() => {
        extraSavesRef.current.delete(request);
      });
    extraSavesRef.current.add(request);
    return request;
  }, []);

  /** Saves everything outstanding; resolves once nothing is in flight. */
  const flushAll = useCallback(async () => {
    await Promise.all([flushSave(), ...extraSavesRef.current]);
    // A save queued behind the in-flight one runs from its `finally`.
    if (inFlightRef.current) await inFlightRef.current;
  }, [flushSave]);

  /** After flushAll: true if something still failed to save. */
  const hasUnsavedChanges = useCallback(
    () => dirtyRef.current.size > 0 || !!failedExtraSaveRef.current,
    []
  );

  const retry = useCallback(() => {
    const failedExtra = failedExtraSaveRef.current;
    if (failedExtra) trackSave(failedExtra);
    return flushSave();
  }, [flushSave, trackSave]);

  // Adopt content saved elsewhere (polling, cache updates) while the editors
  // aren't bound to the shared document.
  useEffect(() => {
    if (bound) return;
    const saved = savedValuesFrom(card);
    const display = displayValuesFrom(card);
    let next = null;
    CARD_TEXT_FIELDS.forEach((field) => {
      if (dirtyRef.current.has(field)) return;
      if (saved[field] === lastSavedRef.current[field]) return;
      lastSavedRef.current[field] = saved[field];
      next = { ...(next || valuesRef.current), [field]: display[field] };
    });
    if (next) {
      valuesRef.current = next;
      setValues(next);
    }
  }, [card?.content, card?.revisedContent, card?.comment, bound]);

  useEffect(() => {
    if (saveState !== "saved") return undefined;
    const timer = setTimeout(() => setSaveState("idle"), 2000);
    return () => clearTimeout(timer);
  }, [saveState]);

  const flushRef = useRef(flushSave);
  flushRef.current = flushSave;
  useEffect(() => {
    mountedRef.current = true;
    const onPageHide = () => flushRef.current();
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      mountedRef.current = false;
      flushRef.current();
    };
  }, []);

  return {
    values,
    saveState,
    // Something still has to reach the server (or failed to).
    hasPendingSave: ["pending", "saving", "error"].includes(saveState),
    handleFieldUpdate,
    flushSave,
    flushAll,
    hasUnsavedChanges,
    trackSave,
    retry,
  };
}
