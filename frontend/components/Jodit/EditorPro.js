import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";

const importJoditPro = () => import("jodit-pro-react");

const JoditPro = dynamic(importJoditPro, {
  ssr: false,
});

export default function JoditEditorPro({ content, setContent }) {
  const editor = useRef(null);
  //   const [content, setContent] = useState("");

  const config = {
    license: "YOUR-LICENSE-KEY", // https://xdsoft.net/jodit/pro/docs/how-to/create-the-license-code.md
    readonly: false, // all options from https://xdsoft.net/jodit/doc/,
    // uploader: {
    //   url: "https://xdsoft.net/jodit/finder/?action=fileUpload",
    // },
    // filebrowser: {
    //   ajax: {
    //     url: "https://xdsoft.net/jodit/finder/",
    //   },
    //   height: 580,
    // },
    minHeight: 500,
    globalFullSize: false,
  };

  return (
    <JoditPro
      ref={editor}
      value={content}
      config={config}
      tabIndex={1} // tabIndex of textarea
      onBlur={(newContent) => setContent(newContent)} // preferred to use only this option to update the content for performance reasons
      onChange={(newContent) => {}}
    />
  );
}
