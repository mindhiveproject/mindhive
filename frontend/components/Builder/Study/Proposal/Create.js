import { useState, useEffect } from "react";

import { Dropdown } from "semantic-ui-react";

import { COPY_PROPOSAL_MUTATION } from "../../../Mutations/Proposal";
import { STUDY_PROPOSALS_QUERY } from "../../../Queries/Study";

import { useMutation } from "@apollo/client";
import ProposalBuilder from "../../../Proposal/Builder/Main";
import useTranslation from "next-translate/useTranslation";

export default function CreateProposal({
  studyId,
  copyProposalId,
  templates,
  isCopy,
  goToOverview,
}) {
  const { t } = useTranslation("builder");
  const [proposalId, setProposalId] = useState(copyProposalId || null);
  const [template, setTemplate] = useState(null);

  const [copyProposal, { loading }] = useMutation(COPY_PROPOSAL_MUTATION, {
    variables: {
      id: proposalId,
      study: studyId,
    },
    refetchQueries: [
      { query: STUDY_PROPOSALS_QUERY, variables: { id: studyId } },
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
      return alert(t("createProposal.selectTemplate", "Please choose the proposal template"));
    }
    const res = await copyProposal({
      variables: {
        id: proposalId,
        study: studyId,
      },
    });
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
          {isCopy ? t("createProposal.copyStudyProposal", "Copy the study proposal") : t("createProposal.createNewStudyProposal", "Create a new study proposal")}
        </h3>

        {!isCopy && (
          <div className="dropdown">
            <Dropdown
              placeholder={t("createProposal.selectTemplate", "Select template")}
              fluid
              selection
              options={dropdownTemplates}
              onChange={onTemplateChange}
              value={proposalId}
            />
          </div>
        )}

        <button onClick={createProposalCopy}>
          {isCopy ? t("createProposal.createCopy", "Create a copy") : t("createProposal.create", "Create")}
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
