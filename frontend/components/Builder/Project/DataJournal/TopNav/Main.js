// components/DataJournal/TopNav/Main.js
import { useState } from "react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { StyledTopNavigation } from "../styles/StyledDataJournal"; // Adjust path
import Button from "../../../../DesignSystem/Button";
import Chip from "../../../../DesignSystem/Chip";
import Breadcrumbs from "./Breadcrumbs/Main";

import { UPDATE_VIZCHAPTER } from "../../../../Mutations/VizChapter";
import { UPDATE_VIZPART } from "../../../../Mutations/VizPart";
import { GET_WORKSPACE } from "../../../../Queries/DataWorkspace";
import { GET_DATA_JOURNAL } from "../../../../Queries/DataJournal";
import { GET_DATA_JOURNALS } from "../../../../Queries/DataArea";

import { DATASET_SCOPES } from "../../../../../lib/dataJournalDatasources";
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

const DATASET_SCOPE_META = {
  uploaded: {
    i18nKey: "dataJournal.datasets.scopes.uploaded",
    defaultLabel: "Uploaded",
    iconSrc: "/assets/icons/uploaded.svg",
  },
  sharedWithMe: {
    i18nKey: "dataJournal.datasets.scopes.sharedWithMe",
    defaultLabel: "Shared with me",
    iconSrc: "/assets/icons/share.svg",
  },
  myClass: {
    i18nKey: "dataJournal.datasets.scopes.myClass",
    defaultLabel: "My class",
    iconSrc: "/assets/icons/education.svg",
  },
  classNetwork: {
    i18nKey: "dataJournal.datasets.scopes.classNetwork",
    defaultLabel: "Class network",
    iconSrc: "/assets/icons/group.svg",
  },
  public: {
    i18nKey: "dataJournal.datasets.scopes.public",
    defaultLabel: "Public",
    iconSrc: "/assets/icons/status/publicTemplate.svg",
  },
};

export default function TopNavigation() {
  const { t } = useTranslation("dataviz");
  const { t: tBuilder } = useTranslation("builder");
  const {
    area,
    setArea,
    navigateToDatasets,
    datasetScope,
    setDatasetScope,
    requestOpenAddDataset,
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
    <StyledTopNavigation
      className={area === "datasets" ? "withDatasetScopes" : undefined}
    >
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
          onClick={navigateToDatasets}
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

      <div className="centerColumn">
        {area === "datasets" && (
          <div className="datasetScopeNavWithAdd">
            <Button
              type="button"
              variant="tonal"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#336F8A", color: "#FFFFFF", border: "none", height: "fit-content", padding: "6px 12px" }}
              className="addDatasetNavBtn"
              leadingIcon={
                <p style={{ fontSize: "24px", fontWeight: "700", lineHeight: "20px", letterSpacing: "0", color: "#FFFFFF" }}>+</p>
              }
              onClick={requestOpenAddDataset}
            >
              {tBuilder("dataJournal.datasets.addDataset", {}, {
                default: "Add dataset",
              })}
            </Button>
            <div className="datasetScopeNav" role="tablist">
              <span style={{ fontSize: "14px", fontWeight: "400", lineHeight: "20px", letterSpacing: "0", color: "#5D5763" }}>Filter by:</span>
            {DATASET_SCOPES.map((scope) => {
              const meta = DATASET_SCOPE_META[scope];
              return (
              <Chip
                key={scope}
                className="datasetScopeChip"
                role="tab"
                aria-selected={datasetScope === scope}
                label={tBuilder(meta.i18nKey, {}, { default: meta.defaultLabel })}
                selected={datasetScope === scope}
                onClick={() => setDatasetScope(scope)}
                shape="square"
                leading={
                  <img
                    src={meta.iconSrc}
                    alt=""
                    width="20"
                    height="20"
                    aria-hidden
                  />
                }
                style={{
                  border: "none",
                  background:
                    datasetScope === scope ? LEFT_NAV_SELECTED_BG : "transparent",
                  backgroundColor:
                    datasetScope === scope ? LEFT_NAV_SELECTED_BG : "transparent",
                }}
              />
            );
            })}
            </div>
          </div>
        )}
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
