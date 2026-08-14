import { useMemo, useState } from "react";
import { useMutation, useQuery, useApolloClient } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { UPDATE_CARD_CONTENT } from "../../Mutations/Proposal";
import { FORK_REVIEW_FORM_FOR_BOARD } from "../../Mutations/FormDefinition";
import {
  CREATE_TEMPLATE_MILESTONE,
  RESOLVE_MILESTONES_FOR_BOARD,
  UPDATE_TEMPLATE_MILESTONE,
} from "../../Queries/Milestone";
import { PROPOSAL_QUERY } from "../../Queries/Proposal";

import useForm from "../../../lib/useForm";
import { useBoardMilestones } from "../../../lib/useBoardMilestones";
import {
  resolveMilestoneFromCard,
  cardIncludedInReviewStep,
  isActionCard,
  parseCardSettings,
  isStudyStatusMilestone,
  milestoneHasReviewQuestionnaire,
  resolveReviewFormKey,
} from "../../../lib/milestones";
import {
  getActionCardLabel,
  isDefaultActionCard,
} from "../../../lib/templateBoardActionCards";
import { getCurriculumType } from "../../../lib/curriculumTypes";
import { isClassTemplateBoard } from "../../Utils/proposalBoard";

import FormDefinitionPreview from "../../Forms/DefinitionForm/FormDefinitionPreview";
import TeacherFormWizard from "../../Forms/TeacherFormWizard";
import ActionCardTypeBadge from "../../Dashboard/TeacherClasses/ClassPage/utils/ActionCardTypeBadge";
import InfoTooltip from "../../DesignSystem/InfoTooltip";
import Button from "../../DesignSystem/Button";

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #A1A1A1",
  borderRadius: 8,
  padding: "12px 16px",
  fontFamily: "Inter, sans-serif",
  fontSize: 16,
  lineHeight: "24px",
  color: "#171717",
};

const helperTextStyle = {
  margin: "8px 0 0",
  color: "#5D5763",
  fontSize: 14,
  lineHeight: "20px",
};

