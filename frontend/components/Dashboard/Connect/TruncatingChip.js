import { useEffect, useRef, useState } from "react";

import Chip from "../../DesignSystem/Chip";
import Tooltip from "../../DesignSystem/Tooltip";

/**
 * A Chip whose label stays on one line and ellipsises at the available width;
 * when the text is clipped, a tooltip carries the full string. For Connect tag
 * chips (organization names, locations) that can be arbitrarily long and must
 * not wrap or stretch the card.
 *
 * All other Chip props (`variant`, `leading`, `style`, ...) pass straight
 * through.
 *
 * @param {string} label - The full label text.
 */
export default function TruncatingChip({ label, ...chipProps }) {
  const labelRef = useRef(null);
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
