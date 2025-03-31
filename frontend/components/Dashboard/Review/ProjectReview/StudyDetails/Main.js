import CollectivePresentation from "./Collective";
import IndividualPresentationMain from "./Individual/Main";

export default function StudyDetails({ project, status, actionCardType }) {
  // check all cards whether there is an individual card
  const proposal = project || { sections: [] };
  const { sections } = proposal;

  const individualCards = sections
    .map((section) => {
      return section.cards.filter((card) => card?.shareType === "INDIVIDUAL");
    })
    .flat();

  if (individualCards && individualCards.length) {
    return (
      <IndividualPresentationMain
        project={project}
        status={status}
        actionCardType={actionCardType}
      />
    );
  } else {
    return (
      <CollectivePresentation
        project={project}
        status={status}
        actionCardType={actionCardType}
      />
    );
  }
}
