// components/DataJournal/Datasets/Main.js
import { useApolloClient, useQuery } from "@apollo/client";
import { useState, useMemo, useEffect, useRef } from "react";
import useTranslation from "next-translate/useTranslation";

import {
  buildDatasourcesWhereForScope,
  TESTER_ONLY_DATASET_SCOPES,
  isTesterUser,
} from "../../../../../lib/dataJournalDatasources";
import { useDataJournal } from "../Context/DataJournalContext";
import { useUserDatasetClassContext } from "../Hooks/useUserDatasetClassContext";
import {
  usePagedDatasources,
  datasourcesPageVariables,
} from "../Hooks/usePagedDatasources";
import {
  GET_DATASOURCES,
  GET_DATASOURCE_DETAIL,
} from "../../../../Queries/Datasource";
import Button from "../../../../DesignSystem/Button";

import AddDataset from "./AddDataset";
import DatasetCard from "./DatasetCard";
import EditDataset from "./EditDataset";
import DatasetView from "./View/Main";

import {
  StyledDatasetsRoot,
  StyledDatasetGrid,
} from "../styles/StyledDataJournal";

const CLASS_DEPENDENT_SCOPES = ["myClass", "classNetwork", "me", "simulated"];

const SCOPE_INTRO_KEYS = {
  me: "dataJournal.datasets.scopes.intro.me",
  uploaded: "dataJournal.datasets.scopes.intro.uploaded",
  sharedWithMe: "dataJournal.datasets.scopes.intro.sharedWithMe",
  myClass: "dataJournal.datasets.scopes.intro.myClass",
  classNetwork: "dataJournal.datasets.scopes.intro.classNetwork",
  public: "dataJournal.datasets.scopes.intro.public",
  simulated: "dataJournal.datasets.scopes.intro.simulated",
};

const SCOPE_INTRO_DEFAULTS = {
  me: "All datasets you can see: your own, those from studies and projects you work on, those your teacher shared with your class, and public ones.",
  uploaded: "Datasets you uploaded.",
  sharedWithMe: "Datasets from studies and projects you collaborate on.",
  myClass: "Datasets your teacher shared with your class.",
  classNetwork:
    "Under construction (visible to testers only). Datasets on this project or study from classes in your class networks.",
  public: "Datasets anyone signed in can use.",
  simulated:
    "Sham datasets generated from a study design.",
};

const SCOPE_EMPTY_KEYS = {
  me: "dataJournal.datasets.scopes.empty.me",
  uploaded: "dataJournal.datasets.scopes.empty.uploaded",
  sharedWithMe: "dataJournal.datasets.scopes.empty.sharedWithMe",
  myClass: "dataJournal.datasets.scopes.empty.myClass",
  classNetwork: "dataJournal.datasets.scopes.empty.classNetwork",
  public: "dataJournal.datasets.scopes.empty.public",
  simulated: "dataJournal.datasets.scopes.empty.simulated",
};

const SCOPE_EMPTY_DEFAULTS = {
  me: "No datasets available to you yet.",
  uploaded: "No uploaded datasets yet.",
  sharedWithMe: "No datasets from studies or projects you collaborate on yet.",
  myClass: "Your teacher hasn't shared any datasets with your class yet.",
  classNetwork:
    "No datasets from your class network for this project or study.",
  public: "No public datasets found.",
  simulated: "No simulated datasets yet.",
};

export default function Datasets() {
  const { t } = useTranslation("builder");
  const client = useApolloClient();
  const {
    user,
    projectId,
    studyId,
    datasetScope,
    setDatasetScope,
    datasetsListNavNonce,
    datasetsAddRequestNonce,
  } = useDataJournal();

  const { directClassIds, networkClassIds, loading: classesLoading } =
    useUserDatasetClassContext();

  const isTester = isTesterUser(user);
  useEffect(() => {
    if (TESTER_ONLY_DATASET_SCOPES.includes(datasetScope) && !isTester) {
      setDatasetScope("me");
    }
  }, [datasetScope, isTester, setDatasetScope]);

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

  const {
    datasources,
    totalCount,
    hasMore,
    loading,
    loadingMore,
    error,
    refetch,
    loadMore,
  } = usePagedDatasources({
    where: datasourcesWhere,
    skip: classesLoading && CLASS_DEPENDENT_SCOPES.includes(datasetScope),
  });
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

  // The list leaves out `content`; the opened dataset loads it. Always from
  // the network: saves don't return content, so a cached copy may be stale.
  const {
    data: viewingData,
    loading: viewingLoading,
    error: viewingError,
  } = useQuery(GET_DATASOURCE_DETAIL, {
    variables: { id: viewingDatasetId },
    skip: !viewingDatasetId,
    fetchPolicy: "network-only",
  });
  const viewingDataset = viewingDatasetId
    ? viewingData?.datasource || null
    : null;

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

  /** Current tab is guaranteed to include the newly created dataset. */
  const currentScopeShowsCreatedDataset = (createdDataOrigin) => {
    if (datasetScope === "me") return true;
    if (datasetScope === "uploaded" && createdDataOrigin === "UPLOADED") {
      return true;
    }
    if (datasetScope === "simulated" && createdDataOrigin === "SIMULATED") {
      return true;
    }
    return false;
  };

  const handleCreate = async (_createdDatasource, createdDataOrigin) => {
    const switchToMe = !currentScopeShowsCreatedDataset(createdDataOrigin);

    if (switchToMe) {
      const meWhere = buildDatasourcesWhereForScope({
        scope: "me",
        projectId,
        studyId,
        userId: user?.id,
        directClassIds,
        networkClassIds,
      });
      if (meWhere) {
        await client.query({
          query: GET_DATASOURCES,
          variables: datasourcesPageVariables(meWhere),
          fetchPolicy: "network-only",
        });
      }
      // Keep the scope-change effect from racing the close (we close ourselves).
      lastDatasetScopeRef.current = "me";
      setDatasetScope("me");
    } else {
      await refetch();
    }

    setShowAddDataset(false);
    setEditingDataset(null);
    setViewingDatasetId(null);
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

  const isListLoading =
    loading || (classesLoading && CLASS_DEPENDENT_SCOPES.includes(datasetScope));

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
            <>
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
              {hasMore ? (
                <div className="datasets-list-more">
                  <span>
                    {t(
                      "dataJournal.datasets.showingCount",
                      { shown: datasources.length, total: totalCount },
                      { default: "Showing {{shown}} of {{total}} datasets" },
                    )}
                  </span>
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore
                      ? t("dataJournal.datasets.loadingMore", {}, {
                          default: "Loading…",
                        })
                      : t("dataJournal.datasets.showMore", {}, {
                          default: "Show more",
                        })}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : showAddDataset ? (
        <AddDataset
          projectId={projectId}
          studyId={studyId}
          onCancel={handleCancel}
          onCreate={handleCreate}
        />
      ) : editingDataset ? (
        <EditDataset
          dataset={editingDataset}
          user={user}
          onCancel={handleCancel}
          refetchDatasources={refetch}
        />
      ) : viewingError ? (
        <div>
          {t(
            "dataJournal.datasets.errorLoading",
            { message: viewingError.message },
            { default: "Error: {{message}}" },
          )}
        </div>
      ) : viewingLoading && !viewingDataset ? (
        <div>
          {t("dataJournal.datasets.loading", {}, { default: "Loading datasets…" })}
        </div>
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
