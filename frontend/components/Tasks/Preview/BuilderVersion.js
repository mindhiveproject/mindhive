import DynamicExperimentWindow from "../../Labjs/Run/Wrapper";

import Labjs from "../../Global/Labjs";
import { StyledPreview } from "../../styles/StyledPreview";
import useTranslation from "next-translate/useTranslation";

export default function BuilderTaskPreview({ user, task, close }) {
  const { t } = useTranslation('common');
  return (
    <StyledPreview>
      <div className="frame"></div>
      <div className="message">{t('preview.taskBuilderPreviewMessage')}</div>
      <div className="closeBtn" onClick={() => close()}>
        <span>&times;</span>
      </div>
      <div className="preview">
        <Labjs>
          <DynamicExperimentWindow user={user} task={task} onFinish={close} />
        </Labjs>
      </div>
    </StyledPreview>
  );
}
