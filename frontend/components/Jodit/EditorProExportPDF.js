import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

const importJoditPro = () => import("jodit-pro-react");

import StyledJoditProExportPDF from "../styles/StyledJoditProExportPDF";

const JoditPro = dynamic(importJoditPro, {
  ssr: false,
});

export default function JoditEditorProExportPDF({ content, setContent }) {
  const editor = useRef(null);
  const config = {
    license: "YOUR-LICENSE-KEY", // https://xdsoft.net/jodit/pro/docs/how-to/create-the-license-code.md
    readonly: false, // all options from https://xdsoft.net/jodit/doc/,
    filebrowser: {
      ajax: {
        url: "https://xdsoft.net/jodit/finder/",
      },
      height: 580,
    },
    minHeight: 500,
    globalFullSize: true,
    buttons: ["exportDocs"],
    inline: true,
    toolbar: true,
    toolbarInline: false,
    toolbarInlineForSelection: false,
    showXPathInStatusbar: false,
    showCharsCounter: false,
    showWordsCounter: false,
    showPlaceholder: false,
  };

  return (
    <StyledJoditProExportPDF>
      <JoditPro
        ref={editor}
        value={content}
        config={config}
        tabIndex={1} // tabIndex of textarea
        // onBlur={(newContent) => setContent(newContent)} // preferred to use only this option to update the content for performance reasons
        onChange={(newContent) => {}}
      />
    </StyledJoditProExportPDF>
  );
}
