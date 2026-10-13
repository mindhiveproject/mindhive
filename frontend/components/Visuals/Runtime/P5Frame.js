"use client";

import { useEffect, useMemo, useRef } from "react";

import buildSketchDocument, { PROTOCOL } from "./buildSketchDocument";

const EMPTY_SOURCES = [];

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
 * an opaque origin can't be checked, the frame proves itself once with a
 * per-frame nonce, and is then handed a private `MessagePort`. Everything after
 * the handshake travels on that port through yq-data's own
 * `PostMessageTransport`, the same transport the package uses between a page
 * and a worker.
 *
 * Values come from a {@link ParameterBus} rather than a prop, so they flow to
 * the frame without re-rendering anything: at EEG rates, React state per sample
 * would re-render the whole tree hundreds of times a second.
 *
 * @param {Array<{id, name, role, language, content}>} files - Source files.
 * @param {import("./parameterBus").default} bus - Current parameter values.
 * @param {Array} [sources=[]] - Linked data sources' connection state, which the
 *   sketch reads as `sources`. See `useVisualDataSources`.
 * @param {boolean} [paused=false] - Stops the draw loop without unmounting.
 * @param {(parameters: object) => void} [onDeclare] - Fires with the sketch's declaration.
 * @param {(entry: {kind, message, stack, line}) => void} [onLog] - Console output and errors.
 * @param {(event: {label, value, time}) => void} [onEvent] - The sketch called `sendEvent`.
 */
export default function P5Frame({
  files,
  bus,
  sources = EMPTY_SOURCES,
  paused = false,
  onDeclare,
  onLog,
  onEvent,
}) {
  const frameRef = useRef(null);
  const transportRef = useRef(null);

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
  // tear down and rebuild the connection — or, worse, the frame — every render.
  const handlers = useRef({ onDeclare, onLog, onEvent });
  handlers.current = { onDeclare, onLog, onEvent };
  const pausedRef = useRef(paused);
  const sourcesRef = useRef(sources);

  useEffect(() => {
    let cancelled = false;
    let connecting = false;
    let detach = null;
    let port = null;

    function onFrameMessage(data) {
      if (!data || data.protocol !== PROTOCOL) return;

      if (data.type === "declare") {
        handlers.current.onDeclare?.(data.parameters || {});
      } else if (data.type === "event") {
        handlers.current.onEvent?.({
          label: data.label,
          value: data.value,
          time: data.time,
        });
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

    async function connect(frameWindow) {
      const { PostMessageTransport } = await import("yq-data");
      if (cancelled) return;

      const channel = new MessageChannel();
      port = channel.port1;
      const transport = new PostMessageTransport({
        target: channel.port1,
        source: channel.port1,
      });
      // A port listened to through addEventListener stays shut until started.
      channel.port1.start();
      transport.onMessage(onFrameMessage);
      transportRef.current = transport;

      frameWindow.postMessage({ protocol: PROTOCOL, type: "connect", nonce }, "*", [
        channel.port2,
      ]);
      if (pausedRef.current) {
        transport.send({ protocol: PROTOCOL, type: "pause", paused: true });
      }
      transport.send({ protocol: PROTOCOL, type: "sources", sources: sourcesRef.current });
      detach = bus.connect((values, full) =>
        transport.send({
          protocol: PROTOCOL,
          type: full ? "init" : "params",
          values,
        })
      );
    }

    // The frame keeps saying hello until it is answered, so only the first
    // one from this frame, with this frame's nonce, gets a port.
    function onHello(event) {
      if (connecting) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      const data = event.data;
      if (!data || data.protocol !== PROTOCOL || data.type !== "hello") return;
      if (data.nonce !== nonce) return;
      connecting = true;
      connect(event.source).catch(() => {
        connecting = false;
      });
    }

    window.addEventListener("message", onHello);
    return () => {
      cancelled = true;
      window.removeEventListener("message", onHello);
      detach?.();
      transportRef.current?.close();
      transportRef.current = null;
      port?.close();
    };
  }, [nonce, entryLine, bus]);

  useEffect(() => {
    sourcesRef.current = sources;
    transportRef.current?.send({ protocol: PROTOCOL, type: "sources", sources });
  }, [sources]);

  useEffect(() => {
    pausedRef.current = paused;
    transportRef.current?.send({ protocol: PROTOCOL, type: "pause", paused });
  }, [paused]);

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
