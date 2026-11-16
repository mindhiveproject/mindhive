"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";

import { STUDY_DATA_SOURCES } from "../../../../Queries/DataSourceBlock";
import {
  CREATE_STUDY_DATA_SOURCE,
  DELETE_STUDY_DATA_SOURCE,
} from "../../../../Mutations/DataSourceBlock";

import DataSourcesTopBarButton from "./TopBarButton";
import LinkDataSourceModal from "./LinkModal";

/**
 * Owns the study's linked data sources end to end: the "External datasource"
 * button in the canvas top bar and the link-a-source modal it opens. Settings for one linked source live in the side panel
 * instead (Builder.js swaps DataSources/Settings in, like a block's panel),
 * so opening them here just hands the selection up and gets out of the way.
 */
export default function DataSources({
  study,
  user,
  dataSourceSettingsId,
  onOpenSettings,
}) {
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
      <DataSourcesTopBarButton
        sources={sources}
        onOpenLink={() => setLinkModalOpen(true)}
      />
      <LinkDataSourceModal
        open={isLinkModalOpen}
        user={user}
        sources={sources}
        selectedSourceId={dataSourceSettingsId}
        onClose={() => setLinkModalOpen(false)}
        onAddSource={addSource}
        onRemoveSource={removeSource}
        onOpenSettings={openSettings}
      />
    </>
  );
}
