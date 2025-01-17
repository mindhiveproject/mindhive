import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";

import { PROPOSAL_QUERY } from "../../../../../../Queries/Proposal";

export default function Navigation({
  proposalId,
  query,
  tab,
  user,
  saveBtnFunction,
  toggleSidebar,
  hasStudyChanged,
  cardId,
  onUpdateCard,
  inputs,
  handleSettingsChange,
}) {
  const { data, error, loading } = useQuery(PROPOSAL_QUERY, {
    variables: { id: proposalId },
  });
  const study = data?.proposalBoard || {
    title: "",
  };

  return (
    <div className="cardNavigation">
      <div className="left">
        <div className="icon">
          <Link
            href={{
              pathname: `/builder/projects/`,
              query: {
                selector: proposalId,
              },
            }}
          >
            <div className="selector">
              <img src="/assets/icons/back.svg" alt="back" />
            </div>
          </Link>
        </div>
      </div>
      <div className="middle">
        <span className="studyTitle">{study?.title}</span>
      </div>
      <div className="right">
        {cardId && (
          <button
            onClick={async () => {
              await saveBtnFunction();
            }}
            className="saveButton"
          >
            Submit for Proposal Feedback
          </button>
        )}
      </div>
    </div>
  );
}
