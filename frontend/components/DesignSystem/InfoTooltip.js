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
 * @param {React.ReactNode} [action] - Optional node (e.g. link/button) rendered below the tooltip content. When present, the tooltip is interactive: it stays visible when the pointer is over the trigger or the tooltip so the user can click the action.
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
  const [portalRect, setPortalRect] = useState(null);
  const showTimeoutRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const wrapperRef = useRef(null);

  const hover = action != null ? triggerHover || tooltipHover : triggerHover;
  const usePortal = Boolean(portal && action == null);

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
    if (!usePortal || !hover || wrapperRef.current == null) return;
    setPortalRect(wrapperRef.current.getBoundingClientRect());
  }, [usePortal, hover]);

  useEffect(() => {
    if (!usePortal || !hover) return;
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
  }, [usePortal, hover]);

  const useCustomTrigger = content != null && children != null;
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
    opacity: hover ? 1 : 0,
    transform: hover
      ? `${portalTransformPrefix}${transformVisible}`
      : `${portalTransformPrefix}${transformHidden}`,
    ...(action != null && { pointerEvents: hover ? "auto" : "none" }),
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
    >
      {useCustomTrigger ? (
        children
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

