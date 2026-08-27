"use client";

import { useState, useRef, useEffect } from "react";
import useTranslation from "next-translate/useTranslation";

import Chip from "./Chip";
import { CheckIcon, FileCopyIcon } from "./Icons";

const ICON_SLOT_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 20,
  height: 20,
  flexShrink: 0,
};

const COPY_ICON = (
  <span style={ICON_SLOT_STYLE} aria-hidden>
    <FileCopyIcon width={20} height={20} style={{ display: "block", opacity: 0.8 }} />
  </span>
);

const CHECK_ICON = (
  <span style={ICON_SLOT_STYLE} aria-hidden>
    <CheckIcon width={20} height={20} style={{ display: "block" }} />
  </span>
);

const LABEL_GRID_STYLE = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gridTemplateRows: "1fr",
  alignItems: "center",
  justifyItems: "start",
  width: "100%",
};

const LABEL_CELL_STYLE = {
  gridArea: "1 / 1",
};

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const temp = document.createElement("input");
  document.body.append(temp);
  temp.value = text;
  temp.select();
  document.execCommand("copy");
  temp.remove();
}

/**
 * Copy-to-clipboard button. Shows a checkmark and "Copied" for 2 seconds after success.
 * Label width stays stable: both the idle and "Copied" strings occupy the same grid cell
 * so the chip always sizes to the longer of the two. "Copied" is centered in that width.
 */
export default function CopyButton({
  value,
  children,
  disabled = false,
  className,
  style,
  ariaLabel,
  title,
  ...rest
}) {
  const { t } = useTranslation("common");
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef(null);
  const copiedLabel = t("copied", {}, { default: "Copied" });

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  const handleClick = async () => {
    if (copied || disabled || value == null || value === "") return;
    try {
      await copyText(String(value));
      setCopied(true);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const stableLabel = (
    <span style={LABEL_GRID_STYLE}>
      <span
        style={{
          ...LABEL_CELL_STYLE,
          visibility: copied ? "hidden" : "visible",
        }}
        aria-hidden={copied}
      >
        {children}
      </span>
      <span
        style={{
          ...LABEL_CELL_STYLE,
          visibility: copied ? "visible" : "hidden",
          width: "100%",
          textAlign: "center",
        }}
        aria-hidden={!copied}
      >
        {copiedLabel}
      </span>
    </span>
  );

  return (
    <Chip
      label={stableLabel}
      shape="square"
      selected={copied}
      disabled={disabled}
      onClick={copied ? undefined : handleClick}
      leading={copied ? CHECK_ICON : COPY_ICON}
      className={className}
      style={style}
      ariaLabel={ariaLabel}
      title={title}
      {...rest}
    />
  );
}
