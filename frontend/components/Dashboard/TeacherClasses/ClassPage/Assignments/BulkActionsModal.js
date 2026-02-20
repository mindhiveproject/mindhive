import { useState } from "react";
import { Modal, Button, Icon } from "semantic-ui-react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";
import {
  EDIT_ASSIGNMENT,
  LINK_ASSIGNMENT_TO_TEMPLATE_CARD,
  UNLINK_ASSIGNMENT_FROM_TEMPLATE_CARDS,
} from "../../../../Mutations/Assignment";
import { GET_CLASS_ASSIGNMENTS } from "../../../../Queries/Assignment";
import TemplateBoardCardPicker from "./TemplateBoardCardPicker";

const Section = styled.div`
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionTitle = styled.div`
  font-family: Inter, sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  color: #171717;
`;

const ActionButton = styled.button`
  dispdisplay: inline-flex;
  height: 40px;
  padding: 8px 16px 8px 16px;
  justify-content: center;
  align-items: center;
  width: fit-content;
  gap: 8px;
  border-radius: 100px;
  background: #ffffff;
  border: 1px solid var(--MH-Theme-Primary-Dark, #336F8A);

  font-family: Inter, sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: var(--MH-Theme-Primary-Dark, #336F8A);

  &:hover:not(:disabled) {
    background: #f5f5f5;
    border-color: #b3b3b3;
    color: #666666;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CardPickerContainer = styled.div`
  padding: 16px;
  background: #F6F9F8;
  border-radius: 16px;
  border: 1px solid #336F8A;
`

export default function BulkActionsModal({
  open,
  onClose,
  selectedAssignments,
  myclass,
  onSuccess,
}) {
  const { t } = useTranslation("classes");
  const [showChangeCard, setShowChangeCard] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [applying, setApplying] = useState(false);

  const classId = myclass?.id;
  const templateBoardId = myclass?.templateProposal?.id;

  const [editAssignment] = useMutation(EDIT_ASSIGNMENT, {
    refetchQueries: [{ query: GET_CLASS_ASSIGNMENTS, variables: { classId } }],
  });

  const [linkAssignment] = useMutation(LINK_ASSIGNMENT_TO_TEMPLATE_CARD, {
    refetchQueries: [{ query: GET_CLASS_ASSIGNMENTS, variables: { classId } }],
  });

  const [unlinkAssignment] = useMutation(UNLINK_ASSIGNMENT_FROM_TEMPLATE_CARDS, {
    refetchQueries: [{ query: GET_CLASS_ASSIGNMENTS, variables: { classId } }],
  });

  const unpublished = (selectedAssignments || []).filter((a) => !a?.public);
  const published = (selectedAssignments || []).filter((a) => a?.public);
  const canPublishAll = unpublished.length > 0;
  const canUnpublishAll = published.length > 0;

  const runSequentially = async (fn) => {
    setApplying(true);
    try {
      await fn();
      onSuccess?.();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setApplying(false);
    }
  };

  const handlePublishAll = () => {
    if (!canPublishAll) return;
    if (!confirm(t("assignment.bulkActionsModal.confirmPublishAll", "Publish all selected assignments? Students will see them in their class."))) return;
    runSequentially(async () => {
      for (const a of unpublished) {
        if (a?.id) await editAssignment({ variables: { id: a.id, input: { public: true } } });
      }
    });
  };

  const handleUnpublishAll = () => {
    if (!canUnpublishAll) return;
    if (!confirm(t("assignment.bulkActionsModal.confirmUnpublishAll", "Unpublish all selected? Students will no longer see these assignments."))) return;
    runSequentially(async () => {
      for (const a of published) {
        if (a?.id) await editAssignment({ variables: { id: a.id, input: { public: false } } });
      }
    });
  };

  const handleApplyCardToAll = () => {
    if (!selectedCardId || !classId || (selectedAssignments || []).length === 0) return;
    runSequentially(async () => {
      for (const a of selectedAssignments) {
        if (a?.id) {
          await linkAssignment({
            variables: {
              assignmentId: a.id,
              templateCardId: selectedCardId,
              classId,
            },
          });
        }
      }
    });
  };

  const handleDisconnectAll = () => {
    if ((selectedAssignments || []).length === 0) return;
    if (!confirm(t("assignment.bulkActionsModal.confirmDisconnectAll", "Disconnect all selected assignments from their project cards?"))) return;
    runSequentially(async () => {
      for (const a of selectedAssignments) {
        if (a?.id) {
          await unlinkAssignment({
            variables: { assignmentId: a.id, classId },
          });
        }
      }
    });
  };

  const handleClose = () => {
    if (applying) return;
    setShowChangeCard(false);
    setSelectedCardId(null);
    onClose();
  };

  if (!open) return null;

  const count = (selectedAssignments || []).length;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="large"
      style={{ borderRadius: "16px" }}
    >
      <Modal.Header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>
          {t("assignment.bulkActionsModal.title", "Bulk actions")} ({count})
        </span>
      </Modal.Header>

      <Modal.Content scrolling>
        <Section>
          <SectionTitle>{t("assignment.publishUnpublish", "Publish/Unpublish")}</SectionTitle>
          <div style={{ display: "flex", flexDirection: "row", justifyContent: "flex-start", gap: 12 }}>
            <ActionButton 
              type="button"
              onClick={handlePublishAll}
              disabled={!canPublishAll || applying}
            >
              {t("assignment.bulkActionsModal.publishAll", "Publish all selected")}
            </ActionButton>
            <ActionButton
              type="button"
              onClick={handleUnpublishAll}
              disabled={!canUnpublishAll || applying}
            >
              {t("assignment.bulkActionsModal.unpublishAll", "Unpublish all selected")}
            </ActionButton>
          </div>
        </Section>

        <Section>
          <SectionTitle>{t("assignment.projectCard", "Change associated Project card")}</SectionTitle>
          <ActionButton
            type="button"
            onClick={handleDisconnectAll}
            disabled={count === 0 || applying}
          >
            {t("assignment.bulkActionsModal.disconnectFromCards", "Disconnect from cards")}
          </ActionButton>
          {!showChangeCard ? (
            <ActionButton
              type="button"
              onClick={() => setShowChangeCard(true)}
              disabled={!templateBoardId || applying}
              style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              {t("assignment.bulkActionsModal.changeProjectCard", "Change associated Project card")}
            </ActionButton>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 , borderTop: "1px solid #E6E6E6", paddingTop: "16px"}}>
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12 }}>
              <ActionButton
                type="button"
                onClick={() => setShowChangeCard(false)}
                disabled={applying}
                style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                {t("assignment.bulkActionsModal.cancel", "Cancel")}
              </ActionButton>
              <ActionButton
                type="button"
                onClick={handleApplyCardToAll}
                disabled={!selectedCardId || applying}
              >
                {applying
                  ? t("assignment.bulkActionsModal.applying", "Applying…")
                  : t("assignment.bulkActionsModal.applyToCount", { count, default: "Apply to {{count}} assignments" })}
              </ActionButton>
              </div>
              <CardPickerContainer>
                <TemplateBoardCardPicker
                  templateBoardId={templateBoardId}
                  selectedCardId={selectedCardId}
                  onSelectCard={setSelectedCardId}
                  disabled={applying}
                  showDescription={false}
                />
              </CardPickerContainer>
            </div>
          )}
          <br />
        </Section>
      </Modal.Content>

      <Modal.Actions
        style={{
          padding: "1.5rem",
          borderTop: "1px solid #e0e0e0",
          background: "#fafafa",
        }}
      >
        <Button
          style={{
            borderRadius: "100px",
            border: "1px solid #336F8A",
            background: "white",
            color: "#336F8A",
            fontSize: "16px",
          }}
          onClick={handleClose}
          disabled={applying}
        >
          {t("assignment.connectModal.cancel", "Cancel")}
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
