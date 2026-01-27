import ReactHtmlParser from "react-html-parser";
import { StyledActionPage } from "../../../../styles/StyledReview";

export default function CollectivePresentation({ project, actionCardType }) {
  const proposal = project || { sections: [] };

  // Filter cards to show only those that are included in this specific review step
  // Cards must have this action card type in their includeInReviewSteps array
  // The includeInReport flag is for the final project report, not for intermediate review steps
  const cards = [...proposal?.sections]
    ?.sort((a, b) => a?.position - b?.position)
    .map((section) =>
      section?.cards.filter(
        (card) =>
          // Only show cards that explicitly include this action card type in their review steps
          card?.settings?.includeInReviewSteps?.includes(actionCardType)
      )
    )
    .flat();

  return (
    <StyledActionPage>
      <div className="proposal">
        <div className="cards">
          {cards?.map((card) => (
            <div key={card?.id} className="card">
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
