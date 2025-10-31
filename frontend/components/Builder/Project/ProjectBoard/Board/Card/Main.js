import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";

import ReactHtmlParser from "react-html-parser";
import moment from "moment";
import useTranslation from "next-translate/useTranslation";

import { UPDATE_CARD_CONTENT } from "../../../../../Mutations/Proposal";
import { UPDATE_CARD_EDIT } from "../../../../../Mutations/Proposal";
import { GET_CARD_CONTENT } from "../../../../../Queries/Proposal";

import { CREATE_HOMEWORK } from "../../../../../Mutations/Homework"; // Adjust path as needed
import { GET_MY_HOMEWORKS_FOR_ASSIGNMENT } from "../../../../../Queries/Homework"; // Adjust path as needed
import { GET_AN_ASSIGNMENT } from "../../../../../Queries/Assignment"; // Adjust path as needed

import useForm from "../../../../../../lib/useForm";

import Navigation from "./Navigation/Main";
import Assigned from "./Forms/Assigned";
import Status from "../../../../../Dashboard/TeacherClasses/ClassPage/Assignments/Homework/Status";
import TipTapEditor from "../../../../../TipTap/Main";
import { PreviewSection } from "../../../../../Proposal/Card/Forms/LinkedItems";
import { Modal, Button, Icon, Dropdown, Accordion } from "semantic-ui-react";

import { StyledProposal } from "../../../../../styles/StyledProposal";
import { ReadOnlyTipTap } from "../../../../../TipTap/ReadOnlyTipTap";

