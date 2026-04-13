// components/DataJournal/SideNav/Journal.js
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";
import { useRouter } from "next/router";

import Chip from "../../../../DesignSystem/Chip";
import DropdownMenu from "../../../../DesignSystem/DropdownMenu";
import InfoTooltip from "../../../../DesignSystem/InfoTooltip";

import { useDataJournal } from "../Context/DataJournalContext";

import WorkspaceNavigation from "./Workspace";
import DataSourceModal from "./DataSourceModal";
import AddWorkspace from "./AddWorkspace";
import EditJournal from "../Helpers/EditJournal";
import { useDeleteJournal } from "../Helpers/DeleteJournal";

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
  const router = useRouter();
  const { user, projectId, studyId } = useDataJournal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const { confirmAndDelete } = useDeleteJournal({
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
          <div style={descriptionBlockStyle}>{descriptionText}</div>
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
      key: "delete",
      label: t("dataJournal.sideNav.deleteJournal", "Delete"),
      danger: true,
      onClick: confirmAndDelete,
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
    ...(!isJournalSelected ? { color: "#A1A1A1", fontWeight: 400, border: "none"} : {color: "#6A6A6A", backgroundColor: "#F6F9F8", fontWeight: 700}),
  };

  const titleWithOptionalTooltip =
    titleText.length > 48 ? (
      <InfoTooltip
        content={titleText}
        position="right"
        portal
        wrapperStyle={{ minWidth: 0, maxWidth: "100%" }}
      >
        {titleButton}
      </InfoTooltip>
    ) : (
      <span
        style={{
          display: "block",
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }}
        title={titleText.length > 48 ? titleText : undefined}
      >
        {titleButton}
      </span>
 
    );

  return (
    <>
      <div className={`journal${isJournalSelected ? " journal--selected" : ""}`}>
        <div className="titleHeader">
          {titleWithOptionalTooltip}
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
              style={datasetsChipStyle}
              ariaLabel={t("dataJournal.sideNav.datasetsChip.ariaOpenPicker", {}, {
                default: "Choose datasets linked to this journal",
              })}
            />
          </div>
        </div>

        {isJournalSelected && (
          <>
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

            <AddWorkspace journalId={journal?.id} />
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
    </>
  );
}
