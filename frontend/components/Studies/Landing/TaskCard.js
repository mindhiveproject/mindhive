import { useQuery } from "@apollo/client";
import ReactHtmlParser from "react-html-parser";
import { TASK_TO_PARTICIPATE } from "../../Queries/Task";

import { StyledTaskCard } from "../../styles/StyledStudyPage";

export default function TaskCard({ user, study, step }) {
  const { data, loading, error } = useQuery(TASK_TO_PARTICIPATE, {
    variables: { id: step?.componentID },
  });
  const task = data?.task || {};

  const allowRetake = !study?.settings?.forbidRetake;

  return (
    <StyledTaskCard taskType={task?.taskType}>
      <div className="cardInfo">
        <h2>{task.title}</h2>
        <p>
          {task.settings &&
            task.settings.duration &&
            `Duration ${task.settings.duration}`}
        </p>

        <div>
          {task.settings && ReactHtmlParser(task.settings.descriptionAfter)}
        </div>

        {allowRetake && (
          <div className="actionLinks">
            <button>
              <p>Retake {task?.taskType?.toLowerCase()}</p>
            </button>
          </div>
        )}
      </div>
    </StyledTaskCard>
  );
}
