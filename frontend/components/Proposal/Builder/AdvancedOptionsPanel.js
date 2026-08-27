import { Checkbox } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import Chip from "../../DesignSystem/Chip";
import Button from "../../DesignSystem/Button";
import InfoPopover from "../../DesignSystem/InfoPopover";

const BODY_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  flex: 1,
  minHeight: 0,
  padding: "0 16px 16px",
  overflowY: "auto",
};

const TABS_STYLE = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

export default function AdvancedOptionsPanel({
  user,
  proposalBuildMode,
  isClassTemplate,
  cloneCount,
  section,
  onSectionChange,
  inputs,
  toggleBoolean,
  toggleSettingsBoolean,
  autoUpdateStudentBoards,
  onAutoUpdateChange,
  applyLoading,
  onSaveAndUpdateStudentBoards,
}) {
  const { t } = useTranslation("builder");
  const isAdmin = user?.permissions?.map((p) => p?.name).includes("ADMIN");

  return (
    <div className="advancedOptionsPanel" style={BODY_STYLE}>
      <div style={TABS_STYLE}>
        <Chip
          label={t("proposal.templateSectionAutoUpdate", {}, {
            default: "Auto-update",
          })}
          selected={section === "autoUpdate"}
          onClick={() => onSectionChange("autoUpdate")}
        />
        {proposalBuildMode && (
          <Chip
            label={t("proposal.templateSectionStudentSettings", {}, {
              default: "Student settings",
            })}
            selected={section === "studentSettings"}
            onClick={() => onSectionChange("studentSettings")}
          />
        )}
        {proposalBuildMode && isAdmin && (
          <Chip
            label={t("proposal.templateSectionAdminSettings", {}, {
              default: "Admin settings",
            })}
            selected={section === "adminSettings"}
            onClick={() => onSectionChange("adminSettings")}
          />
        )}
      </div>

      {section === "autoUpdate" && (
        <>
          {isClassTemplate && (
            <Chip
              leading={
                <img
                  src="/assets/icons/info.svg"
                  alt=""
                  style={{ transform: "rotate(180deg)" }}
                />
              }
              label={t("proposal.classTemplateLabel", {}, {
                default: "This board is a class template",
              })}
              style={{
                font: 'var(--MH-Type-Label-Small)',
                letterSpacing: 0,
                padding: "4px 12px",
              }}
            />
          )}
          <div className="templateBannerSection">
            <div className="templateBannerSectionHeading">
              {t("proposal.whatWillBeUpdated", {}, {
                default: "What will be updated",
              })}
            </div>
            <p className="templateBannerSectionBody">
              {t("proposal.whatWillBeUpdatedBody", {}, {
                default:
                  "Section names and order, card titles and positions, linked assignments/resources/tasks/studies, and card settings (e.g. report and review options).",
              })}
            </p>
          </div>
          <div className="templateBannerSection">
            <div className="templateBannerSectionHeading">
              {t("proposal.whatWillNotChange", {}, {
                default: "What will NOT change",
              })}
            </div>
            <p className="templateBannerSectionBody">
              {t("proposal.whatWillNotChangeBody", {}, {
                default:
                  "Students' own written answers, comments, submissions, and progress status on each card.",
              })}
            </p>
          </div>
          <div className="templateBannerToggleRow">
            <Checkbox
              toggle
              checked={!!autoUpdateStudentBoards}
              onChange={(_, { checked }) => onAutoUpdateChange?.(!!checked)}
              label={t("proposal.templateAutoUpdate", {}, {
                default: "Auto-update student boards",
              })}
            />
            <InfoPopover
              side="top"
              align="end"
              content={t("proposal.templateAutoUpdateHelp", {}, {
                default:
                  "When on, structural changes, template-controlled card settings (except progress status), and optionally content are pushed to student boards after each save. Students' own answers and their progress status on each card are preserved. When off, use the button below to update when ready.",
              })}
              ariaLabel={t("proposal.templateAutoUpdate", {}, {
                default: "Auto-update student boards",
              })}
            />
          </div>
          {!autoUpdateStudentBoards && (
            <div className="templateBannerActions">
              <Button
                variant="primary"
                className="templateBannerPrimaryBtn"
                onClick={onSaveAndUpdateStudentBoards}
                disabled={applyLoading}
              >
                {applyLoading
                  ? t("proposal.updatingStudentBoards", {}, {
                      default: "Updating student boards…",
                    })
                  : t("proposal.saveAndUpdateStudentBoards", {}, {
                      default: "Save & Update student boards",
                    })}
                {cloneCount > 0 ? ` (${cloneCount})` : ""}
              </Button>
            </div>
          )}
        </>
      )}

      {section === "studentSettings" && proposalBuildMode && (
        <div className="templateBannerStudentSettings">
          <h2 className="templateBannerStudentSettingsHeading">
            {t("proposal.templateSectionStudentSettings", {}, {
              default: "Student settings",
            })}
          </h2>
          <p className="templateBannerStudentSettingsHelp">
            {t("proposal.advancedOptionsHelp", {}, {
              default:
                "Checking the boxes below enables students to modify the board. Check in with the MindHive team if you're unsure what this means.",
            })}
          </p>
          <div className="templateBannerStudentSettingsItem">
            <Checkbox
              toggle
              id="allowMovingSections"
              name="allowMovingSections"
              checked={!!inputs?.settings?.allowMovingSections}
              onChange={(_, { name, checked }) =>
                toggleSettingsBoolean({ target: { name, checked } })
              }
              label={t("proposal.allowMovingSections", {}, {
                default: "Allow students to move sections",
              })}
            />
          </div>
          <div className="templateBannerStudentSettingsItem">
            <Checkbox
              toggle
              id="allowMovingCards"
              name="allowMovingCards"
              checked={!!inputs?.settings?.allowMovingCards}
              onChange={(_, { name, checked }) =>
                toggleSettingsBoolean({ target: { name, checked } })
              }
              label={t("proposal.allowMovingCards", {}, {
                default: "Allow students to move cards",
              })}
            />
          </div>
          <div className="templateBannerStudentSettingsItem">
            <Checkbox
              toggle
              id="allowAddingSections"
              name="allowAddingSections"
              checked={!!inputs?.settings?.allowAddingSections}
              onChange={(_, { name, checked }) =>
                toggleSettingsBoolean({ target: { name, checked } })
              }
              label={t("proposal.allowAddingSections", {}, {
                default: "Allow students to add/delete sections",
              })}
            />
          </div>
          <div className="templateBannerStudentSettingsItem">
            <Checkbox
              toggle
              id="allowAddingCards"
              name="allowAddingCards"
              checked={!!inputs?.settings?.allowAddingCards}
              onChange={(_, { name, checked }) =>
                toggleSettingsBoolean({ target: { name, checked } })
              }
              label={t("proposal.allowAddingCards", {}, {
                default: "Allow students to add/delete cards",
              })}
            />
          </div>
        </div>
      )}

      {section === "adminSettings" && isAdmin && (
        <div className="templateBannerAdminSettings">
          <h2 className="templateBannerAdminSettingsHeading">
            {t("proposal.templateSectionAdminSettings", {}, {
              default: "Admin settings",
            })}
          </h2>
          <div className="templateBannerAdminSettingsItem">
            <Checkbox
              toggle
              id="isTemplate"
              name="isTemplate"
              checked={!!inputs.isTemplate}
              onChange={(_, { name }) => toggleBoolean({ target: { name } })}
              label={t("proposal.makeTemplate", {}, {
                default: "Make this project board a public template",
              })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
