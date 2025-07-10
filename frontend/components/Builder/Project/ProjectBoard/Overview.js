import useTranslation from "next-translate/useTranslation";
import moment from "moment";

import DeleteProposal from "./Delete";

import { STUDY_PROPOSALS_QUERY } from "../../../Queries/Study";
import MakeMain from "./MakeMain";

export default function ProposalOverview({
  user,
  studyId,
  templates,
  proposals,
  proposalMain,
  openProposal,
  copyProposal,
  createProposal,
}) {
  const { t } = useTranslation("builder");

  const refetchQueries = [
    { query: STUDY_PROPOSALS_QUERY, variables: { id: studyId } },
  ];

  if (proposals?.length === 0) {
    return (
      <div className="empty">
        <h3>{t("overview.zeroState1", "You haven’t created any proposals yet.")}</h3>
        <p>{t("overview.zeroState2", "Once you create a proposal, it will appear here.")}</p>
        <button onClick={() => createProposal()}>{t("overview.createNewProposal", "Create a new proposal")}</button>
      </div>
    );
  }
  return (
    <div className="overview">
      <div className="navigationHeader">
        <div></div>
        <div>
          <button onClick={() => createProposal()}>
            {t("proposal.create")}
          </button>
        </div>
      </div>

      <div>
        <div className="row">
          <div className="proposalHeader">
            <div>{t("overview.proposalName", "Proposal name")}</div>
            <div>{t("overview.dateCreated", "Date created")}</div>
            <div>{t("overview.status", "Status")}</div>
            <div>{t("overview.actions", "Actions")}</div>
          </div>
          <div></div>
        </div>
        {proposals?.map((prop) => (
          <div key={prop?.id}>
            <div className="row">
              <div
                className={
                  prop?.id === proposalMain?.id ? `itemRow main` : `itemRow`
                }
              >
                <div>
                  <p>{prop?.title}</p>
                </div>
                <div>
                  <p>{moment(prop?.createdAt).format("MMMM D, YYYY")}</p>
                </div>
                <div>
                  <p>{prop?.isSubmitted ? t("overview.submitted", "Submitted") : t("overview.notSubmitted", "Not submitted")}</p>
                </div>

                <div className="actionLinks">
                  <button onClick={() => openProposal(prop?.id)}>{t("overview.open", "Open")}</button>
                  <button onClick={() => copyProposal(prop?.id)}>{t("overview.copy", "Copy")}</button>
                  {prop?.id !== proposalMain?.id && (
                    <MakeMain
                      studyId={studyId}
                      proposalId={prop?.id}
                      refetchQueries={refetchQueries}
                    >
                      <button>{t("overview.selectAsMain", "Select as main")}</button>
                    </MakeMain>
                  )}

                  {!prop?.isSubmitted && (
                    <DeleteProposal
                      proposalId={prop?.id}
                      refetchQueries={refetchQueries}
                    >
                      <button>{t("overview.delete", "Delete")}</button>
                    </DeleteProposal>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
