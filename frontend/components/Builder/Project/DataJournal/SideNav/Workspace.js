// components/DataJournal/SideNav/Workspace.js
import { Dropdown, DropdownMenu } from "semantic-ui-react";

import { useDataJournal } from "../Context/DataJournalContext"; // Adjust path
import DeleteWorkspace from "../Helpers/DeleteWorkspace"; // Adjust path

export default function WorkspaceNavigation({
  journal,
  workspace,
  isWorkspaceSelected,
  selectedWorkspace,
  selectWorkspaceById,
}) {
  const { projectId, studyId } = useDataJournal(); // Use context

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
            <div key={component.id} className="component">
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
