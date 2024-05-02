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
        <div>Browse</div>
        <div>
          {journal && (
            <Dropdown
              icon={<img src={`/assets/icons/visualize/add_notes.svg`} />}
              direction="left"
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
                <BrowseTemplates studyId={studyId} journal={journal} />
              </DropdownMenu>
            </Dropdown>
          )}
        </div>
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
    </div>
  );
}
