import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import { MY_TASKS } from "../../../../../Queries/Task";
import Card from "./Card";
import { getLocalizedField } from "../../../../../../lib/i18nContent";

export default function PrivateBlocks({
  user,
  search,
  componentType,
  addFunctions,
}) {
  const router = useRouter();
  const currentLocale = router.locale || 'en-us'; // fallback to en-us

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


  const processComponentsWithI18n = (components) => {
    const i18nFields = [
      'title',
      'description', 
      'descriptionForParticipants',
      'settings',
      'resources',
      'aggregateVariables',
      'addInfo',
      'parameters'
    ];

    return components.map(component => {
      const localizedComponent = { ...component };
      
      i18nFields.forEach(fieldName => {
        localizedComponent[fieldName] = getLocalizedField(component, fieldName, currentLocale);
      });

      return localizedComponent;
    });
  };

  const tasks = data?.tasks || [];
  const localizedTasks = processComponentsWithI18n(tasks);

  return (
    <div>
      {localizedTasks.map((component) => (
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