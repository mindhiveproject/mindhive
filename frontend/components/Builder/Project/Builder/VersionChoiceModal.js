import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import Modal from "../../../DesignSystem/Modal";

/**
 * Asked when a block is added from one of the user's versions that is already
 * used elsewhere (another study, this canvas, or it holds collected data).
 * A task belongs to one study block, so the only way forward is a copy of
 * this version; cancel takes the block back off.
 */
export default function VersionChoiceModal({ choice, onChoose }) {
  const { t } = useTranslation("builder");
  if (!choice) return null;

  const { title, usedIn = [], onCanvas, hasData } = choice;

  let reason;
  if (usedIn.length) {
    reason = t(
      "versionChoice.usedIn",
      { title, studies: usedIn.join(", ") },
      {
        default: `"${title}" is already used in ${usedIn.join(", ")}.`,
      }
    );
  } else if (onCanvas) {
    reason = t(
      "versionChoice.onCanvas",
      { title },
      { default: `"${title}" is already in this study.` }
    );
  } else if (hasData) {
    reason = t(
      "versionChoice.hasData",
      { title },
      {
        default: `"${title}" already holds data collected in an earlier study.`,
      }
    );
  }

  return (
    <Modal
      open
      onClose={() => onChoose("cancel")}
      title={t("versionChoice.title", {}, { default: "Add your version?" })}
      actions={
        <>
          <Button variant="text" onClick={() => onChoose("cancel")}>
            {t("versionChoice.cancel", {}, { default: "Cancel" })}
          </Button>
          <Button variant="filled" onClick={() => onChoose("copy")}>
            {t("versionChoice.addCopy", {}, { default: "Add a copy" })}
          </Button>
        </>
      }
    >
      <p>{reason}</p>
      <p>
        {t(
          "versionChoice.explain",
          {},
          {
            default:
              "A block can only belong to one study, so this study gets its own copy with the same settings. Later edits in one won't change the other.",
          }
        )}
      </p>
    </Modal>
  );
}
