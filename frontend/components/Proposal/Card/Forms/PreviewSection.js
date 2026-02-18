import { useState } from "react";
import useTranslation from "next-translate/useTranslation";
import { useMutation } from "@apollo/client";
import { Icon } from "semantic-ui-react";
import InfoTooltip from "../../../Builder/Project/ProjectBoard/Board/PDF/Preview/InfoTooltip";
import { MANAGE_FAVORITE_TASKS } from "../../../Mutations/User";
import { CURRENT_USER_QUERY } from "../../../Queries/User";

// Strip HTML tags from text (used for item titles in chips)
const stripHtml = (html) => {
  if (!html) return "";
  return String(html).replace(/<[^>]*>/g, "").trim();
};

// Base chip layout (all chips)
const CHIP_BASE_STYLES = {
  display: "flex",
  padding: "6px 12px",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "flex-start",
  gap: "10px",
  borderRadius: "8px",
};

// Typography (Figma Design System)
const TYPO = {
  fontFamily: "Inter, sans-serif",
  bodySemibold: { fontFamily: "Inter, sans-serif", fontSize: "16px", lineHeight: "24px", fontWeight: 600 },
  label: { fontFamily: "Inter, sans-serif", fontSize: "14px", lineHeight: "20px", fontWeight: 400 },
  labelSemibold: { fontFamily: "Inter, sans-serif", fontSize: "14px", lineHeight: "20px", fontWeight: 600 },
};

// Assignment chip styles (Disabled, Public, Completed)
const ASSIGNMENT_STYLES = {
  disabled: {
    border: "1px solid var(--MH-Theme-Additional-Accent-Medium, #D8D3E7)",
    background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
  },
  public: {
    border: "1px solid var(--MH-Theme-Additional-Accent-Medium, #D8D3E7)",
    background: "var(--MH-Theme-Accent-Light, #FDF2D0)",
  },
  completed: {
    border: "2px solid var(--MH-Theme-Accent-Dark, #5D5763)",
    background: "var(--MH-Theme-Primary-Light, #DEF8FB)",
  },
};

// Resource/Study chip styles
const RESOURCE_STUDY_STYLES = {
  border: "1px solid var(--MH-Theme-Accent-Dark, #5D5763)",
  // boxShadow: "2px 2px 12px 0 rgba(0, 0, 0, 0.15)",
};

// Task chip styles (Figma: favorited = 2244-2325, not favorited = 2303-2309)
const TASK_STYLES = {
  accent: {
    border: "1px solid var(--MH-Theme-Additional-Accent-Medium, #D8D3E7)",
    background: "var(--MH-Theme-Accent-Light, #FDF2D0)",
    color: "#171717",
  },
  plain: {
    border: "1px solid var(--MH-Theme-Accent-Dark, #5D5763)",
    background: "#FFFFFF",
    color: "#171717",
  },
  favorited: {
    border: "1px solid var(--MH-Theme-Accent-Dark, #5D5763)",
    background: "var(--MH-Theme-Accent-Light, #FDF2D0)",
    color: "#5D5763",
    starColor: "#F2BE42",
  },
  notFavorited: {
    border: "1px solid var(--MH-Theme-Accent-Dark, #5D5763)",
    background: "#FFFFFF",
    color: "#171717",
    starColor: "#5D5763",
  },
};

// Shared tooltip container style for chip tooltips
const CHIP_TOOLTIP_STYLE = {
  width: "max-content",
  maxWidth: "320px",
  borderRadius: "8px",
  padding: "12px 16px",
  marginTop: "8px",
  ...TYPO.label,
};

