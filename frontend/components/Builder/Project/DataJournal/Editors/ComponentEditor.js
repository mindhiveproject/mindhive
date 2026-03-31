// components/DataJournal/Editors/ComponentEditor.js
import { useCallback, useEffect, useMemo, useState } from "react";
import useTranslation from "next-translate/useTranslation";
import { useDataJournal } from "../Context/DataJournalContext";

import MediaLibraryModal from "../../../../TipTap/MediaLibraryModal";
import EditorHeader from "./Header";

import GraphEditor from "../Widgets/types/Graph/Editor/GraphEditor";
import StatisticalTestEditor from "../Widgets/types/StatisticalTests/Editor/StatisticalTestEditor";
import StatisticsEditor from "../Widgets/types/Statistics/Editor/StatisticsEditor";
import CodeEditor from "../Widgets/types/Code/Editor/CodeEditor";
import HypVisEditor from "../Widgets/types/HypVis/Editor/HypVisEditor";
import { figPngFileFromPyodide } from "../Widgets/types/HypVis/Editor/Axes/figHtmlFromPyodide";
import { plotlyPngFileFromFigureSection } from "../Widgets/types/Graph/plotlyPngFileFromFigure";

import { StyledRightPanel } from "../styles/StyledDataJournal"; // Adjust path if needed

/** Stored on MediaAsset.settings.createdWith for HypVis figure exports */
function hypVisMediaCreatedWithKey(contentType) {
  if (contentType === "abDesign") return "hypvis_abdesign";
  if (contentType === "corStudy") return "hypvis_correlational";
  return "hypvis";
}

/** Stored on MediaAsset.settings.createdWith for Graph (Plotly) exports */
function graphMediaCreatedWithKey(graphContentType) {
  if (graphContentType === "scatterPlot") return "graph_scatter";
  if (graphContentType === "barGraph") return "graph_bar";
  if (graphContentType === "histogram") return "graph_histogram";
  return "graph";
}

