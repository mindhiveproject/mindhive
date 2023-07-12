import { useQuery } from "@apollo/client";
import { TASK_TO_EDIT } from "../../../../Queries/Task.js";

export default function ComponentModal({ user, componentId, close }) {
  const { data, error, loading } = useQuery(TASK_TO_EDIT, {
    variables: { id: componentId },
  });

  console.log({ data });

  return (
    <div>
      Component modal <button onClick={close}>Close</button>
    </div>
  );
}
