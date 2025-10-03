import { useQuery, useApolloClient } from "@apollo/client";
import { OVERVIEW_PROPOSAL_BOARD_QUERY } from "../../../Queries/Proposal";
import { Icon} from "semantic-ui-react";
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";
import ProposalPDF from "./Board/PDF/Main";
import ProposalBuilder from "./Board/Builder/Main";
import { DownloadButton } from "../../../styles/StyledProposal";
import exportPDF from "./Board/PDF/exportPDF";

export default function ProposalPage({ user, proposalId }) {
  const [isPDF, setIsPDF] = useState(false);
  const { t } = useTranslation("builder");
  const client = useApolloClient();
  const { data, error, loading } = useQuery(OVERVIEW_PROPOSAL_BOARD_QUERY, {
    variables: {
      id: proposalId,
    },
  });

  const proposal = data?.proposalBoard || {};

  return (
    <div className="proposalBoard">
      <div className="previewToggle">
        {proposal?.isSubmitted ? (
          <div>
            <h3>
              {t(
                "proposalPage.submittedLocked",
                "The proposal has been submitted and locked 🔒"
              )}
            </h3>
          </div>
        ) : (
          <>
            {isPDF && (
              <>
                <button onClick={() => exportPDF(proposalId, client, t)} className="narrowButtonSecondary">
                  <Icon name="download"/> {t("proposalPage.download", "Download")}
                </button>
                {/* <span>
                  <div className="preview">
                  {t("proposalPage.preview", "Preview")}
                  <span className="alert">
                  <Icon name="info circle" />
                  <span>
                  {t(
                    "proposalPage.previewInfo",
                    'Content from cards marked as "complete" in edit mode will appear here, in preview mode, displaying what your reviewers will see.'
                    )}
                    </span>
                    </span>
                    </div>
                    </span> */}
                <button onClick={() => {setIsPDF(!isPDF);}} className="narrowButton">
                  <Icon name="table"/> {t("proposalPage.viewBoard", "View Board")}
                </button>
              </>
            )}
          </>
        )}
      </div>
      {isPDF || proposal?.isSubmitted ? (
        <ProposalPDF proposalId={proposalId} user={user} />
      ) : (
        <ProposalBuilder
          user={user}
          proposal={proposal}
          onClose={() => {}}
          proposalBuildMode={false}
          refetchQueries={[]}
          isPDF={isPDF}
          setIsPDF={setIsPDF}
        />
      )}
    </div>
  );
}
