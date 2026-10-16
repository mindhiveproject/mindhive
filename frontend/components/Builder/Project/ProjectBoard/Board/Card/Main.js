import { useState, useEffect, useRef, useMemo } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";

import ReactHtmlParser from "react-html-parser";
import moment from "moment";
import useTranslation from "next-translate/useTranslation";

import { UPDATE_CARD_EDIT } from "../../../../../Mutations/Proposal";
import { GET_CARD_CONTENT } from "../../../../../Queries/Proposal";

import {
  CREATE_HOMEWORK,
  UPDATE_HOMEWORK,
} from "../../../../../Mutations/Homework"; // Adjust path as needed
import {
  GET_BOARD_STUDENT_MEMBERS,
  GET_HOMEWORK_FOR_CARD_ASSIGNMENTS_BY_AUTHORS,
  GET_HOMEWORKS_FOR_ASSIGNMENT_BY_AUTHORS,
} from "../../../../../Queries/Homework";
import { GET_AN_ASSIGNMENT } from "../../../../../Queries/Assignment"; // Adjust path as needed
import { GET_RESOURCE } from "../../../../../Queries/Resource";

import useForm from "../../../../../../lib/useForm";
import { statusByAssignmentForAuthors } from "../../../../../../lib/assignmentCompletion";
import {
  getBoardAssignableToStudents,
  getBoardStudentsCanAssignToCards,
} from "../../../../../../lib/proposalBoardSettings";
import { useBoardMilestones } from "../../../../../../lib/useBoardMilestones";
import {
  actionCardMatchesReviewStep,
  cardIncludedInReviewStep,
  isActionCard,
  isStudyStatusMilestone,
} from "../../../../../../lib/milestones";
import { isMilestoneSubmitted } from "../../../../../../lib/milestoneStatus";
import { listPreviousEntries } from "../../../../../../lib/cardPreviousEntries";
import {
  allowsStudentTaskSelection,
  getTemplateLinkedTasks,
} from "../../../../../../lib/studentTaskSelection";

import Navigation from "./Navigation/Main";
import SaveIndicator from "../SaveIndicator";
import { useCardCollabSession } from "../../../../../../lib/useCardCollabSession";
import { useCardHtmlAutosave } from "../../../../../../lib/useCardHtmlAutosave";
import { useUnsavedChangesGuard } from "../../../../../../lib/useUnsavedChangesGuard";
import Assigned from "./Forms/Assigned";
import StudentTaskPicker from "./StudentTaskPicker";
import TipTapEditor from "../../../../../TipTap/Main";
import { PreviewSection } from "../../../../../Proposal/Card/Forms/PreviewSection";
import { Modal, Icon } from "semantic-ui-react";
import Button from "../../../../../DesignSystem/Button";
import Chip from "../../../../../DesignSystem/Chip";
import {
  MilestoneCompletedIcon,
  MilestoneIcon,
} from "../../../../../DesignSystem/Icons";

