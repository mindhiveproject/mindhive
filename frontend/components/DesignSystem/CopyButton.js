"use client";

import { useState, useRef, useEffect } from "react";
import useTranslation from "next-translate/useTranslation";

import Chip from "./Chip";

const COPY_ICON = (
  <img
    src="/assets/icons/copy.svg"
    alt="Copy to clipboard"
    width="20"
    height="20"
    aria-hidden
    style={{ flexShrink: 0, display: "block", opacity: 0.8 }}
  />
);

const CHECK_ICON = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0, display: "block" }}
    aria-hidden
  >
    <path
      d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
      fill="currentColor"
    />
  </svg>
);

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

  return (
    <Chip
      label={copied ? t("copied", {}, { default: "Copied" }) : children}
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
