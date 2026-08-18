import { useState } from "react";
import { Modal } from "semantic-ui-react";
import { Icon } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import LinkClass from "./LinkClass";
import Collaborators from "../../../../Global/Collaborators";
import Button from "../../../../DesignSystem/Button";

export default function ConnectModal({
  study,
  user,
  handleChange,
  updateStudy,
}) {
  const { t } = useTranslation("builder");
  const [open, setOpen] = useState(false);

  const userClasses = [
    ...user?.teacherIn.map((cl) => cl?.id),
    ...user?.mentorIn.map((cl) => cl?.id),
    ...user?.studentIn.map((cl) => cl?.id),
  ];
  const collaborators =
    (study && study?.collaborators?.map((c) => c?.id)) || [];

  return (
    <Modal
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      trigger={<Icon size="large" name="dropdown" />}
    >
      {user?.permissions.map((p) => p?.name).includes("ADMIN") && (
        <Modal.Header>
          <div>
            {t("connectModal.studyAuthor", {
              username:
                study?.author?.username ||
                t("connectModal.noAuthor", {}, { default: "No Author" }),
            })}{" "}
            (
            <em>
              {t("connectModal.adminInfo", {}, {
                default: "This information is visible only for ADMIN",
              })}
            </em>
            )
          </div>
        </Modal.Header>
      )}
      <Modal.Content>
        <Modal.Description>
          <div>
            <h2>
              {t("connectModal.selectClass", {}, { default: "Select the class" })}
            </h2>
            <LinkClass study={study} handleChange={handleChange} />
            <h2>
              {t("connectModal.addCollaborators", {}, {
                default: "Add collaborators",
              })}
            </h2>
            <Collaborators
              userClasses={userClasses}
              collaborators={collaborators}
              handleChange={handleChange}
            />
          </div>
        </Modal.Description>
      </Modal.Content>

      <Modal.Actions>
        <div className="modalButtons">
          <Button variant="text" onClick={() => setOpen(false)}>
            {t("connectModal.close", {}, { default: "Close" })}
          </Button>

          <Button
            variant="filled"
            onClick={() => {
              updateStudy();
              setOpen(false);
            }}
          >
            {t("connectModal.saveAndClose", {}, { default: "Save & Close" })}
          </Button>
        </div>
      </Modal.Actions>
    </Modal>
  );
}
