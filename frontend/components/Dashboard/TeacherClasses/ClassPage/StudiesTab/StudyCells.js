import useTranslation from "next-translate/useTranslation";

import Button from "../../../../DesignSystem/Button";
import Chip from "../../../../DesignSystem/Chip";
import CopyButton from "../../../../DesignSystem/CopyButton";
import Tooltip from "../../../../DesignSystem/Tooltip";
import {
  LinkIcon,
  LinkOffIcon,
  OpenInNewIcon,
} from "../../../../DesignSystem/Icons";
import RowActionsMenu from "../RowActionsMenu";

// Cell renderers of the class Studies table. Defined at module level so AG Grid
// keeps each cell mounted across re-renders (the copy chip's "Copied" state
// survives typing in the search, for instance).

// Status order, from the study milestone of a student's main project:
// collecting data (submitted), then not submitted, then studies not linked to
// a main project. The milestone has no teacher review step: submitting locks
// the study and opens it to participants.
export const STATUS_COLLECTING = 0;
export const STATUS_NOT_SUBMITTED = 1;
export const STATUS_NONE = 2;

export function statusRankOf(linkedProjects) {
  if (!linkedProjects.some((p) => p?.isMain)) return STATUS_NONE;
  const submitted = linkedProjects.some(
    (p) => p?.study?.dataCollectionStatus === "SUBMITTED"
  );
  return submitted ? STATUS_COLLECTING : STATUS_NOT_SUBMITTED;
}

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

export function StatusCell({ data }) {
  const { t } = useTranslation("classes");
  if (data?.statusRank === STATUS_COLLECTING) {
    return (
      <Chip
        variant="static"
        tone="success"
        label={t("studies.status.collecting", {}, {
          default: "Collecting data",
        })}
        title={t("studies.status.collectingHint", {}, {
          default:
            "Submitted for data collection: the study is locked and open to participants.",
        })}
      />
    );
  }
  if (data?.statusRank === STATUS_NOT_SUBMITTED) {
    return (
      <Chip
        variant="static"
        tone="neutral"
        label={t("studies.status.notSubmitted", {}, {
          default: "Not submitted",
        })}
        title={t("studies.status.notSubmittedHint", {}, {
          default: "Not yet submitted for data collection.",
        })}
      />
    );
  }
  return null;
}

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

export function StudyActionsCell({ data, onLinkProject, onUnlinkProject }) {
  const { t } = useTranslation("classes");
  if (!data?.id) return null;
  const items = [
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
