import React from "react";

import ComponentWidget from "./Widgets/Component";
import NotesWidget from "./Widgets/Notes";

const VisualizationWidget = ({
  id,
  type,
  settings,
  isActive,
  onSelect,
  studies,
  chapter,
  user,
  projectId,
  studyId,
  pyodide,
  data,
  variables,
  section,
}) => {
  const commonProps = {
    id,
    settings,
    isActive,
    onSelect,
    studies,
    chapter,
    user,
    projectId,
    studyId,
    pyodide,
    data,
    variables,
    section,
  };

  switch (type) {
    case "component":
      return <ComponentWidget {...commonProps} />;
    case "notes":
      return <NotesWidget {...commonProps} />;
    default:
      return <p>Unsupported widget type: {type}</p>;
  }
};

export default VisualizationWidget;