// Assignment chip (Disabled, Public, Completed states)
// Teachers and mentors can click disabled (unpublished) chips; style stays greyed.
const AssignmentChip = ({
  item,
  index,
  homeworkStatusByAssignmentId,
  t,
  openAssignmentModal,
  hoveredItemId,
  setHoveredItemId,
  user,
}) => {
  const fullTitle = stripHtml(item?.title) || "Untitled";
  const isDisabled = !item?.public;
  const isTeacherOrMentor = user?.permissions?.some(
    (p) => p?.name !== "STUDENT"
  );
  const canClick = !isDisabled || isTeacherOrMentor;
  const status = homeworkStatusByAssignmentId?.[item?.id];
  const isCompleted = status === "Completed";

  let chipStyle = ASSIGNMENT_STYLES.public;
  if (isDisabled) chipStyle = ASSIGNMENT_STYLES.disabled;
  else if (isCompleted) chipStyle = ASSIGNMENT_STYLES.completed;

  const handleClick = () => {
    if (!canClick) return;
    openAssignmentModal?.(item);
  };

  const typeLabel = t("board.expendedCard.myAssignments", "Assignments");
  const tooltipContent = isDisabled
    ? t("board.expendedCard.assignmentNotPublished", "Not published")
    : (
        <>
          <span style={{ ...TYPO.labelSemibold, fontWeight: 700 }}>{typeLabel}:</span> {fullTitle}
        </>
      );
  const isHovered = hoveredItemId === item.id;

  return (
    <InfoTooltip
      content={tooltipContent}
      delayMs={550}
      tooltipStyle={{ ...CHIP_TOOLTIP_STYLE, background: chipStyle.background, border: chipStyle.border, color: "#171717" }}
      wrapperStyle={{ display: "inline-block", maxWidth: "320px" }}
    >
      <div
        className="itemBlockPreview"
        onClick={handleClick}
        onMouseEnter={() => setHoveredItemId(item.id)}
        onMouseLeave={() => setHoveredItemId(null)}
        style={{
          position: "relative",
          ...CHIP_BASE_STYLES,
          flexDirection: "row",
          alignItems: "center",
          ...chipStyle,
          cursor: canClick ? "pointer" : "not-allowed",
          transition: "box-shadow 0.2s ease",
          boxShadow: isHovered && canClick ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
          ...TYPO.label,
          color: chipStyle.color || "#171717",
          maxWidth: "320px",
          minWidth: 0,
          opacity: isDisabled ? 0.55 : 1,
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{fullTitle}</span>
      </div>
    </InfoTooltip>
  );
};

// Resource/Study chip (plain, border + box-shadow)
const ResourceStudyChip = ({
  item,
  type,
  index,
  t,
  openResourceModal,
  hoveredItemId,
  setHoveredItemId,
}) => {
  const fullTitle = stripHtml(item?.title) || "Untitled";
  const isHovered = hoveredItemId === item.id;
  const isStudy = type === "study";
  const viewUrl = isStudy ? `/dashboard/discover/studies?name=${item?.slug}` : null;
  const typeLabel = isStudy ? t("board.expendedCard.studies", "Studies") : t("board.expendedCard.resources", "Resources");
  const tooltipContent = (
    <>
      <span style={{ ...TYPO.labelSemibold, fontWeight: 700 }}>{typeLabel}:</span> {fullTitle}
    </>
  );

  const handleClick = () => {
    if (isStudy) window.open(viewUrl, "_blank", "noopener,noreferrer");
    else openResourceModal?.(item);
  };

  return (
    <InfoTooltip
      content={tooltipContent}
      delayMs={550}
      tooltipStyle={{ ...CHIP_TOOLTIP_STYLE, background: "#FFFFFF", border: RESOURCE_STUDY_STYLES.border, color: "#171717" }}
      wrapperStyle={{ display: "inline-block", maxWidth: "320px" }}
    >
      <div
        className="itemBlockPreview"
        onClick={handleClick}
        onMouseEnter={() => setHoveredItemId?.(item.id)}
        onMouseLeave={() => setHoveredItemId?.(null)}
        style={{
          position: "relative",
          ...CHIP_BASE_STYLES,
          flexDirection: "row",
          alignItems: "center",
          ...RESOURCE_STUDY_STYLES,
          background: "#FFFFFF",
          color: "#171717",
          cursor: "pointer",
          transition: "box-shadow 0.2s ease",
          boxShadow: isHovered ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
          ...TYPO.label,
          maxWidth: "320px",
          minWidth: 0,
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, ...TYPO.label, color: "#171717" }}>{fullTitle}</span>
      </div>
    </InfoTooltip>
  );
};

// Task chip (star icon + label; favorited vs not favorited per Figma)
const TaskSurveyChip = ({
  item,
  index,
  t,
  user,
  hoveredItemId,
  setHoveredItemId,
}) => {
  const fullTitle = stripHtml(item?.title) || "Untitled";
  const isHovered = hoveredItemId === item.id;
  const viewUrl = `/dashboard/discover/tasks?name=${item?.slug}`;
  const typeLabel = t("board.expendedCard.tasks", "Tasks");
  const tooltipContent = (
    <>
      <span style={{ ...TYPO.labelSemibold, fontWeight: 700 }}>{typeLabel}:</span> {fullTitle}
    </>
  );

  const isFavorited = user?.favoriteTasks?.some((fav) => fav?.id === item?.id) ?? false;
  const style = user ? (isFavorited ? TASK_STYLES.favorited : TASK_STYLES.notFavorited) : TASK_STYLES.notFavorited;
  const starColor = style.starColor || TASK_STYLES.notFavorited.starColor;
  const canToggleFavorite = !!user?.id && !!item?.id;

  const [manageFavorite] = useMutation(MANAGE_FAVORITE_TASKS, {
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });

  const handleStarClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canToggleFavorite) return;
    manageFavorite({
      variables: {
        id: user.id,
        taskAction: { [isFavorited ? "disconnect" : "connect"]: { id: item.id } },
      },
    });
  };

  const handleTitleClick = (e) => {
    e.stopPropagation();
    window.open(viewUrl, "_blank", "noopener,noreferrer");
  };

  const tooltipAction = (
    <button
      type="button"
      onClick={() => window.open(viewUrl, "_blank", "noopener,noreferrer")}
      style={{
        ...TYPO.labelSemibold,
        padding: "8px 16px",
        border: "2px solid #5D5763",
        borderRadius: "999px",
        background: "#F3F3F3",
        color: "#5D5763",
        // textDecoration: "underline",
        cursor: "pointer",
      }}
    >
      {t("board.expendedCard.discoverMore", "Discover more about this block")}
    </button>
  );

  return (
    <InfoTooltip
      content={tooltipContent}
      delayMs={550}
      action={tooltipAction}
      tooltipStyle={{ ...CHIP_TOOLTIP_STYLE, background: style.background, border: style.border, color: "#171717" }}
      wrapperStyle={{ display: "inline-block", maxWidth: "320px" }}
    >
      <div
        className="itemBlockPreview"
        onMouseEnter={() => setHoveredItemId?.(item.id)}
        onMouseLeave={() => setHoveredItemId?.(null)}
        style={{
          position: "relative",
          ...CHIP_BASE_STYLES,
          flexDirection: "row",
          alignItems: "center",
          gap: "8px",
          border: style.border,
          background: style.background,
          color: style.color,
          transition: "all 0.2s ease",
          boxShadow: isHovered ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
          ...TYPO.label,
          maxWidth: "320px",
          minWidth: 0,
        }}
      >
        <button
          type="button"
          onClick={handleStarClick}
          disabled={!canToggleFavorite}
          aria-label={isFavorited ? t("board.expendedCard.removeFromFavorites", "Remove from favorites") : t("board.expendedCard.addToFavorites", "Add to favorites")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "left",
            width: "fit-content",
            gap: "8px",
            padding: 0,
            margin: 0,
            border: "none",
            background: "none",
            cursor: canToggleFavorite ? "pointer" : "default",
            color: starColor,
            flexShrink: 0,
            ...TYPO.label,
          }}
        >
          <Icon name="star" style={{ margin: 0, height: "20px", width: "20px" }} />
          <p
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0,
              width: "fit-content",
              maxWidth: "100%",
              ...TYPO.label,
              color: "#171717",
              margin: 0,
            }}
          >
            {fullTitle}
          </p>
        </button>
        <span
          role="button"
          tabIndex={0}
          onClick={handleTitleClick}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleTitleClick(e); } }}
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
            cursor: "pointer",
          }}
        >
          {fullTitle}
        </span>
      </div>
    </InfoTooltip>
  );
};

