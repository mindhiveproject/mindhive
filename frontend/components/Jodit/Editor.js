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
  const ref = useRef(null);
  //   const [content, setContent] = useState(externalContent);

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

  //   let config; // all options from https://xdsoft.net/jodit/doc/
  //   if (readonly) {
  //     config = {
  //       readonly,
  //       activeButtonsInReadOnly: ["print"], // active only two buttons
  //       toolbarButtonSize: "large",
  //       buttons: ["print"],
  //       height: "100%",
  //       minHeight: "70vh",
  //     };
  //   } else {
  //     config = {
  //       allowTabNavigation: true,
  //       minHeight: 500,
  //       askBeforePasteFromWord: false,
  //       askBeforePasteHTML: false,
  //     };
  //   }

  return (
    <Jodit
      //   ref={ref}
      value={content}
      config={config}
      tabIndex={1} // tabIndex of textarea
      onChange={(newContent) => {
        setContent(newContent);
      }}
    />
  );
}
