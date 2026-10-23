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
 * Give it either `buildDocument` (inline HTML, as p5 does) or `buildSrc` (a
 * URL whose document already runs the frame client, as the jsPsych task route
 * does). A new function identity rebuilds the frame.
 *
 * @param {(nonce: string) => string} [buildDocument] - Returns the task's
 *   HTML, which must run `frameClientSource(nonce)` before any experiment code.
 * @param {(nonce: string) => string} [buildSrc] - Returns the document's URL.
 * @param {string} [sandbox="allow-scripts"] - Never add `allow-same-origin`.
 * @param {"JSPSYCH" | "P5"} runtime
 * @param {"persist" | "preview"} mode
 * @param {object} [params] - Task parameter values, sent once in `init`.
 * @param {string} [title] - Accessible name of the frame.
 * @param {boolean} [autoFocus=false] - Focus the frame once it has loaded, so
 *   keyboard responses reach the task without a click first.
 * @param {() => void} [onReady]
 * @param {(rows: object[]) => void} [onRows]
 * @param {(marker: {label, value, time}) => void} [onMarker]
 * @param {(result: {aggregated, rows}) => void} [onFinish]
 * @param {(failure: {message, stack}) => void} [onFailure]
 * @param {(reason: string) => void} [onRejected] - A message was refused.
 */
export default function RuntimeFrame({
  buildDocument,
  buildSrc,
  sandbox = 'allow-scripts',
  runtime,
  mode,
  params,
  title = 'Task',
  autoFocus = false,
  onReady,
  onRows,
  onMarker,
  onFinish,
  onFailure,
  onRejected,
}) {
  const frameRef = useRef(null);

  // A fresh nonce per rebuild, so a stale frame that hasn't been torn down
  // yet can't connect in place of the new one.
  const { html, src, nonce } = useMemo(() => {
    const value = createNonce();
    return buildSrc
      ? { src: buildSrc(value), nonce: value }
      : { html: buildDocument(value), nonce: value };
  }, [buildDocument, buildSrc]);

  // One stable object whose handlers are swapped every render, so inline
  // callbacks don't tear down the connection — or the frame.
  const handlers = useRef({});
  Object.assign(handlers.current, {
    onReady,
    onRows,
    onMarker,
    onFinish,
    onFailure,
    onRejected,
  });
  const initRef = useRef(null);
  initRef.current = { runtime, mode, params };

  useEffect(() => {
    const connection = createRuntimeFrameConnection({
      nonce,
      getFrameWindow: () => frameRef.current?.contentWindow ?? null,
      init: initRef.current,
      handlers: handlers.current,
    });
    connection.start();
    return () => connection.close();
  }, [nonce]);

  return (
    <iframe
      ref={frameRef}
      title={title}
      {...(src ? { src } : { srcDoc: html })}
      sandbox={sandbox}
      allow="fullscreen"
      onLoad={autoFocus ? () => frameRef.current?.focus() : undefined}
      referrerPolicy="no-referrer"
      style={FRAME_STYLE}
    />
  );
}
