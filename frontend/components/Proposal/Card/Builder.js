import { useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import { Checkbox, Dropdown, Modal, Icon, Popup } from "semantic-ui-react";
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
import InfoTooltip from "../../Builder/Project/ProjectBoard/Board/PDF/Preview/InfoTooltip";
import useTranslation from "next-translate/useTranslation";

const peerReviewOptions = [
  {
    key: "actionSubmit",
    text: "Proposal",
    value: "ACTION_SUBMIT",
  },
  {
    key: "actionPeerFeedback",
    text: "Peer Feedback",
    value: "ACTION_PEER_FEEDBACK",
  },
  {
    key: "actionCollectingData",
    text: "Collecting Data",
    value: "ACTION_COLLECTING_DATA",
  },
  {
    key: "actionProjectReport",
    text: "Project Report",
    value: "ACTION_PROJECT_REPORT",
  },
];

export default function BuilderProposalCard({
  user,
  proposal,
  proposalCard,
  closeCard,
  autoUpdateStudentBoards,
  propagateToClones,
}) {
  const { t } = useTranslation("classes");
  const { inputs, handleChange } = useForm({
    ...proposalCard,
  });

  const description = useRef(proposalCard?.description);
  const content = useRef(proposalCard?.content);
  const internalContent = useRef(proposalCard?.internalContent);

  const [updateCard, { loading: updateLoading }] =
    useMutation(UPDATE_CARD_CONTENT);

  const [showCloneDialog, setShowCloneDialog] = useState(false);
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

  // Trigger save with clone check
  const handleSave = async () => {
    if (proposal?.prototypeFor?.length > 0) {
      if (autoUpdateStudentBoards && propagateToClones) {
        await onUpdateCard(true);
      } else {
        setShowCloneDialog(true);
      }
    } else {
      await onUpdateCard(false);
    }
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

  // Modal handlers
  const handleCloneYes = async () => {
    setShowCloneDialog(false);
    await onUpdateCard(true);
  };

  const handleCloneNo = () => {
    setShowCloneDialog(false);
    onUpdateCard(false);
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
            onClick={() =>
              closeCard({ cardId: proposalCard?.id, lockedByUser: false })
            }
          >
            <div className="selector">
              <img src="/assets/icons/back.svg" alt="back" />
            </div>
          </div>
        </div>
        <div className="middle">
          <span className="studyTitle">{proposal?.title}</span>
        </div>
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

      {/* Clone Update Modal */}
      <Modal open={showCloneDialog} onClose={handleCloneNo} size="medium" style={{ borderRadius: "12px", overflow: "hidden" }}>
        <Modal.Header style={{ background: "#f9fafb", borderBottom: "1px solid #e0e0e0", fontFamily: "Nunito", fontWeight: 600,
        }}>Update Cloned Boards?</Modal.Header>
        <Modal.Content style={{ background: "#ffffff", padding: "24px" }}>
          <p>
            This board has {proposal?.prototypeFor?.length} cloned project
            board(s). Do you want to update the corresponding cards in all
            cloned project boards with these changes? (This will update titles,
            descriptions, settings, and linked items: resources, assignments,
            tasks, and studies.)
          </p>
        </Modal.Content>
        <Modal.Actions style={{ background: "#f9fafb", borderTop: "1px solid #e0e0e0" }} >
          <button
            type="button"
            className="narrowButtonSecondary"
            onClick={handleCloneNo}
            style={{
              marginRight: "10px",
              height: "40px",
              padding: "8px 24px 8px 16px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              borderRadius: "100px",
              fontSize: "16px",
              fontWeight: 500,
              cursor: "pointer",
              background: "white",
              color: "#CF6D6A",
              border: "1px solid #CF6D6A",
            }}
          >
            {t("board.expendedCard.updateOnlyThisBoard", "No, update only this board")}
          </button>
          <button
            type="button"
            className="narrowButton"
            onClick={handleCloneYes}
            disabled={updateLoading}
            style={{
              marginRight: "10px",
              height: "40px",
              padding: "8px 24px 8px 16px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              borderRadius: "100px",
              fontSize: "16px",
              fontWeight: 500,
              cursor: updateLoading ? "not-allowed" : "pointer",
              background: "#336F8A",
              color: "white",
              border: "1px solid #336F8A",
            }}
          >
            {updateLoading ? (
              t("board.expendedCard.updating", "Updating…")
            ) : (
              t("board.expendedCard.updateAllClones", "Yes, update all clones")
            )}
          </button>
        </Modal.Actions>
      </Modal>

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
            <div className="cardSubheader">{t("board.expendedCard.instructions", "Instructions for Students")}</div>
            <ReadOnlyTipTap>
              <div className="ProseMirror">
                {ReactHtmlParser(description?.current || inputs?.description || "")}
              </div>
            </ReadOnlyTipTap>
            {inputs?.settings?.includeInReport && (
              <>
                <div className="cardSubheader">{t("board.expendedCard.studentResponseBoxNetwork", "Student Response Box - For MindHive Network")}</div>
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
            />
          </>

          <div className="proposalCardComments">
            <div className="cardHeader" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {t("board.expendedCard.comments")}
              <InfoTooltip
                content={t("board.expendedCard.commentsText")}
                iconStyle={{opacity: 0.4}}
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
          <>
            <div className="cardHeader" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {t("board.expendedCard.visibility")}
              <InfoTooltip
                content={t(
                  "board.expendedCard.visibilityText",
                  "Check the box below to indicate whether student responses should be made visible in the Feedback Center."
                )}
                iconStyle={{opacity: 0.4}}
              />
            </div>
            <div className="checkboxText">
              <Checkbox
                name="feedbackCenterCardToggle"
                id="feedbackCenterCardToggle"
                onChange={(event, data) =>
                  handleChange({
                    target: {
                      name: "settings",
                      value: {
                        ...inputs.settings,
                        includeInReport: data.checked,
                      },
                    },
                  })
                }
                checked={inputs?.settings?.includeInReport}
              />
              <label htmlFor="feedbackCenterCardToggle">
                <div className="cardDescription">
                  {t("board.expendedCard.includeTextFeedbackCenter")}
                </div>
              </label>
            </div>
          </>

          {inputs?.settings?.includeInReport && (
            <>
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <div className="cardSubheaderComment">
                  {t("board.reviewPhase")}
                </div>
                <Popup
                  content={
                    <p > {t("board.reviewPhaseDescription")} </p>
                  }
                  trigger={
                    <img
                      src="/assets/icons/question_mark.svg" // Next.js serves public/ as root
                      alt="info"
                      style={{
                        width: "16px",
                        height: "16px",
                        marginLeft: "4px",
                        cursor: "pointer",
                        verticalAlign: "middle",
                      }}
                    />
                  }
                />
              </div>
              <Dropdown
                placeholder={t("board.expendedCard.select")}
                fluid
                multiple
                search
                selection
                lazyLoad
                options={peerReviewOptions}
                onChange={(event, data) => {
                  handleChange({
                    target: {
                      name: "settings",
                      value: {
                        ...inputs.settings,
                        includeInReviewSteps: data.value,
                      },
                    },
                  });
                }}
                value={inputs?.settings?.includeInReviewSteps || []}
              />
            </>
          )}


        </div>
      </div>
      )}
    </div>
  );
}
