import { useQuery } from "@apollo/client";
import { PUBLIC_TASKS } from "../../../../../Queries/Task";
import Card from "./Card";

export default function PublicBlocks({
  user,
  search,
  componentType,
  addFunctions,
  isSurveyBuilder,
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
      {tasks
        .filter((c) => {
          if (isSurveyBuilder) {
            return c?.slug === "survey-builder";
          } else {
            return c?.slug !== "survey-builder";
          }
        })
        .map((component) => (
          <Card
            user={user}
            key={component?.id}
            component={component}
            addFunctions={addFunctions}
            search={search}
            componentType={componentType}
          />
        ))}
    </div>
  );
}
