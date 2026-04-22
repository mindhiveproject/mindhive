import { useState } from "react";
import useTranslation from "next-translate/useTranslation";
import CompactActionButton from "../../../../DesignSystem/CompactActionButton";
import InfoTooltip from "../../../../DesignSystem/InfoTooltip";
import DeleteConfirmModal from "../Helpers/DeleteConfirmModal";
import getVizComponentIconSrc from "../Helpers/getVizComponentIconSrc";

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
  const headerIconSrc = getVizComponentIconSrc(activeComponent);
  const componentTypeLabel = getComponentTypeLabel(activeComponent, t);

  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(activeComponent?.title || "");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

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
    setDeleteConfirmOpen(true);
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
      <DeleteConfirmModal
        open={deleteConfirmOpen}
        title={t("dataJournal.componentEditor.delete", {}, { default: "Delete" })}
        message={t("dataJournal.componentEditor.deleteConfirm", {}, {
          default: "Are you sure you want to delete this component?",
        })}
        confirmLabel={t("dataJournal.componentEditor.delete", {}, { default: "Delete" })}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          onDelete();
          setDeleteConfirmOpen(false);
        }}
      />
    </div>
  );
}
