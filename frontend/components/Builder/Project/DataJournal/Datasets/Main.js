// components/DataJournal/Datasets/Main.js
import { useQuery } from "@apollo/client";
import { useState, useMemo } from "react";
import useTranslation from "next-translate/useTranslation";

import { buildDatasourcesWhere } from "../../../../../lib/dataJournalDatasources";
import { useDataJournal } from "../Context/DataJournalContext";
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
} from "../styles/StyledDataJournal"; // Adjust if extracting to Datasets/styles.js

export default function Datasets() {
  const { t } = useTranslation("builder");
  const { user, projectId, studyId } = useDataJournal();

  const datasourcesWhere = useMemo(
    () => buildDatasourcesWhere({ projectId, studyId, userId: user?.id }),
    [projectId, studyId, user?.id],
  );

  const { data, loading, error, refetch } = useQuery(GET_DATASOURCES, {
    variables: { where: datasourcesWhere },
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
    refetch(); // Refresh list after create
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

  if (loading) {
    return (
      <div>
        {t("dataJournal.datasets.loading", {}, { default: "Loading datasets…" })}
      </div>
    );
  }
  if (error) {
    return (
      <div>
        {t(
          "dataJournal.datasets.errorLoading",
          { message: error.message },
          { default: "Error: {{message}}" },
        )}
      </div>
    );
  }

  return (
    <StyledDataArea>
      <StyledDataJournal>
        <StyledRightPanel>
          {!showAddDataset && !editingDataset && !viewingDataset ? (
            <div className="datasets">
              <p className="datasets-list-intro">
                {t("dataJournal.datasets.listIntro", {}, {
                  default:
                    "This list includes datasets stored on this workspace, datasets linked through journal parts, and your own datasets so you can reuse them.",
                })}
              </p>
              <StyledDatasetGrid>
                {datasources.map((datasource) => (
                  <DatasetCard
                    key={datasource.id}
                    datasource={datasource}
                    user={user}
                    projectId={projectId}
                    studyId={studyId}
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
              projectId={projectId}
              studyId={studyId}
              onCancel={handleCancel}
              onCreate={handleCreate}
              refetchDatasources={refetch}
            />
          ) : editingDataset ? (
            <EditDataset
              dataset={editingDataset}
              user={user}
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
