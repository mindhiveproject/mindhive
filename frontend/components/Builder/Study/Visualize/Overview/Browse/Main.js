import { Dropdown, DropdownMenu } from "semantic-ui-react";

import EmptyState from "./EmptyState";
import Contents from "./Contents";
import CreateChapter from "./CreateChapter";

export default function Browse({ studyId, journal, chapterId, selectChapter }) {
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
            >
              <DropdownMenu>
                <CreateChapter studyId={studyId} journal={journal} />
              </DropdownMenu>
            </Dropdown>
          )}
        </div>
      </div>

      {!journal && <EmptyState studyId={studyId} />}
      {journal && (
        <Contents
          studyId={studyId}
          journal={journal}
          chapterId={chapterId}
          selectChapter={selectChapter}
        />
      )}
    </div>
  );
}
