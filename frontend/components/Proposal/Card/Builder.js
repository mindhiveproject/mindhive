import { useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import { Checkbox, Dropdown, Icon } from "semantic-ui-react";
import { useRouter } from "next/router";
import { UPDATE_CARD_CONTENT } from "../../Mutations/Proposal";

import ReactHtmlParser from "react-html-parser";

import useForm from "../../../lib/useForm";
import TipTapEditor from "../../TipTap/Main";
import { ReadOnlyTipTap } from "../../TipTap/ReadOnlyTipTap";

import CardType from "./Forms/Type";
import LinkedItems from "./Forms/LinkedItems";
import { PreviewSection } from "./Forms/PreviewSection";
import AssignmentViewModal from "../../TipTap/AssignmentViewModal";
import ResourceViewModal from "../../TipTap/ResourceViewModal";
import InfoTooltip from "../../DesignSystem/InfoTooltip";
import Button from "../../DesignSystem/Button";
import useTranslation from "next-translate/useTranslation";

const peerReviewOptions = [
  {
    key: "actionSubmit",
    text: "Proposal",
    value: "ACTION_SUBMIT",
    icon: "/assets/icons/user.svg",
    titleKey: "board.expendedCard.proposalFeedback",
    descriptionKey: "board.expendedCard.proposalFeedbackDescription",
    descriptionFallback: "Card content is shown anonymously to mentors associated with class networks.",
  },
  {
    key: "actionPeerFeedback",
    text: "Peer Feedback",
    value: "ACTION_PEER_FEEDBACK",
    icon: "/assets/connect/group.svg",
    titleKey: "board.expendedCard.peerFeedback",
    descriptionKey: "board.expendedCard.peerFeedbackDescription",
    descriptionFallback: "Content and participation links shown to both mentors and students in the networks.",
  },
  // {
  //   key: "actionCollectingData",
  //   text: "Collecting Data",
  //   value: "ACTION_COLLECTING_DATA",
  //   icon: "/assets/icons/project/collect.svg",
  //   titleKey: "board.expendedCard.collectingData",
  //   descriptionKey: "board.expendedCard.collectingDataDescription",
  //   descriptionFallback: "Card marked as submitted while associated studies are locked for stable data collection.",
  // },
  {
    key: "actionProjectReport",
    text: "Project Report",
    value: "ACTION_PROJECT_REPORT",
    icon: "/assets/icons/document.svg",
    titleKey: "board.expendedCard.projectReport",
    descriptionKey: "board.expendedCard.projectReportDescription",
    descriptionFallback: "A simple label to select cards that will be included in the exported PDF report.",
  },
];

export default function BuilderProposalCard({
  user,
  proposal,
  proposalCard,
  closeCard,
  autoUpdateStudentBoards,
  propagateToClones,
  onTemplateChangedWithoutPropagation,
}) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const { inputs, handleChange } = useForm({
    ...proposalCard,
  });

  const description = useRef(proposalCard?.description);
  const content = useRef(proposalCard?.content);
  const internalContent = useRef(proposalCard?.internalContent);

  const [updateCard, { loading: updateLoading }] =
    useMutation(UPDATE_CARD_CONTENT);

  const [showWarningBox, setShowWarningBox] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Preview modals: assignment view + resource view (when user clicks items in preview mode)
  const [viewAssignmentModalOpen, setViewAssignmentModalOpen] = useState(false);
  const [viewAssignmentId, setViewAssignmentId] = useState(null);
  const [viewResourceModalOpen, setViewResourceModalOpen] = useState(false);
  const [viewResourceId, setViewResourceId] = useState(null);

  const openViewAssignmentModal = (assignment) => {
    if (!assignment?.id) return;
    setViewAssignmentId(assignment.id);
    setViewAssignmentModalOpen(true);
  };

  const openViewResourceModal = (resource) => {
    if (!resource?.id) return;
    setViewResourceId(resource.id);
    setViewResourceModalOpen(true);
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

  // Save card content only (no close, no clone dialog). Used before entering preview.
  const saveCardContentOnly = async () => {
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
    await saveCardContentOnly();

    if (updateClonesToo && propagateToClones) {
      try {
        const contentChanged =
          String(content?.current ?? "") !==
          String(proposalCard?.content ?? "");
        await propagateToClones({
          contentChangedCardIds:
            contentChanged && proposalCard?.id ? [proposalCard.id] : [],
        });
      } catch (e) {
        console.error("Propagate to clones failed:", e);
      }
    }

    closeCard({ cardId: proposalCard?.id, lockedByUser: false });
  };

  // Trigger save: follow template banner setting (auto-update on = propagate; off = save only).
  const handleSave = async () => {
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
      await saveCardContentOnly();
      setPreviewMode(true);
    } catch (error) {
      // Leave in edit mode; mutation error handling applies
    }
  };

  // When linked items modal closes: save card then propagate if auto-mode on.
  const handleLinkedItemsClose = async () => {
    await saveCardContentOnly();
    const hasClones = proposal?.prototypeFor?.length > 0;
    const shouldPropagate = hasClones && autoUpdateStudentBoards && propagateToClones;
    if (shouldPropagate) {
      try {
        await propagateToClones({ contentChangedCardIds: [] });
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

  return (
    <div className="post">
      <div className="navigation-build-mode">
        <div className="left">
          <div
            className="icon"
            onClick={async () => {
              try {
                if (!hasCardChanges()) {
                  closeCard({ cardId: proposalCard?.id, lockedByUser: false });
                  return;
                }
                await saveCardContentOnly();
                closeCard({ cardId: proposalCard?.id, lockedByUser: false });
                const hasClones = proposal?.prototypeFor?.length > 0;
                const shouldPropagate = hasClones && autoUpdateStudentBoards && propagateToClones;
                if (shouldPropagate) {
                  const contentChanged =
                    String(content?.current ?? "") !==
                    String(proposalCard?.content ?? "");
                  propagateToClones({
                    contentChangedCardIds:
                      contentChanged && proposalCard?.id ? [proposalCard.id] : [],
                  }).catch((e) => {
                    console.error("Propagate to clones failed:", e);
                  });
                } else if (hasClones) {
                  onTemplateChangedWithoutPropagation?.();
                }
              } catch (e) {
                // Leave card open; mutation error handling applies
              }
            }}
            style={{ opacity: updateLoading ? 0.6 : 1, pointerEvents: updateLoading ? "none" : "auto" }}
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
        <div className={`right${previewMode ? " rightPreviewMode" : ""}`}>
          {previewMode ? (
            <button
              type="button"
              onClick={() => setPreviewMode(false)}
              className="narrowButton"
              style={{ marginRight: "10px" }}
            >
              <Icon name="angle left" /> {t("board.expendedCard.backToEditing", "Back to editing")}
            </button>
          ) : (
            <>
              <div className="editModeMessage">
                {t("board.editMode", "You are in Edit Mode")}
              </div>
              <button
                type="button"
                onClick={handlePreviewAsUser}
                disabled={updateLoading}
                className="narrowButtonSecondary"
              >
                {t("board.expendedCard.preview", "Preview")}
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="narrowButton"
                disabled={updateLoading}
              >
                {t("board.save", "Save")}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Preview modals: open when user clicks linked items in preview mode */}
      <AssignmentViewModal
        user={user}
        open={viewAssignmentModalOpen}
        t={t}
        onClose={() => setViewAssignmentModalOpen(false)}
        assignmentId={viewAssignmentId}
      />
      <ResourceViewModal
        open={viewResourceModalOpen}
        t={t}
        onClose={() => setViewResourceModalOpen(false)}
        resourceId={viewResourceId}
      />

      {previewMode ? (
        <div className="proposalCardBoard">
          <div className="textBoard">
            <div className="cardHeader">{inputs?.title || proposalCard?.title}</div>
            <div className="cardSubheader">
              {t("assignment.instructions", "Instructions")}
            </div>
            <ReadOnlyTipTap>
              <div className="ProseMirror">
                {ReactHtmlParser(description?.current || inputs?.description || "")}
              </div>
            </ReadOnlyTipTap>
            {inputs?.settings?.includeInReport && (
              <>
                <div className="cardSubheader">
                  {t("mainCard.forMindHiveNetwork", "Your entry")}
                </div>
                <ReadOnlyTipTap>
                  <div className="ProseMirror">
                    {ReactHtmlParser(content?.current || inputs?.content || "")}
                  </div>
                </ReadOnlyTipTap>
              </>
            )}
          </div>
          <div className="infoBoard">
            {/* Display Linked Items: Assignments first, then combined Resources */}
            {inputs?.assignments?.length > 0 && (
              <PreviewSection
                title={t("board.expendedCard.previewLinkedAssignments")}
                items={inputs?.assignments}
                type="assignment"
                proposal={proposal}
                openAssignmentModal={openViewAssignmentModal}
                user={user}
              />
            )}
            {(inputs?.resources?.length > 0 || inputs?.tasks?.length > 0 || inputs?.studies?.length > 0) && (
              <PreviewSection
                title={t("board.expendedCard.previewLinkedResources")}
                sections={[
                  ...(inputs?.resources?.length > 0 ? [{ items: inputs.resources, type: "resource" }] : []),
                  ...(inputs?.tasks?.length > 0 ? [{ items: inputs.tasks, type: "task" }] : []),
                  ...(inputs?.studies?.length > 0 ? [{ items: inputs.studies, type: "study" }] : []),
                ]}
                proposal={proposal}
                openAssignmentModal={openViewAssignmentModal}
                openResourceModal={openViewResourceModal}
                user={user}
              />
            )}
            {[
              ...(inputs?.resources || []),
              ...(inputs?.assignments || []),
              ...(inputs?.tasks || []),
              ...(inputs?.studies || []),
            ].length === 0 && (
              <div>
                <div className="cardHeader">{t("board.expendedCard.linkedItems", "Linked Items")}</div>
                <div className="cardSubheaderComment">
                  {t("board.expendedCard.addLinkedItems", "Add existing assignments, tasks, studies, or resources")}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
      <div className="proposalCardBoard">
        <div className="textBoard">
          <label htmlFor="title">
            <div className="cardHeader" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {t("board.expendedCard.title")}
              <InfoTooltip
                content={t(
                  "board.expendedCard.titleText",
                  "Add or edit the card title. This title will appear as a section header in student submissions to the Feedback Center if the box titled 'Include text input for Feedback Center' is checked."
                )}
                iconStyle={{opacity: 0.4}}
              />
            </div>
            <p></p>
            <input
              type="text"
              id="title"
              name="title"
              value={inputs?.title}
              onChange={handleChange}
            />
          </label>
          <label htmlFor="description">
            <div className="cardHeader" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {t("board.expendedCard.instructions")}
              <InfoTooltip
                content={t(
                  "board.expendedCard.instructionsText",
                  "Add or edit instructions for students telling them how to complete the card."
                )}
                iconStyle={{opacity: 0.4}}
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
            />
          </label>

          {inputs?.settings?.includeInReport && (
            <>
              <label htmlFor="description">
                <div className="cardHeader" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {t("board.expendedCard.studentResponseBoxNetwork")}
                  <InfoTooltip
                    content={t(
                      "board.expendedCard.studentResponseBoxNetworkText",
                      "The content students include here will be visible in the Feedback Center once it is submitted via an Action Card. Include any templates or placeholder text as needed"
                    )}
                    iconStyle={{opacity: 0.4}}
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
                    fontFamily: "Nunito",
                    fontSize: "16px",
                    fontStyle: "normal",
                    fontWeight: "400",
                    lineHeight: "24px",
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
                      fontSize: "16px",
                      fontFamily: "Nunito",
                      lineHeight: "20px",
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
                />
              </div>
            </>
          )}
        </div>
        <div className="infoBoard">
          <>
            <div className="cardHeader" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {t("board.expendedCard.linkedItems", "Linked Items")}
              <InfoTooltip
                content={t(
                  "board.expendedCard.addLinkedItems",
                  "Add existing assignments, tasks, studies, or resources"
                )}
                iconStyle={{
                  opacity: 0.4,
                }}
                tooltipStyle={{
                  width: "200px",
                }}
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
              <InfoTooltip
                content={t("board.expendedCard.commentsText")}
                iconStyle={{opacity: 0.4}}
                position="topRight"
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
            />
          </div>

          <div className="proposalCardComments">
            <div className="cardHeader">{t("board.expendedCard.type")}</div>
            <CardType type={inputs?.type} handleChange={handleChange} />
          </div>
          {/* Student Answer Box panel */}
          <div className="visibilityPanel">
            <div className="visibilityPanelHeader">
              <div>
                <div className="visibilityPanelTitleRow">
                  <span className="cardHeader">
                    {t("board.expendedCard.studentAnswerBox", "Student Answer Box")}
                  </span>
                  <InfoTooltip
                    content={t(
                      "board.expendedCard.studentAnswerBoxTooltip",
                      "When enabled, students can type a response in a dedicated field on this card."
                    )}
                    iconStyle={{ opacity: 0.4 }}
                    position="topRight"
                  />
                </div>
                <div className="cardDescription" style={{ marginTop: "4px" }}>
                  {t("board.expendedCard.studentAnswerBoxDescription", "Enable input field for students on this card")}
                </div>
              </div>
              <Checkbox
                toggle
                name="feedbackCenterCardToggle"
                id="feedbackCenterCardToggle"
                onChange={(event, data) => {
                  const wasIncluded = !!inputs?.settings?.includeInReport;
                  const nextSettings = {
                    ...(inputs.settings || {}),
                    includeInReport: data.checked,
                  };

                  if (data.checked && !wasIncluded) {
                    const currentSteps = inputs?.settings?.includeInReviewSteps || [];
                    if (!currentSteps.length) {
                      nextSettings.includeInReviewSteps = peerReviewOptions.map(
                        (option) => option.value
                      );
                    }

                    alert(
                      t(
                        "board.expendedCard.feedbackCenterToggleOnAlert",
                        "Response box added!\n- The default selection will show text from this response box in the Feedback Center for all action card steps on the Project Board.\n- Please deselect any action card steps if you do not want the student response to go to the Feedback Center."
                      )
                    );
                  }

                  handleChange({
                    target: {
                      name: "settings",
                      value: nextSettings,
                    },
                  });
                }}
                checked={!!inputs?.settings?.includeInReport}
              />
            </div>
            
            {/* Feedback Center panel — only when Student Answer Box is enabled */}
            {inputs?.settings?.includeInReport && (
              <div className="feedbackCenterPanel">
                <div className="feedbackCenterPanelHeader">
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
                    <div className="feedbackCenterPanelTitleRow">
                      <img
                        src="/assets/connect/group.svg"
                        alt=""
                        aria-hidden
                        style={{ width: 24, height: 24, flexShrink: 0 }}
                      />
                      <span className="cardHeader">
                        {t("board.expendedCard.feedbackCenter", "Feedback Center")}
                      </span>
                    </div>
                    <div className="cardDescription" style={{ marginTop: "4px" }}>
                      {t("board.expendedCard.feedbackCenterDescription", "Choose how students' contributions will be shared and reviewed within the network.")}
                    </div>
                    {/* <Button
                      variant="text"
                      leadingIcon={
                        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                          <path
                            d="M11 17H7C5.61667 17 4.4375 16.5125 3.4625 15.5375C2.4875 14.5625 2 13.3833 2 12C2 10.6167 2.4875 9.4375 3.4625 8.4625C4.4375 7.4875 5.61667 7 7 7H11V9H7C6.16667 9 5.45833 9.29167 4.875 9.875C4.29167 10.4583 4 11.1667 4 12C4 12.8333 4.29167 13.5417 4.875 14.125C5.45833 14.7083 6.16667 15 7 15H11V17ZM8 13V11H16V13H8ZM13 17V15H17C17.8333 15 18.5417 14.7083 19.125 14.125C19.7083 13.5417 20 12.8333 20 12C20 11.1667 19.7083 10.4583 19.125 9.875C18.5417 9.29167 17.8333 9 17 9H13V7H17C18.3833 7 19.5625 7.4875 20.5375 8.4625C21.5125 9.4375 22 10.6167 22 12C22 13.3833 21.5125 14.5625 20.5375 15.5375C19.5625 16.5125 18.3833 17 17 17H13Z"
                            fill="currentColor"
                          />
                        </svg>
                      }
                      onClick={() => {
                        const classCode = proposal?.templateForClasses?.[0]?.code;
                        if (classCode) {
                          const url = `/dashboard/myclasses/${classCode}?page=settings`;
                          window.open(url, "_blank", "noopener,noreferrer");
                        } else {
                          alert(t("board.expendedCard.manageNetworksAlert", "Please connect a class to this proposal before managing networks."));
                        }
                      }}
                    >
                      {t("board.expendedCard.manageNetworks", "Manage Networks")}
                    </Button> */}
                  </div>
                </div>

                <div className="feedbackOptionCards">
                  {peerReviewOptions.map((option) => {
                    const current = inputs?.settings?.includeInReviewSteps || [];
                    const selected = current.includes(option.value);
                    const toggleReviewStep = () => {
                      const next = selected
                        ? current.filter((v) => v !== option.value)
                        : [...current, option.value];
                      handleChange({
                        target: {
                          name: "settings",
                          value: {
                            ...inputs.settings,
                            includeInReviewSteps: next,
                          },
                        },
                      });
                    };
                    return (
                      <div
                        key={option.key}
                        role="button"
                        tabIndex={0}
                        aria-pressed={selected}
                        className={`feedbackOptionCard ${selected ? "feedbackOptionCardSelected" : ""}`}
                        onClick={toggleReviewStep}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleReviewStep();
                          }
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(255, 255, 255, 0.7)",
                            border: `1px solid ${selected ? "#336F8A" : "#E0E0E0"}`,
                            padding: "4px",
                            borderRadius: "8px",
                            width: "40px",
                            height: "40px",
                          }}
                        >
                          <img
                            src={option.icon}
                            alt=""
                            aria-hidden
                            className="feedbackOptionCardIcon"
                            style={{ filter: selected ? "opacity(1)" : "opacity(0.6)" }}
                          />
                        </div>
                        <div className="feedbackOptionCardContent">
                          <div className="feedbackOptionCardTitle">
                            {t(option.titleKey, option.text)}
                          </div>
                          <div className="feedbackOptionCardDescription">
                            {t(option.descriptionKey, option.descriptionFallback)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
