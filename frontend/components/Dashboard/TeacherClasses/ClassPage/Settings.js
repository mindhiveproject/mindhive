import { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import moment from "moment";
import useTranslation from "next-translate/useTranslation";

import { DELETE_CLASS, EDIT_CLASS } from "../../../Mutations/Classes";
import { GET_CLASSES, GET_CLASS } from "../../../Queries/Classes";

import { Modal, Button } from "semantic-ui-react";

import StyledModal from "../../../styles/StyledModal";

import { useRouter } from "next/router";

import Chip from "../../../DesignSystem/Chip";
import CurriculumTypeSelector from "./CurriculumTypeSelector";
import {
  DEFAULT_CURRICULUM_TYPE,
  normalizeCurriculumType,
} from "../../../../lib/curriculumTypes";

export default function Settings({ myclass, user }) {
  const { t } = useTranslation("classes");
  const [inputValue, setInputValue] = useState({});
  const [open, setOpen] = useState(false);
  const [assignableToStudents, setAssignableToStudents] = useState(
    myclass?.settings?.assignableToStudents ?? false
  );
  const [studentsCanAssignToCards, setStudentsCanAssignToCards] = useState(
    myclass?.settings?.studentsCanAssignToCards ?? false
  );
  const [curriculumType, setCurriculumType] = useState(
    normalizeCurriculumType(myclass?.settings?.curriculumType)
  );

  // Sync from server when myclass (e.g. after refetch) changes
  useEffect(() => {
    const value = myclass?.settings?.assignableToStudents;
    setAssignableToStudents(
      value === undefined || value === null ? false : !!value
    );
  }, [myclass?.settings?.assignableToStudents]);

  useEffect(() => {
    const value = myclass?.settings?.studentsCanAssignToCards;
    setStudentsCanAssignToCards(
      value === undefined || value === null ? false : !!value
    );
  }, [myclass?.settings?.studentsCanAssignToCards]);

  useEffect(() => {
    setCurriculumType(
      normalizeCurriculumType(myclass?.settings?.curriculumType)
    );
  }, [myclass?.settings?.curriculumType]);

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const router = useRouter();

  const [updateClassSettings, { loading: updatingSettings }] = useMutation(
    EDIT_CLASS,
    {
      variables: { id: myclass?.id },
      refetchQueries: [{ query: GET_CLASS, variables: { code: myclass?.code } }],
    }
  );

  const updateAssignableToStudents = (value) => {
    setAssignableToStudents(value);
    const existingSettings =
      myclass?.settings && typeof myclass.settings === "object"
        ? myclass.settings
        : {};
    const newSettings = { ...existingSettings, assignableToStudents: value };
    // When enabling, default to students cannot assign (only teachers/mentors can)
    if (value) {
      newSettings.studentsCanAssignToCards = false;
      setStudentsCanAssignToCards(false);
    }
    updateClassSettings({
      variables: {
        settings: newSettings,
      },
    }).catch((err) =>
      alert(
        err?.message ||
          t("failedToUpdateSettings", {}, {
            default: "Failed to update settings",
          })
      )
    );
  };

  const updateStudentsCanAssignToCards = (value) => {
    setStudentsCanAssignToCards(value);
    const existingSettings =
      myclass?.settings && typeof myclass.settings === "object"
        ? myclass.settings
        : {};
    updateClassSettings({
      variables: {
        settings: { ...existingSettings, studentsCanAssignToCards: value },
      },
    }).catch((err) =>
      alert(
        err?.message ||
          t("failedToUpdateSettings", {}, {
            default: "Failed to update settings",
          })
      )
    );
  };

  const updateCurriculumType = (value) => {
    const normalized = normalizeCurriculumType(value);
    setCurriculumType(normalized);
    const existingSettings =
      myclass?.settings && typeof myclass.settings === "object"
        ? myclass.settings
        : {};
    updateClassSettings({
      variables: {
        settings: { ...existingSettings, curriculumType: normalized },
      },
    }).catch((err) =>
      alert(
        err?.message ||
          t("curriculumTypeUpdateError", {}, {
            default: "Failed to update curriculum type",
          })
      )
    );
  };

  const [deleteClass, { loading }] = useMutation(DELETE_CLASS, {
    variables: { id: myclass?.id },
    refetchQueries: [
      {
        query: GET_CLASSES,
        variables: {
          input: {
            OR: [
              {
                creator: {
                  id: { equals: user?.id },
                },
              },
              {
                mentors: {
                  some: { id: { equals: user?.id } },
                },
              },
            ],
          },
        },
      },
    ],
  });
  
  return (
    <div className="settings">
      {myclass?.networks.length > 0 && (
        <section className="settingsSection">
          <div className="settingsSectionHeader">
            <h3>{t("classNetworks")}</h3>
          </div>
          {myclass?.networks.map((network) => (
            <div className="networkCard" key={network?.id || network?.title}>
              <Chip
                className="classNetworkChip"
                label={network?.title}
                shape="square"
              />
              <p>{network?.description}</p>
              <p>
                {t("createdByOn", {
                  username: network?.creator?.username,
                  date: moment(network?.createdAt).format("MMMM D, YYYY"),
                })}
              </p>
              <p>{t("classes")}</p>
              <ul>
                {network?.classes.map((cl) => (
                  <li key={cl?.id || cl?.title}>{cl?.title}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      <section className="settingsSection">
        <div className="settingsSectionHeader">
          <h3>{t("boardSettings", {}, { default: "Board settings" })}</h3>
          <p>
            {t("boardSettingsDescription", {}, {
              default:
                "These settings will be applied to all project boards in this class.",
            })}
          </p>
        </div>
        <div className="informationBlock">
          <div className="block curriculumTypeBlock">
            <CurriculumTypeSelector
              curriculumType={curriculumType || DEFAULT_CURRICULUM_TYPE}
              disabled={updatingSettings}
              onChange={updateCurriculumType}
            />
          </div>
          <div className="block">
            <p className="settingsQuestion">
              {t("proposalCardsAssignableQuestion", {}, {
                default: "Should proposal cards be assignable to students?",
              })}
            </p>
            <div className="settingsChoiceGroup">
              <label className={assignableToStudents ? "active" : ""}>
                <input
                  type="checkbox"
                  checked={assignableToStudents}
                  disabled={updatingSettings}
                  onChange={(event) =>
                    updateAssignableToStudents(event.target.checked)
                  }
                />
                {t("cardAssignmentEnabled", {}, {
                  default: "Cards can be assigned to students",
                })}
              </label>
              <label className={!assignableToStudents ? "active" : ""}>
                <input
                  type="checkbox"
                  checked={!assignableToStudents}
                  disabled={updatingSettings}
                  onChange={(event) =>
                    updateAssignableToStudents(!event.target.checked)
                  }
                />
                {t("cardAssignmentDisabled", {}, {
                  default: "Cards cannot be assigned to students",
                })}
              </label>
            </div>
          </div>
          {assignableToStudents && (
            <div className="block">
              <p className="settingsQuestion">
                {t("whoCanAssignCards", {}, {
                  default: "Who can assign profiles to cards?",
                })}
              </p>
              <div className="settingsChoiceGroup">
                <label className={studentsCanAssignToCards ? "active" : ""}>
                  <input
                    type="checkbox"
                    checked={studentsCanAssignToCards}
                    disabled={updatingSettings}
                    onChange={(event) =>
                      updateStudentsCanAssignToCards(event.target.checked)
                    }
                  />
                  {t("studentsCanAssignCards", {}, {
                    default: "Students can assign cards",
                  })}
                </label>
                <label className={!studentsCanAssignToCards ? "active" : ""}>
                  <input
                    type="checkbox"
                    checked={!studentsCanAssignToCards}
                    disabled={updatingSettings}
                    onChange={(event) =>
                      updateStudentsCanAssignToCards(!event.target.checked)
                    }
                  />
                  {t("onlyTeachersMentorsAssignCards", {}, {
                    default: "Only teachers and mentors can assign cards",
                  })}
                </label>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="settingsSection settingsDangerSection">
        <div className="settingsSectionHeader">
          <h3>{t("deleteYourClass")}</h3>
          <p>{t("deleteClassWarning")}</p>
        </div>

        <div className="informationBlock">
          <div className="block">
            <p className="settingsQuestion">{t("noAccessTo")}</p>
            <ul>
              <li>{t("yourClass")}</li>
              <li>{t("anyStudiesOrResults")}</li>
            </ul>
          </div>

          <div className="block">
            <p className="settingsQuestion">{t("studentsWillHaveAccessTo")}</p>
            <ul>
              <li>{t("theirWorkspaceAndStudies")}</li>
              <li>{t("noteNewStudents")}</li>
            </ul>
          </div>
        </div>

        <Modal
          onClose={() => setOpen(false)}
          onOpen={() => setOpen(true)}
          open={open}
          size="small"
          trigger={
            <button className="settingsDeleteButton" disabled={loading}>
              {t("deleteClass")}
            </button>
          }
        >
          <Modal.Content>
            <Modal.Description>
              <StyledModal>
                <h3>
                  {t("areYouSureDeleteClass")}
                </h3>
                <p>
                  {t("deleteClassWarning")}
                </p>
                <div>
                  <p>
                    <strong>{t("typeDeleteToConfirm")}</strong>
                  </p>
                  <input type="text" onChange={handleChange} />
                </div>
              </StyledModal>
            </Modal.Description>
          </Modal.Content>
          <Modal.Actions>
            <Button
              style={{ background: "#D53533", color: "#FFFFFF" }}
              content={t("delete")}
              onClick={() => {
                if (inputValue === "DELETE") {
                  deleteClass().catch((err) => alert(err.message));
                  router.push({
                    pathname: "/dashboard/myclasses",
                  });
                } else {
                  return alert(t("pleaseTypeDelete"));
                }
                setOpen(false);
              }}
            />
            <Button content={t("cancel")} onClick={() => setOpen(false)} />
          </Modal.Actions>
        </Modal>
      </section>
    </div>
  );
}
