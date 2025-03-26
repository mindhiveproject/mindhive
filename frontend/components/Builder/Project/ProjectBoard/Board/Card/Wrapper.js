import { useQuery } from "@apollo/client";

import { GET_CARD_CONTENT } from "../../../../../Queries/Proposal";

import ProposalCard from "./Main";
import IndividualCard from "./Individual/Main";
import OverviewOfIndividualCards from "./Overview/Main";
import SubmitAction from "./Actions/Proposal";

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

  const submitStatuses = {
    ACTION_SUBMIT: proposal?.submitProposalStatus,
    ACTION_PEER_FEEDBACK: proposal?.peerFeedbackStatus,
    ACTION_PROJECT_REPORT: proposal?.projectReportStatus,
  };

  const sectionsWithCard = proposal?.sections?.filter((section) =>
    section?.cards?.map((c) => c?.id).includes(cardId)
  );
  const section = sectionsWithCard?.length && sectionsWithCard[0];
  const actionCards = section?.cards
    ?.filter(
      (card) =>
        card?.type === "ACTION_SUBMIT" ||
        card?.type === "ACTION_PEER_FEEDBACK" ||
        card?.type === "ACTION_COLLECTING_DATA" ||
        card?.type === "ACTION_PROJECT_REPORT"
    )
    .map((c) => c?.type);
  const submissionStage = (actionCards?.length && actionCards[0]) || undefined;
  const submissionStatus = submitStatuses[submissionStage];
  const isCardSubmitted = proposalCard?.settings?.includeInReviewSteps?.some(
    (step) => submitStatuses[step] === "SUBMITTED"
  );
  const isLocked = submissionStatus === "SUBMITTED" || isCardSubmitted;

  // TODO also check whether the teacher/mentor is a teacher/mentor of the particular class
  const hasOverviewAccess =
    user?.permissions.map((p) => p?.name).includes("TEACHER") ||
    user?.permissions.map((p) => p?.name).includes("MENTOR");

  if (proposalCard && Object.values(proposalCard).length) {
    if (
      !proposalBuildMode &&
      (proposalCard?.type === "ACTION_SUBMIT" ||
        proposalCard?.type === "ACTION_PEER_FEEDBACK" ||
        proposalCard?.type === "ACTION_COLLECTING_DATA" ||
        proposalCard?.type === "ACTION_PROJECT_REPORT")
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
