// components/DataJournal/Journal.js
import { useQuery } from "@apollo/client";
import { useState, useEffect, useCallback, useRef } from "react";

import { GET_DATA_JOURNAL } from "../../../Queries/DataJournal";
import { StyledDataJournal } from "./styles/StyledDataJournal";

import Workspace from "./Workspace/Workspace";
import DatasourceDataLoader from "./DataLoader/DatasourceDataLoader";

import { useDataJournal } from "./Context/DataJournalContext";

export default function Journal({
  user,
  studyId,
  journalCollections,
  dataJournals,
  journalId,
  selectJournalById,
}) {
  const {
    selectedWorkspace,
    setSelectedWorkspace,
    setData,
    setVariables,
    setSettings,
    setJournalDatasources,
    setSourceDataByDatasourceId,
    sourceDataByDatasourceId,
  } = useDataJournal();

  const {
    data: journalData,
    loading: queryLoading,
    error: queryError,
  } = useQuery(GET_DATA_JOURNAL, {
    variables: {
      id: journalId,
    },
    skip: !journalId,
  });

  const journal = journalData?.vizPart;

  const datasources = journal?.datasources || [];
  const workspaces = journal?.vizChapters || [];
  const datasourceIds = datasources.map((ds) => ds?.id).filter(Boolean);
  const datasourceIdsKey = datasourceIds.join(",");

  const [registered, setRegistered] = useState(false);
  const registerRunIdRef = useRef(0);

  const handleSourceData = useCallback(
    (sourceData) => {
      const datasourceId = sourceData?.datasourceId;
      if (!datasourceId) return;
      setSourceDataByDatasourceId((prev) => ({
        ...prev,
        [datasourceId]: sourceData,
      }));
    },
    [setSourceDataByDatasourceId],
  );

  useEffect(() => {
    setJournalDatasources(
      datasources
        .map((ds) => ({
          id: ds?.id,
          title: ds?.title || "",
          dataOrigin: ds?.dataOrigin || "",
        }))
        .filter((d) => d.id),
    );
  }, [datasources, setJournalDatasources]);

  useEffect(() => {
    setRegistered(false);
    setSourceDataByDatasourceId((prev) => {
      const next = {};
      datasourceIds.forEach((id) => {
        if (prev[id]) next[id] = prev[id];
      });
      return next;
    });
  }, [journalId, datasourceIdsKey, setSourceDataByDatasourceId]);

  const allSlicesReady =
    datasources.length === 0 ||
    datasourceIds.every((id) => sourceDataByDatasourceId[id] != null);

  useEffect(() => {
    const runId = registerRunIdRef.current + 1;
    registerRunIdRef.current = runId;
    let isCancelled = false;

    async function registerData() {
      if (!allSlicesReady) return;
      if (isCancelled || registerRunIdRef.current !== runId) return;

      const firstId = datasourceIds[0];
      const firstSlice = firstId ? sourceDataByDatasourceId[firstId] : null;

      if (isCancelled || registerRunIdRef.current !== runId) return;

      if (firstSlice) {
        setData(Array.isArray(firstSlice.data) ? firstSlice.data : []);
        setVariables(
          Array.isArray(firstSlice.variables) ? firstSlice.variables : [],
        );
        setSettings(
          firstSlice.settings && typeof firstSlice.settings === "object"
            ? firstSlice.settings
            : {},
        );
      } else {
        setData([]);
        setVariables([]);
        setSettings({});
      }
      setRegistered(true);
    }

    registerData();
    return () => {
      isCancelled = true;
    };
  }, [
    allSlicesReady,
    datasourceIdsKey,
    sourceDataByDatasourceId,
    setData,
    setVariables,
    setSettings,
  ]);

  const chapterIdsKey = (journal?.vizChapters || [])
    .map((w) => w?.id)
    .filter(Boolean)
    .join(",");

  const workspaceListBaselineRef = useRef({ journalId: null, chapterIdsKey: "" });

  useEffect(() => {
    const list = journal?.vizChapters || [];
    const baseline = workspaceListBaselineRef.current;
    const switchedJournal = baseline.journalId !== journalId;

    if (!journalId) {
      workspaceListBaselineRef.current = { journalId: null, chapterIdsKey: "" };
      setSelectedWorkspace(null);
      return;
    }

    const prevKey = baseline.chapterIdsKey;
    workspaceListBaselineRef.current = {
      journalId,
      chapterIdsKey: chapterIdsKey,
    };

    if (!list.length) {
      workspaceListBaselineRef.current = {
        journalId,
        chapterIdsKey: "",
      };
      setSelectedWorkspace(null);
      return;
    }

    if (switchedJournal) {
      setSelectedWorkspace((prev) => {
        if (prev?.id) {
          const match = list.find((w) => w?.id === prev.id);
          if (match) return match;
        }
        return list[0];
      });
      return;
    }

    const prevIds = new Set(prevKey.split(",").filter(Boolean));
    const added = list.filter((w) => w?.id && !prevIds.has(w.id));

    if (prevKey && added.length > 0) {
      setSelectedWorkspace(added[added.length - 1]);
      return;
    }

    setSelectedWorkspace((prev) => {
      if (prev?.id) {
        const match = list.find((w) => w?.id === prev.id);
        if (match) return match;
      }
      return list[0];
    });
  }, [journalId, chapterIdsKey, journal?.updatedAt, setSelectedWorkspace]);

  const selectWorkspaceById = ({ id }) => {
    const workspace = workspaces.find((w) => w?.id === id);
    if (workspace) {
      setSelectedWorkspace(workspace);
    }
  };

  if (queryError) {
    return <div>Error loading journal</div>;
  }

  const workspaceReady = !queryLoading && allSlicesReady && registered;

  return (
    <StyledDataJournal>
      <div style={{ display: "none" }}>
        {datasources.map((ds) => (
          <DatasourceDataLoader
            key={ds.id}
            datasource={ds}
            user={user}
            onDataReady={handleSourceData}
          />
        ))}
      </div>

      {!workspaceReady ? (
        <div>Loading...</div>
      ) : (
        <Workspace
          user={user}
          studyId={studyId}
          journalCollections={journalCollections}
          dataJournals={dataJournals}
          journal={journal}
          journalId={journalId}
          selectJournalById={selectJournalById}
          workspaces={workspaces}
          workspaceId={selectedWorkspace?.id}
          selectWorkspaceById={selectWorkspaceById}
        />
      )}
    </StyledDataJournal>
  );
}
