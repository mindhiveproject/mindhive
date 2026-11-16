import useTranslation from "next-translate/useTranslation";

import Button from "../../../../../DesignSystem/Button";
import IconButton from "../../../../../DesignSystem/IconButton";
import Tooltip from "../../../../../DesignSystem/Tooltip";
import {
  ErrorOutlineIcon,
  OpenInNewIcon,
} from "../../../../../DesignSystem/Icons";

// Long titles ellipsise inside the cell instead of spilling into the next column.
const FIT_CELL_STYLE = { maxWidth: "100%", minWidth: 0, flexShrink: 1 };
const LABEL_STYLE = {
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const NOTE_BUTTON_STYLE = {
  width: 32,
  height: 32,
  marginLeft: 4,
  flexShrink: 0,
  color: "var(--MH-Theme-Warning-Dark, #8f1f14)",
};
const CELL_STYLE = { display: "flex", alignItems: "center", minWidth: 0 };

const quoted = (titles) =>
  titles.map((title) => `"${title}"`).join(", ");

// Why the project shown may not be the whole picture: a second main project,
// a main project shared with classmates, or projects that were not made from
// any of the class's project boards.
function useProjectNotes(row) {
  const { t } = useTranslation("classes");
  const notes = [];
  if (row?.otherMainTitles?.length) {
    notes.push(
      t(
        "dashboard.noteOtherMains",
        { titles: quoted(row.otherMainTitles) },
        {
          default: `This student has more than one main project in this class. Also marked as main: ${quoted(
            row.otherMainTitles
          )}. Choose one in Manage projects.`,
        }
      )
    );
  }
  if (row?.mainSharedWith?.length) {
    notes.push(
      t(
        "dashboard.noteMainShared",
        { names: row.mainSharedWith.join(", ") },
        {
          default: `Shared project: it is also the main project of ${row.mainSharedWith.join(
            ", "
          )}.`,
        }
      )
    );
  }
  if (row?.offBoardTitles?.length) {
    notes.push(
      t(
        "dashboard.noteOffBoard",
        { titles: quoted(row.offBoardTitles) },
        {
          default: `Not made from one of this class's project boards, so it is not counted under any of them: ${quoted(
            row.offBoardTitles
          )}.`,
        }
      )
    );
  }
  return notes;
}

// The alert opens the student's Manage projects panel, where each note can be
// resolved.
function ProjectNotes({ notes, onOpen }) {
  const { t } = useTranslation("classes");
  if (!notes.length) return null;
  const text = notes.join(" ");
  const hint = t("dashboard.noteOpenManager", {}, {
    default: "Open Manage projects to resolve this.",
  });
  return (
    <Tooltip content={`${text} ${hint}`} side="bottom" maxWidth={360}>
      <IconButton
        variant="text"
        icon={<ErrorOutlineIcon />}
        ariaLabel={`${text} ${hint}`}
        elevated={false}
        style={NOTE_BUTTON_STYLE}
        onClick={(event) => {
          event.stopPropagation();
          onOpen?.();
        }}
      />
    </Tooltip>
  );
}

export function MainProjectCell(props) {
  const { t } = useTranslation("classes");
  const projectId = props.data?.projectId;
  const notes = useProjectNotes(props.data);
  const openManager = () => props.onManageProject?.(props.data);

  if (!projectId) {
    return (
      <span style={CELL_STYLE}>
        {t("dashboard.none", {}, { default: "None" })}
        <ProjectNotes notes={notes} onOpen={openManager} />
      </span>
    );
  }

  const title =
    props.value ||
    t("dashboard.untitledProject", {}, { default: "Untitled project" });

  return (
    <span style={CELL_STYLE}>
      <Button
        variant="subtle"
        leadingIcon={<OpenInNewIcon />}
        title={title}
        style={FIT_CELL_STYLE}
        onClick={(event) => {
          event.stopPropagation();
          window.open(`/builder/projects?selector=${projectId}`, "_blank");
        }}
      >
        <span style={LABEL_STYLE}>{title}</span>
      </Button>
      <ProjectNotes notes={notes} onOpen={openManager} />
    </span>
  );
}
