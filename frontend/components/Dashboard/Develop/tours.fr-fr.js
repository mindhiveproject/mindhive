// https://www.notion.so/mindhive/Develop-242d80abf4c480b08648e7e80bfcd1c1
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