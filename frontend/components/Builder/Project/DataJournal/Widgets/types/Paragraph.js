import ReactHtmlParser from "react-html-parser";

import { StyledTipTap } from "../../../../../TipTap/StyledTipTap";

export default function Paragraph({ content, handleContentChange }) {
  return (
    <div className="paragraph">
      <StyledTipTap>
        <div className="editorContainer">
          <div className="tiptapEditor">
            <div className="ProseMirror" aria-readonly>
              {ReactHtmlParser(content?.text || "")}
            </div>
          </div>
        </div>
      </StyledTipTap>
    </div>
  );
}
