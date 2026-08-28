import { useEffect, useRef, useState } from "react";

import Chip, { type ChipProps } from "../../DesignSystem/Chip";
import RawTooltip from "../../DesignSystem/Tooltip";

// Tooltip is still plain JS; TS 4.9 mis-infers its destructured props param from
// the JSDoc. Assert its real contract here until DesignSystem/Tooltip is on TS.
const Tooltip = RawTooltip as unknown as React.FC<{
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  disabled?: boolean;
  delayMs?: number;
  maxWidth?: number;
  className?: string;
}>;

/** Props for {@link TruncatingChip}: every {@link ChipProps} except `label`, which is narrowed to a string. */
export interface TruncatingChipProps extends Omit<ChipProps, "label"> {
  /** The full label text; ellipsised to fit, with the full string shown in a tooltip when clipped. */
  label: string;
}

/**
 * A Chip whose label stays on one line and ellipsises at the available width;
 * when the text is clipped, a tooltip carries the full string. For Connect tag
 * chips (organization names, locations) that can be arbitrarily long and must
 * not wrap or stretch the card.
 *
 * All other Chip props (`variant`, `leading`, `style`, ...) pass straight
 * through.
 */
export default function TruncatingChip({
  label,
  ...chipProps
}: TruncatingChipProps) {
  const labelRef = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    const el = labelRef.current;
    if (!el) return undefined;
    const check = () => setTruncated(el.scrollWidth > el.clientWidth + 1);
    check();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [label]);

  return (
    <Tooltip content={label} disabled={!truncated} side="top">
      <Chip
        {...chipProps}
        title={typeof label === "string" ? label : chipProps.title}
        style={{ maxWidth: "100%", ...chipProps.style }}
        labelStyle={{
          minWidth: 0,
          flexShrink: 1,
          display: "block",
          overflow: "hidden",
          ...chipProps.labelStyle,
        }}
        label={
          <span
            ref={labelRef}
            style={{
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        }
      />
    </Tooltip>
  );
}
