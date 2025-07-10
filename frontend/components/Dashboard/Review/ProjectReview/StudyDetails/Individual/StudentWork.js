import Homework from "./Homework";
import useTranslation from "next-translate/useTranslation";

export default function StudentWork({ studentId, project }) {
  const { t } = useTranslation("builder");
  const proposal = project || { sections: [] };

  const { title, description, sections } = proposal;
  const orderedSections = [...sections].sort((a, b) => a.position - b.position);
  const allCardsContent = orderedSections
    .map((section) => {
      const orderedCards = [...section.cards].sort(
        (a, b) => a.position - b.position
      );
      return orderedCards.filter(
        (card) =>
          card?.shareType === "INDIVIDUAL" &&
          card?.homework?.map((h) => h.author?.id).includes(studentId)
      );
    })
    .flat()
    .map((card) => {
      return {
        title: card?.title,
        studentId: studentId,
        homeworkId: card?.homework
          ?.filter((h) => h.author?.id === studentId)
          .map((h) => h?.id)[0],
      };
    });

  return (
    <>
      {allCardsContent.length === 0 ? (
        <div>{t("reviewDetail.noIndividualWork")}</div>
      ) : (
        allCardsContent.map((card) => <Homework card={card} />)
      )}
    </>
  );
}
