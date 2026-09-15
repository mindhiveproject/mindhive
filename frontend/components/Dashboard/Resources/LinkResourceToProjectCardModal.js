import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useApolloClient } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import Modal from "../../DesignSystem/Modal";
import Button from "../../DesignSystem/Button";
import DropdownSelect from "../../DesignSystem/DropdownSelect";
import { StarFilledIcon } from "../../DesignSystem/Icons";
import TemplateBoardCardPicker from "../TeacherClasses/ClassPage/Assignments/TemplateBoardCardPicker";
import {
  compareClassesByFavoriteThenDate,
  getFavoriteClassIds,
} from "../ClassFavoriteButton";
import { GET_USER_CLASSES } from "../../Queries/User";
import { GET_MY_RESOURCES } from "../../Queries/Resource";
import {
  UPDATE_RESOURCE,
  SET_RESOURCE_TEMPLATE_CARDS,
} from "../../Mutations/Resource";
import {
  getClassTemplateBoards,
  getPrimaryTemplateBoardId,
} from "../../../lib/classTemplateBoards";

function getTemplateCardIds(resource, templateBoardId) {
  if (!resource?.proposalCards || !templateBoardId) return [];
  return (resource.proposalCards || [])
    .filter((c) => c?.section?.board?.id === templateBoardId)
    .map((c) => c.id)
    .filter(Boolean);
}

function mergeTeacherMentorClasses(authenticatedItem) {
  const byId = new Map();
  for (const cls of [
    ...(authenticatedItem?.teacherIn || []),
    ...(authenticatedItem?.teachingTeamIn || []),
    ...(authenticatedItem?.mentorIn || []),
  ]) {
    if (cls?.id && !byId.has(cls.id)) {
      byId.set(cls.id, cls);
    }
  }
  return Array.from(byId.values());
}

/**
 * Resource Center modal: pick class → template board → project cards to link.
 */
