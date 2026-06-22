import useTranslation from "next-translate/useTranslation";
import { useMemo } from "react";

import {
  DEFAULT_CURRICULUM_TYPE,
  normalizeCurriculumType,
} from "../../../../../lib/curriculumTypes";

function templateKey(curriculumType, key) {
  return `reviewTemplate.${curriculumType}.${key}`;
}

function buildMindHiveProposal(t) {
  const prefix = "mindhive";
  return [
    {
      name: "1",
      responseType: "selectOne",
      responseOptions: [
        {
          icon: "completed",
          title: t(templateKey(prefix, "readyToMoveForward")),
          subtitle: t(templateKey(prefix, "readyToMoveForwardSubtitle")),
          value: "readyMoveForward",
        },
        {
          icon: "inProgress",
          title: t(templateKey(prefix, "needsMinorAdjustments")),
          subtitle: t(templateKey(prefix, "needsMinorAdjustmentsSubtitle")),
          value: "needsMinorAdjustments",
        },
        {
          icon: "comments",
          title: t(templateKey(prefix, "needsSignificantWork")),
          subtitle: t(templateKey(prefix, "needsSignificantWorkSubtitle")),
          value: "needsSignificantWork",
        },
        {
          icon: "helpNeeded",
          title: t(templateKey(prefix, "requiresReevaluation")),
          subtitle: t(templateKey(prefix, "requiresReevaluationSubtitle")),
          value: "requiresReevaluation",
        },
      ],
      question: t(templateKey(prefix, "proposalReadyQuestion")),
      subtitle: "",
    },
    {
      name: "2",
      responseType: "textarea",
      question: t(templateKey(prefix, "whatDoesStudyDoWell")),
      subtitle: t(templateKey(prefix, "oneSentence")),
    },
    {
      name: "3",
      responseType: "textarea",
      question: t(templateKey(prefix, "isQuestionAnswerable")),
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
      question: t(templateKey(prefix, "additionalComments")),
      subtitle: t(templateKey(prefix, "additionalCommentsSubtitle")),
    },
  ];
}

function buildYouQuantifiedProposal(t) {
  const prefix = "youquantified";
  return [
    {
      name: "1",
      responseType: "selectOne",
      responseOptions: [
        {
          icon: "completed",
          title: t(templateKey(prefix, "readyToMoveForward")),
          subtitle: t(templateKey(prefix, "readyToMoveForwardSubtitle")),
          value: "readyMoveForward",
        },
        {
          icon: "inProgress",
          title: t(templateKey(prefix, "needsMinorAdjustments")),
          subtitle: t(templateKey(prefix, "needsMinorAdjustmentsSubtitle")),
          value: "needsMinorAdjustments",
        },
        {
          icon: "comments",
          title: t(templateKey(prefix, "needsSignificantWork")),
          subtitle: t(templateKey(prefix, "needsSignificantWorkSubtitle")),
          value: "needsSignificantWork",
        },
        {
          icon: "helpNeeded",
          title: t(templateKey(prefix, "requiresReevaluation")),
          subtitle: t(templateKey(prefix, "requiresReevaluationSubtitle")),
          value: "requiresReevaluation",
        },
      ],
      question: t(templateKey(prefix, "proposalReadyQuestion")),
      subtitle: "",
    },
    {
      name: "2",
      responseType: "textarea",
      question: t(templateKey(prefix, "whatDoesStudyDoWell")),
      subtitle: t(templateKey(prefix, "oneSentence")),
    },
    {
      name: "3",
      responseType: "textarea",
      question: t(templateKey(prefix, "isQuestionAnswerable")),
      subtitle: "",
    },
    {
      name: "4",
      responseType: "textarea",
      question: t(templateKey(prefix, "participantAlignmentQuestion")),
      subtitle: t(templateKey(prefix, "participantAlignmentSubtitle")),
    },
    {
      name: "5",
      responseType: "textarea",
      question: t(templateKey(prefix, "additionalComments")),
      subtitle: t(templateKey(prefix, "additionalCommentsSubtitle")),
    },
  ];
}

function buildNyuCuspProposal(t) {
  const prefix = "nyuCusp";
  return [
    {
      name: "1",
      responseType: "textarea",
      question: t(templateKey(prefix, "relevanceQuestion")),
      subtitle: t(templateKey(prefix, "relevanceSubtitle")),
    },
    {
      name: "2",
      responseType: "textarea",
      question: t(templateKey(prefix, "feasibilityQuestion")),
      subtitle: t(templateKey(prefix, "feasibilitySubtitle")),
    },
    {
      name: "3",
      responseType: "textarea",
      question: t(templateKey(prefix, "dataMethodsQuestion")),
      subtitle: t(templateKey(prefix, "dataMethodsSubtitle")),
    },
    {
      name: "4",
      responseType: "textarea",
      question: t(templateKey(prefix, "ethicsQuestion")),
      subtitle: t(templateKey(prefix, "ethicsSubtitle")),
    },
    {
      name: "5",
      responseType: "textarea",
      question: t(templateKey(prefix, "additionalComments")),
      subtitle: t(templateKey(prefix, "additionalCommentsSubtitle")),
    },
  ];
}

