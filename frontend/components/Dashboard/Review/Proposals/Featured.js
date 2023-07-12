import { useQuery } from "@apollo/client";
import { FEATURED_PROPOSALS_REVIEWS_QUERY } from "../../../Queries/Proposal";
import ProposalList from "../List/Main";

export default function Featured({}) {
  const { data, loading, error } = useQuery(FEATURED_PROPOSALS_REVIEWS_QUERY, {
    variables: {
      featured: true,
      isSubmitted: true,
    },
  });

  const proposals = data?.proposalBoards || [];

  return <ProposalList proposals={proposals} />;
}
