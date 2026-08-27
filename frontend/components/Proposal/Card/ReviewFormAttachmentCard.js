import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import Chip from "../../DesignSystem/Chip";
import {
  ConsentFormIcon,
  EditDocumentIcon,
} from "../../DesignSystem/Icons";
import { RESOLVE_FORM_DEFINITION } from "../../Queries/FormDefinition";
import { getCurriculumType } from "../../../lib/curriculumTypes";
import {
  milestoneHasReviewQuestionnaire,
  resolveReviewFormKey,
} from "../../../lib/milestones";

const cardStyle = {
  border: "1px solid #E6E6E6",
  borderRadius: 12,
  background: "#FFFFFF",
  padding: 16,
  width: "100%",
  boxSizing: "border-box",
};

const cardHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 12,
};

const titleStyle = {
  margin: 0,
  font: 'var(--MH-Type-Title-Base, 600 16px/24px "Inter", sans-serif)',
  letterSpacing: 0,
  color: "#171717",
};

const metaStyle = {
  margin: "4px 0 0",
  font: 'var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif)',
  letterSpacing: 0,
  color: "#5D5763",
};

const actionsStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

const scopeChipStyle = {
  background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
  border: "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  color: "var(--MH-Theme-Neutrals-Dark, #5D5763)",
};

const scopeIconStyle = {
  display: "block",
  width: 18,
  height: 18,
  color: "currentColor",
};

export default function ReviewFormAttachmentCard({
  board,
  milestone,
  isDefault = false,
  onPreview,
  onEdit,
  editBusy = false,
  editLabel,
}) {
  const { t } = useTranslation("classes");
  const curriculumType = getCurriculumType(board);

  const formKey = useMemo(() => {
    if (!milestone || !milestoneHasReviewQuestionnaire(milestone)) return null;
    if (milestone.formDefinition?.key) return milestone.formDefinition.key;
    return resolveReviewFormKey(milestone, curriculumType);
  }, [curriculumType, milestone]);

  const { data, loading } = useQuery(RESOLVE_FORM_DEFINITION, {
    variables: {
      key: formKey || "",
      organizationId: null,
      classNetworkId: null,
      proposalBoardId: board?.id || null,
    },
    skip: !formKey,
    fetchPolicy: "cache-and-network",
  });

  const definition = data?.resolveFormDefinition;
  const formTitle =
    definition?.title ||
    milestone?.title ||
    t("board.expendedCard.milestoneCard.reviewFormFallbackTitle", {}, {
      default: "Review form",
    });

  const scopeLabel = isDefault
    ? t("board.expendedCard.milestoneCard.formScopeDefault", {}, {
        default: "MindHive default form",
      })
    : t("board.expendedCard.milestoneCard.formScopeCustom", {}, {
        default: "Custom review form",
      });

  const scopeLeading = isDefault ? (
    <ConsentFormIcon width={18} height={18} style={scopeIconStyle} />
  ) : (
    <EditDocumentIcon width={18} height={18} style={scopeIconStyle} />
  );
  const questionCount = definition?.cards?.length ?? 0;
  const metaText = loading
    ? t("board.loading", {}, { default: "Loading..." })
    : questionCount > 0
      ? questionCount === 1
        ? t(
            "board.expendedCard.milestoneCard.formQuestionCountOne",
            {},
            { default: "1 question" }
          )
        : t(
            "board.expendedCard.milestoneCard.formQuestionCount",
            { count: questionCount },
            { default: "{{count}} questions" }
          )
      : t(
          "board.expendedCard.milestoneCard.formNoQuestionsYet",
          {},
          { default: "No questions yet" }
        );

  const previewLabel = t(
    "projects.milestonesMenu.previewForm",
    {},
    { default: "Preview review form" }
  );

  const resolvedEditLabel =
    editLabel ||
    (isDefault
      ? t(
          "board.expendedCard.milestoneCard.customizeMindHiveTemplate",
          {},
          { default: "Customize the MindHive template" }
        )
      : t(
          "board.expendedCard.actionCard.editReviewForm",
          {},
          { default: "Edit review form" }
        ));

  const openingLabel = t(
    "board.expendedCard.actionCard.openingEditor",
    {},
    { default: "Opening editor…" }
  );

  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <div style={{ minWidth: 0 }}>
          <p style={titleStyle}>{formTitle}</p>
          <p style={metaStyle}>{metaText}</p>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
          <Chip
            shape="square"
            label={scopeLabel}
            leading={scopeLeading}
            disabled
            style={scopeChipStyle}
          />
        </div>
      </div>
      <div style={actionsStyle}>
        <Button type="button" variant="outline" onClick={onPreview}>
          {previewLabel}
        </Button>
        {onEdit ? (
          <Button
            type="button"
            variant="filled"
            disabled={editBusy}
            onClick={onEdit}
          >
            {editBusy ? openingLabel : resolvedEditLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