export default function ActionCardBuilder({
  proposal,
  proposalCard,
  closeCard,
  autoUpdateStudentBoards,
  propagateToClones,
  onTemplateChangedWithoutPropagation,
}) {
  const { t } = useTranslation("classes");
  const { t: tBuilder } = useTranslation("builder");
  const client = useApolloClient();
  const { milestones } = useBoardMilestones(proposal?.id);

  const { data: boardData, loading: boardLoading } = useQuery(PROPOSAL_QUERY, {
    variables: { id: proposal?.id },
    skip: !proposal?.id,
    fetchPolicy: "cache-first",
  });

  const boardWithSections = useMemo(() => {
    if (boardData?.proposalBoard?.sections) {
      return boardData.proposalBoard;
    }
    if (!proposal?.id) return proposal;
    try {
      const cached = client.readQuery({
        query: PROPOSAL_QUERY,
        variables: { id: proposal.id },
      });
      if (cached?.proposalBoard?.sections) {
        return cached.proposalBoard;
      }
    } catch {
      // Cache miss — useQuery will populate
    }
    return proposal;
  }, [boardData?.proposalBoard, client, proposal]);

  const milestone = useMemo(
    () => resolveMilestoneFromCard(proposalCard, milestones),
    [proposalCard, milestones]
  );

  const isDefault = isDefaultActionCard(proposalCard);
  const isCustom = isClassTemplateBoard(proposal) && !isDefault;
  const hasQuestionnaire = milestoneHasReviewQuestionnaire(milestone);
  const canEditForm =
    isClassTemplateBoard(proposal) &&
    milestone?.scope === "template" &&
    hasQuestionnaire &&
    !!milestone?.id;
  const canCopyForm =
    isClassTemplateBoard(proposal) &&
    milestone?.scope !== "template" &&
    hasQuestionnaire &&
    !!milestone?.id;

  const actionLabel = getActionCardLabel(proposalCard, tBuilder);

  const includedCards = useMemo(() => {
    const sections = [...(boardWithSections?.sections || [])].sort(
      (a, b) => (a?.position ?? 0) - (b?.position ?? 0)
    );
    return sections.flatMap((section) =>
      [...(section?.cards || [])]
        .sort((a, b) => (a?.position ?? 0) - (b?.position ?? 0))
        .filter((card) => {
          if (card?.id === proposalCard?.id || isActionCard(card)) {
            return false;
          }
          const settings = parseCardSettings(card);
          if (!settings?.includeInReport) return false;
          return cardIncludedInReviewStep(card, proposalCard, milestones);
        })
        .map((card) => ({ ...card, sectionTitle: section.title }))
    );
  }, [boardWithSections?.sections, proposalCard, milestones]);

  const includedCardsLoading =
    boardLoading && !(boardWithSections?.sections?.length > 0);

  const initialDescription =
    milestone?.description || proposalCard?.milestone?.description || "";

  const { inputs, handleChange } = useForm({
    title: proposalCard?.title || "",
    milestoneDescription: initialDescription,
  });

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardDefinitionId, setWizardDefinitionId] = useState(null);
  const [wizardMilestoneKey, setWizardMilestoneKey] = useState(null);
  const [editBusy, setEditBusy] = useState(false);

  const sectionId = useMemo(() => {
    for (const section of boardWithSections?.sections || []) {
      if ((section.cards || []).some((card) => card.id === proposalCard?.id)) {
        return section.id;
      }
    }
    return null;
  }, [boardWithSections?.sections, proposalCard?.id]);

  const [updateCard, { loading: updateLoading }] =
    useMutation(UPDATE_CARD_CONTENT);
  const [updateMilestone, { loading: milestoneLoading }] = useMutation(
    UPDATE_TEMPLATE_MILESTONE
  );
  const [forkReviewForm] = useMutation(FORK_REVIEW_FORM_FOR_BOARD);
  const [createTemplateMilestone] = useMutation(CREATE_TEMPLATE_MILESTONE);

  const boardRefetchQueries = proposal?.id
    ? [
        {
          query: RESOLVE_MILESTONES_FOR_BOARD,
          variables: { boardId: proposal.id },
        },
        { query: PROPOSAL_QUERY, variables: { id: proposal.id } },
      ]
    : [];

  const openEditForm = async () => {
    if (!canEditForm || !proposal?.id || !milestone?.id || editBusy) return;
    setEditBusy(true);
    try {
      if (milestone.formDefinition?.scope === "project_board") {
        setWizardDefinitionId(milestone.formDefinition.id);
        setWizardMilestoneKey(milestone.key || null);
        setWizardOpen(true);
        return;
      }
      const result = await forkReviewForm({
        variables: {
          templateBoardId: proposal.id,
          milestoneId: milestone.id,
        },
        refetchQueries: boardRefetchQueries,
      });
      const forked = result?.data?.forkReviewFormForBoard;
      if (!forked?.id) {
        throw new Error("Could not open the review form for editing.");
      }
      setWizardDefinitionId(forked.id);
      setWizardMilestoneKey(milestone.key || null);
      setWizardOpen(true);
    } catch (err) {
      alert(err?.message);
    } finally {
      setEditBusy(false);
    }
  };

  const copyMilestoneToCustomize = async () => {
    if (!canCopyForm || !proposal?.id || !milestone?.id || editBusy) return;
    if (!sectionId) {
      alert(
        t(
          "board.expendedCard.actionCard.copyNeedsColumn",
          {},
          { default: "This milestone needs a column before it can be copied." }
        )
      );
      return;
    }
    setEditBusy(true);
    try {
      const sourceTitle = milestone.title || actionLabel || "";
      const result = await createTemplateMilestone({
        variables: {
          input: {
            templateBoardId: proposal.id,
            title: t(
              "board.expendedCard.actionCard.copyTitle",
              { title: sourceTitle },
              { default: "{{title}} (copy)" }
            ),
            description: milestone.description || "",
            sectionId,
            clonedFromMilestoneId: milestone.id,
            sourceFormDefinitionKey: resolveReviewFormKey(
              milestone,
              getCurriculumType(boardWithSections || proposal)
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
      setWizardDefinitionId(created.formDefinition.id);
      setWizardMilestoneKey(created.key || null);
      setWizardOpen(true);
    } catch (err) {
      alert(err?.message);
    } finally {
      setEditBusy(false);
    }
  };

  const hasChanges = () => {
    if (!isCustom) return false;
    const titleEq =
      String(inputs?.title ?? "") === String(proposalCard?.title ?? "");
    const descEq =
      String(inputs?.milestoneDescription ?? "") === String(initialDescription);
    return !titleEq || !descEq;
  };

  const handleClose = async () => {
    if (!hasChanges()) {
      closeCard({ cardId: proposalCard?.id, lockedByUser: false });
      return;
    }
    await handleSave();
  };

  const handleSave = async () => {
    const hasClones = proposal?.prototypeFor?.length > 0;
    const shouldPropagate =
      hasClones && autoUpdateStudentBoards && propagateToClones;

    if (isCustom && milestone?.id) {
      const trimmedTitle = (inputs?.title || "").trim();
      const trimmedDesc = (inputs?.milestoneDescription || "").trim();
      const titleChanged = trimmedTitle !== (proposalCard?.title || "");
      const descChanged = trimmedDesc !== initialDescription;

      if (titleChanged) {
        await updateCard({
          variables: {
            id: proposalCard.id,
            title: trimmedTitle,
            type: proposalCard.type,
          },
        });
        await updateMilestone({
          variables: {
            input: {
              id: milestone.id,
              title: trimmedTitle,
            },
          },
          refetchQueries: [
            { query: PROPOSAL_QUERY, variables: { id: proposal?.id } },
          ],
        });
      }

      if (descChanged) {
        await updateMilestone({
          variables: {
            input: {
              id: milestone.id,
              description: trimmedDesc,
            },
          },
          refetchQueries: [
            { query: PROPOSAL_QUERY, variables: { id: proposal?.id } },
          ],
        });
      }
    }

    if (hasClones && !shouldPropagate) {
      onTemplateChangedWithoutPropagation?.();
    }

    if (shouldPropagate && propagateToClones) {
      try {
        await propagateToClones({ contentChangedCardIds: [] });
      } catch (e) {
        console.error("Propagate to clones failed:", e);
      }
    }

    closeCard({ cardId: proposalCard?.id, lockedByUser: false });
  };

  const saving = updateLoading || milestoneLoading;

  return (
    <div className="post">
      <div className="navigation-build-mode">
        <div className="left">
          <div
            className="icon"
            onClick={handleClose}
            style={{
              opacity: saving ? 0.6 : 1,
              pointerEvents: saving ? "none" : "auto",
            }}
          >
            <div className="selector">
              <img src="/assets/icons/back.svg" alt="back" />
            </div>
          </div>
        </div>
        <InfoTooltip
          content={proposal?.title || ""}
          wrapperStyle={{ minWidth: 0, width: "100%" }}
          tooltipStyle={{ maxWidth: "min(400px, 90vw)" }}
        >
          <div className="middle">
            <span className="studyTitle">{proposal?.title}</span>
          </div>
        </InfoTooltip>
        <div className="right">
          <div className="editModeMessage">
            {t("board.editMode", {}, { default: "You are in Edit Mode" })}
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="narrowButton"
            disabled={saving}
          >
            {t("board.save", {}, { default: "Save" })}
          </button>
        </div>
      </div>

      <div className="proposalCardBoard">
        <div className="textBoard">
          <div
            className="cardHeader"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {t(
              "board.expendedCard.actionCard.actionCardLabel",
              {},
              { default: "Review step" }
            )}
            <ActionCardTypeBadge card={proposalCard} />
          </div>

          {isCustom ? (
            <label htmlFor="actionCardTitle">
              <div className="cardHeader">{t("board.expendedCard.title")}</div>
              <input
                type="text"
                id="actionCardTitle"
                name="title"
                value={inputs?.title}
                onChange={handleChange}
                style={inputStyle}
              />
            </label>
          ) : (
            <div>
              <div className="cardHeader">{t("board.expendedCard.title")}</div>
              <p style={{ margin: "8px 0 0", fontSize: 16 }}>{actionLabel}</p>
            </div>
          )}

          {isCustom ? (
            <label htmlFor="milestoneDescription">
              <div className="cardHeader" style={{ marginTop: 16 }}>
                {t(
                  "board.expendedCard.actionCard.milestoneDescription",
                  {},
                  { default: "Description" }
                )}
              </div>
              <textarea
                id="milestoneDescription"
                name="milestoneDescription"
                value={inputs?.milestoneDescription}
                onChange={handleChange}
                style={{ ...inputStyle, minHeight: 96, resize: "vertical" }}
              />
            </label>
          ) : milestone?.description ? (
            <div style={{ marginTop: 16 }}>
              <div className="cardHeader">
                {t(
                  "board.expendedCard.actionCard.milestoneDescription",
                  {},
                  { default: "Description" }
                )}
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "#5D5763" }}>
                {milestone.description}
              </p>
            </div>
          ) : null}

          <div className="cardHeader" style={{ marginTop: 20 }}>
            {isStudyStatusMilestone(milestone)
              ? t(
                  "board.expendedCard.actionCard.studyLinkTitle",
                  {},
                  { default: "Study link" }
                )
              : t(
                  "board.expendedCard.actionCard.reviewFormPreview",
                  {},
                  { default: "Review form preview" }
                )}
          </div>
          <FormDefinitionPreview
            board={boardWithSections}
            milestone={milestone}
            proposalBoardId={proposal?.id}
            maxHeight={360}
          />

          {canCopyForm ? (
            <div style={{ marginTop: 12 }}>
              <Button
                type="button"
                variant="outline"
                disabled={editBusy}
                onClick={copyMilestoneToCustomize}
              >
                {editBusy
                  ? t(
                      "board.expendedCard.actionCard.copyingMilestone",
                      {},
                      { default: "Copying…" }
                    )
                  : t(
                      "board.expendedCard.actionCard.copyToCustomize",
                      {},
                      { default: "Copy milestone to customize" }
                    )}
              </Button>
              <p style={helperTextStyle}>
                {t(
                  "board.expendedCard.actionCard.copyToCustomizeHint",
                  {},
                  {
                    default:
                      "Default forms cannot be edited. Copy this milestone to create a custom review step you can change.",
                  }
                )}
              </p>
            </div>
          ) : null}

          {canEditForm ? (
            <div style={{ marginTop: 12 }}>
              <Button
                type="button"
                variant="outline"
                disabled={editBusy}
                onClick={openEditForm}
              >
                {editBusy
                  ? t(
                      "board.expendedCard.actionCard.openingEditor",
                      {},
                      { default: "Opening editor…" }
                    )
                  : t(
                      "board.expendedCard.actionCard.editReviewForm",
                      {},
                      { default: "Edit review form" }
                    )}
              </Button>
              <p style={helperTextStyle}>
                {t(
                  "board.expendedCard.actionCard.editReviewFormHint",
                  {},
                  {
                    default:
                      "Scoped to this template board. Student clones inherit whatever you publish.",
                  }
                )}
              </p>
            </div>
          ) : null}
        </div>

        <div className="infoBoard">
          <div className="cardHeader">
            {t(
              "board.expendedCard.actionCard.includedCardsTitle",
              {},
              { default: "Included in this review step" }
            )}
          </div>
          <p style={helperTextStyle}>
            {t(
              "board.expendedCard.actionCard.includedCardsHelper",
              {},
              {
                default:
                  "Students submit content from these proposal cards when they reach this action card. Configure inclusion on each proposal card's Student Answer Box settings.",
              }
            )}
          </p>
          {includedCardsLoading ? (
            <p style={helperTextStyle}>
              {t("board.loading", {}, { default: "Loading..." })}
            </p>
          ) : includedCards.length > 0 ? (
            <ul
              style={{
                margin: "12px 0 0",
                paddingLeft: 20,
                fontSize: 14,
                lineHeight: "24px",
              }}
            >
              {includedCards.map((card) => (
                <li key={card.id}>
                  {card.title || t("board.proposal", {}, { default: "Proposal" })}
                  {card.sectionTitle ? (
                    <span style={{ color: "#5D5763" }}>
                      {" "}
                      ({card.sectionTitle})
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ ...helperTextStyle, fontStyle: "italic" }}>
              {t(
                "board.expendedCard.actionCard.includedCardsEmpty",
                {},
                {
                  default:
                    "No proposal cards are configured for this review step yet.",
                }
              )}
            </p>
          )}
        </div>
      </div>
      <TeacherFormWizard
        open={wizardOpen}
        onClose={() => {
          setWizardOpen(false);
          setWizardDefinitionId(null);
          setWizardMilestoneKey(null);
        }}
        mode="review"
        proposalBoardId={proposal?.id}
        definitionId={wizardDefinitionId}
        milestoneKey={wizardMilestoneKey}
      />
    </div>
  );
}
