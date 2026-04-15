import { StyledStudyPreview } from "../../styles/StyledStudyPage";
import { StyledPreview } from "../../styles/StyledPreview";
import useTranslation from "next-translate/useTranslation";

export default function StudyPreview({ study, close }) {
  const { t } = useTranslation('common');
  return (
    <StyledPreview>
      <div className="frame"></div>
      <div className="message">
        {t('preview.studyPreviewMessage')}
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
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation allow-popups-to-escape-sandbox"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
          ></iframe>
        </StyledStudyPreview>
      </div>
    </StyledPreview>
  );
}
