import { StyledSidebar } from "../styles/StyledDataJournal";
import JournalNavigation from "./Journal";

export default function SideNavigation({
  dataJournals,
  selectedJournalId,
  selectJournalById,
  workspaces,
  selectedWorkspace,
  selectWorkspaceById,
}) {
  return (
    <StyledSidebar>
      <div>Collapse panel</div>
      <div className="journals">
        {dataJournals.map((journal) => (
          <JournalNavigation
            journal={journal}
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
