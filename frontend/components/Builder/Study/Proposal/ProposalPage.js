import { useQuery } from "@apollo/client";
import { OVERVIEW_PROPOSAL_BOARD_QUERY } from "../../../Queries/Proposal";

import { Radio, Icon } from "semantic-ui-react";
import { useState } from "react";

import ProposalPDF from "../../../Proposal/PDF/Main";
import ProposalBuilder from "../../../Proposal/Builder/Main";

export default function ProposalPage({
  user,
  proposalId,
  goToOverview,
  proposalBuildMode,
  refetchQueries,
}) {
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
          <p>← Go back</p>
        </div>
        {proposal?.isSubmitted ? (
          <div>
            <h3>The proposal has been submitted and locked 🔒</h3>
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
                  Preview
                  <span className="alert">
                    <Icon name="info circle" />
                    <span>
                      Content from cards marked as "complete" in edit mode will
                      appear here, in preview mode, displaying what your
                      reviewers will see.
                    </span>
                  </span>
                </div>
              ) : (
                <div className="preview">Edit</div>
              )}
            </span>
          </>
        )}
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
