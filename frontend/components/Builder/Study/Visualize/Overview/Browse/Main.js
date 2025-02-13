import { Dropdown, DropdownMenu } from "semantic-ui-react";

import EmptyState from "./EmptyState";
import Contents from "./Contents";
import CreatePart from "./CreatePart";
import BrowseTemplates from "./BrowseTemplates";

export default function Browse({
  user,
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
    <div>
      <div className="header">
        <div>
          <img src={`/assets/icons/visualize/folder_open_black.svg`} />
        </div>
        <div>Journals Navigation</div>
        <div></div>
      </div>

      {!journal && <EmptyState studyId={studyId} />}
      {journal && (
        <Contents
          user={user}
          studyId={studyId}
          journal={journal}
          activePart={part}
          chapterId={chapterId}
          selectChapter={selectChapter}
          setPage={setPage}
        />
      )}

      {journal && (
        <Dropdown
          direction="right"
          icon={null}
          trigger={<div className="addJournalBtn">+ Add journal</div>}
        >
          <DropdownMenu>
            <CreatePart
              studyId={studyId}
              journal={journal}
              dataOrigin="STUDY"
            />
            <CreatePart
              studyId={studyId}
              journal={journal}
              dataOrigin="UPLOADED"
            />

            {(user?.permissions?.map((p) => p?.name).includes("ADMIN") ||
              user?.permissions?.map((p) => p?.name).includes("TEACHER") ||
              user?.permissions?.map((p) => p?.name).includes("MENTOR")) && (
              <CreatePart
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
  );
}
