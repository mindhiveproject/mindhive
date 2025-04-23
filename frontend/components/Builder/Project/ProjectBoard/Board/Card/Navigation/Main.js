import { useQuery } from "@apollo/client";

import Status from "../Forms/Status";

import { PROPOSAL_QUERY } from "../../../../../../Queries/Proposal";

export default function Navigation({
  proposalId,
  query,
  tab,
  user,
  saveBtnFunction,
  toggleSidebar,
  hasContentChanged,
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
          <div
            className="selector"
            onClick={async () => {
              await saveBtnFunction({ shoudBeSaved: false });
            }}
          >
            <img src="/assets/icons/back.svg" alt="back" />
          </div>
        </div>
      </div>
      <div className="middle">
        <span className="studyTitle">{study?.title}</span>
      </div>
      <div className="right">
        <Status
          settings={inputs?.settings}
          onSettingsChange={handleSettingsChange}
        />

        {cardId && (
          <button
            onClick={async () => {
              await saveBtnFunction({ shoudBeSaved: true });
            }}
            className={`saveButton ${hasContentChanged ? "on" : "off"}`}
          >
            Save
          </button>
        )}
      </div>
    </div>
  );
}
