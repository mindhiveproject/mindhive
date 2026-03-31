import { useState } from "react";
import useTranslation from "next-translate/useTranslation";
import CompactActionButton from "../../../../DesignSystem/CompactActionButton";
import InfoTooltip from "../../../../DesignSystem/InfoTooltip";

function getHeaderIconSrc(activeComponent) {
  const type = activeComponent?.type;
  const contentType = activeComponent?.content?.type;

  if (type === "HYPVIS") return "/assets/dataviz/headerIcon/hypvis.svg";
  if (type === "PARAGRAPH") return "/assets/dataviz/headerIcon/paragraph.svg";
  if (type === "CODE") return "/assets/dataviz/headerIcon/code.svg";
  if (type === "TABLE") return "/assets/dataviz/headerIcon/table.svg";

  // Statistical test and summary-style components share the table/summary icon.
  if (type === "STATTEST") return "/assets/dataviz/headerIcon/summary.svg";
  if (type === "STATISTICS") return "/assets/dataviz/headerIcon/table.svg";

  if (type === "GRAPH") {
    if (contentType === "barGraph") return "/assets/dataviz/headerIcon/barChart.svg";
    if (contentType === "scatterPlot") return "/assets/dataviz/headerIcon/scatterPlot.svg";
    if (contentType === "histogram") return "/assets/dataviz/headerIcon/stackedBarChart.svg";
    return "/assets/dataviz/headerIcon/defaultGraph.svg";
  }

  return "/assets/dataviz/headerIcon/defaultGraph.svg";
}

function getComponentTypeLabel(activeComponent, t) {
  const type = activeComponent?.type;
  const contentType = activeComponent?.content?.type;

  if (type === "HYPVIS") {
    return t("dataJournal.componentEditor.typeLabel.hypVis", "Hypothesis Visualizer");
  }
  if (type === "PARAGRAPH") {
    return t("dataJournal.componentEditor.typeLabel.paragraph", "Paragraph");
  }
  if (type === "CODE") {
    return t("dataJournal.componentEditor.typeLabel.code", "Code");
  }
  if (type === "TABLE") {
    return t("dataJournal.componentEditor.typeLabel.table", "Table");
  }
  if (type === "STATTEST") {
    return t("dataJournal.componentEditor.typeLabel.statTest", "Statistical Test");
  }
  if (type === "STATISTICS") {
    return t("dataJournal.componentEditor.typeLabel.summary", "Summary");
  }
  if (type === "GRAPH") {
    if (contentType === "barGraph") {
      return t("dataJournal.componentEditor.typeLabel.barGraph", "Bar Graph");
    }
    if (contentType === "scatterPlot") {
      return t("dataJournal.componentEditor.typeLabel.scatterPlot", "Scatter Plot");
    }
    if (contentType === "histogram") {
      return t("dataJournal.componentEditor.typeLabel.histogram", "Histogram");
    }
    return t("dataJournal.componentEditor.typeLabel.graph", "Graph");
  }
  return t("dataJournal.componentEditor.typeLabel.component", "Component");
}

export default function EditorHeader({
  user,
  studyId,
  onChange,
  onSave,
  onDelete,
  activeComponent,
  showSaveFigureToMedia = false,
  disableSaveFigureToMedia = false,
  onSaveFigureToMedia,
}) {
  const { t } = useTranslation("builder");
  const headerIconSrc = getHeaderIconSrc(activeComponent);
  const componentTypeLabel = getComponentTypeLabel(activeComponent, t);

  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(activeComponent?.title || "");

  const handleEditClick = () => {
    setIsEditing(true);
    setNewTitle(activeComponent?.title || "");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleTitleSubmit();
    }
  };

  const handleTitleChange = (e) => {
    setNewTitle(e.target.value);
  };

  const handleTitleSubmit = async () => {
    if (newTitle.trim() && newTitle !== activeComponent?.title) {
      try {
        onChange({
          componentId: activeComponent?.id,
          newTitle: newTitle,
        });
        setIsEditing(false);
      } catch (error) {
        console.error("Error updating component title:", error);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleDeleteClick = () => {
    const confirmed = window.confirm(
      t(
        "dataJournal.componentEditor.deleteConfirm",
        "Are you sure you want to delete this component?",
      ),
    );
    if (!confirmed) return;
    onDelete();
  };

  return (
    <div className="editor-header">
      <InfoTooltip
        content={componentTypeLabel}
        tooltipStyle={{ width: "fit-content", whiteSpace: "nowrap", fontSize: "14px", backgroundColor: "#FFFFFF", color: "var(--MH-Theme-Neutrals-Black, #171717)", border: "1px solid #A1A1A1" }}
        position="right"
      >
        <CompactActionButton
          kind="asset"
          mode="label"
          icon={<img src={headerIconSrc} alt="" aria-hidden width={20} height={20} />}
          aria-hidden
        />
      </InfoTooltip>
      {isEditing ? (
        <div className="editor-component-name-input">
          <input
            type="text"
            value={newTitle}
            onChange={handleTitleChange}
            onBlur={handleTitleSubmit}
            autoFocus
          />
        </div>
      ) : (
        <div
          className="editor-component-name"
          onClick={handleEditClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleEditClick();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={t("dataJournal.componentEditor.editTitle", "Edit component title")}
        >
          <div className="editor-component-title">
            {activeComponent?.title || t("dataJournal.componentEditor.componentName", "Component Name")}
          </div>
          <div style={{ cursor: "pointer" }}>
            <img src="/assets/dataviz/edit.svg" alt="edit component title" />
          </div>
        </div>
      )}

      <div className="actions">
        {/* <div className="button">
          <img
            src="/assets/dataviz/Trash Button.png"
            alt="Delete component button"
            onClick={onDelete}
          />
        </div> */}
        <div className="actions">
          {showSaveFigureToMedia ? (
            <CompactActionButton
              kind="asset"
              onClick={onSaveFigureToMedia}
              disabled={disableSaveFigureToMedia}
              ariaLabel={t(
                "dataJournal.componentEditor.saveFigureToMedia",
                "Save figure to media library",
              )}
              title={t(
                "dataJournal.componentEditor.saveFigureToMedia",
                "Save figure to media library",
              )}
            />
          ) : null}
          {/* <CompactActionButton
            kind="close"
            onClick={onSave}
            ariaLabel={t("dataJournal.componentEditor.close", "Close")}
            title={t("dataJournal.componentEditor.close", "Close")}
          /> */}
          <CompactActionButton
            kind="delete"
            onClick={handleDeleteClick}
            ariaLabel={t("dataJournal.componentEditor.delete", "Delete")}
            title={t("dataJournal.componentEditor.delete", "Delete")}
          />
        </div>
      </div>
    </div>
  );
}
