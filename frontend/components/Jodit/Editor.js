import React, { useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";

const importJodit = () => import("jodit-react");

const Jodit = dynamic(importJodit, {
  ssr: false,
});

export default function JoditEditor({
  content,
  setContent,
  readonly,
  minHeight,
}) {
  const config = useMemo(
    () => ({
      readonly,
      minHeight: minHeight || 500,
      askBeforePasteFromWord: false,
      askBeforePasteHTML: false,
      removeButtons: ["fullsize"],
    }),
    []
  );

  return (
    <Jodit
      value={content}
      config={config}
      tabIndex={1} // tabIndex of textarea
      onChange={(newContent) => {
        setContent(newContent);
      }}
    />
  );
}
