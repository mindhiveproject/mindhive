import { useQuery } from "@apollo/client";
import { MY_TASKS } from "../../../../../Queries/Task";
import Card from "./Card";

export default function PrivateBlocks({
  engine,
  user,
  createdBy,
  search,
  componentType,
  addFunctions,
  setComponentId,
}) {
  const { data, error, loading } = useQuery(MY_TASKS, {
    variables: {
      id: user?.id,
      taskType: componentType,
      searchTerm: search,
    },
  });
  const tasks = data?.tasks || [];

  return (
    <div>
      {tasks.map((component) => (
        <Card
          key={component?.id}
          component={component}
          addFunctions={addFunctions}
          setComponentId={setComponentId}
        />
      ))}
    </div>
  );
}
