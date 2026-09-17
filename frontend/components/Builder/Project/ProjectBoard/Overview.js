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
}) {
  const { t } = useTranslation("builder");

  const refetchQueries = [
    { query: STUDY_PROPOSALS_QUERY, variables: { id: studyId } },
  ];

  if (proposals?.length === 0) {
    return null;
  }

  if (proposals?.length === 1) {
    return null;
  }

  return (
    <div className="overview" id="overview">
      <div>
        <div className="row">
          <div className="proposalHeader">
            <div>{t("overview.proposalName", {}, { default: "Proposal name" })}</div>
            <div>{t("overview.dateCreated", {}, { default: "Date created" })}</div>
            <div>{t("overview.status", {}, { default: "Status" })}</div>
            <div>{t("overview.actions", {}, { default: "Actions" })}</div>
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
                  <p>
                    {prop?.isSubmitted
                      ? t("overview.submitted", {}, { default: "Submitted" })
                      : t("overview.notSubmitted", {}, { default: "Not submitted" })}
                  </p>
                </div>

                <div className="actionLinks">
                  <button onClick={() => openProposal(prop?.id)}>
                    {t("overview.open", {}, { default: "Open" })}
                  </button>
                  {prop?.id !== proposalMain?.id && (
                    <MakeMain
                      studyId={studyId}
                      proposalId={prop?.id}
                      refetchQueries={refetchQueries}
                    >
                      <button>
                        {t("overview.selectAsMain", {}, {
                          default: "Select as main",
                        })}
                      </button>
                    </MakeMain>
                  )}

                  {!prop?.isSubmitted && (
                    <DeleteProposal
                      proposalId={prop?.id}
                      refetchQueries={refetchQueries}
                    >
                      <button>
                        {t("overview.delete", {}, { default: "Delete" })}
                      </button>
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