import { StyledProposal } from "../../../../../styles/StyledProposal";
import { ReadOnlyTipTap } from "../../../../../TipTap/ReadOnlyTipTap";
import { mergeCardSettings } from "../../../../../Utils/mergeCardSettings";
import Tooltip from "../../../../../DesignSystem/Tooltip";

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
  // Teacher preview from the template editor: render read-only with no
  // collab session, card lock, or homework writes. Assignment clicks go to
  // onOpenAssignment instead of the homework modal.
  isPreview = false,
  onOpenAssignment,
}) {
  const { t } = useTranslation("builder");
  const [openEntryKeys, setOpenEntryKeys] = useState([]); // Expanded previous entries, all collapsed by default
  const toggleEntry = (key) =>
    setOpenEntryKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
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

  // Card editing is no longer gated by a single-editor lock — real-time
  // collaborative editing (Yjs/Hocuspocus) lets multiple users edit the same
  // card concurrently, so edits are always allowed.
  const [lockedByUser, setLockedByUser] = useState(false);
  const [wasLockedOnFocus, setWasLockedOnFocus] = useState(false);
  const areEditsAllowed = true;

  // useEffect
  useEffect(() => {
    setLockedByUser(proposalCard?.isEditedBy?.username === user?.username);
  }, [proposalCard, user]);

  const { inputs, handleChange } = useForm({
    ...proposalCard,
  });

  // Collaborative editing: the ProposalCard-backed editors (content,
  // revisedContent, comment) share one Yjs doc per card — and one connection —
  // each binding its own named fragment. Homework editors below write to
  // per-student Homework records, so they are intentionally NOT collaborative.
  const collabDocumentName = proposalCard?.id
    ? `proposalCard:${proposalCard?.id}`
    : null;
  const session = useCardCollabSession({
    documentName: collabDocumentName,
    active: !isPreview,
  });
  const collabProvider = session.status === "synced" ? session.provider : null;
  // Editors stay read-only until Yjs (or, if the collab server is down, the
  // HTML columns) owns them, so nothing typed in between is dropped.
  const editorsReady =
    !isPreview && (!!collabProvider || session.status === "unavailable");

  // Everything on the card saves as it changes — there is no Save button.
  const {
    values,
    saveState,
    hasPendingSave,
    handleFieldUpdate,
    flushAll,
    hasUnsavedChanges,
    trackSave,
    retry,
  } = useCardHtmlAutosave({
    card: proposalCard,
    cardId,
    collabLive: !!collabProvider && session.connected,
    bound: !!collabProvider,
  });
  useUnsavedChangesGuard(hasPendingSave);

  // Milestones this card is submitted with, so the student knows where its
  // content goes; a milestone already submitted reads as done. Only milestones
  // with an action card on this board count: a card's settings can still name
  // a step the board doesn't have.
  const { milestones: boardMilestones } = useBoardMilestones(
    proposal?.id || proposalId
  );
  const cardMilestones = useMemo(
    () =>
      (boardMilestones || [])
        .filter((milestone) =>
          cardIncludedInReviewStep(proposalCard, milestone?.key, boardMilestones)
        )
        .map((milestone) => {
          // The milestone's own action card on this board, opened from the chip.
          const actionCard = (proposal?.sections || [])
            .flatMap((section) => section?.cards || [])
            .find(
              (card) =>
                isActionCard(card) &&
                ((milestone?.id && card?.milestone?.id === milestone.id) ||
                  actionCardMatchesReviewStep(
                    card,
                    milestone?.key,
                    boardMilestones
                  ))
            );
          return {
            milestone,
            actionCardId: actionCard?.id ?? null,
            // Data collection is done once the study is submitted (and with
            // it locked); other milestones once the board submitted them.
            completed: isStudyStatusMilestone(milestone)
              ? proposal?.study?.dataCollectionStatus === "SUBMITTED"
              : isMilestoneSubmitted(proposal, milestone, boardMilestones),
          };
        })
        .filter(({ actionCardId }) => !!actionCardId),
    [boardMilestones, proposalCard, proposal]
  );
  const previousEntries = useMemo(
    () => listPreviousEntries({ ...proposalCard, content: values.content }, isLocked),
    [proposalCard, values.content, isLocked]
  );
  // Preview never writes, even if an editor reports a change.
  const updateField = isPreview ? () => {} : handleFieldUpdate;
  const collaborationUser = {
    id: user?.id || null,
    name:
      user?.username ||
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      "Editor",
  };

  const [updateEdit, { loading: updateEditLoading }] = useMutation(
    UPDATE_CARD_EDIT,
    {
      ignoreResults: true,
    },
  );

  // Status and assignees save on change; refetch so the card reflects them.
  const [saveCardFields] = useMutation(UPDATE_CARD_EDIT, {
    refetchQueries: [{ query: GET_CARD_CONTENT, variables: { id: cardId } }],
  });

  // Assignment visibility & permissions for "Assigned to" section
  const assignedCount = inputs?.assignedTo?.length || 0;
  const isTeacherOrMentor = user?.permissions?.some((p) =>
    ["TEACHER", "MENTOR"].includes(p?.name),
  );

  // Whose homework the assignment chips and the assignment modal show. A
  // student sees only their own. A teacher or mentor visiting a student board
  // sees that board's students, i.e. what those students see — not everyone
  // who ever answered the assignment (homework only links its assignment, so
  // an unscoped query spans every class and past year). On a board with no
  // students of its class (e.g. their own board) they see their own.
  const boardMemberIds = [
    ...new Set(
      [proposal?.author?.id, ...(proposal?.collaborators || []).map((c) => c?.id)]
        .filter(Boolean)
    ),
  ];
  const boardClassId = proposal?.usedInClass?.id;
  const lookUpBoardStudents =
    isTeacherOrMentor && !!boardClassId && boardMemberIds.length > 0;
  const { data: boardStudentsData } = useQuery(GET_BOARD_STUDENT_MEMBERS, {
    variables: { memberIds: boardMemberIds, classId: boardClassId },
    skip: !lookUpBoardStudents,
  });
  const boardStudentIds = (boardStudentsData?.profiles || []).map((p) => p.id);
  const homeworkAuthorsReady = !lookUpBoardStudents || !!boardStudentsData;
  const homeworkAuthorIds =
    isTeacherOrMentor && boardStudentIds.length > 0
      ? boardStudentIds
      : user?.id
        ? [user.id]
        : [];
  const homeworkAuthorsKey = homeworkAuthorIds.join(",");

  // Homework status per assignment for chip styling (homework belongs to assignment, not card)
  const assignmentIds = (inputs?.assignments || proposalCard?.assignments || [])
    .map((a) => a?.id)
    .filter(Boolean);
  const { data: cardHomeworkData } = useQuery(
    GET_HOMEWORK_FOR_CARD_ASSIGNMENTS_BY_AUTHORS,
    {
      variables: { assignmentIds, authorIds: homeworkAuthorIds },
      skip:
        !homeworkAuthorsReady ||
        homeworkAuthorIds.length === 0 ||
        assignmentIds.length === 0,
    },
  );
  const homeworkStatusByAssignmentId = useMemo(
    () =>
      statusByAssignmentForAuthors(
        cardHomeworkData?.homeworks,
        homeworkAuthorsKey ? homeworkAuthorsKey.split(",") : [],
      ),
    [cardHomeworkData, homeworkAuthorsKey],
  );
  const studentsCanAssignToCards = getBoardStudentsCanAssignToCards(
    proposal,
    proposal?.usedInClass
  );
  const assignableToStudents = getBoardAssignableToStudents(
    proposal,
    proposal?.usedInClass
  );
  const canAddAssignment = isTeacherOrMentor || studentsCanAssignToCards;

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

  // update the assignedTo and save it
  const handleAssignedToChange = (assignedTo) => {
    const assigned = assignedTo.map((a) => ({ id: a }));
    handleChange({
      target: {
        name: "assignedTo",
        value: assigned,
      },
    });
    trackSave(() =>
      saveCardFields({
        variables: { id: cardId, input: { assignedTo: { set: assigned } } },
      }),
    );
  };

  // update the settings and save them
  const handleSettingsChange = (name, value) => {
    const settings = { ...inputs.settings, [name]: value };
    handleChange({
      target: {
        name: "settings",
        value: settings,
      },
    });
    // Merge with the card's current settings so properties edited elsewhere
    // (includeInReport, includeInReviewSteps…) aren't overwritten.
    trackSave(() =>
      saveCardFields({
        variables: {
          id: cardId,
          input: {
            settings: mergeCardSettings(proposalCard?.settings, settings),
          },
        },
      }),
    );
  };

  // Student-picked tasks & surveys: saved with the teacher-linked tasks, and
  // listed in settings.studentTaskIds so template propagation keeps them.
  const showStudentTaskPicker = allowsStudentTaskSelection(proposalCard);
  const linkedTasks = getTemplateLinkedTasks(inputs);
  const handleStudentTasksChange = (picks) => {
    const tasks = [...getTemplateLinkedTasks(inputs), ...picks];
    const settings = {
      ...inputs.settings,
      studentTaskIds: picks.map((task) => task.id),
    };
    handleChange({ target: { name: "tasks", value: tasks } });
    handleChange({ target: { name: "settings", value: settings } });
    trackSave(() =>
      saveCardFields({
        variables: {
          id: cardId,
          input: {
            tasks: { set: tasks.map((task) => ({ id: task.id })) },
            settings: mergeCardSettings(proposalCard?.settings, settings),
          },
        },
      }),
    );
  };

  // Send update to the server when the editor gains focus
  const handleFocus = async () => {
    if (isPreview) return;
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

  // Wait for outstanding saves, release the card, and go back to the board.
  // Leave this card for `query` (the board, or another card) once everything
  // typed here is saved and the card is released.
  const leaveCard = async (query) => {
    await flushAll();
    if (
      hasUnsavedChanges() &&
      !confirm(
        t(
          "mainCard.leaveWithFailedSave",
          "Some changes could not be saved. Leave anyway?",
        ),
      )
    ) {
      return;
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

    router.push({ pathname: `/builder/projects/`, query });
  };

  const handleBack = () => leaveCard({ selector: proposalId });

  const openMilestoneCard = (actionCardId) =>
    leaveCard({ selector: proposalId, card: actionCardId });

  // Handler to open assignment modal
  const openAssignmentModalHandler = (assignment) => {
    if (!assignment) {
      console.error("No assignment provided to openAssignmentModalHandler");
      return;
    }
    if (isPreview) {
      onOpenAssignment?.(assignment);
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

    // Existing homeworks of the same authors as the chips (homeworkAuthorIds):
    // the student's own, or the visited board's students for a teacher.
    const { data: homeworkData } = useQuery(
      GET_HOMEWORKS_FOR_ASSIGNMENT_BY_AUTHORS,
      {
        variables: {
          assignmentCode: assignment?.code,
          authorIds: homeworkAuthorIds,
        },
        skip:
          !assignment?.code ||
          !homeworkAuthorsReady ||
          homeworkAuthorIds.length === 0,
      },
    );

    const homeworks = homeworkData?.homeworks || [];

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
            query: GET_HOMEWORKS_FOR_ASSIGNMENT_BY_AUTHORS,
            variables: {
              assignmentCode: assignment?.code,
              authorIds: homeworkAuthorIds,
            },
          },
          {
            query: GET_HOMEWORK_FOR_CARD_ASSIGNMENTS_BY_AUTHORS,
            variables: { assignmentIds, authorIds: homeworkAuthorIds },
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
            query: GET_HOMEWORKS_FOR_ASSIGNMENT_BY_AUTHORS,
            variables: {
              assignmentCode: assignment?.code,
              authorIds: homeworkAuthorIds,
            },
          },
          {
            query: GET_HOMEWORK_FOR_CARD_ASSIGNMENTS_BY_AUTHORS,
            variables: { assignmentIds, authorIds: homeworkAuthorIds },
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
      marginBottom: "16px",
    };
    const fieldLabelStyle = {
      margin: "0 0 4px",
      font: "var(--MH-Type-Label-Base)",
      letterSpacing: 0,
      color: "var(--MH-Theme-Neutrals-Black, #171717)",
    };
    const fieldInputStyle = {
      width: "50%",
      minWidth: "20px",
      padding: "8px 12px",
      borderRadius: "8px",
      border: "1px solid var(--MH-Theme-Neutrals-Medium, #a1a1a1)",
      marginTop: "4px",
      font: "var(--MH-Type-Body-Base)",
      letterSpacing: 0,
      color: "var(--MH-Theme-Neutrals-Black, #171717)",
      boxSizing: "border-box",
    };
    const instructionBox = {
      // background: "#F3F3F3",
      borderLeft: "4px solid #274E5B",
      borderRadius: "4px",
      padding: "16px",
      marginBottom: "16px",
    };
    const styleField = {
      color: "#274E5B",
      border: "1px solid #e0e0e0",
      borderRadius: "8px",
      padding: "12px",
      marginBottom: "3rem",
    };

    const getHomeworkStatusTone = (status) => {
      if (status === "Completed") return "success";
      if (status === "Needs feedback") return "info";
      if (status === "Feedback given") return "neutral";
      if (status === "Started") return "warning";
      return "neutral";
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
            className="MH-Type-Title-Large"
            style={{
              background: "#f9fafb",
              borderBottom: "1px solid #e0e0e0",
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
            className="MH-Type-Title-Large"
            style={{
              background: "#f9fafb",
              borderBottom: "1px solid #e0e0e0",
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
            <Button variant="outline" type="button" onClick={onClose}>
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
          className="MH-Type-Title-Large"
          style={{
            background: "#f9fafb",
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          {t("board.expendedCard.assignment", "Assignment")}
        </Modal.Header>
        <Modal.Content
          scrolling
          style={{ background: "#ffffff", padding: "24px" }}
        >
          <div>
            <div className="MH-Type-Title-Large" style={h1}>{title}</div>
            <ReadOnlyTipTap>
              <div className="ProseMirror">
                {ReactHtmlParser(content || "")}
              </div>
            </ReadOnlyTipTap>
            {/* Homework Section */}
            <div style={{ marginTop: "24px", paddingTop: "24px" }}>
              {homeworks.length > 0 && (
                <div
                  className="MH-Type-Title-Small"
                  style={{ marginBottom: "16px", color: "var(--MH-Theme-Primary-Dark, #336f8a)" }}
                >
                  {isMentorOrTeacher
                    ? t("homework.allEntries", "All entries")
                    : t("homework.myEntry", "My entry")}
                </div>
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
                          className="MH-Type-Title-Small"
                          style={{
                            marginBottom: "4px",
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
                          className="MH-Type-Label-Base"
                          style={{
                            marginTop: "4px",
                          }}
                        >
                          <Chip
                            variant="static"
                            tone={getHomeworkStatusTone(homework.settings?.status)}
                            label={
                              homework.settings?.status ||
                              t(
                                "homework.openAssignmentHint",
                                {},
                                { default: "Open assignment to see more" },
                              )
                            }
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant={
                          activeHomework?.id === homework?.id ? "filled" : "outline"
                        }
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
                        <div className="MH-Type-Title-Large" style={h1}>
                          {t(
                            "homework.editEntry",
                            "Edit your entry",
                          )}
                        </div>

                        <div style={{ marginBottom: "12px" }}>
                          <p style={fieldLabelStyle}>
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
                            style={fieldInputStyle}
                          />
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                          <div
                            style={{
                              minHeight: "100px",
                              marginTop: "4px",
                            }}
                          >
                            <p style={fieldLabelStyle}>
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
                              mediaLibraryId={
                                proposal?.id || proposalId
                              }
                              mediaLibrarySource={{
                                sourceType: "projectCard",
                                sourceId: proposalCard?.id ?? null,
                                createdWith: "upload",
                              }}
                              mediaDisplayedInProposalCardId={
                                proposalCard?.id ?? null
                              }
                            />
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <Button
                            type="button"
                            variant="tonal"
                            onClick={handleUpdateHomeworkSubmit}
                            disabled={updateLoading}
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
                              font: 'var(--MH-Type-Label-Base)',
                              letterSpacing: 0,
                              color: "#B9261A",
                              border: "1px solid #B9261A",
                              marginRight: "10px",
                            }}
                          >
                            {t("homework.cancel", "Cancel")}
                          </Button> */}
                          <Button
                            type="button"
                            variant="outline"
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
                            disabled={updateLoading}
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
                                type="button"
                                variant="outline"
                                onClick={() => handleStatusUpdate("Feedback given")}
                                disabled={updateLoading}
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
                  type="button"
                  variant="filled"
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
                  disabled={createLoading}
                >
                  {t("homework.createNewEntry", "Create entry")}
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
                  <div className="MH-Type-Title-Large" style={h1}>
                    {t("homework.createNewEntry", "Create entry")}
                  </div>

                  <div style={{ marginBottom: "12px" }}>
                    <p style={fieldLabelStyle}>
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
                      style={fieldInputStyle}
                    />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <div
                      style={{
                        minHeight: "100px",
                        marginTop: "4px",
                      }}
                    >
                      <p style={fieldLabelStyle}>
                        {t("homework.yourEntry", "Your entry")}
                      </p>
                      <TipTapEditor
                        content={homeworkContent.current || inputs.placeholder}
                        onUpdate={(newContent) =>
                          updateHomeworkContent(newContent)
                        }
                        mediaLibraryId={
                          proposal?.id || proposalId
                        }
                        mediaLibrarySource={{
                          sourceType: "projectCard",
                          sourceId: proposalCard?.id ?? null,
                          createdWith: "upload",
                        }}
                        mediaDisplayedInProposalCardId={
                          proposalCard?.id ?? null
                        }
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <Button
                      type="button"
                      variant="tonal"
                      onClick={handleCreateHomeworkSubmit}
                      disabled={createLoading}
                    >
                      {t("homework.createHomeworkSubmit", "Mark as complete")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCreateHomeworkDraft}
                      disabled={createLoading}
                    >
                      {t("homework.saveHomeworkDraft", "Save Draft")}
                    </Button>
                    <Button
                      type="button"
                      variant="text"
                      onClick={() => {
                        setShowNewHomework(false);
                        clearForm();
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
          <Button variant="outline" type="button" onClick={onClose}>
            {t("board.expendedCard.close", "Close")}
          </Button>
        </Modal.Actions>
      </Modal>
    );
  };

  return (
    <>
      {isPreview ? null : (
        <Navigation
          query={query}
          user={user}
          tab={tab}
          proposalId={proposalId}
          cardId={cardId}
          onBack={handleBack}
          inputs={inputs}
          handleSettingsChange={handleSettingsChange}
          saveIndicator={
            <SaveIndicator
              saveState={saveState}
              connecting={session.status === "connecting"}
              onRetry={retry}
            />
          }
        />
      )}
      <StyledProposal>
        <div className="post">
          <div className="proposalCardBoard">
            <div className="textBoard">
              <div className="cardHeader">{inputs?.title}</div>
              <ReadOnlyTipTap>
                <div className="ProseMirror">
                  {ReactHtmlParser(inputs?.description)}
                </div>
              </ReadOnlyTipTap>
              {!isPreview &&
                assignableToStudents &&
                (assignedCount > 0 || canAddAssignment) && (
                  <div>
                    <div className="cardSubheaderAssign" style={{ display: "flex", alignItems: "center", gap: "8px"}}>
                      {t("mainCard.assignedTo", "Assigned to")}
                      {!canAddAssignment ? (
                        <Tooltip
                          content={t(
                            "assigned.onlyTeachersMentorsCanAdd",
                            "Only teachers and mentors can add assignments"
                          )}
                        >
                          <div style={{display: "flex", alignItems: "center", justifyContent: "center"}}>
                            <img style={{ opacity: 0.5 }} src="/assets/icons/question_mark.svg" alt="Lock" />
                          </div>
                        </Tooltip>
                      ) : (
                        <></>
                      )}
                    </div>
                    <Assigned
                      users={collaborators}
                      assignedTo={inputs?.assignedTo}
                      onAssignedToChange={handleAssignedToChange}
                      user={user}
                      proposal={proposal}
                      cardId={cardId}
                      cardData={inputs}
                      studentsCanAssignToCards={studentsCanAssignToCards}
                    />
                  </div>
                )}
              {proposalCard?.settings?.includeInReport &&
                previousEntries.length > 0 && (
                <>
                  <div className="cardSubheader">
                    {t("mainCard.previousEntries", "Your previous entries")}
                  </div>
                  {previousEntries.map((entry) => {
                    const open = openEntryKeys.includes(entry.key);
                    const label = entry.isOriginal
                      ? t("mainCard.originalEntry", "Your original entry")
                      : entry.title;
                    return (
                      <div className="originalEntryBlock" key={entry.key}>
                        <button
                          type="button"
                          className="originalEntryBlockHeader"
                          onClick={() => toggleEntry(entry.key)}
                          aria-expanded={open}
                          aria-label={label}
                        >
                          <span>
                            {label}
                            {entry.submittedAt && (
                              <span className="originalEntryBlockDate">
                                {moment(entry.submittedAt).format("YYYY-MM-DD")}
                              </span>
                            )}
                          </span>
                          <span style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <img style={{ transform: `${open ? 'rotate(270deg)' : 'rotate(90deg)'}`,  width: "8px", height: "8px" }} src="/assets/icons/back.svg" alt={t("cardNavigation.back", "back")} />
                            <img style={{ transform: `${open ? 'rotate(90deg)' : 'rotate(270deg)'}`,  width: "8px", height: "8px" }} src="/assets/icons/back.svg" alt={t("cardNavigation.back", "back")} />
                          </span>
                        </button>
                        {open && (
                          <div className="originalEntryBlockContent">
                            <ReadOnlyTipTap>
                              <div className="ProseMirror">
                                {ReactHtmlParser(entry.content || "")}
                              </div>
                            </ReadOnlyTipTap>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {proposalCard?.settings?.includeInReport && !isLocked && (
                <>
                  <div className="cardSubheader">
                    {t("mainCard.yourEntry", "Your entry")}
                  </div>
                    <div onFocus={handleFocus}>
                      <TipTapEditor
                        content={values.content}
                        collaboration={
                          collabProvider
                            ? { provider: collabProvider, field: "content" }
                            : null
                        }
                        collaborationUser={collaborationUser}
                        isEditable={editorsReady}
                        onUpdate={(html, meta) =>
                          updateField("content", html, meta)
                        }
                        mediaLibraryId={
                          proposal?.id || proposalId
                        }
                        mediaLibrarySource={{
                          sourceType: "projectCard",
                          sourceId: proposalCard?.id ?? null,
                          createdWith: "upload",
                        }}
                        mediaDisplayedInProposalCardId={
                          proposalCard?.id ?? null
                        }
                      />
                    </div>
                </>
              )}

              {proposalCard?.settings?.includeInReport && isLocked && (
                <>
                  <div className="cardSubheader">
                    {t("mainCard.revisedEntry", "Your revised entry")}
                  </div>
                    <div onFocus={handleFocus}>
                      <TipTapEditor
                        content={values.revisedContent}
                        collaboration={
                          collabProvider
                            ? { provider: collabProvider, field: "revisedContent" }
                            : null
                        }
                        collaborationUser={collaborationUser}
                        isEditable={editorsReady}
                        onUpdate={(html, meta) =>
                          updateField("revisedContent", html, meta)
                        }
                        mediaLibraryId={
                          proposal?.id || proposalId
                        }
                        mediaLibrarySource={{
                          sourceType: "projectCard",
                          sourceId: proposalCard?.id ?? null,
                          createdWith: "upload",
                        }}
                        mediaDisplayedInProposalCardId={
                          proposalCard?.id ?? null
                        }
                      />
                    </div>
                </>
              )}
            </div>
            <div className="infoBoard">
              {/* Display Linked Items: Assignments first, then combined Resources */}
              {(inputs?.assignments?.length > 0 ||
                inputs?.resources?.length > 0 ||
                linkedTasks.length > 0 ||
                inputs?.studies?.length > 0) && (
                <div className="linkedItemsSection">
                  {inputs?.assignments?.length > 0 && (
                    <PreviewSection
                      title={t("board.expendedCard.previewLinkedAssignments", "Linked Assignments")}
                      items={inputs.assignments}
                      type="assignment"
                      proposal={proposal}
                      classId={proposal?.usedInClass?.id}
                      openAssignmentModal={openAssignmentModalHandler}
                      user={user}
                      homeworkStatusByAssignmentId={homeworkStatusByAssignmentId}
                    />  
                  )}
                  {(inputs?.resources?.length > 0 ||
                    linkedTasks.length > 0 ||
                    inputs?.studies?.length > 0) && (
                    <PreviewSection
                      title={t("board.expendedCard.previewLinkedResources", "Linked Resources")}
                      sections={[
                        ...(inputs?.resources?.length > 0
                          ? [{ items: inputs.resources, type: "resource" }]
                          : []),
                        ...(linkedTasks.length > 0
                          ? [{ items: linkedTasks, type: "task" }]
                          : []),
                        ...(inputs?.studies?.length > 0
                          ? [{ items: inputs.studies, type: "study" }]
                          : []),
                      ]}
                      proposal={proposal}
                      classId={proposal?.usedInClass?.id}
                      openAssignmentModal={openAssignmentModalHandler}
                      openResourceModal={openResourceModalHandler}
                      user={user}
                    />
                  )}
                <div
                  style={{
                    borderTop: "1px solid #E0E0E0",
                    width: "100%",
                  }}
                  aria-hidden="true"
                />
                </div>

              )}
              {showStudentTaskPicker && (
                <StudentTaskPicker
                  proposalCard={inputs}
                  classId={proposal?.usedInClass?.id}
                  user={user}
                  // Submitted cards stay editable (the student revises them),
                  // so only the teacher preview is read-only.
                  disabled={isPreview}
                  onChange={handleStudentTasksChange}
                />
              )}
              <div className="proposalCardComments">
                <div className="cardSubheader">
                  {t("mainCard.comments", "Comments")}
                </div>
                <TipTapEditor
                  content={values.comment}
                  collaboration={
                    collabProvider
                      ? { provider: collabProvider, field: "comment" }
                      : null
                  }
                  collaborationUser={collaborationUser}
                  isEditable={editorsReady}
                  onUpdate={(html, meta) =>
                    updateField("comment", html, meta)
                  }
                  limitedToolbar={true}
                  mediaLibraryId={
                    proposal?.id || proposalId
                  }
                  mediaLibrarySource={{
                    sourceType: "projectCard",
                    sourceId: proposalCard?.id ?? null,
                    createdWith: "upload",
                  }}
                  mediaDisplayedInProposalCardId={
                    proposalCard?.id ?? null
                  }
                  placeholder={t(
                    "mainCard.commentsPlaceholder",
                    "Add your comment here...",
                  )}
                />
              </div>
              {cardMilestones.length > 0 ? (
                <div
                  className="proposalCardMilestones"
                  style={{ display: "grid", gap: "8px", marginTop: "16px" }}
                >
                  <div className="cardSubheader">
                    {t("mainCard.milestones", "Milestones")}
                  </div>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                  >
                    {cardMilestones.map(({ milestone, actionCardId, completed }) => {
                      const open =
                        !isPreview && actionCardId
                          ? () => openMilestoneCard(actionCardId)
                          : undefined;
                      const icon = completed ? (
                        <MilestoneCompletedIcon width={18} height={18} />
                      ) : (
                        <MilestoneIcon width={18} height={18} />
                      );
                      const label = milestone.title || milestone.key;
                      if (!completed) {
                        return (
                          <Chip
                            key={milestone.id || milestone.key}
                            label={label}
                            leading={icon}
                            onClick={open}
                          />
                        );
                      }
                      // Completed: static look, but still opens the milestone.
                      // Static chips ignore clicks, so a bare button carries it.
                      const chip = (
                        <Chip variant="static" tone="neutral" label={label} leading={icon} />
                      );
                      return open ? (
                        <button
                          key={milestone.id || milestone.key}
                          type="button"
                          onClick={open}
                          style={{
                            display: "inline-flex",
                            margin: 0,
                            padding: 0,
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                          }}
                        >
                          {chip}
                        </button>
                      ) : (
                        <span key={milestone.id || milestone.key}>{chip}</span>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              <Modal
                open={resourceModalState.open}
                onClose={closeResourceModalHandler}
                size="large"
                style={{ borderRadius: "12px", overflow: "hidden" }}
              >
                <Modal.Header
                  className="MH-Type-Title-Large"
                  style={{
                    background: "#f9fafb",
                    borderBottom: "1px solid #e0e0e0",
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
                    type="button"
                    variant="filled"
                    onClick={closeResourceModalHandler}
                  >
                    {t("board.expendedCard.close", "Close")}
                  </Button>
                </Modal.Actions>
              </Modal>
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
