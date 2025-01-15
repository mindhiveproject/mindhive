import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";

import { Dropdown } from "semantic-ui-react";

import Status from "../Forms/Status";

import { PROPOSAL_QUERY } from "../../../../../../Queries/Proposal";

const items = [
  {
    value: "board",
    name: "Project Board",
  },
  {
    value: "builder",
    name: "Study builder",
  },
  {
    value: "review",
    name: "Review",
  },
  {
    value: "page",
    name: "Participant Page",
  },
  {
    value: "collect",
    name: "Test & Collect",
  },
  {
    value: "visualize",
    name: "Visualize",
  },
  {
    value: "exit",
    name: "Exit Study Builder",
  },
];

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
  const router = useRouter();

  const { area, selector } = query;

  // const id = query?.selector;

  const { data, error, loading } = useQuery(PROPOSAL_QUERY, {
    variables: { id: proposalId },
  });
  const study = data?.proposalBoard || {
    title: "",
  };

  const tryToLeave = (e) => {
    if (hasStudyChanged) {
      if (
        !confirm(
          "Your unsaved changes will be lost. Click Cancel to return and save the changes."
        )
      ) {
        e.preventDefault();
      }
    }
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
        <Status
          settings={inputs?.settings}
          onSettingsChange={handleSettingsChange}
        />

        {cardId && (
          <button
            onClick={async () => {
              await saveBtnFunction();
            }}
            className="saveButton"
          >
            Save
          </button>
        )}
      </div>
    </div>
  );
}
