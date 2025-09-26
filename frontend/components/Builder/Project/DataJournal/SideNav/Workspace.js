export default function WorkspaceNavigation({
  workspace,
  isWorkspaceSelected,
  selectedWorkspace,
  selectWorkspaceById,
}) {
  if (!isWorkspaceSelected) {
    return (
      <div
        className="workspace"
        onClick={() => selectWorkspaceById({ id: workspace?.id })}
      >
        <div className="titleLine">
          <div>
            <img src="/assets/dataviz/sidebar/workspace.png" />
          </div>
          <div>{workspace?.title}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="selectedWorkspace">
      <div className="titleLine">
        <div>
          <img src="/assets/dataviz/sidebar/workspaceSelected.png" />
        </div>
        <div>{workspace?.title}</div>
      </div>

      {selectedWorkspace?.vizSections?.length ? (
        <div className="components">
          {selectedWorkspace?.vizSections?.map((component) => (
            <div className="component">
              <div>
                <img src="/assets/dataviz/sidebar/paragraph.png" />
              </div>
              <div>{component?.type}</div>
            </div>
          ))}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}
