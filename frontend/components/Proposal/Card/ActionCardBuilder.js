import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useApolloClient } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import { UPDATE_CARD_CONTENT } from "../../Mutations/Proposal";
import { PUBLISH_FORM_DEFINITION } from "../../Mutations/FormDefinition";
import { UPDATE_TEMPLATE_MILESTONE } from "../../Queries/Milestone";
import {
  ADMIN_FORM_DEFINITION,
  SIBLING_FORM_DEFINITIONS,
} from "../../Queries/FormDefinition";
import { PROPOSAL_QUERY } from "../../Queries/Proposal";

import useForm from "../../../lib/useForm";
import { useBoardMilestones } from "../../../lib/useBoardMilestones";
import {
  resolveMilestoneFromCard,
  cardIncludedInReviewStep,
  isActionCard,
  parseCardSettings,
} from "../../../lib/milestones";
import {
  getActionCardLabel,
  isDefaultActionCard,
} from "../../../lib/templateBoardActionCards";
import { isClassTemplateBoard } from "../../Utils/proposalBoard";

import FormDefinitionPreview from "../../Forms/DefinitionForm/FormDefinitionPreview";
import FormDefinitionEditor from "../../Dashboard/Admin/Forms/FormDefinitionEditor";
import PublishModal from "../../Dashboard/Admin/Forms/PublishModal";
import ActionCardTypeBadge from "../../Dashboard/TeacherClasses/ClassPage/ActionCardTypeBadge";
import InfoTooltip from "../../DesignSystem/InfoTooltip";
import Button from "../../DesignSystem/Button";

