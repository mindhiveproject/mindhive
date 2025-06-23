import { useState } from "react";
import JoditEditor from "../../../../../Jodit/Editor";
import ReactHtmlParser from "react-html-parser";

import { Radio, Icon } from "semantic-ui-react";

export default function Paragraph({ content, handleContentChange }) {
  const [isEditing, setIsEditing] = useState(!content?.text);

  // update content in the local state
  const handleChange = async (content) => {
    handleContentChange({ newContent: { text: content } });
  };

  return (
    <div className="paragraph">
      <div className="modeSwitch">
        <div>
          <Radio
            toggle
            checked={isEditing}
            onChange={() => {
              setIsEditing(!isEditing);
            }}
          />
        </div>
        <div>{isEditing ? <div>Edit</div> : <div>View</div>}</div>
      </div>

      {isEditing ? (
        <JoditEditor content={content?.text || ""} setContent={handleChange} />
      ) : (
        <div className="viewMode">{ReactHtmlParser(content?.text)}</div>
      )}
    </div>
  );
}
