"use client";

import { useMutation } from "@apollo/client";
import { useEffect, useRef, useCallback, useState } from "react";
import DisplayError from "../../../ErrorMessage";
import useTranslation from "next-translate/useTranslation";

import useForm from "../../../../lib/useForm";

import Button from "../../../DesignSystem/Button";
import { EDIT_CLASS } from "../../../Mutations/Classes";
import { GET_CLASS } from "../../../Queries/Classes";
import TipTapEditor from "../../../TipTap/Main";

/** Remove HTML tags only (preserve spaces — used for controlled title input). */
function stripTags(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "");
}

/** Tags removed + trim (used for H1 display / empty check). */
function stripHtml(html) {
  return stripTags(html).trim();
}

export default function Header({ user, myclass }) {
  const { t } = useTranslation("classes");

  const { inputs, handleChange } = useForm({
    ...myclass,
  });

  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [isAddingDescription, setIsAddingDescription] = useState(false);

  const titleRef = useRef("");
  const descriptionRef = useRef("");
  const descriptionEditorContainerRef = useRef(null);

  useEffect(() => {
    titleRef.current = inputs?.title ?? "";
    descriptionRef.current = inputs?.description ?? "";
  }, [inputs?.title, inputs?.description]);

  useEffect(() => {
    setIsTitleEditing(false);
    setIsAddingDescription(false);
  }, [myclass?.id, myclass?.code]);

  /** Focus TipTap ProseMirror after opening from the empty-state button (editor may mount async). */
  useEffect(() => {
    if (!isAddingDescription) return;
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 40;
    const tryFocus = () => {
      if (cancelled) return;
      const pm = descriptionEditorContainerRef.current?.querySelector(
        ".ProseMirror[contenteditable='true']",
      );
      if (pm) {
        pm.focus();
        return;
      }
      attempts += 1;
      if (attempts < maxAttempts) {
        requestAnimationFrame(tryFocus);
      }
    };
    requestAnimationFrame(tryFocus);
    return () => {
      cancelled = true;
    };
  }, [isAddingDescription]);

  const refetchClass =
    myclass?.code != null
      ? [{ query: GET_CLASS, variables: { code: myclass.code } }]
      : [];

  const [updateClass, { loading, error }] = useMutation(EDIT_CLASS, {
    refetchQueries: refetchClass,
  });

  const canEditTitle = !loading && Boolean(myclass?.id);

  const persistIfDirty = useCallback(() => {
    if (!myclass?.id) return;
    const title = titleRef.current;
    const description = descriptionRef.current;
    const serverTitle = myclass.title ?? "";
    const serverDescription = myclass.description ?? "";
    if (title === serverTitle && description === serverDescription) return;
    updateClass({
      variables: {
        id: myclass.id,
        title,
        description,
      },
    });
  }, [myclass?.id, myclass?.title, myclass?.description, updateClass]);

  const finishTitleEdit = useCallback(() => {
    persistIfDirty();
    setIsTitleEditing(false);
  }, [persistIfDirty]);

  const handleDescriptionUpdate = (content) => {
    const value = content ?? "";
    descriptionRef.current = value;
    handleChange({
      target: { name: "description", value },
    });
  };

  const handleDescriptionBlur = useCallback(() => {
    persistIfDirty();
    const html = descriptionRef.current ?? "";
    if (!stripHtml(html)) {
      setIsAddingDescription(false);
    }
  }, [persistIfDirty]);

  const descriptionIsEmpty =
    stripHtml(inputs?.description ?? "") === "";
  const showDescriptionEditor =
    !descriptionIsEmpty || isAddingDescription;

  const titleInputValue = stripTags(inputs?.title ?? "");
  const titleDisplayTrimmed = stripHtml(inputs?.title ?? "");
  const titleDisplay =
    titleDisplayTrimmed ||
    t("header.titleFallback", "Untitled class");

  return (
    <div className="editableClassHeader">
      <DisplayError error={error} />
      <div className="infoPane" aria-busy={loading}>
        <div className="classHeaderTitleBlock">
          {isTitleEditing ? (
            <input
              type="text"
              name="title"
              className="title classHeaderTitleInput"
              value={titleInputValue}
              onChange={(e) => {
                const value = e.target.value;
                titleRef.current = value;
                handleChange({
                  target: { name: "title", value },
                });
              }}
              onBlur={finishTitleEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  finishTitleEdit();
                } else if (e.key === "Escape") {
                  const reverted = myclass?.title ?? "";
                  titleRef.current = reverted;
                  handleChange({
                    target: { name: "title", value: reverted },
                  });
                  setIsTitleEditing(false);
                } else if (e.key === " " || e.code === "Space") {
                  // So ancestors (e.g. page shortcuts) cannot preventDefault and block the character
                  e.stopPropagation();
                }
              }}
              autoFocus
              aria-label={t("classForm.title", "Title")}
            />
          ) : (
            <h1
              className={
                canEditTitle
                  ? "title classHeaderTitleDisplay classHeaderTitleDisplayEditable"
                  : "title classHeaderTitleDisplay"
              }
              onClick={
                canEditTitle ? () => setIsTitleEditing(true) : undefined
              }
              onKeyDown={
                canEditTitle
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setIsTitleEditing(true);
                      }
                    }
                  : undefined
              }
              tabIndex={canEditTitle ? 0 : undefined}
            >
              {titleDisplay}
            </h1>
          )}
        </div>

        <label>
          <div
            ref={descriptionEditorContainerRef}
            className="classHeaderDescriptionEditor classFormDescriptionEditor"
          >
            {showDescriptionEditor ? (
              <TipTapEditor
                content={inputs?.description ?? ""}
                onUpdate={handleDescriptionUpdate}
                onBlur={handleDescriptionBlur}
                isEditable={!loading && Boolean(myclass?.id)}
                toolbarVisible={false}
                limitedToolbar={true}
                // mediaLibraryId={user?.id ?? null}
                // mediaLibrarySource={mediaLibrarySource}
              />
            ) : (
              <Button
                type="button"
                variant="text"
                disabled={!canEditTitle}
                onClick={() => setIsAddingDescription(true)}
              >
                {t("header.addDescription", "Add a description to your class")}
              </Button>
            )}
          </div>
        </label>
      </div>
      <div className="teacher">
        <p>{t("header.teacher")}:</p>{myclass?.creator?.username}
      </div>
    </div>
  );
}
