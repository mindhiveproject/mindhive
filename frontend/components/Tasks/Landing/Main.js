import { useContext } from "react";
import { useQuery } from "@apollo/client";

import { UserContext } from "../../Global/Authorized";

import { GET_TASK } from "../../Queries/Task";
import TaskPage from "./TaskPage";

export default function TaskLandingMain({ slug }) {
  const user = useContext(UserContext);
  const { data, error, loading } = useQuery(GET_TASK, {
    variables: { slug },
  });

  const task = data?.task || {};

  return <TaskPage user={user} task={task} />;
}
