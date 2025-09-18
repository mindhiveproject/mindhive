import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import { FAVORITE_TASKS } from "../../../../../Queries/Task";
import Card from "./Card";

export default function FavoriteBlocks({
  user,
  search,
  componentType,
  addFunctions,
  isSurveyBuilder,
}) {
  const router = useRouter();
  const currentLocale = router.locale || 'en-us'; // fallback to en-us

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

  const getLocalizedField = (component, fieldName) => {
    // If no i18nContent, return original field value
    if (!component.i18nContent || !component[fieldName]) {
      return component[fieldName];
    }

    // Try to get localized content for current locale
    const localizedContent = component.i18nContent[currentLocale];
    if (localizedContent && localizedContent[fieldName] !== undefined) {
      return localizedContent[fieldName];
    }

    // Fallback to en-us if current locale not found
    if (currentLocale !== 'en-us') {
      const fallbackContent = component.i18nContent['en-us'];
      if (fallbackContent && fallbackContent[fieldName] !== undefined) {
        return fallbackContent[fieldName];
      }
    }

    // Final fallback to original field value
    return component[fieldName];
  };

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
        localizedComponent[fieldName] = getLocalizedField(component, fieldName);
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
          />
        ))}
    </div>
  );
}