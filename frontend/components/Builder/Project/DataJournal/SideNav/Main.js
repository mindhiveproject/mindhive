import { StyledSidebar } from "../styles/StyledDataJournal";

import CreateJournal from "../Helpers/CreateJournal";
import JournalNavigation from "./Journal";

export default function SideNavigation({
  user,
  projectId,
  studyId,
  journalCollections,
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

      {journalCollections.length === 0 && (
        <div>
          <p>It looks like you still don’t have any data journals!</p>
          <CreateJournal
            projectId={projectId}
            studyId={studyId}
            createNewJournalCollection={true}
          />
        </div>
      )}

      {journalCollections.length > 0 && (
        <div>
          <CreateJournal
            projectId={projectId}
            studyId={studyId}
            createNewJournalCollection={false}
            journalCollections={journalCollections}
          />
        </div>
      )}

      <div className="journals">
        {dataJournals.map((journal) => (
          <JournalNavigation
            user={user}
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
