import { useQuery } from "@apollo/client";
import { PUBLIC_TASKS } from "../../../../../Queries/Task";
import Card from "./Card";

export default function PublicBlocks({
  engine,
  user,
  createdBy,
  search,
  componentType,
  addFunctions,
  setComponentId,
}) {
  const { data, error, loading } = useQuery(PUBLIC_TASKS, {
    variables: {
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
