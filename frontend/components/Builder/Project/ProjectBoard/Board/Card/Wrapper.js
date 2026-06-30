import { useQuery } from "@apollo/client";

import { GET_CARD_CONTENT } from "../../../../../Queries/Proposal";
import { buildSubmitStatuses } from "../../../../../../../lib/milestoneStatus";
import { getMilestoneFromCard, isActionCard } from "../../../../../../../lib/milestones";
import { useBoardMilestones } from "../../../../../../../lib/useBoardMilestones";

import ProposalCard from "./Main";
import IndividualCard from "./Individual/Main";
import OverviewOfIndividualCards from "./Overview/Main";
import SubmitAction from "./Actions/Proposal";
import SubmitStudy from "./Actions/SubmitStudy";

export default function CardWrapper({
  query,
  tab,
  user,
  proposalId,
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

  const { milestones } = useBoardMilestones(proposalId);
  const submitStatuses = buildSubmitStatuses(proposal, milestones);

  const sectionsWithCard = proposal?.sections?.filter((section) =>
    section?.cards?.map((c) => c?.id).includes(cardId)
  );
  const section = sectionsWithCard?.length && sectionsWithCard[0];
  const actionCards = section?.cards?.filter((card) => isActionCard(card)) || [];
  const firstAction = actionCards[0];
  const submissionStage =
    firstAction?.milestone?.key || firstAction?.type;
  const submissionStatus =
    submitStatuses[submissionStage] ||
    (firstAction?.type && submitStatuses[firstAction.type]);
  const isCardSubmitted = proposalCard?.settings?.includeInReviewSteps?.some(
    (step) => submitStatuses[step] === "SUBMITTED"
  );
  const isLocked = submissionStatus === "SUBMITTED" || isCardSubmitted;

  // TODO also check whether the teacher/mentor is a teacher/mentor of the particular class
  const hasOverviewAccess =
    user?.permissions.map((p) => p?.name).includes("TEACHER") ||
    user?.permissions.map((p) => p?.name).includes("MENTOR");

  if (proposalCard && Object.values(proposalCard).length) {
    const cardMilestone = getMilestoneFromCard(proposalCard, milestones);
    const isCollectingData =
      proposalCard?.type === "ACTION_COLLECTING_DATA" ||
      cardMilestone?.actionCardType === "ACTION_COLLECTING_DATA" ||
      cardMilestone?.key === "DATA_COLLECTION";

    if (
      !proposalBuildMode &&
      isActionCard(proposalCard) &&
      !isCollectingData
    ) {
      return (
        <SubmitAction
          query={query}
          tab={tab}
          user={user}
          proposalId={proposalId}
          proposal={proposal}
          cardId={cardId}
          proposalCard={proposalCard}
        />
      );
    }

    if (!proposalBuildMode && isCollectingData) {
      return (
        <SubmitStudy
          query={query}
          tab={tab}
          user={user}
          proposalId={proposalId}
          proposal={proposal}
          cardId={cardId}
          proposalCard={proposalCard}
        />
      );
    }

    if (!proposalBuildMode && proposalCard?.shareType === "INDIVIDUAL") {
      if (hasOverviewAccess) {
        return (
          <OverviewOfIndividualCards
            query={query}
            tab={tab}
            user={user}
            proposalId={proposalId}
            proposalCard={proposalCard}
            cardId={cardId}
            closeCard={closeCard}
            isPreview={isPreview}
          />
        );
      } else {
        return (
          <IndividualCard
            query={query}
            tab={tab}
            user={user}
            proposalId={proposalId}
            proposalCard={proposalCard}
            cardId={cardId}
            closeCard={closeCard}
            isPreview={isPreview}
          />
        );
      }
    } else {
      return (
        <ProposalCard
          proposalCard={proposalCard}
          query={query}
          tab={tab}
          user={user}
          proposalId={proposalId}
          proposal={proposal}
          cardId={cardId}
          closeCard={closeCard}
          proposalBuildMode={proposalBuildMode}
          isPreview={isPreview}
          refreshPage={refetch}
          isLocked={isLocked}
          submitStatuses={submitStatuses}
        />
      );
    }
  }
}
