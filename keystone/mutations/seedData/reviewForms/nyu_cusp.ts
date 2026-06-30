// NYU CUSP curriculum review form seeds — mirrors
// frontend/components/Dashboard/Review/ProjectReview/Review/Template.js
// and frontend/locales/en-us/builder.json reviewTemplate.nyuCusp.

import {
  buildReviewFormSeed,
  blankProjectReportSeed,
  fieldDualTextarea,
  fieldTextarea,
  reviewI18nKey,
  reviewQuestionsCard,
  type FormSeed,
} from "./buildReviewFormSeed";

const PREFIX = "nyuCusp";
const CURRICULUM = "nyu_cusp" as const;
const TITLE = "NYU CUSP";

const SUBMITTED_AS_PROPOSAL: FormSeed = buildReviewFormSeed({
  kind: "SUBMITTED_AS_PROPOSAL",
  curriculum: CURRICULUM,
  curriculumI18nPrefix: PREFIX,
  curriculumTitle: TITLE,
  cards: [
    reviewQuestionsCard("Proposal review", [
      fieldTextarea(
        "1",
        "How relevant is this project to urban science and the CUSP mission?",
        reviewI18nKey(PREFIX, "relevanceQuestion"),
        "Consider whether the problem addresses a meaningful urban challenge.",
        reviewI18nKey(PREFIX, "relevanceSubtitle")
      ),
      fieldTextarea(
        "2",
        "Is the proposed capstone project feasible within the academic term and available resources?",
        reviewI18nKey(PREFIX, "feasibilityQuestion"),
        "If not, what changes might make it more feasible?",
        reviewI18nKey(PREFIX, "feasibilitySubtitle")
      ),
      fieldTextarea(
        "3",
        "How appropriate are the proposed data sources and methods?",
        reviewI18nKey(PREFIX, "dataMethodsQuestion"),
        "Consider whether datasets, analysis approach, and tools fit the urban science question.",
        reviewI18nKey(PREFIX, "dataMethodsSubtitle")
      ),
      fieldTextarea(
        "4",
        "Do you foresee ethical or privacy concerns?",
        reviewI18nKey(PREFIX, "ethicsQuestion"),
        "If so, what suggestions do you have to address them?",
        reviewI18nKey(PREFIX, "ethicsSubtitle")
      ),
      fieldTextarea(
        "5",
        "Any other thoughts or suggestions?",
        reviewI18nKey(PREFIX, "additionalComments"),
        "Share anything else mentors or students should consider for this capstone project.",
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
        "How well does the project address a relevant urban science problem?",
        reviewI18nKey(PREFIX, "urbanRelevanceQuestion"),
        "Consider alignment with CUSP's urban data science focus and societal impact.",
        reviewI18nKey(PREFIX, "urbanRelevanceSubA"),
        "How would you sharpen the problem statement or scope?",
        reviewI18nKey(PREFIX, "urbanRelevanceSubB")
      ),
      fieldDualTextarea(
        "2",
        "How sound is the proposed approach to answering the urban science question?",
        reviewI18nKey(PREFIX, "methodsQuestion"),
        "Consider methods, tools, and whether they match the research question.",
        reviewI18nKey(PREFIX, "methodsSubA"),
        "What methodological improvements would you suggest?",
        reviewI18nKey(PREFIX, "methodsSubB")
      ),
      fieldDualTextarea(
        "3",
        "How well do the proposed datasets and analytical methods fit the project goals?",
        reviewI18nKey(PREFIX, "dataQuestion"),
        "Consider data availability, quality, and ethical use.",
        reviewI18nKey(PREFIX, "dataSubA"),
        "What changes would strengthen the data strategy?",
        reviewI18nKey(PREFIX, "dataSubB")
      ),
      fieldDualTextarea(
        "4",
        "Is the proposed capstone project feasible within the academic term and available resources?",
        reviewI18nKey(PREFIX, "feasibilityQuestion"),
        "Consider scope, timeline, data access, and team capacity.",
        reviewI18nKey(PREFIX, "feasibilitySubA"),
        "What changes would make the project more feasible?",
        reviewI18nKey(PREFIX, "feasibilitySubB")
      ),
      fieldDualTextarea(
        "5",
        "How clear and feasible are the expected deliverables?",
        reviewI18nKey(PREFIX, "deliverablesQuestion"),
        "Consider whether outcomes (e.g., dashboard, report, policy brief) match the project scope.",
        reviewI18nKey(PREFIX, "deliverablesSubA"),
        "What deliverable adjustments would improve learning or impact?",
        reviewI18nKey(PREFIX, "deliverablesSubB")
      ),
      fieldDualTextarea(
        "6",
        "Any additional feedback on this capstone project?",
        reviewI18nKey(PREFIX, "additionalCommentsQuestion"),
        "What stands out as a strength or opportunity?",
        reviewI18nKey(PREFIX, "additionalCommentsSubA"),
        "What would you prioritize improving before the next milestone?",
        reviewI18nKey(PREFIX, "additionalCommentsSubB")
      ),
    ]),
  ],
});

const PROJECT_REPORT: FormSeed = blankProjectReportSeed(
  CURRICULUM,
  PREFIX,
  TITLE
);

export const NYU_CUSP_REVIEW_FORM_SEEDS: FormSeed[] = [
  SUBMITTED_AS_PROPOSAL,
  PEER_REVIEW,
  PROJECT_REPORT,
];
