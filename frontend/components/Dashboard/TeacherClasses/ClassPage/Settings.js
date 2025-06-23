import { useState } from "react";
import { useMutation } from "@apollo/client";
import moment from "moment";
import useTranslation from "next-translate/useTranslation";

import { DELETE_CLASS } from "../../../Mutations/Classes";
import { GET_CLASSES } from "../../../Queries/Classes";

import { Modal, Button } from "semantic-ui-react";

import StyledModal from "../../../styles/StyledModal";

import { useRouter } from "next/router";

export default function Settings({ myclass, user }) {
  const { t } = useTranslation("classes");
  const [inputValue, setInputValue] = useState({});
  const [open, setOpen] = useState(false);
  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const router = useRouter();
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
