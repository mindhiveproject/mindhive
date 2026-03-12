import { useState, useEffect } from "react";
import { Modal, Button } from "semantic-ui-react";
import { useMutation, useApolloClient } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import StyledModal from "../../../../styles/StyledModal";
import { UPDATE_RESOURCE, SET_RESOURCE_TEMPLATE_CARDS } from "../../../../Mutations/Resource";
import { GET_CLASS_RESOURCES } from "../../../../Queries/Resource";
import TemplateBoardCardPicker from "../Assignments/TemplateBoardCardPicker";

function getTemplateCardIds(resource, templateBoardId) {
  if (!resource?.proposalCards || !templateBoardId) return [];
  return (resource.proposalCards || [])
    .filter((c) => c?.section?.board?.id === templateBoardId)
    .map((c) => c.id)
    .filter(Boolean);
}

export default function ConnectResourceToCardModal({
  open,
  onClose,
  resource,
  myclass,
  onSuccess,
}) {
  const { t } = useTranslation("classes");
  const client = useApolloClient();
  const templateBoardId = myclass?.templateProposal?.id;
  const [selectedCardIds, setSelectedCardIds] = useState([]);

  useEffect(() => {
    if (open && resource && templateBoardId) {
      setSelectedCardIds(getTemplateCardIds(resource, templateBoardId));
    }
  }, [open, resource?.id, templateBoardId, resource?.proposalCards]);

  const handleToggleCard = (cardId) => {
    setSelectedCardIds((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  };


  const [updateResource] = useMutation(UPDATE_RESOURCE, {
    refetchQueries: [{ query: GET_CLASS_RESOURCES, variables: { classId: myclass?.id } }],
  });

  const [setResourceTemplateCards, { loading: linkLoading }] = useMutation(
    SET_RESOURCE_TEMPLATE_CARDS,
    {
      refetchQueries: [{ query: GET_CLASS_RESOURCES, variables: { classId: myclass?.id } }],
    }
  );

  const handleSave = async () => {
    if (!resource?.id || !myclass?.id) return;
    const alreadyInClass = (resource.classes || []).some((c) => c?.id === myclass?.id);
    try {
      await setResourceTemplateCards({
        variables: {
          resourceId: resource.id,
          templateCardIds: selectedCardIds,
          classId: myclass.id,
        },
      });
      if (selectedCardIds.length > 0 && !alreadyInClass) {
        await updateResource({
          variables: {
            id: resource.id,
            classes: { connect: [{ id: myclass.id }] },
          },
        });
      }
      await client.refetchQueries({
        include: [{ query: GET_CLASS_RESOURCES, variables: { classId: myclass?.id } }],
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleClose = () => {
    setSelectedCardIds([]);
    onClose();
  };

  const handleDisconnect = async () => {
    if (!resource?.id || !myclass?.id || !templateBoardId) return;
    try {
      await setResourceTemplateCards({
        variables: {
          resourceId: resource.id,
          templateCardIds: [],
          classId: myclass.id,
        },
      });
      await client.refetchQueries({
        include: [{ query: GET_CLASS_RESOURCES, variables: { classId: myclass?.id } }],
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  const templateCardsWithResource = (resource?.proposalCards || []).filter(
    (c) => c?.section?.board?.id === templateBoardId
  );
  const hasLinkedCards = templateCardsWithResource.length > 0;

  const isBusy = linkLoading;

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
          <span>{t("resource.connectModal.title", "Connect resource to card")}</span>
        </Modal.Header>
        <Modal.Content>
          <StyledModal>
            <p>{t("resource.connectModal.noTemplate", "No template board for this class.")}</p>
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
            {t("resource.connectModal.cancel", "Cancel")}
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
        <span>{t("resource.connectModal.title", "Connect resource to card")}</span>
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
              "resource.connectModal.descriptionMulti",
              "Select one or more cards to link this resource to. Toggle chips to add or remove."
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
          {t("resource.connectModal.cancel", "Cancel")}
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
              {t("resource.connectModal.disconnect", "Disconnect from card")}
            </Button>
          )}
          <Button
            loading={linkLoading}
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
            {t("resource.connectModal.save", "Save")}
          </Button>
        </div>
      </Modal.Actions>
    </Modal>
  );
}
