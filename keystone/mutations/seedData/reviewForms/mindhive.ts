// MindHive curriculum review form seeds — mirrors
// frontend/components/Dashboard/Review/ProjectReview/Review/Template.js
// and frontend/locales/en-us/builder.json reviewTemplate.mindhive.

import {
  buildReviewFormSeed,
  blankProjectReportSeed,
  fieldDualTextarea,
  fieldSelectOneIcon,
  fieldTaskSelector,
  fieldTextarea,
  reviewI18nKey,
  reviewQuestionsCard,
  type FormSeed,
  type SelectOneIconOption,
} from "./buildReviewFormSeed";

const PREFIX = "mindhive";
const CURRICULUM = "mindhive" as const;
const TITLE = "MindHive";

const PROPOSAL_READY_OPTIONS: SelectOneIconOption[] = [
  {
    value: "readyMoveForward",
    label: "Ready to Move Forward",
    icon: "completed",
    subtitle:
      "The proposal demonstrates solid understanding and completion of the necessary steps.",
  },
  {
    value: "needsMinorAdjustments",
    label: "Needs Minor Adjustments",
    icon: "inProgress",
    subtitle:
      "The proposal is mostly complete but could benefit from small improvements or refinements, such as clarifying the investigation question or addressing minor gaps.",
  },
  {
    value: "needsSignificantWork",
    label: "Needs Significant Work",
    icon: "comments",
    subtitle:
      "The project is incomplete or has major gaps that need attention. It may require more research, a clearer structure, or additional content before moving forward.",
  },
  {
    value: "requiresReevaluation",
    label: "Requires Re-evaluation",
    icon: "helpNeeded",
    subtitle:
      "The proposal may be too ambitious or too narrow for the current phase. It might need to be redefined or adjusted before moving forward.",
  },
];

const SUBMITTED_AS_PROPOSAL: FormSeed = buildReviewFormSeed({
  kind: "SUBMITTED_AS_PROPOSAL",
  curriculum: CURRICULUM,
  curriculumI18nPrefix: PREFIX,
  curriculumTitle: TITLE,
  cards: [
    reviewQuestionsCard("Proposal review", [
      fieldSelectOneIcon(
        "1",
        "Is this proposal ready to move forward or do you feel it needs further development or revisions?",
        reviewI18nKey(PREFIX, "proposalReadyQuestion"),
        PROPOSAL_READY_OPTIONS
      ),
      fieldTextarea(
        "2",
        "What does the study do well?",
        reviewI18nKey(PREFIX, "whatDoesStudyDoWell"),
        "This could just be one sentence.",
        reviewI18nKey(PREFIX, "oneSentence")
      ),
      fieldTextarea(
        "3",
        "Is the investigation question answerable using MindHive tools? Do the proposed tasks and surveys align with the investigation question? Do you have any suggestions for additional or alternative tasks and surveys that might be suitable for this investigation question?",
        reviewI18nKey(PREFIX, "isQuestionAnswerable")
      ),
      fieldTaskSelector("4"),
      fieldTextarea(
        "5",
        "Use the space below for any additional comments or suggestions.",
        reviewI18nKey(PREFIX, "additionalComments"),
        "You can mention anything here, but you might consider: clarity and/or relevance of the investigation question, feasibility within the scope of MindHive, ethical obstacles, study motivation/background research, alignment of participant population with the investigation question.",
        reviewI18nKey(PREFIX, "additionalCommentsSubtitle")
      ),
    ]),
  ],
});

const PEER_REVIEW: FormSeed = buildReviewFormSeed({
  kind: "PEER_REVIEW",
  curriculum: CURRICULUM,
  curriculumI18nPrefix: PREFIX,
  curriculumTitle: TITLE,
  cards: [
    reviewQuestionsCard("Peer review", [
      fieldDualTextarea(
        "1",
        "How important is the investigation question?",
        reviewI18nKey(PREFIX, "importanceQuestion"),
        "Consider whether it addresses a problem that is relevant to society or fills a knowledge gap in a particular field.",
        reviewI18nKey(PREFIX, "importanceSubA"),
        "How would you revise the investigation question to clarify its importance? Explain your answer.",
        reviewI18nKey(PREFIX, "importanceSubB")
      ),
      fieldDualTextarea(
        "2",
        "How well-defined is the hypothesis?",
        reviewI18nKey(PREFIX, "hypothesisQuestion"),
        "Consider whether the independent and dependent variables are identified in the hypothesis and whether they are aligned with the investigation question.",
        reviewI18nKey(PREFIX, "hypothesisSubA"),
        "How would you improve the hypothesis? Explain your answer.",
        reviewI18nKey(PREFIX, "hypothesisSubB")
      ),
      fieldDualTextarea(
        "3",
        "How well does the study design address the investigation question?",
        reviewI18nKey(PREFIX, "designQuestion"),
        "Consider whether the study design (i.e. tasks and surveys used; study flow) would generate the data necessary to answer the investigation question.",
        reviewI18nKey(PREFIX, "designSubA"),
        "How might you improve on the study design? Explain your answer.",
        reviewI18nKey(PREFIX, "designSubB")
      ),
      fieldDualTextarea(
        "4",
        "How do the researchers address potential confounds and biases in their study design?",
        reviewI18nKey(PREFIX, "confoundsQuestion"),
        "If the researchers are unable to account for some of these confounds or biases in their study design, how do they address them in their study proposals (e.g. alternative explanations/study limitations)?",
        reviewI18nKey(PREFIX, "confoundsSubA"),
        "What changes would you make to the study design to minimize researcher bias or the impacts of confounds? Explain your answer.",
        reviewI18nKey(PREFIX, "confoundsSubB")
      ),
      fieldDualTextarea(
        "5",
        "How well does the study respect participants' privacy, health, and effort?",
        reviewI18nKey(PREFIX, "respectQuestion"),
        "Are the study's difficulty and duration appropriate?",
        reviewI18nKey(PREFIX, "respectSubA"),
        "What improvements would you suggest to ensure that this study is more respectful of participants? Explain your answer.",
        reviewI18nKey(PREFIX, "respectSubB")
      ),
      fieldDualTextarea(
        "6",
        "What was it like to participate in the study?",
        reviewI18nKey(PREFIX, "participationQuestion"),
        "Consider whether the instructions were clear and whether the topic and activities were interesting. Did the study activities allow you to accurately represent your real life choices and behaviors? Why or why not?",
        reviewI18nKey(PREFIX, "participationSubA"),
        "How would you improve the study to motivate participants to put time and effort into their responses? Explain your answer.",
        reviewI18nKey(PREFIX, "participationSubB")
      ),
    ]),
  ],
});

const PROJECT_REPORT: FormSeed = blankProjectReportSeed(
  CURRICULUM,
  PREFIX,
  TITLE
);

export const MINDHIVE_REVIEW_FORM_SEEDS: FormSeed[] = [
  SUBMITTED_AS_PROPOSAL,
  PEER_REVIEW,
  PROJECT_REPORT,
];
