// components/DataJournal/SideNav/Main.js
import useTranslation from "next-translate/useTranslation";

import { StyledSidebar } from "../styles/StyledDataJournal";

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
}) {
  const { t } = useTranslation("builder");

  return (
    <StyledSidebar>
      {journalCollections.length === 0 && (
        <div style={{margin: "16px" }}>
          <p>
            {t("dataJournal.sideNav.noJournalsYet", {}, {
              default: "It looks like you still don't have any data journals!",
            })}
          </p>
          {/* <CreateJournal
            projectId={projectId}
            studyId={studyId}
            createNewJournalCollection={true}
          /> */}
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
