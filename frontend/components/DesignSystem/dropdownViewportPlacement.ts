/** Vertical placement preference shared by {@link DropdownSelect} and {@link DropdownMenu}. */
export type DropdownPlacement = "auto" | "below" | "above";

/** Gap between trigger and panel (matches existing design-system dropdowns). */
export const DROPDOWN_VIEWPORT_GAP = 4;

/** Max ideal height before viewport / side caps (px). */
export const DROPDOWN_IDEAL_MAX_PX = 320;

/** Fraction of viewport height matching prior `50vh` cap intent. */
export const DROPDOWN_VIEWPORT_HEIGHT_FRACTION = 0.5;

export function getIdealMaxPanelHeight(innerHeight: number): number {
  return Math.min(
    DROPDOWN_IDEAL_MAX_PX,
    innerHeight * DROPDOWN_VIEWPORT_HEIGHT_FRACTION,
  );
}

export function computeDropdownVerticalPlacement(
  triggerRect: DOMRectReadOnly,
  innerHeight: number,
  measuredPanelHeight: number,
  placementPreference: DropdownPlacement = "auto",
): { placement: "below" | "above"; top: number; maxHeight: number } {
  const GAP = DROPDOWN_VIEWPORT_GAP;
  const spaceBelow = innerHeight - triggerRect.bottom - GAP;
  const spaceAbove = triggerRect.top - GAP;
  const idealCap = getIdealMaxPanelHeight(innerHeight);
  const measured = Math.max(measuredPanelHeight, 1);
  const need = Math.min(measured, idealCap);

  let placement: "below" | "above";
  if (placementPreference === "below") {
    placement = "below";
  } else if (placementPreference === "above") {
    placement = "above";
  } else {
    const fitsBelow = spaceBelow >= need;
    const preferBelow = fitsBelow || spaceBelow >= spaceAbove;
    placement = preferBelow ? "below" : "above";
  }

  const space = placement === "below" ? spaceBelow : spaceAbove;
  const maxHeight = Math.max(0, Math.min(idealCap, space));

  const visibleHeight = Math.min(measuredPanelHeight, maxHeight);
  let top: number;
  if (placement === "below") {
    top = triggerRect.bottom + GAP;
  } else {
    top = triggerRect.top - GAP - visibleHeight;
  }

  return { placement, top, maxHeight };
}

/** Keep left-aligned panel inside the viewport. */
export function clampDropdownPanelLeft(
  triggerLeft: number,
  panelWidth: number,
  innerWidth: number,
  gap: number = DROPDOWN_VIEWPORT_GAP,
): number {
  let left = triggerLeft;
  if (left + panelWidth > innerWidth - gap) {
    left = Math.max(gap, innerWidth - panelWidth - gap);
  }
  return left;
}

/**
 * Keep right-aligned panel (CSS `right` offset) inside the viewport.
 * @param triggerRight — `getBoundingClientRect().right`
 * @returns value for CSS `right`
 */
export function clampDropdownPanelRight(
  triggerRight: number,
  panelWidth: number,
  innerWidth: number,
  gap: number = DROPDOWN_VIEWPORT_GAP,
): number {
  let right = innerWidth - triggerRight;
  const panelLeft = innerWidth - right - panelWidth;
  if (panelLeft < gap) {
    right = Math.max(gap, innerWidth - panelWidth - gap);
  }
  return right;
}
