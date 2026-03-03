import { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import useTranslation from "next-translate/useTranslation";

import Chip from "../../DesignSystem/Chip";
import InfoTooltip from "../../Builder/Project/ProjectBoard/Board/PDF/Preview/InfoTooltip";
import {
  GRAPHQL_ENDPOINT,
  BOARD_EXPORT_QUERY,
  POLICY_TOOLTIP_STYLE,
  STAGE_OPTIONS,
  SCOPE_OPTIONS,
  scopeFilterMap,
  flattenBoards,
  flattenReviews,
  maybeStripBoardTitle,
  convertToCSV,
} from "./exportUtils";

export default function BoardExport() {
  const [boardId, setBoardId] = useState("");
  const [includeContent, setIncludeContent] = useState(true);
  const [includeReviews, setIncludeReviews] = useState(true);
  const [includeBoardTitle, setIncludeBoardTitle] = useState(false);
  const [activeStage, setActiveStage] = useState(STAGE_OPTIONS[0].value);
  const [activeScope, setActiveScope] = useState(SCOPE_OPTIONS[0].value);
  const [outputShape, setOutputShape] = useState("long");
  const [format, setFormat] = useState("csv");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, message: "" });
  const { t } = useTranslation("research");

  const getScopeLabel = (value) => {
    if (value === "ALL") {
      return t("noStatusFilter", {
        defaultValue: "No status filter",
      });
    }
    return (
      SCOPE_OPTIONS.find((option) => option.value === value)?.label || value
    );
  };

  const resetFilters = () => {
    setBoardId("");
    setIncludeContent(true);
    setIncludeReviews(true);
    setIncludeBoardTitle(false);
    setActiveStage(STAGE_OPTIONS[0].value);
    setActiveScope(SCOPE_OPTIONS[0].value);
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

    if (!boardId.trim()) {
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

  const policyContent = (
    <>
      <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 600, color: "#2c4f5f" }}>
        {t("filteringPolicies", {
          defaultValue: "Pulling data policies",
        })}
      </h3>
      <ul style={{ margin: 0, paddingLeft: "18px" }}>
        <li>
          {t("policies.boardSelection", {
            defaultValue:
              "Boards are pulled from Class.studentProposals. By default we prioritise each enrolled student's isMain board; if one is missing, we fall back to a submitted board. You can use the ownership filter above to include all class boards, including pilots/template boards not owned by enrolled students.",
          })}
        </li>
        <li>
          {t("policies.exportIncludes", {
            defaultValue:
              "Proposal content exports include plain-text cards, comments, review flags, linked resources, and the class collaborators attached to each board.",
          })}
        </li>
        <li>
          {t("policies.exportReviews", {
            defaultValue:
              "Reviews export each response separately, respecting the same stage + status filters (Not Started, In Progress, Submitted, Finished).",
          })}
        </li>
        <li>
          {t("policies.exportFormatChoice", {
            defaultValue:
              "You can choose between long and wide export formats: long format outputs one row per board section card, while wide format flattens each board to a single row with many columns.",
          })}
        </li>
        <li>
          {t("policies.exportZip", {
            defaultValue:
              "Selected datasets are bundled into a single ZIP archive for download.",
          })}
        </li>
      </ul>
    </>
  );

  return (
    <>
      <div className="filtersCard">
        <div className="cardHeaderRow">
          <div className="cardHeader">
            <h2>
              {t("buildYourExport", {
                defaultValue: "Build Your Export",
              })}
            </h2>
            <span>Download board and associated review data.</span>
          </div>
          <InfoTooltip
            content={policyContent}
            position="bottomRight"
            tooltipStyle={POLICY_TOOLTIP_STYLE}
          >
            <Chip
              label={t("filteringPolicies", {
                defaultValue: "Data pulling policies",
              })}
              shape="square"
            />
          </InfoTooltip>
        </div>

        <div className="fieldGroup">
          <label htmlFor="research-board-id">
            {t("boardId", {
              defaultValue: "Board ID",
            })}
          </label>
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

        <div className="cardHeader">
          <h2>
            {t("selectDataScope", {
              defaultValue: "(Optional) Select data scope",
            })}
          </h2>
          <span>
            {t("selectNoStatusFilter", {
              defaultValue:
                "Select 'No status filter' if you want no filters",
            })}
          </span>
        </div>

        <div className="fieldGroup">
          <label>
            {t("filterByCardStatus", {
              defaultValue: "Filter by card status",
            })}
          </label>
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
            <label>
              {t("workflowStage", {
                defaultValue: "Select which stage to filter by",
              })}
            </label>
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
          <h2>
            {t("data", {
              defaultValue: "Data",
            })}
          </h2>
        </div>

        <div className="fieldGroup">
          <label>
            {t("boardTitleColumn", {
              defaultValue:
                "Include board title? (not recommended re privacy)",
            })}
          </label>
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
          <label>
            {t("downloadPayload", {
              defaultValue: "Download payload",
            })}
          </label>
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
          <label>
            {t("outputFormat", {
              defaultValue: "Output Format",
            })}
          </label>
          <div className="radioGroup">
            <label className={format === "csv" ? "active" : ""}>
              <input
                type="radio"
                name="research-export-format-board"
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
                name="research-export-format-board"
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
              !boardId.trim() ||
              (!includeContent && !includeReviews)
            }
          >
            {isLoading
              ? t("preparingExport", {
                  defaultValue: "Preparing export…",
                })
              : t("runExport", {
                  defaultValue: "Run Export",
                })}
          </button>
        </div>
      </div>

      {feedback.type && (
        <div className={`toast ${feedback.type}`}>{feedback.message}</div>
      )}
    </>
  );
}

