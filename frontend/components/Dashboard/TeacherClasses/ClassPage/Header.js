"use client";

import { useMutation } from "@apollo/client";
import { useEffect, useRef, useCallback, useState } from "react";
import DisplayError from "../../../ErrorMessage";
import useTranslation from "next-translate/useTranslation";

import useForm from "../../../../lib/useForm";

import Chip from "../../../DesignSystem/Chip";
import InfoTooltip from "../../../DesignSystem/InfoTooltip";
import { EDIT_CLASS } from "../../../Mutations/Classes";
import { GET_CLASS } from "../../../Queries/Classes";

/** Remove HTML tags only (preserve spaces — used for controlled title input). */
function stripTags(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "");
}

/** Tags removed + trim (used for H1 display / empty check). */
function stripHtml(html) {
  return stripTags(html).trim();
}


const HEADER_TONAL_SURFACE_STYLE = {
  background: "#FFFFFF",
  backgroundColor: "#FFFFFF",
  border: "1px solid #E6E6E6",
};

const HEADER_META_CHIP_STYLE = {
  ...HEADER_TONAL_SURFACE_STYLE,
  width: "fit-content",
  maxWidth: "100%",
};

export default function Header({ myclass, readOnly = false }) {
  const { t } = useTranslation("classes");

  const { inputs, handleChange } = useForm({
    ...myclass,
  });

  const [isTitleEditing, setIsTitleEditing] = useState(false);

  const titleRef = useRef("");

  useEffect(() => {
    titleRef.current = inputs?.title ?? "";
  }, [inputs?.title]);

  useEffect(() => {
    setIsTitleEditing(false);
  }, [myclass?.id, myclass?.code]);

  const refetchClass =
    myclass?.code != null
      ? [{ query: GET_CLASS, variables: { code: myclass.code } }]
      : [];

  const [updateClass, { loading, error }] = useMutation(EDIT_CLASS, {
    refetchQueries: refetchClass,
  });

  const canEditTitle = !readOnly && !loading && Boolean(myclass?.id);

  const persistIfDirty = useCallback(() => {
    if (!myclass?.id) return;
    const title = titleRef.current;
    const serverTitle = myclass.title ?? "";
    if (title === serverTitle) return;
    updateClass({
      variables: {
        id: myclass.id,
        title,
      },
    });
  }, [myclass?.id, myclass?.title, updateClass]);

  const finishTitleEdit = useCallback(() => {
    persistIfDirty();
    setIsTitleEditing(false);
  }, [persistIfDirty]);

  const descriptionIsEmpty =
    stripHtml(myclass?.description ?? "") === "";

  const titleInputValue = stripTags(inputs?.title ?? "");
  const titleDisplayTrimmed = stripHtml(inputs?.title ?? "");
  const titleDisplay =
    titleDisplayTrimmed ||
    t("header.titleFallback", {}, { default: "Untitled class" });
  const creatorImageUrl = myclass?.creator?.image?.url;
  const teacherId = myclass?.creator?.id;
  const teacherUsername = myclass?.creator?.username ?? "";
  const seenUsernames = new Set(
    teacherUsername ? [teacherUsername.toLowerCase()] : [],
  );
  const mentors = (myclass?.mentors || []).filter((mentor) => {
    if (!mentor?.username) return false;
    if (teacherId && mentor.id === teacherId) return false;
    const key = mentor.username.toLowerCase();
    if (seenUsernames.has(key)) return false;
    seenUsernames.add(key);
    return true;
  });
  const mentorTooltip = t("header.mentorsPanelTooltip", {}, {
    default: "Mentor accounts associated with this class.",
  });

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
              aria-label={t("classForm.title", {}, { default: "Title" })}
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

        <div className="classHeaderMetaRow">
          <InfoTooltip
            content={t("header.teacherAccountTooltip", {}, { default: "Class teacher." })}
            delayMs={300}
          >
            <Chip
              label={teacherUsername}
              leading={
                creatorImageUrl ? (
                  <img
                    src={creatorImageUrl}
                    alt={teacherUsername}
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : null
              }
              style={HEADER_META_CHIP_STYLE}
              labelLines={2}
            />
          </InfoTooltip>
          {mentors.length > 0 && (
            <>
              <span className="classHeaderMetaBullet" aria-hidden>
                •
              </span>
              {mentors.map((mentor) => (
                <InfoTooltip
                  key={mentor?.id || mentor?.username}
                  content={mentorTooltip}
                  delayMs={500}
                >
                  <Chip
                    label={mentor?.username ?? ""}
                    leading={
                      mentor?.image?.url ? (
                        <img
                          src={mentor.image.url}
                          alt={mentor?.username ?? ""}
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : null
                    }
                    style={HEADER_META_CHIP_STYLE}
                    labelLines={2}
                    ariaLabel={t(
                      "header.mentorAccount",
                      { username: mentor?.username ?? "" },
                      { default: "Mentor account: {{username}}" }
                    )}
                  />
                </InfoTooltip>
              ))}
            </>
          )}
        </div>

        {!descriptionIsEmpty ? (
          <div
            className="classHeaderDescriptionHtml"
            dangerouslySetInnerHTML={{ __html: myclass.description }}
          />
        ) : null}
      </div>
    </div>
  );
}
