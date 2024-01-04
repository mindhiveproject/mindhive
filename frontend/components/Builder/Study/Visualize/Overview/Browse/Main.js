import { Icon } from "semantic-ui-react";

import EmptyState from "./EmptyState";
import Contents from "./Contents";

export default function Browse({ studyId, journal, chapterId, selectChapter }) {
  return (
    <div>
      <div>
        <Icon name="folder open" />
      </div>
      <div>Browse</div>
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
