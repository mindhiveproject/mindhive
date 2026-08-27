import { useQuery } from "@apollo/client";
import Tooltip from "../../../../../../DesignSystem/Tooltip";
import StatusChip from "../../PDF/Preview/StatusChip";
import useTranslation from "next-translate/useTranslation";

import { PROPOSAL_QUERY } from "../../../../../../Queries/Proposal";
import Button from "../../../../../../DesignSystem/Button";

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
            onClick={async () => {
              await saveBtnFunction({ shoudBeSaved: false });
            }}
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
        <StatusChip
          value={inputs?.settings?.status}
          onStatusChange={(newValue) => handleSettingsChange("status", newValue)}
          canEdit
        />
        {/* <Status
          settings={inputs?.settings}
          onSettingsChange={handleSettingsChange}
        /> */}

        {cardId && (
          <Button
            variant="filled"
            onClick={async () => {
              await saveBtnFunction({ shoudBeSaved: true });
            }}
          >
            {t("cardNavigation.save", "Save")}
          </Button>
        )}
      </div>
    </div>
  );
}
