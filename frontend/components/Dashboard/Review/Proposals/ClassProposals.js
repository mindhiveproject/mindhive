import { useQuery } from "@apollo/client";
import { CLASS_PROPOSALS_REVIEWS_QUERY } from "../../../Queries/Proposal";
import ProposalList from "../List/Main";

export default function ClassProposals({ code }) {
  const { data, loading, error } = useQuery(CLASS_PROPOSALS_REVIEWS_QUERY, {
    variables: {
      classCode: code,
      isSubmitted: true,
    },
  });

  const proposals = data?.proposalBoards || [];

  return <ProposalList proposals={proposals} />;
}
