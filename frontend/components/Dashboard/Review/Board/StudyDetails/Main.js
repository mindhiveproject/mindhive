import CollectivePresentation from "./Collective";
import IndividualPresentationMain from "./Individual/Main";

export default function StudyDetails({ study }) {
  // check all cards whether there is an individual card
  const proposal = study?.proposalMain || { sections: [] };
  const { sections } = proposal;

  const individualCards = sections
    .map((section) => {
      return section.cards.filter((card) => card?.shareType === "INDIVIDUAL");
    })
    .flat();

  if (individualCards && individualCards.length) {
    return <IndividualPresentationMain study={study} />;
  } else {
    return <CollectivePresentation study={study} />;
  }
}
