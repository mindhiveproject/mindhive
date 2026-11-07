"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";

import {
  STUDY_DATA_SOURCES,
  STUDY_VISUAL_DEVICES,
} from "../../../../Queries/DataSourceBlock";
import {
  CREATE_STUDY_DATA_SOURCE,
  DELETE_STUDY_DATA_SOURCE,
} from "../../../../Mutations/DataSourceBlock";
import { matchStudySources } from "../../../../Visuals/Helpers/studySources";

import DataSourcesPanel from "./Panel";
import LinkDataSourceModal from "./LinkModal";

/**
 * Owns the study's linked data sources end to end: the persistent bottom-left
 * panel (always visible — linking real-time devices into a study is a big
 * commitment, not something to bury in a menu tab) and the link-a-source
 * modal it opens. Settings for one linked source live in the side panel
 * instead (Builder.js swaps DataSources/Settings in, like a block's panel),
 * so opening them here just hands the selection up and gets out of the way.
 *
 * Visual blocks on the canvas read from devices, and a visual only reacts
 * once the study links them, so the devices they need that the study hasn't
 * linked yet are suggested in the panel, to be linked in one click.
 */
export default function DataSources({
  study,
  user,
  canvasTaskIds,
  dataSourceSettingsId,
  onOpenSettings,
}) {
  const studyId = study?.id;
  const [isLinkModalOpen, setLinkModalOpen] = useState(false);
  const [isLinking, setLinking] = useState(false);

  const { data, refetch } = useQuery(STUDY_DATA_SOURCES, {
    variables: { studyId },
    skip: !studyId,
  });
  const sources = data?.studyDataSources || [];

  const { data: visualData } = useQuery(STUDY_VISUAL_DEVICES, {
    variables: { taskIds: canvasTaskIds },
    skip: !studyId || !canvasTaskIds?.length,
  });
  // One suggestion per missing device; a block a visual reads twice is
  // suggested twice, and visuals needing the same device share a suggestion.
  const suggestions = [];
  const visuals = new Map(
    (visualData?.tasks || [])
      .filter((task) => task.visual)
      .map((task) => [task.visual.id, task.visual])
  );
  visuals.forEach((visual) => {
    const matched = matchStudySources(visual.dataSources, sources);
    const seen = {};
    visual.dataSources.forEach((source) => {
      const blockId = source.block.id;
      const nth = seen[blockId] ?? 0;
      seen[blockId] = nth + 1;
      const key = `${blockId}:${nth}`;
      if (matched[source.id]) return;
      const existing = suggestions.find((s) => s.key === key);
      if (existing) existing.visualTitles.push(visual.title);
      else suggestions.push({ key, source, visualTitles: [visual.title] });
    });
  });

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

  const linkSuggestions = async (toLink) => {
    setLinking(true);
    try {
      for (const [index, { source }] of toLink.entries()) {
        await createStudyDataSource({
          variables: {
            data: {
              study: { connect: { id: studyId } },
              block: { connect: { id: source.block.id } },
              label: source.label,
              inputBindings: source.inputBindings,
              order: sources.length + index,
              scope: "study",
            },
          },
        });
      }
    } finally {
      setLinking(false);
      refetch();
    }
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
        suggestions={suggestions}
        isLinking={isLinking}
        selectedSourceId={dataSourceSettingsId}
        onLinkSuggestions={linkSuggestions}
        onOpenLink={() => setLinkModalOpen(true)}
        onOpenSettings={openSettings}
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
