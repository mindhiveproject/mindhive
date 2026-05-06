// components/DataJournal/TopNav/Main.js
import { useState } from "react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { StyledTopNavigation } from "../styles/StyledDataJournal"; // Adjust path
import Chip from "../../../../DesignSystem/Chip";
import Breadcrumbs from "./Breadcrumbs/Main";

import { UPDATE_VIZCHAPTER } from "../../../../Mutations/VizChapter";
import { UPDATE_VIZPART } from "../../../../Mutations/VizPart";
import { GET_WORKSPACE } from "../../../../Queries/DataWorkspace";
import { GET_DATA_JOURNAL } from "../../../../Queries/DataJournal";
import { GET_DATA_JOURNALS } from "../../../../Queries/DataArea";

import { useDataJournal } from "../Context/DataJournalContext"; // Adjust path

import AddWorkspace from "../SideNav/AddWorkspace";
import AddComponentButton from "../SideNav/AddComponentButton";

function journalsWhereClause(projectId, studyId) {
  if (projectId && studyId) {
    return {
      OR: [
        { project: { id: { equals: projectId } } },
        { study: { id: { equals: studyId } } },
      ],
    };
  }
  if (projectId) return { project: { id: { equals: projectId } } };
  if (studyId) return { study: { id: { equals: studyId } } };
  return null;
}

const LEFT_NAV_SELECTED_BG = "#EDF4F5";

export default function TopNavigation() {
  const { t } = useTranslation("dataviz");
  const {
    area,
    setArea,
    selectedJournal: journal,
    setSelectedJournal,
    workspace,
    projectId,
    studyId,
    setActiveComponent,
    setIsAddComponentPanelOpen,
    setLeftPanelMode,
    setSidebarVisible,
  } = useDataJournal();

  const [editingTarget, setEditingTarget] = useState(null);
  const [draftTitle, setDraftTitle] = useState("");

  const journalsWhere = journalsWhereClause(projectId, studyId);

  const refetchAfterWorkspaceTitle = [
    {
      query: GET_WORKSPACE,
      variables: { id: workspace?.id },
    },
  ];

  const refetchAfterJournalTitle = [
    {
      query: GET_DATA_JOURNAL,
      variables: { id: journal?.id },
    },
    ...(journalsWhere
      ? [
          {
            query: GET_DATA_JOURNALS,
            variables: { where: journalsWhere },
          },
        ]
      : []),
  ];

  const [updateVizChapter] = useMutation(UPDATE_VIZCHAPTER);
  const [updateVizPart] = useMutation(UPDATE_VIZPART);

  const handleJournalTitleClick = () => {
    setEditingTarget("journal");
    setDraftTitle(journal?.title || "");
  };

  const handleWorkspaceTitleClick = () => {
    if (!workspace?.id) return;
    setEditingTarget("workspace");
    setDraftTitle(workspace?.title || "");
  };

  const handleDraftChange = (e) => {
    setDraftTitle(e.target.value);
  };

  const handleSubmit = async () => {
    if (!editingTarget) return;

    const trimmed = draftTitle.trim();

    if (editingTarget === "journal") {
      if (!trimmed || trimmed === journal?.title) {
        setEditingTarget(null);
        return;
      }
      try {
        await updateVizPart({
          variables: {
            id: journal.id,
            input: { title: trimmed },
          },
          refetchQueries: refetchAfterJournalTitle,
        });
        setSelectedJournal((prev) =>
          prev?.id === journal.id ? { ...prev, title: trimmed } : prev,
        );
      } catch (error) {
        console.error("Error updating journal title:", error);
      }
      setEditingTarget(null);
      return;
    }

    if (editingTarget === "workspace") {
      if (!trimmed || trimmed === workspace?.title) {
        setEditingTarget(null);
        return;
      }
      try {
        await updateVizChapter({
          variables: {
            id: workspace?.id,
            input: { title: trimmed },
          },
          refetchQueries: refetchAfterWorkspaceTitle,
        });
      } catch (error) {
        console.error("Error updating workspace title:", error);
      }
      setEditingTarget(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const openAddComponentPanel = () => {
    setActiveComponent(null);
    setLeftPanelMode("addComponent");
    setIsAddComponentPanelOpen(true);
    setSidebarVisible(true);
  };

  return (
    <StyledTopNavigation>
      <div className="leftIconNav">
        <Chip
          className="leftNavChip"
          label={t("dataJournal.topNav.journals", "Journals")}
          selected={area === "journals"}
          onClick={() => setArea("journals")}
          shape="square"
          style={{
            border: "none",
            background: area === "journals" ? LEFT_NAV_SELECTED_BG : "transparent",
            backgroundColor:
              area === "journals" ? LEFT_NAV_SELECTED_BG : "transparent",
          }}
          leading={
            <img
              src={
                area === "journals"
                  ? "/assets/dataviz/journalsSelected.svg"
                  : "/assets/dataviz/journals.svg"
              }
              alt=""
              width="24"
              height="24"
            />
          }
        />

        <Chip
          className="leftNavChip"
          label={t("dataJournal.topNav.datasets", "Datasets")}
          selected={area === "datasets"}
          onClick={() => setArea("datasets")}
          shape="square"
          style={{
            border: "none",
            background: area === "datasets" ? LEFT_NAV_SELECTED_BG : "transparent",
            backgroundColor:
              area === "datasets" ? LEFT_NAV_SELECTED_BG : "transparent",
          }}
          leading={
            <img
              src={
                area === "datasets"
                  ? "/assets/dataviz/datasetSelected.svg"
                  : "/assets/dataviz/dataset.svg"
              }
              alt=""
              width="24"
              height="24"
            />
          }
        />
      </div>

      <div>
        {area === "journals" && journal?.id && (
          <Breadcrumbs
            journalTitle={journal?.title}
            workspaceTitle={workspace?.title}
            editingTarget={editingTarget}
            draftTitle={draftTitle}
            onDraftChange={handleDraftChange}
            onJournalTitleClick={handleJournalTitleClick}
            onWorkspaceTitleClick={handleWorkspaceTitleClick}
            onSubmit={handleSubmit}
            onKeyDown={handleKeyDown}
            editJournalLabel={t(
              "dataJournal.topNav.editJournalName",
              "Edit journal name"
            )}
            editWorkspaceLabel={t(
              "dataJournal.topNav.editWorkspaceName",
              "Edit workspace name"
            )}
            workspaceEditable={Boolean(workspace?.id)}
          />
        )}
        {area === "journals" && !journal?.id && (
          <div>{t("dataJournal.topNav.selectJournal", "Select a Journal to start ...")}</div>
        )}
      </div>
      <div className="buttons">
        {area === "journals" && journal?.id && (
          <div className="topNavJournalActions">
            <AddWorkspace journalId={journal?.id} />
            <AddComponentButton
              disabled={!workspace?.id}
              onClick={openAddComponentPanel}
            />
          </div>
        )}
        {/* <SaveWorkspace workspace={workspace} /> */}
      </div>
    </StyledTopNavigation>
  );
}
