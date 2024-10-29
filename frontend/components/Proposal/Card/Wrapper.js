import { useQuery, useMutation } from "@apollo/client";

import { GET_CARD_CONTENT } from "../../Queries/Proposal";

import ProposalCard from "./Main";
import IndividualCard from "./Individual/Main";

export default function CardWrapper({
  user,
  proposal,
  cardId,
  closeCard,
  proposalBuildMode,
  isPreview,
}) {
  const {
    data,
    loading: getLoading,
    error,
    refetch,
  } = useQuery(GET_CARD_CONTENT, {
    variables: {
      id: cardId,
    },
    fetchPolicy: "cache-and-network",
  });

  const proposalCard = data?.proposalCard || {};

  if (proposalCard && Object.values(proposalCard).length) {
    if (!proposalBuildMode && proposalCard?.shareType === "INDIVIDUAL") {
      return (
        <IndividualCard
          user={user}
          proposalCard={proposalCard}
          closeCard={closeCard}
          isPreview={isPreview}
        />
      );
    } else {
      return (
        <ProposalCard
          user={user}
          proposal={proposal}
          cardId={cardId}
          closeCard={closeCard}
          proposalBuildMode={proposalBuildMode}
          isPreview={isPreview}
          proposalCard={proposalCard}
          refreshPage={refetch}
        />
      );
    }
  }
}
