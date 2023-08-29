import DynamicExperimentWindow from "../../Labjs/Run/Wrapper";

import Labjs from "../../Global/Labjs";
import { StyledPreview } from "../../styles/StyledPreview";

export default function BuilderTaskPreview({ user, task, close }) {
  return (
    <StyledPreview>
      <div className="frame"></div>
      <div className="message">THIS IS A PREVIEW. YOUR DATA ARE NOT SAVED.</div>
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
