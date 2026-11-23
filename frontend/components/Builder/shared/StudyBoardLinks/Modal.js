import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import Modal from "../../../DesignSystem/Modal";
import StudyBoardLinksPanel from "./Panel";

/** The Links panel in a modal (builder Settings, class Studies tab). */
export default function StudyBoardLinksModal({ open, onClose, title, ...panelProps }) {
  const { t } = useTranslation("builder");
  if (!open) return null;
  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth={640}
      title={title || t("studyBoardLinks.title", {}, { default: "Study and project boards" })}
      actions={
        <Button variant="text" onClick={onClose}>
          {t("connectModal.close", {}, { default: "Close" })}
        </Button>
      }
    >
      <StudyBoardLinksPanel {...panelProps} />
    </Modal>
  );
}
