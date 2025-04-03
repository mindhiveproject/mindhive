import ReactHtmlParser from "react-html-parser";
import { StyledActionPage } from "../../../../styles/StyledReview";

export default function CollectivePresentation({ project, actionCardType }) {
  const proposal = project || { sections: [] };

  // find the current section for preview
  const currentSections = proposal?.sections?.filter((section) =>
    section?.cards.map((card) => card?.type).includes(actionCardType)
  );

  const cards = [...proposal?.sections]
    ?.sort((a, b) => a?.position - b?.position)
    .map((section) =>
      section?.cards.filter(
        (card) =>
          (card?.settings?.includeInReport &&
            currentSections?.map((s) => s?.id).includes(card?.section?.id)) ||
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
