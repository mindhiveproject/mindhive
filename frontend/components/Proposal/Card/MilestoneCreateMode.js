import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { useMutation, useQuery, useApolloClient } from "@apollo/client";
import { v1 as uuidv1 } from "uuid";
import useTranslation from "next-translate/useTranslation";

import {
  CREATE_TEMPLATE_MILESTONE,
  RESOLVE_MILESTONES_FOR_BOARD,
} from "../../Queries/Milestone";
import { PROPOSAL_QUERY } from "../../Queries/Proposal";
import { CREATE_CARD } from "../../Mutations/Proposal";
import { useBoardMilestones } from "../../../lib/useBoardMilestones";
import {
  milestoneHasReviewQuestionnaire,
  resolveReviewFormKey,
} from "../../../lib/milestones";
import { getCurriculumType } from "../../../lib/curriculumTypes";
import { isClassTemplateBoard } from "../../Utils/proposalBoard";
import {
  BLANK_TEMPLATE_VALUE,
  getDefaultCheckpointOptions,
  getDefaultFormTemplateOptions,
  getExistingDefaultActionTypes,
  getMilestoneForCardType,
  isDefaultActionCardType,
  NEW_CHECKPOINT_VALUE,
} from "../Builder/cardTypeOptions";

import FormDefinitionPreview from "../../Forms/DefinitionForm/FormDefinitionPreview";
import MilestoneCapabilityRow from "./MilestoneCapabilityRow";
import MessageCard from "../../DesignSystem/MessageCard";
import Button from "../../DesignSystem/Button";
import Chip from "../../DesignSystem/Chip";
import Tooltip from "../../DesignSystem/Tooltip";

const CAPABILITY_REVIEW = "review";
const CAPABILITY_DATA_COLLECTION = "data_collection";
const DEFAULT_PERMISSIONS = ["MENTOR", "TEACHER", "SCIENTIST"];

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #A1A1A1",
  borderRadius: 10,
  padding: "16px 18px",
  font: "var(--MH-Type-Body-Large)",
  letterSpacing: 0,
  color: "#171717",
};

const helperTextStyle = {
  margin: "8px 0 0",
  color: "#5D5763",
  font: "var(--MH-Type-Body-Base)",
  letterSpacing: 0,
};

const questionLabelStyle = {
  margin: "0 0 10px",
  font: "var(--MH-Type-Title-Small)",
  letterSpacing: 0,
  color: "#171717",
};

const sectionStyle = {
  width: "100%",
  boxSizing: "border-box",
  marginBottom: 24,
};

const chipRowStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const previewShellStyle = {
  border: "1px solid #E6E6E6",
  borderRadius: 12,
  background: "#F7F9F8",
  color: "#5D5763",
  font: "var(--MH-Type-Body-Base)",
  letterSpacing: 0,
  padding: 16,
  maxHeight: 260,
  overflowY: "auto",
};

const newActionCardChipStyle = {
  border: "2px solid #A1A1A1",
  fontWeight: 700,
};

