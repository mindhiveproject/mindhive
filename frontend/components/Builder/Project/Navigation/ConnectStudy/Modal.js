import { useState } from "react";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import LinkClass from "./LinkClass";
import Collaborators from "../../../../Global/Collaborators";
import { StyledLinkedProjects } from "../../../../styles/StyledProject";
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
  study,
  user,
  handleChange,
  updateStudy,
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
    (study && study?.collaborators?.map((c) => c?.id)) || [];

  const title = t("connectStudyModal.title", {}, { default: "Connect" });
  const closeLabel = t("connectStudyModal.close", {}, { default: "Close" });

  return (
    <>
      <IconButton
        variant="subtle"
        elevated={false}
        ariaLabel={t("connectStudyModal.open", {}, { default: "Connect" })}
        title={t("connectStudyModal.open", {}, { default: "Connect" })}
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
                updateStudy();
                setOpen(false);
              }}
            >
              {t("connectStudyModal.saveAndClose", {}, {
                default: "Save & Close",
              })}
            </Button>
          </>
        }
      >
        {isAdminUser(user) && (
          <p>
            {t("connectStudyModal.studyAuthor", {
              username:
                study?.author?.username ||
                t("connectStudyModal.noAuthor", {}, { default: "No Author" }),
            })}{" "}
            (
            <em>
              {t("connectStudyModal.adminInfo", {}, {
                default: "This information is visible only for ADMIN",
              })}
            </em>
            )
          </p>
        )}
        <h2 className="MH-Type-Title-Small">
          {t("connectStudyModal.linkedClass", {}, { default: "Linked class" })}
        </h2>
        <LinkClass study={study} handleChange={handleChange} />
        <h2 className="MH-Type-Title-Small">
          {t("connectStudyModal.studyCollaborators", {}, {
            default: "Study collaborators",
          })}
        </h2>
        <Collaborators
          userClasses={userClasses}
          collaborators={collaborators}
          handleChange={handleChange}
        />
        {study?.title && (
          <StyledLinkedProjects>
            <h2 className="MH-Type-Title-Small">
              {t("connectStudyModal.linkedProjects", {}, {
                default: "Linked projects",
              })}
            </h2>
            <p>
              {t("connectStudyModal.linkedProjectsDescription", {
                title: study?.title,
              })}
            </p>
            <div>
              {(study?.proposal || []).map((project) => (
                <div className="project" key={project?.id}>
                  <div>{project?.title}</div>
                  <Link
                    href={{
                      pathname: "/builder/projects",
                      query: { selector: project?.id },
                    }}
                    target="_blank"
                  >
                    {t("connectStudyModal.openInNewTab", {}, {
                      default: "Open in a new tab",
                    })}
                  </Link>
                </div>
              ))}
            </div>
          </StyledLinkedProjects>
        )}
      </Modal>
    </>
  );
}
