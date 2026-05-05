"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import InfoTooltip from "../../../../../../DesignSystem/InfoTooltip";

const DEFAULT_TOOLTIP_DELAY_MS = 1500;
const DEFAULT_LINE_CLAMP = 3;

export default function TruncatedTooltipText({
  text,
  className,
  as: Tag = "div",
  position = "right",
  delayMs = DEFAULT_TOOLTIP_DELAY_MS,
  lineClamp = DEFAULT_LINE_CLAMP,
  style,
}) {
  const textRef = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const plainText =
    typeof text === "string" || typeof text === "number" ? String(text) : "";

  const measureTruncation = useCallback(() => {
    const el = textRef.current;
    if (!el) return;
    const verticalOverflow = el.scrollHeight - el.clientHeight > 1;
    const horizontalOverflow = el.scrollWidth - el.clientWidth > 1;
    setIsTruncated(verticalOverflow || horizontalOverflow);
  }, []);

  useEffect(() => {
    measureTruncation();
    const el = textRef.current;
    if (!el) return;

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => measureTruncation());
      observer.observe(el);
      return () => observer.disconnect();
    }

    const onResize = () => measureTruncation();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [text, measureTruncation]);

  const textNode = (
    <Tag
      ref={textRef}
      className={className}
      style={{
        display: "-webkit-box",
        WebkitLineClamp: lineClamp,
        WebkitBoxOrient: "vertical",
        lineClamp,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "normal",
        overflowWrap: "anywhere",
        wordBreak: "break-word",
        ...style,
      }}
    >
      {text}
    </Tag>
  );

  if (!plainText || !isTruncated) return textNode;

  return (
    <InfoTooltip
      content={plainText}
      position={position}
      portal
      delayMs={delayMs}
      wrapperStyle={{ minWidth: 0, maxWidth: "100%", display: "block" }}
    >
      {textNode}
    </InfoTooltip>
  );
}
