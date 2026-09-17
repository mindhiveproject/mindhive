import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import LinkClass from "./LinkClass";
import Collaborators from "../../../../Global/Collaborators";
import { StyledInput } from "../../../../styles/StyledForm";
import Button from "../../../../DesignSystem/Button";
import IconButton from "../../../../DesignSystem/IconButton";
import Modal from "../../../../DesignSystem/Modal";
import {
  CONNECT_FACEPILE_CHEVRON_BUTTON_STYLE,
  ConnectFacepileChevron,
} from "../ConnectFacepile";

function isAdminUser(user) {
  return (user?.permissions || []).some((p) => p?.name === "ADMIN");
}

export default function ConnectModal({
  project,
  user,
  handleChange,
  updateProject,
}) {
  const { t } = useTranslation("builder");
  const [open, setOpen] = useState(false);

  const userClasses = [
    ...(user?.teacherIn || []).map((cl) => cl?.id),
    ...(user?.teachingTeamIn || []).map((cl) => cl?.id),
    ...(user?.mentorIn || []).map((cl) => cl?.id),
    ...(user?.studentIn || []).map((cl) => cl?.id),
  ];
  const collaborators =
    (project && project?.collaborators?.map((c) => c?.id)) || [];

  const title = t("connectModal.title", {}, { default: "Connect" });
  const closeLabel = t("connectModal.close", {}, { default: "Close" });

  return (
    <>
      <IconButton
        variant="subtle"
        elevated={false}
        ariaLabel={t("connectModal.open", {}, { default: "Connect" })}
        title={t("connectModal.open", {}, { default: "Connect" })}
        icon={<ConnectFacepileChevron />}
        style={CONNECT_FACEPILE_CHEVRON_BUTTON_STYLE}
        onClick={() => setOpen(true)}
      />
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        maxWidth={560}
        title={title}
        actions={
          <>
            <Button variant="text" onClick={() => setOpen(false)}>
              {closeLabel}
            </Button>
            <Button
              variant="filled"
              onClick={() => {
                updateProject();
                setOpen(false);
              }}
            >
              {t("connectModal.saveAndClose", {}, { default: "Save & Close" })}
            </Button>
          </>
        }
      >
        {isAdminUser(user) && (
          <p>
            {t("connectModal.projectCreator", {
              username:
                project?.author?.username ||
                t("connectModal.noAuthor", {}, { default: "No Author" }),
            })}{" "}
            (
            <em>
              {t("connectModal.adminInfo", {}, {
                default: "This information is visible only for ADMIN",
              })}
            </em>
            )
          </p>
        )}
        <StyledInput>
          <h2 className="MH-Type-Title-Small">
            {t("connectModal.projectTitle", {}, { default: "Project title" })}
          </h2>
          <input
            type="text"
            id="title"
            name="title"
            value={project?.title}
            onChange={handleChange}
          />
        </StyledInput>
        <h2 className="MH-Type-Title-Small">
          {t("connectModal.linkedClass", {}, { default: "Linked class" })}
        </h2>
        <LinkClass project={project} handleChange={handleChange} />
        <h2 className="MH-Type-Title-Small">
          {t("connectModal.projectBoardCollaborators", {}, {
            default: "Project board collaborators",
          })}
        </h2>
        <Collaborators
          userClasses={userClasses}
          collaborators={collaborators}
          handleChange={handleChange}
        />
      </Modal>
    </>
  );
}