export default function MilestoneCreateMode({
  proposal,
  sectionId,
  onCreated,
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

  const { milestones, loading: milestonesLoading } = useBoardMilestones(
    proposal?.id
  );

  const { data: boardData } = useQuery(PROPOSAL_QUERY, {
    variables: { id: proposal?.id },
    skip: !proposal?.id,
    fetchPolicy: "cache-first",
  });

  const boardWithSections = useMemo(() => {
    if (boardData?.proposalBoard?.sections) {
      return boardData.proposalBoard;
    }
    return proposal;
  }, [boardData?.proposalBoard, proposal]);

  const isClassTemplate =
    isClassTemplateBoard(boardWithSections) || isClassTemplateBoard(proposal);
  const canCreateNew = isClassTemplate;
  const curriculumType = getCurriculumType(boardWithSections || proposal);

  const checkpointOptions = useMemo(
    () =>
      getDefaultCheckpointOptions({
        t: tBuilder,
        sections: boardWithSections?.sections || [],
      }),
    [boardWithSections?.sections, tBuilder]
  );

  const allDefaultMilestonesAdded =
    checkpointOptions.length > 0 &&
    checkpointOptions.every((option) => option.disabled);
  const forceCustomMilestone = canCreateNew && allDefaultMilestonesAdded;

  const [checkpointChoice, setCheckpointChoice] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(
    BLANK_TEMPLATE_VALUE
  );
  const [capability, setCapability] = useState(CAPABILITY_REVIEW);
  const [creating, setCreating] = useState(false);

  const resolvedCheckpointChoice = forceCustomMilestone
    ? NEW_CHECKPOINT_VALUE
    : checkpointChoice;
  const isNewCheckpoint = resolvedCheckpointChoice === NEW_CHECKPOINT_VALUE;
  const isDefaultCheckpoint = isDefaultActionCardType(resolvedCheckpointChoice);
  const selectedMilestone = isDefaultCheckpoint
    ? getMilestoneForCardType(resolvedCheckpointChoice, milestones)
    : null;

  const formTemplateOptions = useMemo(
    () => getDefaultFormTemplateOptions({ t: tBuilder }),
    [tBuilder]
  );

  const templatePreviewMilestone =
    isNewCheckpoint &&
    selectedTemplateKey &&
    selectedTemplateKey !== BLANK_TEMPLATE_VALUE
      ? getMilestoneForCardType(selectedTemplateKey, milestones)
      : null;

  const existingDefaultTypes = useMemo(
    () => getExistingDefaultActionTypes(boardWithSections?.sections || []),
    [boardWithSections?.sections]
  );

  const dataCollectionTaken = existingDefaultTypes.has(
    "ACTION_COLLECTING_DATA"
  );

  const [createCard] = useMutation(CREATE_CARD);
  const [createTemplateMilestone] = useMutation(CREATE_TEMPLATE_MILESTONE);

  useEffect(() => {
    if (!isNewCheckpoint) return;
    if (!selectedTemplateKey) {
      setSelectedTemplateKey(BLANK_TEMPLATE_VALUE);
    }
  }, [isNewCheckpoint, selectedTemplateKey]);

  useEffect(() => {
    if (forceCustomMilestone) {
      setCapability(CAPABILITY_REVIEW);
    }
  }, [forceCustomMilestone]);

  const handleCheckpointSelect = (choice) => {
    if (choice === checkpointChoice) return;
    setCheckpointChoice(choice);
    setTitle("");
    setDescription("");
    setSelectedTemplateKey(BLANK_TEMPLATE_VALUE);
    setCapability(CAPABILITY_REVIEW);
  };

  const trimmedTitle = title.trim();
  const createDisabled =
    creating ||
    milestonesLoading ||
    !sectionId ||
    !resolvedCheckpointChoice ||
    (isDefaultCheckpoint &&
      (!selectedMilestone?.id ||
        checkpointOptions.find((o) => o.value === resolvedCheckpointChoice)
          ?.disabled)) ||
    (isNewCheckpoint &&
      (!trimmedTitle ||
        (capability === CAPABILITY_DATA_COLLECTION && dataCollectionTaken)));

  const finishAfterCreate = async (cardId, cardMeta = {}) => {
    const openCreated = () => {
      if (cardId) onCreated?.(cardId, cardMeta);
    };

    const proposalQuery = await client.query({
      query: PROPOSAL_QUERY,
      variables: { id: proposal?.id },
      fetchPolicy: "network-only",
    });
    const board = proposalQuery?.data?.proposalBoard;
    const hasClones = board?.prototypeFor?.length > 0;

    if (hasClones) {
      if (autoUpdateStudentBoards && propagateToClones) {
        try {
          await propagateToClones();
        } catch (error) {
          console.error("Auto-propagate after milestone add failed:", error);
        }
        openCreated();
      } else {
        onTemplateChangedWithoutPropagation?.();
        openCreated();
      }
    } else {
      openCreated();
    }
  };

  const handleCreate = async () => {
    if (createDisabled) return;
    setCreating(true);
    try {
      if (isDefaultCheckpoint) {
        const sectionCards =
          (boardWithSections?.sections || []).find((s) => s.id === sectionId)
            ?.cards || [];
        const position =
          sectionCards.length > 0
            ? sectionCards[sectionCards.length - 1].position + 16384
            : 16384;

        const result = await createCard({
          variables: {
            title: selectedMilestone?.title || resolvedCheckpointChoice,
            sectionId,
            position,
            publicId: uuidv1(),
            type: resolvedCheckpointChoice,
            milestone: { connect: { id: selectedMilestone.id } },
            settings: { status: "Not started" },
          },
          refetchQueries: [
            { query: PROPOSAL_QUERY, variables: { id: proposal?.id } },
            {
              query: RESOLVE_MILESTONES_FOR_BOARD,
              variables: { boardId: proposal?.id },
            },
          ],
          awaitRefetchQueries: true,
        });
        const cardId = result?.data?.createProposalCard?.id;
        await finishAfterCreate(cardId, {
          title: selectedMilestone?.title || resolvedCheckpointChoice,
          type: resolvedCheckpointChoice,
        });
        return;
      }

      const templateMilestone =
        capability === CAPABILITY_REVIEW &&
        selectedTemplateKey &&
        selectedTemplateKey !== BLANK_TEMPLATE_VALUE
          ? getMilestoneForCardType(selectedTemplateKey, milestones)
          : null;

      const isDataCollection = capability === CAPABILITY_DATA_COLLECTION;
      const result = await createTemplateMilestone({
        variables: {
          input: {
            templateBoardId: proposal.id,
            title: trimmedTitle,
            description: description.trim(),
            sectionId,
            clonedFromMilestoneId: null,
            sourceFormDefinitionKey: templateMilestone
              ? resolveReviewFormKey(templateMilestone, curriculumType)
              : null,
            canReviewPermissionNames: DEFAULT_PERMISSIONS,
            showInFeedbackCenter: !isDataCollection,
            statusTarget: isDataCollection ? "study" : "board",
          },
        },
        refetchQueries: [
          { query: PROPOSAL_QUERY, variables: { id: proposal?.id } },
          {
            query: RESOLVE_MILESTONES_FOR_BOARD,
            variables: { boardId: proposal?.id },
          },
        ],
        awaitRefetchQueries: true,
      });
      const created = result?.data?.createTemplateMilestone;
      const cardId = created?.actionCards?.[0]?.id || null;
      await finishAfterCreate(cardId, {
        title: trimmedTitle,
        type: "ACTION",
      });
    } catch (err) {
      alert(err?.message);
    } finally {
      setCreating(false);
    }
  };

  const handleClose = async () => {
    closeCard({ cardId: false, lockedByUser: false });
  };

  const handleCreateRef = useRef(handleCreate);
  handleCreateRef.current = handleCreate;

  useEffect(() => {
    if (!registerCloseHandler) return undefined;
    registerCloseHandler(handleClose);
    return () => registerCloseHandler(null);
  });

  useEffect(() => {
    if (!hideBoardChromeNav || !registerCardChrome) return undefined;
    registerCardChrome({
      kind: "milestone",
      previewMode: false,
      saving: creating,
      saveDisabled: createDisabled && !creating,
      typeLabel: tBuilder(
        "section.createMilestone.typeLabel",
        {},
        { default: "New milestone" }
      ),
      isDefaultAction: false,
      saveLabel: creating
        ? tBuilder(
            "section.createCardModal.creating",
            {},
            { default: "Creating..." }
          )
        : tBuilder(
            "section.createMilestone.addToBoard",
            {},
            { default: "Add to board" }
          ),
      onSave: () => handleCreateRef.current(),
    });
  }, [
    hideBoardChromeNav,
    registerCardChrome,
    creating,
    createDisabled,
    tBuilder,
  ]);

  useEffect(() => {
    if (!hideBoardChromeNav || !registerCardChrome) return undefined;
    return () => registerCardChrome(null);
  }, [hideBoardChromeNav, registerCardChrome]);

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
                opacity: creating ? 0.6 : 1,
                pointerEvents: creating ? "none" : "auto",
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
              onClick={handleCreate}
              disabled={createDisabled}
            >
              {creating
                ? tBuilder(
                    "section.createCardModal.creating",
                    {},
                    { default: "Creating..." }
                  )
                : tBuilder(
                    "section.createMilestone.addToBoard",
                    {},
                    { default: "Add to board" }
                  )}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="proposalCardBoard">
        <div className="textBoard">
          {forceCustomMilestone ? (
            <section style={sectionStyle}>
              <MessageCard
                variant="information"
                message={tBuilder(
                  "section.createCardModal.allDefaultsAddedNotice",
                  {},
                  {
                    default:
                      "All default MindHive milestones are already on this board. You're creating a custom milestone.",
                  }
                )}
              />
            </section>
          ) : (
            <section style={sectionStyle}>
              <p style={questionLabelStyle}>
                {tBuilder(
                  "section.createCardModal.steps.checkpoint",
                  {},
                  { default: "Checkpoint" }
                )}
              </p>
              <div style={chipRowStyle}>
                {checkpointOptions.map((option) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    selected={checkpointChoice === option.value}
                    disabled={option.disabled}
                    title={
                      option.disabled
                        ? tBuilder(
                            "section.createCardModal.alreadyAddedTooltip",
                            {},
                            {
                              default: "This checkpoint is already on the board",
                            }
                          )
                        : undefined
                    }
                    onClick={() => {
                      if (!option.disabled) handleCheckpointSelect(option.value);
                    }}
                  />
                ))}
                {canCreateNew ? (
                  <Chip
                    label={tBuilder(
                      "section.createCardModal.newCheckpoint",
                      {},
                      { default: "+ New Milestone" }
                    )}
                    selected={checkpointChoice === NEW_CHECKPOINT_VALUE}
                    onClick={() => handleCheckpointSelect(NEW_CHECKPOINT_VALUE)}
                    style={newActionCardChipStyle}
                  />
                ) : null}
              </div>
            </section>
          )}

          {resolvedCheckpointChoice ? (
            <>
              <section style={sectionStyle}>
                <p style={questionLabelStyle}>
                  {t(
                    "board.expendedCard.milestoneCard.questionName",
                    {},
                    { default: "What is the milestone name?" }
                  )}
                </p>
                {isNewCheckpoint ? (
                  <input
                    type="text"
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={tBuilder(
                      "section.createCardModal.custom.labelPlaceholder",
                      {},
                      { default: "Enter a milestone label" }
                    )}
                    style={inputStyle}
                  />
                ) : (
                  <input
                    type="text"
                    value={selectedMilestone?.title || ""}
                    readOnly
                    disabled
                    style={{
                      ...inputStyle,
                      background: "#F3F3F3",
                      color: "#5D5763",
                    }}
                  />
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
                {isNewCheckpoint ? (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{
                      ...inputStyle,
                      minHeight: 96,
                      width: "100%",
                      resize: "vertical",
                    }}
                  />
                ) : selectedMilestone?.description ? (
                  <textarea
                    value={selectedMilestone.description}
                    readOnly
                    disabled
                    style={{
                      ...inputStyle,
                      minHeight: 96,
                      width: "100%",
                      resize: "vertical",
                      background: "#F3F3F3",
                      color: "#5D5763",
                    }}
                  />
                ) : (
                  <p style={{ ...helperTextStyle, margin: 0 }}>
                    {t(
                      "board.expendedCard.milestoneCard.noDescription",
                      {},
                      { default: "No description provided." }
                    )}
                  </p>
                )}
              </section>

              {isNewCheckpoint ? (
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
                      name="createMilestoneCapability"
                      value={CAPABILITY_REVIEW}
                      checked={capability === CAPABILITY_REVIEW}
                      disabled={creating}
                      headline={t(
                        "board.expendedCard.milestoneCard.capabilityReviewTitle",
                        {},
                        {
                          default:
                            "Allow mentors and peers to review student project cards.",
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
                      onChange={setCapability}
                    />
                    <Tooltip side="right" content={dataCollectionTaken ? t(
                        "board.expendedCard.milestoneCard.dataCollectionAlreadyOnBoard",
                        {},
                        {
                          default:
                            "Data collection is already on this board. Each board can have only one data collection step.",
                        }
                      ) : undefined}>
                      <MilestoneCapabilityRow
                        name="createMilestoneCapability"
                        value={CAPABILITY_DATA_COLLECTION}
                        checked={capability === CAPABILITY_DATA_COLLECTION}
                        disabled={creating || dataCollectionTaken}
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
                        onChange={setCapability}
                      />
                    </Tooltip>
                  </div>
                </section>
              ) : null}

              {isDefaultCheckpoint && selectedMilestone ? (
                <section style={sectionStyle}>
                  <p style={questionLabelStyle}>
                    {t(
                      "board.expendedCard.milestoneCard.formTemplateLabel",
                      {},
                      { default: "Review form" }
                    )}
                  </p>
                  <FormDefinitionPreview
                    board={boardWithSections}
                    milestone={selectedMilestone}
                  />
                  {milestoneHasReviewQuestionnaire(selectedMilestone) ? (
                    <p style={helperTextStyle}>
                      {tBuilder(
                        "section.createCardModal.defaultFormReadOnly",
                        {},
                        {
                          default:
                            "This is a MindHive default. To customize the form, add a New milestone and copy this review form as a template.",
                        }
                      )}
                    </p>
                  ) : null}
                </section>
              ) : null}

              {isNewCheckpoint && capability === CAPABILITY_REVIEW ? (
                <section style={sectionStyle}>
                  <p style={questionLabelStyle}>
                    {tBuilder(
                      "section.createCardModal.formTemplate.label",
                      {},
                      { default: "Form template" }
                    )}
                  </p>
                  <div style={chipRowStyle}>
                    {formTemplateOptions.map((option) => (
                      <Chip
                        key={option.value}
                        label={option.label}
                        selected={selectedTemplateKey === option.value}
                        onClick={() => setSelectedTemplateKey(option.value)}
                      />
                    ))}
                    <Chip
                      label={tBuilder(
                        "section.createCardModal.formTemplate.blank",
                        {},
                        { default: "Blank form" }
                      )}
                      selected={selectedTemplateKey === BLANK_TEMPLATE_VALUE}
                      onClick={() =>
                        setSelectedTemplateKey(BLANK_TEMPLATE_VALUE)
                      }
                    />
                  </div>
                  {selectedTemplateKey &&
                  selectedTemplateKey !== BLANK_TEMPLATE_VALUE &&
                  templatePreviewMilestone ? (
                    <div style={{ marginTop: 14 }}>
                      <FormDefinitionPreview
                        board={boardWithSections}
                        milestone={templatePreviewMilestone}
                      />
                    </div>
                  ) : null}
                  {selectedTemplateKey === BLANK_TEMPLATE_VALUE ? (
                    <div style={{ ...previewShellStyle, marginTop: 14 }}>
                      {tBuilder(
                        "section.createMilestone.scratchPreview",
                        {},
                        {
                          default:
                            "Creates an empty draft review form linked to this step. After you add it to the board you can build the form's cards and fields, then publish. Student clones inherit whatever you publish.",
                        }
                      )}
                    </div>
                  ) : null}
                </section>
              ) : null}

              {isNewCheckpoint &&
              capability === CAPABILITY_DATA_COLLECTION ? (
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
            </>
          ) : null}
        </div>

        <div
          className={clsx("infoBoard", {
            infoBoardEdit: hideBoardChromeNav,
          })}
        >
          <div className="cardHeader">
            {tBuilder(
              "section.createMilestone.sidePanelTitle",
              {},
              { default: "Create a milestone" }
            )}
          </div>
          <p style={helperTextStyle}>
            {tBuilder(
              "section.createMilestone.sidePanelHelper",
              {},
              {
                default:
                  "Choose a MindHive default checkpoint or create a custom milestone. Nothing is added to the board until you click Add to board.",
              }
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
