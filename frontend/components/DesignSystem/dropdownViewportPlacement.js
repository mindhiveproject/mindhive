/** Gap between trigger and panel (matches existing design-system dropdowns). */
export const DROPDOWN_VIEWPORT_GAP = 4;

/** Max ideal height before viewport / side caps (px). */
export const DROPDOWN_IDEAL_MAX_PX = 320;

/** Fraction of viewport height matching prior `50vh` cap intent. */
export const DROPDOWN_VIEWPORT_HEIGHT_FRACTION = 0.5;

/**
 * @param {number} innerHeight
 * @returns {number}
 */
export function getIdealMaxPanelHeight(innerHeight) {
  return Math.min(
    DROPDOWN_IDEAL_MAX_PX,
    innerHeight * DROPDOWN_VIEWPORT_HEIGHT_FRACTION,
  );
}

/**
 * @param {DOMRectReadOnly} triggerRect
 * @param {number} innerHeight
 * @param {number} measuredPanelHeight
 * @param {'auto' | 'below' | 'above'} [placementPreference='auto']
 * @returns {{ placement: 'below' | 'above', top: number, maxHeight: number }}
 */
export function computeDropdownVerticalPlacement(
  triggerRect,
  innerHeight,
  measuredPanelHeight,
  placementPreference = "auto",
) {
  const GAP = DROPDOWN_VIEWPORT_GAP;
  const spaceBelow = innerHeight - triggerRect.bottom - GAP;
  const spaceAbove = triggerRect.top - GAP;
  const idealCap = getIdealMaxPanelHeight(innerHeight);
  const measured = Math.max(measuredPanelHeight, 1);
  const need = Math.min(measured, idealCap);

  let placement;
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
  let top;
  if (placement === "below") {
    top = triggerRect.bottom + GAP;
  } else {
    top = triggerRect.top - GAP - visibleHeight;
  }

  return { placement, top, maxHeight };
}

/**
 * Keep left-aligned panel inside the viewport.
 * @param {number} triggerLeft
 * @param {number} panelWidth
 * @param {number} innerWidth
 * @returns {number}
 */
export function clampDropdownPanelLeft(
  triggerLeft,
  panelWidth,
  innerWidth,
  gap = DROPDOWN_VIEWPORT_GAP,
) {
  let left = triggerLeft;
  if (left + panelWidth > innerWidth - gap) {
    left = Math.max(gap, innerWidth - panelWidth - gap);
  }
  return left;
}

/**
 * Keep right-aligned panel (CSS `right` offset) inside the viewport.
 * @param {number} triggerRight — `getBoundingClientRect().right`
 * @param {number} panelWidth
 * @param {number} innerWidth
 * @returns {number} — value for CSS `right`
 */
export function clampDropdownPanelRight(
  triggerRight,
  panelWidth,
  innerWidth,
  gap = DROPDOWN_VIEWPORT_GAP,
) {
  let right = innerWidth - triggerRight;
  const panelLeft = innerWidth - right - panelWidth;
  if (panelLeft < gap) {
    right = Math.max(gap, innerWidth - panelWidth - gap);
  }
  return right;
}
