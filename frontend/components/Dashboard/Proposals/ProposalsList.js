import { useQuery } from "@apollo/client";
import moment from "moment";
import { GET_MY_PROPOSALS } from "../../Queries/Proposal";

import Link from "next/link";
import DeleteProposal from "../../Builder/Study/Proposal/Delete";

export default function ProposalsList({ query, user }) {
  const { data, error, loading } = useQuery(GET_MY_PROPOSALS, {
    variables: {
      creatorId: user?.id,
    },
  });

  const proposals = data?.proposalBoards || [];

  const refetchQueries = [
    {
      query: GET_MY_PROPOSALS,
      variables: { creatorId: user?.id },
    },
  ];

  return (
    <div className="board">
      <div className="wrapper">
        <div className="heading">
          <p>Title</p>
          <p>Author</p>
          <p>Submitted as a template</p>
          <p>Template</p>
          <p>Created</p>
        </div>
      </div>

      {proposals?.map((proposal, i) => (
        <div key={i} className="wrapper">
          <Link
            href={{
              pathname: `/dashboard/proposals/edit`,
              query: {
                id: proposal?.id,
              },
            }}
          >
            <div key={i} className="item">
              <p>{proposal?.title}</p>
              <p>{proposal?.creator?.username}</p>
              <p>{proposal?.isSubmitted ? "Yes" : "No"}</p>
              <p>{proposal?.isTemplate ? "Yes" : "No"}</p>
              <p>{moment(proposal?.createdAt).format("MMMM D, YYYY")}</p>
            </div>
          </Link>
          <DeleteProposal
            proposalId={proposal?.id}
            refetchQueries={refetchQueries}
          >
            <button>Delete</button>
          </DeleteProposal>
        </div>
      ))}
    </div>
  );
}
