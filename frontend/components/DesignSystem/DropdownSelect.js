"use client";

import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback, useReducer } from "react";
import { createPortal } from "react-dom";
import useTranslation from "next-translate/useTranslation";

import InfoTooltip from "./InfoTooltip";
import {
  clampDropdownPanelLeft,
  computeDropdownVerticalPlacement,
  DROPDOWN_VIEWPORT_GAP,
  getIdealMaxPanelHeight,
} from "./dropdownViewportPlacement";

const CHEVRON = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="#A1A1A1"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
    aria-hidden
  >
    <path d="M7 10l5 5 5-5H7z" fill="currentColor" />
  </svg>
);

const DEFAULT_TRIGGER_STYLE = {
  borderRadius: "8px",
  border: "1px solid #A1A1A1",
  background: "transparent",
  color: "#5D5763",
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  lineHeight: "20px",
  fontWeight: 500,
  padding: "8px 12px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
};

const ITEM_STYLE = {
  display: "flex",
  alignItems: "flex-start",
  padding: "8px 12px",
  fontFamily: "Inter, sans-serif",
  fontWeight: 500,
  fontSize: "14px",
  lineHeight: "20px",
  letterSpacing: "0.15px",
  cursor: "pointer",
  transition: "background-color 0.2s",
  border: "none",
  width: "100%",
  textAlign: "left",
  background: "transparent",
  color: "#5D5763",
  whiteSpace: "normal",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const PANEL_STYLE = {
  backgroundColor: "#ffffff",
  border: "1px solid #a1a1a1",
  borderRadius: "8px",
  boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
  overflow: "hidden",
  minWidth: "200px",
  /* Above Semantic UI modals/dimmers (~1000–1002) and nested overlays; avoids frosted-dimmer smearing portaled panels */
  zIndex: 100050,
  isolation: "isolate",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const SEARCH_INPUT_STYLE = {
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 12px",
  border: "none",
  borderBottom: "1px solid #e6e6e6",
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  lineHeight: "20px",
  fontWeight: 500,
  color: "#5D5763",
  outline: "none",
  background: "#ffffff",
};

const TRIGGER_LABEL_LINE_CLAMP = 3;
const TRIGGER_TOOLTIP_DELAY_MS = 1500;

function getOptionLabelString(opt) {
  if (!opt) return "";
  const { label } = opt;
  if (typeof label === "string" || typeof label === "number") {
    return String(label);
  }
  return String(opt.value ?? "");
}

/**
 * Dropdown with portal (avoids clipping in overflow containers).
 * Single-select (default) or multi-select (`multiple`).
 *
 * @param {string|string[]} value - Selected value(s). When `multiple`, use `string[]`.
 * @param {(next: string) => void | (next: string[]) => void} onChange - Called with the new value or array when user picks option(s).
 * @param {Array<{ value: string, label: React.ReactNode }>} options - Selectable options.
 * @param {string} [ariaLabel] - Accessible name for the trigger (required for a11y if no visible label).
 * @param {React.CSSProperties} [triggerStyle] - Optional override for trigger button styles.
 * @param {boolean} [fitContent=false] - When true, the control sizes to its label (no full-width stretch).
 * @param {boolean} [multiple=false] - When true, value is `string[]`, options toggle on click, menu stays open until outside/Escape.
 * @param {string} [placeholder] - Shown in the trigger when nothing is selected: single-select (no matching `value`) or multi-select (empty array).
 * @param {boolean} [searchableMultiple=true] - When `multiple`, show a type-to-filter field above the options (default true).
 * @param {boolean} [searchableSingle=false] - When not `multiple`, show a type-to-filter field above the options (default false).
 * @param {React.ReactNode} [icon] - Replaces the default chevron after the label. Omit for built-in chevron; pass `null` to show no trailing icon.
 * @param {'auto'|'below'|'above'} [placement='auto'] - Vertical placement; `auto` flips when there is not enough space below.
 */
export default function DropdownSelect({
  value,
  onChange,
  options = [],
  ariaLabel,
  triggerStyle = {},
  fitContent = false,
  multiple = false,
  placeholder = "",
  searchableMultiple = true,
  searchableSingle = false,
  icon,
  placement = "auto",
}) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [panelLayout, setPanelLayout] = useState(null);
  const [panelLayoutTick, bumpPanelLayout] = useReducer((n) => n + 1, 0);
  const [isTriggerLabelTruncated, setIsTriggerLabelTruncated] = useState(false);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const searchInputRef = useRef(null);
  const labelRef = useRef(null);

  const selectedIds = useMemo(() => {
    if (!multiple) return null;
    return Array.isArray(value) ? value : [];
  }, [multiple, value]);

  const displayLabel = useMemo(() => {
    if (multiple) {
      const ids = selectedIds ?? [];
      if (ids.length === 0) {
        return placeholder;
      }
      const parts = ids.map((id) => {
        const o = options.find((x) => String(x.value) === String(id));
        if (!o) return "";
        return getOptionLabelString(o);
      }).filter(Boolean);
      return parts.join(", ");
    }
    const selected = options.find((o) => o.value === value);
    if (selected) {
      return selected.label ?? "";
    }
    return placeholder;
  }, [multiple, selectedIds, options, value, placeholder]);

  const searchEnabled = multiple ? searchableMultiple : searchableSingle;

  const filteredOptions = useMemo(() => {
    if (!searchEnabled || !searchQuery.trim()) {
      return options;
    }
    const q = searchQuery.trim().toLowerCase();
    return options.filter((opt) =>
      getOptionLabelString(opt).toLowerCase().includes(q)
    );
  }, [searchEnabled, options, searchQuery]);

  useLayoutEffect(() => {
    if (!open) {
      setPanelLayout(null);
      return;
    }
    const tr = triggerRef.current?.getBoundingClientRect();
    const panel = panelRef.current;
    if (!tr || !panel) return;

    const innerH = window.innerHeight;
    const innerW = window.innerWidth;
    const measured = panel.offsetHeight;
    const { top, maxHeight } = computeDropdownVerticalPlacement(
      tr,
      innerH,
      measured,
      placement,
    );
    const panelWidth = Math.max(tr.width, 200);
    const left = clampDropdownPanelLeft(tr.left, panelWidth, innerW);
    setPanelLayout({ top, maxHeight, left, width: panelWidth });
  }, [
    open,
    displayLabel,
    value,
    filteredOptions.length,
    searchEnabled,
    searchQuery,
    placement,
    panelLayoutTick,
  ]);

  useEffect(() => {
    if (!open) return;
    let raf = 0;
    const onViewportChange = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => bumpPanelLayout());
    };
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [open]);

  useEffect(() => {
    if (open && searchEnabled) {
      setSearchQuery("");
    }
  }, [open, searchEnabled]);

  useEffect(() => {
    if (open && searchEnabled && searchInputRef.current) {
      const id = requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [open, searchEnabled]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      const inTrigger = triggerRef.current?.contains(target);
      const inPanel = panelRef.current?.contains(target);
      if (!inTrigger && !inPanel) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const measureTriggerLabel = useCallback(() => {
    const el = labelRef.current;
    if (!el) return;
    const verticalOverflow = el.scrollHeight - el.clientHeight > 1;
    const horizontalOverflow = el.scrollWidth - el.clientWidth > 1;
    setIsTriggerLabelTruncated(verticalOverflow || horizontalOverflow);
  }, []);

  useLayoutEffect(() => {
    measureTriggerLabel();
  }, [displayLabel, measureTriggerLabel, open]);

  useEffect(() => {
    const el = labelRef.current;
    if (!el) return;

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => measureTriggerLabel());
      observer.observe(el);
      return () => observer.disconnect();
    }

    const onResize = () => measureTriggerLabel();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [displayLabel, measureTriggerLabel]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      document.addEventListener("keydown", onKey);
    }
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const handleSelect = (next) => {
    if (multiple) {
      const current = Array.isArray(value) ? [...value] : [];
      const idx = current.findIndex((v) => String(v) === String(next));
      let nextArr;
      if (idx >= 0) {
        nextArr = current.filter((_, i) => i !== idx);
      } else {
        nextArr = [...current, next];
      }
      onChange?.(nextArr);
      return;
    }
    onChange?.(next);
    setOpen(false);
  };

  const rootStyle = fitContent
    ? { position: "relative", zIndex: open ? 1001 : "auto", width: "fit-content", maxWidth: "100%" }
    : { position: "relative", zIndex: open ? 1001 : "auto", width: "100%" };

  const triggerMerged = {
    ...DEFAULT_TRIGGER_STYLE,
    ...(fitContent
      ? {
          width: "auto",
          maxWidth: "100%",
          display: "inline-flex",
          flexWrap: "nowrap",
        }
      : {}),
    ...triggerStyle,
  };

  const labelSpanStyle = fitContent
    ? {
        flex: "1 1 0%",
        minWidth: 0,
        maxWidth: "100%",
        textAlign: "left",
        whiteSpace: "normal",
        overflowWrap: "anywhere",
        wordBreak: "break-word",
        color: "#5D5763",
        overflow: "hidden",
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: TRIGGER_LABEL_LINE_CLAMP,
        lineClamp: TRIGGER_LABEL_LINE_CLAMP,
        textOverflow: "ellipsis",
      }
    : {
        flex: "1 1 0%",
        minWidth: 0,
        textAlign: "left",
        color: "#5D5763",
        overflow: "hidden",
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: TRIGGER_LABEL_LINE_CLAMP,
        lineClamp: TRIGGER_LABEL_LINE_CLAMP,
        whiteSpace: "normal",
        overflowWrap: "anywhere",
        wordBreak: "break-word",
        textOverflow: "ellipsis",
      };

  const triggerIcon = icon === undefined ? CHEVRON : icon;
  const tooltipContent =
    typeof displayLabel === "string" || typeof displayLabel === "number"
      ? String(displayLabel)
      : "";

  const buttonNode = (
    <button
      type="button"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-label={ariaLabel}
      onClick={() => setOpen((prev) => !prev)}
      style={triggerMerged}
    >
      <span ref={labelRef} style={labelSpanStyle}>
        {displayLabel}
      </span>
      {triggerIcon != null ? (
        <span
          style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            lineHeight: 0,
          }}
        >
          {triggerIcon}
        </span>
      ) : null}
    </button>
  );

  return (
    <div ref={triggerRef} style={rootStyle}>
      {tooltipContent && isTriggerLabelTruncated ? (
        <InfoTooltip
          content={tooltipContent}
          position="right"
          portal
          delayMs={TRIGGER_TOOLTIP_DELAY_MS}
          wrapperStyle={{ minWidth: 0, maxWidth: "100%", display: "block" }}
        >
          {buttonNode}
        </InfoTooltip>
      ) : (
        buttonNode
      )}
      {open &&
        (() => {
          const tr = triggerRef.current?.getBoundingClientRect();
          if (!tr) return null;
          const innerH = window.innerHeight;
          const innerW = window.innerWidth;
          const panelWidth = Math.max(tr.width, 200);
          const provisional = {
            top: tr.bottom + DROPDOWN_VIEWPORT_GAP,
            maxHeight: getIdealMaxPanelHeight(innerH),
            left: clampDropdownPanelLeft(tr.left, panelWidth, innerW),
            width: panelWidth,
          };
          const fixed = panelLayout ?? provisional;
          return createPortal(
          <div
            ref={panelRef}
            style={{
              ...PANEL_STYLE,
              position: "fixed",
              top: fixed.top,
              left: fixed.left,
              width: fixed.width,
              maxHeight: fixed.maxHeight,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {searchEnabled && (
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Escape") {
                    e.stopPropagation();
                  }
                }}
                placeholder={t("dropdownSelect.searchPlaceholder", {}, { default: "Search options" })}
                aria-label={t("dropdownSelect.searchPlaceholder", {}, { default: "Search options" })}
                autoComplete="off"
                style={SEARCH_INPUT_STYLE}
              />
            )}
            <div
              role="listbox"
              aria-multiselectable={multiple ? true : undefined}
              style={{
                overflowY: "auto",
                flex: 1,
                minHeight: 0,
              }}
            >
              {filteredOptions.length === 0 ? (
                <div
                  style={{
                    ...ITEM_STYLE,
                    cursor: "default",
                    color: "#6a6a6a",
                    fontWeight: 400,
                  }}
                >
                  {t("dropdownSelect.noMatchingOptions", {}, { default: "No matching options" })}
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = multiple
                    ? (selectedIds ?? []).some((id) => String(id) === String(opt.value))
                    : opt.value === value;
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      style={{
                        ...ITEM_STYLE,
                        fontWeight: isSelected ? 600 : 500,
                        backgroundColor: isSelected ? "#def8fb" : "transparent",
                      }}
                      onClick={() => handleSelect(opt.value)}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = "#f5f5f5";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isSelected ? "#def8fb" : "transparent";
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
          );
        })()}
    </div>
  );
}
