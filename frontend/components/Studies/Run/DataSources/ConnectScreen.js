"use client";

import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import { WaveformIcon, PlugIcon } from "../../../DesignSystem/Icons";
import { channelKey } from "../../../../lib/yqOutputs";
import CameraCanvas from "./CameraCanvas";

const PAGE_STYLE = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  background: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
};

const TOP_BAR_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "16px 24px",
};

const BODY_STYLE = {
  flex: 1,
  display: "flex",
  justifyContent: "center",
  padding: "48px 24px",
};

const COLUMN_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 24,
  width: "100%",
  maxWidth: 603,
};

const CARD_STYLE = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  borderRadius: 12,
  overflow: "hidden",
  boxShadow: "var(--MH-Theme-Elevation-Medium, 2px 2px 8px rgba(0,0,0,0.1))",
  paddingBottom: 8,
};

const SECTION_STYLE = { display: "flex", flexDirection: "column", gap: 8, padding: "8px 16px 12px" };

const DIVIDER_STYLE = {
  height: 1,
  width: "100%",
  background: "var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  margin: "8px 0",
};

// Exported with InputRow for the visual builder's data source cards, which are
// this screen's cards with a builder footer.
export function StatusIndicator({ streaming }) {
  return (
    <div
      className="MH-Type-Label-Base"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        color: streaming
          ? "var(--MH-Theme-Tertiary-Dark, #0D3944)"
          : "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
        flexShrink: 0,
      }}
    >
      <WaveformIcon width={18} height={18} />
      {streaming ? "Streaming" : "Not streaming"}
    </div>
  );
}

/**
 * One device input: its name, what it is connected to, and the connect toggle.
 *
 * @param {HTMLVideoElement} [videoElement] - A connected camera's feed. When
 *   given, the row opens up to show it, with the device name under it.
 * @param {boolean} [nested=false] - The row sits on a Light-Green card (the
 *   visual builder's) rather than a white one, so it takes the grey surface
 *   instead to stay visible.
 */
