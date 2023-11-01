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
          user={user}
          key={component?.id}
          component={component}
          addFunctions={addFunctions}
        />
      ))}
    </div>
  );
}
