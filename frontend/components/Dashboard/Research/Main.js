import { useMemo, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import StyledResearch from "./StyledResearch";

const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_RESEARCH_EXPORT_ENDPOINT ||
  // "https://backend.mindhive.science/api/graphql/api/graphql";
  "http://localhost:4444/api/graphql";

const EXPORT_QUERY = `
  query ResearchExport($id: ID!) {
    class(where: { id: $id }) {
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
  if (value === null || value === undefined) return "\"\"";
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

const convertToCSV = (data) => {
  if (!data || data.length === 0) return "";
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((row) =>
    Object.values(row)
      .map(escapeCSV)
      .join(",")
  );
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

const selectBoardsForClass = (boards = [], students = []) => {
  const studentMap = new Map();
  students
    .filter((student) => student?.id)
    .forEach((student) => studentMap.set(student.id, student));

  const selectedBoards = [];
  const boardIndexMap = new Map();
  const matchedStudentIds = new Set();

  const ensureBoardEntry = (board, matchedIds, selectionReason) => {
    const collaboratorLookup = new Map();
    (board.collaborators || [])
      .filter((collab) => collab?.id)
      .forEach((collab) => collaboratorLookup.set(collab.id, collab));

    if (boardIndexMap.has(board.id)) {
      const index = boardIndexMap.get(board.id);
      const existing = selectedBoards[index];
      const existingIds = new Set(
        (existing.classStudentCollaboratorsIds || []).concat()
      );
      const newIds = matchedIds.filter((id) => !existingIds.has(id));
      if (newIds.length > 0) {
        existing.classStudentCollaboratorsIds = [
          ...existing.classStudentCollaboratorsIds,
          ...newIds,
        ];
        existing.linkedClassStudents = [
          ...(existing.linkedClassStudents || []),
          ...newIds,
        ];
        selectedBoards[index] = existing;
      }
      if (selectionReason === "isMain" && existing.selectionReason !== "isMain") {
        existing.selectionReason = "isMain";
      }
      return;
    }

    selectedBoards.push({
      ...board,
      selectionReason,
      classStudentCollaboratorsIds: matchedIds,
      linkedClassStudents: matchedIds,
    });
    boardIndexMap.set(board.id, selectedBoards.length - 1);
  };

  students.forEach((student) => {
    const studentId = student?.id;
    if (!studentId) return;

    const candidateBoards = boards.filter((board) =>
      board.collaborators?.some((collaborator) => collaborator?.id === studentId)
    );

    if (candidateBoards.length === 0) {
      return;
    }

    let chosenBoard = candidateBoards.find((board) => board.isMain);
    let selectionReason = "isMain";

    if (!chosenBoard) {
      chosenBoard = candidateBoards.find(
        (board) => board.submitProposalStatus === "SUBMITTED"
      );
      selectionReason = "submitted";
    }

    if (!chosenBoard) {
      return;
    }

    const matchedIds = (chosenBoard.collaborators || [])
      .map((collaborator) => collaborator?.id)
      .filter((id) => id && studentMap.has(id));

    if (matchedIds.length === 0) {
      return;
    }

    matchedIds.forEach((id) => matchedStudentIds.add(id));
    ensureBoardEntry(chosenBoard, matchedIds, selectionReason);
  });

  const totalStudentCount = studentMap.size;
  const unmatchedStudentIds = Array.from(studentMap.keys()).filter(
    (id) => !matchedStudentIds.has(id)
  );

  return {
    boards: selectedBoards,
    matchedStudentCount: matchedStudentIds.size,
    totalStudentCount,
    unmatchedStudentIds,
  };
};

export default function ResearchMain({ query, user }) {
  const [classId, setClassId] = useState("");
  const [includeContent, setIncludeContent] = useState(true);
  const [includeReviews, setIncludeReviews] = useState(true);
  const [activeStage, setActiveStage] = useState(STAGE_OPTIONS[0].value);
  const [activeScope, setActiveScope] = useState(SCOPE_OPTIONS[0].value);
  const [outputShape, setOutputShape] = useState("long");
  const [format, setFormat] = useState("csv");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, message: "" });

  const canAccess = useMemo(() => hasResearchAccess(user), [user]);

  const resetFilters = () => {
    setClassId("");
    setIncludeContent(true);
    setIncludeReviews(true);
    setActiveStage(STAGE_OPTIONS[0].value);
    setActiveScope(SCOPE_OPTIONS[0].value);
    setOutputShape("long");
    setFormat("csv");
    setFeedback({ type: null, message: "" });
  };

  const handleDownload = async () => {
    if (!classId.trim()) {
      setFeedback({
        type: "error",
        message: "Please provide a Class ID before running the export.",
      });
      return;
    }

    if (!includeContent && !includeReviews) {
      setFeedback({
        type: "error",
        message: "Select at least one dataset (proposal content or reviews).",
      });
      return;
    }

    if (format !== "csv") {
      setFeedback({
        type: "error",
        message: "Only CSV exports are available at this time.",
      });
      return;
    }

    setIsLoading(true);
    setFeedback({ type: null, message: "" });

    try {
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
            id: classId.trim(),
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
          "No class found for that ID. Double-check the identifier and try again."
        );
      }

      const { studentProposals = [], students = [], title: classTitle } =
        classPayload;

      if (!Array.isArray(studentProposals) || studentProposals.length === 0) {
        throw new Error(
          "This class does not currently have any linked student proposal boards."
        );
      }

      const {
        boards: selectedBoards,
        matchedStudentCount,
        totalStudentCount,
        unmatchedStudentIds,
      } = selectBoardsForClass(studentProposals, students);

      if (selectedBoards.length === 0) {
        throw new Error(
          "None of the students in this class have an isMain or submitted proposal board."
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
      console.log("Stage:", activeStage, "Scope:", activeScope);
      console.log("Boards selected:", selectedBoards.length);
      console.log("Boards after scope filter:", scopedBoards.length);

      if (scopedBoards.length === 0) {
        const scopeLabel =
          SCOPE_OPTIONS.find((option) => option.value === activeScope)?.label ||
          activeScope;
        console.warn("No boards matched scope", {
          activeStage,
          activeScope,
          selectedBoards,
        });
        console.groupEnd();
        throw new Error(
          `No boards matched the selected ${stageMeta.label} scope (${scopeLabel}).`
        );
      }

      const exportSummaries = [];
      const pendingDownloads = [];

      if (includeContent) {
        const flattenedContent = flattenBoards(
          scopedBoards,
          {
            title: classTitle,
          },
          outputShape
        );
        if (flattenedContent.length > 0) {
          const csv = convertToCSV(flattenedContent);
          console.log("Board rows prepared:", flattenedContent.length);
          pendingDownloads.push({
            csv,
            filename: `proposal_boards_${classId.trim()}_${activeScope}.csv`,
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
        const flattenedReviewData = flattenReviews(
          scopedBoards,
          {
            title: classTitle,
          },
          outputShape
        );
        if (flattenedReviewData.length > 0) {
          const csv = convertToCSV(flattenedReviewData);
          console.log("Review rows prepared:", flattenedReviewData.length);
          pendingDownloads.push({
            csv,
            filename: `proposal_reviews_${classId.trim()}_${activeScope}.csv`,
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
        const zipFilename = `proposal_export_${classId
          .trim()
          .replace(/\s+/g, "-")}_${activeStage}_${activeScope}.zip`;
        const zipBlob = await zip.generateAsync({ type: "blob" });
        saveAs(zipBlob, zipFilename);
        exportSummaries.push(`Generated archive: ${zipFilename}`);
      } else {
        exportSummaries.push("No files were generated for download.");
      }

      const unmatchedCount = unmatchedStudentIds.length;
      const scopeLabel =
        SCOPE_OPTIONS.find((option) => option.value === activeScope)?.label ||
        activeScope;
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
            <img src="/assets/icons/visualize/database.svg" alt="Database" />
          </div>
          <h1>Research</h1>
        </div>
        <div className="toast error">
          You need research-level permissions to access the export tools.
        </div>
      </StyledResearch>
    );
  }

  return (
    <StyledResearch>
      <div className="pageHeader">
        <div className="headerIcon">
          <img src="/assets/icons/visualize/database.svg" alt="Database" />
        </div>
        <h1>Research</h1>
      </div>

      <p className="intro">
        Pull proposal content and review data directly from the MindHive
        platform. Choose the class, pick your data scope, and export downloadable
        CSV files formatted for analysis.
      </p>

      <div className="filtersCard">
        <div className="cardHeader">
          <h2>Build Your Export</h2>
          <span>Configure filters to tailor the dataset before download.</span>
        </div>

        <div className="fieldGroup">
          <label htmlFor="research-class-id">Class Identifier</label>
          <input
            id="research-class-id"
            type="text"
            placeholder="Enter the class ID"
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="fieldGroup">
          <label>Workflow Stage</label>
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

        <div className="fieldGroup">
          <label>Data Scope</label>
          <div className="chipGroup">
            {SCOPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={option.value === activeScope ? "active" : ""}
                onClick={() => setActiveScope(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="fieldGroup">
          <label>Datasets</label>
          <div className="checkboxGroup">
            <label className={includeContent ? "active" : ""}>
              <input
                type="checkbox"
                checked={includeContent}
                onChange={(event) => setIncludeContent(event.target.checked)}
              />
              Boards
            </label>
            <label className={includeReviews ? "active" : ""}>
              <input
                type="checkbox"
                checked={includeReviews}
                onChange={(event) => setIncludeReviews(event.target.checked)}
              />
              Reviews
            </label>
          </div>
        </div>

        <div className="fieldGroup">
          <label>Output Structure</label>
          <div className="chipGroup">
            {[
              { value: "long", label: "Long (tidy)" },
              { value: "wide", label: "Wide (pivoted)" },
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
          <label>Output Format</label>
          <div className="radioGroup">
            <label className={format === "csv" ? "active" : ""}>
              <input
                type="radio"
                name="research-export-format"
                value="csv"
                checked={format === "csv"}
                onChange={(event) => setFormat(event.target.value)}
              />
              CSV (.csv)
            </label>
            <label>
              <input
                type="radio"
                name="research-export-format"
                value="json"
                disabled
              />
              JSON (if needed really)
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
            Reset Filters
          </button>
          <button
            type="button"
            className="primary"
            onClick={handleDownload}
            disabled={
              isLoading ||
              !classId.trim() ||
              (!includeContent && !includeReviews)
            }
          >
            {isLoading ? "Preparing export…" : "Run Export"}
          </button>
        </div>
      </div>

      {feedback.type && (
        <div className={`toast ${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      <div className="statusPanel">
        <h3>What are the filtering policies?</h3>
        <ul>
          <li>
            Boards are pulled from <code>Class.studentProposals</code>. For each
            enrolled student we prioritise their board flagged as <code>isMain</code>;
            if one is missing, we fall back to the board they have submitted
            (<code>submitProposalStatus === SUBMITTED</code>).
          </li>
          <li>
            Proposal content exports include plain-text cards, comments, review
            flags, linked resources, and the class collaborators attached to each
            board.
          </li>
          <li>
            Reviews export each response separately, respecting the same stage
            + status filters (Not Started, In Progress, Submitted, Finished).
          </li>
          <li>
            Selected datasets are bundled into a single ZIP archive for download.
          </li>
        </ul>
      </div>
    </StyledResearch>
  );
}
