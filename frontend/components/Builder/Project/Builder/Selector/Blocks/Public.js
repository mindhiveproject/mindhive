import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import { MY_TASKS, PUBLIC_TASKS } from "../../../../../Queries/Task";
import useHiddenTaskIds from "../../../../../Tasks/Bank/useHiddenTaskIds";
import { excludeHiddenTasks } from "../../../../../../lib/taskBankFilter";
import Card from "./Card";
import { getLocalizedField } from "../../../../../../lib/i18nContent";

export default function PublicBlocks({
  user,
  search,
  componentType,
  addFunctions,
  isSurveyBuilder,
}) {
  const router = useRouter();
  const currentLocale = router.locale || "en-us"; // fallback to en-us
  // Public tasks the student's classes hide; their own tasks are unaffected.
  const hiddenTaskIds = useHiddenTaskIds();

  const publicWhere =
    process.env.NODE_ENV === "development"
      ? {
          taskType: { equals: componentType },
          public: { equals: true },
          OR: [
            { title: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {
          taskType: { equals: componentType },
          public: { equals: true },
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        };

  const ownedWhere =
    process.env.NODE_ENV === "development"
      ? {
          AND: [
            { taskType: { equals: componentType } },
            { public: { equals: false } },
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
            { public: { equals: false } },
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
        };

  const { data, error, loading } = useQuery(PUBLIC_TASKS, {
    variables: { where: excludeHiddenTasks(publicWhere, hiddenTaskIds) },
  });

  const { data: ownedData } = useQuery(MY_TASKS, {
    variables: { where: ownedWhere },
    skip: !user?.id || isSurveyBuilder,
  });


  const processComponentsWithI18n = (components) => {
    const i18nFields = [
      "title",
      "description",
      "descriptionForParticipants",
      "settings",
      "resources",
      "aggregateVariables",
      "addInfo",
      "parameters",
    ];

    return components.map((component) => {
      const localizedComponent = { ...component };

      i18nFields.forEach((fieldName) => {
        localizedComponent[fieldName] = getLocalizedField(component, fieldName, currentLocale);
      });

      return localizedComponent;
    });
  };

  const publicTasks = data?.tasks || [];
  const ownedTasks = isSurveyBuilder ? [] : ownedData?.tasks || [];
  const seen = new Set(publicTasks.map((task) => task?.id));
  const tasks = [
    ...publicTasks,
    ...ownedTasks.filter((task) => task?.id && !seen.has(task.id)),
  ];
  const localizedTasks = processComponentsWithI18n(tasks);

  return (
    <div>
      {localizedTasks
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
            isSurveyBuilder={isSurveyBuilder}
          />
        ))}
    </div>
  );
}
