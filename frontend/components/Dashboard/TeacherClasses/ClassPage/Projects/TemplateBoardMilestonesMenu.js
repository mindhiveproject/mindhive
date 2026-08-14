import { useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import DropdownMenu from "../../../../DesignSystem/DropdownMenu";
import FormDefinitionPreviewModal from "../../../../Forms/DefinitionForm/FormDefinitionPreviewModal";
import TeacherFormWizard from "../../../../Forms/TeacherFormWizard";
import TemplateBoardMilestonesManageModal from "../Modals/TemplateBoardMilestonesManageModal";
import { DELETE_CARD } from "../../../../Mutations/Proposal";
import { FORK_REVIEW_FORM_FOR_BOARD } from "../../../../Mutations/FormDefinition";
import { CLASS_TEMPLATE_PROJECTS_QUERY } from "../../../../Queries/Proposal";
import {
  CREATE_TEMPLATE_MILESTONE,
  RESOLVE_MILESTONES_FOR_BOARD,
} from "../../../../Queries/Milestone";
import { useBoardMilestones } from "../../../../../lib/useBoardMilestones";
import { getCurriculumType } from "../../../../../lib/curriculumTypes";
import {
  milestoneHasReviewQuestionnaire,
  resolveReviewFormKey,
} from "../../../../../lib/milestones";
import ActionCardTypeBadge from "../utils/ActionCardTypeBadge";
import {
  getActionCardsFromBoard,
  getActionCardLabel,
  getMilestonesForTemplateBoard,
  resolveActionCardMilestone,
} from "../../../../../lib/templateBoardActionCards";

const MANAGE_MILESTONES_ICON = (
  <img
    src="/assets/icons/settings.svg"
    alt=""
    width={18}
    height={18}
    aria-hidden
    style={{ display: "block" }}
  />
);

function buildAddMilestoneHref(classCode, boardId) {
  return {
    pathname: `/dashboard/myclasses/${classCode}`,
    query: {
      page: "projects",
      action: "edit",
      board: boardId,
      addMilestone: "1",
    },
  };
}

export default function TemplateBoardMilestonesMenu({ board, classCode, classId }) {
  const { t } = useTranslation("classes");
  const { t: tBuilder } = useTranslation("builder");
  const router = useRouter();
  const [manageOpen, setManageOpen] = useState(false);
  const [previewTarget, setPreviewTarget] = useState(null);
  const [deletingCardId, setDeletingCardId] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardDefinitionId, setWizardDefinitionId] = useState(null);
  const [wizardMilestoneKey, setWizardMilestoneKey] = useState(null);
  const [editingMilestoneId, setEditingMilestoneId] = useState(null);
  const [copyingMilestoneId, setCopyingMilestoneId] = useState(null);

  const actionCards = useMemo(() => getActionCardsFromBoard(board), [board]);

  const { milestones } = useBoardMilestones(board?.id, {
    skip: !board?.id,
  });
  const boardMilestones = useMemo(
    () => getMilestonesForTemplateBoard(board, milestones),
    [board, milestones]
  );
  const count = boardMilestones.length;

  const [deleteCard] = useMutation(DELETE_CARD, {
    refetchQueries: classId
      ? [{ query: CLASS_TEMPLATE_PROJECTS_QUERY, variables: { classId } }]
      : [],
  });
  const [forkReviewForm] = useMutation(FORK_REVIEW_FORM_FOR_BOARD);
  const [createTemplateMilestone] = useMutation(CREATE_TEMPLATE_MILESTONE);

  const boardRefetchQueries = [
    ...(classId
      ? [{ query: CLASS_TEMPLATE_PROJECTS_QUERY, variables: { classId } }]
      : []),
    ...(board?.id
      ? [
          {
            query: RESOLVE_MILESTONES_FOR_BOARD,
            variables: { boardId: board.id },
          },
        ]
      : []),
  ];

  const openWizard = (definitionId, milestoneKey) => {
    setPreviewTarget(null);
    setManageOpen(false);
    setWizardDefinitionId(definitionId);
    setWizardMilestoneKey(milestoneKey || null);
    setWizardOpen(true);
  };

  const openEditForm = async ({ card, milestone }) => {
    if (!board?.id || !milestone?.id || editingMilestoneId) return;
    if (milestone?.scope !== "template") return;
    if (!milestoneHasReviewQuestionnaire(milestone)) return;
    setEditingMilestoneId(milestone.id);
    try {
      const alreadyOnBoard =
        milestone.formDefinition?.scope === "project_board" &&
        milestone.formDefinition?.id;
      if (alreadyOnBoard) {
        openWizard(milestone.formDefinition.id, milestone.key);
        return;
      }
      const result = await forkReviewForm({
        variables: {
          templateBoardId: board.id,
          milestoneId: milestone.id,
        },
        refetchQueries: boardRefetchQueries,
      });
      const forked = result?.data?.forkReviewFormForBoard;
      if (!forked?.id) {
        throw new Error("Could not open the review form for editing.");
      }
      openWizard(forked.id, milestone.key);
    } catch (err) {
      alert(err?.message);
    } finally {
      setEditingMilestoneId(null);
    }
  };

  const copyMilestoneToCustomize = async ({ card, milestone, section }) => {
    if (!board?.id || !milestone?.id || copyingMilestoneId) return;
    if (milestone.scope === "template") return;
    if (!milestoneHasReviewQuestionnaire(milestone)) return;
    const sectionId =
      section?.id ||
      actionCards.find(({ card: actionCard }) => actionCard.id === card?.id)
        ?.section?.id;
    if (!sectionId) {
      alert(
        t(
          "projects.milestonesMenu.copyNeedsColumn",
          {},
          { default: "This milestone needs a column before it can be copied." }
        )
      );
      return;
    }
    setCopyingMilestoneId(milestone.id);
    try {
      const sourceTitle =
        milestone.title || getActionCardLabel(card, tBuilder) || "";
      const result = await createTemplateMilestone({
        variables: {
          input: {
            templateBoardId: board.id,
            title: t(
              "projects.milestonesMenu.copyTitle",
              { title: sourceTitle },
              { default: "{{title}} (copy)" }
            ),
            description: milestone.description || "",
            sectionId,
            clonedFromMilestoneId: milestone.id,
            sourceFormDefinitionKey: resolveReviewFormKey(
              milestone,
              getCurriculumType(board)
            ),
            canReviewPermissionNames: (milestone.canReview || [])
              .map((permission) => permission?.name)
              .filter(Boolean),
            showInFeedbackCenter: true,
            statusTarget: "board",
          },
        },
        refetchQueries: boardRefetchQueries,
        awaitRefetchQueries: true,
      });
      const created = result?.data?.createTemplateMilestone;
      if (!created?.formDefinition?.id) {
        throw new Error("Could not copy this milestone.");
      }
      openWizard(created.formDefinition.id, created.key);
    } catch (err) {
      alert(err?.message);
    } finally {
      setCopyingMilestoneId(null);
    }
  };

  const handleDeleteCard = async (card, actionLabel) => {
    if (!card?.id) return;

    const confirmed = window.confirm(
      t(
        "projects.milestonesMenu.confirmDeleteMilestone",
        { action: actionLabel },
        {
          default:
            "Remove {{action}} from this template? The review step card will be deleted from the board. The milestone definition itself will not be deleted.",
        }
      )
    );
    if (!confirmed) return;

    setDeletingCardId(card.id);
    try {
      await deleteCard({ variables: { id: card.id } });
      if (previewTarget?.card?.id === card.id) {
        setPreviewTarget(null);
      }
    } catch (err) {
      alert(err?.message);
    } finally {
      setDeletingCardId(null);
    }
  };

  const goToAddMilestone = () => {
    if (!classCode || !board?.id) return;
    router.push(buildAddMilestoneHref(classCode, board.id));
  };

  const openPreview = ({ card, milestone, actionLabel }) => {
    setPreviewTarget({
      card,
      milestone: milestone || resolveActionCardMilestone(card, milestones),
      actionLabel,
    });
  };

  const buildMenuItems = () => {
    const items = [];

    if (count === 0) {
      items.push({
        key: "empty",
        static: true,
        label: t("projects.milestonesMenu.empty", {}, {
          default: "No review steps on this template yet.",
        }),
      });
    } else {
      boardMilestones.forEach((milestone) => {
        const card = actionCards.find(({ card: actionCard }) => {
          const resolved = resolveActionCardMilestone(actionCard, milestones);
          if (!resolved) return false;
          if (milestone.id && resolved.id === milestone.id) return true;
          return (
            milestone.key &&
            resolved.key &&
            String(resolved.key).toLowerCase() ===
              String(milestone.key).toLowerCase()
          );
        })?.card;
        const actionLabel = card
          ? getActionCardLabel(card, tBuilder)
          : milestone.title || milestone.key;
        items.push({
          key: `milestone-${milestone.id || milestone.key}`,
          label: (
            <>
              {actionLabel}
              {card ? (
                <>
                  {" · "}
                  <ActionCardTypeBadge card={card} />
                </>
              ) : null}
            </>
          ),
          onClick: () => {
            openPreview({
              card,
              milestone,
              actionLabel,
            });
          },
        });
      });
    }

    items.push({
      key: "manage",
      icon: MANAGE_MILESTONES_ICON,
      label: t("projects.milestonesMenu.manageMilestones", {}, {
        default: "Manage milestones",
      }),
      onClick: () => setManageOpen(true),
    });

    return items;
  };

  const previewMilestone =
    previewTarget?.milestone ||
    (previewTarget?.card
      ? resolveActionCardMilestone(previewTarget.card, milestones)
      : null);
  const previewIsCustom = previewMilestone?.scope === "template";
  const previewHasQuestionnaire =
    milestoneHasReviewQuestionnaire(previewMilestone);

  const panelHeader =
    count === 0
      ? null
      : t("projects.milestonesMenu.clickHint", {}, {
          default: "Click a milestone to see its associated review form.",
        });

  return (
    <>
      <DropdownMenu
        ariaLabel={t("projects.milestonesMenu.ariaLabel", {}, {
          default: "Review steps",
        })}
        panelStyle={{ minWidth: 280 }}
        panelHeader={panelHeader}
        triggerStyle={{
          gap: "2px",
          padding: "6px 10px",
          minWidth: "auto",
        }}
        trigger={
          <span
            style={{
              fontSize: "14px",
              lineHeight: "16px",
              fontWeight: 500,
            }}
          >
            {t(
              "projects.milestonesMenu.trigger",
              { count },
              { default: "{{count}} milestones" }
            )}
          </span>
        }
        items={buildMenuItems()}
      />

      <TemplateBoardMilestonesManageModal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        board={board}
        actionCards={actionCards}
        milestones={milestones}
        onPreview={(target) => {
          setManageOpen(false);
          openPreview(target);
        }}
        onEdit={openEditForm}
        onCopy={copyMilestoneToCustomize}
        onAddMilestone={() => {
          setManageOpen(false);
          goToAddMilestone();
        }}
        onDeleteCard={handleDeleteCard}
        deletingCardId={deletingCardId}
        editingMilestoneId={editingMilestoneId}
        copyingMilestoneId={copyingMilestoneId}
      />

      <FormDefinitionPreviewModal
        open={!!previewTarget}
        onClose={() => setPreviewTarget(null)}
        board={board}
        milestone={previewMilestone}
        actionLabel={previewTarget?.actionLabel}
        onEdit={
          previewMilestone?.id &&
          previewHasQuestionnaire &&
          previewIsCustom
            ? () =>
                openEditForm({
                  card: previewTarget?.card,
                  milestone: previewMilestone,
                })
            : undefined
        }
        editBusy={
          !!previewMilestone?.id &&
          editingMilestoneId === previewMilestone.id
        }
        onCopy={
          previewMilestone?.id &&
          previewHasQuestionnaire &&
          !previewIsCustom
            ? () =>
                copyMilestoneToCustomize({
                  card: previewTarget?.card,
                  milestone: previewMilestone,
                })
            : undefined
        }
        copyBusy={
          !!previewMilestone?.id &&
          copyingMilestoneId === previewMilestone.id
        }
      />

      <TeacherFormWizard
        open={wizardOpen}
        onClose={() => {
          setWizardOpen(false);
          setWizardDefinitionId(null);
          setWizardMilestoneKey(null);
        }}
        mode="review"
        proposalBoardId={board?.id}
        milestoneKey={wizardMilestoneKey}
        definitionId={wizardDefinitionId}
      />
    </>
  );
}
