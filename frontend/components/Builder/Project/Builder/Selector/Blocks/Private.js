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
      where:
        process.env.NODE_ENV === "development"
          ? {
              AND: [
                { taskType: { equals: componentType } },
                {
                  OR: [
                    { author: { id: { equals: user?.id } } },
                    { collaborators: { some: { id: { equals: user?.id } } } },
                  ],
                },
                {
                  OR: [
                    { title: { contains: search } },
                    { description: { contains: search } },
                  ],
                },
              ],
            }
          : {
              AND: [
                { taskType: { equals: componentType } },
                {
                  OR: [
                    { author: { id: { equals: user?.id } } },
                    { collaborators: { some: { id: { equals: user?.id } } } },
                  ],
                },
                {
                  OR: [
                    { title: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } },
                  ],
                },
              ],
            },
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
          search={search}
          componentType={componentType}
        />
      ))}
    </div>
  );
}
