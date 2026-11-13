import useTranslation from "next-translate/useTranslation";

import Button from "../../../../DesignSystem/Button";
import Chip from "../../../../DesignSystem/Chip";
import CopyButton from "../../../../DesignSystem/CopyButton";
import Tooltip from "../../../../DesignSystem/Tooltip";
import {
  ArrowDropDownIcon,
  CheckIcon,
  LinkIcon,
  LinkOffIcon,
  OpenInNewIcon,
  PauseIcon,
  PlayIcon,
  UnlockIcon,
} from "../../../../DesignSystem/Icons";
import RowActionsMenu from "../RowActionsMenu";
import DropdownMenu from "../../../../DesignSystem/DropdownMenu";
import { studyLifecycle } from "../../../../../lib/studyLifecycle";

// Cell renderers of the class Studies table. Defined at module level so AG Grid
// keeps each cell mounted across re-renders (the copy chip's "Copied" state
// survives typing in the search, for instance).

// Button cells sit in auto-height columns: this padding lets the row grow
// around the button instead of the button touching the row borders.
const BUTTON_CELL = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 0",
};

// Chips stay inside the column: the row never grows past the cell, and a
// title too long for it ends in an ellipsis (the chip shows it in full on
// hover).
const CHIP_ROW = {
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
  padding: "6px 0",
  width: "100%",
  minWidth: 0,
  overflow: "hidden",
};

const CHIP_IN_ROW = { maxWidth: "100%" };

// Status of each study, from lib/studyLifecycle.js. A study linked to a
// class project, or in a class that follows data collection itself (its
// Studies-tab milestone card), is supervised by the data-collection milestone: submitting
// locks it and opens it to participants, students can pause participation,
// and only the teaching team reopens it. A study with no class project is
// self-managed: its status is the students' own label and never locks it.
// The two sources are interchangeable: the stage lives on the study.
// Order: supervised (collecting, not submitted, finished), then self-managed.
const STAGE_ORDER = { COLLECTING: 0, DESIGNING: 1, FINISHED: 2 };

export function studyStatusOf(study, linkedProjects, { classFollows = false } = {}) {
  const life = studyLifecycle(study, {
    supervised: classFollows || linkedProjects.length > 0,
  });
  const supervised = life.supervised || life.locked;
  return {
    ...life,
    supervised,
    // Submitted or finished with nothing supervising it any more (board
    // unlinked, or the class stopped following data collection): still
    // locked until a teacher reopens it.
    orphaned: life.locked && !life.supervised,
    collecting: life.stage === "COLLECTING",
    rank: (supervised ? 0 : 3) + STAGE_ORDER[life.stage],
  };
}

function statusChip(t, status) {
  const open = t("studies.status.open", {}, { default: "Open" });
  const paused = t("studies.status.paused", {}, { default: "Paused" });
  const closed = t("studies.status.closed", {}, { default: "Closed" });
  if (!status.supervised) {
    const stage = {
      COLLECTING: t("studies.status.collecting", {}, { default: "Collecting data" }),
      DESIGNING: t("studies.status.designing", {}, { default: "Designing" }),
      FINISHED: t("studies.status.finished", {}, { default: "Finished" }),
    }[status.stage];
    // The "Self-managed" caption sits under the chip (StatusCell), so the
    // chip stays short enough for the column.
    return {
      // Neutral: a quiet fill that also survives as an interactive chip (an
      // interactive chip ignores the "default" tone).
      tone: "neutral",
      caption: t("studies.status.selfManaged", {}, { default: "Self-managed" }),
      label: `${stage}${
        status.stage === "FINISHED" ? "" : ` · ${status.open ? open : closed}`
      }`,
      title: t("studies.status.selfManagedHint", {}, {
        default:
          "Status set by the students. No class milestone supervises this study, so it is never locked. You can still open or close participation.",
      }),
    };
  }
  if (status.stage === "COLLECTING") {
    return status.open
      ? {
          tone: "success",
          label: `${t("studies.status.collecting", {}, { default: "Collecting data" })} · ${open}`,
          title: t("studies.status.collectingHint", {}, {
            default:
              "Submitted for data collection: the study is locked and open to participants.",
          }),
        }
      : {
          tone: "warning",
          label: `${t("studies.status.collecting", {}, { default: "Collecting data" })} · ${paused}`,
          title: t("studies.status.pausedHint", {}, {
            default:
              "Submitted for data collection and locked, but participation was closed by a student or teacher.",
          }),
        };
  }
  if (status.stage === "FINISHED") {
    return {
      tone: "info",
      label: t("studies.status.finished", {}, { default: "Finished" }),
      title: t("studies.status.finishedHint", {}, {
        default:
          "Data collection is finished: participation is closed and the study stays locked. You can resume or reopen it.",
      }),
    };
  }
  return {
    tone: "neutral",
    label: t("studies.status.notSubmitted", {}, { default: "Not submitted" }),
    title: t("studies.status.notSubmittedHint", {}, {
      default: "Not yet submitted for data collection.",
    }),
  };
}

