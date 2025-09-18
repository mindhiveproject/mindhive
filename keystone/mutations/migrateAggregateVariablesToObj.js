// this script is setup for a local dev 
function migrateAggregateVariables() {
  fetch("http://localhost:4444/api/graphql/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-apollo-operation-name": "GETTING_TASKS_FOR_AGG_MIGRATION",
      "apollo-require-preflight": "true",
    },
    body: JSON.stringify({
      query: `
      query Tasks($where: TaskWhereInput!) {
        tasks(where: $where) {
          public
          id
          i18nContent
          public
        }
      }
      `,
      variables:
      {
        "where": {
          "public": {
            "equals": true
          }
        }
      }
    }),
  })
    .then((response) => response.json())
    .then((response) => {
      console.log("Fetched tasks:", response);

      const tasks = response.data.tasks || [];

      const data = tasks.map((task) => {
        const i18nContent = { ...task.i18nContent };

        // Iterate over each locale in i18nContent
        for (const locale of Object.keys(i18nContent || {})) {
          const settings = i18nContent[locale]?.settings;

          if (settings?.aggregateVariables) {
            try {
              const parsed = JSON.parse(settings.aggregateVariables);

              // Only migrate if it's still an array of strings
              if (Array.isArray(parsed) && parsed.every((v) => typeof v === "string")) {
                const migrated = parsed.map((v) => ({
                  varName: v,
                  varDesc: "",
                }));

                settings.aggregateVariables = JSON.stringify(migrated);
              }
            } catch (e) {
              console.warn(
                `Skipping migration for task ${task.id} locale ${locale} due to parse error:`,
                e
              );
            }
          }
        }

        return {
          where: { id: task.id },
          data: {
            i18nContent,
          },
        };
      });

      console.log("Prepared task data:", data);

      // Push the updates back
      return fetch("http://localhost:4444/api/graphql/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-apollo-operation-name": "UPDATING_TASKS_AGG_MIGRATION",
          "apollo-require-preflight": "true",
        },
        body: JSON.stringify({
          query: `
            mutation UpdateTasks($data: [TaskUpdateArgs!]!) {
              updateTasks(data: $data) {
                id
                i18nContent
              }
            }
          `,
          variables: { data },
        }),
      });
    })
    .then((response) => response.json())
    .then((result) => {
      console.log("Tasks updated successfully:", result);
    })
    .catch((error) => console.error("Error updating tasks:", error));
}

migrateAggregateVariables();
