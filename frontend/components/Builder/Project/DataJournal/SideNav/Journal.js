import { useState } from "react";
import moment from "moment";
import WorkspaceNavigation from "./Workspace";
import DataSourceModal from "./DataSourceModal";

import { StyledDataSourceLabels } from "../styles/StyledDataJournal";

import AddWorkspace from "./AddWorkspace";

export default function JournalNavigation({
  projectId,
  studyId,
  journal,
  selectedJournal,
  isJournalSelected,
  selectJournalById,
  workspaces,
  selectedWorkspace,
  selectWorkspaceById,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Define origin labels (same as in DataSourceModal.js)
  const originLabels = {
    STUDY: "Study data",
    SIMULATED: "Simulated",
    UPLOADED: "Uploaded",
    TEMPLATE: "Template",
  };

  // Get data source labels
  const dataSourceLabels = journal?.datasources?.length
    ? journal.datasources
        .map((ds) => originLabels[ds.dataOrigin] || ds.dataOrigin)
        .join(", ")
    : "No data sources";

  if (!isJournalSelected) {
    return (
      <div className="journal">
        <div
          className="title"
          onClick={() => selectJournalById({ id: journal?.id })}
        >
          {journal?.title}
        </div>
        <div className="timestamp">
          Last updated: {moment(journal.updatedAt).format("MMMM D, YYYY, h:mm")}
        </div>
        <div
          className="dataSource"
          onClick={handleOpenModal}
          style={{ cursor: "pointer" }}
        >
          Data source:
          <StyledDataSourceLabels>{dataSourceLabels}</StyledDataSourceLabels>
        </div>
      </div>
    );
  }

  return (
    <div className="journal">
      <div className="selectedTitle">{journal?.title}</div>
      <div className="timestamp">
        Last updated: {moment(journal.updatedAt).format("MMMM D, YYYY, h:mm")}
      </div>
      <div
        className="dataSource"
        onClick={handleOpenModal}
        style={{ cursor: "pointer" }}
      >
        Data source:
        <StyledDataSourceLabels>{dataSourceLabels}</StyledDataSourceLabels>
      </div>
      <div className="workspaces">
        {workspaces.map((workspace) => (
          <WorkspaceNavigation
            key={workspace.id}
            workspace={workspace}
            isWorkspaceSelected={workspace?.id === selectedWorkspace?.id}
            selectedWorkspace={selectedWorkspace}
            selectWorkspaceById={selectWorkspaceById}
          />
        ))}
      </div>
      <div>
        <AddWorkspace journalId={selectedJournal?.id} />
      </div>
      <DataSourceModal
        projectId={projectId}
        studyId={studyId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        journal={journal}
      />
    </div>
  );
}
