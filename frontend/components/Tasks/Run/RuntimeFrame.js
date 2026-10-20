import { useEffect, useMemo, useRef } from 'react';
import { createRuntimeFrameConnection } from './runtimeFrameConnection';

const FRAME_STYLE = {
  display: 'block',
  width: '100%',
  height: '100%',
  border: 'none',
};

function createNonce() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

/**
 * Runs a task document (jsPsych or p5) in a sandboxed frame and relays what
 * it sends over the mindhive-runtime/2 bridge.
 *
 * The sandbox is `allow-scripts` without `allow-same-origin`, so the frame has
 * an opaque origin and researcher code can't reach the study runner around
 * it. The document proves itself with a per-frame nonce and is then handed a
 * private `MessagePort` (see `runtimeFrameConnection`).
 *
 * This component only connects and relays: saving is the caller's job,
 * usually through `createRunBuffer`.
 *
 * @param {(nonce: string) => string} buildDocument - Returns the task's HTML,
 *   which must run `frameClientSource(nonce)` before any experiment code. A
 *   new function identity rebuilds the frame.
 * @param {"JSPSYCH" | "P5"} runtime
 * @param {"persist" | "preview"} mode
 * @param {object} [params] - Task parameter values, sent once in `init`.
 * @param {boolean} [paused=false]
 * @param {string} [title] - Accessible name of the frame.
 * @param {() => void} [onReady]
 * @param {(rows: object[]) => void} [onRows]
 * @param {(marker: {label, value, time}) => void} [onMarker]
 * @param {(result: {aggregated, rows}) => void} [onFinish]
 * @param {(failure: {message, stack}) => void} [onFailure]
 * @param {(entry: {level, message}) => void} [onLog]
 * @param {(reason: string) => void} [onRejected] - A message was refused.
 */
export default function RuntimeFrame({
  buildDocument,
  runtime,
  mode,
  params,
  paused = false,
  title = 'Task',
  onReady,
  onRows,
  onMarker,
  onFinish,
  onFailure,
  onLog,
  onRejected,
}) {
  const frameRef = useRef(null);
  const connectionRef = useRef(null);

  // A fresh nonce per rebuild, so a stale frame that hasn't been torn down
  // yet can't connect in place of the new one.
  const { html, nonce } = useMemo(() => {
    const value = createNonce();
    return { html: buildDocument(value), nonce: value };
  }, [buildDocument]);

  // One stable object whose handlers are swapped every render, so inline
  // callbacks don't tear down the connection — or the frame.
  const handlers = useRef({});
  Object.assign(handlers.current, {
    onReady,
    onRows,
    onMarker,
    onFinish,
    onFailure,
    onLog,
    onRejected,
  });
  const initRef = useRef(null);
  initRef.current = { runtime, mode, params };
  const pausedRef = useRef(paused);

  useEffect(() => {
    const connection = createRuntimeFrameConnection({
      nonce,
      getFrameWindow: () => frameRef.current?.contentWindow ?? null,
      init: initRef.current,
      handlers: handlers.current,
    });
    connection.setPaused(pausedRef.current);
    connection.start();
    connectionRef.current = connection;
    return () => {
      connection.close();
      connectionRef.current = null;
    };
  }, [nonce]);

  useEffect(() => {
    pausedRef.current = paused;
    connectionRef.current?.setPaused(paused);
  }, [paused]);

  return (
    <iframe
      ref={frameRef}
      title={title}
      srcDoc={html}
      sandbox="allow-scripts"
      allow="fullscreen"
      referrerPolicy="no-referrer"
      style={FRAME_STYLE}
    />
  );
}
