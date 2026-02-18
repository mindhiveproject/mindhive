import { useState } from "react";
import { Modal, Button, Icon } from "semantic-ui-react";
import { useMutation, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import StyledModal from "../../../../styles/StyledModal";
import { GET_TEMPLATE_BOARD_SECTIONS_CARDS } from "../../../../Queries/Proposal";
import {
  LINK_ASSIGNMENT_TO_TEMPLATE_CARD,
  UNLINK_ASSIGNMENT_FROM_TEMPLATE_CARDS,
} from "../../../../Mutations/Assignment";
import { GET_CLASS_ASSIGNMENTS } from "../../../../Queries/Assignment";

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

  const { data: boardData, loading: boardLoading, error: boardError } = useQuery(
    GET_TEMPLATE_BOARD_SECTIONS_CARDS,
    {
      variables: { id: templateBoardId },
      skip: !open || !templateBoardId,
      fetchPolicy: open ? "network-only" : "cache-first",
    }
  );

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

  const board = boardData?.proposalBoard;
  const sections = board?.sections || [];
  const sectionsSorted = [...sections].sort(
    (a, b) => (a?.position ?? 0) - (b?.position ?? 0)
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

  if (boardLoading) {
    return (
      <Modal open={open} onClose={handleClose} size="large" style={{ borderRadius: "12px" }}>
        <Modal.Content>
          <p>
            {t("assignment.connectModal.loading", "Loading...")}
          </p>
        </Modal.Content>
      </Modal>
    );
  }

  if (boardError) {
    return (
      <Modal open={open} onClose={handleClose} size="large" style={{ borderRadius: "12px" }}>
        <Modal.Content>
          <p>
            {t(
              "assignment.connectModal.error",
              "Error loading board"
            )}
            : {boardError.message}
          </p>
        </Modal.Content>
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
          <p style={{ marginBottom: "16px" }}>
            {t(
              "assignment.connectModal.description",
              "Select a card on the class template board. The assignment will be linked to this card and to the same card on all student boards."
            )}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {sectionsSorted.map((section) => {
              const cards = [...(section.cards || [])].sort(
                (a, b) => (a?.position ?? 0) - (b?.position ?? 0)
              );
              return (
                <div key={section.id}>
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: "8px",
                      fontFamily: "Lato",
                      fontSize: "16px",
                    }}
                  >
                    {section.title ||
                      t(
                        "assignment.connectModal.untitledSection",
                        "Untitled section"
                      )}
                  </div>
                  <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
                    {cards.map((card) => {
                      const isSelected = selectedCardId === card.id;
                      return (
                        <li
                          key={card.id}
                          style={{
                            marginBottom: "4px",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            background: isSelected ? "#E3F2FD" : "transparent",
                            border:
                              isSelected
                                ? "1px solid #336F8A"
                                : "1px solid #e0e0e0",
                            cursor: "pointer",
                            fontFamily: "Lato",
                            fontSize: "14px",
                          }}
                          onClick={() => setSelectedCardId(card.id)}
                        >
                          {card.title ||
                            t(
                              "assignment.connectModal.untitledCard",
                              "Untitled card"
                            )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
          {sectionsSorted.length === 0 && (
            <p>
              {t(
                "assignment.connectModal.noSections",
                "This board has no sections or cards yet."
              )}
            </p>
          )}
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
