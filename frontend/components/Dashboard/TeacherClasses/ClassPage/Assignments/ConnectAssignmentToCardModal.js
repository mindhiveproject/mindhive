import { useState } from "react";
import { Modal, Button, Icon } from "semantic-ui-react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import StyledModal from "../../../../styles/StyledModal";
import {
  LINK_ASSIGNMENT_TO_TEMPLATE_CARD,
  UNLINK_ASSIGNMENT_FROM_TEMPLATE_CARDS,
} from "../../../../Mutations/Assignment";
import { GET_CLASS_ASSIGNMENTS } from "../../../../Queries/Assignment";
import TemplateBoardCardPicker from "./TemplateBoardCardPicker";

export default function ConnectAssignmentToCardModal({
  open,
  onClose,
  assignment,
  myclass,
  onSuccess,
}) {
  const { t } = useTranslation("classes");
  const [selectedCardId, setSelectedCardId] = useState(null);
  const templateBoardId = myclass?.templateProposal?.id;

  const [linkAssignment, { loading: linkLoading }] = useMutation(
    LINK_ASSIGNMENT_TO_TEMPLATE_CARD,
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
    if (!assignment?.id || !selectedCardId || !myclass?.id) return;
    linkAssignment({
      variables: {
        assignmentId: assignment.id,
        templateCardId: selectedCardId,
        classId: myclass.id,
      },
    });
  };

  const handleClose = () => {
    setSelectedCardId(null);
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

  const isBusy = linkLoading || unlinkLoading;

  if (!open) return null;

  if (!templateBoardId) {
    return (
      <Modal
        closeIcon
        open={open}
        onClose={handleClose}
        size="large"
        style={{ borderRadius: "12px" }}
      >
        <Modal.Header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
            {t(
              "assignment.connectModal.title",
              "Connect assignment to card"
            )}
          </span>
          <Button
            icon
            onClick={handleClose}
            style={{ background: "transparent", color: "#666" }}
          >
            <Icon name="close" />
          </Button>
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
      closeIcon
      open={open}
      onClose={handleClose}
      size="large"
      style={{ borderRadius: "12px" }}
    >
      <Modal.Header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>
          {t("assignment.connectModal.title", "Connect assignment to card")}
        </span>
        <Button
          icon
          onClick={handleClose}
          style={{ background: "transparent", color: "#666" }}
        >
          <Icon name="close" />
        </Button>
      </Modal.Header>

      <Modal.Content scrolling>
        <StyledModal>
          <TemplateBoardCardPicker
            templateBoardId={templateBoardId}
            selectedCardId={selectedCardId}
            onSelectCard={setSelectedCardId}
            disabled={isBusy}
            showDescription
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
        <Button
          loading={unlinkLoading}
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
            "Disconnect from card"
          )}
        </Button>
        <Button
          loading={linkLoading}
          disabled={isBusy || !selectedCardId}
          onClick={handleSave}
          style={{
            borderRadius: "100px",
            border: "1px solid #336F8A",
            background: selectedCardId ? "#336F8A" : "#EFEFEF",
            color: selectedCardId ? "white" : "#171717",
            fontSize: "16px",
          }}
        >
          {t("assignment.connectModal.save", "Save")}
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
