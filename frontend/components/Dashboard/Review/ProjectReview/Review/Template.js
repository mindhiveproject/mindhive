const SUBMITTED_AS_PROPOSAL = [
  {
    name: "1",
    responseType: "selectOne",
    responseOptions: [
      {
        icon: "completed",
        title: "Ready to Move Forward",
        subtitle:
          "The proposal demonstrates solid understanding and completion of the necessary steps.",
        value: "readyMoveForward",
      },
      {
        icon: "inProgress",
        title: "Needs Minor Adjustments",
        subtitle:
          "The proposal is mostly complete but could benefit from small improvements or refinements, such as clarifying the research question or addressing minor gaps.",
        value: "needsMinorAdjustments",
      },
      {
        icon: "comments",
        title: "Needs Significant Work",
        subtitle:
          "The project is incomplete or has major gaps that need attention. It may require more research, a clearer structure, or additional content before moving forward.",
        value: "needsSignificantWork",
      },
      {
        icon: "helpNeeded",
        title: "Requires Re-evaluation",
        subtitle:
          "The proposal may be too ambitious or too narrow for the current phase. It might need to be redefined or adjusted before moving forward.",
        value: "requiresReevaluation",
      },
    ],
    question:
      "Is this proposal ready to move forward or do you feel it needs further development or revisions?",
    subtitle: "",
  },
  {
    name: "2",
    responseType: "textarea",
    question: "What does the study do well?",
    subtitle: "This could just be one sentence.",
  },
  {
    name: "3",
    responseType: "textarea",
    question:
      "Is the investigation question answerable using MindHive tools? Do the proposed tasks and surveys align with the investigation question? Do you have any suggestions for additional or alternative tasks and surveys that might be suitable for this investigation question?",
    subtitle: "",
  },
  {
    name: "4",
    responseType: "taskSelector",
    question: "",
    subtitle: "",
  },
  {
    name: "5",
    responseType: "textarea",
    question: "Use the space below for any additional comments or suggestions",
    subtitle:
      "You can mention anything here, but you might consider: clarity and/or relevance of investigation question, feasibility within the scope of MindHive, ethical obstacles, study motivation/background research, alignment of participant population with the investigation question.",
  },
];

const proposalStageQuestions = [
  {
    name: "1",
    question:
      "What about the proposed study do you find most interesting? (PARTICIPANT DESCRIPTION - WHAT)",
    subQuestionA:
      "Do you have any suggestions to make it sound even more interesting?",
  },
  {
    name: "2",
    question:
      "Is the research question answerable using MindHive tools? Do the proposed tasks and surveys align with the research question? (HOW)",
    subQuestionA:
      "Do you have any suggestions for additional or alternative tasks and surveys that might be suitable for this research question?",
    subQuestionB: "",
  },
  {
    name: "3",
    question:
      "Does the proposed participant population align with the research question? (WHO)",
    subQuestionA: "Do you have any suggestions for improvement?",
    subQuestionB:
      "How might you improve on the study design? Explain your answer.",
  },
  {
    name: "4",
    question: "Do you think the proposed study is feasible?",
    subQuestionA: "If not, what changes might make it more feasible?",
    subQuestionB: "",
  },
  {
    name: "5",
    question: "Do you foresee any possible ethical obstacles?",
    subQuestionA: "If so, do you have any suggestions to overcome these?",
    subQuestionB: "",
  },
  {
    name: "6",
    question: "Is the study well-motivated? (WHY)",
    subQuestionA: "Does the student cite useful sources? Do you see any gaps?",
    subQuestionB: "Do you have any suggestions for improvement?",
  },
  {
    name: "7",
    question: "Is the research question relevant to a broad audience?",
    subQuestionA: "Do you have any suggestions for improvement?",
    subQuestionB: "",
  },
  {
    name: "8",
    question: "Any other thoughts / suggestions?",
    subQuestionA: "",
    subQuestionB: "",
  },
];

const inReviewStageQuestions = [
  {
    name: "1",
    question: "How important is the research question?",
    subQuestionA:
      "Consider whether it addresses a problem that is relevant to society or fills a knowledge gap in a particular field.",
    subQuestionB:
      "How would you revise the research question to clarify its importance? Explain your answer.",
  },
  {
    name: "2",
    question: "How well-defined is the hypothesis?",
    subQuestionA:
      "Consider whether the predictor (i.e. independent) and outcome (i.e. dependent) variables are identified in the hypothesis and whether they are aligned with the research question.",
    subQuestionB:
      "How would you improve the hypothesis statement? Explain your answer.",
  },
  {
    name: "3",
    question: "How well does the study design address the research question?",
    subQuestionA:
      "Consider whether the study design (i.e. tasks and surveys used; study flow) would generate the data necessary to answer the research question.",
    subQuestionB:
      "How might you improve on the study design? Explain your answer.",
  },
  {
    name: "4",
    question:
      "How do the researchers address potential uncontrolled variables and biases in their study design?",
    subQuestionA:
      "If the researchers are unable to account for some of these uncontrolled variables or bias in their study design, how do they address them in their research proposals (e.g. alternative explanations/study limitations)?",
    subQuestionB:
      "What changes would you make to the study design to minimize researcher bias or the impacts of uncontrolled variables? Explain your answer.",
  },
  {
    name: "5",
    question:
      "How well does the study respect participants’ privacy, health, and effort?",
    subQuestionA: "Are the study’s difficulty and duration appropriate?",
    subQuestionB:
      "What improvements would you suggest to ensure that this study is more respectful of participants? Explain your answer.",
  },
  {
    name: "6",
    question:
      "How compelling are the suggestions for follow-up studies or future research?",
    subQuestionA:
      "Consider whether the follow-up studies proposed by the researchers would address relevant unanswered questions, or whether they address limitations of the current study.",
    subQuestionB:
      "What further question(s) would you suggest for a follow-up study? Explain your answer.",
  },
  {
    name: "7",
    question: "What was it like to participate in the study?",
    subQuestionA:
      "Consider whether the instructions were clear and whether the topic and activities were interesting. Did the study activities allow you to accurately represent your real life choices and behaviors?  Why or why not?",
    subQuestionB:
      "How would you improve the study to motivate participants to put time and effort into their responses? Explain your answer.",
  },
];

export const TemplateQuestions = {
  SUBMITTED_AS_PROPOSAL,
};
