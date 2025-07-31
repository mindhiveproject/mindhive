import WorkspaceNavigation from "./Workspace";

export default function JournalNavigation({
  journal,
  isJournalSelected,
  selectJournalById,
  workspaces,
  selectedWorkspace,
  selectWorkspaceById,
}) {
  if (!isJournalSelected) {
    return (
      <div className="journal">
        <div
          className="title"
          onClick={() => selectJournalById({ id: journal?.id })}
        >
          {journal?.title}
        </div>
        <div className="timestamp">Last updated: Nov 13, 2024</div>
        <div className="dataSource">Data source</div>
      </div>
    );
  }
  return (
    <div className="journal">
      <div className="selectedTitle">{journal?.title}</div>
      <div className="timestamp">Last updated: Nov 13, 2024</div>
      <div className="dataSource">Data source</div>
      <div className="workspaces">
        {workspaces.map((workspace) => (
          <WorkspaceNavigation
            workspace={workspace}
            isWorkspaceSelected={workspace?.id === selectedWorkspace?.id}
            selectedWorkspace={selectedWorkspace}
            selectWorkspaceById={selectWorkspaceById}
          />
        ))}
      </div>
    </div>
  );
}
