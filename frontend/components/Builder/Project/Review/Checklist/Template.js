import useTranslation from "next-translate/useTranslation";

export function getChecklistItems(t) {
  return [
    {
      name: "complete-cards",
      title: t("checklistTemplate.completeCards.title", "Double check that all your proposal cards are complete"),
      description: t(
        "checklistTemplate.completeCards.description",
        "The text in your proposal cards will be aggregated and exported as a PDF file."
      ),
      isComplete: false,
    },
    {
      name: "review-study-page",
      title: t(
        "checklistTemplate.reviewStudyPage.title",
        "Review your study page. That’s what your participants and reviewers will see"
      ),
      description: t(
        "checklistTemplate.reviewStudyPage.description",
        "Think critically about what information you want to allow your participants to see on the study page. You may not want to have any information in the study page that would directly influence participants’ performance on a task/survey.  Are there any details about your study that is best revealed at the completion of your study? "
      ),
      isComplete: false,
    },
    {
      name: "test-as-participant",
      title: t(
        "checklistTemplate.testAsParticipant.title",
        "Have at least 2 people test what it’s like to be a participant in your study"
      ),
      description: t(
        "checklistTemplate.testAsParticipant.description",
        "It’s important to test with at least 2 people before asking your peers to review your study. This testing phase often helps researchers to find errors in study design and allows time to correct for such errors that would otherwise compromise the data. "
      ),
      isComplete: false,
    },
    {
      name: "record-time",
      title: t(
        "checklistTemplate.recordTime.title",
        "Record how long it takes for a participant to complete your study"
      ),
      description: t(
        "checklistTemplate.recordTime.description",
        "This will allow you to put an estimated time to complete on your study page so that participants are aware and can budget time accordingly."
      ),
      isComplete: false,
    },
    {
      name: "export-pdf",
      title: t(
        "checklistTemplate.exportPdf.title",
        "Export and review your proposal as a PDF"
      ),
      description: t(
        "checklistTemplate.exportPdf.description",
        "Your reviewers will be viewing your proposal as a PDF. It is important to check over your proposal as a PDF before submitting. You will also want to make sure to save your PDF so you can refer back to your original proposal at any time."
      ),
      action: "export",
      isComplete: false,
    },
  ];
}