function buildPeerReviewItems(t, prefix, questionKeys) {
  return questionKeys.map(({ name, question, subA, subB }) => ({
    name,
    question: t(templateKey(prefix, question)),
    subQuestionA: t(templateKey(prefix, subA)),
    subQuestionB: t(templateKey(prefix, subB)),
  }));
}

const MINDHIVE_PEER_KEYS = [
  {
    name: "1",
    question: "importanceQuestion",
    subA: "importanceSubA",
    subB: "importanceSubB",
  },
  {
    name: "2",
    question: "hypothesisQuestion",
    subA: "hypothesisSubA",
    subB: "hypothesisSubB",
  },
  {
    name: "3",
    question: "designQuestion",
    subA: "designSubA",
    subB: "designSubB",
  },
  {
    name: "4",
    question: "confoundsQuestion",
    subA: "confoundsSubA",
    subB: "confoundsSubB",
  },
  {
    name: "5",
    question: "respectQuestion",
    subA: "respectSubA",
    subB: "respectSubB",
  },
  {
    name: "6",
    question: "participationQuestion",
    subA: "participationSubA",
    subB: "participationSubB",
  },
];

const YOUQUANTIFIED_PEER_KEYS = [
  {
    name: "1",
    question: "engagementQuestion",
    subA: "engagementSubA",
    subB: "engagementSubB",
  },
  {
    name: "2",
    question: "designQuestion",
    subA: "designSubA",
    subB: "designSubB",
  },
  {
    name: "3",
    question: "dataQualityQuestion",
    subA: "dataQualitySubA",
    subB: "dataQualitySubB",
  },
  {
    name: "4",
    question: "ethicsQuestion",
    subA: "ethicsSubA",
    subB: "ethicsSubB",
  },
  {
    name: "5",
    question: "impactQuestion",
    subA: "impactSubA",
    subB: "impactSubB",
  },
  {
    name: "6",
    question: "participationQuestion",
    subA: "participationSubA",
    subB: "participationSubB",
  },
];

const NYU_CUSP_PEER_KEYS = [
  {
    name: "1",
    question: "urbanRelevanceQuestion",
    subA: "urbanRelevanceSubA",
    subB: "urbanRelevanceSubB",
  },
  {
    name: "2",
    question: "methodsQuestion",
    subA: "methodsSubA",
    subB: "methodsSubB",
  },
  {
    name: "3",
    question: "dataQuestion",
    subA: "dataSubA",
    subB: "dataSubB",
  },
  {
    name: "4",
    question: "feasibilityQuestion",
    subA: "feasibilitySubA",
    subB: "feasibilitySubB",
  },
  {
    name: "5",
    question: "deliverablesQuestion",
    subA: "deliverablesSubA",
    subB: "deliverablesSubB",
  },
  {
    name: "6",
    question: "additionalCommentsQuestion",
    subA: "additionalCommentsSubA",
    subB: "additionalCommentsSubB",
  },
];

function buildTemplatesForCurriculum(curriculumType, t) {
  switch (curriculumType) {
    case "youquantified":
      return {
        SUBMITTED_AS_PROPOSAL: buildYouQuantifiedProposal(t),
        PEER_REVIEW: buildPeerReviewItems(t, "youquantified", YOUQUANTIFIED_PEER_KEYS),
      };
    case "nyu_cusp":
      return {
        SUBMITTED_AS_PROPOSAL: buildNyuCuspProposal(t),
        PEER_REVIEW: buildPeerReviewItems(t, "nyuCusp", NYU_CUSP_PEER_KEYS),
      };
    case "mindhive":
    default:
      return {
        SUBMITTED_AS_PROPOSAL: buildMindHiveProposal(t),
        PEER_REVIEW: buildPeerReviewItems(t, "mindhive", MINDHIVE_PEER_KEYS),
      };
  }
}

export function useTemplateQuestions(curriculumType) {
  const { t } = useTranslation("builder");
  const normalizedType = normalizeCurriculumType(
    curriculumType || DEFAULT_CURRICULUM_TYPE
  );

  return useMemo(
    () => buildTemplatesForCurriculum(normalizedType, t),
    [normalizedType, t]
  );
}