const statusBadgeStyle = (status) => ({
  display: "inline-block",
  marginLeft: 8,
  padding: "2px 10px",
  borderRadius: 100,
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "#fff",
  background:
    status === "published"
      ? "#1d6b3a"
      : status === "draft"
        ? "#8a6d3b"
        : "#5f6871",
});

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
  const router = useRouter();
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
  const formDefinitionId = proposalCard?.milestone?.formDefinition?.id || null;
  const canEditFormCandidate =
    isClassTemplateBoard(proposal) && !isDefault && !!formDefinitionId;

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

  const [formDefinition, setFormDefinition] = useState(null);
  const [publishOpen, setPublishOpen] = useState(false);

  const { data: scopeCheckData, loading: scopeCheckLoading } = useQuery(
    ADMIN_FORM_DEFINITION,
    {
      variables: { id: formDefinitionId },
      skip: !canEditFormCandidate,
      fetchPolicy: "cache-and-network",
    }
  );

  const scopedDefinition = scopeCheckData?.formDefinition;
  const isScopedForm =
    scopedDefinition?.scope === "project_board" &&
    scopedDefinition?.proposalBoard?.id === proposal?.id;

  const showFormEditor =
    canEditFormCandidate && isScopedForm && !scopeCheckLoading;

  useEffect(() => {
    if (scopedDefinition) {
      setFormDefinition(scopedDefinition);
    }
  }, [scopedDefinition]);

  const { data: siblingData } = useQuery(SIBLING_FORM_DEFINITIONS, {
    variables: { key: formDefinition?.key },
    skip: !formDefinition?.key,
    fetchPolicy: "cache-and-network",
  });

  const liveSibling = useMemo(() => {
    if (!formDefinition) return null;
    const siblings = siblingData?.formDefinitions || [];
    return (
      siblings.find(
        (s) =>
          s.id !== formDefinition.id &&
          s.status === "published" &&
          s.scope === formDefinition.scope &&
          (s.organization?.id || null) ===
            (formDefinition.organization?.id || null) &&
          (s.classNetwork?.id || null) ===
            (formDefinition.classNetwork?.id || null) &&
          (s.proposalBoard?.id || null) ===
            (formDefinition.proposalBoard?.id || null)
      ) || null
    );
  }, [formDefinition, siblingData]);

  const refetchFormDefinitionQueries = useMemo(
    () =>
      formDefinitionId
        ? [
            {
              query: ADMIN_FORM_DEFINITION,
              variables: { id: formDefinitionId },
            },
            ...(formDefinition?.key
              ? [
                  {
                    query: SIBLING_FORM_DEFINITIONS,
                    variables: { key: formDefinition.key },
                  },
                ]
              : []),
          ]
        : [],
    [formDefinition?.key, formDefinitionId]
  );

  const [updateCard, { loading: updateLoading }] =
    useMutation(UPDATE_CARD_CONTENT);
  const [updateMilestone, { loading: milestoneLoading }] = useMutation(
    UPDATE_TEMPLATE_MILESTONE
  );
  const [publishFormDefinition, { loading: publishing, error: publishError }] =
    useMutation(PUBLISH_FORM_DEFINITION, {
      refetchQueries: refetchFormDefinitionQueries,
      awaitRefetchQueries: true,
    });

  const handleDefinitionLoaded = (definition) => {
    setFormDefinition(definition);
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

  const confirmPublish = async (changelog) => {
    if (!formDefinitionId) return;
    try {
      await publishFormDefinition({
        variables: { id: formDefinitionId, changelog: changelog || null },
      });
      setPublishOpen(false);
    } catch {
      // publishError surfaces in PublishModal
    }
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
            {t(
              "board.expendedCard.actionCard.reviewFormPreview",
              {},
              { default: "Review form preview" }
            )}
          </div>
          <FormDefinitionPreview
            board={boardWithSections}
            milestone={milestone}
            proposalBoardId={proposal?.id}
            maxHeight={showFormEditor ? 200 : 360}
          />

          {isDefault ? (
            <p style={helperTextStyle}>
              {t(
                "board.expendedCard.actionCard.defaultFormReadOnly",
                {},
                {
                  default:
                    "This is a MindHive default review form. It cannot be edited from this card.",
                }
              )}
            </p>
          ) : null}

          {canEditFormCandidate &&
          !scopeCheckLoading &&
          scopedDefinition &&
          !isScopedForm ? (
            <p style={helperTextStyle}>
              {t(
                "board.expendedCard.actionCard.scopedFormOnly",
                {},
                {
                  default:
                    "This review form is not scoped to your template board and cannot be edited here.",
                }
              )}
            </p>
          ) : null}

          {showFormEditor ? (
            <div style={{ marginTop: 24, display: "grid", gap: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: "Inter, sans-serif",
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#171717",
                    }}
                  >
                    {t(
                      "board.expendedCard.actionCard.editReviewForm",
                      {},
                      { default: "Edit review form" }
                    )}
                    {formDefinition?.status ? (
                      <span style={statusBadgeStyle(formDefinition.status)}>
                        {formDefinition.status === "published"
                          ? t(
                              "board.expendedCard.actionCard.statusPublished",
                              {},
                              { default: "Published" }
                            )
                          : t(
                              "board.expendedCard.actionCard.statusDraft",
                              {},
                              { default: "Draft" }
                            )}
                      </span>
                    ) : null}
                  </h3>
                  <p style={{ ...helperTextStyle, marginTop: 4 }}>
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
                {formDefinition?.status === "draft" ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={publishing}
                    onClick={() => setPublishOpen(true)}
                  >
                    {publishing
                      ? tBuilder(
                          "section.createCardModal.publishing",
                          {},
                          { default: "Publishing…" }
                        )
                      : t(
                          "board.expendedCard.actionCard.publish",
                          {},
                          { default: "Publish…" }
                        )}
                  </Button>
                ) : null}
              </div>

              <FormDefinitionEditor
                definitionId={formDefinitionId}
                locale={router?.locale || "en-us"}
                onDefinitionLoaded={handleDefinitionLoaded}
              />

              {publishOpen && formDefinition ? (
                <PublishModal
                  definition={formDefinition}
                  liveSibling={liveSibling}
                  onCancel={() => setPublishOpen(false)}
                  onConfirm={confirmPublish}
                  busy={publishing}
                  error={publishError}
                />
              ) : null}
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
    </div>
  );
}
