import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Chip from "../../../../DesignSystem/Chip";
import CopyButton from "../../../../DesignSystem/CopyButton";
import { LinkIcon, LinkOffIcon } from "../../../../DesignSystem/Icons";
import RowActionsMenu from "../RowActionsMenu";

// Cell renderers of the class Studies table. Defined at module level so AG Grid
// keeps each cell mounted across re-renders (the copy chip's "Copied" state
// survives typing in the search, for instance).

// Review order: a main project's study that was submitted for data
// collection, then any other main project's study, then the rest.
export const REVIEW_SUBMITTED = 0;
export const REVIEW_MAIN_PROJECT = 1;
export const REVIEW_NONE = 2;

export function reviewRankOf(linkedProjects) {
  if (!linkedProjects.some((p) => p?.isMain)) return REVIEW_NONE;
  const submitted = linkedProjects.some(
    (p) => p?.study?.dataCollectionStatus === "SUBMITTED"
  );
  return submitted ? REVIEW_SUBMITTED : REVIEW_MAIN_PROJECT;
}

const LinkButton = styled.a`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  font: var(--MH-Type-Label-Base);
  letter-spacing: 0;
  text-align: center;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  background: #ffffff;
  color: #5d5763;
  border: 1.5px solid #5d5763;

  &:hover {
    background: #f5f5f5;
    border-color: #b3b3b3;
    color: #666666;
  }

  &:active {
    background: #e0f2f1;
    border-color: #4db6ac;
    color: #4db6ac;
  }
`;

const CHIP_ROW = {
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
  padding: "6px 0",
};

export function ReviewCell({ data }) {
  const { t } = useTranslation("classes");
  if (data?.reviewRank === REVIEW_SUBMITTED) {
    return (
      <Chip
        variant="static"
        tone="warning"
        label={t("studies.review.submitted", {}, {
          default: "Submitted, to review",
        })}
        title={t("studies.review.submittedHint", {}, {
          default:
            "A student's main project study, submitted for data collection.",
        })}
      />
    );
  }
  if (data?.reviewRank === REVIEW_MAIN_PROJECT) {
    return (
      <Chip
        variant="static"
        tone="info"
        label={t("studies.review.mainProject", {}, {
          default: "Main project",
        })}
        title={t("studies.review.mainProjectHint", {}, {
          default: "Linked to a student's main project.",
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

export function ParticipantLinkCell({ data }) {
  const { t } = useTranslation("classes");
  if (!data?.slug) return null;
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/studies/${data.slug}`
      : `/studies/${data.slug}`;
  return (
    <CopyButton
      value={url}
      title={url}
      ariaLabel={t("studies.copyParticipantLinkAria", { title: data.title }, {
        default: "Copy the participant page link of {{title}}",
      })}
    >
      {t("studies.copyParticipantLink", {}, { default: "Copy link" })}
    </CopyButton>
  );
}

export function StudyBuilderCell({ data }) {
  const { t } = useTranslation("classes");
  if (!data?.id) return null;
  return (
    <LinkButton
      href={`/builder/studies/?selector=${data.id}`}
      target="_blank"
      rel="noreferrer"
    >
      {t("studies.studyBuilder")}
    </LinkButton>
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
    <RowActionsMenu
      items={items}
      ariaLabel={t("studies.rowActions", { title: data.title }, {
        default: "Actions for {{title}}",
      })}
    />
  );
}
