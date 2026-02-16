"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const defaultIconStyle = {
  width: "20px",
  height: "20px",
  flexShrink: 0,
  filter: "brightness(0) saturate(100%) invert(28%) sepia(8%) saturate(1200%) hue-rotate(240deg) brightness(95%) contrast(85%)",
};

const defaultTooltipStyle = {
  position: "absolute",
  top: "100%",
  left: 0,
  width: "400px",
  background: "#ffffff",
  color: "#625B71",
  marginTop: "8px",
  padding: "12px 16px",
  border: "1px solid #5D5763",
  borderRadius: "16px",
  fontSize: "16px",
  fontFamily: "Inter, sans-serif",
  lineHeight: "20px",
  opacity: 0,
  transform: "translateX(-5px)",
  transition: "all 0.3s ease",
  pointerEvents: "none",
  zIndex: 1000,
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.10)",
};

// When tooltip has an action, delay before hiding after pointer leaves trigger so user can cross the gap
const INTERACTIVE_HIDE_DELAY_MS = 150;

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
}) {
  const [triggerHover, setTriggerHover] = useState(false);
  const [tooltipHover, setTooltipHover] = useState(false);
  const showTimeoutRef = useRef(null);
  const hideTimeoutRef = useRef(null);

  const hover = action != null ? (triggerHover || tooltipHover) : triggerHover;

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
      hideTimeoutRef.current = setTimeout(() => setTriggerHover(false), INTERACTIVE_HIDE_DELAY_MS);
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

  const useCustomTrigger = content != null && children != null;
  const tooltipContent = useCustomTrigger ? content : (content ?? children);
  const mergedIconStyle = { ...defaultIconStyle, ...iconStyle };
  const mergedTooltipStyle = {
    ...defaultTooltipStyle,
    ...tooltipStyle,
    opacity: hover ? 1 : 0,
    transform: hover ? "translateY(0)" : "translateY(-5px)",
    ...(action != null && { pointerEvents: hover ? "auto" : "none" }),
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

  return (
    <div
      style={wrapperStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {useCustomTrigger ? children : <img src={iconSrc} alt="info" style={mergedIconStyle} />}
      <div
        style={mergedTooltipStyle}
        {...(action != null && {
          onMouseEnter: handleTooltipMouseEnter,
          onMouseLeave: handleTooltipMouseLeave,
        })}
      >
        {typeof tooltipContent === "string" ? <span>{tooltipContent}</span> : tooltipContent}
        {action != null && <div style={{ marginTop: "8px" }}>{action}</div>}
      </div>
    </div>
  );
}
