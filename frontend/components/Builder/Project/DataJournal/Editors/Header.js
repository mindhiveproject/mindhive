import { useState } from "react";
import useTranslation from "next-translate/useTranslation";
import Button from "../../../../DesignSystem/Button";

export default function EditorHeader({
  user,
  studyId,
  onClose,
  onChange,
  onSave,
  onDelete,
  activeComponent,
}) {
  const { t } = useTranslation("builder");

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

  return (
    <div className="editor-header">
      {isEditing ? (
        <div className="editor-component-name-input">
          <input
            type="text"
            value={newTitle}
            onChange={handleTitleChange}
            onKeyPress={handleKeyPress}
            onBlur={handleTitleSubmit}
            autoFocus
          />
        </div>
      ) : (
        <div className="editor-component-name">
          <div>{activeComponent?.title || "Component Name"}</div>
          <div onClick={handleEditClick} style={{ cursor: "pointer" }}>
            <img src="/assets/dataviz/edit.svg" alt="Correlation study" />
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
          <Button variant="outline" onClick={onClose}>
            {t("dataJournal.componentEditor.close", "Close")}
          </Button>
          <Button variant="filled" onClick={onSave}>
            {t("dataJournal.componentEditor.save", "Save")}
          </Button>
          <Button
            variant="tonal"
            style={{ backgroundColor: "#8F1F14", color: "#FFFFFF" }}
            onClick={onDelete}
          >
            {t("dataJournal.componentEditor.delete", "Delete")}
          </Button>
        </div>
      </div>
    </div>
  );
}
