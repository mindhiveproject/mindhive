"use client";

import styled from "styled-components";

import RawPanelHeader from "./PanelHeader";

// PanelHeader is still plain JS; TS mis-infers its destructured props param
// from the JSDoc. Assert its real contract here until PanelHeader is on TS
// (same workaround as the Tooltip cast in Chip.tsx).
const PanelHeader = RawPanelHeader as unknown as React.FC<{
  title: React.ReactNode;
  titleId?: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  onClose?: () => void;
  closeLabel?: string;
}>;

/** Props for {@link Panel}. */
export interface PanelProps {
  /** Panel heading, passed to `PanelHeader`. */
  title: React.ReactNode;
  /** Optional second line under the title. */
  subtitle?: React.ReactNode;
  /** Controls placed left of the close button. */
  actions?: React.ReactNode;
  /** Shows a close button in the header when provided. */
  onClose?: () => void;
  /** Accessible name for the close button. @default "Close" */
  closeLabel?: string;
  /** Panel body. */
  children: React.ReactNode;
  /** Drops the body's padding and gap, for panels whose content owns its own edges (a canvas, an editor). @default false */
  flush?: boolean;
  /** Optional style override for the root. */
  style?: React.CSSProperties;
  /** Optional style override for the body. */
  bodyStyle?: React.CSSProperties;
  /** Optional extra class on the root. */
  className?: string;
}

const StyledPanel = styled.section`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  border-radius: 12px;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  box-shadow: var(--MH-Theme-Elevation-Medium, 2px 2px 8px rgba(0, 0, 0, 0.1));
  overflow: hidden;
`;

const StyledPanelBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  flex: 1 1 0%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 16px;

  &.DesignSystem-Panel-Body--flush {
    gap: 0;
    padding: 0;
    overflow: hidden;
  }
`;

/**
 * Design System Panel: the white 12px-radius surface a work panel, drawer or
 * side panel is built from — a `PanelHeader` (title, optional subtitle,
 * actions, optional close) over a scrolling body. Positioning (fixed,
 * sticky, pinned to a corner, filling a layout cell) is the caller's concern
 * via `style`; this only owns the surface, the header and the body scroll.
 */
export default function Panel({
  title,
  subtitle,
  actions = null,
  onClose,
  closeLabel = "Close",
  children,
  flush = false,
  style,
  bodyStyle,
  className,
}: PanelProps) {
  return (
    <StyledPanel
      className={className ? `DesignSystem-Panel ${className}` : "DesignSystem-Panel"}
      style={style}
    >
      <PanelHeader title={title} subtitle={subtitle} actions={actions} onClose={onClose} closeLabel={closeLabel} />
      <StyledPanelBody
        className={flush ? "DesignSystem-Panel-Body DesignSystem-Panel-Body--flush" : "DesignSystem-Panel-Body"}
        style={flush ? undefined : bodyStyle}
      >
        {children}
      </StyledPanelBody>
    </StyledPanel>
  );
}
