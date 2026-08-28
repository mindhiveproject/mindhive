import { Dropdown } from "semantic-ui-react";

import { SettingsIcon } from "../../DesignSystem/Icons";
// import Authorship from "./Options/Authorship";
// import Archive from "./Options/Archive";
import Delete from "./Options/Delete";

const TRIGGER_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 40,
  height: 40,
  borderRadius: 100,
  background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
  cursor: "pointer",
};

export default function ProjectOptions({ user, project, projectsInfo }) {
  // Wrapper opts back into pointer events — see StudyOptions.
  return (
    <span data-card-action style={{ display: "inline-flex" }}>
      <Dropdown
        direction="left"
        upward={false}
        icon={null}
        trigger={
          <span style={TRIGGER_STYLE} aria-hidden>
            <SettingsIcon />
          </span>
        }
        scrolling
      >
        <Dropdown.Menu className="archiveDropdown" style={{ minWidth: 260 }}>
          {/* <Authorship user={user} project={project} />
          <Archive user={user} project={project} projectsInfo={projectsInfo} /> */}
          <Delete user={user} project={project} />
        </Dropdown.Menu>
      </Dropdown>
    </span>
  );
}
