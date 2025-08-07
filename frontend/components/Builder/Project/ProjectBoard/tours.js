// https://www.notion.so/mindhive/Study-Builder-Project-Board-242d80abf4c4802281c6cba5adf69549
export const projectBoardTours = {
  overview: {
    title: "Project Board Overview",
    description: "Learn how to navigate and use the project board interface",
    steps: [
      {
        element: '#menue',
        intro: "Use this menu to switch between different components of your project.",
        position: "bottom",
        disableInteraction: false
      },
      {
        element: '#switchMode',
        intro: "Use this toggle to switch between edit (columns and cards) and preview mode (long format; you can still edit the content there).<br><br>This is also the place for you to download your proposal as a PDF.",
        position: "bottom",
        disableInteraction: false
      },
      {
        element: '#section',
        intro: "Columns are there to help you organize your project proposal. Each column contains cards with individual statuses that you can click into. ",
        position: "bottom",
        disableInteraction: false
      },
      {
        element: '#card',
        intro: "Each card contains instruction on how to complete your proposal. You can click on the card to view the instructions and change its status.",
        position: "bottom",
        disableInteraction: false
      },
      {
        element: '#cardWithTag',
        intro: "Cards with this tag will see their content sent to review in the Feedback Center once you have submitted them.<br><br>Each cards contains tags that indicate a which stage of the feedbach process its content should be added to.<br><br>Yellow tags indicate that the card has not been submitted yet, while blue tags indicate that the card has been submitted.",
        position: "bottom",
        disableInteraction: false
      },
      {
        element: '#submitCard',
        intro: "This button lets you submit the cards that are associated with each review stage in the Feedback Center.",
        position: "bottom",
        disableInteraction: false
      },
      {
        element: '#connectArea',
        intro: "Click here to add collaborators to your project and connect it to a class.",
        position: "bottom",
        disableInteraction: false
      }
    ]
  }
}; 