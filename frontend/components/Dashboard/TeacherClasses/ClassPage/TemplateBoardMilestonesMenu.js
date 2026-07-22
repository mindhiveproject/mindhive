import { useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import DropdownMenu from "../../../DesignSystem/DropdownMenu";
import FormDefinitionPreviewModal from "../../../Forms/DefinitionForm/FormDefinitionPreviewModal";
import TemplateBoardMilestonesManageModal from "./TemplateBoardMilestonesManageModal";
import { DELETE_CARD } from "../../../Mutations/Proposal";
import { CLASS_TEMPLATE_PROJECTS_QUERY } from "../../../Queries/Proposal";
import { useBoardMilestones } from "../../../../lib/useBoardMilestones";
import ActionCardTypeBadge from "./ActionCardTypeBadge";
import {
  getActionCardsFromBoard,
  getActionCardLabel,
  resolveActionCardMilestone,
} from "../../../../lib/templateBoardActionCards";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [previewTarget, setPreviewTarget] = useState(null);
  const [deletingCardId, setDeletingCardId] = useState(null);

  const actionCards = useMemo(() => getActionCardsFromBoard(board), [board]);
  const count = actionCards.length;

  const needsMilestones = menuOpen || manageOpen || !!previewTarget;
  const { milestones } = useBoardMilestones(board?.id, {
    skip: !board?.id || !needsMilestones,
  });

  const [deleteCard] = useMutation(DELETE_CARD, {
    refetchQueries: classId
      ? [{ query: CLASS_TEMPLATE_PROJECTS_QUERY, variables: { classId } }]
      : [],
  });

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
      actionCards.forEach(({ card }) => {
        const actionLabel = getActionCardLabel(card, tBuilder);
        items.push({
          key: `milestone-${card.id}`,
          label: (
            <>
              {actionLabel}
              {" · "}
              <ActionCardTypeBadge card={card} />
            </>
          ),
          onClick: () => {
            openPreview({
              card,
              milestone: resolveActionCardMilestone(card, milestones),
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
        onOpenChange={setMenuOpen}
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
        onAddMilestone={() => {
          setManageOpen(false);
          goToAddMilestone();
        }}
        onDeleteCard={handleDeleteCard}
        deletingCardId={deletingCardId}
      />

      <FormDefinitionPreviewModal
        open={!!previewTarget}
        onClose={() => setPreviewTarget(null)}
        board={board}
        milestone={previewMilestone}
        actionLabel={previewTarget?.actionLabel}
      />
    </>
  );
}
