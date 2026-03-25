import { useState } from "react";
import { Modal } from "semantic-ui-react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";
import Button from "../../../../DesignSystem/Button";
import {
  mergeResourceSettings,
  isPublishedToClassId,
  UPDATE_RESOURCE,
  SET_RESOURCE_TEMPLATE_CARDS,
} from "../../../../Mutations/Resource";
import { GET_CLASS_RESOURCES } from "../../../../Queries/Resource";
import TemplateBoardCardPicker from "../Assignments/TemplateBoardCardPicker";

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

const CardPickerContainer = styled.div`
  padding: 16px;
  background: #f6f9f8;
  border-radius: 16px;
  border: 1px solid #336f8a;
`;

export default function BulkActionsModal({
  open,
  onClose,
  selectedResources,
  myclass,
  onSuccess,
}) {
  const { t } = useTranslation("classes");
  const [showChangeCard, setShowChangeCard] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [applying, setApplying] = useState(false);

  const classId = myclass?.id;
  const templateBoardId = myclass?.templateProposal?.id;

  const refetch = [{ query: GET_CLASS_RESOURCES, variables: { classId } }];

  const [updateResource] = useMutation(UPDATE_RESOURCE, {
    refetchQueries: refetch,
  });

  const [setResourceTemplateCards] = useMutation(SET_RESOURCE_TEMPLATE_CARDS, {
    refetchQueries: refetch,
  });

  const unpublished = (selectedResources || []).filter(
    (r) => r?.id && classId && !isPublishedToClassId(r?.settings, classId)
  );
  const published = (selectedResources || []).filter(
    (r) => r?.id && classId && isPublishedToClassId(r?.settings, classId)
  );
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
    if (!canPublishAll || !classId) return;
    if (
      !confirm(
        t(
          "resource.bulkActionsModal.confirmPublishAll",
          "Publish all selected resources? Students will see them in their class."
        )
      )
    )
      return;
    runSequentially(async () => {
      for (const r of unpublished) {
        if (!r?.id) continue;
        const merged = mergeResourceSettings(r.settings);
        const ids = [...(merged.publishedToClassIds || [])];
        if (!ids.includes(classId)) ids.push(classId);
        await updateResource({
          variables: {
            id: r.id,
            settings: { ...merged, publishedToClassIds: ids },
          },
        });
      }
    });
  };

  const handleUnpublishAll = () => {
    if (!canUnpublishAll || !classId) return;
    if (
      !confirm(
        t(
          "resource.bulkActionsModal.confirmUnpublishAll",
          "Unpublish all selected? Students will no longer see these resources."
        )
      )
    )
      return;
    runSequentially(async () => {
      for (const r of published) {
        if (!r?.id) continue;
        const merged = mergeResourceSettings(r.settings);
        const ids = [...(merged.publishedToClassIds || [])];
        const idx = ids.indexOf(classId);
        if (idx !== -1) ids.splice(idx, 1);
        await updateResource({
          variables: {
            id: r.id,
            settings: { ...merged, publishedToClassIds: ids },
          },
        });
      }
    });
  };

  const handleApplyCardToAll = () => {
    if (!selectedCardId || !classId || (selectedResources || []).length === 0)
      return;
    runSequentially(async () => {
      for (const r of selectedResources) {
        if (r?.id) {
          await setResourceTemplateCards({
            variables: {
              resourceId: r.id,
              templateCardIds: [selectedCardId],
              classId,
            },
          });
        }
      }
    });
  };

  const handleDisconnectAll = () => {
    if ((selectedResources || []).length === 0 || !classId) return;
    if (
      !confirm(
        t(
          "resource.bulkActionsModal.confirmDisconnectAll",
          "Disconnect all selected resources from their project cards?"
        )
      )
    )
      return;
    runSequentially(async () => {
      for (const r of selectedResources) {
        if (r?.id) {
          await setResourceTemplateCards({
            variables: {
              resourceId: r.id,
              templateCardIds: [],
              classId,
            },
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

  const count = (selectedResources || []).length;

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
          {t("resource.bulkActionsModal.title", "Bulk actions")} ({count})
        </span>
      </Modal.Header>

      <Modal.Content scrolling>
        <Section>
          <SectionTitle>
            {t("resource.publishUnpublish", "Publish/Unpublish")}
          </SectionTitle>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-start",
              gap: 12,
            }}
          >
            <Button variant="outline"
              type="button"
              onClick={handlePublishAll}
              disabled={!canPublishAll || applying}
            >
              {t("resource.bulkActionsModal.publishAll", "Publish all selected")}
            </Button>
            <Button variant="outline"
              type="button"
              onClick={handleUnpublishAll}
              disabled={!canUnpublishAll || applying}
            >
              {t(
                "resource.bulkActionsModal.unpublishAll",
                "Unpublish all selected"
              )}
            </Button>
          </div>
        </Section>

        <Section>
          <SectionTitle>
            {t(
              "resource.bulkActionsModal.changeProjectCard",
              "Change associated Project card"
            )}
          </SectionTitle>
          <Button variant="outline"
            type="button"
            onClick={handleDisconnectAll}
            disabled={count === 0 || applying}
          >
            {t(
              "resource.bulkActionsModal.disconnectFromCards",
              "Disconnect from cards"
            )}
          </Button>
          {!showChangeCard ? (
            <Button variant="outline"
              type="button"
              onClick={() => setShowChangeCard(true)}
              disabled={!templateBoardId || applying}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              {t(
                "resource.bulkActionsModal.changeProjectCard",
                "Change associated Project card"
              )}
            </Button>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                borderTop: "1px solid #E6E6E6",
                paddingTop: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Button variant="outline"
                  type="button"
                  onClick={() => setShowChangeCard(false)}
                  disabled={applying}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  {t("resource.bulkActionsModal.cancel", "Cancel")}
                </Button>
                <Button variant="tonal"
                  type="button"
                  onClick={handleApplyCardToAll}
                  disabled={!selectedCardId || applying}
                >
                  {applying
                    ? t("resource.bulkActionsModal.applying", "Applying…")
                    : t("resource.bulkActionsModal.applyToCount", {
                        count,
                        default: "Apply to {{count}} resources",
                      })}
                </Button>
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
        <Button variant="outline" type="button" onClick={handleClose} disabled={applying}>
          {t("resource.cancel", "Cancel")}
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
