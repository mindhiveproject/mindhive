"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import buildSketchDocument from "./buildSketchDocument";

const FRAME_STYLE = {
  display: "block",
  width: "100%",
  height: "100%",
  border: "none",
  background: "var(--MH-Theme-Neutrals-Black, #171717)",
};

/**
 * Runs a visual's sketch in a sandboxed iframe and keeps its parameter values
 * fed.
 *
 * Two things about the sandbox are deliberate. It is `allow-scripts` *without*
 * `allow-same-origin`, which gives the frame an opaque origin so a visual
 * shared into a class genuinely cannot touch the app around it — YQ's
 * `allow-same-origin allow-scripts` pair is not a boundary at all. And because
 * an opaque origin can't check `event.origin`, every message carries a
 * per-frame nonce instead, and the parent additionally checks `event.source`.
 *
 * Values are pushed straight into the frame rather than through React state on
 * every sample: at EEG rates that would re-render the whole tree hundreds of
 * times a second.
 *
 * @param {Array<{id, name, role, language, content}>} files - Source files.
 * @param {Record<string, any>} values - Current parameter values, by declared key.
 * @param {boolean} [paused=false] - Stops the draw loop without unmounting.
 * @param {(parameters: object) => void} [onDeclare] - Fires with the sketch's declaration.
 * @param {(entry: {kind, message, stack, line}) => void} [onLog] - Console output and errors.
 */
export default function P5Frame({
  files,
  values,
  paused = false,
  onDeclare,
  onLog,
}) {
  const frameRef = useRef(null);
  const [ready, setReady] = useState(false);

  // A fresh nonce per rebuild, so a message from a stale frame that hasn't been
  // torn down yet is ignored rather than applied to the new one.
  const { html, nonce, entryLine } = useMemo(() => {
    const value =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Math.random()).slice(2);
    const built = buildSketchDocument(files || [], value);
    const entry = (files || []).find((file) => file.role === "entry");
    return {
      html: built.html,
      nonce: value,
      entryLine: entry ? built.lineOffsets[entry.id] : null,
    };
  }, [files]);

  // Handlers are read through refs so a caller passing inline functions doesn't
  // tear down and rebuild the listener — or, worse, the frame — every render.
  const handlers = useRef({ onDeclare, onLog });
  handlers.current = { onDeclare, onLog };

  useEffect(() => {
    setReady(false);

    function onMessage(event) {
      if (event.source !== frameRef.current?.contentWindow) return;
      const data = event.data;
      if (!data || data.nonce !== nonce) return;

      if (data.type === "ready") {
        setReady(true);
      } else if (data.type === "declare") {
        handlers.current.onDeclare?.(data.parameters || {});
      } else if (data.type === "log") {
        handlers.current.onLog?.({ kind: data.level, message: data.message });
      } else if (data.type === "error") {
        handlers.current.onLog?.({
          kind: "error",
          message: data.message,
          stack: data.stack,
          // Map the document line back onto the entry file the author is
          // actually looking at.
          line:
            data.line && entryLine ? data.line - (entryLine - 1) : undefined,
        });
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [nonce, entryLine]);

  // Push values only once the frame has announced itself — anything sent before
  // that lands on a window with no listener yet.
  useEffect(() => {
    if (!ready) return;
    frameRef.current?.contentWindow?.postMessage(
      { nonce, type: "params", values: values || {} },
      "*"
    );
  }, [ready, nonce, values]);

  useEffect(() => {
    if (!ready) return;
    frameRef.current?.contentWindow?.postMessage(
      { nonce, type: "pause", paused },
      "*"
    );
  }, [ready, nonce, paused]);

  return (
    <iframe
      ref={frameRef}
      title="Visual preview"
      srcDoc={html}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      style={FRAME_STYLE}
    />
  );
}
