"use client";

import { StyledForm } from "../../styles/StyledForm";
import DisplayError from "../../ErrorMessage";
import useTranslation from "next-translate/useTranslation";
import TipTapEditor from "../../TipTap/Main";
import Button from "../../DesignSystem/Button";
import { stripHtml } from "../../Proposal/Card/Forms/utils";

function descriptionValueForState(html) {
  if (html == null) return "";
  const s = String(html).trim();
  if (!s) return "";
  if (/<img[\s>]/i.test(s)) return s;
  return stripHtml(s).trim() === "" ? "" : s;
}

export default function ClassForm({
  user,
  inputs,
  handleChange,
  handleSubmit,
  submitBtnName,
  loading,
  error,
}) {
  const { t } = useTranslation("classes");

  const handleTitleChange = (content) => {
    handleChange({ target: { name: "title", value: content } });
  };

  const handleDescriptionChange = (content) => {
    handleChange({
      target: {
        name: "description",
        value: descriptionValueForState(content),
      },
    });
  };

  return (
    <div>
      <StyledForm method="POST" onSubmit={handleSubmit}>
        <DisplayError error={error} />

        <fieldset disabled={loading} aria-busy={loading}>
          <div className="infoPane">
            <label>
              {t("classForm.title", "Title")}
              <div className="classFormTitleEditor">
                <TipTapEditor
                  content={inputs?.title ?? ""}
                  onUpdate={handleTitleChange}
                  isEditable={!loading}
                  toolbarVisible={false}
                />
              </div>
            </label>

            <label>
              {t("classForm.description", "Description")}
              <div className="classFormDescriptionEditor">
                <TipTapEditor
                  content={inputs?.description ?? ""}
                  onUpdate={handleDescriptionChange}
                  isEditable={!loading}
                  mediaLibraryId={user?.id ?? null}
                  mediaLibrarySource={
                    user?.id
                      ? {
                          sourceType: "profile",
                          sourceId: user.id,
                          createdWith: "upload",
                        }
                      : null
                  }
                />
              </div>
            </label>

            <div className="submitButton">
              <Button type="submit">{submitBtnName}</Button>
            </div>
          </div>
        </fieldset>
      </StyledForm>
    </div>
  );
}
