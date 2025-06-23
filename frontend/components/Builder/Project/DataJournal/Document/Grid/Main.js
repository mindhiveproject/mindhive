import { useState, useEffect } from "react";
import useTranslation from "next-translate/useTranslation";

import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import VisualizationWidget from "./VisualizationWidget";
import SettingsPanel from "./SettingsPanel";

export default function Grid({
  chapter,
  user,
  projectId,
  studyId,
  pyodide,
  data,
  variables,
  settings,
}) {
  const { t } = useTranslation("builder");
  const [activeWidgetId, setActiveWidgetId] = useState(null);
  const [localLayout, setLocalLayout] = useState([]);
  const [localWidgets, setLocalWidgets] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (chapter) {
      setLocalLayout(chapter?.layout || []);
      setLocalWidgets(chapter?.sections || []);
    }
  }, [chapter]);

  const handleAddWidget = (type) => {
    console.log("handle add widget");
    const newWidgetId = `temp-${Date.now()}`;
    const newWidget = {
      id: newWidgetId,
      type,
      settings:
        type === "notes"
          ? { text: "" } // Initial empty text for notes widget
          : {},
    };
    const newLayoutItem = {
      i: newWidgetId,
      x: (localLayout.length * 2) % 12,
      y: 0,
      w: 4,
      h: 10,
      minW: 2,
      minH: 5,
      maxW: 12,
      maxH: 20,
    };

    console.log("Adding widget - new layout:", [...localLayout, newLayoutItem]);
    setLocalWidgets([...localWidgets, newWidget]);
    setLocalLayout([...localLayout, newLayoutItem]);
    setHasUnsavedChanges(true);
  };

  const handleRemoveWidget = (widgetId) => {
    console.log(`Removing widget: ${widgetId}`);
    setLocalWidgets(localWidgets.filter((w) => w.id !== widgetId));
    setLocalLayout(localLayout.filter((l) => l.i !== widgetId));
    setHasUnsavedChanges(true);
    if (activeWidgetId === widgetId) setActiveWidgetId(null);
  };

  const handleLayoutChange = (newLayout) => {
    console.log("handle layout change");
    setLocalLayout(newLayout);
    setHasUnsavedChanges(true);
  };

  const handleWidgetSelect = (widgetId) => {
    console.log(
      `Selecting widget ${widgetId}, current active: ${activeWidgetId}`
    );
    setActiveWidgetId(widgetId === activeWidgetId ? null : widgetId);
  };

  const handleSettingsChange = (widgetId, newSettings) => {
    setLocalWidgets(
      localWidgets.map((widget) =>
        widget.id === widgetId ? { ...widget, settings: newSettings } : widget
      )
    );
    setHasUnsavedChanges(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => handleAddWidget("component")}
          className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-200 text-sm font-medium"
        >
          {t("dataJournal.addComponent", "Add Component")}
        </button>

        <button
          onClick={() => handleAddWidget("notes")}
          className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-200 text-sm font-medium"
        >
          {t("dataJournal.addNotes", "Add Notes")}
        </button>
      </div>

      <GridLayout
        className="layout"
        layout={localLayout}
        cols={12}
        rowHeight={30}
        width={1200}
        onLayoutChange={handleLayoutChange}
        isDraggable={true}
        isResizable={true}
        compactType="vertical"
        preventCollision={false}
        margin={[16, 16]}
      >
        {localWidgets.map((widget) => {
          const layoutItem = localLayout.find((l) => l.i === widget.id) || {
            i: widget.id,
            x: 0,
            y: 0,
            w: 4,
            h: 10,
            minW: 2,
            minH: 5,
            maxW: 12,
            maxH: 20,
          };
          return (
            <div
              key={widget.id}
              data-grid={layoutItem}
              className="widget"
              // className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <VisualizationWidget
                id={widget.id}
                type={widget.type}
                settings={
                  typeof widget.settings === "string"
                    ? JSON.parse(widget.settings)
                    : widget.settings
                }
                isActive={widget.id === activeWidgetId}
                onSelect={handleWidgetSelect}
                chapter={chapter}
                user={user}
                projectId={projectId}
                studyId={studyId}
                pyodide={pyodide}
                data={data}
                variables={variables}
                section={{ type: "GRAPH" }}
              />
            </div>
          );
        })}
      </GridLayout>

      {activeWidgetId && (
        <SettingsPanel
          widget={localWidgets.find((w) => w.id === activeWidgetId)}
          onSettingsChange={handleSettingsChange}
          onDelete={handleRemoveWidget}
          studies={[]}
        />
      )}
    </div>
  );
}
