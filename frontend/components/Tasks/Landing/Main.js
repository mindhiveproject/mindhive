import { useContext } from "react";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { UserContext } from "../../Global/Authorized";

import ReactHtmlParser from "react-html-parser";

import { GET_TASK } from "../../Queries/Task";
import TaskPage from "./TaskPage";
import ManageFavorite from "../../User/ManageFavorite";

export default function TaskLandingMain({ slug }) {
  const user = useContext(UserContext);
  const { t } = useTranslation("home");
  const { data, error, loading } = useQuery(GET_TASK, {
    variables: { slug },
  });

  const task = data?.task || {};

  return (
    <>
      <div className="titleIcon">
        <h1>{task?.title}</h1>
        <div>{user && <ManageFavorite user={user} id={task?.id} />}</div>
      </div>

      <div>
        <h3>{ReactHtmlParser(task?.descriptionForParticipants)}</h3>
      </div>
      <div className="controlBtns">
        <a
          target="_blank"
          href={`/preview/${task?.taskType?.toLowerCase()}/${task?.id}`}
        >
          <button>{t("preview")}</button>
        </a>
      </div>
      <TaskPage user={user} task={task} />
    </>
  );
}
