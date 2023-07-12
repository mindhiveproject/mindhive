import { useQuery } from "@apollo/client";
import { MY_STUDIES_PROPOSALS_REVIEWS_QUERY } from "../../../Queries/Proposal";
import ProposalList from "../List/Main";

export default function MyStudies({ user }) {
  const { data, loading, error } = useQuery(
    MY_STUDIES_PROPOSALS_REVIEWS_QUERY,
    {
      variables: {
        userId: user?.id,
      },
    }
  );

  const proposals = data?.proposalBoards || [];

  return <ProposalList proposals={proposals} />;
}
