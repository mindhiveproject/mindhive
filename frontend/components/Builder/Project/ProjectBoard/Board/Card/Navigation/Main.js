import { useQuery } from "@apollo/client";
import InfoTooltip from "../../PDF/Preview/InfoTooltip";
import StatusChip from "../../PDF/Preview/StatusChip";
import useTranslation from "next-translate/useTranslation";

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
      <InfoTooltip
        content={study?.title || t("header.myProjectBoard", "My Project Board")}
        delayMs={650}
        wrapperStyle={{ width: "100%", minWidth: 0 }}
        tooltipStyle={{
          width: "400px",
          background: "#F7F9F8",
        }}
      >
        <div className="middle">
          <span className="studyTitle">{study?.title}</span>
        </div>
      </InfoTooltip>
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
          <button
            onClick={async () => {
              await saveBtnFunction({ shoudBeSaved: true });
            }}
            className={`saveButton ${hasContentChanged ? "on" : "off"}`}
          >
            {t("cardNavigation.save", "Save")}
          </button>
        )}
      </div>
    </div>
  );
}
