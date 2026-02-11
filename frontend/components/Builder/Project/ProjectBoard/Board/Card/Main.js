import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";

import ReactHtmlParser from "react-html-parser";
import moment from "moment";
import useTranslation from "next-translate/useTranslation";

import { UPDATE_CARD_CONTENT } from "../../../../../Mutations/Proposal";
import { UPDATE_CARD_EDIT } from "../../../../../Mutations/Proposal";
import { GET_CARD_CONTENT } from "../../../../../Queries/Proposal";

import {
  CREATE_HOMEWORK,
  UPDATE_HOMEWORK,
} from "../../../../../Mutations/Homework"; // Adjust path as needed
import {
  GET_MY_HOMEWORKS_FOR_ASSIGNMENT,
  GET_ALL_HOMEWORKS_FOR_ASSIGNMENT,
} from "../../../../../Queries/Homework"; // Adjust path as needed
import { GET_AN_ASSIGNMENT } from "../../../../../Queries/Assignment"; // Adjust path as needed
import { GET_RESOURCE } from "../../../../../Queries/Resource";

import useForm from "../../../../../../lib/useForm";

import Navigation from "./Navigation/Main";
import Assigned from "./Forms/Assigned";
import Status from "../../../../../Dashboard/TeacherClasses/ClassPage/Assignments/Homework/Status";
import TipTapEditor from "../../../../../TipTap/Main";
import { PreviewSection } from "../../../../../Proposal/Card/Forms/LinkedItems";
import { Modal, Button, Icon, Dropdown, Accordion } from "semantic-ui-react";

