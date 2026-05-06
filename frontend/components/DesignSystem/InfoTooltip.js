"use client";

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

const defaultIconStyle = {
  width: "20px",
  height: "20px",
  flexShrink: 0,
  filter:
    "brightness(0) saturate(100%) invert(28%) sepia(8%) saturate(1200%) hue-rotate(240deg) brightness(95%) contrast(85%)",
};

const defaultTooltipStyle = {
  position: "absolute",
  width: "400px",
  background: "#ffffff",
  color: "#625B71",
  padding: "12px 16px",
  border: "1px solid #5D5763",
  borderRadius: "16px",
  fontSize: "16px",
  fontFamily: "Inter, sans-serif",
  lineHeight: "20px",
  opacity: 0,
  transition: "all 0.3s ease",
  pointerEvents: "none",
  zIndex: 1000,
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.10)",
};

const POSITION_STYLES = {
  left: {
    top: 0,
    right: "100%",
    marginRight: "8px",
    transformHidden: "translateY(-5px)",
    transformVisible: "translateY(0)",
  },
  right: {
    top: 0,
    left: "100%",
    marginLeft: "8px",
    transformHidden: "translateY(-5px)",
    transformVisible: "translateY(0)",
  },
  bottomLeft: {
    top: "100%",
    left: 0,
    marginTop: "8px",
    transformHidden: "translateY(-5px)",
    transformVisible: "translateY(0)",
  },
  bottomRight: {
    top: "100%",
    left: "auto",
    right: 0,
    marginTop: "8px",
    transformHidden: "translateY(-5px)",
    transformVisible: "translateY(0)",
  },
  topRight: {
    top: "auto",
    bottom: "100%",
    left: "auto",
    right: 0,
    marginTop: 0,
    marginBottom: "8px",
    transformHidden: "translateY(5px)",
    transformVisible: "translateY(0)",
  },
};

// When tooltip has an action, delay before hiding after pointer leaves trigger so user can cross the gap
const INTERACTIVE_HIDE_DELAY_MS = 150;

const PORTAL_Z_INDEX = 20000;

/** Marks the tooltip surface so tap-to-toggle does not fire when using controls inside the panel. */
const TOOLTIP_PANEL_ATTR = "data-infotooltip-panel";

/**
 * Fixed placement for portaled tooltips (viewport coordinates from getBoundingClientRect).
 * @param {string} position
 * @param {DOMRect} rect
 */
function buildPortalFixedPlacement(position, rect) {
  if (typeof window === "undefined") {
    return { position: "fixed", top: 0, left: 0, margin: 0 };
  }
  const m = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const auto = "auto";
  const base = { position: "fixed", margin: 0 };

  switch (position) {
    case "right":
      return { ...base, top: rect.top, left: rect.right + m, right: auto, bottom: auto };
    case "left":
      return { ...base, top: rect.top, left: rect.left - m, right: auto, bottom: auto };
    case "bottomLeft":
      return { ...base, top: rect.bottom + m, left: rect.left, right: auto, bottom: auto };
    case "bottomRight":
      return { ...base, top: rect.bottom + m, right: vw - rect.right, left: auto, bottom: auto };
    case "topRight":
      return {
        ...base,
        bottom: vh - rect.top + m,
        right: vw - rect.right,
        left: auto,
        top: auto,
      };
    default:
      return buildPortalFixedPlacement("bottomLeft", rect);
  }
}

/**
 * Info icon with a hover tooltip, or a custom trigger with tooltip.
 *
 * - content only (or children only): renders info icon + tooltip; content/children = tooltip body.
 * - content + children: uses children as the hover trigger and content as tooltip body (no icon).
 *
 * @param {React.ReactNode} content - Tooltip content (string or node).
 * @param {React.ReactNode} [children] - If content is also set, used as custom trigger (e.g. a button). Otherwise used as tooltip body.
 * @param {string} [iconSrc="/assets/icons/info.svg"] - Icon image source (when no custom trigger).
 * @param {object} [iconStyle] - Override styles for the icon.
 * @param {object} [tooltipStyle] - Override styles for the tooltip container.
 * @param {object} [wrapperStyle] - Override styles for the wrapper (e.g. width when used as custom trigger).
 * @param {number} [delayMs=0] - Delay in milliseconds before the tooltip appears on hover. Leave before this time cancels showing.
 * @param {React.ReactNode} [action] - Optional node (e.g. link/button) rendered below the tooltip content. When present, the tooltip is interactive: it stays visible when the pointer is over the trigger or the tooltip so the user can click the action. The trigger is also keyboard-activatable and tap/click-to-toggle so touch users can open it; outside tap and Escape dismiss when opened that way.
 * @param {"left"|"right"|"bottomLeft"|"bottomRight"|"topRight"} [position="bottomLeft"] - Tooltip placement.
 * @param {boolean} [portal=false] - Render the tooltip in `document.body` with `position: fixed` so it is not clipped by ancestor `overflow: hidden`. Ignored when `action` is set (interactive tooltips must stay inside the wrapper hover target).
 */
