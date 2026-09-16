import { useQuery } from "@apollo/client";

import { GET_CARD_CONTENT } from "../../Queries/Proposal";

import CardBuilder from "./Builder";
import MilestoneCardBuilder from "./MilestoneCardBuilder";
import MilestoneCreateMode from "./MilestoneCreateMode";
import ProposalCard from "./Main";

import IndividualCard from "./Individual/Main";
import OverviewOfIndividualCards from "./Overview/Main";
import { isActionCard } from "../../../lib/milestones";

export default function CardWrapper({
  user,
  proposal,
  cardId,
  isCreateMilestone = false,
  isCreateProposalCard = false,
  sectionId = null,
  openCard,
  closeCard,
  proposalBuildMode,
  isPreview,
  autoUpdateStudentBoards,
  propagateToClones,
  onTemplateChangedWithoutPropagation,
  hideBoardChromeNav = false,
  registerCloseHandler,
  registerCardChrome,
}) {
  const skipCardQuery =
    (isCreateMilestone || isCreateProposalCard) && !cardId;

  const {
    data,
    loading: getLoading,
    error,
    refetch,
  } = useQuery(GET_CARD_CONTENT, {
    variables: {
      id: cardId,
    },
    skip: skipCardQuery || !cardId,
    fetchPolicy: "cache-and-network",
  });

  const proposalCard = data?.proposalCard || {};

  // TODO also check whether the teacher/mentor is a teacher/mentor of the particular class
  const hasOverviewAccess =
    user?.permissions.map((p) => p?.name).includes("ADMIN") ||
    user?.permissions.map((p) => p?.name).includes("TEACHER") ||
    user?.permissions.map((p) => p?.name).includes("MENTOR");

  if (skipCardQuery && proposalBuildMode && isCreateMilestone) {
    return (
      <MilestoneCreateMode
        proposal={proposal}
        sectionId={sectionId}
        onCreated={(createdCardId, cardMeta = {}) => {
          if (createdCardId && openCard) {
            openCard({
              id: createdCardId,
              title: cardMeta.title,
              type: cardMeta.type || "ACTION",
            });
          }
        }}
        closeCard={closeCard}
        autoUpdateStudentBoards={autoUpdateStudentBoards}
        propagateToClones={propagateToClones}
        onTemplateChangedWithoutPropagation={
          onTemplateChangedWithoutPropagation
        }
        hideBoardChromeNav={hideBoardChromeNav}
        registerCloseHandler={registerCloseHandler}
        registerCardChrome={registerCardChrome}
      />
    );
  }

  if (skipCardQuery && proposalBuildMode && isCreateProposalCard) {
    return (
      <CardBuilder
        user={user}
        proposal={proposal}
        proposalCard={null}
        isCreateMode
        sectionId={sectionId}
        onCreated={(createdCardId, cardMeta = {}) => {
          if (createdCardId && openCard) {
            openCard({
              id: createdCardId,
              title: cardMeta.title,
              type: cardMeta.type || "PROPOSAL",
            });
          }
        }}
        closeCard={closeCard}
        autoUpdateStudentBoards={autoUpdateStudentBoards}
        propagateToClones={propagateToClones}
        onTemplateChangedWithoutPropagation={
          onTemplateChangedWithoutPropagation
        }
        hideBoardChromeNav={hideBoardChromeNav}
        registerCloseHandler={registerCloseHandler}
        registerCardChrome={registerCardChrome}
      />
    );
  }

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
            <MilestoneCardBuilder
              user={user}
              proposal={proposal}
              proposalCard={proposalCard}
              closeCard={closeCard}
              autoUpdateStudentBoards={autoUpdateStudentBoards}
              propagateToClones={propagateToClones}
              onTemplateChangedWithoutPropagation={
                onTemplateChangedWithoutPropagation
              }
              hideBoardChromeNav={hideBoardChromeNav}
              registerCloseHandler={registerCloseHandler}
              registerCardChrome={registerCardChrome}
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
            onTemplateChangedWithoutPropagation={
              onTemplateChangedWithoutPropagation
            }
            hideBoardChromeNav={hideBoardChromeNav}
            registerCloseHandler={registerCloseHandler}
            registerCardChrome={registerCardChrome}
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

  if (getLoading) return null;
  if (error) return null;
  return null;
}
