import { StyledStudyPreview } from "../../styles/StyledStudyPage";
import { StyledPreview } from "../../styles/StyledPreview";

export default function StudyPreview({ study, close }) {
  return (
    <StyledPreview>
      <div className="frame"></div>
      <div className="message">
        THIS IS A STUDY PREVIEW. YOUR DATA WILL BE SAVED AS GUEST PARTICIPANT
        DATA.
      </div>
      <div className="closeBtn" onClick={() => close()}>
        <span>&times;</span>
      </div>
      <div className="preview">
        <StyledStudyPreview>
          <iframe
            src={`/studies/${study?.slug}`}
            title="description"
            height="100%"
            width="100%"
          ></iframe>
        </StyledStudyPreview>
      </div>
    </StyledPreview>
  );
}
