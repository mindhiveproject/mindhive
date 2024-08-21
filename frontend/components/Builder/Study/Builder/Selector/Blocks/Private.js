import { useQuery } from "@apollo/client";
import { MY_TASKS } from "../../../../../Queries/Task";
import Card from "./Card";

export default function PrivateBlocks({
  user,
  search,
  componentType,
  addFunctions,
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
          user={user}
          key={component?.id}
          component={component}
          addFunctions={addFunctions}
        />
      ))}
    </div>
  );
}
