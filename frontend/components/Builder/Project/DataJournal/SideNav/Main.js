// components/DataJournal/SideNav/Main.js
import { useDataJournal } from "../Context/DataJournalContext";
import { StyledSidebar } from "../styles/StyledDataJournal";

import CreateJournal from "../Helpers/CreateJournal";
import JournalNavigation from "./Journal";

export default function SideNavigation({
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
  const { projectId, studyId } = useDataJournal(); // Use context instead of props

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
            key={journal.id}
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
