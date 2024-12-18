import { useState, useEffect } from "react";

import { Dropdown } from "semantic-ui-react";

import { COPY_PROPOSAL_MUTATION } from "../../../../Mutations/Proposal";
import { CLASS_TEMPLATE_PROJECTS_QUERY } from "../../../../Queries/Proposal";

import { useMutation } from "@apollo/client";
import ProposalBuilder from "../../../../Proposal/Builder/Main";

export default function CreateProposal({
  myclass,
  copyProposalId,
  templates,
  isCopy,
  goToOverview,
}) {
  const [proposalId, setProposalId] = useState(copyProposalId || null);
  const [template, setTemplate] = useState(null);

  const [copyProposal, { loading }] = useMutation(COPY_PROPOSAL_MUTATION, {
    variables: {
      id: proposalId,
      classIdTemplate: myclass?.id,
    },
    refetchQueries: [
      {
        query: CLASS_TEMPLATE_PROJECTS_QUERY,
        variables: { classId: myclass?.id },
      },
    ],
  });

  const onTemplateChange = (event, data) => {
    setProposalId(data?.value);
    setTemplate(templates.filter((t) => t?.id == data.value)[0]);
  };

  const dropdownTemplates = templates.map((template) => ({
    key: template.id,
    text: template.title,
    value: template.id,
  }));

  const createProposalCopy = async () => {
    if (!proposalId) {
      return alert("Please choose the proposal template");
    }
    const res = await copyProposal();
    if (res?.data?.copyProposalBoard) {
      goToOverview();
    }
  };

  return (
    <>
      <div className="empty">
        <div className="closeBtn">
          <span onClick={goToOverview}>&times;</span>
        </div>

        <h3>
          {isCopy ? `Copy the project board` : "Create a new project board"}
        </h3>

        {!isCopy && (
          <div className="dropdown">
            <Dropdown
              placeholder="Select project template"
              fluid
              selection
              options={dropdownTemplates}
              onChange={onTemplateChange}
              value={proposalId}
            />
          </div>
        )}

        <button onClick={createProposalCopy}>
          {isCopy ? "Create a copy" : "Create"}
        </button>
      </div>

      {template && !isCopy && (
        <div className="previewTemplate">
          <ProposalBuilder
            proposalId={template?.id}
            proposal={template}
            isPreview
          />
        </div>
      )}
    </>
  );
}
