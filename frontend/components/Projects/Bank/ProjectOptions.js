import { Dropdown } from "semantic-ui-react";

// import Authorship from "./Options/Authorship";
// import Archive from "./Options/Archive";
import Delete from "./Options/Delete";

export default function StudyOptions({ user, project, projectsInfo }) {
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
        <Dropdown.Menu className="archiveDropdown">
          {/* <Authorship user={user} project={project} />
          <Archive user={user} project={project} projectsInfo={projectsInfo} /> */}
          <Delete user={user} project={project} />
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
}
