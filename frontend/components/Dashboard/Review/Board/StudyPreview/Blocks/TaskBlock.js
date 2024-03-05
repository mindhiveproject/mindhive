import { useState } from "react";

import { StyledTaskCardReview } from "../../../../../styles/StyledStudyPage";
import TaskPreview from "../../../../../Tasks/Preview/Main";

export default function TaskBlock({ task }) {
  const [isFullscreenPreviewOpen, setIsFullscreenPreviewOpen] = useState(false);

  if (isFullscreenPreviewOpen) {
    return (
      <TaskPreview
        id={task?.componentID}
        close={() => setIsFullscreenPreviewOpen(false)}
      />
    );
  }

  return (
    <StyledTaskCardReview
      taskType={task?.taskType}
      onClick={() => setIsFullscreenPreviewOpen(true)}
    >
      <div className="cardInfo">
        <h2>{task?.name}</h2>
        <span>{task?.subtitle}</span>
      </div>
    </StyledTaskCardReview>
  );
}
