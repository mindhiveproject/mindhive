import { useState } from "react";
import { Modal } from "semantic-ui-react";
import { Icon } from "semantic-ui-react";

import LinkClass from "./LinkClass";
import Collaborators from "../../../../Global/Collaborators";
import { StyledInput } from "../../../../styles/StyledForm";
import useTranslation from "next-translate/useTranslation";

export default function ConnectModal({
  project,
  user,
  handleChange,
  updateProject,
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const userClasses = [
    ...user?.teacherIn.map((cl) => cl?.id),
    ...user?.mentorIn.map((cl) => cl?.id),
    ...user?.studentIn.map((cl) => cl?.id),
  ];
  const collaborators =
    (project && project?.collaborators?.map((c) => c?.id)) || [];

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
            {t('builder:connectModal.projectCreator', { username: project?.author?.username || t('builder:connectModal.noAuthor') })} (
            <em>{t('builder:connectModal.adminInfo')}</em>)
          </div>
        </Modal.Header>
      )}
      <Modal.Content>
        <Modal.Description>
          <StyledInput>
            <h2>{t('builder:connectModal.projectTitle')}</h2>
            <input
              type="text"
              id="title"
              name="title"
              value={project?.title}
              onChange={handleChange}
            />
          </StyledInput>
          <h2>{t('builder:connectModal.linkedClass')}</h2>
          <LinkClass project={project} handleChange={handleChange} />
          <h2>{t('builder:connectModal.projectBoardCollaborators')}</h2>
          <Collaborators
            userClasses={userClasses}
            collaborators={collaborators}
            handleChange={handleChange}
          />
        </Modal.Description>
      </Modal.Content>

      <Modal.Actions>
        <div className="modalButtons">
          <button
            className="secondaryBtn"
            onClick={() => setOpen(false)}
            disabled={false}
          >
            {t('builder:connectModal.close')}
          </button>

          <button
            className="primaryBtn"
            onClick={() => {
              updateProject();
              setOpen(false);
            }}
            disabled={false}
          >
            {t('builder:connectModal.saveAndClose')}
          </button>
        </div>
      </Modal.Actions>
    </Modal>
  );
}
