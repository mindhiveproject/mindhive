export const visualizeTours = {
  overview: {
    title: "Hypothesis Visualizer",
    description: "Visualize Your Experimental Hypothesis in MindHive.",
    steps: [
      {
        title: "Hypothesis Visualizer How To?",
        intro: "Follow the steps along to visualize your experimental hypothesis in mindhive.",
        position: "auto",
        disableInteraction: false
      },
      {
        title: "Create a journal",
        element: "#overview",
        intro: `If you don't have a journal yet create one using this button. <br/><img src="/assets/tours/createFromScratch.gif" alt="Create From Scratch button" style="margin-top:10px;max-width:100%;border-radius:8px;"> <br/>If you don't see this button, skip this step.<br/>Note: You don't need data for this part!`,
        position: "right",
        disableInteraction: false,
      },
      {
        title: "Rename your journal",
        element: "#overview",
        intro: `Rename your journal to "My Hypotheses" by clicking on the Edit button in the list on the left.
        <br/><img src="/assets/tours/renameJournal.gif" alt="Rename Journal button" style="margin-top:10px;max-width:100%;border-radius:8px;">`,
        position: "right",
        disableInteraction: false,
      },
      {
        title: "Rename your workspace",
        element: "#document",
        intro: `Rename "Unnamed workspace".
        <br/><img src="/assets/tours/renameworkspaceExperimentalHypothesis.gif" alt="renameworkspace" style="margin-top:10px;max-width:100%;border-radius:8px;">`,
        position: "left",
        disableInteraction: false,
      },
      {
        title: "Create a Hypothesis Visualizer section",
        element: "#document",
        intro: `Now, create a Hypothesis Visualizer section to visualize your experimental hypothesis.
        <br/><img src="/assets/tours/makeExperimentalHypothesis.gif" alt="makeExperimentalHypothesis" style="margin-top:10px;max-width:100%;border-radius:8px;">`,
        position: "left",
        disableInteraction: false,
      },
    ]
  }
};