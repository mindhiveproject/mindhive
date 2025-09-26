import { useQuery } from "@apollo/client";
import { useState } from "react";
import { GET_DATASOURCES } from "../../../../Queries/Datasource";

import AddDataset from "./AddDataset";
import DatasetCard from "./DatasetCard";
import EditDataset from "./EditDataset";
import DatasetView from "./View/Main";

import {
  StyledDataArea,
  StyledDataJournal,
  StyledRightPanel,
  StyledDatasetGrid,
  StyledAddDataset,
} from "../styles/StyledDataJournal";

export default function Datasets({ user, projectId, studyId }) {
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

  const datasources = data?.datasources || [];
  const [showAddDataset, setShowAddDataset] = useState(false);
  const [editingDataset, setEditingDataset] = useState(null);
  const [viewingDataset, setViewingDataset] = useState(null);

  const handleAddDataset = () => {
    setShowAddDataset(true);
    setEditingDataset(null);
    setViewingDataset(null);
  };

  const handleCancel = () => {
    setShowAddDataset(false);
    setEditingDataset(null);
    setViewingDataset(null);
  };

  const handleCreate = (newDatasource) => {
    // console.log("Dataset created:", newDatasource);
  };

  const handleEdit = (dataset) => {
    setShowAddDataset(false);
    setViewingDataset(null);
    setEditingDataset(dataset);
  };

  const handleView = (dataset) => {
    setShowAddDataset(false);
    setEditingDataset(null);
    setViewingDataset(dataset);
  };

  if (loading) return <div>Loading datasets...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <StyledDataArea>
      <StyledDataJournal>
        <StyledRightPanel>
          {!showAddDataset && !editingDataset && !viewingDataset ? (
            <div className="datasets">
              <StyledDatasetGrid>
                {datasources.map((datasource) => (
                  <DatasetCard
                    key={datasource.id}
                    datasource={datasource}
                    onEdit={handleEdit}
                    onView={handleView}
                  />
                ))}
              </StyledDatasetGrid>
              <StyledAddDataset onClick={handleAddDataset}>
                + Add dataset
              </StyledAddDataset>
            </div>
          ) : showAddDataset ? (
            <AddDataset
              onCancel={handleCancel}
              onCreate={handleCreate}
              refetchDatasources={refetch}
              studyId={studyId}
              projectId={projectId}
            />
          ) : editingDataset ? (
            <EditDataset
              dataset={editingDataset}
              onCancel={handleCancel}
              refetchDatasources={refetch}
            />
          ) : (
            <DatasetView dataset={viewingDataset} onCancel={handleCancel} />
          )}
        </StyledRightPanel>
      </StyledDataJournal>
    </StyledDataArea>
  );
}
