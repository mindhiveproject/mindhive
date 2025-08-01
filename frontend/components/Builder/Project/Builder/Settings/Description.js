import { useState } from "react";
import useTranslation from "next-translate/useTranslation";
import { Dropdown } from "semantic-ui-react";

import ProposalCardSelector from "./ProposalSelector";

export default function StudyDescription({
  study,
  handleChange,
  handleMultipleUpdate,
}) {
  const { t } = useTranslation("builder");
  const [proposalId, setProposalId] = useState(
    study?.descriptionInProposalCard?.section?.board?.id || null
  );

  const proposals = study?.proposal || [];

  const proposalDropdownOptions = proposals.map((proposal) => ({
    key: proposal.id,
    text: proposal.title,
    value: proposal.id,
  }));

  return (
    <div className="studyDescription">
      <h2>{t("descriptionBuilder.title", "Study description")}</h2>
      <p>
        {t(
          "descriptionBuilder.internalUse",
          "This is for internal use only. Participants won't see this description."
        )}
      </p>
      <div className="selector">
        <p>{t("descriptionBuilder.selectSource", "Select a source")}</p>
        <Dropdown
          placeholder={t("descriptionBuilder.linkToProposal", "Link to proposal")}
          fluid
          selection
          options={proposalDropdownOptions}
          onChange={(event, data) => setProposalId(data?.value)}
          value={proposalId}
        />
      </div>

      {proposalId && (
        <ProposalCardSelector
          study={study}
          handleChange={handleChange}
          handleMultipleUpdate={handleMultipleUpdate}
          proposalId={proposalId}
        />
      )}
    </div>
  );
}
