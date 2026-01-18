import { useState } from "react";
import { Modal } from "semantic-ui-react";
import { Icon } from "semantic-ui-react";
import Link from "next/link";

import LinkClass from "./LinkClass";
import Collaborators from "../../../../Global/Collaborators";

import { StyledLinkedProjects } from "../../../../styles/StyledProject";
import useTranslation from "next-translate/useTranslation";

export default function ConnectModal({
  study,
  user,
  handleChange,
  updateStudy,
}) {
  const { t } = useTranslation();
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
            {t('builder:connectStudyModal.studyAuthor', { username: study?.author?.username || t('builder:connectStudyModal.noAuthor') })} (
            <em>{t('builder:connectStudyModal.adminInfo')}</em>)
          </div>
        </Modal.Header>
      )}
      <Modal.Content>
        <Modal.Description>
          <div>
            <h2>{t('builder:connectStudyModal.linkedClass')}</h2>
            <LinkClass study={study} handleChange={handleChange} />
            <h2>{t('builder:connectStudyModal.studyCollaborators')}</h2>
            <Collaborators
              userClasses={userClasses}
              collaborators={collaborators}
              handleChange={handleChange}
            />

            {study?.title && (
              <StyledLinkedProjects>
                <h2>{t('builder:connectStudyModal.linkedProjects')}</h2>
                <p>
                  {t('builder:connectStudyModal.linkedProjectsDescription', { title: study?.title })}
                </p>
                <div>
                  {study?.proposal.map((project) => (
                    <div className="project" key={project?.id}>
                      <div>{project?.title}</div>
                      <Link
                        href={{
                          pathname: `/builder/projects`,
                          query: { selector: project?.id }
                        }}
                        target="_blank"
                      >
                        {t('builder:connectStudyModal.openInNewTab')}
                      </Link>
                    </div>
                  ))}
                </div>
              </StyledLinkedProjects>
            )}
          </div>
        </Modal.Description>
      </Modal.Content>

      <Modal.Actions>
        <div className="modalButtons">
          <button
            className="secondaryBtn"
            onClick={() => setOpen(false)}
            disabled={false}
          >
            {t('builder:connectStudyModal.close')}
          </button>

          <button
            className="primaryBtn"
            onClick={() => {
              updateStudy();
              setOpen(false);
            }}
            disabled={false}
          >
            {t('builder:connectStudyModal.saveAndClose')}
          </button>
        </div>
      </Modal.Actions>
    </Modal>
  );
}
