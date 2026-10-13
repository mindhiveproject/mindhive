"use client";

import { useCallback, useState } from "react";

import Panel from "../../../DesignSystem/Panel";
import Button from "../../../DesignSystem/Button";
import IconButton from "../../../DesignSystem/IconButton";
import Chip from "../../../DesignSystem/Chip";
import {
  ArrowDropDownIcon,
  PlugIcon,
  VisibilityIcon,
  VisibilityOffIcon,
} from "../../../DesignSystem/Icons";
import CameraCanvas from "./CameraCanvas";
import WaveformCanvas from "./WaveformCanvas";
import { channelKey } from "../../../../lib/yqOutputs";

const ROOT_STYLE = {
  position: "fixed",
  top: 8,
  right: 8,
  bottom: 8,
  width: "min(420px, calc(100vw - 16px))",
  zIndex: 30,
};

const SECTION_HEADER_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 8px",
  height: 40,
};

const DIVIDER_STYLE = {
  height: 1,
  background: "var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  margin: "0 16px",
};

function InputRow({ input, status, onConnect, onDisconnect, videoElement }) {
  const connected = status?.status === "connected";
  const connecting = status?.status === "connecting";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "8px 8px 12px",
        borderRadius: 12,
        background: "var(--MH-Theme-Neutrals-Light-Green, #F6F9F8)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 8 }}>
        <span className="MH-Type-Title-Base" style={{ color: "var(--MH-Theme-Neutrals-Black, #171717)" }}>
          {input.label}
        </span>
        <Button
          variant={connected ? "outline" : "filled"}
          tone={connected ? "neutral" : "primary"}
          leadingIcon={<PlugIcon />}
          disabled={connecting}
          onClick={() => (connected ? onDisconnect(input.id) : onConnect(input.id))}
        >
          {connecting ? "Connecting…" : connected ? "Disconnect" : "Connect"}
        </Button>
      </div>

      {connected && input.receiver === "video" && videoElement && (
        <>
          <CameraCanvas videoElement={videoElement} />
          <Chip variant="static" tone="neutral" label={status.deviceLabel} style={{ alignSelf: "flex-start" }} />
        </>
      )}

      {connected && input.receiver !== "video" && status.deviceLabel && (
        <span
          className="MH-Type-Body-Base"
          style={{ color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)", paddingLeft: 8 }}
        >
          {status.deviceLabel}
        </span>
      )}
    </div>
  );
}

// One output channel: a chip that toggles its raw trace, and the trace itself
// on a transparent background underneath while it's shown.
function OutputRow({ output, channel, getBuffer }) {
  const [visible, setVisible] = useState(true);
  const toggle = () => setVisible((v) => !v);
  const readBuffer = useCallback(
    () => getBuffer(output, channel.index),
    [getBuffer, output, channel.index]
  );
  const EyeIcon = visible ? VisibilityIcon : VisibilityOffIcon;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 4,
        padding: 8,
        borderRadius: 12,
        background: visible
          ? "var(--MH-Theme-Neutrals-Light-Green, #F6F9F8)"
          : "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
      }}
    >
      <Chip
        label={channel.label}
        pressed={visible}
        accent="tertiary"
        onClick={toggle}
        trailing={
          <EyeIcon
            width={18}
            height={18}
            style={{ display: "block", cursor: "pointer" }}
            onClick={toggle}
          />
        }
        ariaLabel={`${visible ? "Hide" : "Show"} ${channel.label} preview`}
      />
      {visible && (
        <div style={{ width: "100%" }}>
          <WaveformCanvas getBuffer={readBuffer} height={88} />
        </div>
      )}
    </div>
  );
}

/**
 * The side panel opened from the runtime status bar (or a study's "Preview
 * Data" button): shows this data source's device inputs and output channels.
 * A camera input additionally shows its live feed once connected; each output
 * channel shows its raw trace, which its chip toggles off. Built on the
 * DesignSystem `Panel` shell shared with the study builder's data sources
 * panel and the visual builder's work panels.
 */
export default function PreviewPanel({ row, api, onClose }) {
  const [inputsOpen, setInputsOpen] = useState(true);
  const [outputsOpen, setOutputsOpen] = useState(true);

  return (
    <Panel
      title="Data Preview"
      subtitle={row.label || row.block.title}
      onClose={onClose}
      closeLabel="Close data preview"
      style={ROOT_STYLE}
      bodyStyle={{ padding: 0, gap: 0 }}
    >
      <div style={DIVIDER_STYLE} />

      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "8px 8px 0" }}>
        <div style={SECTION_HEADER_STYLE}>
          <span className="MH-Type-Title-Base" style={{ color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)" }}>
            Inputs
          </span>
          <IconButton
            variant="subtle"
            icon={<ArrowDropDownIcon style={{ transform: inputsOpen ? "rotate(180deg)" : undefined }} />}
            ariaLabel={inputsOpen ? "Collapse inputs" : "Expand inputs"}
            onClick={() => setInputsOpen((v) => !v)}
          />
        </div>
        {inputsOpen &&
          api.inputs.map((input) => (
            <InputRow
              key={input.id}
              input={input}
              status={api.inputStatus[input.id]}
              onConnect={api.connect}
              onDisconnect={api.disconnect}
              videoElement={api.getVideoElement(input.id)}
            />
          ))}
      </div>

      <div style={DIVIDER_STYLE} />

      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "8px 8px 8px" }}>
        <div style={SECTION_HEADER_STYLE}>
          <span className="MH-Type-Title-Base" style={{ color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)" }}>
            Outputs
          </span>
          <IconButton
            variant="subtle"
            icon={<ArrowDropDownIcon style={{ transform: outputsOpen ? "rotate(180deg)" : undefined }} />}
            ariaLabel={outputsOpen ? "Collapse outputs" : "Expand outputs"}
            onClick={() => setOutputsOpen((v) => !v)}
          />
        </div>
        {outputsOpen &&
          api.outputs.flatMap((output) =>
            (output.channels || []).map((channel) => (
              <OutputRow
                key={channelKey(output, channel.index)}
                output={output}
                channel={channel}
                getBuffer={api.getBuffer}
              />
            ))
          )}
      </div>
    </Panel>
  );
}
