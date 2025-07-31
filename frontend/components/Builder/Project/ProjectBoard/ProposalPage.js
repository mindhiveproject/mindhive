import { useQuery, useApolloClient } from "@apollo/client";
import { OVERVIEW_PROPOSAL_BOARD_QUERY } from "../../../Queries/Proposal";
import { Radio, Icon } from "semantic-ui-react";
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
            <h3>{t("proposalPage.submittedLocked", "The proposal has been submitted and locked 🔒")}</h3>
          </div>
        ) : (
          <>
            {isPDF && (
              <>
                <Radio
                  toggle
                  checked={isPDF}
                  onChange={() => {
                    setIsPDF(!isPDF);
                  }}
                />
                <span>
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
                </span>
                <DownloadButton style={{ color: "#fff" }} onClick={() => exportPDF(proposalId, client, t)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <mask id="mask0_2248_374" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
                      <rect width="24" height="24" fill="#D9D9D9"/>
                    </mask>
                    <g mask="url(#mask0_2248_374)">
                      <path d="M5.05 22.375L3.65 20.95L6.6 18H4.35V16H10V21.65H8V19.425L5.05 22.375ZM12 22V20H18V9H13V4H6V14H4V4C4 3.45 4.19583 2.97917 4.5875 2.5875C4.97917 2.19583 5.45 2 6 2H14L20 8V20C20 20.55 19.8042 21.0208 19.4125 21.4125C19.0208 21.8042 18.55 22 18 22H12Z" fill="currentColor"/>
                    </g>
                  </svg>
                  {t("proposalPage.download", "Download")}
                </DownloadButton>
              </>
            )}
          </>
        )}
      </div>
      {isPDF || proposal?.isSubmitted ? (
        <ProposalPDF proposalId={proposalId} />
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
