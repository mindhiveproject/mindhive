import { useState } from "react";

import { Dropdown } from "semantic-ui-react";

const statuses = [
  { key: 1, text: "Work in progress", value: "WORKING" },
  { key: 2, text: "Submitted as proposal", value: "SUBMITTED_AS_PROPOSAL" },
  { key: 3, text: "Ready for review", value: "READY_FOR_REVIEW" },
  { key: 4, text: "In review", value: "IN_REVIEW" },
  { key: 5, text: "Reviewed", value: "REVIEWED" },
  { key: 6, text: "Collecting data", value: "COLLECTING_DATA" },
  {
    key: 7,
    text: "Data collection is completed",
    value: "DATA_COLLECTION_IS_COMPLETED",
  },
];

export default function StudyStatus({ study, handleChange, addFunctions }) {
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
      <h2>Study status</h2>

      <div>
        <Dropdown
          placeholder="Study versions"
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
