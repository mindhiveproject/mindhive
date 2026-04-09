// components/DataJournal/SideNav/Main.js
import useTranslation from "next-translate/useTranslation";

import Button from "../../../../DesignSystem/Button";
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
  const { t } = useTranslation("builder");
  const { projectId, studyId } = useDataJournal(); // Use context instead of props

  return (
    <StyledSidebar>
      <div className="navigationPanelHeader">
        <div className="collapsePanelBtn">
          <Button
            type="button"
            variant="text"
            style={{ color: "#5D5763", fontWeight: 400 }}
            onClick={() => collapsePanel()}
            leadingIcon={<img src="/assets/dataviz/openPanel.svg" alt="" aria-hidden className="collapsePanelBtnIcon" />}
          >
            {t("dataJournal.sideNav.collapsePanel", "Collapse panel")}
          </Button>
        </div>
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
      </div>

      {journalCollections.length === 0 && (
        <div>
          <p>{t("dataJournal.sideNav.noJournalsYet", "It looks like you still don't have any data journals!")}</p>
          <CreateJournal
            projectId={projectId}
            studyId={studyId}
            createNewJournalCollection={true}
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
