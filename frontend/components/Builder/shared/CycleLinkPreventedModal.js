import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import Modal from "../../DesignSystem/Modal";

/**
 * Small acknowledgment modal when a diagram link would create a circular flow.
 */
export default function CycleLinkPreventedModal({ open, onClose }) {
  const { t } = useTranslation("builder");
  const { t: tCommon } = useTranslation("common");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("engine.cycleLinkPreventedTitle", {}, {
        default: "Circular flow not allowed",
      })}
      actions={
        <Button variant="filled" type="button" onClick={onClose}>
          {tCommon("close", {}, { default: "Close" })}
        </Button>
      }
    >
      {t("engine.cycleLinkPrevented", {}, {
        default:
          "This connection would create a circular flow with no valid end. Choose a different path so the study can finish.",
      })}
    </Modal>
  );
}
