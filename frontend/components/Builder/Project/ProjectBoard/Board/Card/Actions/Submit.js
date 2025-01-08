import { StyledReviewPage } from "../../../../../../styles/StyledReview";
import Navigation from "../../../../Navigation/Main";
import Proposal from "./Proposal";

export default function SubmitAction({
  query,
  tab,
  user,
  proposalId,
  proposal,
  cardId,
  closeCard,
  proposalBuildMode,
  isPreview,
  proposalCard,
  refreshPage,
}) {
  return (
    <>
      <Navigation
        query={query}
        user={user}
        tab={tab}
        toggleSidebar={() => {}}
        proposalId={proposalId}
        cardId={cardId}
        saveBtnFunction={() => {
          closeCard({ cardId, lockedByUser: false });
        }}
        saveBtnName="Close"
      />
      <StyledReviewPage>
        <Proposal query={query} user={user} proposal={proposal} />
      </StyledReviewPage>
    </>
  );
}
