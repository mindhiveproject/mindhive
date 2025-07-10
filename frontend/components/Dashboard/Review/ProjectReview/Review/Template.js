import useTranslation from "next-translate/useTranslation";

export function useTemplateQuestions() {
  const { t } = useTranslation("builder");

  const SUBMITTED_AS_PROPOSAL = [
    {
      name: "1",
      responseType: "selectOne",
      responseOptions: [
        {
          icon: "completed",
          title: t("reviewTemplate.readyToMoveForward"),
          subtitle: t("reviewTemplate.readyToMoveForwardSubtitle"),
          value: "readyMoveForward",
        },
        {
          icon: "inProgress",
          title: t("reviewTemplate.needsMinorAdjustments"),
          subtitle: t("reviewTemplate.needsMinorAdjustmentsSubtitle"),
          value: "needsMinorAdjustments",
        },
        {
          icon: "comments",
          title: t("reviewTemplate.needsSignificantWork"),
          subtitle: t("reviewTemplate.needsSignificantWorkSubtitle"),
          value: "needsSignificantWork",
        },
        {
          icon: "helpNeeded",
          title: t("reviewTemplate.requiresReevaluation"),
          subtitle: t("reviewTemplate.requiresReevaluationSubtitle"),
          value: "requiresReevaluation",
        },
      ],
      question: t("reviewTemplate.proposalReadyQuestion"),
      subtitle: "asdad",
    },
    {
      name: "2",
      responseType: "textarea",
      question: t("reviewTemplate.whatDoesStudyDoWell"),
      subtitle: t("reviewTemplate.oneSentence"),
    },
    {
      name: "3",
      responseType: "textarea",
      question: t("reviewTemplate.isQuestionAnswerable"),
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
      question: t("reviewTemplate.additionalComments"),
      subtitle: t("reviewTemplate.additionalCommentsSubtitle"),
    },
  ];

  const PEER_REVIEW = [
    {
      name: "1",
      question: t("reviewTemplate.importanceQuestion"),
      subQuestionA: t("reviewTemplate.importanceSubA"),
      subQuestionB: t("reviewTemplate.importanceSubB"),
    },
    {
      name: "2",
      question: t("reviewTemplate.hypothesisQuestion"),
      subQuestionA: t("reviewTemplate.hypothesisSubA"),
      subQuestionB: t("reviewTemplate.hypothesisSubB"),
    },
    {
      name: "3",
      question: t("reviewTemplate.designQuestion"),
      subQuestionA: t("reviewTemplate.designSubA"),
      subQuestionB: t("reviewTemplate.designSubB"),
    },
    {
      name: "4",
      question: t("reviewTemplate.confoundsQuestion"),
      subQuestionA: t("reviewTemplate.confoundsSubA"),
      subQuestionB: t("reviewTemplate.confoundsSubB"),
    },
    {
      name: "5",
      question: t("reviewTemplate.respectQuestion"),
      subQuestionA: t("reviewTemplate.respectSubA"),
      subQuestionB: t("reviewTemplate.respectSubB"),
    },
    {
      name: "6",
      question: t("reviewTemplate.participationQuestion"),
      subQuestionA: t("reviewTemplate.participationSubA"),
      subQuestionB: t("reviewTemplate.participationSubB"),
    },
  ];

  return {
    SUBMITTED_AS_PROPOSAL,
    PEER_REVIEW,
  };
}
