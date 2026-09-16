"use client";

import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import styled from "styled-components";
import clsx from "clsx";

/** Figma `Type` variant: pill ends vs uniform corner radius. */
export type ButtonGroupType = "Round" | "Square";

/** Size scale: XSmall matches Chip height (32px); XLarge is the former Figma Large. */
export type ButtonGroupSize =
  | "XSmall"
  | "Small"
  | "Medium"
  | "Large"
  | "XLarge";

/** Selection model from the Figma / M3 connected-button-group spec. */
export type ButtonGroupSelectionMode = "single" | "multiple";

/**
 * One segment in a {@link ButtonGroup}. Maps to Figma's nested button
 * instances (label + leading icon + selected/enabled).
 */
export interface ButtonGroupItem {
  /** Stable value used for selection. */
  value: string;
  /** Visible label (Figma segment text). */
  label?: ReactNode;
  /** Leading icon (Figma segment icon). Color follows the segment via `currentColor`. */
  icon?: ReactNode;
  /** Disables this segment only. */
  disabled?: boolean;
  /** Accessible name when the label is missing or not descriptive. */
  "aria-label"?: string;
}

export interface ButtonGroupProps {
  /**
   * Figma `Type`. Round morphs the outer ends into a pill; Square keeps a
   * uniform inner radius on unselected segments.
   * @default "Round"
   */
  type?: ButtonGroupType;
  /**
   * Figma `Size`.
   * @default "XSmall"
   */
  size?: ButtonGroupSize;
  /**
   * Figma boolean: show the third segment (Segment 2). Only used when `items`
   * is omitted, to match the design-file placeholder layout.
   * @default true
   */
  show3rdSegment?: boolean;
  /**
   * Figma boolean: show the fourth segment (Segment 3). Only used when `items`
   * is omitted.
   * @default false
   */
  show4thSegment?: boolean;
  /**
   * Figma boolean: show the fifth segment (Segment 4). Only used when `items`
   * is omitted.
   * @default false
   */
  show5thSegment?: boolean;
  /**
   * Segments to render. When omitted, placeholder "Label" segments are built
   * from `show3rdSegment` / `show4thSegment` / `show5thSegment` (always first +
   * end, matching the Figma component).
   */
  items?: ButtonGroupItem[];
  /**
   * `"single"` behaves like a radio group; `"multiple"` toggles each segment.
   * @default "single"
   */
  selectionMode?: ButtonGroupSelectionMode;
  /**
   * When true, the last remaining selection cannot be cleared.
   * @default true
   */
  selectionRequired?: boolean;
  /** Controlled selected value(s). */
  value?: string | string[];
  /** Uncontrolled initial selection. Defaults to the first item. */
  defaultValue?: string | string[];
  /** Fired after a user-driven selection change. */
  onChange?: (value: string | string[]) => void;
  /** Disables every segment. */
  disabled?: boolean;
  /** Stretch the group to the parent width; segments share space equally. */
  fullWidth?: boolean;
  /** Optional id on the group. */
  id?: string;
  /** Accessible name for the group. */
  "aria-label"?: string;
  /** Optional className merged onto the root. */
  className?: string;
}

const PLACEHOLDER_LABEL = "Label";

function placeholderItems(
  show3rdSegment: boolean,
  show4thSegment: boolean,
  show5thSegment: boolean
): ButtonGroupItem[] {
  const items: ButtonGroupItem[] = [
    { value: "segment-1", label: PLACEHOLDER_LABEL },
  ];
  if (show3rdSegment) {
    items.push({ value: "segment-2", label: PLACEHOLDER_LABEL });
  }
  if (show4thSegment) {
    items.push({ value: "segment-3", label: PLACEHOLDER_LABEL });
  }
  if (show5thSegment) {
    items.push({ value: "segment-4", label: PLACEHOLDER_LABEL });
  }
  items.push({ value: "segment-end", label: PLACEHOLDER_LABEL });
  return items;
}

