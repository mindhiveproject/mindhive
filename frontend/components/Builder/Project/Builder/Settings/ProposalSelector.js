import { useState } from "react";
import useTranslation from "next-translate/useTranslation";
import { useQuery } from "@apollo/client";

import DropdownSelect from "../../../../DesignSystem/DropdownSelect";
import { PROPOSAL_QUERY } from "../../../../Queries/Proposal";

export default function ProposalSelector({ study, handleChange, proposalId }) {
  const { t } = useTranslation("builder");
  const [cardId, setCardId] = useState(
    study?.descriptionInProposalCard?.id || null
  );

  const { data } = useQuery(PROPOSAL_QUERY, {
    variables: { id: proposalId },
  });

  const proposal = data?.proposalBoard || { sections: [] };
  const { sections } = proposal;
  const orderedSections = [...sections].sort((a, b) => a.position - b.position);

  const titleOptions = orderedSections
    .map((section) =>
      [...section.cards].sort((a, b) => a.position - b.position)
    )
    .flat()
    .map((card) => ({
      value: card.id,
      label: card.title,
    }));

  const onSelect = (value) => {
    setCardId(value);
    handleChange({
      target: {
        name: "descriptionInProposalCardId",
        value,
      },
    });
  };

  return (
    <div className="settingsField">
      <label className="settingsFieldLabel">
        {t("proposalSelector.selectCard", {}, { default: "Select card" })}
      </label>
      <DropdownSelect
        value={cardId || ""}
        onChange={onSelect}
        options={titleOptions}
        placeholder={t("proposalSelector.linkToProposal", {}, {
          default: "Link to proposal",
        })}
        ariaLabel={t("proposalSelector.selectCard", {}, {
          default: "Select card",
        })}
      />
    </div>
  );
}
