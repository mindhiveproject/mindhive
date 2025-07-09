import { useQuery } from "@apollo/client";
import ReactHtmlParser from "react-html-parser";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import { TASK_TO_PARTICIPATE } from "../../Queries/Task";

import { StyledTaskCard } from "../../styles/StyledStudyPage";

export default function TaskCard({ user, study, step }) {
  const { t } = useTranslation('common');
  const { data, loading, error } = useQuery(TASK_TO_PARTICIPATE, {
    variables: { id: step?.componentID },
  });
  const task = data?.task || {};

  const allowRetake = !study?.settings?.forbidRetake;

  // pass the guest publicId to the task page if the user type is guest
  const taskQuery =
    user?.type === "GUEST"
      ? {
          name: study.slug,
          guest: user?.publicId,
          task: task?.id,
          version: step?.testId,
        }
      : {
          name: study.slug,
          task: task?.id,
          version: step?.testId,
        };

  return (
    <StyledTaskCard taskType={task?.taskType}>
      <div className="cardInfo">
        <h2>{task.title}</h2>
        {/* <p>{step?.testId}</p> */}
        <p>
          {task.settings &&
            task.settings.duration &&
            t('taskCard.duration', { duration: task.settings.duration })
          }
        </p>

        <div>
          {task.settings && ReactHtmlParser(task.settings.descriptionAfter)}
        </div>

        {allowRetake && (
          <div className="actionLinks">
            <Link
              href={{
                pathname: `/participate/run`,
                query: taskQuery,
              }}
            >
              <div className="controlBtns">
                <button>{t('taskCard.retake', { type: task?.taskType?.toLowerCase() })}</button>
              </div>
            </Link>
          </div>
        )}
      </div>
    </StyledTaskCard>
  );
}
