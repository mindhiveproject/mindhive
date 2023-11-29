import Link from "next/link";

import TaskCard from "./TaskCard";
import { useEffect, useState } from "react";

export default function UserPath({ query, user, study, isDashboard, path }) {
  const [nextTaskId, setNextTaskId] = useState(
    path[path?.length - 1]?.componentID
  );

  // pass the guest publicId to the task page if the user type is guest
  const taskQuery =
    user?.type === "GUEST"
      ? {
          name: study.slug,
          guest: user?.publicId,
        }
      : {
          name: study.slug,
        };

  // check whether there are tasks left in the study
  const nextTaskType = path[path?.length - 1]?.type;

  let blockWithNextTask = [];
  const findTask = ({ taskId, flow }) => {
    for (let stage of flow) {
      if (stage?.type === "my-node") {
        if (stage?.id === taskId) {
          blockWithNextTask.push(...flow);
        }
      }
      if (stage?.type === "design") {
        stage?.conditions?.forEach((condition) => {
          findTask({
            taskId: taskId,
            flow: condition?.flow,
          });
        });
      }
    }
  };

  const comparePathWithFlow = ({ path, flow }) => {
    let nextTask;
    const lastTaskId = path[path?.length - 2]?.id;
    // search for the lastTaskId in the study flow
    findTask({
      taskId: lastTaskId,
      flow: flow,
    });
    // get the index of the lastTaskId
    const indexLastTask = blockWithNextTask
      .map((task) => task?.id)
      .indexOf(lastTaskId);
    if (blockWithNextTask[indexLastTask + 1]) {
      nextTask = blockWithNextTask[indexLastTask + 1]?.componentID;
    }
    return nextTask;
  };

  // find any updates in the current structure of the study
  useEffect(() => {
    function findStudyUpdates() {
      const nextTask = comparePathWithFlow({ path: path, flow: study?.flow });
      setNextTaskId(nextTask);
    }
    // only look for study updates if there is no next task ID and the path was ended in the past
    if (nextTaskType === "end" && !nextTaskId) {
      findStudyUpdates();
    }
  }, [study]);

  return (
    <>
      {user?.type === "GUEST" && (
        <div className="guestMessage">
          <p>
            You participate as a guest. Your public readable id is{" "}
            <strong>{user?.publicReadableId}</strong>
          </p>
        </div>
      )}

      {path
        .filter(
          (step) =>
            (step?.type === "task" && step?.finished) || step?.type === "end"
        )
        .map((step, num) => {
          if (step?.type === "end") {
            return (
              <div key={num}>
                <hr></hr>
              </div>
            );
          } else {
            return <TaskCard key={num} step={step} user={user} study={study} />;
          }
        })}

      {(path.length === 0 || nextTaskId) && (
        <Link
          href={{
            pathname: `/participate/run`,
            query: taskQuery,
          }}
        >
          <div className="controlBtns">
            <button>Start the next task</button>
          </div>
        </Link>
      )}
    </>
  );
}
