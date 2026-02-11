import { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import moment from "moment";
import useTranslation from "next-translate/useTranslation";

import { DELETE_CLASS, EDIT_CLASS } from "../../../Mutations/Classes";
import { GET_CLASSES, GET_CLASS } from "../../../Queries/Classes";

import { Modal, Button } from "semantic-ui-react";

import StyledModal from "../../../styles/StyledModal";

import { useRouter } from "next/router";
import styled from "styled-components";

export default function Settings({ myclass, user }) {
  const { t } = useTranslation("classes");
  const [inputValue, setInputValue] = useState({});
  const [open, setOpen] = useState(false);
  const [assignableToStudents, setAssignableToStudents] = useState(
    myclass?.settings?.assignableToStudents ?? false
  );

  // Sync from server when myclass (e.g. after refetch) changes
  useEffect(() => {
    const value = myclass?.settings?.assignableToStudents;
    setAssignableToStudents(
      value === undefined || value === null ? false : !!value
    );
  }, [myclass?.settings?.assignableToStudents]);

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
    updateClassSettings({
      variables: {
        settings: { ...existingSettings, assignableToStudents: value },
      },
    }).catch((err) => alert(err?.message || "Failed to update settings"));
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

  const CheckboxGroup = styled.div`
    display: flex;
    gap: 16px;
    flex-wrap: wrap;

    label {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      border: 1px solid #d4d4d5;
      border-radius: 16px;
      background: #f6f7f8;
      cursor: pointer;
      font-size: 14px;
      color: #333333;
      transition: all 0.2s ease;

      input {
        width: 16px;
        height: 16px;
      }

      &.active {
        border-color: #336f8a;
        background: rgba(51, 111, 138, 0.1);
        color: #265568;
        box-shadow: 0 2px 6px rgba(51, 111, 138, 0.25);
      }
    }
  }
  `;
  
  return (
    <div className="settings">
      {myclass?.networks.length > 0 && (
        <div>
          <h3>{t("classNetworks")}</h3>
          {myclass?.networks.map((network) => (
            <div>
              <h2>{network?.title}</h2>
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
                  <li>{cl?.title}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <h3>{t("Board settings")}</h3>
      <p>{t("These settings will be applied to all project boards in this class.")}</p>
      <div className="informationBlock">
        <div className="block">
          <p>{t("Should proposal cards be assignable to students?")}</p>
          <CheckboxGroup>
            <label className={assignableToStudents ? "active" : ""}>
              <input
                type="checkbox"
                checked={assignableToStudents}
                disabled={updatingSettings}
                onChange={(event) =>
                  updateAssignableToStudents(event.target.checked)
                }
              />
              {t("cardAssignmentEnabled", "Cards can be assigned to students")}
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
              {t("cardAssignmentDisabled", "Cards cannot be assigned to students")}
            </label>
          </CheckboxGroup>
        </div>
      </div>

      <h3>{t("deleteYourClass")}</h3>
      <p>{t("deleteClassWarning")}</p>

      <div className="informationBlock">
        <div className="block">
          <p>{t("noAccessTo")}</p>
          <ul>
            <li>{t("yourClass")}</li>
            <li>{t("anyStudiesOrResults")}</li>
          </ul>
        </div>

        <div className="block">
          <p>{t("studentsWillHaveAccessTo")}</p>
          <ul>
            <li>{t("theirWorkspaceAndStudies")}</li>
            <li>{t("noteNewStudents")}</li>
          </ul>
        </div>
      </div>

      <div>
        <Modal
          onClose={() => setOpen(false)}
          onOpen={() => setOpen(true)}
          open={open}
          size="small"
          trigger={<button disabled={loading}>{t("deleteClass")}</button>}
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
            <Button content={t("cancel")}
              onClick={() => setOpen(false)} />
          </Modal.Actions>
        </Modal>
      </div>
    </div>
  );
}
