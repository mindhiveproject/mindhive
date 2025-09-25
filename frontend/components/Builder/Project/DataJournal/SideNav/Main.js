import { StyledSidebar } from "../styles/StyledDataJournal";
import JournalNavigation from "./Journal";

export default function SideNavigation({
  projectId,
  studyId,
  dataJournals,
  selectedJournal,
  selectedJournalId,
  selectJournalById,
  workspaces,
  selectedWorkspace,
  selectWorkspaceById,
  collapsePanel,
}) {
  return (
    <StyledSidebar>
      <div className="collapsePanelBtn">
        <div onClick={() => collapsePanel()}>
          <img src="/assets/dataviz/collapsePanel.png" />
          Collapse Panel
        </div>
      </div>
      <div className="journals">
        {dataJournals.map((journal) => (
          <JournalNavigation
            projectId={projectId}
            studyId={studyId}
            journal={journal}
            selectedJournal={selectedJournal}
            isJournalSelected={journal?.id === selectedJournalId}
            selectJournalById={selectJournalById}
            workspaces={workspaces}
            selectedWorkspace={selectedWorkspace}
            selectWorkspaceById={selectWorkspaceById}
          />
        ))}
      </div>
    </StyledSidebar>
  );
}
