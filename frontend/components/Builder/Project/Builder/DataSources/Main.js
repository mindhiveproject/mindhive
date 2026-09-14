"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";

import { STUDY_DATA_SOURCES } from "../../../../Queries/DataSourceBlock";
import {
  CREATE_STUDY_DATA_SOURCE,
  DELETE_STUDY_DATA_SOURCE,
} from "../../../../Mutations/DataSourceBlock";

import DataSourcesPanel from "./Panel";
import LinkDataSourceModal from "./LinkModal";

/**
 * Owns the study's linked data sources end to end: the persistent bottom-left
 * panel (always visible — linking real-time devices into a study is a big
 * commitment, not something to bury in a menu tab) and the link-a-source
 * modal it opens. Settings for one linked source live in the sidebar instead
 * (see Menu.js + DataSources/SettingsTab), so opening them here just hands
 * the selection up and gets out of the way.
 */
export default function DataSources({ study, user, onOpenSettings }) {
  const studyId = study?.id;
  const [isLinkModalOpen, setLinkModalOpen] = useState(false);

  const { data, refetch } = useQuery(STUDY_DATA_SOURCES, {
    variables: { studyId },
    skip: !studyId,
  });
  const sources = data?.studyDataSources || [];

  const [createStudyDataSource] = useMutation(CREATE_STUDY_DATA_SOURCE);
  const [deleteStudyDataSource] = useMutation(DELETE_STUDY_DATA_SOURCE);

  const addSource = async (blockId) => {
    if (!blockId) return;
    await createStudyDataSource({
      variables: {
        data: {
          study: { connect: { id: studyId } },
          block: { connect: { id: blockId } },
          order: sources.length,
          scope: "study",
        },
      },
    });
    refetch();
  };

  const removeSource = async (source) => {
    await deleteStudyDataSource({ variables: { id: source.id } });
    refetch();
  };

  const openSettings = (id) => {
    setLinkModalOpen(false);
    onOpenSettings(id);
  };

  if (!studyId) return null;

  return (
    <>
      <DataSourcesPanel
        sources={sources}
        onOpenLink={() => setLinkModalOpen(true)}
        onOpenSettings={openSettings}
      />
      <LinkDataSourceModal
        open={isLinkModalOpen}
        user={user}
        sources={sources}
        onClose={() => setLinkModalOpen(false)}
        onAddSource={addSource}
        onRemoveSource={removeSource}
        onOpenSettings={openSettings}
      />
    </>
  );
}
