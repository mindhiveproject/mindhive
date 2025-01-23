import ReactHtmlParser from "react-html-parser";
import { StyledActionPage } from "../../../../styles/StyledReview";

export default function CollectivePresentation({ project }) {
  const proposal = project || { sections: [] };

  // find the current section for preview
  const currentSections = proposal?.sections?.filter((section) =>
    section?.cards.map((card) => card?.type).includes("ACTION_SUBMIT")
  );
  let currentSection;
  if (currentSections && currentSections.length) {
    currentSection = currentSections[0];
  }

  const cards = currentSection?.cards.filter(
    (card) => card?.settings?.includeInReport
  );

  return (
    <StyledActionPage>
      <div className="proposal">
        <div className="cards">
          {cards?.map((card) => (
            <div className="card">
              <div className="cardTitleIcon">
                <div className="cardTitle">{card?.title}</div>
              </div>
              <div className="cardText">{ReactHtmlParser(card?.content)}</div>
            </div>
          ))}
        </div>
      </div>
    </StyledActionPage>
  );
}
