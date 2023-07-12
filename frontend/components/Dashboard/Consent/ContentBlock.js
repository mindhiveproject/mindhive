import React, { Component } from "react";
import moment from "moment";
import { Icon } from "semantic-ui-react";
import Link from "next/link";

import ReactHtmlParser from "react-html-parser";
import JoditEditor from "../../Jodit/Editor";

export default function ContentBlock({ index, block, updateInfo }) {
  return (
    <div className="singlePost">
      <div className="header">
        <h2>{block?.description}</h2>
      </div>

      <JoditEditor
        content={block?.content}
        setContent={(content) => updateInfo({ content, index })}
      />
    </div>
  );
}
