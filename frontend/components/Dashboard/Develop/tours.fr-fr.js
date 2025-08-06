// https://www.notion.so/mindhive/Develop-246d80abf4c4801d9148d00bcd7a3c62
export const developTours = {
  overview: {
    title: "Zone de développement",
    description: "Apprend comment naviguer et utiliser la zone de développement",
    steps: [
      {
        element: '#developNewBtn',
        intro: "Cliquez ici pour commencer à développer un nouveau projet, étude, tâche, enquête ou bloc.",
        position: "bottom",
        disableInteraction: false
      },
      {
        element: '#myPanel', // this id is in the Panels component
        intro: "Cliquez sur le tab ci-dessous pour voir les projets, études, tâches, enquêtes et blocs que vous avez créés.",
        position: "auto",
        disableInteraction: false,
      }
    ]
  }
}; 