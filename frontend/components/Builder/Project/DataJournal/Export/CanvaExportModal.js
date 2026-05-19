import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import useTranslation from "next-translate/useTranslation";

import { useDataJournal } from "../Context/DataJournalContext";
import {
  StyledModalBody,
  StyledModalButton,
  StyledModalContent,
  StyledModalFooter,
  StyledModalHeader,
  StyledModalOverlay,
} from "../styles/StyledDataSourceModal";
import useCanvaPdfExport from "./useCanvaPdfExport";

const bodyTextStyle = {
  margin: 0,
  fontFamily: "Inter, sans-serif",
  fontSize: 14,
  lineHeight: 1.5,
  color: "#333",
};

const checkboxRowStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  marginTop: 16,
  fontFamily: "Inter, sans-serif",
  fontSize: 14,
  lineHeight: 1.45,
  color: "#333",
  cursor: "pointer",
};

export default function CanvaExportModal({ open, onOpenChange, workspace }) {
  const { t } = useTranslation("builder");
  const { t: tCommon } = useTranslation("common");
  const { getCanvaExportCanvas, projectId } = useDataJournal();
  const [saveToMediaLibrary, setSaveToMediaLibrary] = useState(true);

  const {
    exportCanva,
    isExporting,
    progressLabel,
    errorMessage,
    warnings,
    phase,
    resetExportState,
    setExportError,
  } = useCanvaPdfExport();

  const workspaceTitle =
    typeof workspace?.title === "string" && workspace.title.trim()
      ? workspace.title.trim()
      : t("dataJournal.sideNav.defaultWorkspaceTitle", {}, {
          default: "Unnamed workspace",
        });

  useEffect(() => {
    if (open) {
      setSaveToMediaLibrary(Boolean(projectId || workspace?.id));
      resetExportState();
    }
  }, [open, workspace?.id, projectId, resetExportState]);

  const handleClose = () => {
    if (!isExporting) onOpenChange(false);
  };

  const handleConfirmExport = async () => {
    const canvasInfo = getCanvaExportCanvas?.();
    if (!canvasInfo?.canvasElement) {
      setExportError(
        t("dataJournal.export.modal.canvasUnavailable", {}, {
          default:
            "The canvas is not available. Open this workspace on the journal canvas and try again.",
        }),
      );
      return;
    }
    await exportCanva({
      canvasElement: canvasInfo.canvasElement,
      gridWidth: canvasInfo.gridWidth,
      saveToMediaLibrary,
    });
  };

  const hasWarnings = Array.isArray(warnings) && warnings.length > 0;
  const showResult = phase === "done" || phase === "error";
  const canSaveToLibrary = Boolean(projectId || workspace?.id);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <StyledModalOverlay
      style={{ zIndex: 20050 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExporting) handleClose();
      }}
    >
      <StyledModalContent
        style={{ maxWidth: 480, width: "90%" }}
        onClick={(e) => e.stopPropagation()}
        onFocus={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="canva-export-modal-title"
      >
        <StyledModalHeader>
          <h2 id="canva-export-modal-title" style={{ margin: 0 }}>
            {t("dataJournal.export.modal.title", {}, {
              default: "Export workspace to PDF",
            })}
          </h2>
        </StyledModalHeader>

        <StyledModalBody>
          {!showResult ? (
            <>
              <p style={bodyTextStyle}>
                {t(
                  "dataJournal.export.modal.confirmWorkspace",
                  { workspace: workspaceTitle },
                  {
                    default:
                      "Export the current layout of “{{workspace}}” as a PDF. Component positions and sizes on the canvas will be preserved.",
                  },
                )}
              </p>
              {canSaveToLibrary ? (
                <label style={checkboxRowStyle} htmlFor="canva-export-save-media">
                  <input
                    id="canva-export-save-media"
                    type="checkbox"
                    checked={saveToMediaLibrary}
                    disabled={isExporting}
                    onChange={(e) => setSaveToMediaLibrary(e.target.checked)}
                    style={{ marginTop: 3, flexShrink: 0 }}
                  />
                  <span>
                    {t("dataJournal.export.modal.saveToMediaLibrary", {}, {
                      default:
                        "Also save a copy in my media library (data-tool export, not for text insertion)",
                    })}
                  </span>
                </label>
              ) : null}
              {isExporting ? (
                <p
                  style={{ ...bodyTextStyle, marginTop: 16, color: "#336F8A" }}
                  role="status"
                  aria-live="polite"
                >
                  {progressLabel()}
                </p>
              ) : null}
            </>
          ) : (
            <>
              {phase === "done" ? (
                <p style={{ ...bodyTextStyle, color: "#2e7d32" }} role="status">
                  {saveToMediaLibrary && canSaveToLibrary
                    ? t("dataJournal.export.modal.successWithMedia", {}, {
                        default:
                          "Your PDF has been downloaded and a copy was saved to your media library.",
                      })
                    : t("dataJournal.export.modal.success", {}, {
                        default: "Your PDF has been downloaded.",
                      })}
                </p>
              ) : null}
              {phase === "error" && errorMessage ? (
                <p style={{ ...bodyTextStyle, color: "#c62828" }} role="alert">
                  {errorMessage}
                </p>
              ) : null}
              {phase === "done" && hasWarnings ? (
                <p
                  style={{ ...bodyTextStyle, marginTop: 12, color: "#5D5763" }}
                  role="status"
                >
                  {t("dataJournal.export.fallbackWarning", {}, {
                    default:
                      "Some components used a raster fallback and may differ slightly from the live canvas.",
                  })}
                </p>
              ) : null}
            </>
          )}
        </StyledModalBody>

        <StyledModalFooter>
          {!showResult ? (
            <>
              <StyledModalButton
                type="button"
                className="cancel"
                disabled={isExporting}
                onClick={handleClose}
              >
                {tCommon("cancel", {}, { default: "Cancel" })}
              </StyledModalButton>
              <StyledModalButton
                type="button"
                disabled={isExporting}
                style={{
                  marginLeft: 8,
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: 6,
                  cursor: isExporting ? "not-allowed" : "pointer",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  background: "#336F8A",
                  color: "#fff",
                }}
                onClick={() => void handleConfirmExport()}
              >
                {isExporting
                  ? progressLabel()
                  : t("dataJournal.export.modal.confirmButton", {}, {
                      default: "Export PDF",
                    })}
              </StyledModalButton>
            </>
          ) : (
            <StyledModalButton
              type="button"
              style={{
                padding: "8px 16px",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                background: "#336F8A",
                color: "#fff",
              }}
              onClick={handleClose}
            >
              {tCommon("close", {}, { default: "Close" })}
            </StyledModalButton>
          )}
        </StyledModalFooter>
      </StyledModalContent>
    </StyledModalOverlay>,
    document.body,
  );
}