export default function ComponentEditor({
  user,
  studyId,
  onChange,
  onSave,
  onDelete,
}) {
  const { t } = useTranslation("builder");
  const {
    activeComponent,
    setActiveComponent,
    pyodide,
    projectId,
    figureReadinessByComponentId,
  } = useDataJournal();

  const [saveFigureModalOpen, setSaveFigureModalOpen] = useState(false);
  const [saveFigurePrefillFile, setSaveFigurePrefillFile] = useState(null);
  useEffect(() => {
    setSaveFigureModalOpen(false);
    setSaveFigurePrefillFile(null);
  }, [activeComponent?.id]);

  const handleClosePanel = useCallback(
    () => setActiveComponent(null),
    [setActiveComponent],
  );

  const closeSaveFigureModal = useCallback(() => {
    setSaveFigureModalOpen(false);
    setSaveFigurePrefillFile(null);
  }, []);

  const handleSaveFigurePrefillConsumed = useCallback(() => {
    setSaveFigurePrefillFile(null);
  }, []);

  const handleSaveFigureToMedia = useCallback(async () => {
    const comp = activeComponent;
    if (!comp) return;

    if (comp.type === "HYPVIS") {
      if (!pyodide) {
        window.alert(
          t(
            "dataJournal.hypVis.axes.clipboard.copyGraphNoPyodide",
            "The Python runtime is not ready yet. Please wait for the journal to finish loading.",
          ),
        );
        return;
      }
      const file = figPngFileFromPyodide(pyodide, {
        fileName: comp.title || "hypvis-figure",
      });
      if (!file) {
        window.alert(
          t(
            "dataJournal.hypVis.axes.clipboard.copyGraphNoFigHtml",
            "No graph is available yet. Fill in your variables and wait for the visualization to appear in the journal, then try again.",
          ),
        );
        return;
      }
      setSaveFigurePrefillFile(file);
      setSaveFigureModalOpen(true);
      return;
    }

    if (comp.type === "GRAPH") {
      const file = await plotlyPngFileFromFigureSection(comp.id, {
        fileName: comp.title || "graph-figure",
      });
      if (!file) {
        window.alert(
          t(
            "dataJournal.componentEditor.saveGraphNoPlot",
            "No graph is available to save yet. Configure your chart and wait for it to appear in the journal, then try again.",
          ),
        );
        return;
      }
      setSaveFigurePrefillFile(file);
      setSaveFigureModalOpen(true);
    }
  }, [activeComponent, pyodide, t]);

  if (!activeComponent) return null;

  const { id, type, content } = activeComponent;

  const saveFigureCreatedWith =
    type === "GRAPH"
      ? graphMediaCreatedWithKey(content?.type)
      : hypVisMediaCreatedWithKey(content?.type);

  const mediaLibrarySourceForSave = projectId
    ? {
        sourceType: "proposalBoard",
        sourceId: projectId,
        createdWith: saveFigureCreatedWith,
      }
    : {
        sourceType: "vizSection",
        sourceId: id,
        createdWith: saveFigureCreatedWith,
      };

  const showSaveFigureButton = type === "HYPVIS" || type === "GRAPH";
  const showSaveFigureModal = type === "HYPVIS" || type === "GRAPH";
  const canSaveFigureToMedia = useMemo(() => {
    if (!showSaveFigureButton) return false;
    const componentId = typeof id === "string" ? id.trim() : "";
    if (!componentId) return false;
    return figureReadinessByComponentId?.[componentId] === true;
  }, [showSaveFigureButton, id, figureReadinessByComponentId]);

  // Render editor based on component type
  const renderEditor = () => {
    switch (type) {
      case "PARAGRAPH":
        // Placeholder for Paragraph editor (e.g., simple textarea)
        return (
          <div>
            <h3>
              {t("dataJournal.componentEditor.editParagraph", "Edit Paragraph")}
            </h3>
            <textarea
              value={content?.text || ""}
              onChange={(e) =>
                onChange({
                  componentId: id,
                  newContent: { text: e.target.value },
                })
              }
              style={{ width: "100%", height: "200px" }}
            />
          </div>
        );
      case "TABLE":
        // Placeholder for Table editor (e.g., configure columns/filters)
        return (
          <div>
            {/* <h3>Edit Table</h3> */}
            {/* Add table-specific config here */}
          </div>
        );
      case "GRAPH":
        return (
          <GraphEditor content={content} onChange={onChange} sectionId={id} />
        );
      case "STATTEST":
        return (
          <StatisticalTestEditor
            content={content}
            onChange={onChange}
            sectionId={id}
          />
        );
      case "STATISTICS":
        return (
          <StatisticsEditor
            content={content}
            onChange={onChange}
            sectionId={id}
          />
        );
      case "CODE":
        return (
          <CodeEditor content={content} onChange={onChange} sectionId={id} />
        );
      case "HYPVIS":
        return (
          <HypVisEditor
            user={user}
            studyId={studyId}
            content={content}
            onChange={onChange}
            sectionId={id}
          />
        );
      default:
        return (
          <div>
            {t(
              "dataJournal.componentEditor.unsupportedType",
              { type },
              "Unsupported component type: {{type}}",
            )}
          </div>
        );
    }
  };

  return (
    <StyledRightPanel>
      <EditorHeader
        user={user}
        studyId={studyId}
        onClose={handleClosePanel}
        onChange={onChange}
        onSave={onSave}
        onDelete={onDelete}
        activeComponent={activeComponent}
        showSaveFigureToMedia={showSaveFigureButton}
        disableSaveFigureToMedia={!canSaveFigureToMedia}
        onSaveFigureToMedia={handleSaveFigureToMedia}
      />
      {renderEditor()}
      {showSaveFigureModal ? (
        <MediaLibraryModal
          open={saveFigureModalOpen}
          onClose={closeSaveFigureModal}
          mediaScopeId={projectId || null}
          mediaLibrarySource={mediaLibrarySourceForSave}
          usedInVizSectionIds={[id]}
          prefillImageFile={saveFigurePrefillFile}
          onPrefillConsumed={handleSaveFigurePrefillConsumed}
          onInsertMedia={() => {}}
        />
      ) : null}
    </StyledRightPanel>
  );
}
