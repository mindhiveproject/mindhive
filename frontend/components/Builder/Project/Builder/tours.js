// https://www.notion.so/mindhive/Study-Builder-Study-Builder-242d80abf4c4807bbacfe39f0f5b0e57
export const builderTours = {
  overview: {
    title: "Study Builder Overview",
    description: "Learn the basics of the Study Builder interface",
    steps: [
      {
        element: '#menue',
        title: "Let's explore the Study Builder!",
        intro: "Use this menu to switch between different components of your project.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#canvas',
        title: "Study Builder Canvas",
        intro: "This is your study builder canvas. Here you can drag and drop blocks to create your study.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#commentButton',
        title: "Comment Button",
        intro: "You can add comments to your study here.<br><br> Use this to discuss your study with your collaborators, teachers, and mentors.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#sidepanel',
        title: "Side Panel",
        intro: "This side panel contains all the necessary to build your study.<br><br>Explore each of these with their respective tours.",
        position: "auto",
        disableInteraction: false,
      }
    ]
  },
  addBlock: {
    title: "Explore the 'Add a block' tab",
    description: "Make sure to select the 'Add a block' tab before starting.",
    steps: [
      {
        element: '#addBlock',
        intro: "Click here to see the blocks you can use in your study.",
        position: "auto",
        disableInteraction: false,
      },
      {
        element: '#search',
        intro: "You can search for blocks here ...",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#createdBy',
        intro: "... and filter the blocks by created by here.<br><br>Make sure to select 'Owned by me' to see the blocks you have created yourself.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#sidepanel',
        intro: "This is the menu of blocks you can use in your study.<ul><li>Basic Blocks: These are blocks offering a fully customizable experience for your participants.</li><li>Tasks: Use tasks to measure participant's behavior.</li><li>Survey: Employ these questionnaires to collect data from your participants.</li><li>Study design: Select a block from this category to control your study design, for example, when creating a between-subjects design.</li><li>Templates: Here you can find the same pre-made study that are in the Discover Area.</li></ul>",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#board',
        title: "Let's try!",
        intro: "Add a block to your canvas:<br><img src='/assets/develop/add-block-to-study-builder.gif' alt='add block to canvas' style='max-width: 100%; height: auto;'><br><br>Press 'Next' once you have added a block.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#block',
        intro: "Nice! Now that you have added a block, you can do the following actions ...<br>If you haven't, go back one step and add a block again.",
        position: "top",
        disableInteraction: false
      },
      {
        element: '#blockSettings',
        intro: 'You can click on this gear button to change the settings of your block (displayed language and other parameters)',
        position: "top",
        disableInteraction: false
      },
      {
        element: '#blockInfo',
        intro: 'You can click on this exlamation point button to <ul><li>learn more about what you can use this block for</li><li>See what variable it collects and what they represent</li><li>Find additional ressources</li><ul>',
        position: "top",
        disableInteraction: false
      },
      {
        element: '#blockPlay',
        intro: 'You can click on this play button to preview the block (tip: make sure you test your block after changing its settings!)',
        position: "top",
        disableInteraction: false
      }
    ]
  },
  studyFlow: {
    title: "Explore the 'Study flow' tab",
    description: "Make sure to select the 'Study flow' tab before starting.",
    steps: [
      {
        element: '#flow',
        intro: "The 'Study flow' tab is where you can verify that your study is structured as you expect.<br><br>If you are not happy with the structure, you can always go back and change it in the canvas.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#studyFlow',
        intro: "Here you can see each of the condition that you have created.<br><br>You can see under each condition column the blocks that are part of it.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#firstLine',
        intro: "Here you can see the probability that each condition has to be selected.<br><br>Hover the mouse over the condition to read an explanation of the probability.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#taskBlocks',
        intro: "This is where you find the blocks that are part of the condition.",
        position: "auto",
        disableInteraction: false
      }
    ]
  },
  studySettings: {
    title: "Explore the 'Study settings' tab",
    description: "Make sure to select the 'Study settings' tab before starting.",
    steps: [
      {
        element: '#studySettings',
        intro: "The 'Study settings' tab is where you can configure the settings of your study.",
        position: "left",
        disableInteraction: false
      },
      {
        element: '#studyStatus',
        intro: "Change the status of your study here.",
        position: "left",
        disableInteraction: false,
      },
      {
        element: '#studyVersion',
        intro: "Change the status of your study here.",
        position: "left",
        disableInteraction: false,
      },
      {
        element: '.studyDescription',
        intro: "Fetch the description of your study from you proposal here.",
        position: "left",
        disableInteraction: false,
      },
      {
        element: '#studyTags',
        intro: "Add tags to your study here.",
        position: "left",
        disableInteraction: false,
      }
    ]
  }
}; 