// Render chip by type
const ChipByType = ({ item, type, index, t, openAssignmentModal, openResourceModal, homeworkStatusByAssignmentId, hoveredItemId, setHoveredItemId, user }) => {
  if (type === "assignment") {
    return (
      <AssignmentChip
        item={item}
        index={index}
        homeworkStatusByAssignmentId={homeworkStatusByAssignmentId}
        t={t}
        openAssignmentModal={openAssignmentModal}
        hoveredItemId={hoveredItemId}
        setHoveredItemId={setHoveredItemId}
        user={user}
      />
    );
  }
  if (type === "task") {
    return (
      <TaskSurveyChip
        item={item}
        index={index}
        t={t}
        user={user}
        hoveredItemId={hoveredItemId}
        setHoveredItemId={setHoveredItemId}
      />
    );
  }
  return (
    <ResourceStudyChip
      item={item}
      type={type}
      index={index}
      t={t}
      openResourceModal={openResourceModal}
      hoveredItemId={hoveredItemId}
      setHoveredItemId={setHoveredItemId}
    />
  );
};

/**
 * Renders a preview list of linked items (resources, assignments, tasks, studies) as chips.
 * Supports single-section mode (title + items + type) or multi-section mode (title + sections with 24px gap).
 * Three chip types: Assignment (Disabled/Public/Completed), Resource/Study (plain + box-shadow), Task (star + accent).
 */
