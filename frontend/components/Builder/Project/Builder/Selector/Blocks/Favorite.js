import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import {
  FAVORITE_TASKS,
  buildFavoriteTasksWhere,
} from "../../../../../Queries/Task";
import Card from "./Card";
import { getLocalizedField } from "../../../../../../lib/i18nContent";

export default function FavoriteBlocks({
  user,
  search,
  componentType,
  addFunctions,
  isSurveyBuilder,
}) {
  const router = useRouter();
  const currentLocale = router.locale || "en-us"; // fallback to en-us

  const { data, error, loading } = useQuery(FAVORITE_TASKS, {
    variables: {
      where: buildFavoriteTasksWhere({
        userId: user?.id,
        componentType,
        search: search || "",
      }),
    },
    fetchPolicy: "cache-and-network",
    skip: !user?.id || !componentType,
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