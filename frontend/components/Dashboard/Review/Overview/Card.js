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

  return (
    <Link
      href={{
        pathname: `/dashboard/review/study`,
        query: { id: study?.id },
      }}
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
        <div className="p13">{study?.title}</div>
        <div className="imageContainer">
          {imageURL ? (
            <img src={imageURL} alt={study?.title} />
          ) : (
            <div className="noImage"></div>
          )}
        </div>
        <div className="lowPanel">
          <div>
            <div className="tag">{status}</div>
          </div>
          <div className="options">
            {study?.status === "IN_REVIEW" && (
              <div className="option">
                <img src="/assets/icons/review/participate.svg" />
                <div>Participate</div>
              </div>
            )}
            <div className="option">
              <img src="/assets/icons/review/review.svg" />
              <div>Comment</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
