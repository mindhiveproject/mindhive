// YouQuantified curriculum review form seeds — mirrors
// frontend/components/Dashboard/Review/ProjectReview/Review/Template.js
// and frontend/locales/en-us/builder.json reviewTemplate.youquantified.

import {
  buildReviewFormSeed,
  blankProjectReportSeed,
  fieldDualTextarea,
  fieldSelectOneIcon,
  fieldTextarea,
  reviewI18nKey,
  reviewQuestionsCard,
  type FormSeed,
  type SelectOneIconOption,
} from "./buildReviewFormSeed";

const PREFIX = "youquantified";
const CURRICULUM = "youquantified" as const;
const TITLE = "YouQuantified";

const PROPOSAL_READY_OPTIONS: SelectOneIconOption[] = [
  {
    value: "readyMoveForward",
    label: "Ready to Move Forward",
    icon: "completed",
    subtitle:
      "The proposal demonstrates solid understanding and completion of necessary steps.",
  },
  {
    value: "needsMinorAdjustments",
    label: "Needs Minor Adjustments",
    icon: "inProgress",
    subtitle:
      "The proposal is mostly complete but could benefit from small improvements or refinements.",
  },
  {
    value: "needsSignificantWork",
    label: "Needs Significant Work",
    icon: "comments",
    subtitle:
      "The project has major gaps that need attention before moving forward.",
  },
  {
    value: "requiresReevaluation",
    label: "Requires Re-evaluation",
    icon: "helpNeeded",
    subtitle:
      "The proposal may need to be redefined or adjusted before moving forward.",
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
        "Is this proposal ready to move forward or does it need further development?",
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
        "Is the research question answerable with the proposed YouQuantified activities? Do the tasks and surveys align with the question?",
        reviewI18nKey(PREFIX, "isQuestionAnswerable")
      ),
      fieldTextarea(
        "4",
        "Does the proposed participant population align with the research question?",
        reviewI18nKey(PREFIX, "participantAlignmentQuestion"),
        "Do you have suggestions for improving recruitment or inclusion criteria?",
        reviewI18nKey(PREFIX, "participantAlignmentSubtitle")
      ),
      fieldTextarea(
        "5",
        "Use the space below for any additional comments or suggestions.",
        reviewI18nKey(PREFIX, "additionalComments"),
        "Consider clarity of the research question, feasibility within YouQuantified, ethical considerations, and alignment between methods and goals.",
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
        "How compelling and clear is the research question for participants?",
        reviewI18nKey(PREFIX, "engagementQuestion"),
        "Consider whether the topic is engaging and whether instructions are easy to follow.",
        reviewI18nKey(PREFIX, "engagementSubA"),
        "How would you revise the question or framing to increase participant engagement?",
        reviewI18nKey(PREFIX, "engagementSubB")
      ),
      fieldDualTextarea(
        "2",
        "How well does the study design address the research question?",
        reviewI18nKey(PREFIX, "designQuestion"),
        "Consider whether the proposed activities would generate the data needed to answer the question.",
        reviewI18nKey(PREFIX, "designSubA"),
        "How might you improve the study design? Explain your answer.",
        reviewI18nKey(PREFIX, "designSubB")
      ),
      fieldDualTextarea(
        "3",
        "How well does the study design support reliable and meaningful data collection?",
        reviewI18nKey(PREFIX, "dataQualityQuestion"),
        "Consider whether tasks, surveys, and study flow would produce data that answers the research question.",
        reviewI18nKey(PREFIX, "dataQualitySubA"),
        "What changes would improve data quality or interpretability? Explain your answer.",
        reviewI18nKey(PREFIX, "dataQualitySubB")
      ),
      fieldDualTextarea(
        "4",
        "How well does the study address ethical considerations?",
        reviewI18nKey(PREFIX, "ethicsQuestion"),
        "Consider privacy, consent, burden on participants, and potential risks.",
        reviewI18nKey(PREFIX, "ethicsSubA"),
        "What improvements would make the study more ethical or respectful of participants?",
        reviewI18nKey(PREFIX, "ethicsSubB")
      ),
      fieldDualTextarea(
        "5",
        "How meaningful could the findings be for the intended audience?",
        reviewI18nKey(PREFIX, "impactQuestion"),
        "Consider relevance to the field, community, or decision-makers.",
        reviewI18nKey(PREFIX, "impactSubA"),
        "What would strengthen the potential impact of this study?",
        reviewI18nKey(PREFIX, "impactSubB")
      ),
      fieldDualTextarea(
        "6",
        "What was it like to participate in the study?",
        reviewI18nKey(PREFIX, "participationQuestion"),
        "Consider clarity of instructions, interest in the topic, and whether activities reflected real-world choices.",
        reviewI18nKey(PREFIX, "participationSubA"),
        "How would you improve the study to motivate thoughtful participation?",
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

export const YOUQUANTIFIED_REVIEW_FORM_SEEDS: FormSeed[] = [
  SUBMITTED_AS_PROPOSAL,
  PEER_REVIEW,
  PROJECT_REPORT,
];
