import { useState } from "react";

export default function DatasetNameInput({
  datasetName,
  setDatasetName,
  onSubmit,
  onCancel,
}) {
  return (
    <div>
      <h3>New dataset</h3>
      <p>You're creating a new dataset.</p>
      <input
        type="text"
        value={datasetName}
        onChange={(e) => setDatasetName(e.target.value)}
        placeholder="Name of dataset"
        style={{ width: "250px", padding: "8px", margin: "10px 0" }}
      />
      <div style={{ marginTop: "10px" }}>
        <button
          onClick={onSubmit}
          disabled={!datasetName}
          style={{ padding: "8px 16px", marginRight: "10px" }}
        >
          Continue
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: "8px 16px",
            backgroundColor: "#ff4d4d",
            color: "white",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}