function toArray(value: string | string[] | undefined): string[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function nextSingleValue(
  current: string[],
  next: string,
  selectionRequired: boolean
): string[] {
  if (current.includes(next)) {
    return selectionRequired ? current : [];
  }
  return [next];
}

function nextMultipleValue(
  current: string[],
  next: string,
  selectionRequired: boolean
): string[] {
  if (current.includes(next)) {
    if (selectionRequired && current.length === 1) return current;
    return current.filter((value) => value !== next);
  }
  return [...current, next];
}

const StyledButtonGroup = styled.div`
  display: inline-flex;
  align-items: stretch;
  gap: 2px;
  width: fit-content;
  max-width: 100%;
  box-sizing: border-box;

  &.DesignSystem-ButtonGroup--fullWidth {
    display: flex;
    width: 100%;
  }

  /* Chip-sized: 32px height, Label Base, 18px icon — not larger than Chip. */
  &.DesignSystem-ButtonGroup--xsmall {
    --bg-height: 32px;
    --bg-min-width: 32px;
    --bg-pad-y: 6px;
    --bg-pad-x: 12px;
    --bg-icon-gap: 8px;
    --bg-icon-size: 18px;
    --bg-inner-radius: 4px;
    --bg-outer-radius: 16px;
    --bg-selected-radius: 16px;
    font: var(--MH-Type-Label-Base);
  }

  &.DesignSystem-ButtonGroup--small {
    --bg-height: 40px;
    --bg-min-width: 48px;
    --bg-pad-y: 6px;
    --bg-pad-x: 24px;
    --bg-icon-gap: 4px;
    --bg-icon-size: 20px;
    --bg-inner-radius: 4px;
    --bg-outer-radius: 16px;
    --bg-selected-radius: 24px;
    font: var(--MH-Type-Label-Base);
  }

  &.DesignSystem-ButtonGroup--medium {
    --bg-height: 48px;
    --bg-min-width: 48px;
    --bg-pad-y: 10px;
    --bg-pad-x: 24px;
    --bg-icon-gap: 8px;
    --bg-icon-size: 20px;
    --bg-inner-radius: 8px;
    --bg-outer-radius: 20px;
    --bg-selected-radius: 24px;
    font: var(--MH-Type-Label-Base);
  }

  &.DesignSystem-ButtonGroup--large {
    --bg-height: 56px;
    --bg-min-width: 48px;
    --bg-pad-y: 16px;
    --bg-pad-x: 24px;
    --bg-icon-gap: 8px;
    --bg-icon-size: 24px;
    --bg-inner-radius: 8px;
    --bg-outer-radius: 28px;
    --bg-selected-radius: 100px;
    font: var(--MH-Type-Title-Base);
  }

  /* Former Figma Large — M3 headline/small (24/32 Regular); no MH-Type token
     matches that pair, so the size is spelled out with Inter. */
  &.DesignSystem-ButtonGroup--xlarge {
    --bg-height: 96px;
    --bg-min-width: 48px;
    --bg-pad-y: 32px;
    --bg-pad-x: 48px;
    --bg-icon-gap: 12px;
    --bg-icon-size: 32px;
    --bg-inner-radius: 16px;
    --bg-outer-radius: 48px;
    --bg-selected-radius: 100px;
    font: 400 24px/32px "Inter", sans-serif;
  }

  && button.DesignSystem-ButtonGroup__segment {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    gap: var(--bg-icon-gap);
    min-width: var(--bg-min-width, 48px);
    height: var(--bg-height);
    padding: var(--bg-pad-y) var(--bg-pad-x);
    margin: 0;
    border: none;
    border-radius: var(--bg-inner-radius);
    box-sizing: border-box;
    width: auto;
    max-width: none;
    background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
    color: var(--MH-Theme-Tertiary-Dark, #0d3944);
    letter-spacing: 0;
    cursor: pointer;
    overflow: hidden;
    text-align: center;
    transition: background-color 0.2s ease, color 0.2s ease,
      border-radius 0.2s ease;

    &:hover:not(:disabled) {
      background: var(--MH-Theme-Neutrals-Light, #e6e6e6);
    }

    &:focus-visible {
      outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
      outline-offset: 2px;
      z-index: 1;
    }

    &:active:not(:disabled),
    &.DesignSystem-ButtonGroup__segment--selected {
      border-radius: var(--bg-selected-radius);
    }

    &.DesignSystem-ButtonGroup__segment--selected {
      background: var(--MH-Theme-Primary-Light, #def8fb);
      color: var(--MH-Theme-Primary-Dark, #336f8a);
    }

    &.DesignSystem-ButtonGroup__segment--selected:hover:not(:disabled) {
      background: #c0eaef;
    }

    &:disabled,
    &.DesignSystem-ButtonGroup__segment--disabled {
      background: var(--MH-Theme-Neutrals-Light, #e6e6e6);
      color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
      cursor: default;
    }
  }

  &.DesignSystem-ButtonGroup--fullWidth button.DesignSystem-ButtonGroup__segment {
    flex: 1 1 0;
  }

  /* Round type: unselected first/last keep the group's outer pill radius on
     the exposed corners. Selected / pressed override this via shape morph. */
  &.DesignSystem-ButtonGroup--round
    button.DesignSystem-ButtonGroup__segment--first:not(
      .DesignSystem-ButtonGroup__segment--selected
    ):not(:active) {
    border-top-left-radius: var(--bg-outer-radius);
    border-bottom-left-radius: var(--bg-outer-radius);
  }

  &.DesignSystem-ButtonGroup--round
    button.DesignSystem-ButtonGroup__segment--last:not(
      .DesignSystem-ButtonGroup__segment--selected
    ):not(:active) {
    border-top-right-radius: var(--bg-outer-radius);
    border-bottom-right-radius: var(--bg-outer-radius);
  }

  .DesignSystem-ButtonGroup__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--bg-icon-size);
    height: var(--bg-icon-size);
    overflow: hidden;
    color: currentColor;
  }

  .DesignSystem-ButtonGroup__icon svg {
    width: 100%;
    height: 100%;
  }

  .DesignSystem-ButtonGroup__label {
    white-space: nowrap;
  }
`;

/**
 * Connected button group for selecting options, switching views, or sorting.
 * Matches Figma Design System "Connected button group" (node 5304:1445).
 *
 * Selected segments use Primary Light / Primary Dark; unselected use Neutrals
 * Lighter / Tertiary Dark. A 2px gap separates segments. Selected and pressed
 * segments morph to a larger corner radius.
 *
 * @example
 * <ButtonGroup
 *   type="Round"
 *   size="XSmall"
 *   items={[
 *     { value: "list", label: "List", icon: <ListIcon /> },
 *     { value: "grid", label: "Grid", icon: <GridIcon /> },
 *   ]}
 *   value={view}
 *   onChange={setView}
 * />
 */
export default function ButtonGroup({
  type = "Round",
  size = "XSmall",
  show3rdSegment = true,
  show4thSegment = false,
  show5thSegment = false,
  items: itemsProp,
  selectionMode = "single",
  selectionRequired = true,
  value,
  defaultValue,
  onChange,
  disabled = false,
  fullWidth = false,
  id,
  className,
  "aria-label": ariaLabel,
}: ButtonGroupProps) {
  const generatedId = useId();
  const groupId = id ?? generatedId;
  const segmentRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const items = useMemo(
    () =>
      itemsProp == null
        ? placeholderItems(show3rdSegment, show4thSegment, show5thSegment)
        : itemsProp,
    [itemsProp, show3rdSegment, show4thSegment, show5thSegment]
  );

  const isControlled = value !== undefined;
  const [uncontrolled, setUncontrolled] = useState<string[]>(() => {
    const initial = toArray(defaultValue);
    if (initial.length > 0) return initial;
    return items[0] ? [items[0].value] : [];
  });

  const selectedValues = isControlled ? toArray(value) : uncontrolled;

  const emitChange = useCallback(
    (next: string[]) => {
      if (!isControlled) setUncontrolled(next);
      if (selectionMode === "multiple") {
        onChange?.(next);
      } else {
        onChange?.(next[0] ?? "");
      }
    },
    [isControlled, onChange, selectionMode]
  );

  const handleSelect = useCallback(
    (itemValue: string, itemDisabled?: boolean) => {
      if (disabled || itemDisabled) return;
      const next =
        selectionMode === "multiple"
          ? nextMultipleValue(selectedValues, itemValue, selectionRequired)
          : nextSingleValue(selectedValues, itemValue, selectionRequired);
      if (
        next.length === selectedValues.length &&
        next.every((entry, index) => entry === selectedValues[index])
      ) {
        return;
      }
      emitChange(next);
    },
    [
      disabled,
      emitChange,
      selectedValues,
      selectionMode,
      selectionRequired,
    ]
  );

  const focusSegment = (index: number) => {
    const next = segmentRefs.current[index];
    next?.focus();
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (selectionMode !== "single" || disabled) return;
    const last = items.length - 1;
    let nextIndex = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = index === last ? 0 : index + 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = index === 0 ? last : index - 1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = last;
    } else {
      return;
    }
    event.preventDefault();
    const nextItem = items[nextIndex];
    if (!nextItem) return;
    focusSegment(nextIndex);
    if (!nextItem.disabled) {
      handleSelect(nextItem.value, nextItem.disabled);
    }
  };

  const sizeClass =
    size === "XLarge"
      ? "DesignSystem-ButtonGroup--xlarge"
      : size === "Large"
        ? "DesignSystem-ButtonGroup--large"
        : size === "Medium"
          ? "DesignSystem-ButtonGroup--medium"
          : size === "Small"
            ? "DesignSystem-ButtonGroup--small"
            : "DesignSystem-ButtonGroup--xsmall";

  return (
    <StyledButtonGroup
      id={groupId}
      role={selectionMode === "single" ? "radiogroup" : "group"}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      className={clsx(
        "DesignSystem-ButtonGroup",
        type === "Square"
          ? "DesignSystem-ButtonGroup--square"
          : "DesignSystem-ButtonGroup--round",
        sizeClass,
        fullWidth && "DesignSystem-ButtonGroup--fullWidth",
        className
      )}
    >
      {items.map((item, index) => {
        const selected = selectedValues.includes(item.value);
        const isDisabled = disabled || Boolean(item.disabled);
        const isFirst = index === 0;
        const isLast = index === items.length - 1;
        const tabIndex =
          selectionMode === "single"
            ? selected || (selectedValues.length === 0 && isFirst)
              ? 0
              : -1
            : 0;

        return (
          <button
            key={item.value}
            ref={(node) => {
              segmentRefs.current[index] = node;
            }}
            type="button"
            role={selectionMode === "single" ? "radio" : undefined}
            aria-checked={
              selectionMode === "single" ? selected : undefined
            }
            aria-pressed={
              selectionMode === "multiple" ? selected : undefined
            }
            aria-label={item["aria-label"]}
            disabled={isDisabled}
            tabIndex={isDisabled ? -1 : tabIndex}
            className={clsx(
              "DesignSystem-ButtonGroup__segment",
              selected && "DesignSystem-ButtonGroup__segment--selected",
              isDisabled && "DesignSystem-ButtonGroup__segment--disabled",
              isFirst && "DesignSystem-ButtonGroup__segment--first",
              isLast && "DesignSystem-ButtonGroup__segment--last"
            )}
            onClick={() => handleSelect(item.value, item.disabled)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {item.icon != null && (
              <span className="DesignSystem-ButtonGroup__icon" aria-hidden>
                {item.icon}
              </span>
            )}
            {item.label != null && item.label !== "" && (
              <span className="DesignSystem-ButtonGroup__label">
                {item.label}
              </span>
            )}
          </button>
        );
      })}
    </StyledButtonGroup>
  );
}
