import React, { Component } from "react";
import moment from "moment";
import { Icon } from "semantic-ui-react";
import Link from "next/link";
import JoditEditor from "../../Jodit/Editor";

export default function ContentBlock({ index, block, updateInfo }) {
  return (
    <div className="singlePost">
      <div className="header">
        <h3>{block?.description}</h3>
      </div>

      <JoditEditor
        content={block?.text}
        setContent={(content) => updateInfo({ content, index })}
      />
    </div>
  );
}
