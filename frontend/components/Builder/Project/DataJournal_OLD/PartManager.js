import { useState, useEffect } from "react";

import ProcessManager from "./ProcessManager";

export default function PartManager({
  user,
  projectId,
  studyId,
  pyodide,
  journal,
  part,
  setPart,
  initData,
  initVariables,
  initSettings,
  components,
}) {
  const [page, setPage] = useState("browse");
  const [chapter, setChapter] = useState({ layout: [] });
  const [chapterId, setChapterId] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  console.log({ chapter });

  // grid widget functions
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
      x: (chapter?.layout?.length || 0 * 2) % 12,
      y: 0,
      w: 4,
      h: 10,
      minW: 2,
      minH: 5,
      maxW: 12,
      maxH: 20,
    };

    // console.log("Adding widget - new layout:", [...localLayout, newLayoutItem]);
    // setLocalWidgets([...localWidgets, newWidget]);
    // setLocalLayout([...localLayout, newLayoutItem]);
    setChapter({
      ...chapter,
      layout: [...chapter.layout, newLayoutItem],
    });
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
    // setLocalLayout(newLayout);

    setChapter({
      ...chapter,
      layout: newLayout,
    });
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

  // automatically select the first chapter in the part
  useEffect(() => {
    function initChapter() {
      let c;
      if (chapterId) {
        c = part?.vizChapters.filter((chapter) => chapter?.id === chapterId)[0];
      } else {
        c = part?.vizChapters[0];
      }
      setChapter(c);
    }
    if (part && part?.vizChapters && part?.vizChapters.length) {
      initChapter();
    }
  }, [part]);

  const selectChapter = async ({ partId, chapterId }) => {
    const currentPartId = part?.id;
    let activePart = part;
    // change the part if the ID is different
    if (currentPartId !== partId) {
      const parts = journal.vizParts.filter((part) => part?.id === partId);
      if (parts.length) {
        activePart = parts[0];
        setPart(activePart);
      }
    }
    const chapter = activePart?.vizChapters.filter(
      (chapter) => chapter?.id === chapterId
    )[0];
    setChapterId(chapterId);
    setChapter(chapter);
  };

  return (
    <ProcessManager
      user={user}
      projectId={projectId}
      studyId={studyId}
      pyodide={pyodide}
      journal={journal}
      part={part}
      initData={initData}
      initVariables={initVariables}
      initSettings={initSettings}
      components={components}
      page={page}
      setPage={setPage}
      chapter={chapter}
      selectChapter={selectChapter}
      handleLayoutChange={handleLayoutChange}
      handleWidgetSelect={handleWidgetSelect}
      handleAddWidget={handleAddWidget}
    />
  );
}
