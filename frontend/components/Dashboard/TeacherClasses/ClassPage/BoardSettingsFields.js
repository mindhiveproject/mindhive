import useTranslation from "next-translate/useTranslation";

import CurriculumTypeSelector from "./CurriculumTypeSelector";
import StyledBoardSettings from "../../../styles/StyledBoardSettings";
import { DEFAULT_CURRICULUM_TYPE } from "../../../../lib/curriculumTypes";

function SettingsChoiceGroup({ options, disabled }) {
  return (
    <div className="settingsChoiceGroup">
      {options.map(({ key, active, checked, label, onChange }) => (
        <label key={key} className={active ? "active" : ""}>
          <input
            type="radio"
            checked={checked}
            disabled={disabled}
            onChange={onChange}
          />
          {label}
        </label>
      ))}
    </div>
  );
}

export default function BoardSettingsFields({
  curriculumType,
  assignableToStudents,
  studentsCanAssignToCards,
  copyVisible,
  disabled,
  onCurriculumTypeChange,
  onAssignableChange,
  onStudentsCanAssignChange,
  onCopyVisibilityChange,
}) {
  const { t } = useTranslation("classes");

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
          <SettingsChoiceGroup
            disabled={disabled}
            options={[
              {
                key: "allowCopy",
                active: copyVisible,
                checked: copyVisible,
                label: t("projects.showToStudents", {}, {
                  default: "Allow students to make copies of this template",
                }),
                onChange: () => onCopyVisibilityChange(true),
              },
              {
                key: "preventCopy",
                active: !copyVisible,
                checked: !copyVisible,
                label: t("projects.hideFromStudents", {}, {
                  default: "Prevent students from copying this template",
                }),
                onChange: () => onCopyVisibilityChange(false),
              },
            ]}
          />
        </div>
      </section>

      <section className="boardSettingsSection">
        <h3 className="boardSettingsSectionTitle">
          {t("boardSettings", {}, { default: "Board settings" })}
        </h3>
        <p className="boardSettingsSectionDescription">
          {t("projects.boardSettingsSectionDescription", {}, {
            default:
              "Configure curriculum and card assignment for projects created from this template.",
          })}
        </p>
        <div className="boardSettingsPanel">
          <div className="boardSettingsBlock">
            <CurriculumTypeSelector
              curriculumType={curriculumType || DEFAULT_CURRICULUM_TYPE}
              disabled={disabled}
              onChange={onCurriculumTypeChange}
            />
          </div>

          <div className="boardSettingsBlockRow">
            <div className="boardSettingsBlock">
              <p className="settingsQuestion">
                {t("proposalCardsAssignableQuestion", {}, {
                  default: "Should proposal cards be assignable to students?",
                })}
              </p>
              <SettingsChoiceGroup
                disabled={disabled}
                options={[
                  {
                    key: "assignable",
                    active: assignableToStudents,
                    checked: assignableToStudents,
                    label: t("cardAssignmentEnabled", {}, {
                      default: "Cards can be assigned to students",
                    }),
                    onChange: () => onAssignableChange(true),
                  },
                  {
                    key: "notAssignable",
                    active: !assignableToStudents,
                    checked: !assignableToStudents,
                    label: t("cardAssignmentDisabled", {}, {
                      default: "Cards cannot be assigned to students",
                    }),
                    onChange: () => onAssignableChange(false),
                  },
                ]}
              />
            </div>

            {assignableToStudents && (
              <div className="boardSettingsBlock">
                <p className="settingsQuestion">
                  {t("whoCanAssignCards", {}, {
                    default: "Who can assign profiles to cards?",
                  })}
                </p>
                <SettingsChoiceGroup
                  disabled={disabled}
                  options={[
                    {
                      key: "teachersOnly",
                      active: !studentsCanAssignToCards,
                      checked: !studentsCanAssignToCards,
                      label: t("onlyTeachersMentorsAssignCards", {}, {
                        default: "Only teachers and mentors can assign cards",
                      }),
                      onChange: () => onStudentsCanAssignChange(false),
                    },
                    {
                      key: "studentsToo",
                      active: studentsCanAssignToCards,
                      checked: studentsCanAssignToCards,
                      label: t("studentsCanAssignCards", {}, {
                        default: "Students can assign cards",
                      }),
                      onChange: () => onStudentsCanAssignChange(true),
                    },
                  ]}
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </StyledBoardSettings>
  );
}