export default function InfoTooltip({
  content,
  children,
  iconSrc = "/assets/icons/info.svg",
  iconStyle,
  tooltipStyle,
  wrapperStyle: wrapperStyleOverride,
  delayMs = 0,
  action,
  position = "bottomLeft",
  portal = false,
}) {
  const [triggerHover, setTriggerHover] = useState(false);
  const [tooltipHover, setTooltipHover] = useState(false);
  /** Tap/click-to-open so tactile devices can use interactive tooltips (action prop). */
  const [tapPinned, setTapPinned] = useState(false);
  const [portalRect, setPortalRect] = useState(null);
  const showTimeoutRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const wrapperRef = useRef(null);

  const visible =
    action != null ? triggerHover || tooltipHover || tapPinned : triggerHover;
  const usePortal = Boolean(portal && action == null);

  const handleTriggerClick = useCallback(
    (e) => {
      if (action == null) return;
      e.stopPropagation();
      setTapPinned((p) => !p);
    },
    [action]
  );

  const handleTriggerKeyDown = useCallback(
    (e) => {
      if (action == null) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setTapPinned((p) => !p);
      }
    },
    [action]
  );

  useEffect(() => {
    if (action == null || !tapPinned) return;
    const onPointerDown = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setTapPinned(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [action, tapPinned]);

  useEffect(() => {
    if (action == null || !tapPinned) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setTapPinned(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [action, tapPinned]);

  const clearShowTimeout = useCallback(() => {
    if (showTimeoutRef.current != null) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
  }, []);

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current != null) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    clearShowTimeout();
    clearHideTimeout();
    if (delayMs <= 0) {
      setTriggerHover(true);
      return;
    }
    showTimeoutRef.current = setTimeout(() => setTriggerHover(true), delayMs);
  }, [delayMs, clearShowTimeout, clearHideTimeout]);

  const handleMouseLeave = useCallback(() => {
    clearShowTimeout();
    if (action != null) {
      clearHideTimeout();
      hideTimeoutRef.current = setTimeout(
        () => setTriggerHover(false),
        INTERACTIVE_HIDE_DELAY_MS
      );
    } else {
      setTriggerHover(false);
    }
  }, [clearShowTimeout, clearHideTimeout, action]);

  const handleTooltipMouseEnter = useCallback(() => {
    clearHideTimeout();
    setTooltipHover(true);
  }, [clearHideTimeout]);
  const handleTooltipMouseLeave = useCallback(() => setTooltipHover(false), []);

  useEffect(() => {
    return () => {
      clearShowTimeout();
      clearHideTimeout();
    };
  }, [clearShowTimeout, clearHideTimeout]);

  useLayoutEffect(() => {
    if (!usePortal || !visible || wrapperRef.current == null) return;
    setPortalRect(wrapperRef.current.getBoundingClientRect());
  }, [usePortal, visible]);

  useEffect(() => {
    if (!usePortal || !visible) return;
    const el = wrapperRef.current;
    const update = () => {
      if (el) setPortalRect(el.getBoundingClientRect());
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [usePortal, visible]);

  const useCustomTrigger = content != null && children != null;

  const handleInteractiveZoneClick = useCallback(
    (e) => {
      if (action == null || !useCustomTrigger) return;
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (t.closest(`[${TOOLTIP_PANEL_ATTR}]`)) return;
      const nested = t.closest(
        "button, a, input, select, textarea, [contenteditable='true']"
      );
      const root = wrapperRef.current;
      if (nested && root && root.contains(nested) && nested !== root) return;
      e.stopPropagation();
      setTapPinned((p) => !p);
    },
    [action, useCustomTrigger]
  );

  const tooltipContent = useCustomTrigger ? content : content ?? children;
  const mergedIconStyle = { ...defaultIconStyle, ...iconStyle };
  const positionConfig = POSITION_STYLES[position] ?? POSITION_STYLES.bottomLeft;
  const { transformHidden, transformVisible, ...positionPlacement } =
    positionConfig;
  const portalFixedPlacement =
    usePortal && portalRect != null
      ? buildPortalFixedPlacement(position, portalRect)
      : null;
  const portalTransformPrefix = position === "left" ? "translateX(-100%) " : "";
  const mergedTooltipStyle = {
    ...defaultTooltipStyle,
    ...(portalFixedPlacement ?? positionPlacement),
    ...tooltipStyle,
    opacity: visible ? 1 : 0,
    transform: visible
      ? `${portalTransformPrefix}${transformVisible}`
      : `${portalTransformPrefix}${transformHidden}`,
    ...(action != null && { pointerEvents: visible ? "auto" : "none" }),
    ...(usePortal && { zIndex: PORTAL_Z_INDEX }),
  };

  const baseWrapperStyle = useCustomTrigger
    ? { position: "relative", display: "inline-block" }
    : {
        position: "relative",
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
      };
  const wrapperStyle = { ...baseWrapperStyle, ...wrapperStyleOverride };

  const tooltipEl = (
    <div
      {...{ [TOOLTIP_PANEL_ATTR]: "" }}
      style={mergedTooltipStyle}
      {...(action != null && {
        onMouseEnter: handleTooltipMouseEnter,
        onMouseLeave: handleTooltipMouseLeave,
      })}
    >
      {typeof tooltipContent === "string" ? (
        <span>{tooltipContent}</span>
      ) : (
        tooltipContent
      )}
      {action != null && <div style={{ marginTop: "8px" }}>{action}</div>}
    </div>
  );

  return (
    <div
      ref={wrapperRef}
      style={wrapperStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={action != null && useCustomTrigger ? handleInteractiveZoneClick : undefined}
    >
      {useCustomTrigger ? (
        children
      ) : action != null ? (
        <span
          role="button"
          tabIndex={0}
          aria-expanded={visible}
          onClick={handleTriggerClick}
          onKeyDown={handleTriggerKeyDown}
          style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}
        >
          <img src={iconSrc} alt="info" style={mergedIconStyle} />
        </span>
      ) : (
        <img src={iconSrc} alt="info" style={mergedIconStyle} />
      )}
      {!usePortal && tooltipEl}
      {usePortal &&
        typeof document !== "undefined" &&
        portalRect != null &&
        createPortal(tooltipEl, document.body)}
    </div>
  );
}

