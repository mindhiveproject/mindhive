// components/DataJournal/Datasets/Main.js
import { useQuery } from "@apollo/client";
import { useState, useMemo, useEffect, useRef } from "react";
import useTranslation from "next-translate/useTranslation";

import { buildDatasourcesWhereForScope } from "../../../../../lib/dataJournalDatasources";
import { useDataJournal } from "../Context/DataJournalContext";
import { useUserDatasetClassContext } from "../Hooks/useUserDatasetClassContext";
import { GET_DATASOURCES } from "../../../../Queries/Datasource";

import AddDataset from "./AddDataset";
import DatasetCard from "./DatasetCard";
import EditDataset from "./EditDataset";
import DatasetView from "./View/Main";

import {
  StyledDatasetsRoot,
  StyledDatasetGrid,
} from "../styles/StyledDataJournal";

const SCOPE_INTRO_KEYS = {
  uploaded: "dataJournal.datasets.scopes.intro.uploaded",
  sharedWithMe: "dataJournal.datasets.scopes.intro.sharedWithMe",
  myClass: "dataJournal.datasets.scopes.intro.myClass",
  classNetwork: "dataJournal.datasets.scopes.intro.classNetwork",
  public: "dataJournal.datasets.scopes.intro.public",
};

const SCOPE_INTRO_DEFAULTS = {
  uploaded: "Datasets you uploaded.",
  sharedWithMe: "Datasets others shared with you as a collaborator.",
  myClass: "Datasets linked to studies or projects in your classes.",
  classNetwork:
    "Datasets on this project or study from classes in your class networks.",
  public: "Datasets from public journal templates.",
};

const SCOPE_EMPTY_KEYS = {
  uploaded: "dataJournal.datasets.scopes.empty.uploaded",
  sharedWithMe: "dataJournal.datasets.scopes.empty.sharedWithMe",
  myClass: "dataJournal.datasets.scopes.empty.myClass",
  classNetwork: "dataJournal.datasets.scopes.empty.classNetwork",
  public: "dataJournal.datasets.scopes.empty.public",
};

const SCOPE_EMPTY_DEFAULTS = {
  uploaded: "No uploaded datasets yet.",
  sharedWithMe: "No datasets have been shared with you.",
  myClass: "No datasets from your classes yet.",
  classNetwork:
    "No datasets from your class network for this project or study.",
  public: "No public datasets found.",
};

export default function Datasets() {
  const { t } = useTranslation("builder");
  const {
    user,
    projectId,
    studyId,
    datasetScope,
    datasetsListNavNonce,
    datasetsAddRequestNonce,
  } = useDataJournal();

  const { directClassIds, networkClassIds, loading: classesLoading } =
    useUserDatasetClassContext();

  const datasourcesWhere = useMemo(
    () =>
      buildDatasourcesWhereForScope({
        scope: datasetScope,
        projectId,
        studyId,
        userId: user?.id,
        directClassIds,
        networkClassIds,
      }),
    [
      datasetScope,
      projectId,
      studyId,
      user?.id,
      directClassIds,
      networkClassIds,
    ],
  );

  const { data, loading, error, refetch } = useQuery(GET_DATASOURCES, {
    variables: { where: datasourcesWhere },
    skip: classesLoading && (datasetScope === "myClass" || datasetScope === "classNetwork"),
  });

  const datasources = data?.datasources || [];
  const [showAddDataset, setShowAddDataset] = useState(false);
  const [editingDataset, setEditingDataset] = useState(null);
  const [viewingDatasetId, setViewingDatasetId] = useState(null);

  const lastDatasetsListNavNonceRef = useRef(datasetsListNavNonce);
  const lastDatasetScopeRef = useRef(datasetScope);
  const lastDatasetsAddRequestNonceRef = useRef(datasetsAddRequestNonce);

  useEffect(() => {
    if (datasetsListNavNonce === lastDatasetsListNavNonceRef.current) return;
    lastDatasetsListNavNonceRef.current = datasetsListNavNonce;
    setShowAddDataset(false);
    setEditingDataset(null);
    setViewingDatasetId(null);
  }, [datasetsListNavNonce]);

  useEffect(() => {
    if (datasetsAddRequestNonce === lastDatasetsAddRequestNonceRef.current) {
      return;
    }
    lastDatasetsAddRequestNonceRef.current = datasetsAddRequestNonce;
    setShowAddDataset(true);
    setEditingDataset(null);
    setViewingDatasetId(null);
  }, [datasetsAddRequestNonce]);

  useEffect(() => {
    if (datasetScope === lastDatasetScopeRef.current) return;
    lastDatasetScopeRef.current = datasetScope;
    setShowAddDataset(false);
    setEditingDataset(null);
    setViewingDatasetId(null);
  }, [datasetScope]);

  const viewingDataset = useMemo(
    () =>
      viewingDatasetId
        ? datasources.find((d) => d.id === viewingDatasetId) || null
        : null,
    [datasources, viewingDatasetId],
  );

  const scopeIntro = t(
    SCOPE_INTRO_KEYS[datasetScope] || SCOPE_INTRO_KEYS.uploaded,
    {},
    { default: SCOPE_INTRO_DEFAULTS[datasetScope] || SCOPE_INTRO_DEFAULTS.uploaded },
  );

  const scopeEmptyMessage = t(
    SCOPE_EMPTY_KEYS[datasetScope] || SCOPE_EMPTY_KEYS.uploaded,
    {},
    { default: SCOPE_EMPTY_DEFAULTS[datasetScope] || SCOPE_EMPTY_DEFAULTS.uploaded },
  );

  const handleCancel = () => {
    setShowAddDataset(false);
    setEditingDataset(null);
    setViewingDatasetId(null);
  };

  const handleCreate = () => {
    refetch();
  };

  const handleEdit = (dataset) => {
    setShowAddDataset(false);
    setViewingDatasetId(null);
    setEditingDataset(dataset);
  };

  const handleView = (dataset) => {
    setShowAddDataset(false);
    setEditingDataset(null);
    setViewingDatasetId(dataset?.id || null);
  };

  const handleDatasetCopied = async (newId) => {
    await refetch();
    if (newId) setViewingDatasetId(newId);
  };

  const isListLoading = loading || (classesLoading && (datasetScope === "myClass" || datasetScope === "classNetwork"));

  if (isListLoading) {
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
    <StyledDatasetsRoot>
      {!showAddDataset && !editingDataset && !viewingDatasetId ? (
        <div className="datasets">
          <p className="datasets-list-intro">{scopeIntro}</p>
          {datasources.length === 0 ? (
            <p className="datasets-list-empty">{scopeEmptyMessage}</p>
          ) : (
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
          )}
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
      ) : viewingDataset ? (
        <DatasetView
          dataset={viewingDataset}
          user={user}
          onSaved={refetch}
          onCopied={handleDatasetCopied}
        />
      ) : null}
    </StyledDatasetsRoot>
  );
}
