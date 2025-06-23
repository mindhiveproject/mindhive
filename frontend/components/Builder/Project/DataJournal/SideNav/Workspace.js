export default function WorkspaceNavigation({
  workspace,
  isWorkspaceSelected,
  selectedWorkspace,
  selectWorkspaceById,
}) {
  if (!isWorkspaceSelected) {
    return (
      <div onClick={() => selectWorkspaceById({ id: workspace?.id })}>
        {workspace?.title}
      </div>
    );
  }
  return (
    <div>
      <h2>{workspace?.title}</h2>
      {selectedWorkspace?.vizSections?.map((component) => (
        <div>{component?.type}</div>
      ))}
    </div>
  );
}
