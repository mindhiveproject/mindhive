import Link from "next/link";

export default function Card({
  stage,
  project,
  status,
  isOpenForCommentsQuery,
}) {
  const imageURL = null;

  const isOpenForComments = project[isOpenForCommentsQuery];

  const shortenTitle = (title) => {
    if (title?.length <= 48) {
      return title;
    }
    const truncated = title.substr(0, 48);
    const lastSpaceIndex = truncated.lastIndexOf(" ");
    return title.substr(0, lastSpaceIndex) + "...";
  };

  return (
    <div className="card">
      <div className="headline">
        {project?.study?.featured && (
          <div className="p12">Featured project</div>
        )}
        <div className="p12">
          {project?.reviews?.filter((r) => r?.stage === status).length} review
          {project?.reviews?.filter((r) => r?.stage === status).length !== 1
            ? `s`
            : ``}
        </div>
      </div>
      <div className="p13">{shortenTitle(project?.title)}</div>
      <div className="imageContainer">
        {imageURL ? (
          <img src={imageURL} alt={project?.title} />
        ) : (
          <div className="noImage">
            <img src="/logo.png" alt={project?.title} />
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
          {status === "Collecting data" && (
            <div className="tag peerreview">{status}</div>
          )}
        </div>
        <div className="options">
          {/* {(status === "IN_REVIEW" ||
              status === "COLLECTING_DATA") && (
              <div className="option">
                <img src="/assets/icons/review/participate.svg" />
                <div>Participate</div>
              </div>
            )}
            {status !== "COLLECTING_DATA" && (
              <div className="option">
                <img src="/assets/icons/review/comment.svg" />
                <div>Comment</div>
              </div>
            )} */}
          {isOpenForComments ? (
            <div className="option">
              <img src="/assets/icons/review/comment.svg" />
              <div>Comment</div>
            </div>
          ) : (
            <div className="option">
              <img src="/assets/icons/proposal/status-completed.svg" />
              <div>Locked</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
