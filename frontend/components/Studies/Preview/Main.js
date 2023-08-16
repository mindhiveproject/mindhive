import { StyledStudyPreview } from "../../styles/StyledStudyPage";
import { StyledPreview } from "../../styles/StyledPreview";

export default function StudyPreview({ close }) {
  return (
    <StyledPreview>
      <div className="frame"></div>
      <div className="message">THIS IS A PREVIEW. YOUR DATA ARE NOT SAVED.</div>
      <div className="closeBtn" onClick={() => close()}>
        <span>&times;</span>
      </div>
      <div className="preview">
        <StyledStudyPreview>hello</StyledStudyPreview>
      </div>
    </StyledPreview>
  );
}
