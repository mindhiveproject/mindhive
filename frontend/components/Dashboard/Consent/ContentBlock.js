import { useRef } from "react";

import JoditEditor from "../../Jodit/Editor";

export default function ContentBlock({ index, block, updateInfo }) {
  const content = useRef(block?.text);

  return (
    <div className="singlePost">
      <div className="header">
        <h3>{block?.description}</h3>
      </div>

      <JoditEditor
        content={content?.current}
        setContent={(content) => updateInfo({ content, index })}
      />
    </div>
  );
}
