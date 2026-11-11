"use client";

import Chip from "../../../DesignSystem/Chip";
import DropdownSelect from "../../../DesignSystem/DropdownSelect";

// Figma draws the camera picker as a Basic Chip: 32px tall, the chevron in the
// 8px trailing slot. The select's own trigger is already the 8px-radius outline.
const TRIGGER_STYLE = {
  padding: "6px 8px 6px 12px",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

/**
 * The camera a connected input is reading, as a dropdown of the cameras the
 * browser offers. Choosing one reconnects the input on it. Falls back to a
 * plain label while the list isn't known.
 *
 * @param {object} status - The input's connected status: `deviceLabel`,
 *   `cameraId` and `cameras` ({ id, label }[]).
 * @param {(deviceId: string) => void} [onSelect]
 */
export default function CameraSelect({ status, onSelect }) {
  const cameras = status.cameras || [];
  if (!cameras.length) {
    return status.deviceLabel ? (
      <Chip variant="static" tone="neutral" label={status.deviceLabel} style={{ alignSelf: "flex-start" }} />
    ) : null;
  }
  return (
    <DropdownSelect
      portal
      fitContent
      ariaLabel="Camera"
      value={status.cameraId}
      disabled={!onSelect}
      options={cameras.map((camera) => ({ value: camera.id, label: camera.label }))}
      onChange={onSelect}
      triggerStyle={TRIGGER_STYLE}
    />
  );
}
