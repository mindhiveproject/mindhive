// VizPart in navigation (which is journal in the UI)

import { useState } from "react";
import moment from "moment";
import WorkspaceNavigation from "./Workspace";
import DataSourceModal from "./DataSourceModal";

import { Dropdown, DropdownMenu } from "semantic-ui-react";

import { StyledDataSourceLabels } from "../styles/StyledDataJournal";

import AddWorkspace from "./AddWorkspace";
import EditJournal from "../Helpers/EditJournal";
import DeleteJournal from "../Helpers/DeleteJournal";

export default function JournalNavigation({
  user,
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
      <div className="titleHeader">
        <div className="selectedTitle">{journal?.title}</div>
        <div>
          <Dropdown
            icon={<img src={`/assets/dataviz/three-dots.png`} />}
            direction="left"
          >
            <DropdownMenu>
              <EditJournal
                user={user}
                projectId={projectId}
                studyId={studyId}
                part={journal}
              />
              <DeleteJournal
                projectId={projectId}
                studyId={studyId}
                part={journal}
              />
            </DropdownMenu>
          </Dropdown>
        </div>
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
      <div className="workspaces">
        {workspaces.map((workspace) => (
          <WorkspaceNavigation
            key={workspace.id}
            projectId={projectId}
            studyId={studyId}
            journal={journal}
            workspace={workspace}
            isWorkspaceSelected={workspace?.id === selectedWorkspace?.id}
            selectedWorkspace={selectedWorkspace}
            selectWorkspaceById={selectWorkspaceById}
          />
        ))}
      </div>

      <AddWorkspace journalId={selectedJournal?.id} />

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
