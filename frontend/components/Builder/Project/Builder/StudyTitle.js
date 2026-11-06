import { useEffect, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { UPDATE_STUDY } from "../../../Mutations/Study";
import { MY_STUDY } from "../../../Queries/Study";
import { GET_PROJECT_STUDY } from "../../../Queries/Proposal";
import { PencilIcon } from "../../../DesignSystem/Icons";

// Study title in the canvas top bar. Click to edit; the new title is saved
// when the field loses focus (Enter also commits, Escape cancels).
// Saved on its own: the builder's autosave never sends the title.
export default function StudyTitle({ study, projectId, disabled, onSaved }) {
  const { t } = useTranslation("builder");
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(study?.title || "");
  const inputRef = useRef(null);
  const cancelledRef = useRef(false);

  const [updateStudy, { loading }] = useMutation(UPDATE_STUDY, {
    refetchQueries: [
      { query: MY_STUDY, variables: { id: study?.id } },
      projectId && { query: GET_PROJECT_STUDY, variables: { id: projectId } },
    ].filter(Boolean),
  });

  useEffect(() => {
    if (!editing) setValue(study?.title || "");
  }, [study?.title, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = async () => {
    setEditing(false);
    if (cancelledRef.current) {
      cancelledRef.current = false;
      setValue(study?.title || "");
      return;
    }
    const next = value.trim();
    if (!next || next === study?.title) {
      setValue(study?.title || "");
      return;
    }
    try {
      await updateStudy({
        variables: { id: study.id, input: { title: next } },
      });
      onSaved?.(next);
    } catch (err) {
      setValue(study?.title || "");
      alert(err?.message);
    }
  };

  const label = t("builder.studyTitle", {}, { default: "Study title" });

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="boardTopBarTitle boardTopBarTitleInput MH-Type-Title-Small"
        value={value}
        aria-label={label}
        maxLength={200}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            cancelledRef.current = true;
            e.currentTarget.blur();
          }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      className="boardTopBarTitle boardTopBarTitleButton MH-Type-Title-Small"
      title={disabled ? value : t("builder.renameStudy", {}, { default: "Click to rename the study" })}
      aria-label={`${label}: ${value}`}
      disabled={disabled || loading || !study?.id}
      onClick={() => setEditing(true)}
    >
      <span className="boardTopBarTitleText">{value}</span>
      {!disabled && (
        <PencilIcon className="boardTopBarTitleEditIcon" aria-hidden="true" />
      )}
    </button>
  );
}
