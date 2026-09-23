import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import IconButton from "../../../../../DesignSystem/IconButton";
import { PlayIcon } from "../../../../../DesignSystem/Icons";
import { StyledTaskCardReview } from "../../../../../styles/StyledStudyPage";
import TaskPreview from "../../../../../Tasks/Preview/Main";

// `children` renders under the title row — the Study Flow uses it for the
// block's data source chips.
export default function TaskBlock({ task, children }) {
  const { t } = useTranslation("builder");
  const [isFullscreenPreviewOpen, setIsFullscreenPreviewOpen] = useState(false);

  if (isFullscreenPreviewOpen) {
    return (
      <TaskPreview
        id={task?.componentID}
        close={() => setIsFullscreenPreviewOpen(false)}
      />
    );
  }

  const previewLabel = t("studyFlow.preview.previewBlock", {}, {
    default: "Preview",
  });

  return (
    <StyledTaskCardReview taskType={task?.taskType} $clickable={false}>
      <div className="cardHeader">
        <div className="cardInfo">
          <h2>{task?.name}</h2>
          <span>{task?.subtitle}</span>
        </div>
        <IconButton
          variant="neutral"
          icon={<PlayIcon />}
          ariaLabel={previewLabel}
          title={previewLabel}
          onClick={() => setIsFullscreenPreviewOpen(true)}
        />
      </div>
      {children}
    </StyledTaskCardReview>
  );
}
