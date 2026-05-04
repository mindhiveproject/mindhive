"use client";

import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import useTranslation from "next-translate/useTranslation";

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
  boxSizing: "border-box",
};

const ITEM_STYLE = {
  display: "flex",
  alignItems: "center",
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
};

const PANEL_STYLE = {
  backgroundColor: "#ffffff",
  border: "1px solid #a1a1a1",
  borderRadius: "8px",
  boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
  overflow: "hidden",
  minWidth: "200px",
  zIndex: 10000,
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
}) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [rect, setRect] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const searchInputRef = useRef(null);

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
    if (open && triggerRef.current) {
      setRect(triggerRef.current.getBoundingClientRect());
    } else {
      setRect(null);
    }
  }, [open, displayLabel, value]);

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
        flexShrink: 0,
        textAlign: "left",
        whiteSpace: "nowrap",
        color: "#5D5763",
      }
    : {
        flex: 1,
        minWidth: 0,
        textAlign: "left",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        color: "#5D5763",
      };

  const triggerIcon = icon === undefined ? CHEVRON : icon;

  return (
    <div ref={triggerRef} style={rootStyle}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
        style={triggerMerged}
      >
        <span style={labelSpanStyle}>{displayLabel}</span>
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
      {open &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              ...PANEL_STYLE,
              position: "fixed",
              top: rect.bottom + 4,
              left: rect.left,
              width: Math.max(rect.width, 200),
              maxHeight: "min(320px, 50vh)",
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
                placeholder={t("dropdownSelect.searchPlaceholder", "Search options")}
                aria-label={t("dropdownSelect.searchPlaceholder", "Search options")}
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
                  {t("dropdownSelect.noMatchingOptions", "No matching options")}
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
        )}
    </div>
  );
}
