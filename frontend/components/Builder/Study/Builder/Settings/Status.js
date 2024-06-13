import { useState } from "react";

import { Dropdown } from "semantic-ui-react";

const statuses = [
  { key: 1, text: "Work in progress", value: "WORKING" },
  { key: 2, text: "Ready for review", value: "READY_FOR_REVIEW" },
  { key: 3, text: "In review", value: "IN_REVIEW" },
  { key: 4, text: "Reviewed", value: "REVIEWED" },
  { key: 5, text: "Collecting data", value: "COLLECTING_DATA" },
  {
    key: 6,
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
