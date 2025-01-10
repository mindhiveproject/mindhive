import ReactHtmlParser from "react-html-parser";

export default function CollectivePresentation({ project }) {
  const proposal = project || { sections: [] };

  const { title, description, sections } = proposal;
  const orderedSections = [...sections].sort((a, b) => a.position - b.position);
  const allCardsContent = orderedSections.map((section) => {
    const orderedCards = [...section.cards].sort(
      (a, b) => a.position - b.position
    );
    return orderedCards
      .filter((card) => card?.settings?.status === "Completed")
      .map((card) =>
        [`<h3>${section.title} - `, `${card.title}</h3>`, card.content]
          .flat()
          .join("")
      );
  });

  const cardsContent = allCardsContent.flat().join("");
  let studyURL = "";
  if (proposal?.study?.slug) {
    studyURL = `<h3>Study URL: ${origin}/studies/${proposal?.study?.slug}</h3>`;
  }
  const content = `<h1>${title}</h1><h2>${description}</h2>${studyURL}${cardsContent}`;

  return (
    <div className="studyDetails">
      <>
        <div className="participateLinkWrapper">
          <a
            href={`/dashboard/discover/studies/?name=${proposal?.study?.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            {/* <div className="participateLink">
              <div>Participate in new page</div>
              <img src="/assets/icons/review/new-window.svg" />
            </div> */}
          </a>
        </div>
        {ReactHtmlParser(content)}
      </>

      {/* {proposal?.study?.status === "IN_REVIEW" ? (
        <>
          <div className="participateLinkWrapper">
            <a
              href={`/dashboard/discover/studies/?name=${proposal?.study?.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              <div className="participateLink">
                <div>Participate in new page</div>
                <img src="/assets/icons/review/new-window.svg" />
              </div>
            </a>
          </div>
          {ReactHtmlParser(content)}
        </>
      ) : (
        <div className="noStudyDetailsContainer">
          <div className="p18">
            This study hasn’t been submitted for peer review yet
          </div>
          <div>
            Study details will be displayed here once the study is submitted for
            peer review.
          </div>
        </div>
      )} */}
    </div>
  );
}
