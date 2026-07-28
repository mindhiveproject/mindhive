import { useMemo } from "react";
import { Modal } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import BoardSettingsFields from "./BoardSettingsFields";
import useTemplateBoardSettings from "./useTemplateBoardSettings";

const modalActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  padding: "1.25rem 1.5rem",
  borderTop: "1px solid #e6e6e6",
  background: "#fafafa",
};

const headerSubtitleStyle = {
  margin: "6px 0 0",
  fontFamily: "Inter, sans-serif",
  fontSize: 14,
  lineHeight: "20px",
  fontWeight: 400,
  color: "#625b71",
};

export default function TemplateBoardSettingsModal({
  open,
  onClose,
  boardId,
  myclass,
  classTemplates,
}) {
  const { t } = useTranslation("classes");

  const board = useMemo(
    () => classTemplates.find((item) => item.id === boardId) ?? null,
    [classTemplates, boardId]
  );

  const settings = useTemplateBoardSettings({
    open,
    board,
    myclass,
    classTemplates,
  });

  if (!boardId || !board) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="large"
      closeIcon
      style={{ borderRadius: 16 }}
    >
      <Modal.Header
        style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 700,
          fontSize: 22,
          lineHeight: "30px",
          color: "#171717",
        }}
      >
        <div>{board.title}</div>
        <p style={headerSubtitleStyle}>
          {t("projects.boardSettingsAndPermissions", {}, {
            default: "Board settings & permissions",
          })}
        </p>
      </Modal.Header>

      <Modal.Content scrolling style={{ padding: "1.5rem" }}>
        <BoardSettingsFields
          {...settings}
          onCopyVisibilityChange={settings.onCopyVisibilityChange}
        />
      </Modal.Content>

      <Modal.Actions style={modalActionsStyle}>
        <Button type="button" variant="outline" onClick={onClose}>
          {t("projects.boardSettingsModalClose", {}, { default: "Close" })}
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
