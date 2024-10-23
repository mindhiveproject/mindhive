import Link from "next/link";

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

  return (
    <Link
      href={{
        pathname: `/dashboard/review/study`,
        query: { id: study?.id },
      }}
      className="customlink"
    >
      <div className="card">
        <div className="headline">
          {study?.featured && <div className="p12">Featured study</div>}
          <div className="p12">
            {study?.reviews?.filter((r) => r?.stage === study?.status).length}{" "}
            review
            {study?.reviews?.filter((r) => r?.stage === study?.status)
              .length !== 1
              ? `s`
              : ``}
          </div>
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
            {status === "Proposal" && (
              <div className="tag proposal">{status}</div>
            )}
            {status === "Peer Review" && (
              <div className="tag peerreview">{status}</div>
            )}
          </div>
          <div className="options">
            {study?.status === "IN_REVIEW" && (
              <div className="option">
                <img src="/assets/icons/review/participate.svg" />
                <div>Participate</div>
              </div>
            )}
            <div className="option">
              <img src="/assets/icons/review/comment.svg" />
              <div>Comment</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
