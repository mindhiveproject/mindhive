import useTranslation from "next-translate/useTranslation";

import Modal from "../../../../../DesignSystem/Modal";
import Button from "../../../../../DesignSystem/Button";
import Card from "../../../../../DesignSystem/Card";
import Tooltip from "../../../../../DesignSystem/Tooltip";
import BlockDetails from "./BlockDetails";

// Lets the hover reach the tooltip's wrapper past a disabled button.
const LOCKED_BUTTON_STYLE = { pointerEvents: "none" };

const HEADER_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: 16,
  width: "100%",
};

const HEADER_ACTIONS_STYLE = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 8,
};

// Block details opened from the info button on a side-panel card. The header
// carries the actions that add the block (or a copy of it) to the canvas.
export default function TaskModal({
  user,
  component,
  addFunctions,
  onModalClose,
  isCanvasLocked = false,
}) {
  const { t } = useTranslation("builder");
  const isAuthor = component?.author?.id === user?.id;
  const isCollaborator = (component?.collaborators || [])
    .map((c) => c?.id)
    .includes(user?.id);

  const taskType = component?.taskType?.toLowerCase();

  const lockedHint = t(
    "selector.lockedAddHint",
    {},
    {
      default:
        "This study is locked. Ask your teacher to reopen it to add blocks.",
    }
  );
  const lockedStyle = isCanvasLocked ? LOCKED_BUTTON_STYLE : undefined;

  const addToCanvas = (extra = {}) => {
    addFunctions?.addComponentToCanvas({
      name: component?.title,
      details: component?.description,
      componentID: component?.id,
      taskType: component?.taskType,
      subtitle: component?.subtitle,
      ...extra,
    });
    onModalClose();
  };

  const openPreview = () => {
    window.open(
      `/preview/${taskType}/${component?.id}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const header = (
    <span style={HEADER_STYLE}>
      <span>{component?.title}</span>
      <span style={HEADER_ACTIONS_STYLE}>
        <Tooltip content={lockedHint} disabled={!isCanvasLocked}>
          <Button
            variant="filled"
            disabled={isCanvasLocked}
            style={lockedStyle}
            onClick={() => addToCanvas()}
          >
            {t("taskModal.addToStudy", {}, { default: "Add to study" })}
          </Button>
        </Tooltip>
        {(isAuthor || isCollaborator) && (
          <Tooltip content={lockedHint} disabled={!isCanvasLocked}>
            <Button
              variant="outline"
              disabled={isCanvasLocked}
              style={lockedStyle}
              onClick={() => addToCanvas({ createCopy: true })}
            >
              {t("taskModal.createCopy", {}, { default: "Create a copy" })}
            </Button>
          </Tooltip>
        )}
        <Button variant="outline" onClick={openPreview}>
          {t(
            "taskModal.preview",
            { taskType },
            { default: `Preview ${taskType}` }
          )}
        </Button>
      </span>
    </span>
  );

  return (
    <Modal
      open
      onClose={onModalClose}
      size="large"
      maxWidth={1200}
      height="90vh"
      title={header}
      actions={
        <Button variant="text" onClick={onModalClose}>
          {t("taskModal.close", {}, { default: "Close" })}
        </Button>
      }
    >
      {component?.description && (
        // Card fills its parent's height by default; here it should hug the
        // text, not stretch to the modal body.
        <Card variant="filled" style={{ height: "auto", marginBottom: 24 }}>
          <p
            className="MH-Type-Body-Base"
            style={{ margin: 0, color: "var(--MH-Theme-Neutrals-Black, #171717)" }}
          >
            {component.description}
          </p>
        </Card>
      )}
      <BlockDetails task={component} />
    </Modal>
  );
}
