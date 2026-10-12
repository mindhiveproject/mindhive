import { useQuery } from "@apollo/client";
import Tooltip from "../../../../../../DesignSystem/Tooltip";
import StatusChip from "../../PDF/Preview/StatusChip";
import useTranslation from "next-translate/useTranslation";

import { PROPOSAL_QUERY } from "../../../../../../Queries/Proposal";

export default function Navigation({
  proposalId,
  query,
  tab,
  user,
  onBack,
  saveIndicator,
  inputs,
  handleSettingsChange,
}) {
  const { t } = useTranslation("builder");
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
            onClick={onBack}
          >
            <img src="/assets/icons/back.svg" alt={t("cardNavigation.back", "back")} />
          </div>
        </div>
      </div>
      <Tooltip
        content={study?.title || t("header.myProjectBoard", "My Project Board")}
        side="bottom"
        delayMs={650}
        maxWidth={400}
      >
        <div className="middle">
          <span className="studyTitle">{study?.title}</span>
        </div>
      </Tooltip>
      <div className="right">
        {/* Always rendered so the status chip keeps the grid's last column. */}
        <span style={{ justifySelf: "end" }}>{saveIndicator}</span>
        <StatusChip
          value={inputs?.settings?.status}
          onStatusChange={(newValue) => handleSettingsChange("status", newValue)}
          canEdit
        />
        {/* <Status
          settings={inputs?.settings}
          onSettingsChange={handleSettingsChange}
        /> */}

      </div>
    </div>
  );
}
