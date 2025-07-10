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
        <div className="goBackButton" onClick={goToOverview}>
          <p>{t("projectBoard.goBack")}</p>
        </div>
        {/* {proposal?.isSubmitted ? (
          <div>
            <h3>{t("projectBoard.submittedAndLocked")}</h3>
          </div>
        ) : (
          <>
            <Radio
              toggle
              checked={isPDF}
              onChange={() => {
                setIsPDF(!isPDF);
              }}
            />
            <span>
              {isPDF ? (
                <div className="preview">
                  {t("projectBoard.preview")}
                  <span className="alert">
                    <Icon name="info circle" />
                    <span>
                      {t("projectBoard.previewInfo")}
                    </span>
                  </span>
                </div>
              ) : (
                <div className="preview">{t("projectBoard.edit")}</div>
              )}
            </span>
          </>
        )} */}
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
