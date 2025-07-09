import useTranslation from "next-translate/useTranslation";
import moment from "moment";

import DeleteProposal from "./Delete";

import { CLASS_TEMPLATE_PROJECTS_QUERY } from "../../../../Queries/Proposal";

export default function ProposalOverview({
  myclass,
  proposals,
  proposalMain,
  openProposal,
  createProposal,
}) {
  const { t } = useTranslation("classes");

  const refetchQueries = [
    {
      query: CLASS_TEMPLATE_PROJECTS_QUERY,
      variables: { classId: myclass?.id },
    },
  ];

  if (proposals?.length === 0) {
    return (
      <div className="empty">
        <h3>{t("projectBoard.noProjectBoardsYet")}</h3>
        <p>{t("projectBoard.createProjectBoardToAppear")}</p>
        <button onClick={() => createProposal()}>
          {t("projectBoard.createNewProjectBoard")}
        </button>
      </div>
    );
  }
  return (
    <div className="overview">
      <div>
        <div className="row">
          <div className="proposalHeader">
            <div>{t("projectBoard.projectBoardName")}</div>
            <div>{t("projectBoard.dateCreated")}</div>
            <div>{t("projectBoard.actions")}</div>
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

                <div className="actionLinks">
                  <button onClick={() => openProposal(prop?.id)}>{t("projectBoard.open")}</button>
                  <DeleteProposal
                    proposalId={prop?.id}
                    refetchQueries={refetchQueries}
                  >
                    <button>{t("projectBoard.delete")}</button>
                  </DeleteProposal>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
