// Function to update Tasks with i18nContent
function updateTasksWithI18nContent() {
  fetch('http://localhost:4444/api/graphql/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-apollo-operation-name': 'GETTING_TASKS_FOR_I18N',
      'apollo-require-preflight': 'true',
    },
    body: JSON.stringify({
      query: `
      query Tasks {
          tasks {
            id
            title
            i18nContent
            description
            descriptionForParticipants
            settings
          }
        }
      `
    }),
  })
  .then(response => response.json())
  .then(response => {
    console.log('Fetched tasks:', response);
    
    const data = response.data.tasks.map(task => {
      // Create the i18nContent structure
      const i18nContent = {
        "en-us": {
          "title": task?.title || "",
          "description": task?.description || "",
          "descriptionForParticipants": task?.descriptionForParticipants || "",
          "settings": task?.settings || {}
        },
        "es-es": {
          "title": "",
          "description": "",
          "descriptionForParticipants": "",
          "settings": task?.settings || {}
        },
        "zh-cn": {
          "title": "",
          "description": "",
          "descriptionForParticipants": "",
          "settings": task?.settings || {}
        },
        "fr-fr": {
          "title": "",
          "description": "",
          "descriptionForParticipants": "",
          "settings": task?.settings || {}
        },
        "ar-ae": {
          "title": "",
          "description": "",
          "descriptionForParticipants": "",
          "settings": task?.settings || {}
        },
        "hi-in": {
          "title": "",
          "description": "",
          "descriptionForParticipants": "",
          "settings": task?.settings || {}
        },
        "hi-ma": {
          "title": "",
          "description": "",
          "descriptionForParticipants": "",
          "settings": task?.settings || {}
        },
        "ru-ru": {
          "title": "",
          "description": "",
          "descriptionForParticipants": "",
          "settings": task?.settings || {}
        },
        "nl-nl": {
          "title": "",
          "description": "",
          "descriptionForParticipants": "",
          "settings": task?.settings || {}
        },
        "pt-br": {
          "title": "",
          "description": "",
          "descriptionForParticipants": "",
          "settings": task?.settings || {}
        }
      };

      return {
        where: { id: task?.id },
        data: {
          i18nContent: i18nContent
        }
      };
    });

    console.log('Prepared task data:', data);

    // Update the tasks
    return fetch('http://localhost:4444/api/graphql/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-apollo-operation-name': 'UPDATING_TASKS_I18N_CONTENT',
        'apollo-require-preflight': 'true',
      },
      body: JSON.stringify({
        query: `
          mutation UpdateTasks($data: [TaskUpdateArgs!]!) {
            updateTasks(data: $data) {
              id
              title
              i18nContent
            }
          }
        `,
        variables: {
          data
        }
      }),
    });
  })
  .then(response => response.json())
  .then(result => {
    console.log('Tasks updated successfully:', result);
  })
  .catch(error => console.error('Error updating tasks:', error));
}

// Function to update Templates with i18nContent (using i18nContent field)
function updateTemplatesWithI18nContent() {
  fetch('http://localhost:4444/api/graphql/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-apollo-operation-name': 'GETTING_TEMPLATES_FOR_I18N',
      'apollo-require-preflight': 'true',
    },
    body: JSON.stringify({
      query: `
        query Templates {
          templates {
            id
            title
            i18nContent
            description
            settings
            parameters
            shortDescription
          }
        }
      `
    }),
  })
  .then(response => response.json())
  .then(response => {
    console.log('Fetched templates:', response);
    
    const data = response.data.templates.map(template => {
      // Create the i18nContent structure (since Template uses i18nContent as json field)
      const i18nContent = {
        "en-us": {
          "title": template?.title || "",
          "description": template?.description || "",
          "shortDescription": template?.descriptionForParticipants || "",
          "settings": template?.settings || {},
          "parameters": template?.parameters || {}
        },
        "es-es": {
          "title": "",
          "description": "",
          "shortDescription": "",
          "settings": {},
          "parameters": template?.parameters || {}
        },
        "zh-cn": {
          "title": "",
          "description": "",
          "shortDescription": "",
          "settings": {},
          "parameters": template?.parameters || {}
        },
        "fr-fr": {
          "title": "",
          "description": "",
          "shortDescription": "",
          "settings": {},
          "parameters": template?.parameters || {}
        },
        "ar-ae": {
          "title": "",
          "description": "",
          "shortDescription": "",
          "settings": {},
          "parameters": template?.parameters || {}
        },
        "hi-in": {
          "title": "",
          "description": "",
          "shortDescription": "",
          "settings": {},
          "parameters": template?.parameters || {}
        },
        "hi-ma": {
          "title": "",
          "description": "",
          "shortDescription": "",
          "settings": {},
          "parameters": template?.parameters || {}
        },
        "ru-ru": {
          "title": "",
          "description": "",
          "shortDescription": "",
          "settings": {},
          "parameters": template?.parameters || {}
        },
        "nl-nl": {
          "title": "",
          "description": "",
          "shortDescription": "",
          "settings": {},
          "parameters": template?.parameters || {}
        },
        "pt-br": {
          "title": "",
          "description": "",
          "shortDescription": "",
          "settings": {},
          "parameters": template?.parameters || {}
        }
      };

      return {
        where: { id: template?.id },
        data: {
          i18nContent: i18nContent
        }
      };
    });

    console.log('Prepared template data:', data);

    // Update the templates
    return fetch('http://localhost:4444/api/graphql/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-apollo-operation-name': 'UPDATING_TEMPLATES_DISPLAY_TITLE',
        'apollo-require-preflight': 'true',
      },
      body: JSON.stringify({
        query: `
          mutation UpdateTemplates($data: [TemplateUpdateArgs!]!) {
            updateTemplates(data: $data) {
              id
              title
              i18nContent
            }
          }
        `,
        variables: {
          data
        }
      }),
    });
  })
  .then(response => response.json())
  .then(result => {
    console.log('Templates updated successfully:', result);
  })
  .catch(error => console.error('Error updating templates:', error));
}

// Execute both functions
console.log('Starting i18n content migration...');
updateTasksWithI18nContent();
updateTemplatesWithI18nContent();