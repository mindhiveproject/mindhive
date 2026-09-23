"use client";

import { Fragment, useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback, useReducer, useId } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import clsx from "clsx";
import useTranslation from "next-translate/useTranslation";

import RawTooltip from "./Tooltip";
import {
  clampDropdownPanelLeft,
  computeDropdownVerticalPlacement,
  DROPDOWN_VIEWPORT_GAP,
  getIdealMaxPanelHeight,
  type DropdownPlacement,
} from "./dropdownViewportPlacement";

// Tooltip is still plain JS; TS 4.9 mis-infers its destructured props param from
// the JSDoc. Assert its real contract here until DesignSystem/Tooltip is on TS.
const Tooltip = RawTooltip as unknown as React.FC<{
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  delayMs?: number;
  className?: string;
}>;

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

const TRIGGER_TOOLTIP_DELAY_MS = 1500;

/**
 * Root + trigger. The default trigger look sits behind the `--default`
 * modifier so a caller's `triggerClassName` fully owns the look instead of
 * fighting it on specificity. Callers can still reach the label through
 * `[data-dropdown-label]` (see ConnectNavigationBar, StyledReview).
 */
const StyledDropdownSelect = styled.div`
  position: relative;
  width: 100%;

  &.DesignSystem-DropdownSelect--fit {
    width: fit-content;
    max-width: 100%;
  }
  &.DesignSystem-DropdownSelect--open {
    z-index: 1001;
  }

  .DesignSystem-DropdownSelect-trigger--default {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid #a1a1a1;
    background: transparent;
    color: #5d5763;
    cursor: pointer;
  }
  &.DesignSystem-DropdownSelect--fit .DesignSystem-DropdownSelect-trigger {
    width: auto;
    max-width: 100%;
    display: inline-flex;
    flex-wrap: nowrap;
  }
  .DesignSystem-DropdownSelect-trigger:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .DesignSystem-DropdownSelect-label {
    flex: 1 1 0%;
    min-width: 0;
    max-width: 100%;
    text-align: left;
    overflow: hidden;
  }
  /* Plain-text labels clamp to three lines; the full text goes in a tooltip
     once it's clipped. Rich (ReactNode) labels are left alone. */
  .DesignSystem-DropdownSelect-label--text {
    color: inherit;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    text-overflow: ellipsis;
  }

  .DesignSystem-DropdownSelect-icon {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    line-height: 0;
  }
`;

/**
 * The option panel. Rules are nested under the panel (rather than one styled
 * component per row) so they outrank the global `MH-Type-*` classes the rows
 * also carry.
 */
