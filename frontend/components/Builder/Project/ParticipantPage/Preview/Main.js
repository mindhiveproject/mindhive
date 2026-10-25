import Tabs from "./Tabs";
import useTranslation from "next-translate/useTranslation";
import { getStudyImageUrl } from "../../../../../lib/profileStudyImageUrls";
import Button from "../../../../DesignSystem/Button";

import { StyledStudyPage } from "../../../../styles/StyledStudyPage";

// The canvas renders the study landing page (Studies/Landing/StudyPage) on
// the page surface, with its texts editable in place.
export default function Preview({
  user,
  study,
  handleChange,
  handleMultipleUpdate,
  captureFile,
  isLocked,
}) {
  const { t } = useTranslation("builder");
  const infoBlocks =
    study?.info?.reduce((acc, el) => {
      acc[el.name] = el.text || "";
      return acc;
    }, {}) || {};

  const handleParameterChange = (e, classType) => {
    const { name, type, value, className } = e.target;
    const val = type === "number" ? parseFloat(value) : value;
    // Editable fields carry extra classes for styling; the first one is the
    // info key to write (`header` or `text`).
    const key = (className || "").split(" ")[0];
    const currentInfo = study?.info ? [...study?.info] : [];
    if (currentInfo.filter((el) => el.name === name).length === 0) {
      currentInfo.push({ name });
    }
    const info = currentInfo.map((el) =>
      el.name === name ? { ...el, [key]: val } : el
    );
    handleMultipleUpdate({
      info,
      unsavedChanges: true,
    });
  };

  const deleteParameter = (name) => {
    const info = study.info.filter((p) => p.name !== name);
    handleMultipleUpdate({
      info,
      unsavedChanges: true,
    });
  };

  const studyImageUrl = getStudyImageUrl(study);

  return (
    <div className={isLocked ? "preview preview--locked" : "preview"}>
      {isLocked && (
        <div className="lockedBanner" role="status">
          <h3>
            {t(
              "participantPageMain.locked",
              {},
              {
                default: "Participant Page Locked",
              }
            )}
          </h3>
          <p>
            {t(
              "builder.lockedMessage",
              {},
              {
                default:
                  "This study has been submitted and cannot be edited. To make changes, please ask your teacher to un-submit the study.",
              }
            )}
          </p>
        </div>
      )}
      <div className="previewSurface">
        <StyledStudyPage className="participantPagePreview">
          {/* Single wrapper, like StudyPage, so the content takes the same column */}
          <div>
            {/* Disabling the fieldset makes every field below read-only at once */}
            <fieldset className="previewFields" disabled={isLocked}>
              {(studyImageUrl || !isLocked) && (
                <div className="studyImage uploadImageContainer">
                  <label
                    className={
                      studyImageUrl
                        ? "imageSlot imageSlot--filled"
                        : "imageSlot"
                    }
                  >
                    {studyImageUrl && (
                      <img
                        src={studyImageUrl}
                        alt={t("preview.uploadPreview")}
                      />
                    )}
                    <span className="imageSlotAction">
                      <Button
                        variant={studyImageUrl ? "tonal" : "outline"}
                        type="button"
                        tabIndex={-1}
                      >
                        {studyImageUrl
                          ? t("preview.updateStudyImage")
                          : t("preview.uploadStudyImage")}
                      </Button>
                    </span>
                    <input
                      type="file"
                      id="file"
                      name="file"
                      accept="image/*"
                      onChange={(e) => captureFile(e)}
                    />
                  </label>
                </div>
              )}

              <div className="studyTitleDescriptionBtns">
                <div id="studyTitle">
                  <textarea
                    id="title"
                    name="title"
                    aria-label={t("preview.title")}
                    placeholder={t("preview.title")}
                    value={study.title || ""}
                    onChange={handleChange}
                    required
                    rows={1}
                    className="editable title"
                  />
                </div>

                <div className="studyDescription">
                  <textarea
                    id="description"
                    name="description"
                    aria-label={t("preview.description")}
                    placeholder={t("preview.description")}
                    value={study.description || ""}
                    onChange={handleChange}
                    rows={2}
                    className="editable description"
                  />
                </div>

                <div className="studyInfoTimePartners">
                  <div className="timeFrequency timeInformationBlock">
                    <label htmlFor="time">
                      <div className="studyInformationHeader">
                        {t("preview.timeToComplete")}
                      </div>
                      <input
                        type="text"
                        id="time"
                        name="time"
                        placeholder={t(
                          "preview.timePlaceholder",
                          {},
                          {
                            default: "e.g. 15 minutes",
                          }
                        )}
                        value={infoBlocks.time || ""}
                        onChange={handleParameterChange}
                        className="text editable"
                      />
                    </label>
                  </div>
                </div>

                <div className="studyWhatWhoHow">
                  <Tabs
                    user={user}
                    study={study}
                    infoBlocks={infoBlocks}
                    handleParameterChange={handleParameterChange}
                    deleteParameter={deleteParameter}
                  />
                </div>
              </div>
            </fieldset>

            <div className="studyContent">
              <div className="controlBtns">
                <Button variant="filled" type="button" tabIndex={-1}>
                  {t("participate", {}, { default: "Participate" })}
                </Button>
              </div>
            </div>
          </div>
        </StyledStudyPage>
      </div>
    </div>
  );
}
