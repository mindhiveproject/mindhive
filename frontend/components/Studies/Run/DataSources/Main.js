"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";

import { STUDY_DATA_SOURCES } from "../../../Queries/DataSourceBlock";
import { SAVE_STUDY_DATA_SOURCE_RECORD } from "../../../Mutations/DataSourceBlock";
import AggregateRecorder from "../../../../lib/yqAggregateRecorder";
import useSourceRuntime from "./useSourceRuntime";
import ConnectScreen from "./ConnectScreen";
import StatusBar from "./StatusBar";
import PreviewPanel from "./PreviewPanel";

function isActiveForStep(scope, stepId) {
  if (!scope || scope === "study") return true;
  if (Array.isArray(scope?.steps)) return scope.steps.includes(stepId);
  return true;
}

// A source only shows a live view of its own signal to the participant when
// its builder settings explicitly turn that on — off by default, since most
// data sources exist to measure something the participant isn't meant to see
// mid-task.
function canViewSignal(row) {
  return row?.settings?.viewSignal === true;
}

// Runs one linked data source's live pipeline and reports its status up to
// the orchestrator below — a bare controller component rather than a hook
// called in a loop, so the number of linked sources can change safely.
function SourceRuntime({ row, onStatus }) {
  const api = useSourceRuntime(row);
  const statusSignature = JSON.stringify(api.inputStatus);

  useEffect(() => {
    onStatus(row.id, api);
    // `api`'s functions are stable (useCallback); only report up again when
    // the connection state actually changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row.id, statusSignature, api.streaming, api.requiredConnected]);

  return null;
}

function defaultLeave(study, user) {
  window.location.href =
    user?.type === "GUEST" ? "/" : `/dashboard/discover/studies?name=${study?.slug}`;
}

/**
 * Wraps the study runtime with its linked data sources: a one-time connect
 * gate before the study can begin (if any source has inputs left to connect),
 * a persistent status bar once past it, and the shared data preview panel
 * either can open. Renders `children` directly when the study has no data
 * sources active for the current step.
 *
 * Once the gate is passed this also owns the AggregateRecorder for the whole
 * participation: it reuses the same receivers the connect UI already opened
 * (no reconnecting hardware), honors each source's "Record participant data"
 * and excluded-channel settings, and saves the recorder's running snapshot
 * to the server on every step close plus once more when this component
 * unmounts (the participant finishes or leaves). Manager.js keeps a single
 * instance of this component mounted for the whole run — from the first task
 * through the post-study prompt — specifically so this doesn't tear down and
 * reconnect devices partway through.
 */
export default function StudyDataSourcesRuntime({ study, user, currentStepId, children }) {
  const { data } = useQuery(STUDY_DATA_SOURCES, {
    variables: { studyId: study?.id },
    skip: !study?.id,
  });

  const activeRows = useMemo(
    () => (data?.studyDataSources || []).filter((row) => isActiveForStep(row.scope, currentStepId)),
    [data, currentStepId]
  );

  const [apis, setApis] = useState({});
  const onStatus = useCallback((rowId, api) => {
    setApis((prev) => ({ ...prev, [rowId]: api }));
  }, []);

  const [gatePassed, setGatePassed] = useState(false);
  const [previewRowId, setPreviewRowId] = useState(null);

  const recorderRef = useRef(null);
  if (!recorderRef.current) recorderRef.current = new AggregateRecorder();

  const [saveRecord] = useMutation(SAVE_STUDY_DATA_SOURCE_RECORD);
  const guestPublicId = user?.type === "GUEST" ? user?.publicId : undefined;

  const saveSnapshot = useCallback(
    (snapshot) => {
      if (!study?.id || !snapshot) return;
      if (!snapshot.steps?.length && !snapshot.session?.length) return;
      saveRecord({
        variables: {
          studyId: study.id,
          guestPublicId,
          steps: snapshot.steps,
          session: snapshot.session,
        },
      }).catch((err) => {
        // Best-effort: a dropped save shouldn't block the participant, and
        // the next step close (or the final flush) tries again with the
        // full running snapshot, not just the delta.
        console.error("Could not save data source aggregates", err);
      });
    },
    [saveRecord, study?.id, guestPublicId]
  );

  // Starts recording exactly once, right after every required input is
  // connected — reusing the receivers the connect screen already opened.
  useEffect(() => {
    if (!gatePassed || recorderRef.current.running) return;
    const receivers = {};
    activeRows.forEach((row) => {
      const rowReceivers = {};
      (row.block.inputs || []).forEach((input) => {
        const receiver = apis[row.id]?.getReceiver(input.id);
        if (receiver) rowReceivers[input.id] = receiver;
      });
      receivers[row.id] = rowReceivers;
    });
    recorderRef.current.start(activeRows, receivers);
    // Deliberately only re-runs when the gate itself changes — activeRows
    // and apis are read at that moment, not tracked afterward.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gatePassed]);

  // An optional input can be connected after the gate; hand its receiver to
  // the already-running recorder as soon as that happens.
  const connectedSignature = JSON.stringify(
    activeRows.map((row) => [
      row.id,
      Object.entries(apis[row.id]?.inputStatus || {})
        .filter(([, status]) => status?.status === "connected")
        .map(([inputId]) => inputId),
    ])
  );
  useEffect(() => {
    if (!gatePassed) return;
    activeRows.forEach((row) => {
      (row.block.inputs || []).forEach((input) => {
        if (apis[row.id]?.inputStatus[input.id]?.status !== "connected") return;
        const receiver = apis[row.id]?.getReceiver(input.id);
        if (receiver) recorderRef.current.attachReceiver(row.id, input.id, receiver);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gatePassed, connectedSignature]);

  // Moves the recorder to the current step whenever it changes, saving the
  // step that just closed so a participant who drops off mid-study still
  // has everything collected up to their last completed step.
  useEffect(() => {
    if (!gatePassed || !recorderRef.current.running) return;
    recorderRef.current.setStep(currentStepId ?? null);
    saveSnapshot(recorderRef.current.snapshot());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gatePassed, currentStepId]);

  // Final flush on unmount — the participant finished the study or left it.
  useEffect(() => {
    return () => {
      if (!recorderRef.current.running) return;
      saveSnapshot(recorderRef.current.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!activeRows.length) return children;

  const allRequiredConnected = activeRows.every((row) => apis[row.id]?.requiredConnected);
  const previewRow = activeRows.find((row) => row.id === previewRowId);

  const togglePreview = (rowId) => {
    const row = activeRows.find((r) => r.id === rowId);
    if (!canViewSignal(row)) return;
    setPreviewRowId((current) => (current === rowId ? null : rowId));
  };

  return (
    <>
      {activeRows.map((row) => (
        <SourceRuntime key={row.id} row={row} onStatus={onStatus} />
      ))}

      {!gatePassed ? (
        <ConnectScreen
          study={study}
          rows={activeRows}
          apis={apis}
          allRequiredConnected={allRequiredConnected}
          onContinue={() => setGatePassed(true)}
          onPreview={togglePreview}
          onLeave={() => defaultLeave(study, user)}
        />
      ) : (
        <>
          <StatusBar
            study={study}
            rows={activeRows}
            apis={apis}
            activeRowId={previewRowId}
            onOpenPreview={togglePreview}
          />
          {children}
        </>
      )}

      {previewRow && apis[previewRow.id] && canViewSignal(previewRow) && (
        <PreviewPanel row={previewRow} api={apis[previewRow.id]} onClose={() => setPreviewRowId(null)} />
      )}
    </>
  );
}
