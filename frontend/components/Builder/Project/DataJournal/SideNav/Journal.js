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
      <div onClick={() => selectJournalById({ id: journal?.id })}>
        {journal?.title}
      </div>
    );
  }
  return (
    <div>
      <h2>{journal?.title}</h2>
      {workspaces.map((workspace) => (
        <WorkspaceNavigation
          workspace={workspace}
          isWorkspaceSelected={workspace?.id === selectedWorkspace?.id}
          selectedWorkspace={selectedWorkspace}
          selectWorkspaceById={selectWorkspaceById}
        />
      ))}
    </div>
  );
}
