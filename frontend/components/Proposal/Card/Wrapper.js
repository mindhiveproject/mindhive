import { useQuery, useMutation } from "@apollo/client";

import { GET_CARD_CONTENT } from "../../Queries/Proposal";

import CardBuilder from "./Builder";
import ActionCardBuilder from "./ActionCardBuilder";
import ProposalCard from "./Main";

import IndividualCard from "./Individual/Main";
import OverviewOfIndividualCards from "./Overview/Main";
import { isActionCard } from "../../../lib/milestones";

export default function CardWrapper({
  user,
  proposal,
  cardId,
  closeCard,
  proposalBuildMode,
  isPreview,
  autoUpdateStudentBoards,
  propagateToClones,
  onTemplateChangedWithoutPropagation,
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

  // TODO also check whether the teacher/mentor is a teacher/mentor of the particular class
  const hasOverviewAccess =
    user?.permissions.map((p) => p?.name).includes("ADMIN") ||
    user?.permissions.map((p) => p?.name).includes("TEACHER") ||
    user?.permissions.map((p) => p?.name).includes("MENTOR");

  if (proposalCard && Object.values(proposalCard).length) {
    if (!proposalBuildMode && proposalCard?.shareType === "INDIVIDUAL") {
      if (hasOverviewAccess) {
        return (
          <OverviewOfIndividualCards
            user={user}
            proposalCard={proposalCard}
            closeCard={closeCard}
            isPreview={isPreview}
          />
        );
      } else {
        return (
          <IndividualCard
            user={user}
            proposalCard={proposalCard}
            closeCard={closeCard}
            isPreview={isPreview}
          />
        );
      }
    } else {
      if (proposalBuildMode) {
        if (isActionCard(proposalCard)) {
          return (
            <ActionCardBuilder
              user={user}
              proposal={proposal}
              proposalCard={proposalCard}
              closeCard={closeCard}
              autoUpdateStudentBoards={autoUpdateStudentBoards}
              propagateToClones={propagateToClones}
              onTemplateChangedWithoutPropagation={onTemplateChangedWithoutPropagation}
            />
          );
        }
        return (
          <CardBuilder
            user={user}
            proposal={proposal}
            proposalCard={proposalCard}
            closeCard={closeCard}
            autoUpdateStudentBoards={autoUpdateStudentBoards}
            propagateToClones={propagateToClones}
            onTemplateChangedWithoutPropagation={onTemplateChangedWithoutPropagation}
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
}
