import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import DropdownSelect from "../../../../DesignSystem/DropdownSelect";
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
    value: proposal.id,
    label: proposal.title,
  }));

  return (
    <div className="settingsSection studyDescription">
      <div className="settingsSectionHeader">
        <h2>
          {t("descriptionBuilder.title", {}, {
            default: "Study description",
          })}
        </h2>
        <p className="settingsSectionNote">
          {t("descriptionBuilder.internalUse", {}, {
            default:
              "This is for internal use only. Participants won't see this description.",
          })}
        </p>
      </div>

      <div className="settingsField">
        <label className="settingsFieldLabel">
          {t("descriptionBuilder.selectSource", {}, {
            default: "Select a source",
          })}
        </label>
        <DropdownSelect
          value={proposalId || ""}
          onChange={setProposalId}
          options={proposalDropdownOptions}
          placeholder={t("descriptionBuilder.linkToProposal", {}, {
            default: "Link to proposal",
          })}
          ariaLabel={t("descriptionBuilder.selectSource", {}, {
            default: "Select a source",
          })}
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
