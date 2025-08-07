// https://www.notion.so/mindhive/Study-Builder-Collect-245d80abf4c480ef9496e1e31b8829af
export const collectTours = {
    overview: {
      title: "Collect Tab (Download)",
      description: "Learn how explore your collected data.",
      steps: [
        {
          title: "Collected Tab",
          intro: "Congrats on collecting data! Here you can find all the data that was collected.",
          position: "auto",
          disableInteraction: false
        },
        {
          element: ".shareStudy",
          title: "Quicklinks",
          intro: "Test your study here and copy the link to share it with participants.",
          position: "auto",
          disableInteraction: false
        },
        {
          element: ".downloadOptions",
          title: "Download",
          intro: "Here you can download your study dataset: <ul><li>Aggregated data (see your block details to know more)</li><li>Aggregated data (1 participant = 1 row)</li><li>Raw (not recommended)</li></ul>",
          position: "auto",
          disableInteraction: false
        },
        {
          element: ".downloadByComponent",
          title: "Download a block's data",
          intro: "You can also download the data from one specific block here.<br>Use the dropdown to select the block you want to download and then the type of download you want to do.",
          position: "auto",
          disableInteraction: false
        },
      ]
    },
    tableTour: {
      title: "Collect Tab (Curate)",
      description: "Learn how to curate your collected data (filter participants to include in analysis).",
      steps: [
        {
          title: "Before going further",
          intro: "Be sure that you have at least on participant in your study or you won't be able to see the table described in the following steps.",
          position: "auto",
          disableInteraction: false
        },
        {
          element: "#collectTable",
          title: "Table",
          intro: "Here you can see all the participants that have completed your study. You can filter / sort columns by clicking there headers.",
          position: "auto",
          disableInteraction: false
        },
        {
          title: "Get the best out of the table",
          intro: "Manage / Filter / Sort your columns:<br><img src='/assets/develop/manage-ag-grid-columns.gif' alt='add block to canvas' style='max-width: 100%; height: auto;'>.",
          position: "auto",
          disableInteraction: false
        },
        {
          title: "Don't forget!",
          intro: "Only participants that are checked for analysis will see their data added in your Data Journal:<br><img src='/assets/develop/participant-ckecked-for-analysis.png' alt='add block to canvas' style='max-width: 100%; height: auto;'>.",
          position: "auto",
          disableInteraction: false
        },
      ]
    },
  }; 