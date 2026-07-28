import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import DropdownSelect from "../../../../DesignSystem/DropdownSelect";

export default function StudyStatus({ study, handleChange }) {
  const { t } = useTranslation("builder");

  const statuses = [
    {
      value: "WORKING",
      label: t("status.workInProgress", {}, { default: "Work in progress" }),
    },
    {
      value: "SUBMITTED_AS_PROPOSAL",
      label: t("status.submittedAsProposal", {}, {
        default: "Submitted as proposal",
      }),
    },
    {
      value: "READY_FOR_REVIEW",
      label: t("status.readyForReview", {}, { default: "Ready for review" }),
    },
    {
      value: "IN_REVIEW",
      label: t("status.inReview", {}, { default: "In review" }),
    },
    {
      value: "REVIEWED",
      label: t("status.reviewed", {}, { default: "Reviewed" }),
    },
    {
      value: "COLLECTING_DATA",
      label: t("status.collectingData", {}, { default: "Collecting data" }),
    },
    {
      value: "DATA_COLLECTION_IS_COMPLETED",
      label: t("status.dataCollectionCompleted", {}, {
        default: "Data collection is completed",
      }),
    },
  ];

  const [status, setStatus] = useState(study?.status || "");

  const changeStatus = (nextStatus) => {
    setStatus(nextStatus);
    handleChange({
      target: {
        name: "status",
        value: nextStatus,
      },
    });
  };

  return (
    <div className="settingsSection" id="studyStatus">
      <div className="settingsSectionHeader">
        <h2>{t("status.title", {}, { default: "Study status" })}</h2>
      </div>
      <DropdownSelect
        value={status}
        onChange={changeStatus}
        options={statuses}
        placeholder={t("status.placeholder", {}, {
          default: "Select status",
        })}
        ariaLabel={t("status.title", {}, { default: "Study status" })}
      />
    </div>
  );
}