export default function LinkResourceToProjectCardModal({
  open,
  onClose,
  resource,
  user,
  onSuccess,
}) {
  const { t } = useTranslation("classes");
  const client = useApolloClient();

  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [selectedCardIds, setSelectedCardIds] = useState([]);

  const { data: classesData, loading: classesLoading } = useQuery(
    GET_USER_CLASSES,
    { skip: !open }
  );

  const favoriteClassIds = useMemo(() => getFavoriteClassIds(user), [user]);

  const classes = useMemo(() => {
    const merged = mergeTeacherMentorClasses(classesData?.authenticatedItem);
    return [...merged].sort((a, b) =>
      compareClassesByFavoriteThenDate(a, b, favoriteClassIds)
    );
  }, [classesData?.authenticatedItem, favoriteClassIds]);

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) || null,
    [classes, selectedClassId]
  );

  const templateBoards = useMemo(
    () => getClassTemplateBoards(selectedClass),
    [selectedClass]
  );

  useEffect(() => {
    if (!open) return;
    setSelectedClassId("");
    setSelectedBoardId("");
    setSelectedCardIds([]);
  }, [open, resource?.id]);

  useEffect(() => {
    if (!open || !selectedClassId) {
      setSelectedBoardId("");
      setSelectedCardIds([]);
      return;
    }
    const primaryId = getPrimaryTemplateBoardId(selectedClass);
    const boards = getClassTemplateBoards(selectedClass);
    const nextBoardId =
      (primaryId && boards.some((b) => b.id === primaryId) && primaryId) ||
      boards[0]?.id ||
      "";
    setSelectedBoardId(nextBoardId);
  }, [open, selectedClassId, selectedClass]);

  useEffect(() => {
    if (!open || !selectedBoardId) {
      setSelectedCardIds([]);
      return;
    }
    setSelectedCardIds(getTemplateCardIds(resource, selectedBoardId));
  }, [open, selectedBoardId, resource]);

  const handleToggleCard = (cardId) => {
    setSelectedCardIds((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId]
    );
  };

  const refetchMyResources = {
    query: GET_MY_RESOURCES,
    variables: { id: user?.id },
  };

  const [updateResource] = useMutation(UPDATE_RESOURCE, {
    refetchQueries: [refetchMyResources],
  });

  const [setResourceTemplateCards, { loading: linkLoading }] = useMutation(
    SET_RESOURCE_TEMPLATE_CARDS,
    {
      refetchQueries: [refetchMyResources],
    }
  );

  const handleClose = () => {
    setSelectedClassId("");
    setSelectedBoardId("");
    setSelectedCardIds([]);
    onClose();
  };

  const handleSave = async () => {
    if (!resource?.id || !selectedClassId || !selectedBoardId) return;
    const alreadyInClass = (resource.classes || []).some(
      (c) => c?.id === selectedClassId
    );
    try {
      await setResourceTemplateCards({
        variables: {
          resourceId: resource.id,
          templateCardIds: selectedCardIds,
          classId: selectedClassId,
          templateBoardId: selectedBoardId,
        },
      });
      if (selectedCardIds.length > 0 && !alreadyInClass) {
        await updateResource({
          variables: {
            id: resource.id,
            classes: { connect: [{ id: selectedClassId }] },
          },
        });
      }
      await client.refetchQueries({ include: [refetchMyResources] });
      onSuccess?.();
      handleClose();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDisconnect = async () => {
    if (!resource?.id || !selectedClassId || !selectedBoardId) return;
    try {
      await setResourceTemplateCards({
        variables: {
          resourceId: resource.id,
          templateCardIds: [],
          classId: selectedClassId,
          templateBoardId: selectedBoardId,
        },
      });
      await client.refetchQueries({ include: [refetchMyResources] });
      onSuccess?.();
      handleClose();
    } catch (err) {
      alert(err.message);
    }
  };

  const linkedOnBoard = getTemplateCardIds(resource, selectedBoardId);
  const hasLinkedCards = linkedOnBoard.length > 0;
  const isBusy = linkLoading;

  const classOptions = classes.map((cls) => {
    const name = cls.title || cls.code || cls.id;
    const isFavorite = favoriteClassIds.has(cls.id);
    return {
      value: cls.id,
      labelText: isFavorite ? `★ ${name}` : name,
      label: isFavorite ? (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            minWidth: 0,
          }}
        >
          <StarFilledIcon
            width={16}
            height={16}
            style={{
              flexShrink: 0,
              color: "var(--MH-Theme-Status-Warning-base, #F5B800)",
            }}
            aria-hidden
          />
          <span style={{ minWidth: 0 }}>{name}</span>
        </span>
      ) : (
        name
      ),
    };
  });

  const boardOptions = templateBoards.map((board) => ({
    value: board.id,
    label:
      board.title ||
      t("boardManagement.linkToProjectCard.untitledBoard", {}, {
        default: "Untitled board",
      }),
  }));

  const filterLabelStyle = {
    display: "grid",
    gap: 8,
    marginBottom: 16,
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="large"
      title={t("boardManagement.linkToProjectCard.title", {}, {
        default: "Link to card",
      })}
      actions={
        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isBusy}
          >
            {t("resource.connectModal.cancel", {}, { default: "Cancel" })}
          </Button>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {hasLinkedCards && (
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={isBusy || !selectedBoardId}
              >
                {t("resource.connectModal.disconnect", {}, {
                  default: "Disconnect from card",
                })}
              </Button>
            )}
            <Button
              variant="filled"
              onClick={handleSave}
              disabled={isBusy || !selectedClassId || !selectedBoardId}
            >
              {t("resource.connectModal.save", {}, { default: "Save" })}
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <p style={{ margin: "0 0 8px" }}>
          {t("boardManagement.linkToProjectCard.description", {}, {
            default:
              "Choose a class and template board, then select one or more project cards to link this resource to.",
          })}
        </p>

        <div style={filterLabelStyle}>
          <span className="MH-Type-Title-Small" style={{ color: "var(--MH-Theme-Neutrals-Black, #171717)" }}>
            {t("boardManagement.linkToProjectCard.classLabel", {}, {
              default: "Class",
            })}
          </span>
          {classesLoading ? (
            <p style={{ margin: 0 }}>
              {t("assignment.connectModal.loading", {}, {
                default: "Loading...",
              })}
            </p>
          ) : classes.length === 0 ? (
            <p style={{ margin: 0 }}>
              {t("boardManagement.linkToProjectCard.noClasses", {}, {
                default:
                  "You are not teaching or mentoring any classes yet.",
              })}
            </p>
          ) : (
            <DropdownSelect
              value={selectedClassId}
              onChange={(next) => setSelectedClassId(next || "")}
              options={classOptions}
              placeholder={t(
                "boardManagement.linkToProjectCard.selectClassPlaceholder",
                {},
                { default: "Select a class" }
              )}
              ariaLabel={t("boardManagement.linkToProjectCard.classLabel", {}, {
                default: "Class",
              })}
              disabled={isBusy}
              searchableSingle
            />
          )}
        </div>

        {selectedClassId && (
          <div style={filterLabelStyle}>
            <span className="MH-Type-Title-Small" style={{ color: "var(--MH-Theme-Neutrals-Black, #171717)" }}>
              {t("boardManagement.linkToProjectCard.boardLabel", {}, {
                default: "Template board",
              })}
            </span>
            {templateBoards.length === 0 ? (
              <p style={{ margin: 0 }}>
                {t("boardManagement.linkToProjectCard.noBoards", {}, {
                  default: "No template board for this class.",
                })}
              </p>
            ) : (
              <DropdownSelect
                value={selectedBoardId}
                onChange={(next) => setSelectedBoardId(next || "")}
                options={boardOptions}
                placeholder={t(
                  "boardManagement.linkToProjectCard.selectBoardPlaceholder",
                  {},
                  { default: "Select a template board" }
                )}
                ariaLabel={t(
                  "boardManagement.linkToProjectCard.boardLabel",
                  {},
                  { default: "Template board" }
                )}
                disabled={isBusy}
                searchableSingle
              />
            )}
          </div>
        )}

        {selectedBoardId && (
          <TemplateBoardCardPicker
            templateBoardId={selectedBoardId}
            selectedCardIds={selectedCardIds}
            onToggleCard={handleToggleCard}
            disabled={isBusy}
            showDescription
            description={t(
              "resource.connectModal.descriptionMulti",
              {},
              {
                default:
                  "Select one or more cards to link this resource to. Toggle chips to add or remove.",
              }
            )}
          />
        )}
      </div>
    </Modal>
  );
}
