// components/DataJournal/SideNav/Journal.js
import { useState } from "react";
import { createPortal } from "react-dom";
import useTranslation from "next-translate/useTranslation";
import { useRouter } from "next/router";

import Chip from "../../../../DesignSystem/Chip";
import DropdownMenu from "../../../../DesignSystem/DropdownMenu";
import InfoTooltip from "../../../../DesignSystem/InfoTooltip";

import { useDataJournal } from "../Context/DataJournalContext";

import WorkspaceNavigation from "./Workspace";
import DataSourceModal from "./DataSourceModal";
import AddWorkspace from "./AddWorkspace";
import AddComponentButton from "./AddComponentButton";
import EditJournal from "../Helpers/EditJournal";
import { useDeleteJournal } from "../Helpers/DeleteJournal";
import {
  StyledModalBody,
  StyledModalButton,
  StyledModalContent,
  StyledModalFooter,
  StyledModalHeader,
  StyledModalOverlay,
} from "../styles/StyledDataSourceModal";

export default function JournalNavigation({
  journal,
  selectedJournal,
  isJournalSelected,
  selectJournalById,
  workspaces,
  selectedWorkspace,
  selectWorkspaceById,
}) {
  const { t } = useTranslation("builder");
  const { t: tCommon } = useTranslation("common");
  const router = useRouter();
  const {
    user,
    projectId,
    studyId,
    setActiveComponent,
    setIsAddComponentPanelOpen,
    setLeftPanelMode,
    setSidebarVisible,
  } = useDataJournal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const { runDeleteJournal, deleting } = useDeleteJournal({
    projectId,
    studyId,
    part: journal,
    t,
  });

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const locale = router.locale || "en-us";
  const timestampSource = journal?.updatedAt || journal?.createdAt;
  const parsedAt = timestampSource ? new Date(timestampSource) : null;
  let formattedDate = "";
  if (parsedAt && !Number.isNaN(parsedAt.getTime())) {
    const opts = { dateStyle: "medium", timeStyle: "short" };
    try {
      formattedDate = new Intl.DateTimeFormat(locale, opts).format(parsedAt);
    } catch {
      formattedDate = new Intl.DateTimeFormat("en-US", opts).format(parsedAt);
    }
  }

  const descriptionText =
    typeof journal?.description === "string" ? journal.description.trim() : "";

  const descriptionBlockStyle = {
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    lineHeight: "16px",
    color: "#333",
    marginBottom: formattedDate ? 8 : 0,
    maxHeight: 96,
    overflow: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  };

  const lastUpdatedBlockStyle = {
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    lineHeight: "16px",
    color: "#6a6a6a",
  };

  const panelHeader =
    descriptionText || formattedDate ? (
      <>
        {descriptionText ? (
          <div style={
            {fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            lineHeight: "16px",
            color: "#6A6A6A",
            marginBottom: formattedDate ? 8 : 0,
            maxHeight: 96,
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word"}}>
              {descriptionText}
          </div>
        ) : null}
        {formattedDate ? (
          <div style={lastUpdatedBlockStyle}>
            {t(
              "dataJournal.sideNav.lastUpdatedAt",
              { date: formattedDate },
              { default: "Last updated: {{date}}" },
            )}
          </div>
        ) : null}
      </>
    ) : null;

  const menuItems = [
    {
      key: "edit",
      label: (
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/assets/icons/visualize/edit.svg" alt="" width={18} height={18} />
          {t("dataJournal.sideNav.editJournal", "Edit")}
        </span>
      ),
      onClick: () => setEditOpen(true),
    },
    {
      key: "manageDatasets",
      label: (
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/assets/icons/visualize/database.svg" alt="" width={18} height={18} />
          {t("dataJournal.sideNav.manageDatasets", "Manage datasets")}
        </span>
      ),
      onClick: () => handleOpenModal(),
    },
    {
      key: "delete",
      label: t("dataJournal.sideNav.deleteJournal", "Delete"),
      danger: true,
      onClick: () => {
        setDeleteError(null);
        setDeleteConfirmOpen(true);
      },
    },
  ];

  const titleText = journal?.title || "";
  const titleButton = (
    <button
      type="button"
      className={`journalTitleButton ${isJournalSelected ? "selectedTitle" : "title"}`}
      onClick={() => selectJournalById({ id: journal?.id })}
    >
      {titleText}
    </button>
  );

  const datasetCount = journal?.datasources?.length ?? 0;
  const datasetsChipLabel =
    datasetCount === 0
      ? t("dataJournal.sideNav.datasetsChip.none", {}, { default: "No datasets linked" })
      : datasetCount === 1
        ? t("dataJournal.sideNav.datasetsChip.one", {}, { default: "1 dataset linked" })
        : t(
            "dataJournal.sideNav.datasetsChip.many",
            { count: datasetCount },
            { default: "{{count}} datasets linked" },
          );

  const datasetsChipStyle = {
    fontSize: "12px",
    lineHeight: "16px",
    height: "28px",
    paddingLeft: "10px",
    paddingRight: "10px",
    paddingTop: "4px",
    paddingBottom: "4px",
    ...(!isJournalSelected ? 
      { color: "#A1A1A1", backgroundColor: "#FFFFFF", fontWeight: 400, border: "none"}
       : 
      { color: "#6A6A6A", backgroundColor: "#FFFFFF", fontWeight: 700, border: "1px solid #E6E6E6"}),
 
  };

  const titleWithTooltip = (
    <InfoTooltip
      content={titleText}
      position="right"
      portal
      wrapperStyle={{ minWidth: 0, maxWidth: "100%", display: "block" }}
      delay={900}
    >
      {titleButton}
    </InfoTooltip>
  );

  return (
    <>
      <div className={`journal${isJournalSelected ? " journal--selected" : ""}`}>
        <div className="titleHeader">
          {titleWithTooltip}
          <DropdownMenu
            ariaLabel={t("dataJournal.sideNav.journalMore", "Journal options")}
            trigger={
              <img
                src="/assets/dataviz/three-dots.svg"
                alt=""
                width={18}
                height={18}
                style={{
                  opacity: isJournalSelected ? 1 : 0.3,
                  transition: "opacity 0.2s"
                }}
              />
            }
      
            panelHeader={panelHeader}
            items={menuItems}
          />
        </div>

        <div className="dataSourceRow">
          <div className="dataSourceChips">
            <Chip
              label={datasetsChipLabel}
              shape="square"
              selected={isJournalSelected}
              onClick={handleOpenModal}
              disabled={!isJournalSelected}
              style={datasetsChipStyle}
              ariaLabel={t("dataJournal.sideNav.datasetsChip.ariaOpenPicker", {}, {
                default: "Choose datasets linked to this journal",
              })}
            />
          </div>
        </div>

        {isJournalSelected && (
          <>
            <div className="addActionsRow">
              <AddWorkspace journalId={journal?.id} />
              <AddComponentButton
                disabled={!selectedWorkspace?.id}
                onClick={() => {
                  setActiveComponent(null);
                  setLeftPanelMode("addComponent");
                  setIsAddComponentPanelOpen(true);
                  setSidebarVisible(true);
                }}
              />
            </div>

            <div className="workspaces">
              {workspaces.map((workspace) => (
                <WorkspaceNavigation
                  key={workspace.id}
                  journal={journal}
                  workspace={workspace}
                  isWorkspaceSelected={workspace?.id === selectedWorkspace?.id}
                  selectedWorkspace={selectedWorkspace}
                  selectWorkspaceById={selectWorkspaceById}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <EditJournal
        user={user}
        projectId={projectId}
        studyId={studyId}
        part={journal}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <DataSourceModal isOpen={isModalOpen} onClose={handleCloseModal} journal={journal} />

      {deleteConfirmOpen && typeof document !== "undefined"
        ? createPortal(
            <StyledModalOverlay
              style={{ zIndex: 20050 }}
              onClick={(e) => {
                if (e.target === e.currentTarget && !deleting) setDeleteConfirmOpen(false);
              }}
            >
              <StyledModalContent
                style={{ maxWidth: 440, width: "90%" }}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
              >
                <StyledModalHeader>
                  <h2 style={{ margin: 0 }}>
                    {t("dataJournal.sideNav.deleteJournalModalTitle", {}, {
                      default: "Delete journal",
                    })}
                  </h2>
                </StyledModalHeader>
                <StyledModalBody>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "Inter, sans-serif",
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: "#333",
                    }}
                  >
                    {t("dataJournal.sideNav.deleteJournalConfirm", {}, {
                      default:
                        "Are you sure you want to delete this journal? All workspaces and components in this journal will be deleted as well.",
                    })}
                  </p>
                  {deleteError ? (
                    <p
                      role="alert"
                      style={{
                        marginTop: 12,
                        marginBottom: 0,
                        fontFamily: "Inter, sans-serif",
                        fontSize: 13,
                        color: "#c62828",
                      }}
                    >
                      {deleteError}
                    </p>
                  ) : null}
                </StyledModalBody>
                <StyledModalFooter>
                  <StyledModalButton
                    type="button"
                    className="cancel"
                    disabled={deleting}
                    onClick={() => {
                      if (!deleting) setDeleteConfirmOpen(false);
                    }}
                  >
                    {tCommon("cancel", {}, { default: "Cancel" })}
                  </StyledModalButton>
                  <StyledModalButton
                    type="button"
                    disabled={deleting}
                    style={{
                      marginLeft: 8,
                      padding: "8px 16px",
                      border: "none",
                      borderRadius: 6,
                      cursor: deleting ? "not-allowed" : "pointer",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 14,
                      background: "#c62828",
                      color: "#fff",
                    }}
                    onClick={async () => {
                      setDeleteError(null);
                      const result = await runDeleteJournal();
                      if (result.ok) {
                        setDeleteConfirmOpen(false);
                      } else if (result.message) {
                        setDeleteError(result.message);
                      }
                    }}
                  >
                    {t("dataJournal.sideNav.deleteJournal", {}, { default: "Delete" })}
                  </StyledModalButton>
                </StyledModalFooter>
              </StyledModalContent>
            </StyledModalOverlay>,
            document.body,
          )
        : null}
    </>
  );
}
