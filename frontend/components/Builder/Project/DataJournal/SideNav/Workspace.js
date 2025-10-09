import { Dropdown, DropdownMenu } from "semantic-ui-react";

import DeleteWorkspace from "../Helpers/DeleteWorkspace";

export default function WorkspaceNavigation({
  projectId,
  studyId,
  journal,
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
      <div className="titleHeader">
        <div className="titleLine">
          <div>
            <img src="/assets/dataviz/sidebar/workspaceSelected.png" />
          </div>
          <div>{workspace?.title}</div>
        </div>
        <div>
          <Dropdown
            icon={<img src={`/assets/dataviz/three-dots.png`} />}
            direction="left"
          >
            <DropdownMenu>
              <DeleteWorkspace
                journal={journal}
                workspace={selectedWorkspace}
                selectWorkspace={() => {}} // TODO finish it later to automatically select another workspace after deletion
              />
            </DropdownMenu>
          </Dropdown>
        </div>
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
