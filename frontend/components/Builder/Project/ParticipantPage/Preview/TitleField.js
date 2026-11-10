import { useEffect, useRef, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../../DesignSystem/Button";
import MessageCard from "../../../../DesignSystem/MessageCard";
import { PencilIcon } from "../../../../DesignSystem/Icons";

// The study title on the participant page canvas. A study that already exists
// is auto-saved, so its title is shown as text and renamed on purpose: Rename
// opens a draft with a note on what renaming changes, and the title is only
// written on Save. A study that does not exist yet keeps a plain field, since
// it is saved with the page's Save button.
export default function TitleField({ title, handleChange, isGuarded }) {
  const { t } = useTranslation("builder");
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(title || "");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  if (!isGuarded) {
    return (
      <textarea
        id="title"
        name="title"
        aria-label={t("preview.title")}
        placeholder={t("preview.title")}
        value={title || ""}
        onChange={handleChange}
        required
        rows={1}
        className="editable title"
      />
    );
  }

  const nextTitle = draft.trim();
  const canSave = !!nextTitle && nextTitle !== (title || "").trim();

  const startEditing = () => {
    setDraft(title || "");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setDraft(title || "");
  };

  const saveTitle = () => {
    if (!canSave) return;
    handleChange({ target: { name: "title", value: nextTitle } });
    setIsEditing(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveTitle();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditing();
    }
  };

  if (!isEditing) {
    return (
      <div className="titleDisplay">
        <h1 className="title">{title}</h1>
        <Button
          variant="outline"
          type="button"
          className="titleRenameButton"
          leadingIcon={<PencilIcon />}
          onClick={startEditing}
        >
          {t("preview.rename", {}, { default: "Rename" })}
        </Button>
      </div>
    );
  }

  return (
    <div className="titleRename">
      <textarea
        ref={inputRef}
        id="title"
        name="title"
        aria-label={t("preview.title")}
        placeholder={t("preview.title")}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        className="editable title"
      />
      <MessageCard
        variant="information"
        message={t("preview.renameNotice", {}, {
          default:
            "Renaming changes the title participants and collaborators see. It is saved as soon as you click Save title.",
        })}
      />
      <div className="titleRenameActions">
        <Button variant="text" type="button" onClick={cancelEditing}>
          {t("preview.renameCancel", {}, { default: "Cancel" })}
        </Button>
        <Button
          variant="filled"
          type="button"
          onClick={saveTitle}
          disabled={!canSave}
        >
          {t("preview.renameSave", {}, { default: "Save title" })}
        </Button>
      </div>
    </div>
  );
}
