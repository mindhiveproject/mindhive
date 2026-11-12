import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Collaborators from "../../../../Global/Collaborators";
import Button from "../../../../DesignSystem/Button";
import IconButton from "../../../../DesignSystem/IconButton";
import Modal from "../../../../DesignSystem/Modal";
import { GroupIcon } from "../../../../DesignSystem/Icons";
import { CONNECT_FACEPILE_CHEVRON_BUTTON_STYLE } from "../../../Project/Navigation/ConnectFacepile";
import LinkedBoardPeople from "../../../shared/LinkedBoardPeople";

export default function ConnectModal({
  study,
  user,
  handleChange,
  updateStudy,
  open: openProp,
  onOpenChange,
}) {
  const { t } = useTranslation("builder");
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  const setOpen = (nextOpen) => {
    if (!isControlled) {
      setUncontrolledOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  const userClasses = [
    ...(user?.teacherIn || []).map((cl) => cl?.id),
    ...(user?.teachingTeamIn || []).map((cl) => cl?.id),
    ...(user?.mentorIn || []).map((cl) => cl?.id),
    ...(user?.studentIn || []).map((cl) => cl?.id),
  ];
  const collaborators =
    (study && study?.collaborators?.map((c) => c?.id)) || [];

  const title = t("connectModal.title", {}, { default: "Connect" });
  const closeLabel = t("connectModal.close", {}, { default: "Close" });

  return (
    <>
      <IconButton
        variant="subtle"
        elevated={false}
        ariaLabel={t("connectModal.open", {}, { default: "Connect" })}
        title={t("connectModal.open", {}, { default: "Connect" })}
        icon={<GroupIcon style={{ width: "20px", height: "20px" }} />}
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
            <Button variant="tonal" style={{ color: "var(--MH-Theme-Neutral-Black)" }} onClick={() => setOpen(false)} >
              {closeLabel}
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
          </>
        }
      >
        <LinkedBoardPeople studyId={study?.id} placement="author" />
        <h2 className="MH-Type-Title-Small">
          {t("connectModal.addCollaborators", {}, {
            default: "Add collaborators",
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
