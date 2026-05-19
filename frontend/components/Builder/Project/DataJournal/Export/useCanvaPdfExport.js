import { useCallback, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import { saveAs } from "file-saver";
import useTranslation from "next-translate/useTranslation";

import {
  CREATE_MEDIA_ASSET,
  buildMediaAssetCreateData,
} from "../../../../Mutations/MediaAsset";
import { useDataJournal } from "../Context/DataJournalContext";
import { DATA_TOOL_CANVA_CREATED_WITH } from "./constants";
import {
  exportCanvaToPdf,
  getExportReadinessIssues,
} from "./exportCanvaToPdf";

/**
 * @typedef {'idle'|'preparing'|'rendering'|'composing'|'saving'|'done'|'error'} ExportPhase
 */

export default function useCanvaPdfExport() {
  const { t } = useTranslation("builder");
  const {
    workspace,
    projectId,
    journalDatasources,
    sourceDataByDatasourceId,
    figureReadinessByComponentId,
  } = useDataJournal();

  const [phase, setPhase] = useState("idle");
  const [errorMessage, setErrorMessage] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [createMediaAsset] = useMutation(CREATE_MEDIA_ASSET);
  const exportingRef = useRef(false);

  const progressLabel = useCallback(() => {
    switch (phase) {
      case "preparing":
        return t("dataJournal.export.progress.preparing", {}, {
          default: "Preparing layout…",
        });
      case "rendering":
        return t("dataJournal.export.progress.rendering", {}, {
          default: "Rendering components…",
        });
      case "composing":
        return t("dataJournal.export.progress.composing", {}, {
          default: "Composing PDF…",
        });
      case "saving":
        return t("dataJournal.export.progress.saving", {}, {
          default: "Saving to media library…",
        });
      case "done":
        return t("dataJournal.export.progress.done", {}, {
          default: "Export complete",
        });
      case "error":
        return t("dataJournal.export.progress.error", {}, {
          default: "Export failed",
        });
      default:
        return "";
    }
  }, [phase, t]);

  const exportCanva = useCallback(
    async ({ canvasElement, gridWidth, saveToMediaLibrary = true }) => {
      if (exportingRef.current) return;
      if (!canvasElement || !workspace?.id) return;

      const layout = workspace.layout || [];
      const components = workspace.vizSections || [];

      if (!components.length) {
        setErrorMessage(
          t("dataJournal.export.emptyCanvas", {}, {
            default: "Add at least one component to the canvas before exporting.",
          }),
        );
        setPhase("error");
        return;
      }

      const notReady = getExportReadinessIssues(
        components,
        figureReadinessByComponentId,
      );
      if (notReady.length > 0) {
        setErrorMessage(
          t("dataJournal.export.figuresNotReady", {}, {
            default:
              "Some charts are still loading. Wait for all visualizations to finish rendering, then try again.",
          }),
        );
        setPhase("error");
        return;
      }

      exportingRef.current = true;
      setErrorMessage(null);
      setWarnings([]);
      setPhase("preparing");

      try {
        const result = await exportCanvaToPdf({
          canvasElement,
          layout,
          components,
          gridWidth,
          journalDatasources,
          sourceDataByDatasourceId,
          onProgress: (nextPhase) => setPhase(nextPhase),
        });

        setWarnings(result.warnings || []);

        saveAs(result.pdfFile, result.pdfFile.name);

        const shouldSaveToMedia =
          Boolean(saveToMediaLibrary) && Boolean(projectId || workspace?.id);

        if (shouldSaveToMedia) {
          setPhase("saving");
          const workspaceTitle =
            typeof workspace?.title === "string" && workspace.title.trim()
              ? workspace.title.trim()
              : "workspace";
          const fileBase = `${workspaceTitle}-canva-export`.replace(
            /[^\w.\- ]+/g,
            "_",
          );

          const mediaLibrarySource = projectId
            ? {
                sourceType: "proposalBoard",
                sourceId: projectId,
                createdWith: DATA_TOOL_CANVA_CREATED_WITH,
              }
            : {
                sourceType: "vizSection",
                sourceId: workspace.id,
                createdWith: DATA_TOOL_CANVA_CREATED_WITH,
              };

          const createPayload = buildMediaAssetCreateData({
            scopeId: projectId || workspace.id,
            fileName: fileBase,
            title: `${workspaceTitle} PDF`,
            mediaLibrarySource,
            mediaCreatedWithOverride: DATA_TOOL_CANVA_CREATED_WITH,
          });

          createPayload.settings = {
            createdWith: DATA_TOOL_CANVA_CREATED_WITH,
            exportPageCount: result.pageCount,
            exportWarnings: result.warnings,
          };
          createPayload.description = t(
            "dataJournal.export.mediaDescription",
            { workspace: workspaceTitle },
            {
              default:
                "Data Journal canva PDF export for {{workspace}}. Managed as a data-tool artifact (not for text insertion).",
            },
          );

          if (result.previewFile) {
            createPayload.image = { upload: result.previewFile };
          }
          createPayload.exportDocument = { upload: result.pdfFile };

          await createMediaAsset({
            variables: { data: createPayload },
          });
        }

        setPhase("done");
      } catch (err) {
        console.error("useCanvaPdfExport:", err);
        if (err?.message === "EXPORT_EMPTY_CANVAS") {
          setErrorMessage(
            t("dataJournal.export.emptyCanvas", {}, {
              default:
                "Add at least one component to the canvas before exporting.",
            }),
          );
        } else {
          setErrorMessage(
            t("dataJournal.export.failed", {}, {
              default: "Could not export the canva. Please try again.",
            }),
          );
        }
        setPhase("error");
      } finally {
        exportingRef.current = false;
      }
    },
    [
      workspace,
      projectId,
      journalDatasources,
      sourceDataByDatasourceId,
      figureReadinessByComponentId,
      createMediaAsset,
      t,
    ],
  );

  const resetExportState = useCallback(() => {
    setPhase("idle");
    setErrorMessage(null);
    setWarnings([]);
  }, []);

  const setExportError = useCallback((message) => {
    setErrorMessage(
      typeof message === "string" && message.trim() ? message.trim() : null,
    );
    setPhase("error");
  }, []);

  const isExporting =
    phase === "preparing" ||
    phase === "rendering" ||
    phase === "composing" ||
    phase === "saving";

  return {
    exportCanva,
    phase,
    progressLabel,
    errorMessage,
    warnings,
    isExporting,
    resetExportState,
    setExportError,
  };
}
