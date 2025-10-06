import { useQuery } from "@apollo/client";
import { OVERVIEW_PROPOSAL_BOARD_QUERY } from "../../../../Queries/Proposal";
import useTranslation from "next-translate/useTranslation";

import { Radio, Icon } from "semantic-ui-react";
import { useState } from "react";

import ProposalPDF from "../../../../Proposal/PDF/Main";
import ProposalBuilder from "../../../../Proposal/Builder/Main";

export default function ProposalPage({
  user,
  proposalId,
  goToOverview,
  proposalBuildMode,
  refetchQueries,
}) {
  const { t } = useTranslation("classes");
  const [isPDF, setIsPDF] = useState(false);
  const { data, error, loading } = useQuery(OVERVIEW_PROPOSAL_BOARD_QUERY, {
    variables: {
      id: proposalId,
    },
  });

  const proposal = data?.proposalBoard || {};

  return (
    <div className="proposalBoard">
      <div className="previewToggle">
        <button onClick={goToOverview} className="narrowButton">
          <Icon name="angle left"/> {t("board.back", "Back")}
        </button>
      </div>
      {isPDF || proposal?.isSubmitted ? (
        <ProposalPDF proposalId={proposalId} />
      ) : (
        <ProposalBuilder
          user={user}
          proposal={proposal}
          onClose={goToOverview}
          proposalBuildMode={proposalBuildMode}
          refetchQueries={refetchQueries}
        />
      )}
    </div>
  );
}
