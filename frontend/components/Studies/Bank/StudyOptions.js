import { Dropdown } from "semantic-ui-react";

import { SettingsIcon } from "../../DesignSystem/Icons";
import Authorship from "./Options/Authorship";
import Archive from "./Options/Archive";
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

export default function StudyOptions({ user, study, studiesInfo }) {
  // Wrapper opts back into pointer events — DesignSystem/Card makes its content
  // click-through so the whole card links, and re-enables real controls only.
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
          <Authorship user={user} study={study} />
          <Archive user={user} study={study} studiesInfo={studiesInfo} />
          <Delete user={user} study={study} />
        </Dropdown.Menu>
      </Dropdown>
    </span>
  );
}
