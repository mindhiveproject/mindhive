import { useMemo, useState, useEffect, useRef } from "react";
import clsx from "clsx";
import { useMutation, useQuery, useApolloClient } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import {
  CREATE_TEMPLATE_MILESTONE,
  RESOLVE_MILESTONES_FOR_BOARD,
  UPDATE_TEMPLATE_MILESTONE,
} from "../../Queries/Milestone";
import { PROPOSAL_QUERY } from "../../Queries/Proposal";
import { FORK_REVIEW_FORM_FOR_BOARD } from "../../Mutations/FormDefinition";
import { UPDATE_CARD_CONTENT } from "../../Mutations/Proposal";

import useForm from "../../../lib/useForm";
import { useBoardMilestones } from "../../../lib/useBoardMilestones";
import {
  resolveMilestoneFromCard,
  cardIncludedInReviewStep,
  isActionCard,
  parseCardSettings,
  milestoneHasReviewQuestionnaire,
  resolveReviewFormKey,
} from "../../../lib/milestones";
import {
  getActionCardLabel,
  getActionCardTypeLabel,
  isDefaultActionCard,
} from "../../../lib/templateBoardActionCards";
import { getCurriculumType } from "../../../lib/curriculumTypes";
import { isClassTemplateBoard } from "../../Utils/proposalBoard";
import {
  getDefaultFormTemplateOptions,
  getExistingDefaultActionTypes,
  getMilestoneForCardType,
} from "../Builder/cardTypeOptions";

import TeacherFormWizard from "../../Forms/TeacherFormWizard";
import FormDefinitionPreviewModal from "../../Forms/DefinitionForm/FormDefinitionPreviewModal";
import MilestoneCapabilityRow from "./MilestoneCapabilityRow";
import ReviewFormAttachmentCard from "./ReviewFormAttachmentCard";
import Tooltip from "../../DesignSystem/Tooltip";
import Button from "../../DesignSystem/Button";
import Chip from "../../DesignSystem/Chip";
import DropdownMenu from "../../DesignSystem/DropdownMenu";
import Modal from "../../DesignSystem/Modal";
import { BOARD_REVIEW_FORM_DEFINITIONS } from "../../Queries/FormDefinition";

const CAPABILITY_REVIEW = "review";
const CAPABILITY_DATA_COLLECTION = "data_collection";

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #A1A1A1",
  borderRadius: 10,
  padding: "16px 18px",
  fontFamily: "Inter, sans-serif",
  fontSize: 18,
  lineHeight: "28px",
  color: "#171717",
};

const helperTextStyle = {
  margin: "8px 0 0",
  color: "#5D5763",
  fontSize: 14,
  lineHeight: "20px",
};

const questionLabelStyle = {
  margin: "0 0 10px",
  fontFamily: "Inter, sans-serif",
  fontSize: 15,
  fontWeight: 600,
  lineHeight: "22px",
  color: "#171717",
};

const sectionStyle = {
  width: "100%",
  boxSizing: "border-box",
  marginBottom: 24,
};

const formActionsStyle = {
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 10,
  alignItems: "center",
  width: "100%",
  marginTop: 12,
};

const associatedCardsListStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  margin: "12px 0 0",
  padding: 0,
  listStyle: "none",
};

function resolveCapability(milestone, proposalCard) {
  if (
    milestone?.statusTarget === "study" ||
    milestone?.actionCardType === "ACTION_COLLECTING_DATA" ||
    proposalCard?.type === "ACTION_COLLECTING_DATA"
  ) {
    return CAPABILITY_DATA_COLLECTION;
  }
  return CAPABILITY_REVIEW;
}

