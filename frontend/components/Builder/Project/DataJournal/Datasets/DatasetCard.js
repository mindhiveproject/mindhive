import { useState } from "react";
import { useMutation } from "@apollo/client";
import { DELETE_DATASOURCE } from "../../../../Mutations/Datasource";
import { StyledDatasetCard } from "../styles/StyledDataJournal";

export default function DatasetCard({ datasource, onEdit, onView }) {
  const [deleteDatasource, { loading }] = useMutation(DELETE_DATASOURCE);

  const handleEdit = () => {
    if (onEdit) onEdit(datasource);
  };

  const handleView = () => {
    if (onView) onView(datasource);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this dataset?")) {
      await deleteDatasource({
        variables: { id: datasource.id },
        refetchQueries: ["GET_DATASOURCES"],
      });
    }
  };

  const originLabels = {
    STUDY: "Study data",
    SIMULATED: "Simulated",
    UPLOADED: "Uploaded",
    TEMPLATE: "Template",
  };

  const originLabel =
    originLabels[datasource.dataOrigin] || datasource.dataOrigin;

  const formattedDate = datasource.updatedAt
    ? new Date(datasource.updatedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Never";

  return (
    <StyledDatasetCard>
      <div className="dataset-card" onClick={handleView}>
        <div className="dataset-header">
          <h4 className="dataset-title">
            {datasource.title || "Untitled Dataset"}
          </h4>
          <div className="dataset-actions">
            <button
              className="edit-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              title="Edit dataset"
            >
              ✏️ Edit
            </button>
            <button
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              title="Delete dataset"
              disabled={loading}
            >
              🗑️ Delete
            </button>
          </div>
        </div>

        <div className="dataset-meta">
          <div className="origin-badge">{originLabel}</div>
          <div className="dataset-info">
            <span className="author">
              by {datasource.author?.username || "Unknown"}
            </span>
            <span className="updated">• Last updated {formattedDate}</span>
          </div>
        </div>
      </div>
    </StyledDatasetCard>
  );
}
