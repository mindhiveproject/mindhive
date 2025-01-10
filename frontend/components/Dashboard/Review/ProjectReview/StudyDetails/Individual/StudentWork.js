import Homework from "./Homework";

export default function StudentWork({ studentId, project }) {
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
      {allCardsContent.map((card) => (
        <Homework card={card} />
      ))}
    </>
  );
}
