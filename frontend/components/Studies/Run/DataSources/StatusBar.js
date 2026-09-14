"use client";

import { useLayoutEffect, useRef, useState } from "react";

import IconButton from "../../../DesignSystem/IconButton";
import { WaveformIcon, RecordDotIcon, SidePanelIcon } from "../../../DesignSystem/Icons";

// One surface for the whole header: the mindHIVE logo/title, and the device
// cards — inline in the same row when there's room, stacked underneath (one
// per line, never a wrapped second row) when there isn't.
const CONTAINER_STYLE = {
  position: "sticky",
  top: 8,
  zIndex: 20,
  margin: "8px 8px 0",
  borderRadius: 12,
  border: "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  background: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
};

const MEASURE_STYLE = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  visibility: "hidden",
  pointerEvents: "none",
  overflow: "hidden",
};

const ROW_STYLE = {
  display: "flex",
  alignItems: "center",
  flexWrap: "nowrap",
  gap: 12,
  height: 60,
  padding: "0 16px",
  boxSizing: "border-box",
};

const DIVIDER_STYLE = {
  height: 1,
  flexShrink: 0,
  background: "var(--MH-Theme-Neutrals-Light, #E6E6E6)",
};

// Devices didn't fit alongside the logo/title — stacked one per line rather
// than wrapped into a second horizontal row.
const STACK_STYLE = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 8,
  padding: 8,
};

// Each device is its own compact, content-width card, never shrinking — so
// the measured row's natural width reflects what it would actually take.
const CARD_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  height: 48,
  flexShrink: 0,
  padding: "0 16px",
  boxSizing: "border-box",
  borderRadius: 12,
  border: "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  background: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
};

const CARD_SELECTED_STYLE = {
  background: "var(--MH-Theme-Neutrals-Light-Green, #F6F9F8)",
};

// Compares the natural (unwrapped) width of the row against the space
// actually available — the same technique SplitPane uses for its own live
// layout. Two triggers keep it current: a ResizeObserver for when the
// container itself is resized, and a plain post-render check for when the
// row's own content changes width (a status label appearing) without the
// container doing so.
function useFitsOneLine() {
  const measureRef = useRef(null);
  const [fits, setFits] = useState(true);

  const check = () => {
    const el = measureRef.current;
    if (!el) return;
    const next = el.scrollWidth <= el.clientWidth + 1;
    setFits((prev) => (prev === next ? prev : next));
  };

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    check();
  });

  return [measureRef, fits];
}

function Indicator({ color, icon, label }) {
  return (
    <span
      className="MH-Type-Label-Base"
      style={{ display: "inline-flex", alignItems: "center", gap: 8, color }}
    >
      {icon}
      {label}
    </span>
  );
}

function DeviceCard({ row, api, active, onOpenPreview }) {
  const streaming = !!api?.streaming;
  // A row's own "Record participant data" setting, not a study-wide flag —
  // one linked source can be excluded from recording while another isn't.
  const recording = row.settings?.recordParticipantData !== false;
  const canPreview = row.settings?.viewSignal === true;
  return (
    <div style={active ? { ...CARD_STYLE, ...CARD_SELECTED_STYLE } : CARD_STYLE}>
      <span className="MH-Type-Title-Base" style={{ color: "var(--MH-Theme-Neutrals-Black, #171717)" }}>
        {row.label || row.block.title}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Indicator
          color={streaming ? "var(--MH-Theme-Tertiary-Dark, #0D3944)" : "var(--MH-Theme-Neutrals-Dark, #6A6A6A)"}
          icon={<WaveformIcon width={18} height={18} />}
          label={streaming ? "Streaming" : "Not streaming"}
        />
        {recording && (
          <Indicator
            color="var(--MH-Theme-Warning-Base, #B9261A)"
            icon={<RecordDotIcon width={18} height={18} />}
            label="Recording"
          />
        )}
        {canPreview && (
          <IconButton
            variant={active ? "tonal" : "subtle"}
            icon={<SidePanelIcon />}
            ariaLabel="Toggle data preview"
            onClick={() => onOpenPreview(row.id)}
          />
        )}
      </div>
    </div>
  );
}

function TitleBlock({ study }) {
  return (
    <>
      <img src="/logo.png" alt="mindHIVE" height={28} style={{ flexShrink: 0 }} />
      <span
        className="MH-Type-Title-Base"
        style={{ color: "var(--MH-Theme-Neutrals-Black, #171717)", flexShrink: 0 }}
      >
        {study?.title}
      </span>
    </>
  );
}

/**
 * Persists at the top of the runtime while a study with linked data sources
 * is being taken — the mindHIVE logo and study title, plus one compact card
 * per linked source. The cards sit inline in that same row when there's
 * room; when there isn't, they drop to their own stacked section underneath
 * (one per line) rather than wrapping into a second horizontal row. Each
 * card carries its own live streaming status and (when its "Allow
 * participants to view the signal" setting is on) a button opening that
 * source's data preview panel.
 */
export default function StatusBar({ study, rows, apis, activeRowId, onOpenPreview }) {
  const [measureRef, fits] = useFitsOneLine();

  if (!rows?.length) return null;

  const cards = rows.map((row) => (
    <DeviceCard
      key={row.id}
      row={row}
      api={apis[row.id]}
      active={activeRowId === row.id}
      onOpenPreview={onOpenPreview}
    />
  ));

  return (
    <div style={{ ...CONTAINER_STYLE, position: "relative" }}>
      {/* Hidden probe: always laid out on one line (no wrap, no shrink) so its
          scrollWidth reveals whether the real content would actually fit. */}
      <div ref={measureRef} style={{ ...ROW_STYLE, ...MEASURE_STYLE }} aria-hidden="true">
        <TitleBlock study={study} />
        {cards}
      </div>

      {fits ? (
        <div style={ROW_STYLE}>
          <TitleBlock study={study} />
          {cards}
        </div>
      ) : (
        <>
          <div style={ROW_STYLE}>
            <TitleBlock study={study} />
          </div>
          <div style={DIVIDER_STYLE} />
          <div style={STACK_STYLE}>{cards}</div>
        </>
      )}
    </div>
  );
}
