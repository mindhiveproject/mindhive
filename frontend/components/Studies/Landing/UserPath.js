import Link from "next/link";

import TaskCard from "./TaskCard";

export default function UserPath({ query, user, study, isDashboard, path }) {
  // console.log({ user });

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
  const nextTaskId = path[path?.length - 1]?.componentID;

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
        .filter((step) => step?.type === "task")
        .map((step, num) => (
          <TaskCard key={num} step={step} user={user} study={study} />
        ))}

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