export const PreviewSection = ({
  title,
  items,
  type,
  sections,
  proposal,
  openAssignmentModal,
  openResourceModal,
  user,
  homeworkStatusByAssignmentId,
}) => {
  const { t } = useTranslation("classes");
  const [hoveredItemId, setHoveredItemId] = useState(null);

  const renderChips = (itemsToRender, itemType) =>
    (itemsToRender || []).map((item, index) => (
      <ChipByType
        key={`${itemType}-${item.id}-${index}`}
        item={item}
        type={itemType}
        index={index}
        t={t}
        openAssignmentModal={openAssignmentModal}
        openResourceModal={openResourceModal}
        homeworkStatusByAssignmentId={homeworkStatusByAssignmentId}
        hoveredItemId={hoveredItemId}
        setHoveredItemId={setHoveredItemId}
        user={user}
      />
    ));

  // Multi-section mode
  if (sections && sections.length > 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px"}}>
        {title && (
          <div className="cardHeader" style={{ ...TYPO.bodySemibold, color: "#171717", marginTop: "8px"}}>
            {title}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px"}}>
          {sections.map((sec, sectionIndex) =>
            sec.items && sec.items.length > 0 ? (
              <div key={sectionIndex} className="previewGrid" style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                {renderChips(sec.items, sec.type)}
              </div>
            ) : null
          )}
        </div>
      </div>
    );
  }

  // Single-section mode
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px"}}>
      {title && (
        <div className="cardHeader" style={{ ...TYPO.bodySemibold, color: "#171717", marginTop: "8px" }}>
          {title}
        </div>
      )}
      <div className="previewGrid" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: title ? 0 : "10px", alignItems: "center" }}>
        {renderChips(items, type)}
      </div>
    </div>
  );
};