export default function ProposalCard({
  proposalCard,
  query,
  tab,
  user,
  proposalId,
  proposal,
  cardId,
  refreshPage,
  isLocked,
  submitStatuses,
}) {
  const { t } = useTranslation("builder");
  const [originalActive, setOriginalActive] = useState(false); // For accordion state, default collapsed
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false); // For assignment modal
  const [selectedAssignment, setSelectedAssignment] = useState(null); // For selected assignment

  const reviewOptions = [
    {
      key: "actionSubmit",
      text: t("mainCard.reviewOptions.proposal", "Proposal"),
      value: "ACTION_SUBMIT",
    },
    {
      key: "actionPeerFeedback",
      text: t("mainCard.reviewOptions.peerFeedback", "Peer Feedback"),
      value: "ACTION_PEER_FEEDBACK",
    },
    {
      key: "actionCollectingData",
      text: t("mainCard.reviewOptions.collectingData", "Collecting Data"),
      value: "ACTION_COLLECTING_DATA",
    },
    {
      key: "actionProjectReport",
      text: t("mainCard.reviewOptions.projectReport", "Project Report"),
      value: "ACTION_PROJECT_REPORT",
    },
  ];

  const filteredReviewOptions = reviewOptions.filter(
    (option) => submitStatuses[option?.value] !== "SUBMITTED"
  );

  const router = useRouter();
  // check whether the card is locked - after 1 hour it is allowed to edit
  const releaseTime =
    new Date(proposalCard?.lastTimeEdited)?.getTime() + 60 * 60 * 1000;
  const outsideTimeWindow = Date.now() > releaseTime;

  // check whether the card is locked by the user
  const [lockedByUser, setLockedByUser] = useState(false);
  const [wasLockedOnFocus, setWasLockedOnFocus] = useState(false);
  const [hasContentChanged, setHasContentChanged] = useState(false);
  const areEditsAllowed = lockedByUser || outsideTimeWindow;

  // useEffect
  useEffect(() => {
    setLockedByUser(proposalCard?.isEditedBy?.username === user?.username);
  }, [proposalCard, user]);

  const { inputs, handleChange } = useForm({
    ...proposalCard,
  });

  const content = useRef(proposalCard?.content);
  const internalContent = useRef(proposalCard?.internalContent);
  const revisedContent = useRef(
    proposalCard?.revisedContent || proposalCard?.content
  );

  const [updateCard, { loading: updateLoading }] = useMutation(
    UPDATE_CARD_CONTENT,
    { refetchQueries: [{ query: GET_CARD_CONTENT, variables: { id: cardId } }] }
  );

  const [updateEdit, { loading: updateEditLoading }] = useMutation(
    UPDATE_CARD_EDIT,
    {
      ignoreResults: true,
    }
  );

  const users =
    proposal?.collaborators?.map((user) => ({
      key: user.id,
      text: user.username,
      value: user.id,
    })) || [];
  const allUsers = [...users];

  // update the assignedTo in the local state
  const handleAssignedToChange = (assignedTo) => {
    handleChange({
      target: {
        name: "assignedTo",
        value: assignedTo.map((a) => ({
          id: a,
        })),
      },
    });
    if (!hasContentChanged) setHasContentChanged(true);
  };

  // update the settings in the local state
  const handleSettingsChange = (name, value) => {
    handleChange({
      target: {
        name: "settings",
        value: { ...inputs.settings, [name]: value },
      },
    });
    if (!hasContentChanged) setHasContentChanged(true);
  };

  // Send update to the server when the editor gains focus
  const handleFocus = async () => {
    // lock the card if needed
    if (!wasLockedOnFocus && areEditsAllowed && !lockedByUser) {
      await updateEdit({
        variables: {
          id: cardId,
          input: {
            isEditedBy: { connect: { id: user?.id } },
            lastTimeEdited: new Date(),
          },
        },
      });
      setLockedByUser(true);
    }
    setWasLockedOnFocus(true);
  };

  // update card content in the local state
  const handleContentChange = async ({ contentType, newContent }) => {
    if (contentType === "internalContent") {
      internalContent.current = newContent;
      if (!hasContentChanged && newContent !== inputs?.internalContent)
        setHasContentChanged(true);
    } else if (contentType === "content") {
      content.current = newContent;
      if (!hasContentChanged && newContent !== inputs?.content)
        setHasContentChanged(true);
    } else if (contentType === "revisedContent") {
      revisedContent.current = newContent;
      if (!hasContentChanged && newContent !== inputs?.revisedContent)
        setHasContentChanged(true);
    }
  };

  // update the card and close the modal
  const onUpdateCard = async ({ shoudBeSaved }) => {
    // update the content of the card
    if (shoudBeSaved) {
      await updateCard({
        variables: {
          ...inputs,
          internalContent: internalContent?.current,
          content: content?.current,
          revisedContent: revisedContent?.current,
          assignedTo: inputs?.assignedTo?.map((a) => ({ id: a?.id })),
          resources: inputs?.resources?.map((resource) => ({ id: resource?.id })),
          // Add these three lines to fix the error:
          assignments: inputs?.assignments?.map((assignment) => ({ id: assignment?.id })),
          tasks: inputs?.tasks?.map((task) => ({ id: task?.id })),
          studies: inputs?.studies?.map((study) => ({ id: study?.id })),
        },
      });
    } else {
      if (hasContentChanged) {
        if (
          !confirm(
            "Your unsaved changes will be lost. Click Cancel to return and save the changes."
          )
        ) {
          return;
        }
      }
    }

    // unlock the card
    if (lockedByUser) {
      await updateEdit({
        variables: {
          id: cardId,
          input: {
            isEditedBy: { disconnect: true },
            lastTimeEdited: null,
          },
        },
      });
    }

    // move to the project board
    router.push({
      pathname: `/builder/projects/`,
      query: {
        selector: proposalId,
      },
    });
  };

  // Handler to open assignment modal
  const openAssignmentModalHandler = (assignment) => {
    if (!assignment) {
      console.error("No assignment provided to openAssignmentModalHandler");
      return;
    }
    console.log("Opening modal with assignment:", {
      id: assignment.id,
      title: assignment.title,
      content: assignment.content,
      placeholder: assignment.placeholder,
    });
    setSelectedAssignment(assignment);
    setAssignmentModalOpen(true);
  };

  // Assignment Modal Component
  const AssignmentModal = ({ open, onClose, assignment: assignmentProp }) => {
    const { t } = useTranslation("classes");
    const [title, setTitle] = useState(assignment?.title || "");
    const [content, setContent] = useState(assignment?.content || "");
    const [showNewHomework, setShowNewHomework] = useState(false);
    
    // Query for fresh assignment data with all fields including placeholder
    const { data: assignmentData, loading: assignmentLoading, error: assignmentError } = useQuery(GET_AN_ASSIGNMENT, {
      variables: { id: assignmentProp?.id },
      fetchPolicy: "network-only", // Force fresh fetch
      skip: !assignmentProp?.id || !open, // Only fetch when modal is open and we have an ID
    });

    const assignment = assignmentData?.assignments?.[0] || null;
    console.log(assignmentData)
    
    // Query for existing homeworks for this assignment
    const { data: homeworkData, refetch: refetchHomeworks } = useQuery(GET_MY_HOMEWORKS_FOR_ASSIGNMENT, {
      variables: { userId: user?.id, assignmentCode: assignment?.code },
      skip: !assignment?.code || !user?.id,
    });

    console.log(homeworkData)
    const homeworks = homeworkData?.homeworks || [];

    // New homework form state
    const { inputs, handleChange, clearForm } = useForm({
      settings: { status: "Started" },
      title: `Homework ${assignment?.title || ''} | ${moment().format("YYYY-MM-DD")} | ${user?.username || ''}`,
      placeholder: assignment?.placeholder || "",
    });

    const homeworkContent = useRef("");

    useEffect(() => {
      if (!homeworkContent.current && inputs.placeholder) {
        homeworkContent.current = inputs.placeholder;
      }
    }, [inputs.placeholder]);
  
    // Mutation for creating homework
    const [createHomework, { loading: createLoading }] = useMutation(CREATE_HOMEWORK, {
      refetchQueries: [
        {
          query: GET_MY_HOMEWORKS_FOR_ASSIGNMENT,
          variables: { userId: user?.id, assignmentCode: assignment?.code },
        },
      ],
    });

    useEffect(() => {
      if (assignment) {
        console.log("AssignmentModal: Syncing assignment", {
          id: assignment.id,
          title: assignment.title,
          content: assignment.content,
          placeholder: assignment.placeholder,
        });
        setTitle(assignment.title || "");
        setContent(assignment.content || "");
        
        // Update homework form with assignment data
        handleChange({
          target: {
            name: "title",
            value: `Assignment | ${assignment?.title || ''} | ${moment().format("YYYY-MM-DD")} | ${user?.username || ''}`
          }
        });
        handleChange({
          target: {
            name: "placeholder",
            value: assignment?.placeholder || ""
          }
        });
      
        // Reset homework content with fresh placeholder
        if (assignment?.placeholder) {
          homeworkContent.current = assignment.placeholder;
        }
      } else if (!assignmentLoading && open) {
        console.warn("AssignmentModal opened but no assignment data available");
        setTitle("");
        setContent("");
      }
    }, [assignment, assignmentLoading, open]);

    const h1 = {
      fontSize: "18px",
      fontWeight: "600",
      marginBottom: "16px"
    }
    const instructionBox = {
      lineHeight: "1.5",
      // background: "#F3F3F3",
      borderLeft: "4px solid #274E5B",
      borderRadius: "4px",
      padding: "16px",
      fontSize: "16px",
      fontWeight: "400",
      marginBottom: "16px"
    }
    const styleField = {
      fontSize: "14px",
      lineHeight: "1.5",
      color: "#274E5B",
      border: "1px solid #e0e0e0",
      borderRadius: "8px",
      padding: "12px",
      marginBottom: "3rem"
    }  

    const updateHomeworkContent = async (newContent) => {
      homeworkContent.current = newContent;
    };

    const handleCreateHomeworkDraft = async () => {
      try {
        await createHomework({
          variables: {
            ...inputs,
            content: homeworkContent?.current || inputs.placeholder,
            assignmentId: assignment?.id,
          },
        });
        clearForm();
        setShowNewHomework(false);
        // Optionally close the modal or show success message
        // onClose();
      } catch (error) {
        console.error("Error creating homework:", error);
        alert("Error creating homework: " + error.message);
      }
    };

    const handleCreateHomeworkSubmit = async () => {
      try {
        await createHomework({
          variables: {
            ...inputs,
            content: homeworkContent?.current || inputs.placeholder,
            assignmentId: assignment?.id,
            settings: {"status": "Completed"},
          },
        });
        clearForm();
        setShowNewHomework(false);
        // Optionally close the modal or show success message
        // onClose();
      } catch (error) {
        console.error("Error creating homework:", error);
        alert("Error creating homework: " + error.message);
      }
    };

    if (!assignmentProp?.id || (!assignment && !assignmentLoading)) {
      return null;
    }
      // Show loading state while fetching assignment data
    if (assignmentLoading) {
      return (
        <Modal
          open={open}
          onClose={onClose}
          size="large"
          style={{ borderRadius: "12px", overflow: "hidden" }}
        >
          <Modal.Header
            style={{
              background: "#f9fafb",
              borderBottom: "1px solid #e0e0e0",
              fontFamily: "Nunito",
              fontWeight: 600,
            }}
          >
            {t("assignment.loading")}
          </Modal.Header>
          <Modal.Content style={{ background: "#ffffff", padding: "24px", textAlign: "center" }}>
            <Icon name="spinner" loading size="large" />
            <p>{t("assignment.loadingMessage")}</p>
          </Modal.Content>
        </Modal>
      );
    }

    // Show error state if assignment failed to load
    if (assignmentError) {
      return (
        <Modal
          open={open}
          onClose={onClose}
          size="large"
          style={{ borderRadius: "12px", overflow: "hidden" }}
        >
          <Modal.Header
            style={{
              background: "#f9fafb",
              borderBottom: "1px solid #e0e0e0",
              fontFamily: "Nunito",
              fontWeight: 600,
            }}
          >
            {t("assignment.error", "Error Loading Assignment")}
          </Modal.Header>
          <Modal.Content style={{ background: "#ffffff", padding: "24px" }}>
            <p style={{ color: "#d32f2f" }}>
              {t("assignment.errorMessage", "Failed to load assignment data. Please try again.")}
            </p>
          </Modal.Content>
          <Modal.Actions
            style={{ background: "#f9fafb", borderTop: "1px solid #e0e0e0" }}
          >
            <Button onClick={onClose} style={{ background: "#f0f4f8", color: "#007c70", borderRadius: "8px" }}>
              {t("board.expendedCard.close", "Close")}
            </Button>
          </Modal.Actions>
        </Modal>
      );
    }

    if (!assignment && open) {
      console.warn("AssignmentModal rendered without valid assignment");
      return null;
    }

    return (
      <Modal
        open={open}
        onClose={onClose}
        size="large"
        style={{ borderRadius: "12px", overflow: "hidden" }}
      >
        <Modal.Header
          style={{
            background: "#f9fafb",
            borderBottom: "1px solid #e0e0e0",
            fontFamily: "Nunito",
            fontWeight: 600,
          }}
        >
          {t("board.expendedCard.previewAssignment", "Preview Assignment")}
        </Modal.Header>
        <Modal.Content
          scrolling
          style={{ background: "#ffffff", padding: "24px" }}
        >
          <div>
            <div style={h1}>
                {title}
            </div>
            <ReadOnlyTipTap>
              <div className="ProseMirror">
                {ReactHtmlParser(content || "")}
              </div>
            </ReadOnlyTipTap>
          {/* Homework Section */}
          <div style={{ marginTop: "24px", paddingTop: "24px" }}>
            <h3 style={{ marginBottom: "16px", color: "#274E5B" }}>
              {t("homework.myAssignment", "My Assignment")}
            </h3>

          {/* Show existing homeworks */}
          {homeworks.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              {homeworks.map((homework) => (
                <div
                  key={homework?.id}
                  style={{
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "8px",
                    background: "#F3F3F3",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "600", marginBottom: "4px", fontSize: "14px" }}>
                      {homework.title}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight:
                          homework.settings?.status === "Completed" ? "bold"
                            : homework.settings?.status === "Started" ? "normal"
                            : "normal",
                        color:
                          homework.settings?.status === "Completed" ? "#3D85B0"
                            : homework.settings?.status === "Started" ? "#7D70AD"
                            : homework.settings?.status === "Overdue" ? "red"
                            : "#666", // default color
                      }}
                    >
                      {homework.settings?.status || "Open homework to see more"}
                    </div>
                  </div>
                  <Button
                    size="small"
                    onClick={() => {
                      console.log("Navigate to homework:", homework.id);
                      if (!assignment?.code || !homework?.code) {
                        console.error("Missing assignment or homework code");
                        return;
                      }

                      const url = `/dashboard/assignments/${assignment.code}?homework=${homework.code}`;
                      window.open(url, "_blank", "noopener,noreferrer");
                    }}
                    style={{
                      borderRadius: "100px",
                      color: "#69BBC4",
                      fontSize: "12px",
                      border: "0.5px solid #69BBC4",
                      background: "white",
                    }}
                  >
                    {t("homework.openHomework", "Open")}
                  </Button>
                </div>               
              ))}
            </div>
          )}

          {/* New Homework Section */}
          {homeworks.length < 1 && !showNewHomework && (
            <Button
              onClick={() => setShowNewHomework(true)}
              style={{
                borderRadius: "100px",
                background: "#336F8A",
                fontSize: "14px",
                color: "white",
                border: "1px solid #336F8A",
                marginRight: "10px"
              }}
              disabled={createLoading}
            >
              {t("homework.createNewAssignment", "Create New Assignment")}
            </Button>
          )}

          {showNewHomework && (
            <div style={{
              border: "1px solid #A1A1A1",
              borderRadius: "8px",
              padding: "16px",
              background: "#FFF",
              boxShadow: "2px 2px 8px 0 rgba(0, 0, 0, 0.10)",
            }}>
              <div style={h1}>
                {t("homework.createNewAssignment", "Create New Assignment")}
              </div>

              <div style={{ marginBottom: "12px" }}>
                <p style={{ marginBottom: "0px" }}>
                  {t("homework.assignmentTitle", "Assignment title")}
                </p>
                <input
                  type="text"
                  value={inputs.title}
                  onChange={(e) => handleChange({
                    target: { name: "title", value: e.target.value }
                  })}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    marginTop: "4px",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <div style={{
                  minHeight: "100px",
                  marginTop: "4px",
                }}>
                  <TipTapEditor
                    content={homeworkContent.current || inputs.placeholder}
                    onUpdate={(newContent) => updateHomeworkContent(newContent)}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <Button
                  onClick={handleCreateHomeworkSubmit}
                  loading={createLoading}
                  disabled={createLoading}
                  style={{
                    borderRadius: "100px",
                    background: "#336F8A",
                    fontSize: "12px",
                    color: "white",
                    border: "1px solid #336F8A",
                    marginRight: "10px"
                  }}
                >
                  {t("homework.createHomeworkSubmit", "Create & Submit")}
                </Button>
                <Button
                  onClick={handleCreateHomeworkDraft}
                  loading={createLoading}
                  disabled={createLoading}
                  style={{
                    borderRadius: "100px",
                    background: "white",
                    fontSize: "12px",
                    color: "#336F8A",
                    border: "1px solid #336F8A",
                    marginRight: "10px"
                  }}
                >
                  {t("homework.createHomeworkDraft", "Create Draft")}
                </Button>
                <Button
                  onClick={() => {
                    setShowNewHomework(false);
                    clearForm();
                  }}
                  style={{
                    borderRadius: "100px",
                    background: "#f7f9fa",
                    fontSize: "12px",
                    color: "#B9261A",
                    border: "1px solid #B9261A",
                    marginRight: "10px"
                  }}
                >
                  {t("homework.cancel", "Cancel")}
                </Button>
              </div>
            </div>
          )}

          </div>
        </div>
        </Modal.Content>
        <Modal.Actions
          style={{ background: "#f9fafb", borderTop: "1px solid #e0e0e0" }}
        >
          <Button
            onClick={onClose}
            style={{
              borderRadius: "100px",
              background: "#f7f9fa",
              fontSize: "12px",
              color: "#336F8A",
              border: "1px solid #336F8A",
              marginRight: "10px"
            }}
          >
            {t("board.expendedCard.close", "Close")}
          </Button>
        </Modal.Actions>
      </Modal>
    );
  };

  return (
    <>
      <Navigation
        query={query}
        user={user}
        tab={tab}
        toggleSidebar={() => {}}
        proposalId={proposalId}
        cardId={cardId}
        saveBtnFunction={onUpdateCard}
        inputs={inputs}
        handleSettingsChange={handleSettingsChange}
        hasContentChanged={hasContentChanged}
      />
      <StyledProposal>
        <div className="post">
          {!areEditsAllowed && (
            <div className="lockedMessage">
              <div>
                {t(
                  "mainCard.lockedMessage",
                  "The card is currently being edited by"
                )}{" "}
                <span className="username">
                  {proposalCard?.isEditedBy?.username}
                </span>
                .{" "}
                {t(
                  "mainCard.askToClose",
                  "Ask the user to close the card or wait until the card is released."
                )}{" "}
                {t("mainCard.cardWillBeReleased", "The card will be released")}{" "}
                <span className="username">{moment().to(releaseTime)}</span>.{" "}
                {t(
                  "mainCard.refreshAfterRelease",
                  "After the card is released, refresh the page to get the latest version of the card."
                )}
              </div>
              <div className="buttonHolder">
                <button onClick={() => refreshPage()}>
                  {t("mainCard.refresh", "Refresh")}
                </button>
              </div>
            </div>
          )}

          <div className="proposalCardBoard">
            <div className="textBoard">
              <div className="cardHeader">{inputs?.title}</div>
              <div className="cardSubheader">
                {t("mainCard.instructions", "Instructions")}
              </div>
              <ReadOnlyTipTap>
                <div className="ProseMirror">
                  {ReactHtmlParser(inputs?.description)}
                </div>
              </ReadOnlyTipTap>
              {proposalCard?.settings?.includeInReport && (
                <>
                  <div className="cardSubheader">
                    {t("mainCard.forMindHiveNetwork", "For MindHive Network")}
                  </div>
                  <div className="cardSubheaderComment">
                    {t(
                      "mainCard.visibleInFeedbackCenter",
                      "The content you include here will be visible in the Feedback Center once it is submitted via a yellow Action Card."
                    )}
                  </div>
                  <div className="jodit">
                    {isLocked ? (
                      <Accordion styled fluid>
                        <Accordion.Title
                          active={originalActive}
                          onClick={() => setOriginalActive(!originalActive)}
                          style={{ fontSize: "16px", fontWeight: "bold" }}
                        >
                          <Icon name="dropdown" />
                          {t("mainCard.forMindHiveNetwork", "Original Content")}
                        </Accordion.Title>
                        <Accordion.Content active={originalActive}>
                          <ReadOnlyTipTap>
                            <div className="ProseMirror">
                              {ReactHtmlParser(content?.current || "")}
                            </div>
                          </ReadOnlyTipTap>
                        </Accordion.Content>
                      </Accordion>
                    ) : (
                      <div onFocus={handleFocus}>
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
                    )}
                  </div>
                </>
              )}

              {proposalCard?.settings?.includeInReport && isLocked && (
                <>
                  <div className="cardSubheader">
                    {t("mainCard.revisedContent", "Revised Content")}
                  </div>
                  <div className="cardSubheaderComment">
                    {t(
                      "mainCard.revisedContentUsed",
                      "The revised content you include here will be used in the final report."
                    )}
                  </div>
                  <div className="jodit">
                    <div onFocus={handleFocus}>
                      <TipTapEditor
                        content={revisedContent?.current}
                        onUpdate={(newContent) =>
                          handleContentChange({
                            contentType: "revisedContent",
                            newContent,
                          })
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="infoBoard">
              <div>
                <div className="cardSubheader">
                  {t("mainCard.assignedTo", "Assigned to")}
                </div>
                <Assigned
                  users={allUsers}
                  assignedTo={inputs?.assignedTo}
                  onAssignedToChange={handleAssignedToChange}
                />
              </div>

              {/* Display Linked Items using PreviewSection */}
              {inputs?.resources?.length > 0 && (
                <PreviewSection
                  title={t("board.expendedCard.previewLinkedResources")}
                  items={inputs?.resources}
                  type="resource"
                  proposal={proposal}
                  openAssignmentModal={openAssignmentModalHandler}
                  user={user}
                />
              )}
              {inputs?.assignments?.length > 0 && (
                <PreviewSection
                  title={t("board.expendedCard.previewLinkedAssignments")}
                  items={inputs?.assignments}
                  type="assignment"
                  proposal={proposal}
                  openAssignmentModal={openAssignmentModalHandler}
                  user={user}
                />
              )}
              {inputs?.tasks?.length > 0 && (
                <PreviewSection
                  title={t("board.expendedCard.previewLinkedTasks")}
                  items={inputs?.tasks}
                  type="task"
                  proposal={proposal}
                  openAssignmentModal={openAssignmentModalHandler}
                  user={user}
                />
              )}
              {inputs?.studies?.length > 0 && (
                <PreviewSection
                  title={t("board.expendedCard.previewLinkedStudies")}
                  items={inputs?.studies}
                  type="study"
                  proposal={proposal}
                  openAssignmentModal={openAssignmentModalHandler}
                  user={user}
                />
              )}

              <div className="proposalCardComments">
                <div className="cardSubheader">
                  {t("mainCard.comments", "Comments")}
                </div>
                <TipTapEditor
                  content={inputs.comment}
                  onUpdate={(newContent) => {
                    if (!hasContentChanged) {
                      setHasContentChanged(true);
                    }
                    handleChange({
                      target: {
                        name: "comment",
                        value: newContent,
                      },
                    });
                  }}
                  editable={areEditsAllowed}
                  placeholder={t("mainCard.commentsPlaceholder", "Add your comment here...")}
                />
              </div>
              {proposalCard?.settings?.includeInReport &&
                !isLocked &&
                user?.permissions.some((p) =>
                  ["SCIENTIST", "TEACHER", "MENTOR", "ADMIN"].includes(p?.name)
                ) && (
                <div>
                  <div className="cardSubheaderComment">
                    {t(
                      "mainCard.chooseReviewStep",
                      "Choose which step of the peer review a card should go in"
                    )}
                  </div>
                  <Dropdown
                    placeholder={t("mainCard.selectOption", "Select option")}
                    fluid
                    multiple
                    search
                    selection
                    lazyLoad
                    options={filteredReviewOptions}
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
                </div>
              )}
            </div>
          </div>
        </div>
      </StyledProposal>

      <AssignmentModal
        open={assignmentModalOpen}
        onClose={() => {
          setAssignmentModalOpen(false);
          setSelectedAssignment(null);
        }}
        assignment={selectedAssignment}
        user={user}
      />
    </>
  );
}