// The status chip opens the same data-collection actions as the row menu
// (open/close participation, finish, resume, reopen) when there are any.
export function StatusCell({ data, onDataCollection }) {
  const { t } = useTranslation("classes");
  if (!data?.studyStatus) return null;
  const chip = { ...statusChip(t, data.studyStatus) };
  if (data.studyStatus.orphaned) {
    chip.caption = t("studies.status.noLongerSupervised", {}, {
      default: "No longer supervised",
    });
    chip.title = t("studies.status.noLongerSupervisedHint", {}, {
      default:
        "Locked from an earlier submission, but no class milestone follows it now. Reopening it makes it self-managed.",
    });
  }
  const items = dataCollectionItems(t, data, onDataCollection);
  const label = t("studies.status.actionsFor", { title: data.title }, {
    default: "Change the status of {{title}}",
  });
  return (
    <div style={STATUS_STACK}>
      {items.length ? (
        // The menu's wrapper sizes to its content; this one takes the cell's
        // width so the chip truncates instead of spilling into the next column.
        <div style={MENU_IN_CELL}>
        <DropdownMenu
          ariaLabel={label}
          // Portal: AG Grid clips overflow inside cells (see RowActionsMenu).
          portal
          items={items}
          renderTrigger={({ onClick, open }) => (
            <Chip
              tone={chip.tone}
              label={chip.label}
              title={chip.title}
              ariaLabel={`${chip.label}. ${label}`}
              trailing={<ArrowDropDownIcon />}
              onClick={onClick}
              pressed={open}
              style={CHIP_IN_ROW}
            />
          )}
        />
        </div>
      ) : (
        <Chip
          variant="static"
          tone={chip.tone}
          label={chip.label}
          title={chip.title}
          style={CHIP_IN_ROW}
        />
      )}
      {chip.caption ? (
        <span className="MH-Type-Label-Small" style={STATUS_CAPTION}>
          {chip.caption}
        </span>
      ) : null}
    </div>
  );
}

// Chip with an optional caption under it, in an auto-height column.
const STATUS_STACK = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 2,
  padding: "6px 0",
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
};

const MENU_IN_CELL = { width: "100%", minWidth: 0 };

const STATUS_CAPTION = {
  color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)",
};

export function ProjectCell({ data }) {
  const { t } = useTranslation("classes");
  const linked = data?.linkedProjects || [];
  if (!linked.length) return null;
  return (
    <div style={CHIP_ROW}>
      {linked.map((project) => (
        <Chip
          key={project.id}
          variant="static"
          tone={project.isMain ? "info" : "neutral"}
          style={CHIP_IN_ROW}
          label={
            project.title ||
            t("studies.newStudy.untitledProject", {}, {
              default: "Untitled project",
            })
          }
        />
      ))}
    </div>
  );
}

// "8 real · 3 test", with what each number tallies in the tooltip. Totals
// come from keystone/lib/classDashboard.js (summarizeParticipation).
export function ParticipantsCell({ data }) {
  const { t } = useTranslation("classes");
  const p = data?.participation;
  if (!p) return <span>{data?.participantsCount ?? 0}</span>;
  const tip = [
    t("studies.participation.realHint", {
      count: p.real,
      guests: p.realGuests,
    }, {
      default:
        "Real: {{count}} ({{guests}} guests). Took part while the study was collecting data, and is not the study's author or a collaborator.",
    }),
    t("studies.participation.testHint", {
      count: p.test,
      guests: p.testGuests,
    }, {
      default:
        "Test: {{count}} ({{guests}} guests). The study's author or collaborators trying it, or anyone who only took part before data collection started.",
    }),
    t("studies.participation.includedHint", { count: p.included }, {
      default:
        "Included in data: {{count}}. Completed a run that is ticked for inclusion on the study's Collect page.",
    }),
    t("studies.participation.scopeHint", {}, {
      default:
        "Counts people (accounts and guests) with at least one recorded run.",
    }),
  ].join("\n\n");
  return (
    <Tooltip content={tip} side="top">
      <span style={{ cursor: "help" }}>
        <span className="MH-Type-Label-Base">
          {t("studies.participation.real", { count: p.real }, {
            default: "{{count}} real",
          })}
        </span>
        <span style={{ color: "var(--MH-Theme-Neutrals-Dark, #6b6b6b)" }}>
          {" · "}
          {t("studies.participation.test", { count: p.test }, {
            default: "{{count}} test",
          })}
        </span>
      </span>
    </Tooltip>
  );
}

