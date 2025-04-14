export default function Card({ study }) {
  const imageURL = study?.image?.image?.publicUrlTransformed;

  let status;
  switch (study?.status) {
    case "SUBMITTED_AS_PROPOSAL":
      status = "Proposal";
      break;
    case "IN_REVIEW":
      status = "Peer Review";
      break;
    case "COLLECTING_DATA":
      status = "Collecting data";
      break;
    default:
      status = "Undefined";
  }

  const shortenTitle = (title) => {
    if (title.length <= 48) {
      return title;
    }
    const truncated = title.substr(0, 48);
    const lastSpaceIndex = truncated.lastIndexOf(" ");
    return title.substr(0, lastSpaceIndex) + "...";
  };

  // Count participants with at least one dataset in COLLECTING_DATA status
  const activeParticipantsCount = [
    ...(study?.participants || []),
    ...(study?.guests || []),
  ].filter((participant) =>
    participant?.datasets?.some(
      (dataset) => dataset?.studyStatus === "COLLECTING_DATA"
    )
  ).length;

  return (
    <div className="card">
      <div className="headline">
        {study?.featured && <div className="p12">Featured study</div>}
        {study?.status !== "COLLECTING_DATA" && (
          <div className="p12">
            {study?.reviews?.filter((r) => r?.stage === study?.status).length}{" "}
            review
            {study?.reviews?.filter((r) => r?.stage === study?.status)
              .length !== 1
              ? `s`
              : ``}
          </div>
        )}
        {study?.status === "COLLECTING_DATA" && (
          <div className="p12">
            {activeParticipantsCount} participant
            {activeParticipantsCount !== 1 ? `s` : ``}
          </div>
        )}
      </div>
      <div className="p13">{shortenTitle(study?.title)}</div>
      <div className="imageContainer">
        {imageURL ? (
          <img src={imageURL} alt={study?.title} />
        ) : (
          <div className="noImage">
            <img src="/logo.png" alt={study?.title} />
          </div>
        )}
      </div>
      <div className="lowPanel">
        <div>
          {status === "Collecting data" &&
            study?.dataCollectionOpenForParticipation && (
              <div className="tag peerreview">{status}</div>
            )}
          {status === "Collecting data" &&
            !study?.dataCollectionOpenForParticipation && (
              <div className="tag closed">Closed for Participation</div>
            )}
        </div>
        <div className="options">
          {study?.status === "COLLECTING_DATA" &&
            study?.dataCollectionOpenForParticipation && (
              <div className="option">
                <img src="/assets/icons/review/participate.svg" />
                <div>Participate</div>
              </div>
            )}

          {study?.status === "IN_REVIEW" && (
            <div className="option">
              <img src="/assets/icons/review/comment.svg" />
              <div>Comment</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
