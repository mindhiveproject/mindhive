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
        <h3>{t("proposal.zeroState1")}</h3>
        <p>{t("proposal.zeroState2")}</p>
        <button onClick={() => createProposal()}>{t("proposal.create")}</button>
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
            <div>{t("proposal.name", "Proposal name")}</div>
            <div>{t("proposal.dateCreated", "Date created")}</div>
            <div>{t("proposal.status", "Status")}</div>
            <div>{t("proposal.actions", "Actions")}</div>
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
                  <p>{prop?.isSubmitted ? t("proposal.submitted", "Submitted") : t("proposal.notSubmitted", "Not submitted")}</p>
                </div>

                <div className="actionLinks">
                  <button onClick={() => openProposal(prop?.id)}>{t("proposal.open", "Open")}</button>
                  <button onClick={() => copyProposal(prop?.id)}>{t("proposal.copy", "Copy")}</button>
                  {prop?.id !== proposalMain?.id && (
                    <MakeMain
                      studyId={studyId}
                      proposalId={prop?.id}
                      refetchQueries={refetchQueries}
                    >
                      <button>{t("proposal.selectAsMain", "Select as main")}</button>
                    </MakeMain>
                  )}

                  {!prop?.isSubmitted && (
                    <DeleteProposal
                      proposalId={prop?.id}
                      refetchQueries={refetchQueries}
                    >
                      <button>{t("proposal.delete", "Delete")}</button>
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