import { StyledProposal } from "../../../../../styles/StyledProposal";
import { ReadOnlyTipTap } from "../../../../../TipTap/ReadOnlyTipTap";
import { mergeCardSettings } from "../../../../../Utils/mergeCardSettings";

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
  const [resourceModalState, setResourceModalState] = useState({
    open: false,
    resourceId: null,
  });

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
    (option) => submitStatuses[option?.value] !== "SUBMITTED",
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
    proposalCard?.revisedContent || proposalCard?.content,
  );

  const [updateCard, { loading: updateLoading }] = useMutation(
    UPDATE_CARD_CONTENT,
    {
      refetchQueries: [{ query: GET_CARD_CONTENT, variables: { id: cardId } }],
    },
  );

  const [updateEdit, { loading: updateEditLoading }] = useMutation(
    UPDATE_CARD_EDIT,
    {
      ignoreResults: true,
    },
  );

  // Get collaborators
  const collaborators =
    proposal?.collaborators?.map((user) => ({
      key: user.id,
      text: user.username,
      value: user.id,
    })) || [];

  const openResourceModalHandler = (resource) => {
    if (!resource?.id) {
      return;
    }
    setResourceModalState({
      open: true,
      resourceId: resource.id,
    });
  };

  const closeResourceModalHandler = () =>
    setResourceModalState({
      open: false,
      resourceId: null,
    });

  const { data: resourceModalData, loading: resourceModalLoading } = useQuery(
    GET_RESOURCE,
    {
      variables: { id: resourceModalState.resourceId },
      skip: !resourceModalState.open || !resourceModalState.resourceId,
      fetchPolicy: "network-only",
    },
  );

  const activeResource = resourceModalData?.resource;

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
      // Merge settings to ensure we don't lose existing properties like includeInReport and includeInReviewSteps
      // Always merge with the current card's settings from props to avoid overwriting with stale local state
      const mergedSettings = mergeCardSettings(
        proposalCard?.settings,
        inputs?.settings,
      );

      await updateCard({
        variables: {
          ...inputs,
          internalContent: internalContent?.current,
          content: content?.current,
          revisedContent: revisedContent?.current,
          settings: mergedSettings,
          assignedTo: inputs?.assignedTo?.map((a) => ({ id: a?.id })),
          resources: inputs?.resources?.map((resource) => ({
            id: resource?.id,
          })),
          // Add these three lines to fix the error:
          assignments: inputs?.assignments?.map((assignment) => ({
            id: assignment?.id,
          })),
          tasks: inputs?.tasks?.map((task) => ({ id: task?.id })),
          studies: inputs?.studies?.map((study) => ({ id: study?.id })),
        },
      });
    } else {
      if (hasContentChanged) {
        if (
          !confirm(
            "Your unsaved changes will be lost. Click Cancel to return and save the changes.",
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
    // console.log("Opening modal with assignment:", {
    //   id: assignment.id,
    //   title: assignment.title,
    //   content: assignment.content,
    //   placeholder: assignment.placeholder,
    // });
    setSelectedAssignment(assignment);
    setAssignmentModalOpen(true);
  };

  // Assignment Modal Component
  const AssignmentModal = ({ open, onClose, assignment: assignmentProp }) => {
    const { t } = useTranslation("classes");

    // Strip HTML tags from text
    const stripHtml = (html) => {
      if (!html) return "";
      return html.replace(/<[^>]*>/g, "").trim();
    };

    const [title, setTitle] = useState(stripHtml(assignmentProp?.title || ""));
    const [content, setContent] = useState(assignmentProp?.content || "");
    const [showNewHomework, setShowNewHomework] = useState(false);
    const [activeHomework, setActiveHomework] = useState(null);

    const isMentorOrTeacher =
      user?.permissions?.map((p) => p?.name)?.includes("TEACHER") ||
      user?.permissions?.map((p) => p?.name)?.includes("MENTOR");

    // Query for fresh assignment data with all fields including placeholder
    const {
      data: assignmentData,
      loading: assignmentLoading,
      error: assignmentError,
    } = useQuery(GET_AN_ASSIGNMENT, {
      variables: { id: assignmentProp?.id },
      fetchPolicy: "network-only", // Force fresh fetch
      skip: !assignmentProp?.id || !open, // Only fetch when modal is open and we have an ID
    });

    const assignment = assignmentData?.assignments?.[0] || null;
    // console.log(assignmentData);

    // Query for existing homeworks: all for Mentor/Teacher, only own for others
    const { data: myHomeworkData } = useQuery(GET_MY_HOMEWORKS_FOR_ASSIGNMENT, {
      variables: { userId: user?.id, assignmentCode: assignment?.code },
      skip: isMentorOrTeacher || !assignment?.code || !user?.id,
    });
    const { data: allHomeworkData } = useQuery(
      GET_ALL_HOMEWORKS_FOR_ASSIGNMENT,
      {
        variables: { assignmentCode: assignment?.code },
        skip: !isMentorOrTeacher || !assignment?.code,
      },
    );

    const homeworks = isMentorOrTeacher
      ? allHomeworkData?.homeworks || []
      : myHomeworkData?.homeworks || [];

    // New homework form state
    const { inputs, handleChange, handleMultipleUpdate, clearForm } = useForm({
      settings: { status: "Started" },
      title: `Assignment${stripHtml(
        assignment?.title || "",
      )} | ${moment().format("YYYY-MM-DD")} | ${user?.username || ""}`,
      placeholder: assignment?.placeholder || "",
    });

    const homeworkContent = useRef("");
    const editorGetContentRef = useRef(null);

    useEffect(() => {
      // Only init ref from placeholder when not editing existing homework (create flow only)
      if (!homeworkContent.current && inputs.placeholder && !activeHomework) {
        homeworkContent.current = inputs.placeholder;
      }
    }, [inputs.placeholder, activeHomework]);

    // Mutation for creating homework
    const [createHomework, { loading: createLoading }] = useMutation(
      CREATE_HOMEWORK,
      {
        refetchQueries: [
          {
            query: GET_MY_HOMEWORKS_FOR_ASSIGNMENT,
            variables: { userId: user?.id, assignmentCode: assignment?.code },
          },
          {
            query: GET_ALL_HOMEWORKS_FOR_ASSIGNMENT,
            variables: { assignmentCode: assignment?.code },
          },
        ],
      },
    );

    // Mutation for updating homework
    const [updateHomework, { loading: updateLoading }] = useMutation(
      UPDATE_HOMEWORK,
      {
        refetchQueries: [
          {
            query: GET_MY_HOMEWORKS_FOR_ASSIGNMENT,
            variables: { userId: user?.id, assignmentCode: assignment?.code },
          },
          {
            query: GET_ALL_HOMEWORKS_FOR_ASSIGNMENT,
            variables: { assignmentCode: assignment?.code },
          },
        ],
      },
    );

    const loadHomeworkIntoForm = (homework) => {
      if (!homework) return;

      // Populate form fields in one update so title/placeholder/settings all apply (avoid batching overwriting)
      handleMultipleUpdate({
        title: homework.title || "",
        placeholder:
          homework.placeholder ||
          assignment?.placeholder ||
          "",
        settings: homework.settings || { status: "Started" },
      });

      // Initialize editor content with the homework content or fallback
      homeworkContent.current =
        homework.content ||
        homework.placeholder ||
        assignment?.placeholder ||
        "";
    };

    useEffect(() => {
      if (assignment) {
        setTitle(stripHtml(assignment.title || ""));
        setContent(assignment.content || "");

        // Only set homework form and editor placeholder when no existing homework is open (create flow)
        if (!activeHomework) {
          handleChange({
            target: {
              name: "title",
              value: `Assignment: ${stripHtml(
                assignment?.title || "",
              )} | ${moment().format("YYYY-MM-DD")} | ${user?.username || ""}`,
            },
          });
          handleChange({
            target: {
              name: "placeholder",
              value: assignment?.placeholder || "",
            },
          });
          if (assignment?.placeholder) {
            homeworkContent.current = assignment.placeholder;
          }
        }
      } else if (!assignmentLoading && open) {
        console.warn("AssignmentModal opened but no assignment data available");
        setTitle("");
        setContent("");
      }
    }, [assignment, assignmentLoading, open, activeHomework]);

    // Reset create/edit state when modal closes so reopen starts from list view
    useEffect(() => {
      if (!open) {
        setShowNewHomework(false);
        setActiveHomework(null);
        homeworkContent.current = "";
      }
    }, [open]);

    // Reset create/edit state when switching to a different assignment
    useEffect(() => {
      setActiveHomework(null);
      setShowNewHomework(false);
    }, [assignmentProp?.id]);

    const h1 = {
      fontSize: "18px",
      fontWeight: "600",
      marginBottom: "16px",
    };
    const instructionBox = {
      lineHeight: "1.5",
      // background: "#F3F3F3",
      borderLeft: "4px solid #274E5B",
      borderRadius: "4px",
      padding: "16px",
      fontSize: "16px",
      fontWeight: "400",
      marginBottom: "16px",
    };
    const styleField = {
      fontSize: "14px",
      lineHeight: "1.5",
      color: "#274E5B",
      border: "1px solid #e0e0e0",
      borderRadius: "8px",
      padding: "12px",
      marginBottom: "3rem",
    };

    const updateHomeworkContent = async (newContent) => {
      homeworkContent.current = newContent;
    };

    const editorBlurSaveTimeoutRef = useRef(null);
    const handleEditorBlur = () => {
      if (!activeHomework?.id) return;
      if (editorBlurSaveTimeoutRef.current) {
        clearTimeout(editorBlurSaveTimeoutRef.current);
      }
      editorBlurSaveTimeoutRef.current = setTimeout(() => {
        editorBlurSaveTimeoutRef.current = null;
        updateHomework({
          variables: {
            id: activeHomework.id,
            input: {
              title: inputs.title,
              content: homeworkContent?.current ?? inputs.placeholder ?? "",
              placeholder: inputs.placeholder ?? "",
              settings: inputs?.settings ?? {},
              updatedAt: new Date(),
            },
          },
        }).catch((err) => {
          console.error("Auto-save on blur failed:", err);
        });
      }, 300);
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

    const handleUpdateHomeworkDraft = async () => {
      if (!activeHomework?.id) return;
      // Cancel any pending auto-save on blur to avoid racing writes
      if (editorBlurSaveTimeoutRef.current) {
        clearTimeout(editorBlurSaveTimeoutRef.current);
        editorBlurSaveTimeoutRef.current = null;
      }
      const latestContent = editorGetContentRef.current?.();
      const contentToSave =
        latestContent !== undefined && latestContent !== null
          ? latestContent
          : homeworkContent?.current || inputs.placeholder;
      try {
        await updateHomework({
          variables: {
            id: activeHomework.id,
            input: {
              title: inputs.title,
              content: contentToSave,
              placeholder: inputs.placeholder,
              settings: inputs?.settings,
              updatedAt: new Date(),
            },
          },
        });
        clearForm();
        setActiveHomework(null);
        // Reset homework content to assignment placeholder for future creates
        homeworkContent.current = assignment?.placeholder || "";
      } catch (error) {
        console.error("Error updating homework draft:", error);
        alert("Error updating homework draft: " + error.message);
      }
    };

    const handleUpdateHomeworkSubmit = async () => {
      if (!activeHomework?.id) return;
      // Cancel any pending auto-save on blur so status change doesn't get overwritten
      if (editorBlurSaveTimeoutRef.current) {
        clearTimeout(editorBlurSaveTimeoutRef.current);
        editorBlurSaveTimeoutRef.current = null;
      }
      const latestContent = editorGetContentRef.current?.();
      const contentToSave =
        latestContent !== undefined && latestContent !== null
          ? latestContent
          : homeworkContent?.current || inputs.placeholder;
      try {
        await updateHomework({
          variables: {
            id: activeHomework.id,
            input: {
              title: inputs.title,
              content: contentToSave,
              placeholder: inputs.placeholder,
              settings: {
                ...(inputs?.settings || {}),
                status: "Completed",
              },
              updatedAt: new Date(),
            },
          },
        });
        clearForm();
        setActiveHomework(null);
        // Reset homework content to assignment placeholder for future creates
        homeworkContent.current = assignment?.placeholder || "";
      } catch (error) {
        console.error("Error submitting updated homework:", error);
        alert("Error submitting updated homework: " + error.message);
      }
    };

    const handleStatusUpdate = async (newStatus) => {
      if (!activeHomework?.id) return;
      // Cancel any pending auto-save on blur so status change is the last write
      if (editorBlurSaveTimeoutRef.current) {
        clearTimeout(editorBlurSaveTimeoutRef.current);
        editorBlurSaveTimeoutRef.current = null;
      }
      try {
        await updateHomework({
          variables: {
            id: activeHomework.id,
            input: {
              title: inputs.title,
              content: homeworkContent?.current || inputs.placeholder,
              placeholder: inputs.placeholder,
              settings: {
                ...(inputs?.settings || {}),
                status: newStatus,
              },
              updatedAt: new Date(),
            },
          },
        });
        handleChange({
          target: {
            name: "settings",
            value: { ...(inputs?.settings || {}), status: newStatus },
          },
        });
        setActiveHomework((prev) =>
          prev
            ? { ...prev, settings: { ...(prev.settings || {}), status: newStatus } }
            : null,
        );
      } catch (error) {
        console.error("Error updating homework status:", error);
        alert("Error updating homework status: " + error.message);
      }
    };

    const handleCreateHomeworkSubmit = async () => {
      try {
        await createHomework({
          variables: {
            ...inputs,
            content: homeworkContent?.current || inputs.placeholder,
            assignmentId: assignment?.id,
            settings: { status: "Completed" },
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
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              letterSpacing: "0.15px",
            }}
          >
            {t("assignment.loading")}
          </Modal.Header>
          <Modal.Content
            style={{
              background: "#ffffff",
              padding: "24px",
              textAlign: "center",
            }}
          >
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
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              letterSpacing: "0.15px",
            }}
          >
            {t("assignment.error", "Error Loading Assignment")}
          </Modal.Header>
          <Modal.Content style={{ background: "#ffffff", padding: "24px" }}>
            <p style={{ color: "#d32f2f" }}>
              {t(
                "assignment.errorMessage",
                "Failed to load assignment data. Please try again.",
              )}
            </p>
          </Modal.Content>
          <Modal.Actions
            style={{ background: "#f9fafb", borderTop: "1px solid #e0e0e0" }}
          >
            <Button
              onClick={onClose}
              style={{
                background: "#f0f4f8",
                color: "#007c70",
                borderRadius: "8px",
              }}
            >
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
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            letterSpacing: "0.15px",
          }}
        >
          {t("board.expendedCard.assignment", "Assignment")}
        </Modal.Header>
        <Modal.Content
          scrolling
          style={{ background: "#ffffff", padding: "24px" }}
        >
          <div>
            <div style={h1}>{title}</div>
            <ReadOnlyTipTap>
              <div className="ProseMirror">
                {ReactHtmlParser(content || "")}
              </div>
            </ReadOnlyTipTap>
            {/* Homework Section */}
            <div style={{ marginTop: "24px", paddingTop: "24px" }}>
              {homeworks.length > 0 && (
                <h3 style={{ marginBottom: "16px", color: "#274E5B" }}>
                  {isMentorOrTeacher
                    ? t("homework.allEntries", "All entries")
                    : t("homework.myEntry", "My entry")}
                </h3>
              )}
              {/* Show existing homeworks */}
              {homeworks.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  {homeworks.map((homework) => (
                    <div key={homework?.id}>
                    <div
                      style={{
                        borderRadius: "8px",
                        padding: "12px",
                        marginBottom: "8px",
                        border: homework.settings?.status === "Completed"
                            ? "1px solid #3D85B0"
                            : homework.settings?.status === "Started"
                            ? "1px solid #5D5763"
                            : homework.settings?.status === "Needs feedback"
                            ? "1px solid #3F288F"
                            : homework.settings?.status === "Feedback given"
                            ? "1px solid #0D3944"
                            : "1px solid #5D5763", // default color
                        background: homework.settings?.status === "Completed"
                            ? "#DEF8FB"
                            : homework.settings?.status === "Started"
                            ? "#FDF2D0"
                            : homework.settings?.status === "Needs feedback"
                            ? "#E4DFF6"
                            : homework.settings?.status === "Feedback given"
                            ? "#F6F9F8"
                            : "#DEF8FB", // default color
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: "600",
                            marginBottom: "4px",
                            fontSize: "14px",
                          }}
                        >
                          {homework.title}
                          {isMentorOrTeacher && homework.author && (
                            <span
                              style={{
                                fontWeight: "normal",
                                color: "#666",
                                marginLeft: "6px",
                              }}
                            >
                              — {homework.author.username ||
                                homework.author.publicReadableId ||
                                t("homework.unknownAuthor", "Unknown")}
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "normal",
                            marginTop: "4px",
                            display: "inline-block",
                            padding: "4px 8px",
                            borderRadius: "8px",
                            border: "1px solid",
                            borderColor: homework.settings?.status === "Completed"
                                ? "#337C84"
                                : homework.settings?.status === "Started"
                                ? "#5D5763"
                                : homework.settings?.status === "Needs feedback"
                                ? "#3F288F"
                                : homework.settings?.status === "Feedback given"
                                ? "#0D3944"
                                : "#666",
                            background: "#FFFFFF",
                            color:
                              homework.settings?.status === "Completed"
                                ? "#337C84"
                                : homework.settings?.status === "Started"
                                ? "#5D5763"
                                : homework.settings?.status === "Needs feedback"
                                ? "#3F288F"
                                : homework.settings?.status === "Feedback given"
                                ? "#0D3944"
                                : "#666", // default color
                          }}
                        >
                          {homework.settings?.status ||
                            "Open assignment to see more"}
                        </div>
                      </div>
                      <Button
                        size="small"
                        onClick={() => {
                          const isActive = activeHomework?.id === homework?.id;
                          if (isActive) {
                            // Save current edits for this homework
                            handleUpdateHomeworkDraft();
                          } else {
                            // Open this homework in the edit panel
                            // console.log("Open homework in modal:", homework.id);
                            setActiveHomework(homework);
                            setShowNewHomework(false);
                            loadHomeworkIntoForm(homework);
                          }
                        }}
                        style={{
                          borderRadius: "100px",
                          fontSize: "12px",
                          ...(activeHomework?.id === homework?.id
                            ? {
                                background: "#ffffff",
                                color: "#171717",
                                border: "2px solid #171717",
                              }
                            : {
                                color:
                                  homework.settings?.status === "Completed"
                                    ? "#3D85B0"
                                    : homework.settings?.status === "Started"
                                    ? "#5D5763"
                                    : homework.settings?.status ===
                                      "Needs feedback"
                                    ? "#3F288F"
                                    : homework.settings?.status ===
                                      "Feedback given"
                                    ? "#0D3944"
                                    : "#69BBC4", // default color
                                border:
                                  homework.settings?.status === "Completed"
                                    ? "1px solid #3D85B0"
                                    : homework.settings?.status === "Started"
                                    ? "1px solid #5D5763"
                                    : homework.settings?.status ===
                                      "Needs feedback"
                                    ? "1px solid #3F288F"
                                    : homework.settings?.status ===
                                      "Feedback given"
                                    ? "1px solid #0D3944"
                                    : "1px solid #69BBC4", // default color
                                background: "white",
                              }),
                        }}
                      >
                        {activeHomework?.id === homework?.id
                          ? t("homework.saveAndClose", "Save & close")
                          : t("homework.openHomework", "Open")}
                      </Button>
                    </div>
                    {activeHomework?.id === homework?.id && (
                      <div
                        style={{
                          border: "1px solid #A1A1A1",
                          borderRadius: "8px",
                          padding: "16px",
                          background: "#FFF",
                          boxShadow: "2px 2px 8px 0 rgba(0, 0, 0, 0.10)",
                          marginTop: "8px",
                          marginBottom: "16px",
                        }}
                      >
                        <div style={h1}>
                          {t(
                            "homework.editEntry",
                            "Edit your entry",
                          )}
                        </div>

                        <div style={{ marginBottom: "12px" }}>
                          <p style={{ marginBottom: "0px" }}>
                            {t("homework.assignmentTitle", "Assignment title")}
                          </p>
                          <input
                            type="text"
                            value={inputs.title}
                            onChange={(e) =>
                              handleChange({
                                target: { name: "title", value: e.target.value },
                              })
                            }
                            style={{
                              width: "50%",
                              minWidth: "20px",
                              padding: "8px",
                              borderRadius: "4px",
                              border: "1px solid #ccc",
                              marginTop: "4px",
                            }}
                          />
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                          <div
                            style={{
                              minHeight: "100px",
                              marginTop: "4px",
                            }}
                          >
                            <p style={{ marginBottom: "0px" }}>
                              {t("homework.yourEntry", "Your entry")}
                            </p>
                            <TipTapEditor
                              content={
                                homeworkContent.current ||
                                activeHomework.content ||
                                activeHomework.placeholder ||
                                inputs.placeholder
                              }
                              onUpdate={(newContent) =>
                                updateHomeworkContent(newContent)
                              }
                              onBlur={handleEditorBlur}
                              getContentRef={editorGetContentRef}
                            />
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "8px" }}>
                          <Button
                            onClick={handleUpdateHomeworkSubmit}
                            loading={updateLoading}
                            disabled={updateLoading}
                            style={{
                              borderRadius: "100px",
                              background: "#def8fb",
                              fontSize: "12px",
                              color: "#3d85b0",
                              border: "1px solid #3d85b0",
                              marginRight: "10px",
                            }}
                          >
                            {t("homework.createHomeworkSubmit", "Mark as complete")}
                          </Button>
                          {/* <Button
                            onClick={() => {
                              setActiveHomework(null);
                              clearForm();
                              homeworkContent.current =
                                assignment?.placeholder || "";
                            }}
                            style={{
                              borderRadius: "100px",
                              background: "#f7f9fa",
                              fontSize: "12px",
                              color: "#B9261A",
                              border: "1px solid #B9261A",
                              marginRight: "10px",
                            }}
                          >
                            {t("homework.cancel", "Cancel")}
                          </Button> */}
                          <Button
                            onClick={() => {
                              const currentStatus =
                                inputs?.settings?.status ||
                                activeHomework?.settings?.status;
                              handleStatusUpdate(
                                currentStatus === "Needs feedback"
                                  ? "Started"
                                  : "Needs feedback",
                              );
                            }}
                            loading={updateLoading}
                            disabled={updateLoading}
                            style={{
                              borderRadius: "100px",
                              background:
                                (inputs?.settings?.status ||
                                  activeHomework?.settings?.status) ===
                                "Needs feedback"
                                  ? "#D8D3E7"
                                  : "#ffffff",
                              fontSize: "12px",
                              color: "#434343",
                              border: `1.5px solid ${
                                (inputs?.settings?.status ||
                                  activeHomework?.settings?.status) ===
                                "Needs feedback"
                                  ? "#7D70AD"
                                  : "#625B71"
                              }`,
                              marginRight: "10px",
                            }}
                          >
                            {(inputs?.settings?.status ||
                              activeHomework?.settings?.status) ===
                            "Needs feedback"
                              ? t(
                                  "teacherClass.feedbackRequested",
                                  "Feedback requested",
                                )
                              : t(
                                  "teacherClass.requestFeedback",
                                  "Request feedback",
                                )}
                          </Button>
                          {isMentorOrTeacher &&
                            (inputs?.settings?.status ||
                              activeHomework?.settings?.status) ===
                              "Needs feedback" && (
                              <Button
                                onClick={() => handleStatusUpdate("Feedback given")}
                                loading={updateLoading}
                                disabled={updateLoading}
                                style={{
                                  borderRadius: "100px",
                                  background: "white",
                                  fontSize: "12px",
                                  color: "#0D3944",
                                  border: "1.5px solid #0D3944",
                                  marginRight: "10px",
                                }}
                              >
                                {t(
                                  "teacherClass.feedbackGiven",
                                  "Feedback given",
                                )}
                              </Button>
                            )}
                        </div>
                      </div>
                    )}
                    </div>
                  ))}
                </div>
              )}

              {/* New Homework Section */}
              {homeworks.length < 1 && !showNewHomework && (
                <Button
                  onClick={() => {
                    setActiveHomework(null);
                    setShowNewHomework(true);
                    // Prefill form for a fresh create (no clearForm to avoid race with title)
                    const newTitle = `Assignment${stripHtml(
                      assignment?.title || "",
                    )} | ${moment().format("YYYY-MM-DD")} | ${
                      user?.username || ""
                    }`;
                    handleChange({
                      target: { name: "title", value: newTitle },
                    });
                    handleChange({
                      target: {
                        name: "placeholder",
                        value: assignment?.placeholder || "",
                      },
                    });
                    handleChange({
                      target: {
                        name: "settings",
                        value: { status: "Started" },
                      },
                    });
                    homeworkContent.current = assignment?.placeholder || "";
                  }}
                  style={{
                    borderRadius: "100px",
                    background: "#FDF2D0",
                    fontSize: "14px",
                    color: "#5D5763",
                    border: "2px solid #5D5763",
                    marginRight: "10px",
                  }}
                  disabled={createLoading}
                >
                  {t("homework.createNewEntry", "Create New Assignment")}
                </Button>
              )}

              {showNewHomework && (
                <div
                  style={{
                    border: "1px solid #A1A1A1",
                    borderRadius: "8px",
                    padding: "16px",
                    background: "#FFF",
                    boxShadow: "2px 2px 8px 0 rgba(0, 0, 0, 0.10)",
                  }}
                >
                  <div style={h1}>
                    {t("homework.createNewEntry", "Create New Assignment")}
                  </div>

                  <div style={{ marginBottom: "12px" }}>
                    <p style={{ marginBottom: "0px" }}>
                      {t("homework.assignmentTitle", "Assignment title")}
                    </p>
                    <input
                      type="text"
                      value={inputs.title}
                      onChange={(e) =>
                        handleChange({
                          target: { name: "title", value: e.target.value },
                        })
                      }
                      style={{
                        width: "50%",
                        minWidth: "20px",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        marginTop: "4px",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <div
                      style={{
                        minHeight: "100px",
                        marginTop: "4px",
                      }}
                    >
                      <p style={{ marginBottom: "0px" }}>
                        {t("homework.yourEntry", "Your entry")}
                      </p>
                      <TipTapEditor
                        content={homeworkContent.current || inputs.placeholder}
                        onUpdate={(newContent) =>
                          updateHomeworkContent(newContent)
                        }
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
                        background: "#def8fb",
                        fontSize: "12px",
                        color: "#3d85b0",
                        border: "1px solid #3d85b0",
                        marginRight: "10px",
                      }}
                    >
                      {t("homework.createHomeworkSubmit", "Mark as complete")}
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
                        marginRight: "10px",
                      }}
                    >
                      {t("homework.saveHomeworkDraft", "Save Draft")}
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
                        marginRight: "10px",
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
              marginRight: "10px",
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
                  "The card is currently being edited by",
                )}{" "}
                <span className="username">
                  {proposalCard?.isEditedBy?.username}
                </span>
                .{" "}
                {t(
                  "mainCard.askToClose",
                  "Ask the user to close the card or wait until the card is released.",
                )}{" "}
                {t("mainCard.cardWillBeReleased", "The card will be released")}{" "}
                <span className="username">{moment().to(releaseTime)}</span>.{" "}
                {t(
                  "mainCard.refreshAfterRelease",
                  "After the card is released, refresh the page to get the latest version of the card.",
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
                      "The content you include here will be visible in the Feedback Center once it is submitted via a yellow Action Card.",
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
                      "The revised content you include here will be used in the final report.",
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
                  users={collaborators}
                  assignedTo={inputs?.assignedTo}
                  onAssignedToChange={handleAssignedToChange}
                  user={user}
                  proposal={proposal}
                  cardId={cardId}
                  cardData={inputs}
                />
              </div>

              {/* Display Linked Items using PreviewSection */}
              <div style={{ marginTop: "24px", marginBottom: "24px", display: "flex", flexDirection: "column", gap: "16px" }}> 
                {inputs?.resources?.length > 0 && (
                  <PreviewSection
                    title={t("board.expendedCard.previewLinkedResources")}
                    items={inputs?.resources}
                    type="resource"
                    proposal={proposal}
                    openAssignmentModal={openAssignmentModalHandler}
                    openResourceModal={openResourceModalHandler}
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
              </div>
              <Modal
                open={resourceModalState.open}
                onClose={closeResourceModalHandler}
                size="large"
                style={{ borderRadius: "12px", overflow: "hidden" }}
              >
                <Modal.Header
                  style={{
                    background: "#f9fafb",
                    borderBottom: "1px solid #e0e0e0",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 600,
                    letterSpacing: "0.15px",
                  }}
                >
                  {activeResource?.title ||
                    t("boardManagement.viewResource", "View Resource")}
                </Modal.Header>
                <Modal.Content
                  scrolling
                  style={{ background: "#ffffff", padding: "24px" }}
                >
                  {resourceModalLoading ? (
                    <p>{t("common.loading", "Loading...")}</p>
                  ) : activeResource ? (
                    <ReadOnlyTipTap>
                      <div className="ProseMirror">
                        {ReactHtmlParser(activeResource?.content?.main || "")}
                      </div>
                    </ReadOnlyTipTap>
                  ) : (
                    <p>
                      {t(
                        "boardManagement.resourceUnavailable",
                        "Resource unavailable.",
                      )}
                    </p>
                  )}
                </Modal.Content>
                <Modal.Actions
                  style={{
                    background: "#f9fafb",
                    borderTop: "1px solid #e0e0e0",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "12px",
                    padding: "16px 24px",
                  }}
                >
                  <Button
                    onClick={closeResourceModalHandler}
                    style={{
                      borderRadius: "100px",
                      background: "#336F8A",
                      fontSize: "16px",
                      color: "white",
                      border: "1px solid #336F8A",
                    }}
                  >
                    {t("board.expendedCard.close", "Close")}
                  </Button>
                </Modal.Actions>
              </Modal>

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
                  editable={true}
                  placeholder={t(
                    "mainCard.commentsPlaceholder",
                    "Add your comment here...",
                  )}
                />
              </div>
              {proposalCard?.settings?.includeInReport &&
                !isLocked &&
                user?.permissions.some((p) =>
                  ["SCIENTIST", "TEACHER", "MENTOR", "ADMIN"].includes(p?.name),
                ) && (
                  <div>
                    <div className="cardSubheaderComment">
                      {t(
                        "mainCard.chooseReviewStep",
                        "Choose which step of the peer review a card should go in",
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