export function ParticipantLinkCell({ data }) {
  const { t } = useTranslation("classes");
  if (!data?.slug) return null;
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/studies/${data.slug}`
      : `/studies/${data.slug}`;
  return (
    <div style={BUTTON_CELL}>
      <CopyButton
        value={url}
        title={url}
        ariaLabel={t("studies.copyParticipantLinkAria", { title: data.title }, {
          default: "Copy the participant page link of {{title}}",
        })}
      >
        {t("studies.copyParticipantLink", {}, { default: "Copy link" })}
      </CopyButton>
    </div>
  );
}

export function StudyBuilderCell({ data }) {
  const { t } = useTranslation("classes");
  if (!data?.id) return null;
  const label = t("studies.studyBuilder");
  return (
    <div style={BUTTON_CELL}>
      <Button
        variant="subtle"
        trailingIcon={<OpenInNewIcon />}
        aria-label={t("studies.openBuilderNewTab", { title: data.title }, {
          default: "Open {{title}} in the study builder (new tab)",
        })}
        onClick={() =>
          window.open(
            `/builder/studies/?selector=${data.id}`,
            "_blank",
            "noopener,noreferrer"
          )
        }
      >
        {label}
      </Button>
    </div>
  );
}

// Data-collection actions a teacher can take from the row
// (setStudyDataCollection; see keystone/lib/studyDataCollection.js).
function dataCollectionItems(t, data, onDataCollection) {
  const status = data?.studyStatus;
  if (!status || !onDataCollection) return [];
  const items = [];
  if (status.stage === "COLLECTING" || !status.supervised) {
    if (status.stage !== "FINISHED") {
      items.push({
        key: "participation",
        label: status.open
          ? t("studies.dataCollection.closeParticipation", {}, {
              default: "Close participation",
            })
          : t("studies.dataCollection.openParticipation", {}, {
              default: "Open participation",
            }),
        // Pause closes participation, play opens it.
        icon: status.open ? <PauseIcon /> : <PlayIcon />,
        onClick: () =>
          onDataCollection(data, "SET_PARTICIPATION", { open: !status.open }),
      });
    }
  }
  if (status.supervised && status.stage === "COLLECTING") {
    items.push({
      key: "finish",
      label: t("studies.dataCollection.finish", {}, {
        default: "Mark data collection finished",
      }),
      icon: <CheckIcon />,
      onClick: () => onDataCollection(data, "FINISH"),
    });
  }
  if (status.supervised && status.stage === "FINISHED") {
    items.push({
      key: "resume",
      label: t("studies.dataCollection.resume", {}, {
        default: "Resume data collection",
      }),
      icon: <PlayIcon />,
      onClick: () => onDataCollection(data, "RESUME"),
    });
  }
  if (status.supervised && status.stage !== "DESIGNING") {
    items.push({
      key: "reopen",
      label: t("studies.dataCollection.reopen", {}, {
        default: "Reopen for editing",
      }),
      icon: <UnlockIcon />,
      onClick: () => onDataCollection(data, "REOPEN"),
    });
  }
  return items;
}

export function StudyActionsCell({
  data,
  onLinkProject,
  onUnlinkProject,
  onDataCollection,
}) {
  const { t } = useTranslation("classes");
  if (!data?.id) return null;
  const items = [
    ...dataCollectionItems(t, data, onDataCollection),
    {
      key: "link",
      label: t("studies.linkProject.action", {}, {
        default: "Link to a project…",
      }),
      icon: <LinkIcon />,
      onClick: () => onLinkProject?.(data),
    },
    ...(data.linkedProjects || []).map((project) => ({
      key: `unlink:${project.id}`,
      label: t("studies.unlinkProject.action", { project: project.title }, {
        default: "Unlink from “{{project}}”",
      }),
      // Unlinking keeps the study, so not the menu's default trash icon.
      icon: <LinkOffIcon />,
      onClick: () => onUnlinkProject?.(project, data),
      danger: true,
    })),
  ];
  return (
    <div style={BUTTON_CELL}>
      <RowActionsMenu
        items={items}
        ariaLabel={t("studies.rowActions", { title: data.title }, {
          default: "Actions for {{title}}",
        })}
      />
    </div>
  );
}
