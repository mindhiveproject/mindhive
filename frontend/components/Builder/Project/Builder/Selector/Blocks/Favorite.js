import { useQuery } from "@apollo/client";
import { FAVORITE_TASKS } from "../../../../../Queries/Task";
import Card from "./Card";

export default function FavoriteBlocks({
  user,
  search,
  componentType,
  addFunctions,
  isSurveyBuilder,
}) {
  const { data, error, loading } = useQuery(FAVORITE_TASKS, {
    variables: {
      where:
        process.env.NODE_ENV === "development"
          ? {
              favoriteBy: { some: { id: { equals: user?.id } } },
              taskType: { equals: componentType },
              OR: [
                { title: { contains: search } },
                { description: { contains: search } },
              ],
            }
          : {
              favoriteBy: { some: { id: { equals: user?.id } } },
              taskType: { equals: componentType },
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            },
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