const StyledPanel = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 200px;
  background-color: #ffffff;
  border: 1px solid #a1a1a1;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  /* Above Semantic UI modals/dimmers (~1000–1002) and nested overlays; avoids
     frosted-dimmer smearing portaled panels */
  z-index: 100050;
  isolation: isolate;
  filter: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;

  .DesignSystem-DropdownSelect-search {
    width: 100%;
    box-sizing: border-box;
    padding: 8px 12px;
    border: none;
    border-bottom: 1px solid #e6e6e6;
    color: #5d5763;
    outline: none;
    background: #ffffff;
  }

  .DesignSystem-DropdownSelect-listbox {
    overflow-y: auto;
    flex: 1;
    min-height: 0;
  }

  .DesignSystem-DropdownSelect-option {
    display: flex;
    align-items: flex-start;
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: transparent;
    color: #5d5763;
    font-weight: 500;
    text-align: left;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .DesignSystem-DropdownSelect-option:hover:not(:disabled):not(.DesignSystem-DropdownSelect-option--selected) {
    background-color: #f5f5f5;
  }
  .DesignSystem-DropdownSelect-option--selected {
    background-color: var(--MH-Theme-Primary-Light, #def8fb);
    font-weight: 600;
  }
  .DesignSystem-DropdownSelect-option:disabled {
    color: #a1a1a1;
    cursor: not-allowed;
  }

  .DesignSystem-DropdownSelect-group {
    padding: 8px 12px 4px;
    font-weight: 600;
    color: #6a6a6a;
    overflow-wrap: anywhere;
  }

  .DesignSystem-DropdownSelect-empty {
    padding: 8px 12px;
    color: #6a6a6a;
    font-weight: 400;
  }
`;

/** One selectable row of a {@link DropdownSelect}. */
export interface DropdownSelectOption {
  /** Value reported to `onChange`; compared as a string. */
  value: string;
  /** Row content. When this is a ReactNode, also pass `labelText`. */
  label: React.ReactNode;
  /** Plain-text label used for search and the trigger when `label` is a ReactNode. */
  labelText?: string;
  /**
   * Lists the option under a header of this name, after the ungrouped ones.
   * Groups keep the order they first appear in, even if their options aren't
   * contiguous in `options`.
   */
  group?: string;
  /** Shows the row but blocks selecting it. */
  disabled?: boolean;
}

interface DropdownSelectBaseProps {
  /**
   * Selectable options. When `label` is a ReactNode, pass `labelText` for
   * search/trigger stringification.
   * @default []
   */
  options?: DropdownSelectOption[];
  /** Accessible name for the trigger (required for a11y if no visible label). */
  ariaLabel?: string;
  /** Per-instance override for the trigger's styles, layered on top. */
  triggerStyle?: React.CSSProperties;
  /**
   * Class for the trigger button. When set, the default trigger styling is
   * dropped so the class fully owns the look (e.g. a Navbar item).
   */
  triggerClassName?: string;
  /**
   * Size the control to its label instead of stretching full width.
   * @default false
   */
  fitContent?: boolean;
  /**
   * Shown in the trigger when nothing is selected: single-select (no matching
   * `value`) or multi-select (empty array).
   * @default ""
   */
  placeholder?: string;
  /**
   * When `multiple`, show a type-to-filter field above the options.
   * @default true
   */
  searchableMultiple?: boolean;
  /**
   * When not `multiple`, show a type-to-filter field above the options.
   * @default false
   */
  searchableSingle?: boolean;
  /**
   * Replaces the default chevron after the label. Omit for the built-in
   * chevron; pass `null` to show no trailing icon.
   */
  icon?: React.ReactNode;
  /** Optional icon before the label; leaves the trailing chevron in place. */
  leadingIcon?: React.ReactNode;
  /**
   * Vertical placement; `auto` flips when there is not enough space below.
   * @default "auto"
   */
  placement?: DropdownPlacement;
  /**
   * Disables trigger interactions and closes the menu.
   * @default false
   */
  disabled?: boolean;
  /**
   * Mount the panel in `document.body` to avoid overflow clipping.
   * @default false
   */
  portal?: boolean;
}

/** Props for a single-select {@link DropdownSelect} (the default). */
export interface DropdownSelectSingleProps extends DropdownSelectBaseProps {
  /** Single-select: picking an option closes the menu. */
  multiple?: false;
  /** Selected value. */
  value?: string | null;
  /** Called with the picked option's value. */
  onChange?: (next: string) => void;
}

/** Props for a multi-select {@link DropdownSelect}. */
export interface DropdownSelectMultipleProps extends DropdownSelectBaseProps {
  /** Multi-select: options toggle on click and the menu stays open until outside click/Escape. */
  multiple: true;
  /** Selected values. */
  value?: string[];
  /** Called with the full next selection. */
  onChange?: (next: string[]) => void;
}

/**
 * Props for {@link DropdownSelect}.
 *
 * @example
 * <DropdownSelect
 *   value={sort}
 *   onChange={setSort}
 *   ariaLabel="Sort by"
 *   options={[{ value: "new", label: "Newest" }, { value: "old", label: "Oldest" }]}
 * />
 *
 * @example
 * // Multi-select with grouped options
 * <DropdownSelect
 *   multiple
 *   value={ids}
 *   onChange={setIds}
 *   placeholder="Pick columns"
 *   options={[{ value: "a", label: "A", group: "Task 1" }, { value: "b", label: "B", group: "Task 2" }]}
 * />
 */
export type DropdownSelectProps = DropdownSelectSingleProps | DropdownSelectMultipleProps;

function getOptionLabelString(opt: DropdownSelectOption | undefined): string {
  if (!opt) return "";
  if (typeof opt.labelText === "string" || typeof opt.labelText === "number") {
    return String(opt.labelText);
  }
  const { label } = opt;
  if (typeof label === "string" || typeof label === "number") {
    return String(label);
  }
  return String(opt.value ?? "");
}

interface PanelLayout {
  top: number;
  maxHeight: number;
  left: number;
  width: number;
}

/**
 * Dropdown select. Single-select (default) or multi-select (`multiple`); the
 * panel can portal to `document.body` to escape overflow clipping.
 */
export default function DropdownSelect(props: DropdownSelectProps) {
  const {
    value,
    options = [],
    ariaLabel,
    triggerStyle = {},
    triggerClassName,
    fitContent = false,
    multiple = false,
    placeholder = "",
    searchableMultiple = true,
    searchableSingle = false,
    icon,
    leadingIcon,
    placement = "auto",
    disabled = false,
    portal = false,
  } = props;
  const onChange = props.onChange as ((next: string | string[]) => void) | undefined;

  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [panelLayout, setPanelLayout] = useState<PanelLayout | null>(null);
  const [panelLayoutTick, bumpPanelLayout] = useReducer((n: number) => n + 1, 0);
  const [isTriggerLabelTruncated, setIsTriggerLabelTruncated] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const dropdownId = useId();

  const selectedIds = useMemo(() => {
    if (!multiple) return null;
    return Array.isArray(value) ? value : [];
  }, [multiple, value]);

  const displayLabel = useMemo<React.ReactNode>(() => {
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
      // Prefer labelText when label is a ReactNode (menu can stay rich; trigger stays plain text).
      if (
        typeof selected.label === "string" ||
        typeof selected.label === "number"
      ) {
        return selected.label;
      }
      const fromLabelText = getOptionLabelString(selected);
      return fromLabelText || placeholder;
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

  // Ungrouped options keep their order at the top; each group follows, in the
  // order it first appears, so a group is one block even if its options weren't
  // contiguous in `options`.
  const optionSections = useMemo(() => {
    type Section = { group: string | null; options: DropdownSelectOption[] };
    const sections: Section[] = [{ group: null, options: [] }];
    const byGroup = new Map<string, Section>();
    filteredOptions.forEach((opt) => {
      if (!opt.group) {
        sections[0].options.push(opt);
        return;
      }
      let section = byGroup.get(opt.group);
      if (!section) {
        section = { group: opt.group, options: [] };
        byGroup.set(opt.group, section);
        sections.push(section);
      }
      section.options.push(opt);
    });
    return sections;
  }, [filteredOptions]);

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
    if (!open || searchEnabled) return undefined;
    const frame = requestAnimationFrame(() => {
      panelRef.current
        ?.querySelector<HTMLElement>('[role="option"][aria-selected="true"]:not(:disabled), button:not(:disabled)')
        ?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open, searchEnabled]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
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
    if (!disabled) return;
    setOpen(false);
  }, [disabled]);

  const closeAndRestoreFocus = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => {
      triggerRef.current?.querySelector<HTMLElement>("button:not(:disabled)")?.focus();
    });
  }, []);

  const moveOptionFocus = (key: string) => {
    const optionButtons = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>('[role="option"]:not(:disabled)') ?? []
    );
    if (optionButtons.length === 0) return;
    const currentIndex = optionButtons.indexOf(document.activeElement as HTMLElement);
    const lastIndex = optionButtons.length - 1;
    let nextIndex = currentIndex < 0 ? 0 : currentIndex;
    if (key === "Home") nextIndex = 0;
    if (key === "End") nextIndex = lastIndex;
    if (key === "ArrowUp") nextIndex = Math.max(0, currentIndex - 1);
    if (key === "ArrowDown") nextIndex = Math.min(lastIndex, currentIndex + 1);
    optionButtons[nextIndex]?.focus();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeAndRestoreFocus();
      }
    };
    if (open) {
      document.addEventListener("keydown", onKey);
    }
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeAndRestoreFocus]);

  const handleSelect = (next: string) => {
    const selectedOption = options.find((opt) => String(opt.value) === String(next));
    if (selectedOption?.disabled) return;

    if (multiple) {
      const current = Array.isArray(value) ? [...value] : [];
      const idx = current.findIndex((v) => String(v) === String(next));
      const nextArr =
        idx >= 0 ? current.filter((_, i) => i !== idx) : [...current, next];
      onChange?.(nextArr);
      return;
    }
    onChange?.(next);
    setOpen(false);
  };

  const triggerIcon = icon === undefined ? CHEVRON : icon;
  const isPlainTextLabel =
    typeof displayLabel === "string" || typeof displayLabel === "number";
  const tooltipContent = isPlainTextLabel ? String(displayLabel) : "";

  const buttonNode = (
    <button
      type="button"
      className={clsx(
        "DesignSystem-DropdownSelect-trigger",
        triggerClassName ?? "DesignSystem-DropdownSelect-trigger--default MH-Type-Label-Base"
      )}
      disabled={disabled}
      aria-disabled={disabled}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={`${dropdownId}-listbox`}
      aria-label={ariaLabel}
      id={`${dropdownId}-trigger`}
      onClick={() => {
        if (disabled) return;
        setOpen((prev) => !prev);
      }}
      style={triggerStyle}
    >
      {leadingIcon != null ? (
        <span className="DesignSystem-DropdownSelect-icon">{leadingIcon}</span>
      ) : null}
      {/* data-dropdown-label lets a caller's stylesheet reach the label, e.g.
          to hide it at narrow widths and leave an icon-only trigger. */}
      <span
        ref={labelRef}
        data-dropdown-label
        className={clsx(
          "DesignSystem-DropdownSelect-label",
          isPlainTextLabel && "DesignSystem-DropdownSelect-label--text"
        )}
      >
        {displayLabel}
      </span>
      {triggerIcon != null ? (
        <span className="DesignSystem-DropdownSelect-icon">{triggerIcon}</span>
      ) : null}
    </button>
  );

  const renderPanel = () => {
    const tr = triggerRef.current?.getBoundingClientRect();
    if (!tr || !triggerRef.current) return null;
    const innerH = window.innerHeight;
    const innerW = window.innerWidth;
    const panelWidth = Math.max(tr.width, 200);
    const provisional: PanelLayout = {
      top: tr.bottom + DROPDOWN_VIEWPORT_GAP,
      maxHeight: getIdealMaxPanelHeight(innerH),
      left: clampDropdownPanelLeft(tr.left, panelWidth, innerW),
      width: panelWidth,
    };
    const fixed = panelLayout ?? provisional;
    return createPortal(
      <StyledPanel
        ref={panelRef}
        className="DesignSystem-DropdownSelect-Panel"
        style={{
          position: portal ? "fixed" : "absolute",
          top: portal ? fixed.top : fixed.top - tr.top,
          left: portal ? fixed.left : fixed.left - tr.left,
          width: fixed.width,
          maxHeight: fixed.maxHeight,
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
            className="DesignSystem-DropdownSelect-search MH-Type-Label-Base"
          />
        )}
        <div
          id={`${dropdownId}-listbox`}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={`${dropdownId}-trigger`}
          aria-multiselectable={multiple ? true : undefined}
          className="DesignSystem-DropdownSelect-listbox"
          onKeyDown={(e) => {
            if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
              e.preventDefault();
              moveOptionFocus(e.key);
            }
          }}
        >
          {filteredOptions.length === 0 ? (
            <div className="DesignSystem-DropdownSelect-empty MH-Type-Body-Base">
              {t("dropdownSelect.noMatchingOptions", {}, { default: "No matching options" })}
            </div>
          ) : (
            optionSections.map((section) => (
              <Fragment key={section.group ?? "__ungrouped"}>
                {section.group ? (
                  <div
                    role="presentation"
                    className="DesignSystem-DropdownSelect-group MH-Type-Label-Base"
                  >
                    {section.group}
                  </div>
                ) : null}
                {section.options.map((opt) => {
                  const isSelected = multiple
                    ? (selectedIds ?? []).some((id) => String(id) === String(opt.value))
                    : opt.value === value;
                  const isDisabled = !!opt.disabled;
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      className={clsx(
                        "DesignSystem-DropdownSelect-option MH-Type-Label-Base",
                        isSelected && "DesignSystem-DropdownSelect-option--selected"
                      )}
                      disabled={isDisabled}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={isDisabled}
                      onClick={() => handleSelect(opt.value)}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </Fragment>
            ))
          )}
        </div>
      </StyledPanel>,
      portal ? document.body : triggerRef.current
    );
  };

  return (
    <StyledDropdownSelect
      ref={triggerRef}
      className={clsx(
        "DesignSystem-DropdownSelect",
        fitContent && "DesignSystem-DropdownSelect--fit",
        open && "DesignSystem-DropdownSelect--open"
      )}
    >
      {tooltipContent && isTriggerLabelTruncated ? (
        <Tooltip
          content={tooltipContent}
          side="right"
          delayMs={TRIGGER_TOOLTIP_DELAY_MS}
          className="DesignSystem-Tooltip-trigger--fill"
        >
          {buttonNode}
        </Tooltip>
      ) : (
        buttonNode
      )}
      {open && !disabled && renderPanel()}
    </StyledDropdownSelect>
  );
}
