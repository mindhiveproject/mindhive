import { useState } from "react";

import { Dropdown } from "semantic-ui-react";

import { COPY_PROPOSAL_MUTATION } from "../../../Mutations/Proposal";
import { STUDY_PROPOSALS_QUERY } from "../../../Queries/Proposal";

import { useMutation } from "@apollo/client";
import ProposalBuilder from "../../../Proposal/Builder/Main";

export default function CreateProposal({
  study,
  templates,
  isCopy,
  goToOverview,
}) {
  const [proposalId, setProposalId] = useState(null);
  const [template, setTemplate] = useState(null);

  console.log({ template });

  const [copyProposal, { loading }] = useMutation(COPY_PROPOSAL_MUTATION, {
    variables: {
      id: proposalId,
      study: study?.id,
    },
    refetchQueries: [
      { query: STUDY_PROPOSALS_QUERY, variables: { studyId: study?.id } },
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
    const res = await copyProposal({
      variables: {
        id: proposalId,
        study: study?.id,
      },
    });
    console.log({ res });
    if (res?.data?.copyProposalBoard) {
      goToOverview();
    }
  };

  return (
    <div>
      <div className="closeBtn">
        <span onClick={goToOverview}>&times;</span>
      </div>

      <h1>
        {isCopy ? `Copy the study proposal` : "Create a new study proposal"}
      </h1>

      <fieldset disabled={loading} aria-busy={loading}>
        {isCopy ? (
          <div>
            <p>Copy the proposal</p>
          </div>
        ) : (
          <div className="dropdown">
            <Dropdown
              placeholder="Select template"
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
      </fieldset>
      <>
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
    </div>
  );
}
