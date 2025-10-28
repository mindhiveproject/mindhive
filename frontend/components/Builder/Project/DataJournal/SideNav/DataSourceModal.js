import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_DATASOURCES } from "../../../../Queries/Datasource";
import { UPDATE_VIZPART } from "../../../../Mutations/VizPart";
import { GET_DATA_JOURNALS } from "../../../../Queries/DataArea";

import {
  StyledModalOverlay,
  StyledModalContent,
  StyledModalHeader,
  StyledModalBody,
  StyledModalFooter,
  StyledModalClose,
  StyledModalButton,
  StyledDataSourceList,
  StyledDataSourceOption,
} from "../styles/StyledDataSourceModal";

export default function DataSourceModal({
  projectId,
  studyId,
  isOpen,
  onClose,
  journal,
}) {
  const [selectedDatasources, setSelectedDatasources] = useState(
    journal?.datasources?.map((ds) => ds.id) || []
  );

  const { data, loading, error, refetch } = useQuery(GET_DATASOURCES, {
    variables: {
      where:
        projectId && studyId
          ? {
              OR: [
                { project: { id: { equals: projectId } } },
                { study: { id: { equals: studyId } } },
              ],
            }
          : projectId
          ? { project: { id: { equals: projectId } } }
          : studyId
          ? { study: { id: { equals: studyId } } }
          : null,
    },
  });

  const [updateVizPart, { loading: updateLoading }] = useMutation(
    UPDATE_VIZPART,
    {
      refetchQueries: [
        {
          query: GET_DATA_JOURNALS,
          variables: {
            where:
              projectId && studyId
                ? {
                    OR: [
                      { project: { id: { equals: projectId } } },
                      { study: { id: { equals: studyId } } },
                    ],
                  }
                : projectId
                ? { project: { id: { equals: projectId } } }
                : studyId
                ? { study: { id: { equals: studyId } } }
                : null,
          },
        },
      ],
    }
  );

  const datasources = data?.datasources || [];

  const handleToggleDatasource = (datasourceId, event) => {
    // Prevent double-toggling when clicking the checkbox
    if (event.target.type !== "checkbox") {
      setSelectedDatasources((prev) =>
        prev.includes(datasourceId)
          ? prev.filter((id) => id !== datasourceId)
          : [...prev, datasourceId]
      );
    }
  };

  const handleCheckboxChange = (datasourceId, event) => {
    // Stop propagation to prevent card click handler from firing
    event.stopPropagation();
    setSelectedDatasources((prev) =>
      prev.includes(datasourceId)
        ? prev.filter((id) => id !== datasourceId)
        : [...prev, datasourceId]
    );
  };

  const handleSave = async () => {
    try {
      await updateVizPart({
        variables: {
          id: journal.id,
          input: {
            datasources: {
              set: selectedDatasources.map((id) => ({ id })),
            },
          },
        },
      });
      refetch();
      onClose();
    } catch (err) {
      console.error("Error updating VizPart:", err);
    }
  };

  const originLabels = {
    STUDY: "Study data",
    SIMULATED: "Simulated",
    UPLOADED: "Uploaded",
    TEMPLATE: "Template",
  };

  if (!isOpen) return null;

  return (
    <StyledModalOverlay>
      <StyledModalContent>
        <StyledModalHeader>
          <h2>Select Data Sources</h2>
          <StyledModalClose onClick={onClose}>&times;</StyledModalClose>
        </StyledModalHeader>
        <StyledModalBody>
          {loading && <div>Loading datasets...</div>}
          {error && <div>Error: {error.message}</div>}
          {datasources?.length === 0 && <div>No datasets found</div>}
          {!loading && !error && (
            <StyledDataSourceList>
              {datasources.map((datasource) => {
                const isSelected = selectedDatasources.includes(datasource.id);
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
                  <StyledDataSourceOption
                    key={datasource.id}
                    className={isSelected ? "selected" : ""}
                    onClick={(event) =>
                      handleToggleDatasource(datasource.id, event)
                    }
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(event) =>
                        handleCheckboxChange(datasource.id, event)
                      }
                    />
                    <div className="datasource-details">
                      <div className="datasource-title">
                        {datasource.title || "Untitled Dataset"}
                      </div>
                      <div className="datasource-meta">
                        <span className="origin-badge">{originLabel}</span>
                        <span className="author">
                          by {datasource.author?.username || "Unknown"}
                        </span>
                        <span className="updated">
                          • Last updated {formattedDate}
                        </span>
                      </div>
                    </div>
                  </StyledDataSourceOption>
                );
              })}
            </StyledDataSourceList>
          )}
        </StyledModalBody>
        <StyledModalFooter>
          <StyledModalButton className="cancel" onClick={onClose}>
            Cancel
          </StyledModalButton>
          <StyledModalButton
            className="save"
            onClick={handleSave}
            disabled={updateLoading}
          >
            {updateLoading ? "Saving..." : "Save"}
          </StyledModalButton>
        </StyledModalFooter>
      </StyledModalContent>
    </StyledModalOverlay>
  );
}
