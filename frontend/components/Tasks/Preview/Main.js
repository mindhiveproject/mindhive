import { StyledPreview } from "../../styles/StyledPreview";

import TaskRun from "../Run/Main";

export default function TaskPreview({ user, study, id, close }) {
  return (
    <StyledPreview>
      <div className="frame"></div>
      <div className="message">THIS IS A PREVIEW. YOUR DATA ARE NOT SAVED.</div>
      <div className="closeBtn" onClick={() => close()}>
        <span>&times;</span>
      </div>
      <div className="preview">
        <TaskRun user={user} study={study} id={id} />
      </div>
    </StyledPreview>
  );
}
