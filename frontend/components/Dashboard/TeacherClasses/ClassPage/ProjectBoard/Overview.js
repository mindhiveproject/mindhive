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
  const { t } = useTranslation("builder");

  const refetchQueries = [
    {
      query: CLASS_TEMPLATE_PROJECTS_QUERY,
      variables: { classId: myclass?.id },
    },
  ];

  if (proposals?.length === 0) {
    return (
      <div className="empty">
        <h3>You haven’t created any project boards yet.</h3>
        <p>Once you create a project board, it will appear here.</p>
        <button onClick={() => createProposal()}>
          Create a new project board
        </button>
      </div>
    );
  }
  return (
    <div className="overview">
      <div>
        <div className="row">
          <div className="proposalHeader">
            <div>Project board name</div>
            <div>Date created</div>
            <div>Actions</div>
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
                  <button onClick={() => openProposal(prop?.id)}>Open</button>
                  <DeleteProposal
                    proposalId={prop?.id}
                    refetchQueries={refetchQueries}
                  >
                    <button>Delete</button>
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
