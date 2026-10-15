import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../../DesignSystem/Button";
import ToggleSwitch from "../../../../DesignSystem/ToggleSwitch";
import CurriculumTypeSelector from "../CurriculumTypeSelector";
import StyledBoardSettings from "../../../../styles/StyledBoardSettings";
import { DEFAULT_CURRICULUM_TYPE } from "../../../../../lib/curriculumTypes";

// In-place confirmation: native confirm() dialogs don't show in every browser
// this runs in, which left these actions silently doing nothing.
function InlineConfirm({ message, confirmLabel, cancelLabel, busy, onConfirm, onCancel }) {
  return (
    <div className="boardSettingsConfirm" role="alert">
      <p>{message}</p>
      <div className="boardSettingsConfirmActions">
        <Button type="button" variant="outline" tone="neutral" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant="filled"
          tone="warning"
          disabled={busy}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}

export default function BoardSettingsFields({
  curriculumType,
  classCurriculumTypes,
  assignableToStudents,
  studentsCanAssignToCards,
  copyVisible,
  // Turning copy off would leave the class with no copyable template.
  hidingCopyNeedsConfirm = false,
  disabled,
  onCurriculumTypeChange,
  onAssignableChange,
  onStudentsCanAssignChange,
  onCopyVisibilityChange,
  // Shows the "Delete board" section when set (only for people allowed to delete).
  onDelete,
  deleting = false,
}) {
  const { t } = useTranslation("classes");
  // A class with one curriculum has nothing to choose between.
  const showCurriculumChoice = (classCurriculumTypes?.length ?? 0) > 1;
  const [confirmingHideCopy, setConfirmingHideCopy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const cancelLabel = t("cancel", {}, { default: "Cancel" });

  const handleCopyToggle = (next) => {
    if (!next && hidingCopyNeedsConfirm) {
      setConfirmingHideCopy(true);
      return;
    }
    onCopyVisibilityChange(next);
  };

  return (
    <StyledBoardSettings>
      <section className="boardSettingsSection">
        <h3 className="boardSettingsSectionTitle">
          {t("projects.templateCopyPermission", {}, {
            default: "Student copy permission",
          })}
        </h3>
        <p className="boardSettingsSectionDescription">
          {t("projects.templateCopyPermissionDescription", {}, {
            default:
              "Control whether students can start new projects from this template.",
          })}
        </p>
        <div className="boardSettingsBlock">
          <ToggleSwitch
            checked={copyVisible}
            loading={disabled}
            onChange={handleCopyToggle}
            label={
              copyVisible
                ? t("projects.showToStudents", {}, {
                    default: "Allow students to make copies of this template",
                  })
                : t("projects.hideFromStudents", {}, {
                    default: "Prevent students from copying this template",
                  })
            }
          />
          {confirmingHideCopy ? (
            <InlineConfirm
              message={t("projects.confirmHideLastTemplate", {}, {
                default:
                  "This is the only template students can copy. Prevent copy anyway? Students will not be able to start new projects until you allow copy for at least one template.",
              })}
              confirmLabel={t("projects.hideFromStudents", {}, {
                default: "Prevent students from copying this template",
              })}
              cancelLabel={cancelLabel}
              busy={disabled}
              onCancel={() => setConfirmingHideCopy(false)}
              onConfirm={() => {
                setConfirmingHideCopy(false);
                onCopyVisibilityChange(false);
              }}
            />
          ) : null}
        </div>
      </section>

      <section className="boardSettingsSection">
        <h3 className="boardSettingsSectionTitle">
          {t("boardSettings", {}, { default: "Board settings" })}
        </h3>
        <p className="boardSettingsSectionDescription">
          {showCurriculumChoice
            ? t("projects.boardSettingsSectionDescription", {}, {
                default:
                  "Configure curriculum and card assignment for projects created from this template.",
              })
            : t("projects.boardSettingsSectionDescriptionNoCurriculum", {}, {
                default:
                  "Configure card assignment for projects created from this template.",
              })}
        </p>
        <div className="boardSettingsPanel">
          {showCurriculumChoice ? (
            <div className="boardSettingsBlock">
              <CurriculumTypeSelector
                curriculumType={curriculumType || DEFAULT_CURRICULUM_TYPE}
                allowedValues={classCurriculumTypes}
                disabled={disabled}
                onChange={onCurriculumTypeChange}
                questionKey="projects.boardCurriculumTypeQuestion"
                questionDefault="Which curriculum type applies to this template board?"
              />
            </div>
          ) : null}

          <div className="boardSettingsBlock">
            <p className="settingsQuestion">
              {t("proposalCardsAssignableQuestion", {}, {
                default: "Should cards be assignable to students?",
              })}
            </p>
            <ToggleSwitch
              checked={assignableToStudents}
              loading={disabled}
              onChange={onAssignableChange}
              label={
                assignableToStudents
                  ? t("cardAssignmentEnabled", {}, {
                      default: "Cards can be assigned to students",
                    })
                  : t("cardAssignmentDisabled", {}, {
                      default: "Cards cannot be assigned to students",
                    })
              }
            />
          </div>

          {assignableToStudents && (
            <div className="boardSettingsBlock">
              <p className="settingsQuestion">
                {t("whoCanAssignCards", {}, {
                  default: "Who can assign profiles to cards?",
                })}
              </p>
              <ToggleSwitch
                checked={studentsCanAssignToCards}
                loading={disabled}
                onChange={onStudentsCanAssignChange}
                label={
                  studentsCanAssignToCards
                    ? t("studentsCanAssignCards", {}, {
                        default: "Students can assign cards",
                      })
                    : t("onlyTeachersMentorsAssignCards", {}, {
                        default: "Only teachers and mentors can assign cards",
                      })
                }
              />
            </div>
          )}
        </div>
      </section>

      {onDelete ? (
        <section className="boardSettingsSection">
          <h3 className="boardSettingsSectionTitle">
            {t("projects.deleteBoard", {}, { default: "Delete board" })}
          </h3>
          <p className="boardSettingsSectionDescription">
            {t("projects.deleteBoardDescription", {}, {
              default:
                "Delete this board with all of its sections and cards. This can't be undone.",
            })}
          </p>
          {confirmingDelete ? (
            <InlineConfirm
              message={t("projects.deleteBoardConfirm", {}, {
                default:
                  "Delete this board? Its sections and cards will be deleted too.",
              })}
              confirmLabel={t("projects.deleteBoard", {}, {
                default: "Delete board",
              })}
              cancelLabel={cancelLabel}
              busy={deleting}
              onCancel={() => setConfirmingDelete(false)}
              onConfirm={onDelete}
            />
          ) : (
            <div>
              <Button
                type="button"
                variant="outline"
                tone="warning"
                onClick={() => setConfirmingDelete(true)}
              >
                {t("projects.deleteBoard", {}, { default: "Delete board" })}
              </Button>
            </div>
          )}
        </section>
      ) : null}
    </StyledBoardSettings>
  );
}
