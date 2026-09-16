"use client";

import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import PanelHeader from "../../DesignSystem/PanelHeader";
import FormDefinitionPreview from "./FormDefinitionPreview";
import { milestoneHasReviewQuestionnaire } from "../../../lib/milestones";

/**
 * Same chrome as the review-form wizard so the right column keeps one look
 * whether the teacher is editing or previewing.
 */
const PanelShell = styled.section`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  box-sizing: border-box;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  border-radius: 12px;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  overflow: hidden;

  .DesignSystem-PanelHeader {
    padding: 10px 14px;
    border-bottom: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  }
`;

const PanelBody = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 14px;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const PanelFooter = styled.footer`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: wrap;
  padding: 10px 14px;
  border-top: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
`;

/**
 * Read-only review-form preview rendered inline in the milestone right column.
 *
 * @param {boolean} open - Renders nothing when false.
 * @param {() => void} onClose - Closes the panel from the header cross.
 * @param {object} board - Board the milestone belongs to.
 * @param {object} milestone - Milestone whose linked form is previewed.
 * @param {string} [actionLabel] - Milestone title shown in the header.
 * @param {(() => void)|null} [onEdit] - Shows an "Edit form" footer action.
 * @param {boolean} [editBusy=false]
 * @param {(() => void)|null} [onCopy] - Takes precedence over `onEdit`.
 * @param {boolean} [copyBusy=false]
 */
export default function FormDefinitionPreviewPanel({
  open,
  onClose,
  board,
  milestone,
  actionLabel,
  onEdit,
  editBusy = false,
  onCopy,
  copyBusy = false,
}) {
  const { t } = useTranslation("classes");

  if (!open) return null;

  const hasQuestionnaire = milestoneHasReviewQuestionnaire(milestone);

  const title = hasQuestionnaire
    ? t(
        "projects.milestonesMenu.previewModalTitle",
        { action: actionLabel || "" },
        { default: "Review form — {{action}}" }
      )
    : t(
        "projects.milestonesMenu.previewModalTitleNoForm",
        { action: actionLabel || "" },
        { default: "{{action}}" }
      );

  const footerAction = onCopy || onEdit;
  const footerBusy = onCopy ? copyBusy : editBusy;
  const footerBusyLabel = onCopy
    ? t("projects.milestonesMenu.copyingMilestone", {}, {
        default: "Copying…",
      })
    : t("projects.milestonesMenu.openingEditor", {}, {
        default: "Opening editor…",
      });
  const footerLabel = onCopy
    ? t("projects.milestonesMenu.copyToCustomize", {}, {
        default: "Copy milestone to customize",
      })
    : t("projects.milestonesMenu.editForm", {}, {
        default: "Edit form",
      });

  return (
    <PanelShell aria-label={title}>
      <PanelHeader
        title={title}
        onClose={onClose}
        closeLabel={t("main.close", {}, { default: "Close" })}
      />
      <PanelBody>
        <FormDefinitionPreview
          board={board}
          milestone={milestone}
          proposalBoardId={board?.id}
          maxHeight="none"
        />
      </PanelBody>
      {footerAction ? (
        <PanelFooter>
          <Button
            type="button"
            variant="filled"
            disabled={footerBusy || !milestone?.id}
            onClick={footerAction}
          >
            {footerBusy ? footerBusyLabel : footerLabel}
          </Button>
        </PanelFooter>
      ) : null}
    </PanelShell>
  );
}
