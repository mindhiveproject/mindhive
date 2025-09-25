import { useState } from "react";
import { useMutation } from "@apollo/client";
import {
  UPDATE_DATASOURCE,
  DELETE_DATASOURCE,
} from "../../../../Mutations/Datasource";
import {
  StyledDataArea,
  StyledDataJournal,
  StyledRightPanel,
} from "../styles/StyledDataJournal";

export default function EditDataset({ dataset, onCancel, refetchDatasources }) {
  const [title, setTitle] = useState(dataset.title || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [updateDatasource] = useMutation(UPDATE_DATASOURCE, {
    onCompleted: () => {
      if (refetchDatasources) refetchDatasources();
      onCancel();
    },
    onError: (err) => setError(err.message),
  });

  const [deleteDatasource] = useMutation(DELETE_DATASOURCE, {
    onCompleted: () => {
      if (refetchDatasources) refetchDatasources();
      onCancel();
    },
    onError: (err) => setError(err.message),
  });

  const handleUpdate = () => {
    if (title && title !== dataset.title) {
      setLoading(true);
      updateDatasource({
        variables: {
          id: dataset.id,
          data: { title },
        },
      }).finally(() => setLoading(false));
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this dataset?")) {
      setLoading(true);
      deleteDatasource({
        variables: { id: dataset.id },
      }).finally(() => setLoading(false));
    }
  };

  return (
    <StyledDataArea>
      <StyledDataJournal>
        <StyledRightPanel>
          <h3>Edit Dataset</h3>
          {error && <p style={{ color: "red" }}>Error: {error}</p>}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Dataset title"
            style={{ width: "250px", padding: "8px", margin: "10px 0" }}
          />
          <div style={{ marginTop: "10px" }}>
            <button
              onClick={handleUpdate}
              disabled={loading || title === dataset.title}
              style={{ padding: "8px 16px", marginRight: "10px" }}
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              style={{
                padding: "8px 16px",
                backgroundColor: "#ff4d4d",
                color: "white",
              }}
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
            <button
              onClick={onCancel}
              style={{ padding: "8px 16px", marginLeft: "10px" }}
            >
              Cancel
            </button>
          </div>
        </StyledRightPanel>
      </StyledDataJournal>
    </StyledDataArea>
  );
}
