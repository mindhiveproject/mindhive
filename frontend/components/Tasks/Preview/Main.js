import { StyledPreview } from "../../styles/StyledPreview";

import TaskRun from "../Run/Main";
import useTranslation from "next-translate/useTranslation";

export default function TaskPreview({ user, study, id, close }) {
  const { t } = useTranslation('common');
  return (
    <StyledPreview>
      <div className="frame"></div>
      <div className="message">
        {close
          ? t('preview.taskPreviewMessage')
          : t('preview.closeTabToStopPreview')}
      </div>
      {close && (
        <div className="closeBtn" onClick={() => close()}>
          <span>&times;</span>
        </div>
      )}
      <div className="preview">
        <TaskRun user={user} study={study} id={id} onFinish={close} />
      </div>
    </StyledPreview>
  );
}
