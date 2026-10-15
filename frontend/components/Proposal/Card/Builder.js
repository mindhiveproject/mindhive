import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useApolloClient } from "@apollo/client";
import { v1 as uuidv1 } from "uuid";
import { CREATE_CARD, UPDATE_CARD_CONTENT } from "../../Mutations/Proposal";
import { PROPOSAL_QUERY } from "../../Queries/Proposal";


import useForm from "../../../lib/useForm";
import TipTapEditor from "../../TipTap/Main";

import CardType from "./Forms/Type";
import LinkedItems from "./Forms/LinkedItems";
import AssignmentViewModal from "../../TipTap/AssignmentViewModal";
import StudentProjectCard from "../../Builder/Project/ProjectBoard/Board/Card/Main";
import InfoPopover from "../../DesignSystem/InfoPopover";
import useTranslation from "next-translate/useTranslation";
import { PROPOSAL_CARD_TYPE } from "../Builder/cardTypeOptions";

const EMPTY_CARD = {
  title: "",
  description: "",
  content: "",
  internalContent: "",
  comment: "",
  type: PROPOSAL_CARD_TYPE,
  settings: { status: "Not started" },
  resources: [],
  assignments: [],
  tasks: [],
  studies: [],
  assignedTo: [],
};

export default function BuilderProposalCard({
  user,
  proposal,
  proposalCard,
  isCreateMode = false,
  startInPreview = false,
  sectionId = null,
  onCreated = null,
  closeCard,
  autoUpdateStudentBoards,
  propagateToClones,
  onTemplateChangedWithoutPropagation,
  registerCloseHandler,
  registerCardChrome,
}) {
  const { t } = useTranslation("classes");
  const { t: tBuilder } = useTranslation("builder");
  const client = useApolloClient();

  const initialCard = isCreateMode ? EMPTY_CARD : proposalCard;

  const { inputs, handleChange } = useForm({
    ...initialCard,
  });

  const description = useRef(initialCard?.description || "");
  const content = useRef(initialCard?.content || "");
  const internalContent = useRef(initialCard?.internalContent || "");

  const [updateCard, { loading: updateLoading }] =
    useMutation(UPDATE_CARD_CONTENT);
  const [createCard, { loading: createLoading }] = useMutation(CREATE_CARD);
  const [creating, setCreating] = useState(false);

  const { data: boardData } = useQuery(PROPOSAL_QUERY, {
    variables: { id: proposal?.id },
    skip: !isCreateMode || !proposal?.id,
    fetchPolicy: "cache-first",
  });

  const sectionCards = useMemo(() => {
    const sections = boardData?.proposalBoard?.sections || proposal?.sections || [];
    return sections.find((s) => s.id === sectionId)?.cards || [];
  }, [boardData?.proposalBoard?.sections, proposal?.sections, sectionId]);

  const [showWarningBox, setShowWarningBox] = useState(false);
  const [previewMode, setPreviewMode] = useState(startInPreview);

  // Read-only assignment view for assignment clicks in preview
  const [viewAssignmentModalOpen, setViewAssignmentModalOpen] = useState(false);
  const [viewAssignmentId, setViewAssignmentId] = useState(null);

  const openViewAssignmentModal = (assignment) => {
    if (!assignment?.id) return;
    setViewAssignmentId(assignment.id);
    setViewAssignmentModalOpen(true);
  };

  // Update card content in the local state
  const handleContentChange = async ({ contentType, newContent }) => {
    if (contentType === "description") {
      description.current = newContent;
    }
    if (contentType === "internalContent") {
      internalContent.current = newContent;
    }
    if (contentType === "content") {
      content.current = newContent;
    }
  };

  // Compare current state to initial proposalCard to detect unsaved changes.
  const hasCardChanges = () => {
    if (isCreateMode) {
      const hasTitle = String(inputs?.title ?? "").trim().length > 0;
      const hasDesc = String(description?.current ?? "").trim().length > 0;
      const hasContent = String(content?.current ?? "").trim().length > 0;
      const hasInternal = String(internalContent?.current ?? "").trim().length > 0;
      const hasComment = String(inputs?.comment ?? "").trim().length > 0;
      const hasLinks =
        (inputs?.resources?.length || 0) +
          (inputs?.assignments?.length || 0) +
          (inputs?.tasks?.length || 0) +
          (inputs?.studies?.length || 0) >
        0;
      return (
        hasTitle || hasDesc || hasContent || hasInternal || hasComment || hasLinks
      );
    }
    const descEq = String(description?.current ?? "") === String(proposalCard?.description ?? "");
    const contentEq = String(content?.current ?? "") === String(proposalCard?.content ?? "");
    const internalEq = String(internalContent?.current ?? "") === String(proposalCard?.internalContent ?? "");
    const titleEq = String(inputs?.title ?? "") === String(proposalCard?.title ?? "");
    const settingsEq =
      JSON.stringify(inputs?.settings ?? null) === JSON.stringify(proposalCard?.settings ?? null);
    const ids = (arr) => (arr ?? []).map((x) => x?.id).filter(Boolean).sort().join(",");
    const resourcesEq = ids(inputs?.resources) === ids(proposalCard?.resources);
    const assignmentsEq = ids(inputs?.assignments) === ids(proposalCard?.assignments);
    const tasksEq = ids(inputs?.tasks) === ids(proposalCard?.tasks);
    const studiesEq = ids(inputs?.studies) === ids(proposalCard?.studies);
    const assignedToEq = ids(inputs?.assignedTo) === ids(proposalCard?.assignedTo);
    return (
      !descEq || !contentEq || !internalEq || !titleEq || !settingsEq ||
      !resourcesEq || !assignmentsEq || !tasksEq || !studiesEq || !assignedToEq
    );
  };

  const finishAfterCreate = async (cardId, cardMeta) => {
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
          console.error("Auto-propagate after card add failed:", error);
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

  const persistNewCard = async () => {
    const trimmedTitle = String(inputs?.title ?? "").trim();
    if (!trimmedTitle || !sectionId) {
      alert(
        tBuilder("section.enterNewTitle", {}, { default: "Please enter a title" })
      );
      return null;
    }

    const position =
      sectionCards.length > 0
        ? sectionCards[sectionCards.length - 1].position + 16384
        : 16384;

    const createResult = await createCard({
      variables: {
        title: trimmedTitle,
        content: content?.current || "",
        sectionId,
        position,
        publicId: uuidv1(),
        type: inputs?.type || PROPOSAL_CARD_TYPE,
        settings: inputs?.settings || { status: "Not started" },
      },
      refetchQueries: [
        { query: PROPOSAL_QUERY, variables: { id: proposal?.id } },
      ],
      awaitRefetchQueries: true,
    });

    const createdId = createResult?.data?.createProposalCard?.id;
    if (!createdId) {
      throw new Error("Could not create card.");
    }

    await updateCard({
      variables: {
        id: createdId,
        title: trimmedTitle,
        description: description?.current || "",
        internalContent: internalContent?.current || "",
        content: content?.current || "",
        comment: inputs?.comment || "",
        settings: inputs?.settings || { status: "Not started" },
        type: inputs?.type || PROPOSAL_CARD_TYPE,
        assignedTo: inputs?.assignedTo?.map((a) => ({ id: a?.id })),
        resources: inputs?.resources?.map((resource) => ({ id: resource?.id })),
        assignments: inputs?.assignments?.map((assignment) => ({
          id: assignment?.id,
        })),
        tasks: inputs?.tasks?.map((task) => ({ id: task?.id })),
        studies: inputs?.studies?.map((study) => ({ id: study?.id })),
      },
    });

    return { id: createdId, title: trimmedTitle, type: inputs?.type || PROPOSAL_CARD_TYPE };
  };

  // Edits already saved without leaving the card (Preview, linked-items
  // dialog) that student boards haven't received yet. Saving updates the
  // cached card, so hasCardChanges() no longer sees them.
  const savedNotPropagated = useRef({ any: false, contentChanged: false });

  const contentDiffersFromSaved = () =>
    String(content?.current ?? "") !== String(proposalCard?.content ?? "");

  // Save without leaving the card, remembering what still has to reach
  // student boards.
  const saveAndRemember = async () => {
    const contentChanged = contentDiffersFromSaved();
    await saveCardContentOnly();
    savedNotPropagated.current = {
      any: true,
      contentChanged: savedNotPropagated.current.contentChanged || contentChanged,
    };
  };

  const contentChangedCardIds = (contentChanged) =>
    (contentChanged || savedNotPropagated.current.contentChanged) &&
    proposalCard?.id
      ? [proposalCard.id]
      : [];

  // Save card content only (no close, no clone dialog). Used before entering preview.
  const saveCardContentOnly = async () => {
    if (isCreateMode) {
      // Preview in create mode is local-only; nothing to persist yet.
      return;
    }
    await updateCard({
      variables: {
        ...inputs,
        description: description?.current,
        internalContent: internalContent?.current,
        content: content?.current,
        assignedTo: inputs?.assignedTo?.map((a) => ({ id: a?.id })),
        resources: inputs?.resources?.map((resource) => ({ id: resource?.id })),
        assignments: inputs?.assignments?.map((assignment) => ({
          id: assignment?.id,
        })),
        tasks: inputs?.tasks?.map((task) => ({ id: task?.id })),
        studies: inputs?.studies?.map((study) => ({ id: study?.id })),
      },
    });
  };

  // Update logic with clone check: use backend propagateToClones when user chooses to update clones.
  // If the teacher changed the content field (placeholder), pass that card id so clones get the new placeholder.
  const onUpdateCard = async (updateClonesToo = false) => {
    const contentChanged = contentDiffersFromSaved();
    await saveCardContentOnly();

    if (updateClonesToo && propagateToClones) {
      try {
        await propagateToClones({
          contentChangedCardIds: contentChangedCardIds(contentChanged),
        });
      } catch (e) {
        console.error("Propagate to clones failed:", e);
      }
    }
    savedNotPropagated.current = { any: false, contentChanged: false };

    closeCard({ cardId: proposalCard?.id, lockedByUser: false });
  };

  // Trigger save: follow template banner setting (auto-update on = propagate; off = save only).
  const handleSave = async () => {
    if (isCreateMode) {
      if (creating) return;
      setCreating(true);
      try {
        const created = await persistNewCard();
        if (!created) return;
        await finishAfterCreate(created.id, {
          title: created.title,
          type: created.type,
        });
      } catch (err) {
        alert(err?.message);
      } finally {
        setCreating(false);
      }
      return;
    }

    const hasClones = proposal?.prototypeFor?.length > 0;
    const shouldPropagate = hasClones && autoUpdateStudentBoards && propagateToClones;
    if (hasClones && !shouldPropagate) {
      onTemplateChangedWithoutPropagation?.();
    }
    await onUpdateCard(!!shouldPropagate);
  };

  // Enter preview: save current content then show read-only preview
  const handlePreviewAsUser = async () => {
    try {
      if (!isCreateMode && hasCardChanges()) {
        await saveAndRemember();
      }
      setPreviewMode(true);
    } catch (error) {
      // Leave in edit mode; mutation error handling applies
    }
  };

  // When linked items modal closes: save card then propagate if auto-mode on.
  const handleLinkedItemsClose = async () => {
    if (isCreateMode) return;
    if (hasCardChanges()) await saveAndRemember();
    if (!savedNotPropagated.current.any) return;
    const hasClones = proposal?.prototypeFor?.length > 0;
    const shouldPropagate = hasClones && autoUpdateStudentBoards && propagateToClones;
    if (shouldPropagate) {
      try {
        await propagateToClones({
          contentChangedCardIds: contentChangedCardIds(false),
        });
        savedNotPropagated.current = { any: false, contentChanged: false };
      } catch (e) {
        console.error("Propagate to clones failed:", e);
      }
    }
  };

  // Calculate total linked items
  const totalLinked = [
    ...(inputs?.resources || []),
    ...(inputs?.assignments || []),
    ...(inputs?.tasks || []),
    ...(inputs?.studies || []),
  ].length;

  const handleBackToBoard = async () => {
    if (isCreateMode) {
      // Discard unpersisted create — never leave a ghost card.
      closeCard({ cardId: false, lockedByUser: false });
      return;
    }
    try {
      const hasUnsaved = hasCardChanges();
      if (!hasUnsaved && !savedNotPropagated.current.any) {
        closeCard({ cardId: proposalCard?.id, lockedByUser: false });
        return;
      }
      const contentChanged = contentDiffersFromSaved();
      if (hasUnsaved) await saveCardContentOnly();
      closeCard({ cardId: proposalCard?.id, lockedByUser: false });
      const hasClones = proposal?.prototypeFor?.length > 0;
      const shouldPropagate =
        hasClones && autoUpdateStudentBoards && propagateToClones;
      if (shouldPropagate) {
        propagateToClones({
          contentChangedCardIds: contentChangedCardIds(contentChanged),
        }).catch((e) => {
          console.error("Propagate to clones failed:", e);
        });
      } else if (hasClones) {
        onTemplateChangedWithoutPropagation?.();
      }
    } catch (e) {
      // Leave card open; mutation error handling applies
    }
  };

  const savingBusy = updateLoading || createLoading || creating;
  const createDisabled =
    isCreateMode &&
    (!String(inputs?.title ?? "").trim() || !sectionId || creating);

  useEffect(() => {
    if (!registerCloseHandler) return undefined;
    registerCloseHandler(handleBackToBoard);
    return () => registerCloseHandler(null);
  });

  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;
  const handlePreviewRef = useRef(handlePreviewAsUser);
  handlePreviewRef.current = handlePreviewAsUser;

  useEffect(() => {
    if (!registerCardChrome) return undefined;
    registerCardChrome({
      kind: "project",
      previewMode,
      saving: savingBusy,
      saveDisabled: createDisabled,
      typeLabel: isCreateMode
        ? tBuilder(
            "section.createProposalCard.typeLabel",
            {},
            { default: "New card" }
          )
        : null,
      saveLabel: isCreateMode
        ? creating
          ? tBuilder(
              "section.createCardModal.creating",
              {},
              { default: "Creating..." }
            )
          : tBuilder(
              "section.createProposalCard.addToBoard",
              {},
              { default: "Add to board" }
            )
        : null,
      onSave: () => handleSaveRef.current(),
      onPreview: () => handlePreviewRef.current(),
      onExitPreview: () => setPreviewMode(false),
    });
  }, [
    registerCardChrome,
    previewMode,
    savingBusy,
    createDisabled,
    isCreateMode,
    creating,
    tBuilder,
  ]);

  useEffect(() => {
    if (!registerCardChrome) return undefined;
    return () => registerCardChrome(null);
  }, [registerCardChrome]);

  if (previewMode) {
    // The student card page itself, read-only, fed from the unsaved form.
    return (
      <div className="post">
        <AssignmentViewModal
          user={user}
          open={viewAssignmentModalOpen}
          t={t}
          onClose={() => setViewAssignmentModalOpen(false)}
          assignmentId={viewAssignmentId}
        />
        <StudentProjectCard
          user={user}
          proposal={proposal}
          proposalId={proposal?.id}
          cardId={proposalCard?.id ?? null}
          proposalCard={{
            ...(proposalCard || {}),
            ...inputs,
            description: description.current,
            content: content.current,
          }}
          isLocked={false}
          submitStatuses={{}}
          isPreview
          onOpenAssignment={openViewAssignmentModal}
        />
      </div>
    );
  }

  return (
    <div className="post">
      <div className="proposalCardBoard">
        <div className="textBoard">
          <label htmlFor="title">
            <div className="cardHeader" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {t("board.expendedCard.title")}
              <InfoPopover
                content={t(
                  "board.expendedCard.titleText",
                  {},
                  {
                    default:
                      "Add or edit the card title. This title will appear as a section header in student submissions to the Feedback Center if the card is associated with a review step.",
                  }
                )}
                ariaLabel={t("board.expendedCard.title")}
              />
            </div>
            <p></p>
            <input
              type="text"
              id="title"
              name="title"
              value={inputs?.title}
              onChange={handleChange}
              autoFocus={isCreateMode}
              placeholder={
                isCreateMode
                  ? tBuilder(
                      "section.createCardModal.titlePlaceholder",
                      {},
                      { default: "Enter a card title" }
                    )
                  : undefined
              }
            />
          </label>
          <label htmlFor="description">
            <div className="cardHeader" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {t("board.expendedCard.instructions")}
              <InfoPopover
                content={t(
                  "board.expendedCard.instructionsText",
                  "Add or edit instructions for students telling them how to complete the card."
                )}
                ariaLabel={t("board.expendedCard.instructions")}
              />
            </div>
            <TipTapEditor
              content={description?.current}
              onUpdate={(newContent) =>
                handleContentChange({
                  contentType: "description",
                  newContent,
                })
              }
              mediaLibraryId={proposal?.id}
              mediaLibrarySource={{
                sourceType: "projectCard",
                sourceId: inputs?.id || proposalCard?.id || null,
                createdWith: "upload",
              }}
              mediaDisplayedInProposalCardId={
                inputs?.id || proposalCard?.id || null
              }
            />
          </label>

          {inputs?.settings?.includeInReport && (
            <>
              <label htmlFor="description">
                <div className="cardHeader" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {t("board.expendedCard.studentResponseBoxNetwork")}
                  <InfoPopover
                    content={t(
                      "board.expendedCard.studentResponseBoxNetworkText",
                      "The content students include here will be visible in the Feedback Center once it is submitted via an Action Card. Include any templates or placeholder text as needed"
                    )}
                    ariaLabel={t("board.expendedCard.studentResponseBoxNetwork")}
                  />
                </div>
              </label>
                            {/* Show warning box after editor is clicked and if proposal has child proposals */}
                            {showWarningBox && proposal?.prototypeFor?.length > 0 && (
                <div 
                  style={{
                    position: "relative",
                    display: "flex",
                    width: "100%",
                    marginTop: "16px",
                    padding: "12px 16px",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexShrink: "0",
                    borderRadius: "8px",
                    background: "#EDCECD",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    const tooltip = e.currentTarget.querySelector('.hover-tooltip');
                    if (tooltip) {
                      tooltip.style.opacity = "1";
                      tooltip.style.transform = "translateY(0)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    const tooltip = e.currentTarget.querySelector('.hover-tooltip');
                    if (tooltip) {
                      tooltip.style.opacity = "0";
                      tooltip.style.transform = "translateY(-5px)";
                    }
                  }}
                >
                  <p style={{
                    color: "#8F1F14",
                    font: 'var(--MH-Type-Body-Base)',
                    letterSpacing: 0,
                    margin: 0,
                    }}>
                    {t("board.expendedCard.overwriteWarning", "")}
                  </p>

                  <div style={{
                    width: "20px",
                    height: "20px",
                    flexShrink: 0,
                  }}>
                    <img src="/assets/icons/info_red.svg" alt="warning" />
                  </div>

                  {/* Hover tooltip */}
                  <div 
                    className="hover-tooltip"
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: "0",
                      right: "0",
                      background: "#CF6D6A",
                      color: "white",
                      marginTop: "8px",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      font: 'var(--MH-Type-Body-Base)',
                      letterSpacing: 0,
                      opacity: "0",
                      transform: "translateY(-5px)",
                      transition: "all 0.3s ease",
                      pointerEvents: "none",
                      zIndex: 1000,
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    }}
                  >
                    <span>{t("board.expendedCard.overwriteWarningDetails1", "Making changes in the Student Response box will overwrite any content added by your students, which may result in the loss of their progress. Only proceed if you are certain that no students have already started working on this card.")}</span>
                    <br /><br />
                    <span>{t("board.expendedCard.overwriteWarningDetails2", "If you are unsure or want to update instructions without affecting student progress, consider editing the Instruction field instead. You can use it to provide updated guidance or new placeholder content.")}</span>
                  </div>
                </div>
              )}
              <div onClick={() => proposal?.prototypeFor?.length > 0 && setShowWarningBox(true)}>
                <TipTapEditor
                  content={content?.current}
                  onUpdate={(newContent) =>
                    handleContentChange({
                      contentType: "content",
                      newContent,
                    })
                  }
                  mediaLibraryId={proposal?.id}
                  mediaLibrarySource={{
                    sourceType: "projectCard",
                    sourceId: inputs?.id || proposalCard?.id || null,
                    createdWith: "upload",
                  }}
                  mediaDisplayedInProposalCardId={
                    inputs?.id || proposalCard?.id || null
                  }
                />
              </div>
            </>
          )}
        </div>
        <div className="infoBoard infoBoardEdit">
          <>
            <div className="cardHeader" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {t("board.expendedCard.linkedItems", "Linked Items")}
              <InfoPopover
                content={t(
                  "board.expendedCard.addLinkedItems",
                  "Add existing assignments, tasks, studies, or resources"
                )}
                ariaLabel={t("board.expendedCard.linkedItems", "Linked Items")}
                width={240}
              />
            </div>
            <LinkedItems
              proposal={proposal}
              user={user}
              handleChange={handleChange}
              selectedResources={inputs?.resources || []}
              selectedAssignments={inputs?.assignments || []}
              selectedTasks={inputs?.tasks || []}
              selectedStudies={inputs?.studies || []}
              totalLinked={totalLinked}
              onAssignmentPublicChange={(assignmentId, publicValue) => {
                const next = (inputs?.assignments || []).map((a) =>
                  a?.id === assignmentId ? { ...a, public: publicValue } : a
                );
                handleChange({ target: { name: "assignments", value: next } });
              }}
              onLinkedItemsClose={handleLinkedItemsClose}
            />
          </>

          <div className="proposalCardComments">
            <div className="cardHeader" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {t("board.expendedCard.comments")}
              <InfoPopover
                content={t("board.expendedCard.commentsText")}
                ariaLabel={t("board.expendedCard.comments")}
                side="top"
                align="end"
              />
            </div>
            <TipTapEditor
              content={inputs.comment}
              placeholder={t("board.commentPlaceholder", "Enter a comment...")}
              onUpdate={(newContent) =>
                handleChange({
                  target: {
                    name: "comment",
                    value: newContent,
                  },
                })
              }
              limitedToolbar={true}
              mediaLibraryId={proposal?.id}
              mediaLibrarySource={{
                sourceType: "projectCard",
                sourceId: inputs?.id || proposalCard?.id || null,
                createdWith: "upload",
              }}
              mediaDisplayedInProposalCardId={
                inputs?.id || proposalCard?.id || null
              }
            />
          </div>

          {user?.permissions?.map((p) => p?.name).includes("ADMIN") && (
            <div className="proposalCardComments">
              <div className="cardHeader">{t("board.expendedCard.type")}</div>
              <CardType type={inputs?.type} handleChange={handleChange} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
