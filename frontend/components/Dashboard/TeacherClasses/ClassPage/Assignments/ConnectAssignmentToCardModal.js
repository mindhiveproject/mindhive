import { useState, useEffect } from "react";
import { Modal, Button } from "semantic-ui-react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import StyledModal from "../../../../styles/StyledModal";
import {
  SET_ASSIGNMENT_TEMPLATE_CARDS,
  UNLINK_ASSIGNMENT_FROM_TEMPLATE_CARDS,
} from "../../../../Mutations/Assignment";
import { GET_CLASS_ASSIGNMENTS } from "../../../../Queries/Assignment";
import TemplateBoardCardPicker from "./TemplateBoardCardPicker";

function getTemplateCardIds(assignment, templateBoardId) {
  if (!assignment?.proposalCards || !templateBoardId) return [];
  return (assignment.proposalCards || [])
    .filter((c) => c?.section?.board?.id === templateBoardId)
    .map((c) => c.id)
    .filter(Boolean);
}

export default function ConnectAssignmentToCardModal({
  open,
  onClose,
  assignment,
  myclass,
  onSuccess,
}) {
  const { t } = useTranslation("classes");
  const templateBoardId = myclass?.templateProposal?.id;
  const [selectedCardIds, setSelectedCardIds] = useState([]);

  useEffect(() => {
    if (open && assignment && templateBoardId) {
      setSelectedCardIds(getTemplateCardIds(assignment, templateBoardId));
    }
  }, [open, assignment?.id, templateBoardId, assignment?.proposalCards]);

  const handleToggleCard = (cardId) => {
    setSelectedCardIds((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  };

  const [setTemplateCards, { loading: setLoading }] = useMutation(
    SET_ASSIGNMENT_TEMPLATE_CARDS,
    {
      refetchQueries: [
        {
          query: GET_CLASS_ASSIGNMENTS,
          variables: { classId: myclass?.id },
        },
      ],
      onCompleted: () => {
        onSuccess?.();
        onClose();
      },
      onError: (err) => {
        alert(err.message);
      },
    }
  );

  const [unlinkAssignment, { loading: unlinkLoading }] = useMutation(
    UNLINK_ASSIGNMENT_FROM_TEMPLATE_CARDS,
    {
      refetchQueries: [
        {
          query: GET_CLASS_ASSIGNMENTS,
          variables: { classId: myclass?.id },
        },
      ],
      onCompleted: () => {
        onSuccess?.();
        onClose();
      },
      onError: (err) => {
        alert(err.message);
      },
    }
  );

  const handleSave = () => {
    if (!assignment?.id || !myclass?.id) return;
    setTemplateCards({
      variables: {
        assignmentId: assignment.id,
        templateCardIds: selectedCardIds,
        classId: myclass.id,
      },
    });
  };

  const handleClose = () => {
    setSelectedCardIds([]);
    onClose();
  };

  const handleDisconnect = () => {
    if (!assignment?.id || !myclass?.id) return;
    unlinkAssignment({
      variables: {
        assignmentId: assignment.id,
        classId: myclass.id,
      },
    });
  };

  const templateCardsWithAssignment = (assignment?.proposalCards || []).filter(
    (c) => c?.section?.board?.id === templateBoardId
  );
  const hasLinkedCards = templateCardsWithAssignment.length > 0;

  const isBusy = setLoading || unlinkLoading;

  if (!open) return null;

  if (!templateBoardId) {
    return (
      <Modal
        // closeIcon
        open={open}
        onClose={handleClose}
        size="large"
        style={{ borderRadius: "12px" }}
      >
        <Modal.Header>
          <span>
            {t(
              "assignment.connectModal.title",
              "Connect assignment to card"
            )}
          </span>
        </Modal.Header>
        <Modal.Content>
          <StyledModal>
            <p>
              {t(
                "assignment.connectModal.noTemplate",
                "No template board for this class."
              )}
            </p>
          </StyledModal>
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
            disabled={isBusy}
          >
            {t("assignment.connectModal.cancel", "Cancel")}
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="large"
      style={{ borderRadius: "12px" }}
    >
      <Modal.Header>
        <span>
          {t("assignment.connectModal.title", "Connect assignment to card")}
        </span>
      </Modal.Header>

      <Modal.Content scrolling>
        <StyledModal>
          <TemplateBoardCardPicker
            templateBoardId={templateBoardId}
            selectedCardIds={selectedCardIds}
            onToggleCard={handleToggleCard}
            disabled={isBusy}
            showDescription
            description={t(
              "assignment.connectModal.descriptionMulti",
              "Select one or more cards to link this assignment to. Toggle chips to add or remove."
            )}
          />
        </StyledModal>
      </Modal.Content>

      <Modal.Actions
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
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
          disabled={isBusy}
        >
          {t("assignment.connectModal.cancel", "Cancel")}
        </Button>
        <div style={{ display: "flex", gap: "12px" }}>
          {hasLinkedCards && (
            <Button
              disabled={isBusy}
              onClick={handleDisconnect}
              style={{
                borderRadius: "100px",
                width: "fit-content",
                border: "1px solid #336F8A",
                background: "white",
                color: "#336F8A",
                fontSize: "16px",
              }}
            >
              {t(
                "assignment.connectModal.disconnect",
                "Disconnect from card(s)"
              )}
            </Button>
          )}
          <Button
            loading={setLoading}
            disabled={isBusy}
            onClick={handleSave}
            style={{
              borderRadius: "100px",
              border: "1px solid #336F8A",
              background: "#336F8A",
              color: "white",
              fontSize: "16px",
            }}
          >
            {t("assignment.connectModal.save", "Save")}
          </Button>
        </div>
      </Modal.Actions>
    </Modal>
  );
}
