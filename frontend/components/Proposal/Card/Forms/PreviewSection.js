import { useState, useRef } from "react";
import useTranslation from "next-translate/useTranslation";
import { Icon } from "semantic-ui-react";

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

// Task chip styles (Accent variant as default)
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
};

// Assignment chip (Disabled, Public, Completed states)
const AssignmentChip = ({
  item,
  index,
  homeworkStatusByAssignmentId,
  t,
  openAssignmentModal,
  hoveredItemId,
  setHoveredItemId,
  tooltipTimeoutRef,
}) => {
  const fullTitle = stripHtml(item?.title) || "Untitled";
  const isDisabled = !item?.public;
  const status = homeworkStatusByAssignmentId?.[item?.id];
  const isCompleted = status === "Completed";

  let chipStyle = ASSIGNMENT_STYLES.public;
  if (isDisabled) chipStyle = ASSIGNMENT_STYLES.disabled;
  else if (isCompleted) chipStyle = ASSIGNMENT_STYLES.completed;

  const handleClick = () => {
    if (isDisabled) return;
    openAssignmentModal?.(item);
  };

  const typeLabel = t("board.expendedCard.myAssignments", "Assignments");
  const tooltipContent = isDisabled
    ? t("board.expendedCard.assignmentNotPublished", "Not published")
    : `${typeLabel}: ${fullTitle}`;
  const isHovered = hoveredItemId === item.id;

  return (
    <div
      className="itemBlockPreview"
      key={`assignment-${item.id}-${index}`}
      onClick={handleClick}
      onMouseEnter={(e) => {
        setHoveredItemId(item.id);
        const el = e.currentTarget;
        if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = setTimeout(() => {
          const tooltip = el.querySelector(".hover-tooltip");
          if (tooltip) {
            tooltip.style.opacity = "1";
            tooltip.style.transform = "translateY(0)";
          }
        }, 550);
      }}
      onMouseLeave={(e) => {
        setHoveredItemId(null);
        if (tooltipTimeoutRef.current) {
          clearTimeout(tooltipTimeoutRef.current);
          tooltipTimeoutRef.current = null;
        }
        const tooltip = e.currentTarget.querySelector(".hover-tooltip");
        if (tooltip) {
          tooltip.style.opacity = "0";
          tooltip.style.transform = "translateY(-5px)";
        }
      }}
      style={{
        position: "relative",
        ...CHIP_BASE_STYLES,
        flexDirection: "row",
        alignItems: "center",
        ...chipStyle,
        cursor: isDisabled ? "not-allowed" : "pointer",
        transition: "box-shadow 0.2s ease",
        boxShadow: isHovered && !isDisabled ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
        ...TYPO.bodySemibold,
        color: chipStyle.color || "#171717",
        maxWidth: "320px",
        minWidth: 0,
        opacity: isDisabled ? 0.55 : 1,
      }}
    >
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{fullTitle}</span>
      <div
        className="hover-tooltip"
        style={{
          position: "absolute",
          top: "100%",
          left: "0",
          width: "max-content",
          maxWidth: "320px",
          background: chipStyle.background,
          border: chipStyle.border,
          color: "#171717",
          marginTop: "8px",
          padding: "12px 16px",
          borderRadius: "8px",
          ...TYPO.label,
          opacity: 0,
          transform: "translateY(-5px)",
          transition: "all 0.3s ease",
          pointerEvents: "none",
          zIndex: 1000,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.10)",
        }}
      >
        {isDisabled ? tooltipContent : <><span style={{ ...TYPO.labelSemibold, fontWeight: 700 }}>{typeLabel}:</span> {fullTitle}</>}
      </div>
    </div>
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
  tooltipTimeoutRef,
}) => {
  const fullTitle = stripHtml(item?.title) || "Untitled";
  const isStudy = type === "study";
  const viewUrl = isStudy ? `/dashboard/discover/studies?name=${item?.slug}` : null;
  const typeLabel = isStudy ? t("board.expendedCard.studies", "Studies") : t("board.expendedCard.resources", "Resources");
  const tooltipContent = `${typeLabel}: ${fullTitle}`;
  const isHovered = hoveredItemId === item.id;

  const handleClick = () => {
    if (isStudy) window.open(viewUrl, "_blank", "noopener,noreferrer");
    else openResourceModal?.(item);
  };

  return (
    <div
      className="itemBlockPreview"
      key={`${type}-${item.id}-${index}`}
      onClick={handleClick}
      onMouseEnter={(e) => {
        setHoveredItemId(item.id);
        const el = e.currentTarget;
        if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = setTimeout(() => {
          const tooltip = el.querySelector(".hover-tooltip");
          if (tooltip) {
            tooltip.style.opacity = "1";
            tooltip.style.transform = "translateY(0)";
          }
        }, 550);
      }}
      onMouseLeave={(e) => {
        setHoveredItemId(null);
        if (tooltipTimeoutRef.current) {
          clearTimeout(tooltipTimeoutRef.current);
          tooltipTimeoutRef.current = null;
        }
        const tooltip = e.currentTarget.querySelector(".hover-tooltip");
        if (tooltip) {
          tooltip.style.opacity = "0";
          tooltip.style.transform = "translateY(-5px)";
        }
      }}
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
        // boxShadow: isHovered ? "2px 2px 12px 0 rgba(0, 0, 0, 0.2)" : RESOURCE_STUDY_STYLES.boxShadow,
        ...TYPO.bodySemibold,
        maxWidth: "320px",
        minWidth: 0,
      }}
    >
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{fullTitle}</span>
      <div
        className="hover-tooltip"
        style={{
          position: "absolute",
          top: "100%",
          left: "0",
          width: "max-content",
          maxWidth: "320px",
          background: "#FFFFFF",
          border: RESOURCE_STUDY_STYLES.border,
          color: "#171717",
          marginTop: "8px",
          padding: "12px 16px",
          borderRadius: "8px",
          ...TYPO.label,
          opacity: 0,
          transform: "translateY(-5px)",
          transition: "all 0.3s ease",
          pointerEvents: "none",
          zIndex: 1000,
          // boxShadow: "0 4px 12px rgba(0, 0, 0, 0.10)",
        }}
      >
        <span style={{ ...TYPO.labelSemibold, fontWeight: 700 }}>{typeLabel}:</span> {fullTitle}
      </div>
    </div>
  );
};

