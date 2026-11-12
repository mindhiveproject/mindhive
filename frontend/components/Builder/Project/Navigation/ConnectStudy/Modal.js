import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Collaborators from "../../../../Global/Collaborators";
import LinkedBoardPeople from "../../../shared/LinkedBoardPeople";
import Button from "../../../../DesignSystem/Button";
import IconButton from "../../../../DesignSystem/IconButton";
import Modal from "../../../../DesignSystem/Modal";
import {
  CONNECT_FACEPILE_CHEVRON_BUTTON_STYLE,
  ConnectFacepileChevron,
} from "../ConnectFacepile";

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
        <LinkedBoardPeople studyId={study?.id} placement="author" />
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
        <LinkedBoardPeople
          studyId={study?.id}
          collaboratorIds={collaborators}
        />
      </Modal>
    </>
  );
}