export default function MilestoneCardBuilder({
  proposal,
  proposalCard,
  closeCard,
  autoUpdateStudentBoards,
  propagateToClones,
  onTemplateChangedWithoutPropagation,
  hideBoardChromeNav = false,
  registerCloseHandler,
  registerCardChrome,
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
  // Prefer boardWithSections (PROPOSAL_QUERY) over the thinner overview
  // proposal prop so 2nd+ class templates with only templatesForClass still
  // unlock editing and the Review form section.
  const isClassTemplate =
    isClassTemplateBoard(boardWithSections) || isClassTemplateBoard(proposal);
  const isCustom = isClassTemplate && !isDefault;
  const isTemplateMilestone = milestone?.scope === "template";
  const canEditFields = isCustom && isTemplateMilestone;
  const canEditCapability = canEditFields;

  const capability = resolveCapability(milestone, proposalCard);

  const canCopyForm =
    isClassTemplate &&
    milestone?.scope !== "template" &&
    capability === CAPABILITY_REVIEW &&
    !!milestone?.id;

  const actionLabel = getActionCardLabel(proposalCard, tBuilder);
  const curriculumType = getCurriculumType(boardWithSections || proposal);

  const existingDefaultTypes = useMemo(
    () => getExistingDefaultActionTypes(boardWithSections?.sections || []),
    [boardWithSections?.sections]
  );

  const dataCollectionTaken =
    existingDefaultTypes.has("ACTION_COLLECTING_DATA") &&
    proposalCard?.type !== "ACTION_COLLECTING_DATA" &&
    milestone?.actionCardType !== "ACTION_COLLECTING_DATA";

  const formTemplateOptions = useMemo(
    () => getDefaultFormTemplateOptions({ t: tBuilder }),
    [tBuilder]
  );

  const { data: boardFormsData } = useQuery(BOARD_REVIEW_FORM_DEFINITIONS, {
    variables: { proposalBoardId: proposal?.id },
    skip: !proposal?.id || !isClassTemplate,
    fetchPolicy: "cache-and-network",
  });

  const boardReviewForms = useMemo(
    () => boardFormsData?.formDefinitions || [],
    [boardFormsData?.formDefinitions]
  );

  const relinkableBoardForms = useMemo(() => {
    const attachedId = milestone?.formDefinition?.id || null;
    return boardReviewForms.filter((form) => form?.id && form.id !== attachedId);
  }, [boardReviewForms, milestone?.formDefinition?.id]);

  const hasBoardScopedForm =
    milestone?.formDefinition?.scope === "project_board" &&
    !!milestone?.formDefinition?.id;

  const hasAttachedReviewForm =
    capability === CAPABILITY_REVIEW &&
    !!milestone &&
    (hasBoardScopedForm ||
      (isDefault && milestoneHasReviewQuestionnaire(milestone)));

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
  const [confirmDataCollectionOpen, setConfirmDataCollectionOpen] =
    useState(false);
  const [capabilityBusy, setCapabilityBusy] = useState(false);
  const [formPreviewOpen, setFormPreviewOpen] = useState(false);
  const [confirmRemoveFormOpen, setConfirmRemoveFormOpen] = useState(false);

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

  const openWizard = (definitionId, milestoneKey) => {
    setWizardDefinitionId(definitionId);
    setWizardMilestoneKey(milestoneKey || milestone?.key || null);
    setWizardOpen(true);
  };

  const persistCapability = async (nextCapability) => {
    if (!canEditCapability || !milestone?.id || capabilityBusy) return;
    if (nextCapability === capability) return;

    if (nextCapability === CAPABILITY_DATA_COLLECTION) {
      setConfirmDataCollectionOpen(true);
      return;
    }

    setCapabilityBusy(true);
    try {
      await updateMilestone({
        variables: {
          input: {
            id: milestone.id,
            statusTarget: "board",
            showInFeedbackCenter: true,
          },
        },
        refetchQueries: boardRefetchQueries,
        awaitRefetchQueries: true,
      });
    } catch (err) {
      alert(err?.message);
    } finally {
      setCapabilityBusy(false);
    }
  };

  const confirmSwitchToDataCollection = async () => {
    if (!milestone?.id) return;
    setCapabilityBusy(true);
    try {
      await updateMilestone({
        variables: {
          input: {
            id: milestone.id,
            statusTarget: "study",
            showInFeedbackCenter: false,
          },
        },
        refetchQueries: boardRefetchQueries,
        awaitRefetchQueries: true,
      });
      setConfirmDataCollectionOpen(false);
    } catch (err) {
      alert(err?.message);
    } finally {
      setCapabilityBusy(false);
    }
  };

  const detachBoardForm = async () => {
    if (!hasBoardScopedForm || !milestone?.id) return;

    // Disconnect only — keep the board-scoped form so teachers can re-link it.
    await updateMilestone({
      variables: {
        input: {
          id: milestone.id,
          formDefinitionId: null,
        },
      },
      refetchQueries: [
        ...boardRefetchQueries,
        {
          query: BOARD_REVIEW_FORM_DEFINITIONS,
          variables: { proposalBoardId: proposal?.id },
        },
      ],
      awaitRefetchQueries: true,
    });
  };

  const confirmRemoveAttachedForm = async () => {
    if (!hasBoardScopedForm || editBusy) return;
    setEditBusy(true);
    try {
      await detachBoardForm();
      setConfirmRemoveFormOpen(false);
      await client.refetchQueries({
        include: "active",
      });
    } catch (err) {
      alert(err?.message);
    } finally {
      setEditBusy(false);
    }
  };

  const relinkBoardForm = async (formId) => {
    if (!isTemplateMilestone || !milestone?.id || !formId || editBusy) return;
    setEditBusy(true);
    try {
      await updateMilestone({
        variables: {
          input: {
            id: milestone.id,
            formDefinitionId: formId,
          },
        },
        refetchQueries: [
          ...boardRefetchQueries,
          {
            query: BOARD_REVIEW_FORM_DEFINITIONS,
            variables: { proposalBoardId: proposal?.id },
          },
        ],
        awaitRefetchQueries: true,
      });
    } catch (err) {
      alert(err?.message);
    } finally {
      setEditBusy(false);
    }
  };

  const openFormEditor = async (templateKey = null, { replace = false } = {}) => {
    if (!isClassTemplate || !milestone?.id || !proposal?.id || editBusy) return;

    if (isDefault) {
      await copyMilestoneToCustomize();
      return;
    }

    if (!isTemplateMilestone) return;

    setEditBusy(true);
    try {
      if (capability === CAPABILITY_DATA_COLLECTION) {
        await updateMilestone({
          variables: {
            input: {
              id: milestone.id,
              statusTarget: "board",
              showInFeedbackCenter: true,
            },
          },
          refetchQueries: boardRefetchQueries,
          awaitRefetchQueries: true,
        });
      }

      const hasBoardScopedForm =
        milestone.formDefinition?.scope === "project_board" &&
        !!milestone.formDefinition?.id;

      const isScratch = !templateKey;

      if (hasBoardScopedForm && replace) {
        await detachBoardForm();
      } else if (hasBoardScopedForm && isScratch) {
        openWizard(milestone.formDefinition.id, milestone.key);
        return;
      }

      let sourceFormDefinitionKey = null;
      if (templateKey) {
        const templateMilestone = getMilestoneForCardType(
          templateKey,
          milestones
        );
        sourceFormDefinitionKey = resolveReviewFormKey(
          templateMilestone,
          curriculumType
        );
      }

      // Always create a fresh board-scoped form when attaching or replacing.
      // Prevents reconnecting orphans left behind by remove/delete.
      const result = await forkReviewForm({
        variables: {
          templateBoardId: proposal.id,
          milestoneId: milestone.id,
          sourceFormDefinitionKey,
          forceNew: true,
        },
        refetchQueries: boardRefetchQueries,
        awaitRefetchQueries: true,
      });
      const forked = result?.data?.forkReviewFormForBoard;
      if (!forked?.id) {
        throw new Error("Could not open the review form for editing.");
      }
      openWizard(forked.id, milestone.key);
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
              curriculumType
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
      setEditBusy(false);
    }
  };

  const hasChanges = () => {
    if (!canEditFields) return false;
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

    if (canEditFields && milestone?.id) {
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

  const saving = updateLoading || milestoneLoading || capabilityBusy;

  useEffect(() => {
    if (!registerCloseHandler) return undefined;
    registerCloseHandler(handleClose);
    return () => registerCloseHandler(null);
  });

  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  useEffect(() => {
    if (!hideBoardChromeNav || !registerCardChrome) return undefined;
    registerCardChrome({
      kind: "milestone",
      previewMode: false,
      saving,
      typeLabel: getActionCardTypeLabel(proposalCard, t),
      isDefaultAction: isDefault,
      onSave: () => handleSaveRef.current(),
    });
  }, [hideBoardChromeNav, registerCardChrome, saving, proposalCard, t, isDefault]);

  useEffect(() => {
    if (!hideBoardChromeNav || !registerCardChrome) return undefined;
    return () => registerCardChrome(null);
  }, [hideBoardChromeNav, registerCardChrome]);

  const displayTitle = canEditFields
    ? inputs?.title || actionLabel
    : actionLabel || milestone?.title || "";

  const displayDescription = canEditFields
    ? inputs?.milestoneDescription
    : milestone?.description || "";

  return (
    <div
      className={clsx("post", {
        milestoneCardEditorPost: hideBoardChromeNav,
      })}
    >
      {!hideBoardChromeNav ? (
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
          <Tooltip
            content={proposal?.title || ""}
            side="bottom"
            maxWidth={400}
          >
            <div className="middle">
              <span className="studyTitle">{proposal?.title}</span>
            </div>
          </Tooltip>
          <div className="right">
            <div className="editModeMessage">
              {t("board.editMode", {}, { default: "You are in Edit Mode" })}
            </div>
            <Button
              type="button"
              variant="filled"
              onClick={handleSave}
              disabled={saving}
            >
              {t("board.save", {}, { default: "Save" })}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="proposalCardBoard">
        <div className="textBoard">
          <section style={sectionStyle}>
            <p style={questionLabelStyle}>
              {t(
                "board.expendedCard.milestoneCard.questionName",
                {},
                { default: "What is the milestone name?" }
              )}
            </p>
            {canEditFields ? (
              <input
                type="text"
                id="milestoneCardTitle"
                name="title"
                value={inputs?.title}
                onChange={handleChange}
                style={inputStyle}
                aria-label={t(
                  "board.expendedCard.milestoneCard.questionName",
                  {},
                  { default: "What is the milestone name?" }
                )}
              />
            ) : (
              <p style={{ margin: 0, fontSize: 16, lineHeight: "24px" }}>
                {displayTitle}
              </p>
            )}
          </section>

          <section style={sectionStyle}>
            <p style={questionLabelStyle}>
              {t(
                "board.expendedCard.milestoneCard.questionDescription",
                {},
                {
                  default:
                    "How would you describe this milestone to your student?",
                }
              )}
            </p>
            {canEditFields ? (
              <textarea
                id="milestoneCardDescription"
                name="milestoneDescription"
                value={inputs?.milestoneDescription}
                onChange={handleChange}
                style={{ ...inputStyle, minHeight: 96, width: "100%", resize: "vertical" }}
                aria-label={t(
                  "board.expendedCard.milestoneCard.questionDescription",
                  {},
                  {
                    default:
                      "How would you describe this milestone to your student?",
                  }
                )}
              />
            ) : (
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: "20px",
                  color: "#5D5763",
                }}
              >
                {displayDescription ||
                  t(
                    "board.expendedCard.milestoneCard.noDescription",
                    {},
                    { default: "No description provided." }
                  )}
              </p>
            )}
          </section>

          <section style={sectionStyle}>
            <p style={questionLabelStyle}>
              {t(
                "board.expendedCard.milestoneCard.questionDoing",
                {},
                { default: "What is this milestone doing?" }
              )}
            </p>
            <div style={{ display: "grid", gap: 10 }}>
              <MilestoneCapabilityRow
                name="milestoneCapability"
                value={CAPABILITY_REVIEW}
                checked={capability === CAPABILITY_REVIEW}
                disabled={!canEditCapability || capabilityBusy}
                headline={t(
                  "board.expendedCard.milestoneCard.capabilityReviewTitle",
                  {},
                  {
                    default: "Allow mentors and peers to review student project cards.",
                  }
                )}
                supportingText={t(
                  "board.expendedCard.milestoneCard.capabilityReviewDescription",
                  {},
                  {
                    default:
                      "Define a form for Mentor and Peers to use when reviewing your student project.",
                  }
                )}
                onChange={persistCapability}
              />
              <MilestoneCapabilityRow
                name="milestoneCapability"
                value={CAPABILITY_DATA_COLLECTION}
                checked={capability === CAPABILITY_DATA_COLLECTION}
                disabled={
                  !canEditCapability || capabilityBusy || dataCollectionTaken
                }
                headline={t(
                  "board.expendedCard.milestoneCard.capabilityDataTitle",
                  {},
                  {
                    default: "Allow student to start data collection.",
                  }
                )}
                supportingText={t(
                  "board.expendedCard.milestoneCard.capabilityDataDescription",
                  {},
                  {
                    default:
                      "Let your student submit their study for data collection and lock their study builder with this milestone.",
                  }
                )}
                onChange={persistCapability}
              />
            </div>
            {dataCollectionTaken && canEditCapability ? (
              <p style={helperTextStyle}>
                {t(
                  "board.expendedCard.milestoneCard.dataCollectionAlreadyOnBoard",
                  {},
                  {
                    default:
                      "Data collection is already on this board. Each board can have only one data collection step.",
                  }
                )}
              </p>
            ) : null}
          </section>

          {capability === CAPABILITY_DATA_COLLECTION ? (
            <section style={sectionStyle}>
              <p style={helperTextStyle}>
                {t(
                  "board.expendedCard.milestoneCard.dataCollectionStudentHint",
                  {},
                  {
                    default:
                      "When students submit this milestone, their study builder becomes locked and their study is available for data collection.",
                  }
                )}
              </p>
            </section>
          ) : null}

          {capability === CAPABILITY_REVIEW && isClassTemplate ? (
            <section style={{ ...sectionStyle, marginBottom: 8 }}>
              <p style={questionLabelStyle}>
                {t(
                  "board.expendedCard.milestoneCard.formTemplateLabel",
                  {},
                  { default: "Review form" }
                )}
              </p>

              {hasAttachedReviewForm ? (
                <>
                  <ReviewFormAttachmentCard
                    board={boardWithSections}
                    milestone={milestone}
                    isDefault={isDefault}
                    editBusy={editBusy}
                    onPreview={() => setFormPreviewOpen(true)}
                    onEdit={
                      isDefault
                        ? canCopyForm
                          ? copyMilestoneToCustomize
                          : null
                        : () => {
                            openFormEditor(null);
                          }
                    }
                  />
                  {isTemplateMilestone && hasBoardScopedForm ? (
                    <>
                      <div style={{ ...formActionsStyle, marginTop: 16 }}>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={editBusy}
                          onClick={() =>
                            openFormEditor(null, { replace: true })
                          }
                        >
                          {editBusy
                            ? t(
                                "board.expendedCard.actionCard.openingEditor",
                                {},
                                { default: "Opening editor…" }
                              )
                            : t(
                                "board.expendedCard.milestoneCard.createFromScratch",
                                {},
                                { default: "Create from scratch" }
                              )}
                        </Button>
                        <DropdownMenu
                          ariaLabel={t(
                            "board.expendedCard.milestoneCard.customizeMindHiveTemplate",
                            {},
                            { default: "From MindHive template" }
                          )}
                          renderTrigger={({ onClick, open, ariaLabel }) => (
                            <Button
                              type="button"
                              variant="outline"
                              disabled={editBusy}
                              aria-expanded={open}
                              aria-haspopup="menu"
                              aria-label={ariaLabel}
                              onClick={onClick}
                            >
                              {t(
                                "board.expendedCard.milestoneCard.customizeMindHiveTemplate",
                                {},
                                { default: "From MindHive template" }
                              )}
                            </Button>
                          )}
                          items={formTemplateOptions.map((option) => ({
                            key: option.value,
                            label: option.label,
                            onClick: () =>
                              openFormEditor(option.value, { replace: true }),
                          }))}
                        />
                        {relinkableBoardForms.length > 0 ? (
                          <DropdownMenu
                            ariaLabel={t(
                              "board.expendedCard.milestoneCard.useBoardForm",
                              {},
                              { default: "From this board" }
                            )}
                            renderTrigger={({ onClick, open, ariaLabel }) => (
                              <Button
                                type="button"
                                variant="outline"
                                disabled={editBusy}
                                aria-expanded={open}
                                aria-haspopup="menu"
                                aria-label={ariaLabel}
                                onClick={onClick}
                              >
                                {t(
                                  "board.expendedCard.milestoneCard.useBoardForm",
                                  {},
                                  { default: "From this board" }
                                )}
                              </Button>
                            )}
                            items={relinkableBoardForms.map((form) => ({
                              key: form.id,
                              label:
                                form.title ||
                                t(
                                  "board.expendedCard.milestoneCard.reviewFormFallbackTitle",
                                  {},
                                  { default: "Review form" }
                                ),
                              onClick: () => relinkBoardForm(form.id),
                            }))}
                          />
                        ) : null}
                        <Button
                          type="button"
                          variant="text"
                          disabled={editBusy}
                          onClick={() => setConfirmRemoveFormOpen(true)}
                        >
                          {editBusy
                            ? t(
                                "board.expendedCard.milestoneCard.removingReviewForm",
                                {},
                                { default: "Unlinking…" }
                              )
                            : t(
                                "board.expendedCard.milestoneCard.removeReviewForm",
                                {},
                                { default: "Unlink" }
                              )}
                        </Button>
                      </div>
                      <p style={helperTextStyle}>
                        {t(
                          "board.expendedCard.milestoneCard.replaceReviewFormHint",
                          {},
                          {
                            default:
                              "Replace this form, pick one already on this board, or unlink it (it stays available to re-link).",
                          }
                        )}
                      </p>
                    </>
                  ) : (
                    <p style={helperTextStyle}>
                      {isDefault
                        ? t(
                            "board.expendedCard.actionCard.copyToCustomizeHint",
                            {},
                            {
                              default:
                                "Default forms cannot be edited. Copy this milestone to create a custom milestone you can change.",
                            }
                          )
                        : t(
                            "board.expendedCard.actionCard.editReviewFormHint",
                            {},
                            {
                              default:
                                "Scoped to this template board. Student clones inherit whatever you publish.",
                            }
                          )}
                    </p>
                  )}
                </>
              ) : isTemplateMilestone ? (
                <>
                  <div style={formActionsStyle}>
                    <Button
                      type="button"
                      variant="filled"
                      disabled={editBusy}
                      onClick={() => openFormEditor(null)}
                    >
                      {editBusy
                        ? t(
                            "board.expendedCard.actionCard.openingEditor",
                            {},
                            { default: "Opening editor…" }
                          )
                        : t(
                            "board.expendedCard.milestoneCard.createFromScratch",
                            {},
                            { default: "Create from scratch" }
                          )}
                    </Button>
                    <DropdownMenu
                      ariaLabel={t(
                        "board.expendedCard.milestoneCard.customizeMindHiveTemplate",
                        {},
                        { default: "From MindHive template" }
                      )}
                      renderTrigger={({ onClick, open, ariaLabel }) => (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={editBusy}
                          aria-expanded={open}
                          aria-haspopup="menu"
                          aria-label={ariaLabel}
                          onClick={onClick}
                        >
                          {t(
                            "board.expendedCard.milestoneCard.customizeMindHiveTemplate",
                            {},
                            { default: "From MindHive template" }
                          )}
                        </Button>
                      )}
                      items={formTemplateOptions.map((option) => ({
                        key: option.value,
                        label: option.label,
                        onClick: () => openFormEditor(option.value),
                      }))}
                    />
                    {relinkableBoardForms.length > 0 ? (
                      <DropdownMenu
                        ariaLabel={t(
                          "board.expendedCard.milestoneCard.useBoardForm",
                          {},
                          { default: "From this board" }
                        )}
                        renderTrigger={({ onClick, open, ariaLabel }) => (
                          <Button
                            type="button"
                            variant="outline"
                            disabled={editBusy}
                            aria-expanded={open}
                            aria-haspopup="menu"
                            aria-label={ariaLabel}
                            onClick={onClick}
                          >
                            {t(
                              "board.expendedCard.milestoneCard.useBoardForm",
                              {},
                              { default: "From this board" }
                            )}
                          </Button>
                        )}
                        items={relinkableBoardForms.map((form) => ({
                          key: form.id,
                          label:
                            form.title ||
                            t(
                              "board.expendedCard.milestoneCard.reviewFormFallbackTitle",
                              {},
                              { default: "Review form" }
                            ),
                          onClick: () => relinkBoardForm(form.id),
                        }))}
                      />
                    ) : null}
                  </div>
                  <p style={helperTextStyle}>
                    {t(
                      "board.expendedCard.milestoneCard.boardFormsHint",
                      {},
                      {
                        default:
                          "Forms you create stay on this template board and can be re-linked later.",
                      }
                    )}
                  </p>
                </>
              ) : null}
            </section>
          ) : null}
        </div>

        <div
          className={clsx("infoBoard", {
            infoBoardEdit: hideBoardChromeNav,
          })}
        >
          <div className="cardHeader">
            {capability === CAPABILITY_DATA_COLLECTION
              ? t(
                  "board.expendedCard.milestoneCard.dataCollectionPanelTitle",
                  {},
                  { default: "Study builder connection" }
                )
              : t(
                  "board.expendedCard.milestoneCard.associatedCardsTitle",
                  {},
                  { default: "Cards associated with this milestone" }
                )}
          </div>
          {capability === CAPABILITY_DATA_COLLECTION ? (
            <Chip
              shape="square"
              label={t(
                "board.expendedCard.milestoneCard.dataCollectionPanelChip",
                {},
                { default: "Data collection milestone" }
              )}
              disabled
              style={{
                marginTop: 4,
                background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
                border: "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)",
                color: "var(--MH-Theme-Neutrals-Dark, #5D5763)",
                fontWeight: 500,
              }}
            />
          ) : null}
          <p style={helperTextStyle}>
            {capability === CAPABILITY_DATA_COLLECTION
              ? t(
                  "board.expendedCard.milestoneCard.dataCollectionPanelHelper",
                  {},
                  {
                    default:
                      "This milestone is connected to the study builder that students link to this project board. When students submit it, their study builder is locked and their study becomes available for data collection.",
                  }
                )
              : t(
                  "board.expendedCard.milestoneCard.associatedCardsHelper",
                  {},
                  {
                    default:
                      "The following cards are associated with this milestone. When students submit them, their content is published in Feedback Center so mentors and peers can review it.",
                  }
                )}
          </p>
          {capability === CAPABILITY_REVIEW ? (
            includedCardsLoading ? (
              <p style={helperTextStyle}>
                {t("board.loading", {}, { default: "Loading..." })}
              </p>
            ) : includedCards.length > 0 ? (
              <ul style={associatedCardsListStyle}>
                {includedCards.map((card) => {
                  const cardLabel = card.sectionTitle
                    ? t(
                        "board.expendedCard.milestoneCard.associatedCardLabel",
                        {
                          title:
                            card.title ||
                            t("board.proposal", {}, { default: "Proposal" }),
                          section: card.sectionTitle,
                        },
                        { default: "{{title}} ({{section}})" }
                      )
                    : card.title ||
                      t("board.proposal", {}, { default: "Proposal" });

                  return (
                    <li key={card.id}>
                      <Chip
                        shape="square"
                        label={cardLabel}
                        disabled
                        style={{
                          background: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
                          fontWeight: 500,
                        }}
                      />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p style={{ ...helperTextStyle, fontStyle: "italic" }}>
                {t(
                  "board.expendedCard.milestoneCard.associatedCardsEmpty",
                  {},
                  {
                    default:
                      "No cards are associated with this milestone yet. To associate a card, enable \"Include text input for Feedback Center\" in that card's Student Answer Box settings.",
                  }
                )}
              </p>
            )
          ) : null}
        </div>
      </div>

      <Modal
        open={confirmDataCollectionOpen}
        onClose={() =>
          !capabilityBusy && setConfirmDataCollectionOpen(false)
        }
        title={t(
          "board.expendedCard.milestoneCard.confirmDataCollectionTitle",
          {},
          { default: "Switch to data collection?" }
        )}
        maxWidth={480}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={capabilityBusy}
              onClick={() => setConfirmDataCollectionOpen(false)}
            >
              {t("board.close", {}, { default: "Close" })}
            </Button>
            <Button
              type="button"
              variant="filled"
              disabled={capabilityBusy}
              onClick={confirmSwitchToDataCollection}
            >
              {t(
                "board.expendedCard.milestoneCard.confirmDataCollectionConfirm",
                {},
                { default: "Switch milestone" }
              )}
            </Button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 14, lineHeight: "20px" }}>
          {t(
            "board.expendedCard.milestoneCard.confirmDataCollectionBody",
            {},
            {
              default:
                "This milestone will no longer use its review form in Feedback Center. The form is kept and will reappear if you switch back to review.",
            }
          )}
        </p>
      </Modal>

      <Modal
        open={confirmRemoveFormOpen}
        onClose={() => !editBusy && setConfirmRemoveFormOpen(false)}
        title={t(
          "board.expendedCard.milestoneCard.confirmRemoveReviewFormTitle",
          {},
          { default: "Unlink review form?" }
        )}
        maxWidth={480}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={editBusy}
              onClick={() => setConfirmRemoveFormOpen(false)}
            >
              {t("board.close", {}, { default: "Close" })}
            </Button>
            <Button
              type="button"
              variant="filled"
              disabled={editBusy}
              onClick={confirmRemoveAttachedForm}
            >
              {editBusy
                ? t(
                    "board.expendedCard.milestoneCard.removingReviewForm",
                    {},
                    { default: "Unlinking…" }
                  )
                : t(
                    "board.expendedCard.milestoneCard.removeReviewForm",
                    {},
                    { default: "Unlink" }
                  )}
            </Button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 14, lineHeight: "20px" }}>
          {t(
            "board.expendedCard.milestoneCard.confirmRemoveReviewFormBody",
            {},
            {
              default:
                "This unlinks the form from this milestone. The form stays on this template board so you can re-link it later.",
            }
          )}
        </p>
      </Modal>

      <FormDefinitionPreviewModal
        open={formPreviewOpen}
        onClose={() => setFormPreviewOpen(false)}
        board={boardWithSections}
        milestone={milestone}
        actionLabel={displayTitle || actionLabel}
        onEdit={
          isDefault
            ? canCopyForm
              ? () => {
                  setFormPreviewOpen(false);
                  copyMilestoneToCustomize();
                }
              : null
            : isTemplateMilestone
              ? () => {
                  setFormPreviewOpen(false);
                  openFormEditor(null);
                }
              : null
        }
        editBusy={editBusy}
        onCopy={
          isDefault && canCopyForm
            ? () => {
                setFormPreviewOpen(false);
                copyMilestoneToCustomize();
              }
            : null
        }
        copyBusy={editBusy}
      />

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
