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

const POLICY_TOOLTIP_STYLE = {
  width: "600px",
  maxWidth: "90vw",
  padding: "16px 20px",
  border: "1px dashed #c7d2d9",
  borderRadius: "16px",
  // background: "rgba(51, 111, 138, 0.05)",
  color: "#3a4b56",
  fontSize: "14px",
  lineHeight: "1.5",
};

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

export {
  GRAPHQL_ENDPOINT,
  EXPORT_QUERY,
  BOARD_EXPORT_QUERY,
  STAGE_OPTIONS,
  SCOPE_OPTIONS,
  POLICY_TOOLTIP_STYLE,
  scopeFilterMap,
  hasResearchAccess,
  flattenBoards,
  flattenReviews,
  maybeStripBoardTitle,
  convertToCSV,
  selectBoardsForClass,
};

