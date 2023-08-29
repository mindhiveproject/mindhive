import Link from "next/link";

export default function ProposalRow({
  proposal,
  showProposalTitle,
  showClass,
  showStatus,
}) {
  let theClass;
  if (proposal?.study?.classes?.length) {
    theClass = proposal?.study?.classes[0].title;
  }

  return (
    <div className="row">
      <div>{proposal?.study?.title}</div>
      <div>{showProposalTitle && <>{proposal?.title}</>}</div>

      {showClass && <div>{theClass}</div>}
      {showStatus && (
        <div className="centered">{proposal?.isSubmitted ? "Yes" : "No"}</div>
      )}

      <div className="centered">
        {
          proposal?.reviews?.filter((review) => review.stage === "INDIVIDUAL")
            .length
        }
      </div>
      <div className="buttons">
        <div>
          <a
            href={`/dashboard/discover/studies/?name=${proposal?.study?.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            Participate
          </a>
        </div>

        <Link
          href={{
            pathname: `/dashboard/review/proposal`,
            query: {
              id: proposal?.id,
              tab: "proposal",
              action: "review",
            },
          }}
        >
          Review
        </Link>

        <Link
          href={{
            pathname: `/dashboard/review/proposal`,
            query: {
              id: proposal?.id,
              tab: "proposal",
              action: "synthesis",
            },
          }}
        >
          Synthesize
        </Link>
      </div>
    </div>
  );
}
