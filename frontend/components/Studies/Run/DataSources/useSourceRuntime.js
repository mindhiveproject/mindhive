"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createReceiver, describeReceiver, needsVideoElement } from "./receivers";

// How many recent samples a raw-signal buffer keeps for the preview canvas.
const BUFFER_LENGTH = 300;

function bufferKey(streamID, channelIndex) {
  return `${streamID}::${channelIndex}`;
}

// Runs one linked data source's yq-data pipeline for as long as this hook is
// mounted: connects/disconnects its declared device inputs and keeps a raw
// ring buffer per declared output channel for the preview canvases to read
// directly, off the render loop. Nothing here is persisted or sent anywhere —
// separate from (and much simpler than) the aggregate recorder, which owns
// what actually gets saved once a task is running.
export default function useSourceRuntime(row) {
  const block = row.block;
  const inputs = block.inputs || [];
  const outputs = block.outputs || [];

  const [inputStatus, setInputStatus] = useState(() =>
    Object.fromEntries(
      inputs.map((input) => [input.id, { status: "disconnected" }])
    )
  );

  const receiversRef = useRef({}); // inputId -> receiver instance
  const camerasRef = useRef({}); // inputId -> VideoReceiver backing a vision receiver, if any
  const videoElsRef = useRef({}); // inputId -> HTMLVideoElement (camera-backed inputs only)
  const hiddenContainerRef = useRef(null); // detached host for those <video> elements
  const pipelineRef = useRef(null);
  const buffersRef = useRef(new Map()); // "streamID::channelIndex" -> Float32Array

  // One Pipeline per linked source, built once for this hook's lifetime;
  // receivers attach to it as their inputs connect.
  useEffect(() => {
    let cancelled = false;
    let pipeline;
    let subscriptions = [];

    async function boot() {
      const { Pipeline } = await import("yq-data");
      if (cancelled) return;
      pipeline = new Pipeline(block.graph);
      pipelineRef.current = pipeline;
      pipeline.start();

      pipeline.recordTargets().forEach((output) => {
        subscriptions.push(
          output.subscribe((packet) => {
            const declared = outputs.find((o) => o.streamID === packet.streamID);
            if (!declared) return;
            const channelCount = declared.channels?.length || 1;
            const samples = Math.floor(packet.data.length / channelCount);
            declared.channels.forEach((channel) => {
              const key = bufferKey(packet.streamID, channel.index);
              let buf = buffersRef.current.get(key);
              if (!buf) {
                buf = new Float32Array(BUFFER_LENGTH).fill(NaN);
                buffersRef.current.set(key, buf);
              }
              for (let i = 0; i < samples; i += 1) {
                buf.copyWithin(0, 1);
                buf[BUFFER_LENGTH - 1] = packet.data[i * channelCount + channel.index];
              }
            });
          })
        );
      });
    }
    boot();

    return () => {
      cancelled = true;
      subscriptions.forEach((s) => s.unsubscribe());
      pipeline?.stop();
      pipelineRef.current = null;
      Object.values(receiversRef.current).forEach((r) => r?.disconnect?.());
      receiversRef.current = {};
      Object.values(camerasRef.current).forEach((c) => c?.disconnect?.());
      camerasRef.current = {};
      Object.values(videoElsRef.current).forEach((el) => el.remove());
      videoElsRef.current = {};
      hiddenContainerRef.current?.remove();
      hiddenContainerRef.current = null;
    };
    // The graph a block ships with doesn't change under an already-linked row.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row.id]);

  const connect = useCallback(
    async (inputId) => {
      const input = inputs.find((i) => i.id === inputId);
      if (!input) return;
      setInputStatus((s) => ({ ...s, [inputId]: { status: "connecting" } }));

      let videoElement;
      try {
        if (needsVideoElement(input.receiver)) {
          videoElement = document.createElement("video");
          videoElement.muted = true;
          videoElement.playsInline = true;
          videoElement.autoplay = true;
          if (!hiddenContainerRef.current) {
            const container = document.createElement("div");
            container.style.cssText = "position:fixed;width:0;height:0;overflow:hidden;";
            document.body.appendChild(container);
            hiddenContainerRef.current = container;
          }
          hiddenContainerRef.current.appendChild(videoElement);
          videoElsRef.current[inputId] = videoElement;
        }

        const { receiver, camera } = await createReceiver(input.receiver, { videoElement });
        await receiver.connect();
        await receiver.startStream?.();
        receiversRef.current[inputId] = receiver;
        if (camera) camerasRef.current[inputId] = camera;
        // Keyed by the input's own id, not its receiver type — two inputs of
        // the same device type (e.g. a synchrony block's two Muse headbands)
        // need distinct pipeline slots, and the block's graph names its
        // source nodes' `receiver` after the input id for exactly this reason.
        pipelineRef.current?.attachReceiver(input.id, receiver);

        setInputStatus((s) => ({
          ...s,
          [inputId]: {
            status: "connected",
            deviceLabel: describeReceiver(receiver, input.receiver),
          },
        }));
      } catch (err) {
        camerasRef.current[inputId]?.disconnect?.();
        delete camerasRef.current[inputId];
        videoElsRef.current[inputId]?.remove();
        delete videoElsRef.current[inputId];
        setInputStatus((s) => ({
          ...s,
          [inputId]: { status: "error", error: err?.message || "Could not connect" },
        }));
      }
    },
    [inputs]
  );

  const disconnect = useCallback(async (inputId) => {
    const receiver = receiversRef.current[inputId];
    delete receiversRef.current[inputId];
    try {
      await receiver?.disconnect?.();
    } catch {
      // Already gone — nothing to do.
    }
    const camera = camerasRef.current[inputId];
    delete camerasRef.current[inputId];
    try {
      await camera?.disconnect?.();
    } catch {
      // Already gone — nothing to do.
    }
    videoElsRef.current[inputId]?.remove();
    delete videoElsRef.current[inputId];
    setInputStatus((s) => ({ ...s, [inputId]: { status: "disconnected" } }));
  }, []);

  const getBuffer = useCallback(
    (streamID, channelIndex) => buffersRef.current.get(bufferKey(streamID, channelIndex)) || null,
    []
  );

  const getVideoElement = useCallback((inputId) => videoElsRef.current[inputId] || null, []);

  // Lets the aggregate recorder attach to the same live receiver this hook
  // already connected, instead of opening the device a second time.
  const getReceiver = useCallback((inputId) => receiversRef.current[inputId] || null, []);

  const streaming = inputs.some((i) => inputStatus[i.id]?.status === "connected");
  const requiredConnected = inputs
    .filter((i) => i.required)
    .every((i) => inputStatus[i.id]?.status === "connected");

  return {
    inputs,
    outputs,
    inputStatus,
    connect,
    disconnect,
    getBuffer,
    getVideoElement,
    getReceiver,
    streaming,
    requiredConnected,
  };
}
