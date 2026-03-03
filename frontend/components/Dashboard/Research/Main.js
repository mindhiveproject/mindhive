import { useMemo, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import useTranslation from "next-translate/useTranslation";

import Chip from "../../DesignSystem/Chip";
import StyledResearch from "./StyledResearch";

const GRAPHQL_ENDPOINT =
  process.env.NODE_ENV === "development"
    ? "http://localhost:4444/api/graphql"
    : process.env.NEXT_PUBLIC_RESEARCH_EXPORT_ENDPOINT;

const EXPORT_QUERY = `
  query ResearchExport($code: String!) {
    class(where: { code: $code }) {
      id
      title
      students {
        id
      }
      studentProposals {
        id
        title
        isMain
        submitProposalStatus
        peerFeedbackStatus
        projectReportStatus
        reviewsCount
        collaborators {
          id
        }
        sections {
          title
          cardsCount
          cards {
            id
            title
            internalContent
            revisedContent
            content
            comment
            settings
            resources {
              id
            }
            assignments {
              id
            }
            studies {
              id
            }
            tasks {
              id
            }
            createdAt
          }
        }
        reviews {
          id
          stage
          upvotedBy {
            id
          }
          createdAt
          author {
            id
          }
          content
        }
      }
    }
  }
`;

const BOARD_EXPORT_QUERY = `
  query BoardExport($id: ID!) {
    proposalBoard(where: { id: $id }) {
      id
      title
      isMain
      submitProposalStatus
      peerFeedbackStatus
      projectReportStatus
      reviewsCount
      collaborators {
        id
      }
      usedInClass {
        id
        title
      }
      sections {
        title
        cardsCount
        cards {
          id
          title
          internalContent
          revisedContent
          content
          comment
          settings
          resources {
            id
          }
          assignments {
            id
          }
          studies {
            id
          }
          tasks {
            id
          }
          createdAt
        }
      }
      reviews {
        id
        stage
        upvotedBy {
          id
        }
        createdAt
        author {
          id
          username
        }
        content
      }
    }
  }
`;

const STAGE_OPTIONS = [
  {
    value: "submitProposalStatus",
    label: "Proposal Stage",
    helper: "Filter by initial proposal progression.",
  },
  {
    value: "peerFeedbackStatus",
    label: "Peer Feedback Stage",
    helper: "Filter by peer review progression.",
  },
  {
    value: "projectReportStatus",
    label: "Project Report Stage",
    helper: "Filter by report/analysis progression.",
  },
];

const SCOPE_OPTIONS = [
  {
    value: "ALL",
    label: "All Boards",
    helper: "Include every board regardless of submission status.",
  },
  {
    value: "NOT_STARTED",
    label: "Not Started",
    helper: "submitProposalStatus is NOT_STARTED.",
  },
  {
    value: "IN_PROGRESS",
    label: "In Progress",
    helper: "submitProposalStatus is IN_PROGRESS.",
  },
  {
    value: "SUBMITTED",
    label: "Submitted",
    helper: "submitProposalStatus is SUBMITTED.",
  },
  {
    value: "FINISHED",
    label: "Finished",
    helper: "submitProposalStatus is FINISHED.",
  },
];

const scopeFilterMap = {
  ALL: () => true,
  NOT_STARTED: (status) => status === "NOT_STARTED",
  IN_PROGRESS: (status) => status === "IN_PROGRESS",
  SUBMITTED: (status) => status === "SUBMITTED",
  FINISHED: (status) => status === "FINISHED",
};

const hasResearchAccess = (user) => {
  const permissions = user?.permissions?.map((permission) => permission?.name);
  if (!permissions || permissions.length === 0) return false;
  if (permissions.includes("ADMIN")) return true;
  return permissions.includes("RESEARCH");
};

const extractTextFromHTML = (htmlString) => {
  if (!htmlString) return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return htmlString;
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  return doc.body.textContent || "";
};

const escapeCSV = (value) => {
  if (value === null || value === undefined) return '""';
  if (typeof value === "string") {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return `"${String(value)}"`;
};

const flattenBoards = (proposalBoards, classMeta = {}, shape = "long") => {
  const rows = [];
  proposalBoards.forEach((board) => {
    const linkedStudents = board.linkedClassStudents || [];
    const linkedStudentNames = linkedStudents
      .map((student) => student?.id)
      .filter(Boolean)
      .join(", ");
    const allCollaboratorNames = (board.collaborators || [])
      .map((collab) => collab?.id)
      .filter(Boolean)
      .join(", ");

    board.sections?.forEach((section) => {
      section.cards?.forEach((card) => {
        const settings = card?.settings || {};
        const includeInReport = settings?.includeInReport;
        const includeInReviewSteps = settings?.includeInReviewSteps;
        const reviewStageLabel = includeInReport
          ? includeInReviewSteps || "Included in review stages"
          : "Not included in review stages";
        const resourceIds = Array.isArray(card?.resources)
          ? card.resources
              .map((resource) => resource?.id)
              .filter(Boolean)
              .join(", ")
          : "";
        const assignmentIds = Array.isArray(card?.assignments)
          ? card.assignments
              .map((assignment) => assignment?.id)
              .filter(Boolean)
              .join(", ")
          : "";
        const studyIds = Array.isArray(card?.studies)
          ? card.studies
              .map((study) => study?.id)
              .filter(Boolean)
              .join(", ")
          : "";
        const taskIds = Array.isArray(card?.tasks)
          ? card.tasks
              .map((task) => task?.id)
              .filter(Boolean)
              .join(", ")
          : "";
        const sectionCardsCount =
          section.cardsCount ?? section.cards?.length ?? 0;

        rows.push({
          boardId: board.id,
          boardTitle: board.title,
          submitProposalStatus: board.submitProposalStatus,
          peerFeedbackStatus: board.peerFeedbackStatus,
          projectReportStatus: board.projectReportStatus,
          reviewsCount: board.reviewsCount,
          selectionReason: board.selectionReason || "",
          classTitle: classMeta.title || "",
          sectionTitle: section.title,
          sectionCardsCount,
          cardId: card?.id || "",
          cardTitle: card.title,
          includeInReviewSteps: reviewStageLabel,
          cardInternalContent: card.internalContent,
          cardRevisedContent: card.revisedContent,
          cardComment: card.comment,
          cardContent: card.content,
          // cardContent: extractTextFromHTML(card.content),
          cardCreatedAt: card.createdAt,
          resourceIds,
          assignmentIds,
          studyIds,
          taskIds,
          classStudentCollaborators: linkedStudentNames,
          boardCollaborators: allCollaboratorNames,
        });
      });
    });
  });

  if (shape === "wide" && rows.length > 0) {
    const grouped = new Map();
    rows.forEach((row) => {
      const key = row.boardId;
      if (!grouped.has(key)) {
        grouped.set(key, {
          boardId: row.boardId,
          boardTitle: row.boardTitle,
          submitProposalStatus: row.submitProposalStatus,
          peerFeedbackStatus: row.peerFeedbackStatus,
          projectReportStatus: row.projectReportStatus,
          reviewsCount: row.reviewsCount,
          selectionReason: row.selectionReason,
          classTitle: row.classTitle,
          classStudentCollaborators: row.classStudentCollaborators,
          boardCollaborators: row.boardCollaborators,
        });
      }
      const base = grouped.get(key);
      const sectionKey = row.sectionTitle || "Unsectioned";
      const prefix = `${sectionKey}::${row.cardTitle}`;
      base[`cardContent::${prefix}`] = row.cardContent;
      base[`cardInternalContent::${prefix}`] = row.cardInternalContent;
      base[`cardRevisedContent::${prefix}`] = row.cardRevisedContent;
      base[`cardComment::${prefix}`] = row.cardComment;
      base[`cardCreatedAt::${prefix}`] = row.cardCreatedAt;
      base[`resourceIds::${prefix}`] = row.resourceIds;
      base[`assignmentIds::${prefix}`] = row.assignmentIds;
      base[`studyIds::${prefix}`] = row.studyIds;
      base[`taskIds::${prefix}`] = row.taskIds;
      base[`includeInReviewSteps::${prefix}`] = row.includeInReviewSteps;
    });
    return Array.from(grouped.values());
  }

  return rows;
};

const flattenReviews = (proposalBoards, classMeta = {}, shape = "long") => {
  const rows = [];
  proposalBoards.forEach((board) => {
    board.reviews?.forEach((review) => {
      if (Array.isArray(review.content)) {
        console.log("review", review);
        review.content.forEach((item) => {
          rows.push({
            boardId: board.id,
            reviewsCount: board.reviewsCount,
            reviewId: review.id,
            reviewStage: review.stage,
            reviewUpvotedByCount: review.upvotedBy?.length || 0,
            reviewCreatedAt: review.createdAt,
            reviewAuthorId: review.author?.id || "",
            reviewAuthorUsername: review.author?.username || "",
            reviewQuestion: item?.question || "",
            reviewAnswer: item?.answer || "",
            submitProposalStatus: board.submitProposalStatus,
            selectionReason: board.selectionReason || "",
            boardTitle: board.title,
            classTitle: classMeta.title || "",
          });
        });
      }
    });
  });

  if (shape === "wide" && rows.length > 0) {
    const grouped = new Map();
    rows.forEach((row) => {
      const key = `${row.boardId}::${row.reviewId}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          boardId: row.boardId,
          reviewsCount: row.reviewsCount,
          reviewId: row.reviewId,
          reviewStage: row.reviewStage,
          reviewUpvotedByCount: row.reviewUpvotedByCount,
          reviewCreatedAt: row.reviewCreatedAt,
          reviewAuthorId: row.reviewAuthorId,
          reviewAuthorUsername: row.reviewAuthorUsername,
          submitProposalStatus: row.submitProposalStatus,
          selectionReason: row.selectionReason,
          boardTitle: row.boardTitle,
          classTitle: row.classTitle,
        });
      }
      const base = grouped.get(key);
      base[`reviewQuestion::${row.reviewQuestion}`] = row.reviewAnswer;
    });
    return Array.from(grouped.values());
  }

  return rows;
};

const maybeStripBoardTitle = (rows = [], includeBoardTitle = false) => {
  if (includeBoardTitle || !Array.isArray(rows)) return rows;
  return rows.map((row) => {
    if (!row || typeof row !== "object") return row;
    const { boardTitle, ...rest } = row;
    return rest;
  });
};

const convertToCSV = (data) => {
  if (!data || data.length === 0) return "";
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((row) => Object.values(row).map(escapeCSV).join(","));
  return [headers, ...rows].join("\n");
};

const downloadCSV = (csvContent, filename) => {
  if (!csvContent) return;
  if (typeof window === "undefined") return;
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const selectBoardsForClass = (
  boards = [],
  students = [],
  selectionMode = "perStudent"
) => {
  const studentMap = new Map();
  students
    .filter((student) => student?.id)
    .forEach((student) => studentMap.set(student.id, student));
  const totalStudentCount = studentMap.size;

  const candidateBoards = Array.isArray(boards)
    ? boards.filter((board) => board && board.id)
    : [];

  const boardById = new Map();
  candidateBoards.forEach((board) => {
    if (board?.id && !boardById.has(board.id)) {
      boardById.set(board.id, board);
    }
  });

  const boardsByStudentId = new Map();
  const unownedBoards = [];

  candidateBoards.forEach((board) => {
    const collaborators = Array.isArray(board.collaborators)
      ? board.collaborators
      : [];
    const collaboratorIds = collaborators
      .map((collab) => collab?.id)
      .filter(Boolean);
    const classCollaboratorIds = collaboratorIds.filter((id) =>
      studentMap.has(id)
    );

    if (classCollaboratorIds.length === 0) {
      unownedBoards.push(board);
      return;
    }

    classCollaboratorIds.forEach((studentId) => {
      if (!boardsByStudentId.has(studentId)) {
        boardsByStudentId.set(studentId, []);
      }
      boardsByStudentId.get(studentId).push(board);
    });
  });

  const matchedStudentIds = new Set();
  const boardToStudentIds = new Map();

  const choosePreferredBoard = (boardsForStudent = []) => {
    if (!boardsForStudent || boardsForStudent.length === 0) return null;
    const byIsMain = boardsForStudent.find((b) => b.isMain);
    if (byIsMain) return byIsMain;
    const bySubmitted = boardsForStudent.find(
      (b) => b.submitProposalStatus === "SUBMITTED"
    );
    if (bySubmitted) return bySubmitted;
    return boardsForStudent[0];
  };

  boardsByStudentId.forEach((boardsForStudent, studentId) => {
    const preferred = choosePreferredBoard(boardsForStudent);
    if (!preferred || !preferred.id) return;
    matchedStudentIds.add(studentId);
    const boardId = preferred.id;
    if (!boardToStudentIds.has(boardId)) {
      boardToStudentIds.set(boardId, []);
    }
    const existing = boardToStudentIds.get(boardId);
    if (!existing.includes(studentId)) {
      existing.push(studentId);
    }
  });

  const selectedBoards = [];

  boardToStudentIds.forEach((studentIds, boardId) => {
    const baseBoard = boardById.get(boardId);
    if (!baseBoard) return;

    const selectionReason = baseBoard.isMain
      ? "isMain"
      : baseBoard.submitProposalStatus === "SUBMITTED"
      ? "submitted"
      : "candidate";

    selectedBoards.push({
      ...baseBoard,
      selectionReason,
      classStudentCollaboratorsIds: studentIds,
      linkedClassStudents: studentIds,
    });
  });

  if (selectionMode === "perClass") {
    const existingIds = new Set(selectedBoards.map((board) => board.id));
    unownedBoards.forEach((board) => {
      if (!board?.id || existingIds.has(board.id)) return;
      selectedBoards.push({
        ...board,
        selectionReason: "unowned",
        classStudentCollaboratorsIds: [],
        linkedClassStudents: [],
      });
    });
  }

  const unmatchedStudentIds = Array.from(studentMap.keys()).filter(
    (id) => !matchedStudentIds.has(id)
  );

  return {
    boards: selectedBoards,
    matchedStudentCount: matchedStudentIds.size,
    totalStudentCount,
    unmatchedStudentIds,
    nonStudentOwnedBoardCount: unownedBoards.length,
  };
};

export default function ResearchMain({ query, user }) {
  const [classCode, setClassCode] = useState("");
  const [boardId, setBoardId] = useState("");
  const [filterMode, setFilterMode] = useState("byClass");
  const [includeContent, setIncludeContent] = useState(true);
  const [includeReviews, setIncludeReviews] = useState(true);
  const [includeBoardTitle, setIncludeBoardTitle] = useState(false);
  const [activeStage, setActiveStage] = useState(STAGE_OPTIONS[0].value);
  const [activeScope, setActiveScope] = useState(SCOPE_OPTIONS[0].value);
  const [selectionMode, setSelectionMode] = useState("perStudent");
  const [outputShape, setOutputShape] = useState("long");
  const [format, setFormat] = useState("csv");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, message: "" });
  const { t } = useTranslation("research");
  const canAccess = useMemo(() => hasResearchAccess(user), [user]);

  const getScopeLabel = (value) => {
    if (value === "ALL" && filterMode === "byBoard") {
      return t("noStatusFilter", {
        defaultValue: "No status filter",
      });
    }
    return (
      SCOPE_OPTIONS.find((option) => option.value === value)?.label || value
    );
  };

  const resetFilters = () => {
    setClassCode("");
    setBoardId("");
    setFilterMode("byClass");
    setIncludeContent(true);
    setIncludeReviews(true);
    setIncludeBoardTitle(false);
    setActiveStage(STAGE_OPTIONS[0].value);
    setActiveScope(SCOPE_OPTIONS[0].value);
    setSelectionMode("perStudent");
    setOutputShape("long");
    setFormat("csv");
    setFeedback({ type: null, message: "" });
  };

  const handleDownload = async () => {
    if (!includeContent && !includeReviews) {
      setFeedback({
        type: "error",
        message: t("errors.noDatasetSelected", {
          defaultValue: "Select at least one dataset (board or reviews).",
        }),
      });
      return;
    }

    if (filterMode === "byClass" && !classCode.trim()) {
      setFeedback({
        type: "error",
        message: t("errors.missingClassCode", {
          defaultValue:
            "Please provide a Class Code before running the export.",
        }),
      });
      return;
    }

    if (filterMode === "byBoard" && !boardId.trim()) {
      setFeedback({
        type: "error",
        message: t("errors.missingBoardId", {
          defaultValue:
            "Please provide a Board ID before running the export.",
        }),
      });
      return;
    }

    if (format !== "csv") {
      setFeedback({
        type: "error",
        message: t("errors.formatUnsupported", {
          defaultValue: "Only CSV exports are available at this time.",
        }),
      });
      return;
    }

    setIsLoading(true);
    setFeedback({ type: null, message: "" });

    try {
      if (filterMode === "byClass") {
        const response = await fetch(GRAPHQL_ENDPOINT, {
          method: "POST",
          mode: "cors",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-apollo-operation-name": "RESEARCH_EXPORT",
            "apollo-require-preflight": "true",
          },
          body: JSON.stringify({
            query: EXPORT_QUERY,
            variables: {
              code: classCode.trim(),
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = await response.json();
        const classPayload = payload?.data?.class;

        if (!classPayload) {
          throw new Error(
            t("errors.noClassForId", {
              defaultValue:
                "No class found for that identifier. Double-check it and try again.",
            })
          );
        }

        const {
          studentProposals = [],
          students = [],
          title: classTitle,
        } = classPayload;

        if (
          !Array.isArray(studentProposals) ||
          studentProposals.length === 0
        ) {
          throw new Error(
            t("errors.noProposalsForClass", {
              defaultValue:
                "This class does not currently have any linked student proposal boards.",
            })
          );
        }

        const {
          boards: selectedBoards,
          matchedStudentCount,
          totalStudentCount,
          unmatchedStudentIds,
          nonStudentOwnedBoardCount,
        } = selectBoardsForClass(studentProposals, students, selectionMode);

        if (selectedBoards.length === 0) {
          if (selectionMode === "perStudent") {
            throw new Error(
              t("errors.noStudentOwnedBoards", {
                defaultValue:
                  "This class has proposal boards, but none are owned by enrolled students (no student collaborators). Try switching to 'All class boards' or linking boards to students.",
              })
            );
          }

          throw new Error(
            t("errors.noBoardsAfterOwnershipFilter", {
              defaultValue:
                "No proposal boards matched the current ownership filter.",
            })
          );
        }

        const stageMeta =
          STAGE_OPTIONS.find((option) => option.value === activeStage) ||
          STAGE_OPTIONS[0];
        const filterFn = scopeFilterMap[activeScope] || scopeFilterMap.ALL;
        const scopedBoards = selectedBoards.filter((board) =>
          filterFn(board?.[activeStage])
        );

        console.group("Research export");
        console.log("Mode: byClass");
        console.log("Stage:", activeStage, "Scope:", activeScope);
        console.log("Boards selected:", selectedBoards.length);
        console.log("Boards after scope filter:", scopedBoards.length);

        if (scopedBoards.length === 0) {
          const scopeLabel = getScopeLabel(activeScope);
          console.warn("No boards matched scope", {
            activeStage,
            activeScope,
            selectedBoards,
          });
          console.groupEnd();
          throw new Error(
            t("errors.noBoardsForScope", {
              stageLabel: stageMeta.label,
              scopeLabel,
              defaultValue: `No boards matched the selected ${stageMeta.label} scope (${scopeLabel}).`,
            })
          );
        }

        const exportSummaries = [];
        const pendingDownloads = [];

        if (includeContent) {
          const flattenedContent = maybeStripBoardTitle(
            flattenBoards(
              scopedBoards,
              {
                title: classTitle,
              },
              outputShape
            ),
            includeBoardTitle
          );
          if (flattenedContent.length > 0) {
            const csv = convertToCSV(flattenedContent);
            console.log("Board rows prepared:", flattenedContent.length);
            pendingDownloads.push({
              csv,
              filename: `proposal_boards_${classCode.trim()}_${activeScope}.csv`,
            });
            exportSummaries.push(
              `${flattenedContent.length} board rows prepared for download`
            );
            exportSummaries.push(`Boards exported in ${outputShape} format`);
            if (outputShape === "wide") {
              exportSummaries.push(
                "Board cards pivoted by cardTitle (wide format)"
              );
            }
          } else {
            exportSummaries.push(
              "No proposal card content matched the current scope."
            );
          }
        }

        if (includeReviews) {
          const flattenedReviewData = maybeStripBoardTitle(
            flattenReviews(
              scopedBoards,
              {
                title: classTitle,
              },
              outputShape
            ),
            includeBoardTitle
          );
          if (flattenedReviewData.length > 0) {
            const csv = convertToCSV(flattenedReviewData);
            console.log("Review rows prepared:", flattenedReviewData.length);
            pendingDownloads.push({
              csv,
              filename: `proposal_reviews_${classCode.trim()}_${activeScope}.csv`,
            });
            exportSummaries.push(
              `${flattenedReviewData.length} review rows prepared for download`
            );
            exportSummaries.push(`Reviews exported in ${outputShape} format`);
            if (outputShape === "wide") {
              exportSummaries.push(
                "Review responses pivoted by reviewQuestion (wide format)"
              );
            }
          } else {
            exportSummaries.push("No reviews matched the current scope.");
          }
        }

        console.log(
          "Files queued for zip:",
          pendingDownloads.map((d) => d.filename)
        );

        if (pendingDownloads.length > 0) {
          const zip = new JSZip();
          pendingDownloads.forEach((download) => {
            zip.file(download.filename, download.csv);
          });
          const zipFilename = `proposal_export_${classCode
            .trim()
            .replace(/\s+/g, "-")}_${activeStage}_${activeScope}.zip`;
          const zipBlob = await zip.generateAsync({ type: "blob" });
          saveAs(zipBlob, zipFilename);
          exportSummaries.push(`Generated archive: ${zipFilename}`);
        } else {
          exportSummaries.push("No files were generated for download.");
        }

        const unmatchedCount = unmatchedStudentIds.length;
        const scopeLabel = getScopeLabel(activeScope);
        const selectionSummary = [
          `${selectedBoards.length} board${
            selectedBoards.length === 1 ? "" : "s"
          } selected for ${matchedStudentCount} of ${totalStudentCount} student${
            totalStudentCount === 1 ? "" : "s"
          }`,
          "Priority: isMain → submitted",
          `Data scope (${stageMeta.label}): ${
            activeScope === "ALL"
              ? "no status filter applied"
              : `${scopeLabel} only`
          } (${scopedBoards.length} board${
            scopedBoards.length === 1 ? "" : "s"
          })`,
        ];

        if (selectionMode === "perClass" && nonStudentOwnedBoardCount > 0) {
          const suffix = nonStudentOwnedBoardCount === 1 ? "" : "s";
          selectionSummary.push(
            t("summary.nonStudentOwnedBoards", {
              count: nonStudentOwnedBoardCount,
              suffix,
              defaultValue: `${nonStudentOwnedBoardCount} additional board${suffix} not owned by enrolled students (pilots/template boards)`,
            })
          );
        }

        if (unmatchedCount > 0) {
          const unmatchedNames = unmatchedStudentIds
            .map((id) => {
              const student = students.find((entry) => entry?.id === id);
              return id;
            })
            .filter(Boolean)
            .slice(0, 5)
            .join(", ");
          let unmatchedMessage = `${unmatchedCount} student${
            unmatchedCount === 1 ? "" : "s"
          } without an isMain/submitted board`;
          if (unmatchedNames) {
            unmatchedMessage += `: ${unmatchedNames}`;
            if (unmatchedStudentIds.length > 5) {
              unmatchedMessage += "…";
            }
          }
          selectionSummary.push(unmatchedMessage);
        }

        const feedbackMessage = selectionSummary
          .concat(exportSummaries)
          .join(" • ");

        console.log("Export summaries:", exportSummaries);
        console.groupEnd();

        setFeedback({
          type: "success",
          message: feedbackMessage,
        });
      } else {
        const response = await fetch(GRAPHQL_ENDPOINT, {
          method: "POST",
          mode: "cors",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-apollo-operation-name": "RESEARCH_EXPORT_BY_BOARD",
            "apollo-require-preflight": "true",
          },
          body: JSON.stringify({
            query: BOARD_EXPORT_QUERY,
            variables: {
              id: boardId.trim(),
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = await response.json();
        const boardPayload = payload?.data?.proposalBoard;

        if (!boardPayload) {
          throw new Error(
            t("errors.noBoardForId", {
              defaultValue:
                "No board found for that identifier. Double-check it and try again.",
            })
          );
        }

        const stageMeta =
          STAGE_OPTIONS.find((option) => option.value === activeStage) ||
          STAGE_OPTIONS[0];
        const filterFn = scopeFilterMap[activeScope] || scopeFilterMap.ALL;

        const linkedClassStudents = Array.isArray(boardPayload.collaborators)
          ? boardPayload.collaborators
              .map((collab) => (collab?.id ? { id: collab.id } : null))
              .filter(Boolean)
          : [];

        const boardWithMeta = {
          ...boardPayload,
          selectionReason: "singleBoard",
          linkedClassStudents,
        };

        const scopedBoards = filterFn(boardWithMeta?.[activeStage])
          ? [boardWithMeta]
          : [];

        console.group("Research export");
        console.log("Mode: byBoard");
        console.log("Stage:", activeStage, "Scope:", activeScope);
        console.log("Board ID:", boardId.trim());
        console.log("Boards after scope filter:", scopedBoards.length);

        if (scopedBoards.length === 0) {
          const scopeLabel = getScopeLabel(activeScope);
          console.warn("Single board did not match scope", {
            activeStage,
            activeScope,
            boardId: boardId.trim(),
          });
          console.groupEnd();
          throw new Error(
            t("errors.noBoardsForScope", {
              stageLabel: stageMeta.label,
              scopeLabel,
              defaultValue: `No boards matched the selected ${stageMeta.label} scope (${scopeLabel}).`,
            })
          );
        }

        const exportSummaries = [];
        const pendingDownloads = [];
        const classTitle = boardPayload.usedInClass?.title || "";

        if (includeContent) {
          const flattenedContent = maybeStripBoardTitle(
            flattenBoards(
              scopedBoards,
              {
                title: classTitle,
              },
              outputShape
            ),
            includeBoardTitle
          );

          if (flattenedContent.length > 0) {
            const csv = convertToCSV(flattenedContent);
            console.log("Board rows prepared:", flattenedContent.length);
            pendingDownloads.push({
              csv,
              filename: `proposal_boards_board_${boardId
                .trim()
                .replace(/\s+/g, "-")}_${activeScope}.csv`,
            });
            exportSummaries.push(
              `${flattenedContent.length} board rows prepared for download`
            );
            exportSummaries.push(`Boards exported in ${outputShape} format`);
            if (outputShape === "wide") {
              exportSummaries.push(
                "Board cards pivoted by cardTitle (wide format)"
              );
            }
          } else {
            exportSummaries.push(
              "No proposal card content matched the current scope."
            );
          }
        }

        if (includeReviews) {
          const flattenedReviewData = maybeStripBoardTitle(
            flattenReviews(
              scopedBoards,
              {
                title: classTitle,
              },
              outputShape
            ),
            includeBoardTitle
          );

          if (flattenedReviewData.length > 0) {
            const csv = convertToCSV(flattenedReviewData);
            console.log("Review rows prepared:", flattenedReviewData.length);
            pendingDownloads.push({
              csv,
              filename: `proposal_reviews_board_${boardId
                .trim()
                .replace(/\s+/g, "-")}_${activeScope}.csv`,
            });
            exportSummaries.push(
              `${flattenedReviewData.length} review rows prepared for download`
            );
            exportSummaries.push(`Reviews exported in ${outputShape} format`);
            if (outputShape === "wide") {
              exportSummaries.push(
                "Review responses pivoted by reviewQuestion (wide format)"
              );
            }
          } else {
            exportSummaries.push("No reviews matched the current scope.");
          }
        }

        console.log(
          "Files queued for zip:",
          pendingDownloads.map((d) => d.filename)
        );

        if (pendingDownloads.length > 0) {
          const zip = new JSZip();
          pendingDownloads.forEach((download) => {
            zip.file(download.filename, download.csv);
          });
          const zipFilename = `proposal_export_board_${boardId
            .trim()
            .replace(/\s+/g, "-")}_${activeStage}_${activeScope}.zip`;
          const zipBlob = await zip.generateAsync({ type: "blob" });
          saveAs(zipBlob, zipFilename);
          exportSummaries.push(`Generated archive: ${zipFilename}`);
        } else {
          exportSummaries.push("No files were generated for download.");
        }

        const scopeLabel = getScopeLabel(activeScope);
        const selectionSummary = [
          t("summary.singleBoardSelection", {
            defaultValue: "Single board selected for export.",
          }),
          `Data scope (${stageMeta.label}): ${
            activeScope === "ALL"
              ? "no status filter applied"
              : `${scopeLabel} only`
          } (${scopedBoards.length} board)`,
        ];

        const feedbackMessage = selectionSummary
          .concat(exportSummaries)
          .join(" • ");

        console.log("Export summaries:", exportSummaries);
        console.groupEnd();

        setFeedback({
          type: "success",
          message: feedbackMessage,
        });
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "Unexpected error while exporting data.",
      });
      console.error("Research export error", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!canAccess) {
    return (
      <StyledResearch>
        <div className="pageHeader">
          <div className="headerIcon">
            <img src="/assets/icons/education.svg" alt="Education" />
          </div>
          <h1>{t("research", {
            defaultValue: "Research",
          })}</h1>
        </div>
        <div className="toast error">
          {t("errors.noResearchAccess", {
            defaultValue: "You need research-level permissions to access the export tools.",
          })}
        </div>
      </StyledResearch>
    );
  }

  return (
    <StyledResearch>
      <div className="pageHeader">
        <div className="headerIcon">
          <img src="/assets/icons/education.svg" alt="Education" />
        </div>
        <h1>Research</h1>
      </div>

      <p className="intro">
        {t("intro", {
          defaultValue: "Pull proposal content and review data directly from the MindHive platform. Choose the class, pick your data scope, and export downloadable CSV files formatted for analysis.",
        })}
      </p>

      <div className="filterModeRow">
        <Chip
          shape="square"
          label={t("filterByClass", {
            defaultValue: "Class boards",
          })}
          selected={filterMode === "byClass"}
          onClick={() => setFilterMode("byClass")}
        />
        <Chip
          shape="square"
          label={t("byBoard", {
            defaultValue: "Individual board",
          })}
          selected={filterMode === "byBoard"}
          onClick={() => setFilterMode("byBoard")}
        />
      </div>

      <div className="filtersCard">
        <div className="cardHeader">
          <h2>{t("buildYourExport", {
            defaultValue: "Build Your Export",
          })}</h2>
          <span>Download board and associated review data.</span>
        </div>

        {filterMode === "byClass" ? (
          <div className="fieldGroup">
            <label htmlFor="research-class-code">{t("classCode", {
              defaultValue: "Class Code (see URL when visiting class)",
            })}</label>
            <input
              id="research-class-code"
              type="text"
              placeholder={t("enterClassCode", {
                defaultValue: "Enter the class code",
              })}
              value={classCode}
              onChange={(event) => setClassCode(event.target.value)}
              autoComplete="off"
            />
          </div>
        ) : (
          <div className="fieldGroup">
            <label htmlFor="research-board-id">{t("boardId", {
              defaultValue: "Board ID",
            })}</label>
            <input
              id="research-board-id"
              type="text"
              placeholder={t("enterBoardId", {
                defaultValue: "Enter the board ID",
              })}
              value={boardId}
              onChange={(event) => setBoardId(event.target.value)}
              autoComplete="off"
            />
          </div>
        )}

        <div className="cardHeader">
          <h2>{t("selectDataScope", {
            defaultValue: "(Optional) Select data scope",
          })}</h2>
          <span>
            {filterMode === "byBoard"
              ? t("selectNoStatusFilter", {
                  defaultValue:
                    "Select 'No status filter' if you want no filters",
                })
              : t("selectAllBoards", {
                  defaultValue:
                    "Select 'All boards' if you want no filters",
                })}
          </span>
        </div>

        {filterMode === "byClass" && (
          <div className="fieldGroup">
            <label>
              {t("whichBoardsToInclude", {
                defaultValue: "Which boards should be included?",
              })}
            </label>
            <div className="chipGroup">
              <button
                type="button"
                className={selectionMode === "perStudent" ? "active" : ""}
                onClick={() => setSelectionMode("perStudent")}
              >
                {t("ownership.perStudentLabel", {
                  defaultValue: "Boards owned by class students",
                })}
              </button>
              <button
                type="button"
                className={selectionMode === "perClass" ? "active" : ""}
                onClick={() => setSelectionMode("perClass")}
              >
                {t("ownership.perClassLabel", {
                  defaultValue: "All proposal boards for this class",
                })}
              </button>
            </div>
            <p>
              {selectionMode === "perStudent"
                ? t("ownership.perStudentHelper", {
                    defaultValue:
                      "Only export boards where at least one collaborator is an enrolled student.",
                  })
                : t("ownership.perClassHelper", {
                    defaultValue:
                      "Export every proposal board attached to this class, including pilots/template boards.",
                  })}
            </p>
          </div>
        )}

        <div className="fieldGroup">
          <label>{t("filterByCardStatus", {
            defaultValue: "Filter by card status",
          })}</label>
          <div className="chipGroup">
            {SCOPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={option.value === activeScope ? "active" : ""}
                onClick={() => setActiveScope(option.value)}
              >
                {getScopeLabel(option.value)}
              </button>
            ))}
          </div>
        </div>

        {activeScope !== "ALL" && (
          <div className="fieldGroup">
            <label>{t("workflowStage", {
              defaultValue: "Select which stage to filter by",
            })}</label>
            <div className="chipGroup">
              {STAGE_OPTIONS.map((stage) => (
                <button
                  key={stage.value}
                  type="button"
                  className={activeStage === stage.value ? "active" : ""}
                  onClick={() => setActiveStage(stage.value)}
                  title={stage.helper}
                >
                  {stage.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="cardHeader">
          <h2>{t("data", {
            defaultValue: "Data",
          })}</h2>
        </div>

        <div className="fieldGroup">
          <label>{t("boardTitleColumn", {
            defaultValue: "Include board title? (not recommended re privacy)",
          })}</label>
          <div className="checkboxGroup">
            <label className={includeBoardTitle ? "active" : ""}>
              <input
                type="checkbox"
                checked={includeBoardTitle}
                onChange={(event) =>
                  setIncludeBoardTitle(event.target.checked)
                }
              />
              {t("includeBoardTitle", {
                defaultValue: "Include board title",
              })}
            </label>
          </div>
        </div>

        <div className="fieldGroup">
          <label>{t("downloadPayload", {
            defaultValue: "Download payload",
          })}</label>
          <div className="checkboxGroup">
            <label className={includeContent ? "active" : ""}>
              <input
                type="checkbox"
                checked={includeContent}
                onChange={(event) => setIncludeContent(event.target.checked)}
              />
              {t("boardData", {
                defaultValue: "Board Data",
              })}
            </label>
            <label className={includeReviews ? "active" : ""}>
              <input
                type="checkbox"
                checked={includeReviews}
                onChange={(event) => setIncludeReviews(event.target.checked)}
              />
              {t("reviewData", {
                defaultValue: "Review Data",
              })}
            </label>
          </div>
        </div>

        <div className="fieldGroup">
          <label>Output Structure</label>
          <div className="chipGroup">
            {[
              { value: "long", label: "Long (better for filtering)" },
              { value: "wide", label: "Wide (better for human readability)" },
            ].map((shape) => (
              <button
                key={shape.value}
                type="button"
                className={outputShape === shape.value ? "active" : ""}
                onClick={() => setOutputShape(shape.value)}
              >
                {shape.label}
              </button>
            ))}
          </div>
        </div>

        <div className="fieldGroup">
          <label>{t("outputFormat", {
            defaultValue: "Output Format",
          })}</label>
          <div className="radioGroup">
            <label className={format === "csv" ? "active" : ""}>
              <input
                type="radio"
                name="research-export-format"
                value="csv"
                checked={format === "csv"}
                onChange={(event) => setFormat(event.target.value)}
              />
              {t("csv", {
                defaultValue: "CSV (.csv)",
              })}
            </label>
            <label>
              <input
                type="radio"
                name="research-export-format"
                value="json"
                disabled
              />
              {t("json", {
                defaultValue: "JSON (if needed really)",
              })}
            </label>
          </div>
        </div>

        <div className="actions">
          <button
            type="button"
            className="secondary"
            onClick={resetFilters}
            disabled={isLoading}
          >
            {t("resetFilters", {
              defaultValue: "Reset Filters",
            })}
          </button>
          <button
            type="button"
            className="primary"
            onClick={handleDownload}
            disabled={
              isLoading ||
              (filterMode === "byClass"
                ? !classCode.trim()
                : !boardId.trim()) ||
              (!includeContent && !includeReviews)
            }
          >
            {isLoading ? t("preparingExport", {
              defaultValue: "Preparing export…",
            }) : t("runExport", {
              defaultValue: "Run Export",
            })}
          </button>
        </div>
      </div>

      {feedback.type && (
        <div className={`toast ${feedback.type}`}>{feedback.message}</div>
      )}

      <div className="statusPanel">
        <h3>{t("whatAreTheFilteringPolicies", {
          defaultValue: "What are the filtering policies?",
        })}</h3>
        <ul>
          <li>
            {t("policies.boardSelection", {
              defaultValue:
                "Boards are pulled from Class.studentProposals. By default we prioritise each enrolled student's isMain board; if one is missing, we fall back to a submitted board. You can use the ownership filter above to include all class boards, including pilots/template boards not owned by enrolled students.",
            })}
          </li>
          <li>
            Proposal content exports include plain-text cards, comments, review
            flags, linked resources, and the class collaborators attached to
            each board.
          </li>
          <li>
            Reviews export each response separately, respecting the same stage +
            status filters (Not Started, In Progress, Submitted, Finished).
          </li>
          <li>
            You can choose between long and wide export formats: long format outputs one row per board section card, while wide format flattens each board to a single row with many columns.
          </li>
          <li>
            Selected datasets are bundled into a single ZIP archive for download.
          </li>
        </ul>
      </div>
    </StyledResearch>
  );
}
