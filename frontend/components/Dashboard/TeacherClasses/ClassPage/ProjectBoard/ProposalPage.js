import { useQuery } from "@apollo/client";
import { OVERVIEW_PROPOSAL_BOARD_QUERY } from "../../../../Queries/Proposal";
import useTranslation from "next-translate/useTranslation";

import ProposalPDF from "../../../../Proposal/PDF/Main";
import ProposalBuilder from "../../../../Proposal/Builder/Main";

export default function ProposalPage({
  user,
  proposalId,
  onBack,
  goToOverview,
  showBackButton = true,
  proposalBuildMode,
  refetchQueries,
  autoOpenAddMilestone = false,
}) {
  const { t } = useTranslation("classes");
  const handleBack = onBack || goToOverview;

  const { data } = useQuery(OVERVIEW_PROPOSAL_BOARD_QUERY, {
    variables: {
      id: proposalId,
    },
  });

  const proposal = data?.proposalBoard || {};

  return (
    <div className="proposalBoard">
      {showBackButton && handleBack ? (
        <div className="previewToggle">
          <button type="button" onClick={handleBack} className="narrowButton">
            ← {t("projectBoard.back", {}, { default: "← Back" })}
          </button>
        </div>
      ) : null}
      {proposal?.isSubmitted ? (
        <ProposalPDF proposalId={proposalId} />
      ) : (
        <ProposalBuilder
          user={user}
          proposal={proposal}
          onClose={handleBack}
          proposalBuildMode={proposalBuildMode}
          refetchQueries={refetchQueries}
          autoOpenAddMilestone={autoOpenAddMilestone}
        />
      )}
    </div>
  );
}
