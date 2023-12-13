import { Dropdown } from "semantic-ui-react";

import Authorship from "./Options/Authorship";
import Archive from "./Options/Archive";
import Delete from "./Options/Delete";

export default function StudyOptions({ user, study, studiesInfo }) {
  return (
    <div className="optionsIcon">
      <Dropdown
        className="archiveDeleteIcon"
        direction="left"
        upward={false}
        icon={null}
        trigger={<img src="/assets/icons/settings.svg" />}
        scrolling
      >
        <Dropdown.Menu>
          <Authorship user={user} study={study} />
          <Archive user={user} study={study} studiesInfo={studiesInfo} />
          <Delete user={user} study={study} />
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
}
