"use client";

import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import clsx from "clsx";

import { CloseIcon } from "./Icons";
import RawTooltip from "./Tooltip";

// Tooltip is still plain JS; TS 4.9 mis-infers its destructured props param from
// the JSDoc. Assert its real contract here until DesignSystem/Tooltip is on TS.
const Tooltip = RawTooltip as unknown as React.FC<{
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  disabled?: boolean;
  delayMs?: number;
  maxWidth?: number;
  className?: string;
}>;

/** Interaction model for a {@link Chip}. */
export type ChipVariant = "interactive" | "static";

/** Semantic fill/text pair for a static {@link Chip}. */
export type ChipTone =
  | "default"
  | "neutral"
  | "success"
  | "warning"
  | "info"
  | "danger";

/**
 * Reusable chip for tags, filters, statuses and removable tokens.
 * Matches Figma "Basic Chips": fixed 32px height, 8px corners, Inter Medium
 * 14/20 label, label-only / label + icon / label + avatar, optional close.
 *
 * MH-Type/label/base (Inter Medium 14/20). Vertical padding is 6px to hit
 * Figma's fixed 32px chip height with this line-height — not on the 4px grid,
 * but pixel-precise, so left as-is. Corner radius is a fixed 8px for every
 * chip (Figma "Basic Chips" + Material 3), so there is no shape option.
 *
 * Hover only shows on a chip you can actually act on (Figma spec), so it's
 * gated behind the `--hoverable` modifier class rather than a bare `:hover` —
 * `variant="static"` and `disabled` chips never get the class.
 */
const StyledChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #a1a1a1;
  background: #ffffff;
  color: #171717;
  box-sizing: border-box;
  transition: background-color 0.2s, border-color 0.2s;

  /* Non-interactive display chip — Figma "Non-Interactive" state: filled, no
     border, no hover, no trailing/close affordance. Used for read-only tags,
     statuses and metadata. tone swaps the fill/text pair for semantic
     statuses; toned chips stay fill-only (no outline), matching Figma. */
  &.DesignSystem-Chip--static {
    border: none;
    cursor: default;
  }
  &.DesignSystem-Chip--tone-default {
    background: var(--MH-Theme-Primary-Light, #def8fb);
    color: #171717;
  }
  &.DesignSystem-Chip--tone-neutral {
    /* Figma's Non-Interactive chip labels in Neutrals/Black; keep that here so a
       neutral static chip reads as quiet-but-active, not disabled (Neutrals/Dark
       #6a6a6a on this fill is ~3.9:1 — below AA and too close to the disabled grey). */
    background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }
  &.DesignSystem-Chip--tone-success {
    background: var(--MH-Theme-Success, #e3f4ec);
    color: var(--MH-Theme-Success-Dark, #1d6b3a);
  }
  &.DesignSystem-Chip--tone-warning {
    background: var(--MH-Theme-Warning-Light, #fdf6e8);
    color: var(--MH-Theme-Warning-Dark, #8a6d3b);
  }
  &.DesignSystem-Chip--tone-info {
    background: var(--MH-Theme-Primary-Light, #def8fb);
    color: var(--MH-Theme-Primary-Dark, #336f8a);
  }
  &.DesignSystem-Chip--tone-danger {
    background: var(--MH-Theme-Danger-Light, #fdecea);
    color: var(--MH-Theme-Danger-Dark, #b3261e);
  }

  &.DesignSystem-Chip--selected {
    background: var(--MH-Theme-Primary-Light, #def8fb);
    border: 1px solid var(--MH-Theme-Primary-Base, #69bbc4);
  }
  /* Deepen the primary-light fill on hover rather than dropping to grey — same
     move as Button's tonal hover (one step past Primary Light, short of Primary
     Medium), so a selected chip stays on-theme while hovered. */
  &.DesignSystem-Chip--selected.DesignSystem-Chip--hoverable:hover {
    background-color: #c0eaef;
  }
  &.DesignSystem-Chip--hoverable:not(.DesignSystem-Chip--selected):hover {
    background-color: #f3f3f3;
  }

  /* Figma: a chip with a leading (or trailing) 18px icon tightens the padding on
     that side from 12px to 8px; the icon-to-label gap stays 8px. */
  &.DesignSystem-Chip--with-leading {
    padding-left: 8px;
  }
  &.DesignSystem-Chip--with-close {
    padding-right: 8px;
  }
  /* Avatar chips (Figma "Label & Avatar", Material 3): the leading avatar is
     24px — larger than a normal 18px chip icon — so its side padding drops to
     4px (vs the 8px of a leading icon) and its vertical padding drops to 4px to
     keep the chip at the same fixed 32px height as every other chip. Declared
     after --with-leading so its paddingLeft wins when both apply. */
  &.DesignSystem-Chip--with-avatar {
    padding-left: 4px;
    padding-top: 4px;
    padding-bottom: 4px;
  }

  &.DesignSystem-Chip--multiline {
    display: flex;
    width: 100%;
    height: auto;
    min-height: 32px;
    align-items: center;
  }
  &.DesignSystem-Chip--truncating {
    max-width: 100%;
  }

  /* Declared last: disabled wins over selected/hover on the (unsupported)
     combination of props, matching the static > disabled > selected > hover
     priority a caller would expect. */
  &.DesignSystem-Chip--disabled {
    background: #f3f3f3;
    color: #a1a1a1;
    border: 1px solid #e6e6e6;
    cursor: default;
    pointer-events: none;
  }

  &:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
    outline-offset: 2px;
  }
  [data-chip-close]:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
    outline-offset: 2px;
  }
`;

const CLOSE_BUTTON_STYLE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 24,
  height: 24,
  padding: 0,
  border: "none",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
  borderRadius: "4px",
  flexShrink: 0,
};

/**
 * Props for {@link Chip}.
 *
 * @example
 * // Read-only tag
 * <Chip label="Biology" variant="static" />
 *
 * @example
 * // Removable filter chip
 * <Chip label="Filter A" onClose={() => remove('A')} />
 *
 * @example
 * // Selectable chip with icon
 * <Chip label="Option" selected={isSelected} onClick={() => toggle()} leading={<Icon />} />
 *
 * @example
 * // Long label: ellipsised on one line by default, full text in a tooltip when clipped.
 * // Pass truncate={false} to let it size to its content instead.
 * <Chip label={organizationName} variant="static" />
 */
export interface ChipProps {
  /** Main text (required). */
  label: React.ReactNode;
  /**
   * Interaction model. @default "interactive"
   *  - `"interactive"`: white + 1px border; hover fills grey; `selected` fills
   *    primary-light with a 2px primary border; supports `onClick`, `onClose`,
   *    `disabled`.
   *  - `"static"`: non-interactive display chip — filled, no border, no hover,
   *    no close/trailing. For read-only tags and statuses.
   */
  variant?: ChipVariant;
  /** Static chips only: semantic fill/text pair for statuses. @default "default" */
  tone?: ChipTone;
  /** Selected state (interactive only): primary-light fill + primary border. @default false */
  selected?: boolean;
  /** Optional toggle pressed state; when provided, sets `aria-pressed`. */
  pressed?: boolean;
  /** Disabled state (interactive only): greyed, not clickable. @default false */
  disabled?: boolean;
  /** Fired when the chip body is clicked; ignored for static chips and when close/trailing is clicked. */
  onClick?: (e: React.MouseEvent | React.KeyboardEvent) => void;
  /** If provided (interactive only), a close (X) icon is shown and this is called when it is clicked. */
  onClose?: () => void;
  /** Optional leading content (icon or avatar, typically 24px). */
  leading?: React.ReactNode;
  /** Optional trailing content (interactive only); rendered before the close icon. */
  trailing?: React.ReactNode;
  /** Set when `leading` is a 24px avatar: trims vertical padding so the chip stays at the standard 32px height. @default false */
  avatar?: boolean;
  /** Optional override for the root chip container. */
  style?: React.CSSProperties;
  /** Optional override for the label span (e.g. single-line ellipsis). */
  labelStyle?: React.CSSProperties;
  /** Optional class for the root (e.g. for parent layout). */
  className?: string;
  /** Optional accessible name (e.g. icon-only chips). */
  ariaLabel?: string;
  /** Optional native tooltip on the root. */
  title?: string;
  /** Max lines for label text (1 = single line, no wrap). @default 1 */
  labelLines?: number;
  /**
   * Single-line labels only: keep the label on one line, ellipsise it at the
   * available width, and show the full text in a tooltip when it is clipped.
   * Pass `false` to let a long label render at its natural width. Ignored when
   * `labelLines > 1`, where the multi-line clamp handles overflow itself.
   * @default true
   */
  truncate?: boolean;
}

export default function Chip({
  label,
  variant = "interactive",
  tone = "default",
  selected = false,
  pressed,
  disabled = false,
  onClick,
  onClose,
  leading,
  trailing,
  avatar = false,
  style = {},
  labelStyle: labelStyleOverride,
  className,
  ariaLabel,
  title,
  labelLines = 1,
  truncate = true,
}: ChipProps) {
  const labelRef = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);

  const multilineLabel = labelLines > 1;
  // Single-line ellipsis + tooltip-when-clipped is the chip's default; the
  // multi-line clamp path handles its own overflow, so it opts out.
  const truncating = truncate && !multilineLabel;

  useEffect(() => {
    if (!truncating) {
      setTruncated(false);
      return undefined;
    }
    const el = labelRef.current;
    if (!el) return undefined;
    const check = () => setTruncated(el.scrollWidth > el.clientWidth + 1);
    check();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [label, truncating]);

  const isStatic = variant === "static";
  const isInteractive = !isStatic && !disabled;
  const isClickable = isInteractive && typeof onClick === "function";
  const hasLeading = leading != null;
  const hasTrailing = isInteractive && trailing != null;
  const hasClose = isInteractive && typeof onClose === "function";
  // Figma only shows a hover state for chips you can actually act on.
  const canHover = isInteractive && (isClickable || hasClose);
  const isPressed = typeof pressed === "boolean" ? pressed : selected;
  const isSelected = !isStatic && (selected || isPressed);

  const labelStyle: React.CSSProperties = {
    ...(multilineLabel
      ? ({
          flex: 1,
          minWidth: 0,
          display: "-webkit-box",
          WebkitLineClamp: labelLines,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          whiteSpace: "normal",
          overflowWrap: "break-word",
        } as React.CSSProperties)
      : truncating
        ? {
            minWidth: 0,
            flexShrink: 1,
            display: "block",
            overflow: "hidden",
          }
        : { flexShrink: 0 }),
    ...labelStyleOverride,
  };

  const handleRootClick = (e: React.MouseEvent) => {
    if (!isClickable) return;
    const target = e.target as Element;
    const isClose = target.closest?.("[data-chip-close]");
    const isTrailing = target.closest?.("[data-chip-trailing]");
    if (isClose || isTrailing) return;
    onClick?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isClickable) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const target = e.target as Element;
      const isClose = target.closest?.("[data-chip-close]");
      const isTrailing = target.closest?.("[data-chip-trailing]");
      if (!isClose && !isTrailing) onClick?.(e);
    }
  };

  const chipWithStyle = (
    <StyledChip
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={ariaLabel}
      aria-pressed={isClickable && typeof pressed === "boolean" ? pressed : undefined}
      title={
        title ??
        (truncating && truncated && typeof label === "string"
          ? label
          : undefined)
      }
      className={clsx(
        "DesignSystem-Chip",
        "MH-Type-Label-Base",
        isStatic && "DesignSystem-Chip--static",
        isStatic && `DesignSystem-Chip--tone-${tone}`,
        isSelected && "DesignSystem-Chip--selected",
        canHover && "DesignSystem-Chip--hoverable",
        hasLeading && "DesignSystem-Chip--with-leading",
        hasClose && "DesignSystem-Chip--with-close",
        avatar && "DesignSystem-Chip--with-avatar",
        multilineLabel && "DesignSystem-Chip--multiline",
        truncating && "DesignSystem-Chip--truncating",
        disabled && "DesignSystem-Chip--disabled",
        className,
      )}
      style={{
        ...style,
        cursor: isClickable ? "pointer" : "default",
      }}
      onClick={handleRootClick}
      onKeyDown={handleKeyDown}
    >
      {leading && (
        <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{leading}</span>
      )}
      <span style={labelStyle}>
        {truncating ? (
          <span
            ref={labelRef}
            style={{
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        ) : (
          label
        )}
      </span>
      {hasTrailing && (
        <span
          data-chip-trailing
          style={{ flexShrink: 0, display: "inline-flex", alignItems: "center" }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {trailing}
        </span>
      )}
      {hasClose && (
        <button
          type="button"
          data-chip-close
          style={CLOSE_BUTTON_STYLE}
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <CloseIcon width={18} height={18} style={{ display: "block" }} />
        </button>
      )}
    </StyledChip>
  );

  if (!truncating) return chipWithStyle;

  return (
    <Tooltip content={label} disabled={!truncated} side="top">
      {chipWithStyle}
    </Tooltip>
  );
}
