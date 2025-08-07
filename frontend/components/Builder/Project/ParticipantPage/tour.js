// https://www.notion.so/mindhive/Study-Builder-Participant-Page-245d80abf4c480829782fa7a4a873106
export const participantPageTours = {
    overview: {
      title: "Participant Page Overview",
      description: "Design your participant experience.",
      steps: [
        {
          title: "Participant Page",
          intro: "The participant page is the page that participants will see when they are invited to your study.",
          position: "auto",
          disableInteraction: false
        },
        {
          element: '.preview',
          title: "Preview Panel",
          intro: "Change components in this panel to customize your participant landing page.",
          position: "auto",
          disableInteraction: false
        },
        {
          element: '.uploadImageContainer',
          title: "Add an Image",
          intro: "Add an image to your participant page to make it more engaging.",
          position: "auto",
          disableInteraction: false
        },
        {
          element: '#studyTitle',
          title: "Study Title",
          intro: "Define the title of your study. Careful, this will be the title of the study that participants will see.",
          position: "auto",
          disableInteraction: false
        },
        {
          element: '.description',
          title: "Description",
          intro: "Add a description to your study to give participants more information about what they will be doing.",
          position: "auto",
          disableInteraction: false,
        },
        {
          element: '.infoTabsContainer',
          title: "Additional Information",
          intro: "Add tabs to your participant page to give participants more information about your study.",
          position: "auto",
          disableInteraction: false,
        },
        {
          element: '.timeInformationBlock',
          title: "Duration",
          intro: "Indicate the duration of your study in minutes.",
          position: "auto",
          disableInteraction: false,
          scroll: true,
        },
      ]
    },
    settings: {
      title: "Study Settings",
      description: "Customize your study settings.",
      steps: [
          {
            element: '.settings',
            title: "Available Settings",
            intro: "This panel lets you change the following settings:<ul><li>Share this link with participants to invite them to your study.<br> You can customize your participant link here (make sure not to add special characters here and test your link after!)</li><li>Enalbe mutliple retakes.</li><li>Open or close the study to participants by showing the 'Participate' button.</li><li>Ask for email notifications from participants</li><li>Ask if participant are NYC students</li><li>Ask for zip code from participants</li><li>Enable Guest participation</li><li>Ask for consent from participants (if you select that option, you must add a consent form to your study)</li>Skip the participant page<li>Add External device</li><li>Ask for Sona ID from participants</li><li>Ask if participant is over 18</li></ul>",
            position: "auto",
            disableInteraction: false,
          },        
      ]
    },
  }; 