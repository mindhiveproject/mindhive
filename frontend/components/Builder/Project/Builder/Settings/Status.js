import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import { Dropdown } from "semantic-ui-react";

export default function StudyStatus({ study, handleChange, addFunctions }) {
  const { t } = useTranslation("builder");
  
  const statuses = [
    { key: 1, text: t("status.workInProgress", "Work in progress"), value: "WORKING" },
    { key: 2, text: t("status.submittedAsProposal", "Submitted as proposal"), value: "SUBMITTED_AS_PROPOSAL" },
    { key: 3, text: t("status.readyForReview", "Ready for review"), value: "READY_FOR_REVIEW" },
    { key: 4, text: t("status.inReview", "In review"), value: "IN_REVIEW" },
    { key: 5, text: t("status.reviewed", "Reviewed"), value: "REVIEWED" },
    { key: 6, text: t("status.collectingData", "Collecting data"), value: "COLLECTING_DATA" },
    {
      key: 7,
      text: t("status.dataCollectionCompleted", "Data collection is completed"),
      value: "DATA_COLLECTION_IS_COMPLETED",
    },
  ];

  const [status, setStatus] = useState(study?.status || "");

  const changeStatus = (status) => {
    setStatus(status);
    handleChange({
      target: {
        name: "status",
        value: status,
      },
    });
  };

  return (
    <div className="studyVersion">
      <h2>{t("status.title", "Study status")}</h2>

      <div>
        <Dropdown
          placeholder={t("status.placeholder", "Study versions")}
          fluid
          selection
          options={statuses}
          onChange={(event, data) => changeStatus(data?.value)}
          value={status}
        />
      </div>
    </div>
  );
}
