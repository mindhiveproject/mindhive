import { Dropdown, DropdownMenu } from "semantic-ui-react";

import EmptyState from "./EmptyState";
import Contents from "./Contents";
import CreatePart from "./CreatePart";
import BrowseTemplates from "./BrowseTemplates";

export default function Navigation({
  user,
  projectId,
  studyId,
  journal,
  part,
  data,
  variables,
  chapterId,
  selectChapter,
  setPage,
}) {
  return (
    <div className="navigation-panel">
      <div className="header">
        <div>
          <img src={`/assets/icons/visualize/folder_open_black.svg`} />
        </div>
        <div>Navigation</div>
        <div>
          {journal && (
            <Dropdown
              icon={<img src={`/assets/icons/visualize/add_notes.svg`} />}
              direction="left"
            >
              <DropdownMenu>
                <CreatePart
                  projectId={projectId}
                  studyId={studyId}
                  journal={journal}
                  dataOrigin="STUDY"
                />
                <CreatePart
                  projectId={projectId}
                  studyId={studyId}
                  journal={journal}
                  dataOrigin="UPLOADED"
                />

                {(user?.permissions?.map((p) => p?.name).includes("ADMIN") ||
                  user?.permissions?.map((p) => p?.name).includes("TEACHER") ||
                  user?.permissions
                    ?.map((p) => p?.name)
                    .includes("MENTOR")) && (
                  <CreatePart
                    projectId={projectId}
                    studyId={studyId}
                    journal={journal}
                    dataOrigin="SIMULATED"
                    exampleDataset={data}
                    exampleVariables={variables}
                  />
                )}

                <BrowseTemplates studyId={studyId} journal={journal} />
              </DropdownMenu>
            </Dropdown>
          )}
        </div>
      </div>

      {!journal && <EmptyState projectId={projectId} studyId={studyId} />}
      {journal && (
        <Contents
          user={user}
          projectId={projectId}
          studyId={studyId}
          journal={journal}
          activePart={part}
          chapterId={chapterId}
          selectChapter={selectChapter}
          setPage={setPage}
        />
      )}
    </div>
  );
}