export function InputRow({ input, status, onConnect, onDisconnect, videoElement, nested = false }) {
  const connected = status?.status === "connected";
  const connecting = status?.status === "connecting";
  const showCamera = connected && !!videoElement;
  const button = (
    <Button
      variant={connected ? "outline" : "filled"}
      tone={connected ? "neutral" : "primary"}
      leadingIcon={<PlugIcon />}
      onClick={() => (connected ? onDisconnect?.(input.id) : onConnect?.(input.id))}
      disabled={connecting || !onConnect}
    >
      {connecting ? "Connecting…" : connected ? "Disconnect" : "Connect"}
    </Button>
  );
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: showCamera ? "16px 16px 12px" : 16,
        borderRadius: 12,
        background: nested
          ? "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)"
          : "var(--MH-Theme-Neutrals-Light-Green, #F6F9F8)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span className="MH-Type-Title-Base" style={{ color: "var(--MH-Theme-Neutrals-Black, #171717)" }}>
            {input.label}
          </span>
          {showCamera ? null : (
            <span className="MH-Type-Body-Base" style={{ color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)" }}>
              {connected
                ? status.deviceLabel || "Connected"
                : status?.status === "error"
                  ? status.error || "Could not connect"
                  : status?.status === "lost"
                    ? `Lost connection to ${status.deviceLabel || input.label}`
                    : `No ${input.label.toLowerCase()} connected`}
            </span>
          )}
        </div>
        {button}
      </div>
      {showCamera && (
        <>
          <div style={{ borderRadius: 12, overflow: "hidden" }}>
            <CameraCanvas videoElement={videoElement} />
          </div>
          {status.deviceLabel && (
            <Chip variant="static" tone="neutral" label={status.deviceLabel} style={{ alignSelf: "flex-start" }} />
          )}
        </>
      )}
    </div>
  );
}

function SourceCard({ row, api, onPreview }) {
  const { block } = row;
  // Fall back to the block's own declared inputs/outputs until the pipeline
  // hook reports in, so the card doesn't flash empty for the first render.
  const inputs = block.inputs || [];
  const outputs = block.outputs || [];
  // Off by default in the builder — most sources measure something the
  // participant isn't meant to see mid-study.
  const canPreview = row.settings?.viewSignal === true;

  return (
    <div style={CARD_STYLE}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px 8px",
        }}
      >
        <span className="MH-Type-Title-Base" style={{ color: "var(--MH-Theme-Neutrals-Black, #171717)" }}>
          {row.label || block.title}
        </span>
        <StatusIndicator streaming={api?.streaming} />
      </div>
      {block.description && (
        <div className="MH-Type-Body-Base" style={{ padding: "0 16px 12px", color: "var(--MH-Theme-Neutrals-Black, #171717)" }}>
          {block.description}
        </div>
      )}
      <div style={{ padding: "0 16px" }}>
        <div style={DIVIDER_STYLE} />
      </div>

      {inputs.length > 0 && (
        <div style={SECTION_STYLE}>
          <span className="MH-Type-Title-Base" style={{ color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)" }}>
            Inputs
          </span>
          {inputs.map((input) => (
            <InputRow
              key={input.id}
              input={input}
              status={api?.inputStatus[input.id]}
              onConnect={api?.connect}
              onDisconnect={api?.disconnect}
            />
          ))}
        </div>
      )}

      <div style={{ padding: "0 16px" }}>
        <div style={DIVIDER_STYLE} />
      </div>

      {outputs.length > 0 && (
        <div style={SECTION_STYLE}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="MH-Type-Title-Base" style={{ color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)" }}>
              Outputs
            </span>
            {canPreview && (
              <Button variant="subtle" onClick={() => onPreview(row.id)}>
                Preview Data
              </Button>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {outputs.flatMap((output) =>
              (output.channels || []).map((channel) => (
                <Chip
                  key={channelKey(output, channel.index)}
                  variant="static"
                  tone="neutral"
                  label={channel.label}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const LEAVE_BUTTON_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 40,
  padding: "8px 24px",
  borderRadius: 100,
  border: "none",
  background: "var(--MH-Theme-Warning-Lighter, #FFEFEE)",
  color: "var(--MH-Theme-Warning-Base, #B9261A)",
  cursor: "pointer",
};

const FOOTER_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 24px",
};

/**
 * The gate participants see before a study with linked data sources can begin:
 * one card per linked source, each listing its device inputs to connect and
 * the outputs it streams. Continue stays disabled until every source's
 * required inputs are connected — whether that's ever optional per-study is
 * still being worked out on the builder side.
 */
export default function ConnectScreen({
  study,
  rows,
  apis,
  allRequiredConnected,
  onContinue,
  onPreview,
  onLeave,
  heading = "This study will collect data from other devices",
  leaveLabel = "Leave the Study",
}) {
  return (
    <div style={PAGE_STYLE}>
      <div style={TOP_BAR_STYLE}>
        <img src="/logo.png" alt="mindHIVE" height={28} />
        <span className="MH-Type-Title-Base" style={{ color: "var(--MH-Theme-Neutrals-Black, #171717)" }}>
          {study?.title}
        </span>
      </div>

      <div style={BODY_STYLE}>
        <div style={COLUMN_STYLE}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h2 className="MH-Type-Title-Large" style={{ margin: 0, color: "var(--MH-Theme-Neutrals-Black, #171717)" }}>
              {heading}
            </h2>
            <p className="MH-Type-Body-Base" style={{ margin: 0, color: "var(--MH-Theme-Neutrals-Black, #171717)" }}>
              You will be connecting to the devices listed below. To learn more about the data
              that each one is collecting, hover over the outputs.
            </p>
          </div>

          {rows.map((row) => (
            <SourceCard key={row.id} row={row} api={apis[row.id]} onPreview={onPreview} />
          ))}
        </div>
      </div>

      <div style={FOOTER_STYLE}>
        <button type="button" style={LEAVE_BUTTON_STYLE} className="MH-Type-Label-Base" onClick={onLeave}>
          {leaveLabel}
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="tonal" disabled>
            Data &amp; Privacy
          </Button>
          <Button variant="tonal" disabled={!allRequiredConnected} onClick={onContinue}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
