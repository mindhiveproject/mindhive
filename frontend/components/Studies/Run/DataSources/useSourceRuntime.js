"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createReceiver, describeReceiver, needsVideoElement } from "./receivers";
import { channelKey, findOutput } from "../../../../lib/yqOutputs";

// How many recent samples a raw-signal buffer keeps for the preview canvas.
const BUFFER_LENGTH = 300;

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
  const connectionSubsRef = useRef({}); // inputId -> isConnected$ subscription
  const camerasRef = useRef({}); // inputId -> VideoReceiver backing a vision receiver, if any
  const videoElsRef = useRef({}); // inputId -> HTMLVideoElement (camera-backed inputs only)
  const hiddenContainerRef = useRef(null); // detached host for those <video> elements
  const pipelineRef = useRef(null);
  const buffersRef = useRef(new Map()); // channelKey(output, index) -> Float32Array
  const packetListenersRef = useRef(new Set()); // (output, packet, channelCount) => void

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

      pipeline.recordTargets().forEach((output, nodeId) => {
        subscriptions.push(
          output.subscribe((packet) => {
            const declared = findOutput(outputs, nodeId, packet);
            if (!declared) return;
            // The packet knows its real layout; a block may list fewer channels.
            const channelCount =
              packet.metadata?.channelCount || declared.channels?.length || 1;
            const samples = Math.floor(packet.data.length / channelCount);
            packetListenersRef.current.forEach((listener) =>
              listener(declared, packet, channelCount)
            );
            (declared.channels || []).forEach((channel) => {
              const key = channelKey(declared, channel.index);
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
      Object.values(connectionSubsRef.current).forEach((sub) => sub.unsubscribe());
      connectionSubsRef.current = {};
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

  // Closes whatever one input is holding — its receiver, the camera under it
  // and its hidden <video> — without touching its status.
  const release = useCallback(async (inputId) => {
    connectionSubsRef.current[inputId]?.unsubscribe();
    delete connectionSubsRef.current[inputId];
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
  }, []);

  const connect = useCallback(
    async (inputId) => {
      const input = inputs.find((i) => i.id === inputId);
      if (!input) return;
      setInputStatus((s) => ({ ...s, [inputId]: { status: "connecting" } }));
      // Reconnecting after a drop: the old receiver is dead but still held, and
      // a Muse, for one, can't be reopened — start from a fresh one.
      await release(inputId);

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

        const deviceLabel = describeReceiver(receiver, input.receiver);
        setInputStatus((s) => ({
          ...s,
          [inputId]: { status: "connected", deviceLabel },
        }));

        // A device can drop on its own — a headband out of range, the LSL relay
        // going away. Receivers report that on `isConnected$`, and some (LSL)
        // come back by themselves, so the status follows it both ways.
        connectionSubsRef.current[inputId] = receiver.isConnected$?.subscribe(
          (isConnected) => {
            setInputStatus((s) => {
              const current = s[inputId]?.status;
              if (!isConnected && current === "connected") {
                return { ...s, [inputId]: { status: "lost", deviceLabel } };
              }
              if (isConnected && current === "lost") {
                return { ...s, [inputId]: { status: "connected", deviceLabel } };
              }
              return s;
            });
          }
        );
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
    [inputs, release]
  );

  const disconnect = useCallback(
    async (inputId) => {
      await release(inputId);
      setInputStatus((s) => ({ ...s, [inputId]: { status: "disconnected" } }));
    },
    [release]
  );

  const getBuffer = useCallback(
    (output, channelIndex) => buffersRef.current.get(channelKey(output, channelIndex)) || null,
    []
  );

  const getVideoElement = useCallback((inputId) => videoElsRef.current[inputId] || null, []);

  // Lets the aggregate recorder attach to the same live receiver this hook
  // already connected, instead of opening the device a second time.
  const getReceiver = useCallback((inputId) => receiversRef.current[inputId] || null, []);

  // Hands every declared-output packet to `listener` as it arrives, for
  // consumers that need values rather than the preview's ring buffers — a
  // visual's parameters mapped onto an output. Returns the unsubscribe.
  const addPacketListener = useCallback((listener) => {
    packetListenersRef.current.add(listener);
    return () => packetListenersRef.current.delete(listener);
  }, []);

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
    addPacketListener,
    streaming,
    requiredConnected,
  };
}