// Task chip (star icon + label, accent style)
const TaskSurveyChip = ({
  item,
  index,
  t,
  hoveredItemId,
  setHoveredItemId,
  tooltipTimeoutRef,
}) => {
  const fullTitle = stripHtml(item?.title) || "Untitled";
  const viewUrl = `/dashboard/discover/tasks?name=${item?.slug}`;
  const typeLabel = t("board.expendedCard.tasks", "Tasks");
  const tooltipContent = `${typeLabel}: ${fullTitle}`;
  const isHovered = hoveredItemId === item.id;

  const handleClick = () => {
    window.open(viewUrl, "_blank", "noopener,noreferrer");
  };

  // const style = isHovered ? TASK_STYLES.plain : TASK_STYLES.accent;
  const style = TASK_STYLES.plain

  return (
    <div
      className="itemBlockPreview"
      key={`task-${item.id}-${index}`}
      onClick={handleClick}
      onMouseEnter={(e) => {
        setHoveredItemId(item.id);
        const el = e.currentTarget;
        if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = setTimeout(() => {
          const tooltip = el.querySelector(".hover-tooltip");
          if (tooltip) {
            tooltip.style.opacity = "1";
            tooltip.style.transform = "translateY(0)";
          }
        }, 550);
      }}
      onMouseLeave={(e) => {
        setHoveredItemId(null);
        if (tooltipTimeoutRef.current) {
          clearTimeout(tooltipTimeoutRef.current);
          tooltipTimeoutRef.current = null;
        }
        const tooltip = e.currentTarget.querySelector(".hover-tooltip");
        if (tooltip) {
          tooltip.style.opacity = "0";
          tooltip.style.transform = "translateY(-5px)";
        }
      }}
      style={{
        position: "relative",
        ...CHIP_BASE_STYLES,
        flexDirection: "row",
        alignItems: "center",
        gap: "8px",
        ...style,
        cursor: "pointer",
        transition: "all 0.2s ease",
        // boxShadow: isHovered ? "2px 2px 12px 0 rgba(0, 0, 0, 0.15)" : "none",
        ...TYPO.bodySemibold,
        maxWidth: "320px",
        minWidth: 0,
      }}
    >
      {/* <Icon name="star" style={{ flexShrink: 0, color: style.color || "#5D5763", margin: 0 }} /> */}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{fullTitle}</span>
      <div
        className="hover-tooltip"
        style={{
          position: "absolute",
          top: "100%",
          left: "0",
          width: "max-content",
          maxWidth: "320px",
          background: style.background,
          border: style.border,
          color: "#171717",
          marginTop: "8px",
          padding: "12px 16px",
          borderRadius: "8px",
          ...TYPO.label,
          opacity: 0,
          transform: "translateY(-5px)",
          transition: "all 0.3s ease",
          pointerEvents: "none",
          zIndex: 1000,
          // boxShadow: "0 4px 12px rgba(0, 0, 0, 0.10)",
        }}
      >
        <span style={{ ...TYPO.labelSemibold, fontWeight: 700 }}>{typeLabel}:</span> {fullTitle}
      </div>
    </div>
  );
};

// Render chip by type
const ChipByType = ({ item, type, index, t, openAssignmentModal, openResourceModal, homeworkStatusByAssignmentId, hoveredItemId, setHoveredItemId, tooltipTimeoutRef }) => {
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
        tooltipTimeoutRef={tooltipTimeoutRef}
      />
    );
  }
  if (type === "task") {
    return (
      <TaskSurveyChip
        item={item}
        index={index}
        t={t}
        hoveredItemId={hoveredItemId}
        setHoveredItemId={setHoveredItemId}
        tooltipTimeoutRef={tooltipTimeoutRef}
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
      tooltipTimeoutRef={tooltipTimeoutRef}
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
  const tooltipTimeoutRef = useRef(null);

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
        tooltipTimeoutRef={tooltipTimeoutRef}
      />
    ));

  // Multi-section mode
  if (sections && sections.length > 0) {
    return (
      <>
        {title && (
          <div className="cardHeader" style={{ ...TYPO.bodySemibold, color: "#171717", marginTop: "8px", marginBottom: "4px" }}>
            {title}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: title ? 0 : "10px" }}>
          {sections.map((sec, sectionIndex) =>
            sec.items && sec.items.length > 0 ? (
              <div key={sectionIndex} className="previewGrid" style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                {renderChips(sec.items, sec.type)}
              </div>
            ) : null
          )}
        </div>
      </>
    );
  }

  // Single-section mode
  return (
    <>
      {title && (
        <div className="cardHeader" style={{ ...TYPO.bodySemibold, color: "#171717", marginTop: "8px", marginBottom: "4px" }}>
          {title}
        </div>
      )}
      <div className="previewGrid" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: title ? 0 : "10px", alignItems: "center" }}>
        {renderChips(items, type)}
      </div>
    </>
  );
};
